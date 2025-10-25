const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' })); // JSON 페이로드 크기 제한 증가
app.use(express.urlencoded({ limit: '50mb', extended: true })); // URL 인코딩 페이로드 크기 제한 증가

// 정적 파일 서빙 설정
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (path.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
  }
}));

// 게임 룸 관리
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
      const elementsPath = path.join(__dirname, 'src', 'data', 'elements.json');
      const elementsContent = fs.readFileSync(elementsPath, 'utf8');
      this.elementsData = JSON.parse(elementsContent);
      
      // molecules.json 로드
      const moleculesPath = path.join(__dirname, 'src', 'data', 'molecules.json');
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

// 플레이어 관점에서의 전장 상태 생성 함수
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
          player: lane.player ? { ...lane.player, owner: 'player', isOpponentCard: false } : null,
          computer: lane.computer ? { ...lane.computer, owner: 'computer', isOpponentCard: true, isFlipped: true } : null
        };
      } else {
        // 두 번째 플레이어 관점:
        // - player 슬롯(하단) = 상대방 카드 (세로 반전)
        // - computer 슬롯(상단) = 내 카드
        return {
          player: lane.player ? { ...lane.player, owner: 'computer', isOpponentCard: true, isFlipped: true } : null,
          computer: lane.computer ? { ...lane.computer, owner: 'player', isOpponentCard: false } : null
        };
      }
    })
  };
}

// 게임 룸 매니저 인스턴스
const gameRoomManager = new GameRoomManager();

// 주기적인 대기 플레이어 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  const timeout = 10 * 60 * 1000; // 10분
  
  for (const [socketId, player] of gameRoomManager.waitingPlayers) {
    if (now - player.joinTime > timeout) {
      console.log(`타임아웃된 대기 플레이어 제거: ${socketId} (${player.playerName})`);
      gameRoomManager.waitingPlayers.delete(socketId);
      
      // 해당 소켓에 타임아웃 알림
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('matching-error', { error: '매칭 대기 시간이 초과되었습니다.' });
      }
    }
  }
}, 10 * 60 * 1000); // 10분마다 실행

// Express API 기반 온라인 매칭 시스템

// 정적 파일 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 정적 파일 라우트들 (순서 중요: 구체적인 것부터 일반적인 것 순서로)
app.get('/src/js/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'src', 'js', req.params.filename);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

app.get('/src/data/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'src', 'data', req.params.filename);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

app.get('/src/images/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'src', 'images', req.params.filename);
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.gif') {
    res.setHeader('Content-Type', 'image/gif');
  } else if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  } else if (ext === '.webp') {
    res.setHeader('Content-Type', 'image/webp');
  } else if (ext === '.avif') {
    res.setHeader('Content-Type', 'image/avif');
  }
  
  res.sendFile(filePath);
});

// 기타 src 하위 파일들
app.get('/src/:subfolder/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'src', req.params.subfolder, req.params.filename);
  res.sendFile(filePath);
});

// Health check 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: '서버가 정상적으로 작동 중입니다.'
  });
});

// API 엔드포인트들
app.get('/api/rooms', (req, res) => {
  try {
    const roomList = Array.from(gameRoomManager.rooms.values()).map(room => ({
      id: room.roomId,
      playerCount: room.players.size,
      maxPlayers: 2,
      isActive: room.sharedGameState.isGameActive
    }));
    res.json(roomList);
  } catch (error) {
    console.error('룸 목록 조회 오류:', error);
    res.status(500).json({ error: '룸 목록을 가져올 수 없습니다.' });
  }
});

// 매칭 시작 API
app.post('/api/start-matching', (req, res) => {
  try {
    const { playerName, playerId } = req.body;
    
    if (!playerName) {
      res.status(400).json({ error: '플레이어 이름이 필요합니다.' });
      return;
    }

    // 대기 중인 플레이어가 있는지 확인
    if (gameRoomManager.waitingPlayers.size > 0) {
      // 매칭 성공
      const waitingPlayer = gameRoomManager.waitingPlayers.values().next().value;
      const roomId = `match_${Date.now()}`;

      // 대기 목록에서 제거
      gameRoomManager.waitingPlayers.delete(waitingPlayer.playerId);

      // 룸 생성 (HTTP API용으로 수정)
      const room = gameRoomManager.createRoom(roomId, waitingPlayer.playerId, waitingPlayer.playerName);
      gameRoomManager.addPlayerToRoom(roomId, waitingPlayer.playerId, waitingPlayer.playerName);
      
      // 새로운 플레이어를 위한 플레이어 ID 생성
      const newPlayerId = playerId || `player_${Date.now()}`;
      gameRoomManager.addPlayerToRoom(roomId, newPlayerId, playerName);

      // 매칭된 룸 정보를 저장 (첫 번째 플레이어가 확인할 수 있도록)
      gameRoomManager.matchedRooms = gameRoomManager.matchedRooms || new Map();
      gameRoomManager.matchedRooms.set(waitingPlayer.playerId, {
        roomId: roomId,
        opponentName: playerName,
        isHost: true,
        matchedAt: Date.now()
      });

      res.json({
        success: true,
        waiting: false,
        roomId: roomId,
        opponentName: waitingPlayer.playerName,
        isHost: false
      });
    } else {
      // 대기 목록에 추가
      const playerIdForWaiting = playerId || `player_${Date.now()}`;
      gameRoomManager.waitingPlayers.set(playerIdForWaiting, {
        playerId: playerIdForWaiting,
        playerName: playerName,
        joinTime: Date.now()
      });

      res.json({
        success: true,
        waiting: true,
        message: '매칭을 기다리는 중입니다...',
        playerName: playerName
      });
    }
  } catch (error) {
    console.error('매칭 시작 오류:', error);
    res.status(500).json({ error: '매칭 시작 중 오류가 발생했습니다.' });
  }
});

// 매칭 취소 API
app.post('/api/cancel-matching', (req, res) => {
  try {
    const { playerId } = req.body;
    if (playerId) {
      gameRoomManager.waitingPlayers.delete(playerId);
    }
    res.json({ 
      success: true, 
      message: '매칭이 취소되었습니다.' 
    });
  } catch (error) {
    console.error('매칭 취소 오류:', error);
    res.status(500).json({ error: '매칭 취소 중 오류가 발생했습니다.' });
  }
});

// 매칭 상태 확인 API (대기 중인 플레이어용)
app.post('/api/check-matching', (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      res.status(400).json({ error: '플레이어 ID가 필요합니다.' });
      return;
    }

    // 매칭된 룸이 있는지 확인
    if (gameRoomManager.matchedRooms && gameRoomManager.matchedRooms.has(playerId)) {
      const matchInfo = gameRoomManager.matchedRooms.get(playerId);
      
      // 매칭 정보를 반환하고 삭제 (한 번만 사용)
      gameRoomManager.matchedRooms.delete(playerId);
      
      res.json({
        success: true,
        matched: true,
        roomId: matchInfo.roomId,
        opponentName: matchInfo.opponentName,
        isHost: matchInfo.isHost
      });
    } else {
      // 아직 매칭되지 않음
      res.json({
        success: true,
        matched: false,
        waiting: true
      });
    }
  } catch (error) {
    console.error('매칭 상태 확인 오류:', error);
    res.status(500).json({ error: '매칭 상태 확인 중 오류가 발생했습니다.' });
  }
});

// 게임 상태 확인 API
app.get('/api/game-status/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.query; // 플레이어 ID를 쿼리 파라미터로 받음
    const room = gameRoomManager.getRoom(roomId);
    
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

      // 플레이어 손패 상태 생성
      const playerHands = {};
      for (const [pid, playerData] of room.players) {
        const playerGameState = room.playerGameStates.get(pid) || {};
        playerHands[pid] = playerGameState.playerHand || [];
      }

      res.json({
        success: true,
        room: {
          roomId: roomId,
          gameState: room.sharedGameState,
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
});

// 턴 종료 API
app.post('/api/end-turn', (req, res) => {
  try {
    const { roomId, gameState, battlefield, playerId } = req.body;
    const room = gameRoomManager.getRoom(roomId);

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
      room.playerGameStates.set(actualPlayerId, safePlayerState);
    }

    // 전장 상태 업데이트
    if (battlefield) {
      room.battlefield = battlefield;
    }

    // 턴 종료 처리
    const result = gameRoomManager.setPlayerTurnEnded(roomId, actualPlayerId);

    // 플레이어 관점에서의 전장 상태 생성
    const playerBattlefield = createPlayerPerspectiveBattlefield(room, actualPlayerId);

    if (result.turnProcessed) {
      res.json({
        success: true,
        message: '턴이 진행되었습니다.',
        gameState: result.gameState,
        battlefield: playerBattlefield,
        turnProcessed: true
      });
    } else {
      res.json({
        success: true,
        message: '턴을 종료했습니다. 상대방을 기다리는 중...',
        gameState: room.sharedGameState,
        battlefield: playerBattlefield,
        turnProcessed: false
      });
    }
  } catch (error) {
    console.error('턴 종료 오류:', error);
    res.status(500).json({ error: '턴 종료 중 오류가 발생했습니다.' });
  }
});

// 카드 뽑기 API
app.post('/api/draw-cards', (req, res) => {
  try {
    const { roomId, playerId, cards } = req.body;
    const room = gameRoomManager.getRoom(roomId);

    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    // 플레이어 손패에 카드 추가
    if (playerId && cards && Array.isArray(cards)) {
      const playerGameState = room.playerGameStates.get(playerId) || {};
      if (!playerGameState.playerHand) {
        playerGameState.playerHand = [];
      }
      
      // 카드들을 손패에 추가
      cards.forEach(card => {
        if (card && card.id) {
          playerGameState.playerHand.push(card);
          console.log(`카드 추가: ${card.name} (${playerId})`);
        }
      });
      
      room.playerGameStates.set(playerId, playerGameState);
    }

    // 플레이어 관점에서의 전장 상태 생성
    const playerBattlefield = createPlayerPerspectiveBattlefield(room, playerId);

    // 플레이어 손패 상태 생성
    const playerHands = {};
    for (const [pid, playerData] of room.players) {
      const playerGameState = room.playerGameStates.get(pid) || {};
      playerHands[pid] = playerGameState.playerHand || [];
    }

    res.json({
      success: true,
      message: '카드를 뽑았습니다.',
      battlefield: playerBattlefield,
      playerHands: playerHands
    });
  } catch (error) {
    console.error('카드 뽑기 오류:', error);
    res.status(500).json({ error: '카드 뽑기 중 오류가 발생했습니다.' });
  }
});

// 카드 배치 API
app.post('/api/place-card', (req, res) => {
  try {
    const { roomId, card, laneIndex, side, playerId } = req.body;
    const room = gameRoomManager.getRoom(roomId);

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
            console.log(`카드 제거: ${card.name} (${playerId})`);
          }
        }
      }
    }

    // 플레이어 관점에서의 전장 상태 생성
    const playerBattlefield = createPlayerPerspectiveBattlefield(room, playerId);

    res.json({
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
});


// Vercel 환경에서는 서버를 시작하지 않음
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  // 로컬 개발 환경에서만 서버 시작
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}에서 게임을 플레이하세요.`);
  });
} else {
  // Vercel 환경에서는 API 함수로만 동작
  console.log('Vercel 환경에서 API 함수로 실행 중입니다.');
}