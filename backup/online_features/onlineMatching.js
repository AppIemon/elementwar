// Express API 기반 온라인 매칭 시스템
class OnlineMatching {
  constructor() {
    this.isOnline = false;
    this.roomId = null;
    this.opponentName = null;
    this.playerId = null;
    this.isHost = false;
    this.isMatching = false;
    this.playerName = '';
    this.apiBaseUrl = this.getApiBaseUrl();
    
    this.initializeElements();
    this.bindEvents();
    this.initializeApi();
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

  getApiBaseUrl() {
    // 환경별 API URL 결정
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

  initializeApi() {
    console.log('API URL:', this.apiBaseUrl);
    
    // API 기반 통신 설정
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // 연결 상태 업데이트
    this.updateConnectionStatus(true);
    
    // 폴링 시작 (게임 상태 확인용)
    this.startPolling();
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

  async startMatching() {
    try {
      this.isMatching = true;
      this.playerName = `플레이어_${Math.floor(Math.random() * 10000)}`;
      
      this.showMatchingWaiting();
      
      // Express API를 통해 매칭 시작
      const response = await fetch(`${this.apiBaseUrl}/api/start-matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: this.playerName,
          playerId: this.playerId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.waiting) {
          // 대기 중
          this.showMatchingWaiting();
          this.startMatchingPolling();
        } else {
          // 매칭 완료
          this.handleMatchFound(data);
        }
      } else {
        this.showMatchingError(data.error || '매칭을 시작할 수 없습니다.');
      }
    } catch (error) {
      console.error('매칭 시작 오류:', error);
      this.showMatchingError('매칭을 시작할 수 없습니다.');
    }
  }

  async cancelMatching() {
    try {
      if (this.isMatching) {
        await fetch(`${this.apiBaseUrl}/api/cancel-matching`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: this.playerId
          })
        });
      }
    } catch (error) {
      console.error('매칭 취소 오류:', error);
    } finally {
      this.isMatching = false;
      this.stopMatchingPolling(); // 매칭 폴링 중지
      this.hideMatchingModal();
    }
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
      
      // 3단계: 게임 초기화
      if (window.resetGame) {
        window.resetGame();
        console.log('게임 초기화 완료');
      }
      
      // 4단계: 모달 숨기기
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

  // API 기반 통신 메서드들 (위에서 구현됨)

  startMatchingPolling() {
    // 매칭 대기 중에는 더 자주 확인 (1초마다)
    this.matchingPollingInterval = setInterval(async () => {
      if (this.isMatching) {
        await this.checkMatchingStatus();
      }
    }, 1000);
  }

  async checkMatchingStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/check-matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: this.playerId
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.matched) {
        // 매칭 완료
        this.handleMatchFound({
          roomId: data.roomId,
          opponentName: data.opponentName,
          isHost: data.isHost
        });
      }
    } catch (error) {
      console.error('매칭 상태 확인 오류:', error);
    }
  }

  startPolling() {
    // 주기적으로 서버 상태 확인 (2초마다)
    this.pollingInterval = setInterval(async () => {
      if (this.isMatching || this.isOnline) {
        await this.checkGameStatus();
      }
    }, 2000);
  }

  async checkGameStatus() {
    try {
      if (!this.roomId) return;
      
      const response = await fetch(`${this.apiBaseUrl}/api/game-status/${this.roomId}`);
      const data = await response.json();
      
      if (data.success && data.room) {
        // 게임 상태 업데이트
        if (window.updateOnlineGameState && data.room.gameState) {
          window.updateOnlineGameState(data.room.gameState);
        }
        
        // 전장 상태 동기화
        if (window.syncBattlefield && data.room.gameState.battlefield) {
          window.syncBattlefield(data.room.gameState.battlefield);
        }
      }
    } catch (error) {
      console.error('게임 상태 확인 오류:', error);
    }
  }

  stopMatchingPolling() {
    if (this.matchingPollingInterval) {
      clearInterval(this.matchingPollingInterval);
      this.matchingPollingInterval = null;
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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

  // 이벤트 핸들러들은 checkGameStatus에서 처리됨

  async endTurn(gameState, battlefield) {
    try {
      if (!this.roomId) {
        console.error('턴 종료 실패: 룸 ID가 없습니다.');
        return { error: '룸 ID가 없습니다.' };
      }

      console.log('턴 종료 신호 전송 중...', {
        roomId: this.roomId,
        turnCount: gameState.turnCount,
        isPlayerTurn: gameState.isPlayerTurn
      });

      const response = await fetch(`${this.apiBaseUrl}/api/end-turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          gameState: gameState,
          battlefield: battlefield
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('턴 종료 신호 전송 완료');
        return { success: true, gameState: data.gameState };
      } else {
        return { error: data.error || '턴을 종료할 수 없습니다.' };
      }
    } catch (error) {
      console.error('턴 종료 오류:', error);
      return { error: '턴을 종료할 수 없습니다.' };
    }
  }

  async placeCard(card, laneIndex, side) {
    try {
      if (!this.roomId) {
        return { error: '룸 ID가 없습니다.' };
      }

      const response = await fetch(`${this.apiBaseUrl}/api/place-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          card: card,
          laneIndex: laneIndex,
          side: side
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, battlefield: data.battlefield };
      } else {
        return { error: data.error || '카드를 배치할 수 없습니다.' };
      }
    } catch (error) {
      console.error('카드 배치 오류:', error);
      return { error: '카드를 배치할 수 없습니다.' };
    }
  }

  // AI 생각 과정 요청은 현재 구현하지 않음
  async requestAIThinking(gameState, battlefield, playerHand) {
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
    
    // 폴링 중지
    this.stopPolling();
    
    if (window.game) {
      window.game.endOnlineGame();
    }
  }
}

// 전역 인스턴스 생성
window.onlineMatching = new OnlineMatching();