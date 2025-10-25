const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO 설정
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

  setPlayerTurnEnded(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) {
      console.error(`룸을 찾을 수 없습니다: ${roomId}`);
      return { turnProcessed: false, error: 'ROOM_NOT_FOUND' };
    }

    // 플레이어가 룸에 있는지 확인
    if (!room.players.has(socketId)) {
      console.error(`플레이어가 룸에 없습니다: ${socketId} in ${roomId}`);
      return { turnProcessed: false, error: 'NOT_IN_ROOM' };
    }

    room.turnStates.set(socketId, true);
    console.log(`플레이어 턴 종료 설정: ${socketId} in ${roomId}`);

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
      for (const [sid] of room.turnStates) {
        room.turnStates.set(sid, false);
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
        const playerAttack = Number.isFinite(playerCard.attack) ? playerCard.attack : 0;
        const computerAttack = Number.isFinite(computerCard.attack) ? computerCard.attack : 0;
        const playerHealth = Number.isFinite(playerCard.health) ? playerCard.health : 0;
        const computerHealth = Number.isFinite(computerCard.health) ? computerCard.health : 0;
        
        // 상성 시스템 적용 (간단한 버전)
        const playerDamageMultiplier = this.calculateAffinityDamage(playerCard, computerCard);
        const computerDamageMultiplier = this.calculateAffinityDamage(computerCard, playerCard);
        
        const finalPlayerAttack = Math.floor(playerAttack * playerDamageMultiplier);
        const finalComputerAttack = Math.floor(computerAttack * computerDamageMultiplier);
        
        if (finalPlayerAttack > 0 && computerHealth > 0) {
          computerCard.health = Math.max(0, computerHealth - finalPlayerAttack);
          console.log(`${playerCard.name}이 ${computerCard.name}에게 ${finalPlayerAttack} 데미지 (상성: ${playerDamageMultiplier.toFixed(2)})`);
        }
        
        if (finalComputerAttack > 0 && playerHealth > 0) {
          playerCard.health = Math.max(0, playerHealth - finalComputerAttack);
          console.log(`${computerCard.name}이 ${playerCard.name}에게 ${finalComputerAttack} 데미지 (상성: ${computerDamageMultiplier.toFixed(2)})`);
        }

        // 체력이 0 이하인 카드 제거
        if (playerCard.health <= 0) {
          console.log(`${playerCard.name} 파괴됨`);
          lane.player = null;
        }
        if (computerCard.health <= 0) {
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

// Socket.IO 이벤트 처리
io.on('connection', (socket) => {
  console.log(`플레이어 연결: ${socket.id}`);

  // 매칭 시작
  socket.on('start-matching', (data = {}) => {
    const { playerName } = data;
    if (!playerName) {
      socket.emit('matching-error', { error: '플레이어 이름이 필요합니다.' });
      return;
    }

    // 대기 중인 플레이어가 있는지 확인
    if (gameRoomManager.waitingPlayers.size > 0) {
      // 매칭 성공
      const waitingPlayer = gameRoomManager.waitingPlayers.values().next().value;

      // 상대가 이미 끊겼으면 무시하고 자기 자신을 대기열로
      const waitingSock = io.sockets.sockets.get(waitingPlayer.socketId);
      if (!waitingSock) {
        console.log(`대기 중인 플레이어 연결 끊김 감지: ${waitingPlayer.socketId}`);
        gameRoomManager.waitingPlayers.delete(waitingPlayer.socketId);
        
        // 새로운 플레이어를 대기열에 추가
        gameRoomManager.waitingPlayers.set(socket.id, {
          socketId: socket.id,
          playerName: playerName,
          joinTime: Date.now()
        });
        socket.emit('matching-waiting', { message: '매칭을 기다리는 중입니다...' });
        console.log(`플레이어 대기 중: ${playerName} (${socket.id})`);
        return;
      }

      const roomId = `match_${Date.now()}`;

      // 대기 목록에서 제거
      gameRoomManager.waitingPlayers.delete(waitingPlayer.socketId);

      // 룸 생성
      const room = gameRoomManager.createRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
      gameRoomManager.addPlayerToRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
      gameRoomManager.addPlayerToRoom(roomId, socket.id, playerName);

      // 두 플레이어에게 매칭 완료 알림
      io.to(waitingPlayer.socketId).emit('match-found', {
        roomId: roomId,
        opponentName: playerName,
        isHost: true
      });

      socket.emit('match-found', {
        roomId: roomId,
        opponentName: waitingPlayer.playerName,
        isHost: false
      });

      console.log(`매칭 완료: ${waitingPlayer.playerName} vs ${playerName} (룸: ${roomId})`);
    } else {
      // 대기 목록에 추가
      gameRoomManager.waitingPlayers.set(socket.id, {
        socketId: socket.id,
        playerName: playerName,
        joinTime: Date.now()
      });

      socket.emit('matching-waiting', {
        message: '매칭을 기다리는 중입니다...'
      });

      console.log(`플레이어 대기 중: ${playerName} (${socket.id})`);
    }
  });

  // 매칭 취소
  socket.on('cancel-matching', () => {
    gameRoomManager.waitingPlayers.delete(socket.id);
    socket.emit('matching-cancelled');
    console.log(`매칭 취소: ${socket.id}`);
  });

  // 게임 시작
  socket.on('start-game', (data = {}) => {
    const { roomId } = data;
    const room = gameRoomManager.getRoom(roomId);

    if (!room) {
      socket.emit('game-error', { error: '게임을 찾을 수 없습니다.' });
      return;
    }

    if (!room.players.has(socket.id)) {
      socket.emit('game-error', { error: '해당 룸 참가자가 아닙니다.' });
      return;
    }

    // 턴 상태 초기화
    for (const [sid] of room.turnStates) {
      room.turnStates.set(sid, false);
    }

    console.log(`게임 시작: ${roomId}, 플레이어 수: ${room.players.size}`);

    // 모든 플레이어에게 게임 시작 알림
    room.players.forEach((player, playerSocketId) => {
      const playerGameState = room.playerGameStates.get(playerSocketId) || {};
      const combinedGameState = { ...room.sharedGameState, ...playerGameState };
      
      io.to(playerSocketId).emit('game-started', {
        roomId: roomId,
        gameState: combinedGameState,
        battlefield: room.battlefield,
        players: Array.from(room.players.values())
      });
    });
  });

  // 턴 종료
  socket.on('end-turn', (data = {}) => {
    const { roomId, gameState, battlefield } = data;
    const room = gameRoomManager.getRoom(roomId);

    if (!room) {
      socket.emit('game-error', { error: '게임을 찾을 수 없습니다.' });
      return;
    }
    if (!room.players.has(socket.id)) {
      socket.emit('game-error', { error: '해당 룸 참가자가 아닙니다.' });
      return;
    }

    console.log(`턴 종료 요청: ${socket.id} in room ${roomId}`);

    // === 클라 입력 안전 병합 (서버 권위 필드 보호) ===
    const prevPlayerState = room.playerGameStates.get(socket.id) || {};
    const safePlayerState = { ...prevPlayerState, ...(gameState || {}) };
    
    // 서버가 권위 갖는 필드 보호
    const prevShared = room.sharedGameState || {};
    safePlayerState.turnCount = prevShared.turnCount;
    safePlayerState.isGameActive = typeof prevShared.isGameActive === 'boolean' ? prevShared.isGameActive : true;

    const nextBattlefield = (typeof battlefield !== 'undefined') ? battlefield : room.battlefield;

    // 개별 플레이어 게임 상태 업데이트
    room.playerGameStates.set(socket.id, safePlayerState);
    
    // 전장 상태 업데이트
    gameRoomManager.updateRoom(roomId, {
      battlefield: nextBattlefield
    });

    // 턴 종료 처리
    const result = gameRoomManager.setPlayerTurnEnded(roomId, socket.id);

    console.log(`턴 종료 처리 결과:`, {
      roomId: roomId,
      socketId: socket.id,
      turnProcessed: !!result && !!result.turnProcessed,
      error: result && result.error,
      turnStates: Array.from(room.turnStates.entries())
    });

    if (!result || result.error) {
      socket.emit('game-error', { error: result?.error || 'END_TURN_FAILED' });
      return;
    }

    if (result.turnProcessed) {
      // 모든 플레이어에게 턴 진행 알림 (개별 게임 상태 포함)
      room.players.forEach((player, playerSocketId) => {
        const playerGameState = room.playerGameStates.get(playerSocketId) || {};
        const combinedGameState = { ...room.sharedGameState, ...playerGameState };
        
        io.to(playerSocketId).emit('turn-processed', {
          gameState: combinedGameState,
          battlefield: result.battlefield,
          turnCount: room.sharedGameState.turnCount
        });
      });
      console.log(`턴 진행 완료: ${roomId}`);
    } else {
      // 턴 종료 확인만 전송 (동시 턴 모드에서는 대기하지 않음)
      socket.emit('turn-ended', {
        message: '턴을 종료했습니다. 다음 턴을 진행하세요.',
        waitingForPlayers: 0
      });
      console.log(`턴 종료 완료: ${roomId}`);
    }
  });

  // 카드 배치
  socket.on('place-card', (data = {}) => {
    const { roomId, card, laneIndex, side } = data;
    const room = gameRoomManager.getRoom(roomId);

    if (!room) {
      socket.emit('game-error', { error: '게임을 찾을 수 없습니다.' });
      return;
    }
    if (!room.players.has(socket.id)) {
      socket.emit('game-error', { error: '해당 룸 참가자가 아닙니다.' });
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

      if (cardData.element) {
        cardData.name = cardData.element.name;
      } else if (!cardData.name) {
        cardData.name = '알 수 없는 카드';
      }

      if (!cardData.id) {
        // UUID를 사용한 유일한 카드 ID 생성
        try {
          cardData.id = `card_${crypto.randomUUID()}`;
        } catch (error) {
          // crypto.randomUUID()가 지원되지 않는 경우 폴백
          cardData.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${socket.id.substr(0, 8)}`;
        }
      }

      if (!cardData.type) {
        cardData.type = 'element';
      }

      lane[cardData.owner] = cardData;
    }

    // 전장 상태 업데이트
    gameRoomManager.updateRoom(roomId, {
      battlefield: room.battlefield
    });

    // 모든 플레이어에게 카드 배치 알림
    room.players.forEach((player, playerSocketId) => {
      // 카드 소유권은 실제 배치한 플레이어로 고정
      const actualOwner = side || 'player';
      
      // 각 플레이어의 관점에서 side 값 설정
      // - 카드를 배치한 플레이어: 자신의 카드는 'player'로 표시
      // - 상대방 플레이어: 상대방의 카드는 'computer'로 표시
      const isCardOwner = playerSocketId === socket.id;
      const displaySide = isCardOwner ? 'player' : 'computer';
      
      // 카드 데이터 복사하여 각 플레이어에게 전송
      const cardForPlayer = { ...cardData };
      cardForPlayer.owner = actualOwner; // 실제 소유자는 변경하지 않음
      
      io.to(playerSocketId).emit('card-placed', {
        battlefield: room.battlefield,
        card: cardForPlayer,
        laneIndex: idx,
        side: displaySide
      });
    });
  });

  // 게임 상태 확인
  socket.on('check-game-status', (data = {}) => {
    const { roomId } = data;
    console.log(`게임 상태 확인 요청: ${socket.id} for room ${roomId}`);
    
    if (!roomId) {
      socket.emit('game-status-error', { error: '룸 ID가 필요합니다.' });
      return;
    }
    
    const room = gameRoomManager.getRoom(roomId);
    if (room) {
      // 플레이어가 룸에 있는지 확인
      if (room.players.has(socket.id)) {
        const playerGameState = room.playerGameStates.get(socket.id) || {};
        const combinedGameState = { ...room.sharedGameState, ...playerGameState };
        
        socket.emit('game-status-response', {
          exists: true,
          gameState: combinedGameState,
          battlefield: room.battlefield,
          roomId: roomId
        });
        console.log(`게임 상태 응답 전송: ${roomId}`);
      } else {
        socket.emit('game-status-response', {
          exists: false,
          error: '해당 룸의 참가자가 아닙니다.'
        });
        console.log(`게임 상태 응답: 룸 참가자가 아님 - ${roomId}`);
      }
    } else {
      socket.emit('game-status-response', {
        exists: false,
        error: '게임을 찾을 수 없습니다.'
      });
      console.log(`게임 상태 응답: 룸 없음 - ${roomId}`);
    }
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log(`플레이어 연결 해제: ${socket.id}`);

    // 대기 목록에서 제거
    gameRoomManager.waitingPlayers.delete(socket.id);

    // 참여 중인 룸에서 제거
    for (const [roomId, room] of gameRoomManager.rooms) {
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);

        // 턴 상태에서 제거
        room.turnStates.delete(socket.id);

        // 남은 플레이어가 있고 모든 플레이어가 턴을 종료했다면 턴 진행
        if (room.players.size > 1) {
          const remainingPlayers = Array.from(room.turnStates.keys());
          const allRemainingEnded = remainingPlayers.length > 0 &&
            remainingPlayers.every(sid => room.turnStates.get(sid));

          if (allRemainingEnded) {
            // 타입 안전성 강화 - 턴 카운트 증가
            const prevTC = Number.isFinite(room.sharedGameState.turnCount) ? room.sharedGameState.turnCount : 1;
            const newTurnCount = Math.max(1, prevTC + 1);
            
            if (Number.isFinite(newTurnCount)) {
              room.sharedGameState.turnCount = newTurnCount;
            } else {
              console.error('턴 카운트가 유효하지 않습니다. 기본값으로 설정합니다.');
              room.sharedGameState.turnCount = 1;
            }

            // 턴 상태 리셋
            for (const [sid] of room.turnStates) {
              room.turnStates.set(sid, false);
            }

            // 남은 플레이어들에게 턴 진행 알림
            room.players.forEach((otherPlayer, otherSocketId) => {
              if (otherSocketId !== socket.id) {
                const playerGameState = room.playerGameStates.get(otherSocketId) || {};
                const combinedGameState = { ...room.sharedGameState, ...playerGameState };
                
                io.to(otherSocketId).emit('turn-processed', {
                  gameState: combinedGameState,
                  battlefield: room.battlefield,
                  turnCount: room.sharedGameState.turnCount
                });
              }
            });
          }
        }

        gameRoomManager.removePlayerFromRoom(roomId, socket.id);

        // 다른 플레이어에게 플레이어 나감 알림
        room.players.forEach((otherPlayer, otherSocketId) => {
          io.to(otherSocketId).emit('player-left', {
            playerName: player.name,
            message: `${player.name}님이 게임을 떠났습니다.`
          });
        });

        // 룸이 비었으면 삭제
        if (room.players.size === 0) {
          gameRoomManager.deleteRoom(roomId);
        }
        break;
      }
    }
  });
});

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
      gameRoomManager.waitingPlayers.delete(waitingPlayer.socketId);

      // 룸 생성
      const room = gameRoomManager.createRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
      gameRoomManager.addPlayerToRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
      
      // 새로운 플레이어를 위한 임시 소켓 ID 생성
      const newSocketId = playerId || `temp_${Date.now()}`;
      gameRoomManager.addPlayerToRoom(roomId, newSocketId, playerName);

      // 매칭된 룸 정보를 저장 (첫 번째 플레이어가 확인할 수 있도록)
      gameRoomManager.matchedRooms = gameRoomManager.matchedRooms || new Map();
      gameRoomManager.matchedRooms.set(waitingPlayer.socketId, {
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
      const socketId = playerId || `temp_${Date.now()}`;
      gameRoomManager.waitingPlayers.set(socketId, {
        socketId: socketId,
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
    const room = gameRoomManager.getRoom(roomId);
    
    if (room) {
      res.json({
        success: true,
        room: {
          roomId: roomId,
          gameState: room.sharedGameState,
          battlefield: room.battlefield,
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

    // 플레이어 ID로 소켓 ID 찾기 (임시 구현)
    const socketId = playerId || `temp_${Date.now()}`;
    
    // 게임 상태 업데이트
    if (gameState) {
      const playerGameState = room.playerGameStates.get(socketId) || {};
      const safePlayerState = { ...playerGameState, ...gameState };
      room.playerGameStates.set(socketId, safePlayerState);
    }

    // 전장 상태 업데이트
    if (battlefield) {
      room.battlefield = battlefield;
    }

    res.json({
      success: true,
      message: '턴이 종료되었습니다.',
      gameState: room.sharedGameState,
      battlefield: room.battlefield
    });
  } catch (error) {
    console.error('턴 종료 오류:', error);
    res.status(500).json({ error: '턴 종료 중 오류가 발생했습니다.' });
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

      if (cardData.element) {
        cardData.name = cardData.element.name;
      } else if (!cardData.name) {
        cardData.name = '알 수 없는 카드';
      }

      if (!cardData.id) {
        cardData.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      if (!cardData.type) {
        cardData.type = 'element';
      }

      lane[cardData.owner] = cardData;
    }

    res.json({
      success: true,
      message: '카드가 배치되었습니다.',
      battlefield: room.battlefield,
      card: cardData,
      laneIndex: idx
    });
  } catch (error) {
    console.error('카드 배치 오류:', error);
    res.status(500).json({ error: '카드 배치 중 오류가 발생했습니다.' });
  }
});

// Socket API 엔드포인트 (폴링 기반)
app.post('/api/socket', (req, res) => {
  try {
    const { event, payload } = req.body;
    
    if (!event) {
      res.status(400).json({ error: '이벤트가 필요합니다.' });
      return;
    }

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    switch (event) {
      case 'start-matching':
        handleStartMatchingAPI(payload, res);
        break;
      case 'cancel-matching':
        handleCancelMatchingAPI(payload, res);
        break;
      case 'start-game':
        handleStartGameAPI(payload, res);
        break;
      case 'end-turn':
        handleEndTurnAPI(payload, res);
        break;
      case 'place-card':
        handlePlaceCardAPI(payload, res);
        break;
      case 'check-game-status':
        handleCheckGameStatusAPI(payload, res);
        break;
      default:
        res.status(400).json({ error: '알 수 없는 이벤트입니다.' });
    }
  } catch (error) {
    console.error('Socket API 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// API 핸들러 함수들
function handleStartMatchingAPI(payload, res) {
  const { playerName, socketId } = payload;
  
  if (!playerName) {
    res.json({ event: 'matching-error', data: { error: '플레이어 이름이 필요합니다.' } });
    return;
  }

  // 대기 중인 플레이어가 있는지 확인
  if (gameRoomManager.waitingPlayers.size > 0) {
    const waitingPlayer = gameRoomManager.waitingPlayers.values().next().value;
    const roomId = `match_${Date.now()}`;

    // 대기 목록에서 제거
    gameRoomManager.waitingPlayers.delete(waitingPlayer.socketId);

    // 룸 생성
    const room = gameRoomManager.createRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
    gameRoomManager.addPlayerToRoom(roomId, waitingPlayer.socketId, waitingPlayer.playerName);
    gameRoomManager.addPlayerToRoom(roomId, socketId, playerName);

    res.json({
      event: 'match-found',
      data: {
        roomId: roomId,
        opponentName: waitingPlayer.playerName,
        isHost: false
      }
    });
  } else {
    // 대기 목록에 추가
    gameRoomManager.waitingPlayers.set(socketId, {
      socketId: socketId,
      playerName: playerName,
      joinTime: Date.now()
    });

    res.json({
      event: 'matching-waiting',
      data: { message: '매칭을 기다리는 중입니다...' }
    });
  }
}

function handleCancelMatchingAPI(payload, res) {
  const { socketId } = payload;
  gameRoomManager.waitingPlayers.delete(socketId);
  res.json({ event: 'matching-cancelled', data: {} });
}

function handleStartGameAPI(payload, res) {
  const { roomId, socketId } = payload;
  const room = gameRoomManager.getRoom(roomId);

  if (!room) {
    res.json({ event: 'game-error', data: { error: '게임을 찾을 수 없습니다.' } });
    return;
  }

  if (!room.players.has(socketId)) {
    res.json({ event: 'game-error', data: { error: '해당 룸 참가자가 아닙니다.' } });
    return;
  }

  // 턴 상태 초기화
  for (const [sid] of room.turnStates) {
    room.turnStates.set(sid, false);
  }

  const playerGameState = room.playerGameStates.get(socketId) || {};
  const combinedGameState = { ...room.sharedGameState, ...playerGameState };
  
  // elementsData와 moleculesData가 없으면 서버에서 로드한 데이터로 채우기
  if (!combinedGameState.elementsData || combinedGameState.elementsData.length === 0) {
    combinedGameState.elementsData = gameRoomManager.elementsData || [];
  }
  if (!combinedGameState.moleculesData || combinedGameState.moleculesData.length === 0) {
    combinedGameState.moleculesData = gameRoomManager.moleculesData || [];
  }

  res.json({
    event: 'game-started',
    data: {
      roomId: roomId,
      gameState: combinedGameState,
      battlefield: room.battlefield,
      players: Array.from(room.players.values())
    }
  });
}

function handleEndTurnAPI(payload, res) {
  const { roomId, gameState, battlefield, socketId } = payload;
  const room = gameRoomManager.getRoom(roomId);

  if (!room) {
    res.json({ event: 'game-error', data: { error: '게임을 찾을 수 없습니다.' } });
    return;
  }
  if (!room.players.has(socketId)) {
    res.json({ event: 'game-error', data: { error: '해당 룸 참가자가 아닙니다.' } });
    return;
  }

  // === 클라 입력 안전 병합 (서버 권위 필드 보호) ===
  const prevPlayerState = room.playerGameStates.get(socketId) || {};
  const safePlayerState = { ...prevPlayerState, ...(gameState || {}) };
  
  // 서버가 권위 갖는 필드 보호
  const prevShared = room.sharedGameState || {};
  safePlayerState.turnCount = prevShared.turnCount;
  safePlayerState.isGameActive = typeof prevShared.isGameActive === 'boolean' ? prevShared.isGameActive : true;

  // 손패 정보 보존 (클라이언트에서 전송된 경우에만 업데이트)
  if (gameState && gameState.playerHand && Array.isArray(gameState.playerHand)) {
    safePlayerState.playerHand = gameState.playerHand;
  }
  if (gameState && gameState.computerHand && Array.isArray(gameState.computerHand)) {
    safePlayerState.computerHand = gameState.computerHand;
  }

  const nextBattlefield = (typeof battlefield !== 'undefined') ? battlefield : room.battlefield;

  // 개별 플레이어 게임 상태 업데이트
  room.playerGameStates.set(socketId, safePlayerState);
  
  // 전장 상태 업데이트
  gameRoomManager.updateRoom(roomId, {
    battlefield: nextBattlefield
  });

  // 턴 종료 처리
  const result = gameRoomManager.setPlayerTurnEnded(roomId, socketId);

  if (!result || result.error) {
    res.json({ event: 'game-error', data: { error: result?.error || 'END_TURN_FAILED' } });
    return;
  }

  if (result.turnProcessed) {
    const playerGameState = room.playerGameStates.get(socketId) || {};
    const combinedGameState = { ...room.sharedGameState, ...playerGameState };
    
    // elementsData와 moleculesData가 없으면 서버에서 로드한 데이터로 채우기
    if (!combinedGameState.elementsData || combinedGameState.elementsData.length === 0) {
      combinedGameState.elementsData = gameRoomManager.elementsData || [];
    }
    if (!combinedGameState.moleculesData || combinedGameState.moleculesData.length === 0) {
      combinedGameState.moleculesData = gameRoomManager.moleculesData || [];
    }
    
    res.json({
      event: 'turn-processed',
      data: {
        gameState: combinedGameState,
        battlefield: result.battlefield,
        turnCount: room.sharedGameState.turnCount
      }
    });
  } else {
    res.json({
      event: 'turn-ended',
      data: {
        message: '턴을 종료했습니다. 다음 턴을 진행하세요.',
        waitingForPlayers: 0
      }
    });
  }
}

function handlePlaceCardAPI(payload, res) {
  const { roomId, card, laneIndex, side, socketId } = payload;
  const room = gameRoomManager.getRoom(roomId);

  if (!room) {
    res.json({ event: 'game-error', data: { error: '게임을 찾을 수 없습니다.' } });
    return;
  }
  if (!room.players.has(socketId)) {
    res.json({ event: 'game-error', data: { error: '해당 룸 참가자가 아닙니다.' } });
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

    if (cardData.element) {
      cardData.name = cardData.element.name;
    } else if (!cardData.name) {
      cardData.name = '알 수 없는 카드';
    }

    if (!cardData.id) {
      // UUID를 사용한 유일한 카드 ID 생성
      try {
        cardData.id = `card_${crypto.randomUUID()}`;
      } catch (error) {
        // crypto.randomUUID()가 지원되지 않는 경우 폴백
        cardData.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${socketId.substr(0, 8)}`;
      }
    }

    if (!cardData.type) {
      cardData.type = 'element';
    }

    lane[cardData.owner] = cardData;
  }

  // 전장 상태 업데이트
  gameRoomManager.updateRoom(roomId, {
    battlefield: room.battlefield
  });

  res.json({
    event: 'card-placed',
    data: {
      battlefield: room.battlefield,
      card: cardData,
      laneIndex: idx,
      side: side || 'player'
    }
  });
}

function handleCheckGameStatusAPI(payload, res) {
  const { roomId, socketId } = payload;
  
  if (!roomId) {
    res.json({ event: 'game-status-error', data: { error: '룸 ID가 필요합니다.' } });
    return;
  }
  
  const room = gameRoomManager.getRoom(roomId);
  if (room) {
    // 플레이어가 룸에 있는지 확인
    if (room.players.has(socketId)) {
      const playerGameState = room.playerGameStates.get(socketId) || {};
      const combinedGameState = { ...room.sharedGameState, ...playerGameState };
      
      // elementsData와 moleculesData가 없으면 서버에서 로드한 데이터로 채우기
      if (!combinedGameState.elementsData || combinedGameState.elementsData.length === 0) {
        combinedGameState.elementsData = gameRoomManager.elementsData || [];
      }
      if (!combinedGameState.moleculesData || combinedGameState.moleculesData.length === 0) {
        combinedGameState.moleculesData = gameRoomManager.moleculesData || [];
      }
      
      res.json({
        event: 'game-status-response',
        data: {
          exists: true,
          gameState: combinedGameState,
          battlefield: room.battlefield,
          roomId: roomId
        }
      });
    } else {
      res.json({
        event: 'game-status-response',
        data: {
          exists: false,
          error: '해당 룸의 참가자가 아닙니다.'
        }
      });
    }
  } else {
    res.json({
      event: 'game-status-response',
      data: {
        exists: false,
        error: '게임을 찾을 수 없습니다.'
      }
    });
  }
}

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