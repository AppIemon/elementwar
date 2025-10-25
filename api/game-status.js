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

// 게임 상태 확인 API
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

  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { roomId } = req.query;
    const { playerId } = req.query; // 플레이어 ID를 쿼리 파라미터로 받음
    const manager = getGameRoomManager();
    const room = manager.getRoom(roomId);
    
    if (!roomId) {
      res.status(400).json({ error: '룸 ID가 필요합니다.' });
      return;
    }
    
    if (room) {
      // 플레이어 ID가 제공된 경우 해당 플레이어의 관점으로 전장 상태 생성
      let playerBattlefield;
      if (playerId) {
        playerBattlefield = createPlayerPerspectiveBattlefield(room, playerId);
      } else {
        // 플레이어 ID가 없는 경우 기본 관점 (첫 번째 플레이어 기준)
        const firstPlayerId = room.players.keys().next().value;
        playerBattlefield = createPlayerPerspectiveBattlefield(room, firstPlayerId);
      }

      // 플레이어 손패 상태 및 fusionSystem 상태 생성
      const playerHands = {};
      let currentPlayerGameState = null;
      
      for (const [pid, playerData] of room.players) {
        const playerGameState = room.playerGameStates.get(pid) || {};
        playerHands[pid] = playerGameState.playerHand || [];
        
        // 현재 플레이어의 게임 상태 저장
        if (playerId && pid === playerId) {
          currentPlayerGameState = playerGameState;
        }
      }

      // 현재 플레이어의 게임 상태를 gameState에 포함
      const gameStateToReturn = { ...room.sharedGameState };
      if (currentPlayerGameState) {
        gameStateToReturn.fusionSystem = currentPlayerGameState.fusionSystem || null;
        gameStateToReturn.energy = currentPlayerGameState.energy || gameStateToReturn.energy;
        gameStateToReturn.turnCount = currentPlayerGameState.turnCount || gameStateToReturn.turnCount;
        gameStateToReturn.isPlayerTurn = currentPlayerGameState.isPlayerTurn !== undefined ? currentPlayerGameState.isPlayerTurn : gameStateToReturn.isPlayerTurn;
      }

      res.status(200).json({
        success: true,
        room: {
          roomId: roomId,
          gameState: gameStateToReturn,
          battlefield: playerBattlefield,
          bases: room.battlefield.bases,
          playerHands: playerHands,
          players: Array.from(room.players.values())
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: '게임을 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('게임 상태 확인 오류:', error);
    res.status(500).json({ error: '게임 상태 확인 중 오류가 발생했습니다.' });
  }
}
