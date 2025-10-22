// Socket.IO 기반 온라인 매칭 시스템
class OnlineMatching {
  constructor() {
    this.isOnline = false;
    this.roomId = null;
    this.opponentName = null;
    this.playerId = null;
    this.isHost = false;
    this.isMatching = false;
    this.playerName = '';
    this.socket = null;
    
    this.initializeElements();
    this.bindEvents();
    this.initializeSocket();
  }

  initializeElements() {
    // 모달 요소들
    this.matchingModal = document.getElementById('online-matching-modal');
    this.cancelMatchingBtn = document.getElementById('cancel-matching-btn');
    this.closeMatchingBtn = document.getElementById('close-matching-modal-btn');
    this.closeMatchingModal = document.getElementById('close-matching-modal');
    
    // 상태 표시 요소들
    this.matchingWaiting = document.getElementById('matching-waiting');
    this.matchingFound = document.getElementById('matching-found');
    this.matchingError = document.getElementById('matching-error');
    this.opponentNameSpan = document.getElementById('opponent-name');
    this.errorMessageSpan = document.getElementById('error-message');
    
    // 연결 상태 표시
    this.connectionIndicator = document.getElementById('connection-indicator');
    this.connectionText = document.getElementById('connection-text');
  }

  bindEvents() {
    // 온라인 매칭 버튼 클릭
    document.getElementById('online-match-btn').addEventListener('click', () => {
      this.showMatchingModal();
    });

    // 매칭 취소 버튼
    this.cancelMatchingBtn.addEventListener('click', () => {
      this.cancelMatching();
    });

    // 모달 닫기 버튼들
    this.closeMatchingBtn.addEventListener('click', () => {
      this.hideMatchingModal();
    });

    this.closeMatchingModal.addEventListener('click', (e) => {
      if (e.target === this.closeMatchingModal) {
        this.hideMatchingModal();
      }
    });
  }

  initializeSocket() {
    // Socket.IO 클라이언트 초기화
    this.socket = io();
    
    // 연결 상태 이벤트
    this.socket.on('connect', () => {
      console.log('서버에 연결되었습니다.');
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('서버 연결이 끊어졌습니다.');
      this.updateConnectionStatus(false);
    });

    // 매칭 관련 이벤트
    this.socket.on('matching-waiting', (data) => {
      console.log('매칭 대기 중:', data.message);
      this.showMatchingWaiting();
    });

    this.socket.on('match-found', (data) => {
      console.log('매칭 완료:', data);
      this.handleMatchFound(data);
    });

    this.socket.on('matching-error', (data) => {
      console.error('매칭 오류:', data.error);
      this.showMatchingError(data.error);
    });

    this.socket.on('matching-cancelled', () => {
      console.log('매칭이 취소되었습니다.');
      this.hideMatchingModal();
    });

    // 게임 관련 이벤트
    this.socket.on('game-started', (data) => {
      console.log('게임 시작:', data);
      this.startOnlineGame(data);
    });

    this.socket.on('game-error', (data) => {
      console.error('게임 오류:', data.error);
      this.showMatchingError(data.error);
    });

    this.socket.on('turn-processed', (data) => {
      console.log('턴 진행됨:', data);
      this.handleTurnProcessed(data);
    });

    this.socket.on('turn-ended', (data) => {
      console.log('턴 종료됨:', data.message);
      this.handleTurnEnded(data);
    });

    this.socket.on('card-placed', (data) => {
      console.log('카드 배치됨:', data);
      this.handleCardPlaced(data);
    });

    this.socket.on('player-left', (data) => {
      console.log('플레이어 나감:', data);
      this.handlePlayerLeft(data);
    });

    this.socket.on('ai-thinking', (data) => {
      console.log('AI 생각 과정:', data);
      this.handleAIThinking(data);
    });

    this.socket.on('ai-thinking-error', (data) => {
      console.error('AI 생각 과정 오류:', data.error);
    });
  }

  updateConnectionStatus(connected) {
    if (this.connectionIndicator && this.connectionText) {
      if (connected) {
        this.connectionIndicator.className = 'w-3 h-3 bg-green-500 rounded-full';
        this.connectionText.textContent = '연결됨';
      } else {
        this.connectionIndicator.className = 'w-3 h-3 bg-red-500 rounded-full';
        this.connectionText.textContent = '연결 끊김';
      }
    }
  }

  showMatchingModal() {
    this.matchingModal.style.display = 'flex';
    this.startMatching();
  }

  hideMatchingModal() {
    this.matchingModal.style.display = 'none';
    // 온라인 게임이 시작된 경우 매칭 취소하지 않음
    if (!this.isOnline) {
      this.cancelMatching();
    }
  }

  startMatching() {
    try {
      this.isMatching = true;
      this.playerName = `플레이어_${Math.floor(Math.random() * 10000)}`;
      
      this.showMatchingWaiting();
      
      // Socket.IO를 통해 매칭 시작
      this.socket.emit('start-matching', {
        playerName: this.playerName
      });
    } catch (error) {
      console.error('매칭 시작 오류:', error);
      this.showMatchingError('매칭을 시작할 수 없습니다.');
    }
  }

  cancelMatching() {
    try {
      if (this.socket && this.isMatching) {
        this.socket.emit('cancel-matching');
      }
    } catch (error) {
      console.error('매칭 취소 오류:', error);
    } finally {
      this.isMatching = false;
      this.hideMatchingModal();
    }
  }

  handleMatchFound(matchData) {
    this.isMatching = false;
    
    this.roomId = matchData.roomId;
    this.opponentName = matchData.opponentName;
    this.isHost = matchData.isHost;
    
    this.showMatchingFound();
    
    // 게임 시작 (자동으로 startOnlineGameAfterMatching이 호출됨)
    // 서버에 게임 시작 신호는 showMatchingFound에서 처리
  }

  startOnlineGameAfterMatching() {
    // 매칭 완료 후 게임 시작 (모달 닫지 않고 바로 시작)
    this.isOnline = true;
    
    console.log('매칭 완료 후 온라인 게임 시작:', {
      roomId: this.roomId,
      opponentName: this.opponentName,
      isOnline: this.isOnline
    });
    
    // 먼저 온라인 모드로 설정
    if (window.setOnlineMode) {
      window.setOnlineMode(true, this.roomId, this.opponentName);
    }
    
    // 온라인 상태가 제대로 설정되었는지 확인
    setTimeout(() => {
      if (window.onlineGameState && window.onlineGameState.isOnline) {
        console.log('온라인 모드 설정 확인됨, 게임 초기화 시작');
        // 그 다음 게임 초기화 (온라인 모드가 설정된 후)
        if (window.resetGame) {
          window.resetGame();
        }
        
        // 모달 숨기기
        this.hideMatchingModal();
        
        console.log('온라인 게임 시작 완료');
      } else {
        console.error('온라인 모드 설정 실패, 재시도...');
        // 재시도
        if (window.setOnlineMode) {
          window.setOnlineMode(true, this.roomId, this.opponentName);
        }
      }
    }, 100);
  }

  startOnlineGame(gameData) {
    this.isOnline = true;
    this.hideMatchingModal();
    
    console.log('온라인 게임 시작 전 상태:', {
      onlineGameState: window.onlineGameState,
      isOnline: this.isOnline
    });
    
    // 먼저 온라인 모드로 설정
    if (window.setOnlineMode) {
      window.setOnlineMode(true, this.roomId, this.opponentName);
    }
    
    // 그 다음 게임 초기화 (온라인 모드가 설정된 후)
    if (window.resetGame) {
      window.resetGame();
    }
    
    console.log('온라인 게임 시작 후 상태:', {
      onlineGameState: window.onlineGameState,
      isOnline: this.isOnline
    });
  }

  handleTurnProcessed(data) {
    console.log('턴 처리됨:', data);
    
    // 게임 상태 동기화
    if (window.updateOnlineGameState) {
      window.updateOnlineGameState(data.gameState);
    }

    // 온라인 게임에서는 항상 플레이어 턴 활성화 (동시 턴 모드)
    if (window.gameState && data.gameState) {
      window.gameState.isPlayerTurn = true; // 항상 활성화
      console.log('온라인 동시 턴 모드: 플레이어 턴 활성화');
    }

    // 전장 상태 동기화
    if (window.syncBattlefield) {
      window.syncBattlefield(data.battlefield);
    }

    // 턴 상태 리셋 - 동시 턴 모드에서는 항상 활성화
    if (window.onlineGameState) {
      window.onlineGameState.playerTurnEnded = false;
      window.onlineGameState.waitingForOpponent = false;
      window.onlineGameState.opponentTurnEnded = false;
    }

    // 공격 결과 처리 (서버에서 처리된 결과 반영)
    if (data.battlefield && window.battlefield) {
      console.log('공격 결과 동기화 중...');
      // 전장 상태가 이미 syncBattlefield에서 업데이트되므로 추가 처리 불필요
    }

    // 턴 표시 업데이트 (중요!)
    if (window.updateTurnIndicator) {
      window.updateTurnIndicator();
    }
    
    // 온라인 턴 UI 업데이트
    if (window.updateOnlineTurnUI) {
      window.updateOnlineTurnUI();
    }

    // 전체 UI 업데이트
    if (window.updateUI) {
      window.updateUI();
    }
    
    console.log('턴 처리 완료, 현재 턴:', window.gameState ? window.gameState.turnCount : 'unknown');
  }

  handleTurnEnded(data) {
    console.log('턴 종료됨:', data);
    
    // 턴 상태 리셋 - 동시 턴 모드에서는 항상 활성화
    if (window.onlineGameState) {
      window.onlineGameState.playerTurnEnded = false;
      window.onlineGameState.waitingForOpponent = false;
      window.onlineGameState.opponentTurnEnded = false;
    }
    
    // 온라인 게임에서는 항상 플레이어 턴 활성화 (동시 턴 모드)
    if (window.gameState) {
      window.gameState.isPlayerTurn = true;
    }
    
    // 턴 종료 UI 업데이트
    if (window.game && window.game.updateOnlineTurnUI) {
      window.game.updateOnlineTurnUI();
    }
    
    // 게임 상태 동기화
    if (window.game && window.game.updateOnlineGameState && data.gameState) {
      window.game.updateOnlineGameState(data.gameState);
    }
  }

  handleCardPlaced(data) {
    console.log('카드 배치 처리 시작:', data);
    
    // 카드 배치 동기화 (개별 카드 정보로)
    if (window.syncCardPlacement && data.card && data.laneIndex !== undefined && data.side) {
      console.log('syncCardPlacement 호출:', {
        card: data.card,
        laneIndex: data.laneIndex,
        side: data.side
      });
      window.syncCardPlacement({
        card: data.card,
        laneIndex: data.laneIndex,
        side: data.side
      });
    } else {
      // 전체 전장 상태 동기화 (fallback)
      console.log('전체 전장 상태 동기화 (fallback)');
      if (window.syncBattlefield && data.battlefield) {
        window.syncBattlefield(data.battlefield);
      }
    }

    // UI 업데이트
    if (window.updateUI) {
      window.updateUI();
    }
  }

  handlePlayerLeft(data) {
    // 플레이어 나감 알림
    if (window.game && window.game.showMessage) {
      window.game.showMessage(data.message, 'warning');
    }

    // 게임 종료
    this.endOnlineGame();
  }

  handleAIThinking(data) {
    // AI 생각 과정 처리 (필요시 구현)
    console.log('AI 분석:', data.analysis);
  }

  async endTurn(gameState, battlefield) {
    try {
      if (!this.socket || !this.roomId) {
        console.error('턴 종료 실패: 온라인 연결이 없습니다.');
        return { error: '온라인 연결이 없습니다.' };
      }

      console.log('턴 종료 신호 전송 중...', {
        roomId: this.roomId,
        turnCount: gameState.turnCount,
        isPlayerTurn: gameState.isPlayerTurn
      });

      this.socket.emit('end-turn', {
        roomId: this.roomId,
        gameState: gameState,
        battlefield: battlefield
      });

      console.log('턴 종료 신호 전송 완료');
      return { success: true };
    } catch (error) {
      console.error('턴 종료 오류:', error);
      return { error: '턴을 종료할 수 없습니다.' };
    }
  }

  async placeCard(card, laneIndex, side) {
    try {
      if (!this.socket || !this.roomId) {
        return { error: '온라인 연결이 없습니다.' };
      }

      this.socket.emit('place-card', {
        roomId: this.roomId,
        card: card,
        laneIndex: laneIndex,
        side: side
      });

      return { success: true };
    } catch (error) {
      console.error('카드 배치 오류:', error);
      return { error: '카드를 배치할 수 없습니다.' };
    }
  }

  async requestAIThinking(gameState, battlefield, playerHand) {
    try {
      if (!this.socket) {
        return { error: '온라인 연결이 없습니다.' };
      }

      this.socket.emit('request-ai-thinking', {
        gameState: gameState,
        battlefield: battlefield,
        playerHand: playerHand
      });

      return { success: true };
    } catch (error) {
      console.error('AI 생각 과정 요청 오류:', error);
      return { error: 'AI 생각 과정을 요청할 수 없습니다.' };
    }
  }

  showMatchingWaiting() {
    this.matchingWaiting.style.display = 'block';
    this.matchingFound.style.display = 'none';
    this.matchingError.style.display = 'none';
  }

  showMatchingFound() {
    this.matchingWaiting.style.display = 'none';
    this.matchingFound.style.display = 'block';
    this.matchingError.style.display = 'none';
    this.opponentNameSpan.textContent = this.opponentName;
    
    // 서버에 게임 시작 신호 전송
    this.socket.emit('start-game', {
      roomId: this.roomId
    });
    
    // 2초 후 자동으로 게임 시작
    setTimeout(() => {
      this.startOnlineGameAfterMatching();
    }, 2000);
  }

  showMatchingError(message) {
    this.matchingWaiting.style.display = 'none';
    this.matchingFound.style.display = 'none';
    this.matchingError.style.display = 'block';
    this.errorMessageSpan.textContent = message;
  }

  endOnlineGame() {
    this.isOnline = false;
    this.roomId = null;
    this.opponentName = null;
    this.isHost = false;
    
    if (window.game) {
      window.game.endOnlineGame();
    }
  }
}

// 전역 인스턴스 생성
window.onlineMatching = new OnlineMatching();