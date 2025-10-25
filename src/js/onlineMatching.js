// Socket.IO 기반 온라인 매칭 시스템
export class OnlineMatching {
  constructor() {
    this.isOnline = false;
    this.roomId = null;
    this.opponentName = null;
    this.playerId = null;
    this.isHost = false;
    this.isMatching = false;
    this.playerName = '';
    this.socket = null;
    this.turnTimerInterval = null;
    this.currentPlayerId = null; // 현재 턴인 플레이어 ID
    
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
    
    // 턴 타이머 요소들
    this.turnTimerContainer = document.getElementById('turn-timer-container');
    this.turnTimer = document.getElementById('turn-timer');
    this.currentPlayerText = document.getElementById('current-player');
  }

  getSocketUrl() {
    // 환경별 Socket URL 결정
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    } else if (window.location.hostname.includes('vercel.app')) {
      // Vercel 배포 환경
      return `https://${window.location.hostname}`;
    } else if (window.location.protocol === 'https:') {
      return `https://${window.location.hostname}`;
    } else {
      return `http://${window.location.hostname}:${window.location.port || 3000}`;
    }
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
    console.log('Socket URL:', this.getSocketUrl());
    
    // Socket.IO 클라이언트 초기화
    this.socket = io(this.getSocketUrl());
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Socket 이벤트 핸들러 설정
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    // 연결 성공
    this.socket.on('connect', () => {
      console.log('Socket 연결됨:', this.socket.id);
      this.updateConnectionStatus(true);
    });

    // 연결 해제
    this.socket.on('disconnect', () => {
      console.log('Socket 연결 해제됨');
      this.updateConnectionStatus(false);
    });

    // 매칭 대기 중
    this.socket.on('matching-waiting', () => {
      console.log('매칭 대기 중...');
      this.showMatchingWaiting();
    });

    // 매칭 완료
    this.socket.on('match-found', (data) => {
      console.log('매칭 완료:', data);
      this.handleMatchFound(data);
    });

    // 게임 시작
    this.socket.on('game-start', (data) => {
      console.log('게임 시작:', data);
      this.handleGameStart(data);
    });

    // 턴 변경
    this.socket.on('turn-changed', (data) => {
      console.log('턴 변경:', data);
      this.updateTurnStatus(data.currentTurn, data.turnTimer * 1000);
    });

    // 턴 타이머 업데이트
    this.socket.on('turn-timer-update', (data) => {
      this.updateTurnStatus(this.currentPlayerId, data.timeLeft * 1000);
    });

    // 게임 액션
    this.socket.on('game-action', (data) => {
      console.log('게임 액션 수신:', data);
      this.handleGameAction(data);
    });

    // 상대방 연결 해제
    this.socket.on('opponent-disconnected', () => {
      console.log('상대방이 연결을 해제했습니다.');
      this.showMatchingError('상대방이 연결을 해제했습니다.');
    });
  }

  handleMatchFound(data) {
    this.isMatching = false;
    this.roomId = data.roomId;
    this.opponentName = data.opponent.name || data.opponent.playerName;
    this.isHost = data.isFirstPlayer;
    
    console.log('매칭 완료 처리:', {
      roomId: this.roomId,
      opponentName: this.opponentName,
      isHost: this.isHost
    });
    
    this.showMatchingFound();
  }

  handleGameStart(data) {
    console.log('게임 시작 처리:', data);
    this.isOnline = true;
    this.hideMatchingModal();
    
    // 게임 초기화
    if (window.setOnlineMode) {
      window.setOnlineMode(true, this.roomId, this.opponentName);
    }
    
    if (window.resetGame) {
      window.resetGame();
    }
    
    // 턴 타이머 시작
    this.showTurnTimer();
    this.startTurnTimer();
  }

  handleGameAction(data) {
    const { action, payload } = data;
    
    switch (action) {
      case 'card-placed':
        if (window.handleOpponentCardPlaced) {
          window.handleOpponentCardPlaced(payload);
        }
        break;
      case 'turn-ended':
        if (window.handleOpponentTurnEnd) {
          window.handleOpponentTurnEnd(payload);
        }
        break;
      case 'card-drawn':
        if (window.handleOpponentCardDrawn) {
          window.handleOpponentCardDrawn(payload);
        }
        break;
      default:
        console.log('알 수 없는 게임 액션:', action, payload);
    }
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

  showMatchingModal(message = null) {
    this.matchingModal.style.display = 'flex';
    
    // 메시지가 제공된 경우 상태 텍스트 업데이트
    if (message) {
      this.statusText.textContent = message;
      // 3초 후에 자동으로 매칭 시작
      setTimeout(() => {
        this.startMatching();
      }, 3000);
    } else {
    this.startMatching();
    }
  }

  hideMatchingModal() {
    this.matchingModal.style.display = 'none';
    // 온라인 게임이 시작된 경우 매칭 취소하지 않음
    if (!this.isOnline && this.isMatching) {
      this.cancelMatching();
    }
  }

  startMatching() {
    if (!this.socket || !this.socket.connected) {
      this.showMatchingError('서버에 연결되지 않았습니다.');
      return;
    }

    this.isMatching = true;
    this.playerName = `플레이어_${Math.floor(Math.random() * 10000)}`;
    
    this.showMatchingWaiting();
    
    // Socket.IO를 통해 매칭 요청
    this.socket.emit('request-match', {
      playerName: this.playerName,
      playerId: this.playerId
    });
  }

  cancelMatching() {
    if (this.isMatching && this.socket) {
      this.socket.emit('cancel-match');
    }
    
    this.isMatching = false;
    this.matchingModal.style.display = 'none';
  }

  handleMatchFound(matchData) {
    this.isMatching = false;
    
    // 매칭 폴링 중지
    this.stopMatchingPolling();
    
    this.roomId = matchData.roomId;
    this.opponentName = matchData.opponentName;
    this.isHost = matchData.isHost;
    
    console.log('매칭 완료 처리:', {
      roomId: this.roomId,
      opponentName: this.opponentName,
      isHost: this.isHost
    });
    
    // 즉시 게임 시작
    console.log('즉시 게임 시작');
    this.startOnlineGameAfterMatching();
  }

  async startOnlineGameAfterMatching(retryCount = 0) {
    const maxRetries = 3;
    
    // 매칭 완료 후 게임 시작 (모달 닫지 않고 바로 시작)
    this.isOnline = true;
    
    console.log('매칭 완료 후 온라인 게임 시작:', {
      roomId: this.roomId,
      opponentName: this.opponentName,
      isOnline: this.isOnline,
      retryCount: retryCount
    });
    
    try {
      // 1단계: 온라인 모드 설정
      if (window.setOnlineMode) {
        window.setOnlineMode(true, this.roomId, this.opponentName);
        console.log('온라인 모드 설정 완료');
      }
      
      // 2단계: 온라인 상태 확인 대기 (Promise 기반)
      await this.waitForOnlineMode();
      
      // 3단계: 서버에서 게임 상태 가져오기
      await this.loadGameStateFromServer();
      
      // 4단계: 게임 초기화
      if (window.resetGame) {
        window.resetGame();
        console.log('게임 초기화 완료');
      }
      
      // 5단계: 턴 타이머 시작
      console.log('턴 타이머 시작 준비');
      this.showTurnTimer();
      this.startTurnTimer();
      console.log('턴 타이머 시작 완료');
      
      // 6단계: 모달 숨기기
      this.hideMatchingModal();
      
      console.log('온라인 게임 시작 완료');
    } catch (error) {
      console.error('온라인 게임 시작 실패:', error);
      
      if (retryCount < maxRetries) {
        console.log(`재시도 중... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          this.startOnlineGameAfterMatching(retryCount + 1);
        }, 2000);
      } else {
        this.showMatchingError('게임 시작 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      }
    }
  }

  waitForOnlineMode(timeout = 2000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkOnlineMode = () => {
        if (window.onlineGameState && window.onlineGameState.isOnline) {
          console.log('온라인 모드 설정 확인됨');
          resolve();
        } else if (Date.now() - startTime > timeout) {
          console.error('온라인 모드 설정 타임아웃');
          reject(new Error('온라인 모드 설정 타임아웃'));
        } else {
          setTimeout(checkOnlineMode, 50); // 50ms마다 확인
        }
      };
      
      checkOnlineMode();
    });
  }

  async loadGameStateFromServer() {
    try {
      console.log('서버에서 게임 상태 로드 중...', this.roomId);
      
      const response = await fetch(`${this.apiBaseUrl}/api/game-status/${this.roomId}?playerId=${this.playerId}`);
      const data = await response.json();
      
      if (data.success && data.room) {
        console.log('서버 게임 상태 로드 완료:', data.room);
        
        // 게임 상태 동기화
        if (window.updateOnlineGameState && data.room.gameState) {
          window.updateOnlineGameState(data.room.gameState);
          
          // fusionSystem 동기화 - gameState에 fusionSystem이 없으면 window.fusionSystem을 연결
          if (window.gameState && data.room.gameState.fusionSystem) {
            console.log('fusionSystem 상태 동기화 중...');
            
            // gameState에 fusionSystem이 없으면 window.fusionSystem을 연결
            if (!window.gameState.fusionSystem && window.fusionSystem) {
              window.gameState.fusionSystem = window.fusionSystem;
              console.log('window.fusionSystem을 gameState에 연결했습니다.');
            }
            
            if (window.gameState.fusionSystem) {
              window.gameState.fusionSystem.loadState(data.room.gameState.fusionSystem);
              console.log('fusionSystem 상태 동기화 완료');
            } else {
              console.warn('fusionSystem을 찾을 수 없습니다.');
            }
          }
        }

        // 전장 상태 동기화 (서버에서 이미 플레이어 관점으로 변환됨)
        if (data.room.battlefield && window.battlefield) {
          // 카드 객체 복원
          data.room.battlefield.lanes.forEach(lane => {
            if (lane.player) lane.player = window.restoreCardFromServer(lane.player);
            if (lane.computer) lane.computer = window.restoreCardFromServer(lane.computer);
          });
          
          window.battlefield = data.room.battlefield;
          console.log('플레이어 관점 전장 상태 동기화 완료');
        }

        // 기지 상태 동기화
        if (data.room.bases && window.battlefield) {
          window.battlefield.bases = data.room.bases;
          console.log('기지 상태 동기화 완료');
        }

        // 플레이어 손패 상태 동기화
        if (data.room.playerHands && window.gameState) {
          const currentPlayerHand = data.room.playerHands[this.playerId];
          if (currentPlayerHand) {
            window.gameState.playerHand = currentPlayerHand;
            console.log('손패 상태 동기화 완료');
          }
        }
        
        return true;
      } else {
        throw new Error('서버에서 게임 상태를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('서버 게임 상태 로드 실패:', error);
      throw error;
    }
  }

  // Socket.IO 기반 통신으로 폴링 불필요

  // Socket.IO 이벤트 핸들러에서 처리됨

  endTurn(gameState, battlefield) {
    console.log('onlineMatching.endTurn 호출됨', {
      roomId: this.roomId,
      playerId: this.playerId,
      isOnline: this.isOnline,
      gameState: gameState,
      battlefield: battlefield
    });
    
    if (!this.socket || !this.socket.connected) {
      console.error('Socket 연결이 없습니다.');
      return { error: '서버에 연결되지 않았습니다.' };
    }

    if (!this.roomId) {
      console.error('턴 종료 실패: 룸 ID가 없습니다.');
      return { error: '룸 ID가 없습니다.' };
    }

    // 턴 종료 중복 호출 방지
    if (this.isEndingTurn) {
      console.log('턴 종료가 이미 진행 중입니다. 중복 호출 무시.');
      return { error: '턴 종료가 이미 진행 중입니다.' };
    }

    this.isEndingTurn = true;

    console.log('턴 종료 신호 전송 중...', {
      roomId: this.roomId,
      playerId: this.playerId,
      turnCount: gameState.turnCount,
      isPlayerTurn: gameState.isPlayerTurn
    });

    // Socket.IO를 통해 턴 종료 신호 전송
    this.socket.emit('game-action', {
      action: 'end-turn',
      payload: {
        gameState: gameState,
        battlefield: battlefield
      }
    });

    // 턴 종료 플래그 리셋
    setTimeout(() => {
      this.isEndingTurn = false;
    }, 1000);

    return { success: true };
  }

  placeCard(card, laneIndex, side) {
    if (!this.socket || !this.socket.connected) {
      return { error: '서버에 연결되지 않았습니다.' };
    }

    if (!this.roomId) {
      return { error: '룸 ID가 없습니다.' };
    }

    console.log('카드 배치 신호 전송 중...', {
      roomId: this.roomId,
      playerId: this.playerId,
      card: card,
      laneIndex: laneIndex,
      side: side
    });

    // 카드 데이터 복사 및 상대방 카드 표시 정보 추가
    const cardData = { ...card };
    if (side === 'computer') {
      cardData.isOpponentCard = true;
    }
    
    // Socket.IO를 통해 카드 배치 신호 전송
    this.socket.emit('game-action', {
      action: 'place-card',
      payload: {
        card: cardData,
        laneIndex: laneIndex,
        side: side
      }
    });

    return { success: true };
  }

  // AI 생각 과정 요청은 현재 구현하지 않음
  async requestAIThinking(gameState, battlefield, playerHand) {
    return { success: true };
  }

  // 카드 뽑기 동기화
  syncCardDraw(cards) {
    if (!this.socket || !this.socket.connected) {
      return { error: '서버에 연결되지 않았습니다.' };
    }

    if (!this.roomId) {
      return { error: '룸 ID가 없습니다.' };
    }

    console.log('카드 뽑기 동기화 중...', {
      roomId: this.roomId,
      playerId: this.playerId,
      cards: cards.map(c => c.name)
    });

    // Socket.IO를 통해 카드 뽑기 동기화
    this.socket.emit('game-action', {
      action: 'draw-cards',
      payload: {
        cards: cards
      }
    });

    return { success: true };
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
    
    // 폴링 기반에서는 즉시 게임 시작
    console.log('매칭 완료, 즉시 게임 시작');
    this.startOnlineGameAfterMatching();
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
    
    // 턴 타이머 정리
    this.stopTurnTimer();
    
    // Socket 연결 해제
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // 게임 종료 처리
    if (window.endOnlineGame) {
      window.endOnlineGame();
    }
  }

  // 턴 상태 업데이트
  updateTurnStatus(currentPlayerId, timeRemaining) {
    // 현재 턴인 플레이어 ID 저장
    this.currentPlayerId = currentPlayerId;
    
    const isMyTurn = currentPlayerId === this.playerId;
    
    console.log('턴 상태 업데이트:', {
      currentPlayerId,
      myPlayerId: this.playerId,
      isMyTurn,
      timeRemaining
    });

    // 턴 타이머 UI 업데이트
    if (this.turnTimerContainer && this.turnTimer && this.currentPlayerText) {
      if (isMyTurn) {
        this.turnTimerContainer.classList.remove('hidden');
        this.currentPlayerText.textContent = '내 차례';
        this.turnTimer.style.color = '#10b981'; // 초록색
      } else {
        this.turnTimerContainer.classList.remove('hidden');
        this.currentPlayerText.textContent = '상대방 차례';
        this.turnTimer.style.color = '#ef4444'; // 빨간색
      }
      
      // 시간 업데이트
      if (timeRemaining !== undefined) {
        const seconds = Math.ceil(timeRemaining / 1000);
        this.turnTimer.textContent = `${seconds}초`;
        
        console.log('시간 체크:', { seconds, isMyTurn, timeRemaining });
        
        // 시간이 0초 이하이고 상대방 차례인 경우 강제 턴 종료 버튼 표시
        if (seconds <= 0 && !isMyTurn) {
          console.log('강제 턴 종료 버튼 표시 조건 만족');
          this.showForceEndTurnButton();
        } else {
          this.hideForceEndTurnButton();
        }
      }
    }

    // 턴 종료 버튼 상태 업데이트
    if (window.updateOnlineTurnUI) {
      console.log('updateOnlineTurnUI 호출:', { isMyTurn, currentPlayerId, myPlayerId: this.playerId });
      window.updateOnlineTurnUI(isMyTurn);
    }
  }

  // 강제 턴 종료 버튼 표시
  showForceEndTurnButton() {
    console.log('강제 턴 종료 버튼 표시 시도');
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
      console.log('턴 종료 버튼 찾음, 강제 종료 버튼으로 변경');
      endTurnBtn.textContent = '강제 턴 종료';
      endTurnBtn.disabled = false;
      endTurnBtn.onclick = () => this.forceEndTurn();
      endTurnBtn.style.backgroundColor = '#dc2626'; // 빨간색
    } else {
      console.error('턴 종료 버튼을 찾을 수 없습니다');
    }
  }

  // 강제 턴 종료 버튼 숨기기
  hideForceEndTurnButton() {
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
      endTurnBtn.style.backgroundColor = '';
    }
  }

  // 강제 턴 종료
  async forceEndTurn() {
    if (!this.roomId) {
      console.error('강제 턴 종료 실패: 룸 ID가 없습니다.');
      return;
    }

    try {
      console.log('강제 턴 종료 요청');
      
      const response = await fetch(`${this.apiBaseUrl}/api/force-end-turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: this.playerId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('강제 턴 종료 성공');
          showMessage('상대방의 턴을 강제로 종료했습니다.', 'info');
        } else {
          showMessage(data.error || '강제 턴 종료에 실패했습니다.', 'error');
        }
      } else {
        showMessage('강제 턴 종료에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('강제 턴 종료 오류:', error);
      showMessage('강제 턴 종료 중 오류가 발생했습니다.', 'error');
    }
  }

  // 턴 타이머 시작 (Socket.IO 이벤트로 처리됨)
  startTurnTimer() {
    console.log('턴 타이머 시작 - Socket.IO 이벤트로 처리됨');
    // Socket.IO 이벤트 핸들러에서 자동으로 처리됨
  }

  // 턴 타이머 중지
  stopTurnTimer() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  // 턴 타이머 UI 표시
  showTurnTimer() {
    console.log('턴 타이머 UI 표시 시도');
    if (this.turnTimerContainer) {
      this.turnTimerContainer.classList.remove('hidden');
      console.log('턴 타이머 UI 표시 완료');
    } else {
      console.error('턴 타이머 컨테이너를 찾을 수 없습니다');
    }
  }

  // 턴 타이머 UI 숨기기
  hideTurnTimer() {
    if (this.turnTimerContainer) {
      this.turnTimerContainer.classList.add('hidden');
    }
  }
}

// 전역 인스턴스 생성
window.onlineMatching = new OnlineMatching();

// 전역 함수로 노출 (기존 코드와의 호환성을 위해)
window.initOnlineMatching = () => {
  return window.onlineMatching;
};