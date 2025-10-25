import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
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
        currentPlayerId: null, // 현재 턴인 플레이어 ID
        turnStartTime: null, // 턴 시작 시간
        turnTimeLimit: 30000, // 30초 (밀리초)
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
        lanes: Array(5).fill().map(() => ({ player1: null, player2: null })),
        bases: {
          player1: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) },
          player2: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) }
        }
      },
      turnStates: new Map(), // socketId -> boolean
      turnTimers: new Map(), // socketId -> timer ID
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

    // 플레이어가 룸에 있는지 확인 (playerId로 직접 검색)
    let actualPlayerId = null;
    for (const [pid, playerData] of room.players) {
      if (pid === playerId) {
        actualPlayerId = pid;
        break;
      }
    }

    if (!actualPlayerId) {
      console.error(`플레이어가 룸에 없습니다: ${playerId} in ${roomId}`);
      console.log(`현재 룸의 플레이어들:`, Array.from(room.players.keys()));
      return { turnProcessed: false, error: 'NOT_IN_ROOM' };
    }

    // 이미 턴을 종료한 플레이어인지 확인 (중복 호출 방지)
    if (room.turnStates.get(actualPlayerId) === true) {
      console.log(`플레이어 ${actualPlayerId}는 이미 턴을 종료했습니다. 중복 호출 무시.`);
      return { turnProcessed: false };
    }

    room.turnStates.set(actualPlayerId, true);
    console.log(`플레이어 턴 종료 설정: ${actualPlayerId} in ${roomId}`);

    // 현재 차례인 플레이어가 턴을 종료하면 즉시 다음 플레이어로 넘어감
    console.log('현재 차례인 플레이어가 턴을 종료했습니다. 즉시 다음 플레이어로 넘어갑니다.');
    
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

    // 서버에서 공격 처리 실행
    console.log('서버에서 공격 처리 시작');
    console.log('공격 처리 전 전장 상태:', JSON.stringify(room.battlefield, null, 2));
    this.executeServerBattles(room);
    console.log('공격 처리 후 전장 상태:', JSON.stringify(room.battlefield, null, 2));

    // 다음 플레이어로 턴 전환 (순서대로)
    const players = Array.from(room.players.keys());
    const currentPlayerIndex = players.indexOf(room.sharedGameState.currentPlayerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex];
    
    console.log(`턴 전환: ${room.sharedGameState.currentPlayerId} -> ${nextPlayerId}`);
    console.log(`플레이어 목록:`, players);
    console.log(`현재 플레이어 인덱스: ${currentPlayerIndex}, 다음 플레이어 인덱스: ${nextPlayerIndex}`);
    
    // 턴 상태 리셋 (모든 플레이어의 턴 종료 상태를 false로 설정)
    console.log('턴 상태 리셋 시작 - 현재 상태:', Array.from(room.turnStates.entries()));
    for (const [pid] of room.turnStates) {
      room.turnStates.set(pid, false);
      console.log(`플레이어 ${pid} 턴 상태 리셋됨`);
    }
    console.log('턴 상태 리셋 완료 - 리셋 후 상태:', Array.from(room.turnStates.entries()));

    // 다음 플레이어 턴 시작
    const turnStarted = this.startTurn(roomId, nextPlayerId);
    console.log(`다음 플레이어 턴 시작 결과: ${turnStarted}`);
    
    room.lastUpdated = new Date();
    return { turnProcessed: true, gameState: room.sharedGameState, battlefield: room.battlefield };
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
    console.log('전장 상태 (공격 처리 전):', JSON.stringify(room.battlefield, null, 2));
    
    if (!room.battlefield || !room.battlefield.lanes) {
      console.log('전장 데이터가 없습니다.');
      return;
    }

    if (!Array.isArray(room.battlefield.lanes) || room.battlefield.lanes.length === 0) {
      console.log('라인 데이터가 없거나 비어있습니다.');
      return;
    }

    const battleResults = [];

    // 각 라인에서 공격 처리 (플레이어 vs 컴퓨터)
    room.battlefield.lanes.forEach((lane, laneIndex) => {
      console.log(`라인 ${laneIndex} 처리:`, JSON.stringify(lane, null, 2));
      
      const playerCard = lane.player1;
      const computerCard = lane.player2;

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
        
        // 공격 결과 저장 (애니메이션용)
        const battleResult = {
          laneIndex: laneIndex,
          playerCard: { ...playerCard },
          computerCard: { ...computerCard },
          playerDamage: 0,
          computerDamage: 0,
          playerDestroyed: false,
          computerDestroyed: false
        };
        
        if (finalPlayerAttack > 0 && computerHealth > 0) {
          computerCard.hp = Math.max(0, computerHealth - finalPlayerAttack);
          battleResult.computerDamage = finalPlayerAttack;
          console.log(`${playerCard.name}이 ${computerCard.name}에게 ${finalPlayerAttack} 데미지 (상성: ${playerDamageMultiplier.toFixed(2)})`);
        }
        
        if (finalComputerAttack > 0 && playerHealth > 0) {
          playerCard.hp = Math.max(0, playerHealth - finalComputerAttack);
          battleResult.playerDamage = finalComputerAttack;
          console.log(`${computerCard.name}이 ${playerCard.name}에게 ${finalComputerAttack} 데미지 (상성: ${computerDamageMultiplier.toFixed(2)})`);
        }

        // 체력이 0 이하인 카드 제거
        if (playerCard.hp <= 0) {
          console.log(`${playerCard.name} 파괴됨`);
          battleResult.playerDestroyed = true;
          lane.player1 = null;
        }
        if (computerCard.hp <= 0) {
          console.log(`${computerCard.name} 파괴됨`);
          battleResult.computerDestroyed = true;
          lane.player2 = null;
        }

        // 공격이 발생한 경우에만 결과에 추가
        if (battleResult.playerDamage > 0 || battleResult.computerDamage > 0) {
          battleResults.push(battleResult);
        }
      } else {
        console.log(`라인 ${laneIndex}: 공격할 카드가 없음 (player: ${!!playerCard}, computer: ${!!computerCard})`);
      }
    });

    // 공격 결과를 룸에 저장 (클라이언트가 가져갈 수 있도록)
    room.lastBattleResults = battleResults;

    console.log('서버 공격 처리 완료');
    console.log('전장 상태 (공격 처리 후):', JSON.stringify(room.battlefield, null, 2));
    console.log('공격 결과:', battleResults);
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
    const room = this.getRoom(roomId);
    if (room) {
      // 모든 타이머 정리
      for (const timerId of room.turnTimers.values()) {
        clearTimeout(timerId);
      }
    }
    return this.rooms.delete(roomId);
  }

  // 턴 시작 (첫 번째 플레이어가 선공)
  startTurn(roomId, playerId) {
    console.log(`startTurn 호출: roomId=${roomId}, playerId=${playerId}`);
    const room = this.getRoom(roomId);
    if (!room) {
      console.error(`룸을 찾을 수 없습니다: ${roomId}`);
      return false;
    }

    // 이전 타이머 정리
    this.clearTurnTimer(roomId, room.sharedGameState.currentPlayerId);

    // 새 턴 시작
    room.sharedGameState.currentPlayerId = playerId;
    room.sharedGameState.turnStartTime = Date.now();
    
    console.log(`턴 시작: ${playerId} (${roomId}), 시간: ${room.sharedGameState.turnStartTime}`);

    // 20초 타이머 설정
    const timerId = setTimeout(() => {
      console.log(`타이머 만료: ${playerId}의 턴 강제 종료`);
      this.forceEndTurn(roomId, playerId);
    }, room.sharedGameState.turnTimeLimit);

    room.turnTimers.set(playerId, timerId);
    console.log(`타이머 설정 완료: ${timerId}`);
    return true;
  }

  // 턴 타이머 정리
  clearTurnTimer(roomId, playerId) {
    const room = this.getRoom(roomId);
    if (!room || !playerId) return;

    const timerId = room.turnTimers.get(playerId);
    if (timerId) {
      clearTimeout(timerId);
      room.turnTimers.delete(playerId);
    }
  }

  // 강제 턴 종료 (20초 초과)
  forceEndTurn(roomId, playerId) {
    console.log(`forceEndTurn 호출: roomId=${roomId}, playerId=${playerId}`);
    const room = this.getRoom(roomId);
    if (!room) {
      console.error(`강제 턴 종료 실패: 룸을 찾을 수 없음 - ${roomId}`);
      return { turnProcessed: false, error: 'ROOM_NOT_FOUND' };
    }

    console.log(`강제 턴 종료: ${playerId} (${roomId}) - 시간 초과`);
    
    // 턴 종료 처리
    const result = this.setPlayerTurnEnded(roomId, playerId);
    
    // 타이머 정리
    this.clearTurnTimer(roomId, playerId);
    
    console.log(`강제 턴 종료 결과:`, result);
    return result;
  }

  // 턴 시간 확인
  getTurnTimeRemaining(roomId) {
    const room = this.getRoom(roomId);
    if (!room) {
      console.log(`getTurnTimeRemaining: 룸을 찾을 수 없음 - ${roomId}`);
      return 0;
    }
    
    if (!room.sharedGameState.turnStartTime) {
      console.log(`getTurnTimeRemaining: 턴 시작 시간이 없음 - ${roomId}`);
      return 0;
    }

    const elapsed = Date.now() - room.sharedGameState.turnStartTime;
    const remaining = Math.max(0, room.sharedGameState.turnTimeLimit - elapsed);
    
    console.log(`턴 시간 확인: ${roomId}, 경과: ${elapsed}ms, 남은 시간: ${remaining}ms`);
    return remaining;
  }
}

// 플레이어 관점에서의 전장 상태 생성 함수 (고정 위치)
function createPlayerPerspectiveBattlefield(room, playerId) {
  const battlefield = room.battlefield;
  const players = Array.from(room.players.keys());
  
  // 현재 플레이어가 첫 번째 플레이어인지 확인
  const isPlayer1 = players[0] === playerId;
  
  return {
    lanes: battlefield.lanes.map(lane => {
      // 고정 위치: 내 카드는 항상 아래(player), 상대방 카드는 항상 위(computer)
      return {
        player: (isPlayer1 ? lane.player1 : lane.player2) ? { 
          ...(isPlayer1 ? lane.player1 : lane.player2), 
          owner: 'player', 
          displaySide: 'player',
          isOpponentCard: false,
          actualPlayerId: isPlayer1 ? players[0] : players[1]
        } : null,
        computer: (isPlayer1 ? lane.player2 : lane.player1) ? { 
          ...(isPlayer1 ? lane.player2 : lane.player1), 
          owner: 'computer', 
          displaySide: 'computer',
          isOpponentCard: true, 
          isFlipped: true,
          actualPlayerId: isPlayer1 ? players[1] : players[0]
        } : null
      };
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

      // 첫 번째 플레이어(호스트)의 턴 시작
      console.log(`첫 번째 플레이어 턴 시작: ${waitingPlayer.playerId} in ${roomId}`);
      const turnStarted = gameRoomManager.startTurn(roomId, waitingPlayer.playerId);
      console.log(`턴 시작 결과: ${turnStarted}`);

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
    
    console.log(`게임 상태 확인 요청: roomId=${roomId}, playerId=${playerId}`);
    
    const room = gameRoomManager.getRoom(roomId);
    console.log(`룸 조회 결과:`, room ? '찾음' : '없음');
    console.log(`현재 활성 룸들:`, Array.from(gameRoomManager.rooms.keys()));
    
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

      res.json({
        success: true,
        room: {
          roomId: roomId,
          gameState: gameStateToReturn,
          battlefield: playerBattlefield,
          bases: room.battlefield.bases,
          playerHands: playerHands,
          players: Array.from(room.players.values()),
          currentPlayerId: room.sharedGameState.currentPlayerId,
          turnTimeRemaining: gameRoomManager.getTurnTimeRemaining(roomId)
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
    console.log(`턴 종료 요청: roomId=${roomId}, playerId=${playerId}`);
    
    const room = gameRoomManager.getRoom(roomId);
    console.log(`턴 종료 - 룸 조회 결과:`, room ? '찾음' : '없음');

    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    // 플레이어 ID 사용
    const actualPlayerId = playerId || `temp_${Date.now()}`;
    
    // 현재 턴인 플레이어만 턴 종료 가능
    if (room.sharedGameState.currentPlayerId && room.sharedGameState.currentPlayerId !== actualPlayerId) {
      console.log(`턴 종료 거부: ${actualPlayerId}는 현재 턴이 아님. 현재 턴: ${room.sharedGameState.currentPlayerId}`);
      res.status(400).json({ 
        success: false,
        error: '현재 턴이 아닙니다. 상대방의 차례입니다.',
        currentPlayerId: room.sharedGameState.currentPlayerId
      });
      return;
    }
    
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

    // 전장 상태는 서버에서 관리 (클라이언트가 보낸 battlefield는 무시)
    // 클라이언트가 보낸 battlefield를 덮어쓰지 않음
    console.log('클라이언트가 보낸 battlefield 무시 (서버가 전장 상태 관리)');

    // 턴 종료 처리
    const result = gameRoomManager.setPlayerTurnEnded(roomId, actualPlayerId);

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
      res.json({
        success: true,
        message: '턴이 진행되었습니다.',
        gameState: gameStateToReturn,
        battlefield: playerBattlefield,
        turnProcessed: true
      });
    } else {
      res.json({
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

// 턴 시간 확인 API
app.get('/api/turn-time/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = gameRoomManager.getRoom(roomId);
    
    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    const timeRemaining = gameRoomManager.getTurnTimeRemaining(roomId);
    const currentPlayerId = room.sharedGameState.currentPlayerId;
    
    res.json({
      success: true,
      timeRemaining: timeRemaining,
      currentPlayerId: currentPlayerId,
      turnTimeLimit: room.sharedGameState.turnTimeLimit
    });
  } catch (error) {
    console.error('턴 시간 확인 오류:', error);
    res.status(500).json({ error: '턴 시간 확인 중 오류가 발생했습니다.' });
  }
});

// 카드 상태 확인 API
app.get('/api/cards/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = gameRoomManager.getRoom(roomId);
    
    if (!room) {
      res.status(404).json({ success: false, error: '룸을 찾을 수 없습니다.' });
      return;
    }
    
    console.log(`카드 상태 확인: ${roomId}`);
    console.log('전장 상태:', JSON.stringify(room.battlefield, null, 2));
    
    res.json({
      success: true,
      battlefield: room.battlefield,
      gameState: room.sharedGameState
    });
  } catch (error) {
    console.error('카드 상태 확인 오류:', error);
    res.status(500).json({ success: false, error: '카드 상태 확인 중 오류가 발생했습니다.' });
  }
});

// 강제 턴 종료 API
app.post('/api/force-end-turn', (req, res) => {
  try {
    const { roomId, playerId } = req.body;
    console.log(`강제 턴 종료 요청: roomId=${roomId}, playerId=${playerId}`);
    
    const room = gameRoomManager.getRoom(roomId);
    if (!room) {
      res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
      return;
    }

    // 현재 턴인 플레이어가 아닌 경우에만 강제 종료 가능
    if (room.sharedGameState.currentPlayerId === playerId) {
      res.status(400).json({ 
        success: false,
        error: '자신의 턴은 강제 종료할 수 없습니다.' 
      });
      return;
    }

    // 현재 턴인 플레이어의 턴을 강제 종료
    const currentPlayerId = room.sharedGameState.currentPlayerId;
    if (currentPlayerId) {
      console.log(`강제 턴 종료: ${currentPlayerId}의 턴을 ${playerId}가 강제 종료`);
      
      // 강제 턴 종료 처리
      const result = gameRoomManager.forceEndTurn(roomId, currentPlayerId);
      
      if (result && result.turnProcessed) {
        res.json({
          success: true,
          message: '상대방의 턴을 강제로 종료했습니다.',
          gameState: result.gameState,
          battlefield: result.battlefield
        });
      } else {
        res.json({
          success: false,
          error: '강제 턴 종료에 실패했습니다.'
        });
      }
    } else {
      res.status(400).json({ 
        success: false,
        error: '현재 턴인 플레이어가 없습니다.' 
      });
    }
  } catch (error) {
    console.error('강제 턴 종료 오류:', error);
    res.status(500).json({ error: '강제 턴 종료 중 오류가 발생했습니다.' });
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

    // 카드 배치 (플레이어 1/2 엄밀 구분, 고정 위치)
    const idx = Number.isInteger(laneIndex) ? laneIndex : 0;
    let cardData = null;
    
    if (idx >= 0 && idx < room.battlefield.lanes.length) {
      const lane = room.battlefield.lanes[idx];
      const players = Array.from(room.players.keys());
      
      // 현재 플레이어가 플레이어 1인지 확인
      const isPlayer1 = players[0] === playerId;
      const actualSide = isPlayer1 ? 'player1' : 'player2';
      
      console.log(`카드 배치 요청: 플레이어 ${playerId}, 실제 레인: ${actualSide}, 요청된 side: ${side}`);

      // 카드 정보 설정
      cardData = { ...(card || {}) };
      cardData.owner = actualSide;
      cardData.lastDamageTurn = room.sharedGameState.turnCount;
      cardData.actualPlayerId = playerId;

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

      // 올바른 플레이어 레인에 카드 배치
      lane[actualSide] = cardData;
      console.log(`카드 배치 완료: ${cardData.name} (${actualSide}, 라인 ${idx}, 플레이어: ${playerId})`);
      
      // 플레이어 손패에서 카드 제거
      if (playerId) {
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


// Socket.IO 경로 처리
app.get('/socket.io/', (req, res) => {
  res.status(404).send('Socket.IO endpoint not found');
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