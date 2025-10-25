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

// 게임 룸 매니저 인스턴스 (전역으로 공유)
let gameRoomManager;

// Vercel 환경에서 함수가 처음 호출될 때 초기화
function getGameRoomManager() {
  if (!gameRoomManager) {
    gameRoomManager = new GameRoomManager();
  }
  return gameRoomManager;
}

// 룸 목록 조회 API
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
    const manager = getGameRoomManager();
    const roomList = Array.from(manager.rooms.values()).map(room => ({
      id: room.roomId,
      playerCount: room.players.size,
      maxPlayers: 2,
      isActive: room.sharedGameState.isGameActive,
      lastUpdated: room.lastUpdated
    }));
    
    res.status(200).json(roomList);
  } catch (error) {
    console.error('룸 목록 조회 오류:', error);
    res.status(500).json({ error: '룸 목록을 가져올 수 없습니다.' });
  }
}
