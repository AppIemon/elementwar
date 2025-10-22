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
app.use(express.json());

// 정적 파일 서빙 설정
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }
}));

// 게임 룸 관리
class GameRoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room data
    this.waitingPlayers = new Map(); // socketId -> player data
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
        elementsData: [],
        moleculesData: [],
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
      // 안전 증가 (NaN 방지)
      const prevTC = Number.isFinite(room.sharedGameState.turnCount) ? room.sharedGameState.turnCount : 0;
      room.sharedGameState.turnCount = prevTC + 1;
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
        
        // 간단한 공격 처리 (실제 게임 로직에 맞게 수정 필요)
        if (playerCard.attack && computerCard.health) {
          computerCard.health = Math.max(0, computerCard.health - playerCard.attack);
          console.log(`${playerCard.name}이 ${computerCard.name}에게 ${playerCard.attack} 데미지`);
        }
        
        if (computerCard.attack && playerCard.health) {
          playerCard.health = Math.max(0, playerCard.health - computerCard.attack);
          console.log(`${computerCard.name}이 ${playerCard.name}에게 ${computerCard.attack} 데미지`);
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

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }
}

// 게임 룸 매니저 인스턴스
const gameRoomManager = new GameRoomManager();

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
        gameRoomManager.waitingPlayers.delete(waitingPlayer.socketId);
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
        cardData.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            const prevTC = Number.isFinite(room.sharedGameState.turnCount) ? room.sharedGameState.turnCount : 0;
            room.sharedGameState.turnCount = prevTC + 1;

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

// JavaScript 파일들을 위한 특별한 라우트
app.get('/src/js/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(filePath);
});

// 기타 정적 파일들
app.get('/src/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  res.sendFile(filePath);
});

// API 엔드포인트 (기존 호환성을 위해 유지)
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

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}에서 게임을 플레이하세요.`);
});