// 게임 룸 관리 클래스 (공유)
class GameRoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room data
    this.waitingPlayers = new Map(); // socketId -> player data
    this.elementsData = null;
    this.moleculesData = null;
    this.loadGameData();
  }

  async loadGameData() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // elements.json 로드
      const elementsPath = path.join(process.cwd(), 'src', 'data', 'elements.json');
      const elementsContent = fs.readFileSync(elementsPath, 'utf8');
      this.elementsData = JSON.parse(elementsContent);
      
      // molecules.json 로드
      const moleculesPath = path.join(process.cwd(), 'src', 'data', 'molecules.json');
      const moleculesContent = fs.readFileSync(moleculesPath, 'utf8');
      this.moleculesData = JSON.parse(moleculesContent);
      
      console.log(`게임 데이터 로드 완료: 원소 ${this.elementsData.length}개, 분자 ${this.moleculesData.length}개`);
    } catch (error) {
      console.error('게임 데이터 로드 실패:', error);
    }
  }

  createRoom(roomId, hostSocketId, hostName) {
    const room = {
      roomId: roomId,
      hostId: hostSocketId,
      players: new Map(), // socketId -> player data
      playerGameStates: new Map(), // socketId -> individual game state
      sharedGameState: {
        isGameActive: true,
        turnCount: 1,
        isPlayerTurn: true,
        elementsData: this.elementsData || [],
        moleculesData: this.moleculesData || [],
        reactionsData: [],
        effectsData: [],
        upgrades: {
          elements: {},
          molecules: {}
        },
        baseDrawCost: 1,
        baseCardCount: 4,
        costMultiplier: 1.15,
        cardCountMultiplier: 1.1,
        fusionSystem: null,
        difficulty: 'normal',
        rarityChances: {
          basic: { common: 80, uncommon: 18, rare: 2, epic: 0, legendary: 0 },
          premium: { common: 30, uncommon: 45, rare: 20, epic: 5, legendary: 0 },
          legend: { common: 0, uncommon: 5, rare: 45, epic: 35, legendary: 15 }
        }
      },
      battlefield: {
        lanes: Array(5).fill().map(() => ({ player: null, computer: null })),
        bases: {
          player: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) },
          computer: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) }
        }
      },
      turnStates: new Map(), // socketId -> boolean
      lastUpdated: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  addPlayerToRoom(roomId, socketId, playerName) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const player = {
      socketId: socketId,
      name: playerName,
      isHost: socketId === room.hostId
    };

    room.players.set(socketId, player);
    room.turnStates.set(socketId, false);

    // 개별 플레이어 게임 상태 초기화
    room.playerGameStates.set(socketId, {
      playerScore: 0,
      computerScore: 0,
      playerHand: [],
      computerHand: [],
      selectedCardId: null,
      playerCoins: 20,
      computerCoins: 20,
      drawCount: 0
    });

    return true;
  }

  removePlayerFromRoom(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    room.players.delete(socketId);
    room.turnStates.delete(socketId);
    room.playerGameStates.delete(socketId);

    // 호스트가 나간 경우 새로운 호스트 지정
    if (socketId === room.hostId && room.players.size > 0) {
      const newHost = room.players.values().next().value;
      room.hostId = newHost.socketId;
      newHost.isHost = true;
    }

    return true;
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }
}

// 플레이어 관점에서의 전장 상태 생성 함수 (개선된 버전)
function createPlayerPerspectiveBattlefield(room, playerId) {
  const battlefield = room.battlefield;
  const players = Array.from(room.players.keys());
  
  // 현재 플레이어가 첫 번째 플레이어인지 확인
  const isFirstPlayer = players[0] === playerId;
  
  return {
    lanes: battlefield.lanes.map(lane => {
      if (isFirstPlayer) {
        // 첫 번째 플레이어 관점: 
        // - player 슬롯(하단) = 내 카드
        // - computer 슬롯(상단) = 상대방 카드
        return {
          player: lane.player ? { 
            ...lane.player, 
            owner: 'player', 
            displaySide: 'player',
            isOpponentCard: false 
          } : null,
          computer: lane.computer ? { 
            ...lane.computer, 
            owner: 'computer', 
            displaySide: 'computer',
            isOpponentCard: true, 
            isFlipped: true 
          } : null
        };
      } else {
        // 두 번째 플레이어 관점:
        // - player 슬롯(하단) = 상대방 카드 (세로 반전)
        // - computer 슬롯(상단) = 내 카드
        return {
          player: lane.player ? { 
            ...lane.player, 
            owner: 'computer', 
            displaySide: 'player',
            isOpponentCard: true, 
            isFlipped: true 
          } : null,
          computer: lane.computer ? { 
            ...lane.computer, 
            owner: 'player', 
            displaySide: 'computer',
            isOpponentCard: false 
          } : null
        };
      }
    })
  };
}

// 게임 룸 매니저 인스턴스 (전역으로 공유)
let gameRoomManager;

// Vercel 환경에서 함수가 처음 호출될 때 초기화
function getGameRoomManager() {
  if (!gameRoomManager) {
    gameRoomManager = new GameRoomManager();
  }
  return gameRoomManager;
}

// 카드 배치 API
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { roomId, card, laneIndex, side, playerId } = req.body;
    const manager = getGameRoomManager();
    const room = manager.getRoom(roomId);

    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    // 카드 배치
    const idx = Number.isInteger(laneIndex) ? laneIndex : 0;
    let cardData = null;
    
    if (idx >= 0 && idx < room.battlefield.lanes.length) {
      const lane = room.battlefield.lanes[idx];

      // 카드 정보 설정
      cardData = { ...(card || {}) };
      cardData.owner = side || 'player';
      cardData.lastDamageTurn = room.sharedGameState.turnCount;
      
      // 상대방 관점에서의 side 설정
      cardData.opponentSide = side === 'player' ? 'computer' : 'player';

      if (cardData.element) {
        cardData.name = cardData.element.name;
      } else if (!cardData.name) {
        cardData.name = '알 수 없는 카드';
      }

      // 카드 ID가 없으면 새로 생성
      if (!cardData.id) {
        cardData.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      if (!cardData.type) {
        cardData.type = 'element';
      }

      // 올바른 side로 카드 배치
      lane[side] = cardData;
      console.log(`카드 배치 완료: ${cardData.name} (${side}, 라인 ${idx})`);
      
      // 플레이어 손패에서 카드 제거
      if (side === 'player' && playerId) {
        const playerGameState = room.playerGameStates.get(playerId) || {};
        if (playerGameState.playerHand) {
          const cardIndex = playerGameState.playerHand.findIndex(c => c.id === card.id);
          if (cardIndex !== -1) {
            playerGameState.playerHand.splice(cardIndex, 1);
            room.playerGameStates.set(playerId, playerGameState);
            console.log(`서버에서 카드 제거: ${card.name} (${playerId})`);
          } else {
            console.log(`서버에서 카드를 찾을 수 없음: ${card.name} (${playerId})`);
            console.log(`현재 손패:`, playerGameState.playerHand.map(c => c.name));
          }
        }
      }
    }

    // 플레이어 관점에서의 전장 상태 생성
    const playerBattlefield = createPlayerPerspectiveBattlefield(room, playerId);

    res.status(200).json({
      success: true,
      message: '카드가 배치되었습니다.',
      battlefield: playerBattlefield,
      card: cardData,
      laneIndex: idx
    });
  } catch (error) {
    console.error('카드 배치 오류:', error);
    res.status(500).json({ error: '카드 배치 중 오류가 발생했습니다.' });
  }
}
