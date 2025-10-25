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

  setPlayerTurnEnded(roomId, playerId) {
    const room = this.getRoom(roomId);
    if (!room) {
      console.error(`룸을 찾을 수 없습니다: ${roomId}`);
      return { turnProcessed: false, error: 'ROOM_NOT_FOUND' };
    }

    // 플레이어가 룸에 있는지 확인
    if (!room.players.has(playerId)) {
      console.error(`플레이어가 룸에 없습니다: ${playerId} in ${roomId}`);
      return { turnProcessed: false, error: 'NOT_IN_ROOM' };
    }

    room.turnStates.set(playerId, true);
    console.log(`플레이어 턴 종료 설정: ${playerId} in ${roomId}`);

    // 모든 플레이어가 턴을 종료했는지 확인
    const allPlayersEnded = Array.from(room.turnStates.values()).every(ended => ended);
    const totalPlayers = room.players.size;
    const endedPlayers = Array.from(room.turnStates.values()).filter(ended => ended).length;

    console.log(`턴 종료 상태 확인: ${endedPlayers}/${totalPlayers} 플레이어가 턴을 종료함`);

    if (allPlayersEnded && totalPlayers >= 2) {
      // 안전 증가 (NaN 방지) - 타입 안전성 강화
      const prevTC = Number.isFinite(room.sharedGameState.turnCount) ? room.sharedGameState.turnCount : 1;
      const newTurnCount = Math.max(1, prevTC + 1);
      
      if (Number.isFinite(newTurnCount)) {
        room.sharedGameState.turnCount = newTurnCount;
      } else {
        console.error('턴 카운트가 유효하지 않습니다. 기본값으로 설정합니다.');
        room.sharedGameState.turnCount = 1;
      }
      console.log(`턴 진행: ${roomId} -> 턴 ${room.sharedGameState.turnCount}`);

      // 턴 상태 토글 (플레이어 턴 ↔ 상대방 턴)
      room.sharedGameState.isPlayerTurn = !room.sharedGameState.isPlayerTurn;
      console.log(`턴 상태 변경: isPlayerTurn = ${room.sharedGameState.isPlayerTurn}`);

      // 서버에서 공격 처리 실행
      console.log('서버에서 공격 처리 시작');
      this.executeServerBattles(room);

      // 턴 상태 리셋
      for (const [pid] of room.turnStates) {
        room.turnStates.set(pid, false);
      }

      room.lastUpdated = new Date();
      return { turnProcessed: true, gameState: room.sharedGameState, battlefield: room.battlefield };
    }

    return { turnProcessed: false };
  }

  updateRoom(roomId, updateData) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    Object.assign(room, updateData);
    room.lastUpdated = new Date();
    return true;
  }

  executeServerBattles(room) {
    console.log('서버 공격 처리 시작');
    
    if (!room.battlefield || !room.battlefield.lanes) {
      console.log('전장 데이터가 없습니다.');
      return;
    }

    // 각 라인에서 공격 처리
    room.battlefield.lanes.forEach((lane, laneIndex) => {
      const playerCard = lane.player;
      const computerCard = lane.computer;

      if (playerCard && computerCard && !playerCard.isSkull && !computerCard.isSkull) {
        console.log(`라인 ${laneIndex}: ${playerCard.name} vs ${computerCard.name}`);
        
        // 타입 안전한 공격 처리
        const playerAttack = Number.isFinite(playerCard.atk) ? playerCard.atk : 0;
        const computerAttack = Number.isFinite(computerCard.atk) ? computerCard.atk : 0;
        const playerHealth = Number.isFinite(playerCard.hp) ? playerCard.hp : 0;
        const computerHealth = Number.isFinite(computerCard.hp) ? computerCard.hp : 0;
        
        // 상성 시스템 적용 (간단한 버전)
        const playerDamageMultiplier = this.calculateAffinityDamage(playerCard, computerCard);
        const computerDamageMultiplier = this.calculateAffinityDamage(computerCard, playerCard);
        
        const finalPlayerAttack = Math.floor(playerAttack * playerDamageMultiplier);
        const finalComputerAttack = Math.floor(computerAttack * computerDamageMultiplier);
        
        if (finalPlayerAttack > 0 && computerHealth > 0) {
          computerCard.hp = Math.max(0, computerHealth - finalPlayerAttack);
          console.log(`${playerCard.name}이 ${computerCard.name}에게 ${finalPlayerAttack} 데미지 (상성: ${playerDamageMultiplier.toFixed(2)})`);
        }
        
        if (finalComputerAttack > 0 && playerHealth > 0) {
          playerCard.hp = Math.max(0, playerHealth - finalComputerAttack);
          console.log(`${computerCard.name}이 ${playerCard.name}에게 ${finalComputerAttack} 데미지 (상성: ${computerDamageMultiplier.toFixed(2)})`);
        }

        // 체력이 0 이하인 카드 제거
        if (playerCard.hp <= 0) {
          console.log(`${playerCard.name} 파괴됨`);
          lane.player = null;
        }
        if (computerCard.hp <= 0) {
          console.log(`${computerCard.name} 파괴됨`);
          lane.computer = null;
        }
      }
    });

    console.log('서버 공격 처리 완료');
  }

  // 상성 시스템 (클라이언트 로직 이식)
  calculateAffinityDamage(attacker, defender) {
    let damageMultiplier = 1;
    
    if (attacker.affinities && defender.category) {
      // 강한 상성 체크
      if (attacker.affinities.strong_against && 
          attacker.affinities.strong_against.includes(defender.category)) {
        damageMultiplier *= 1.5;
      }
      
      // 약한 상성 체크
      if (attacker.affinities.weak_against && 
          attacker.affinities.weak_against.includes(defender.category)) {
        damageMultiplier *= 0.7;
      }
    }
    
    return damageMultiplier;
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

// 턴 종료 API
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
    const { roomId, gameState, battlefield, playerId } = req.body;
    const manager = getGameRoomManager();
    const room = manager.getRoom(roomId);

    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    // 플레이어 ID 사용
    const actualPlayerId = playerId || `temp_${Date.now()}`;
    
    // 게임 상태 업데이트
    if (gameState) {
      const playerGameState = room.playerGameStates.get(actualPlayerId) || {};
      const safePlayerState = { ...playerGameState, ...gameState };
      
      // fusionSystem 상태도 저장
      if (gameState.fusionSystem) {
        safePlayerState.fusionSystem = gameState.fusionSystem;
      }
      
      room.playerGameStates.set(actualPlayerId, safePlayerState);
    }

    // 전장 상태 업데이트
    if (battlefield) {
      room.battlefield = battlefield;
    }

    // 턴 종료 처리
    const result = manager.setPlayerTurnEnded(roomId, actualPlayerId);

    // 플레이어 관점에서의 전장 상태 생성
    const playerBattlefield = createPlayerPerspectiveBattlefield(room, actualPlayerId);

    // 현재 플레이어의 게임 상태 가져오기
    const currentPlayerGameState = room.playerGameStates.get(actualPlayerId) || {};
    const gameStateToReturn = { ...room.sharedGameState };
    if (currentPlayerGameState.fusionSystem) {
      gameStateToReturn.fusionSystem = currentPlayerGameState.fusionSystem;
    }
    if (currentPlayerGameState.energy !== undefined) {
      gameStateToReturn.energy = currentPlayerGameState.energy;
    }
    if (currentPlayerGameState.turnCount !== undefined) {
      gameStateToReturn.turnCount = currentPlayerGameState.turnCount;
    }
    if (currentPlayerGameState.isPlayerTurn !== undefined) {
      gameStateToReturn.isPlayerTurn = currentPlayerGameState.isPlayerTurn;
    }

    if (result.turnProcessed) {
      res.status(200).json({
        success: true,
        message: '턴이 진행되었습니다.',
        gameState: gameStateToReturn,
        battlefield: playerBattlefield,
        turnProcessed: true
      });
    } else {
      res.status(200).json({
        success: true,
        message: '턴을 종료했습니다. 상대방을 기다리는 중...',
        gameState: gameStateToReturn,
        battlefield: playerBattlefield,
        turnProcessed: false
      });
    }
  } catch (error) {
    console.error('턴 종료 오류:', error);
    res.status(500).json({ error: '턴 종료 중 오류가 발생했습니다.' });
  }
}
