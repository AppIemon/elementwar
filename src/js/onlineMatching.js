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
    this.turnTimerInterval = null;
    this.currentPlayerId = null; // 현재 턴인 플레이어 ID
    
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
    
    // 턴 타이머 요소들
    this.turnTimerContainer = document.getElementById('turn-timer-container');
    this.turnTimer = document.getElementById('turn-timer');
    this.currentPlayerText = document.getElementById('current-player');
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
    
    // 연결 상태 확인
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/health`);
      if (response.ok) {
        this.updateConnectionStatus(true);
        // 폴링 시작 (게임 상태 확인용)
        this.startPolling();
      } else {
        this.updateConnectionStatus(false);
      }
    } catch (error) {
      console.error('서버 연결 확인 실패:', error);
      this.updateConnectionStatus(false);
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
    // 주기적으로 서버 상태 확인 (1초마다로 최적화 - UI 업데이트 개선)
    this.pollingInterval = setInterval(async () => {
      if (this.isMatching || this.isOnline) {
        await this.checkGameStatus();
      }
    }, 1000);
  }

  async checkGameStatus() {
    try {
      if (!this.roomId) return;
      
      const url = `${this.apiBaseUrl}/api/game-status/${this.roomId}?playerId=${this.playerId}`;
      console.log('게임 상태 확인 요청:', url);
      
      const response = await fetch(url);
      
      // 404 에러 처리 - 룸이 존재하지 않음
      if (response.status === 404) {
        console.warn('게임 룸이 존재하지 않습니다. 폴링을 중단합니다.');
        this.stopPolling();
        this.showMatchingModal('게임 룸이 존재하지 않습니다. 다시 매칭을 시작해주세요.');
        return;
      }
      
      // 기타 HTTP 에러 처리
      if (!response.ok) {
        console.error(`게임 상태 확인 실패: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.room) {
        let hasChanges = false;
        
        // 게임 상태 업데이트
        if (window.updateOnlineGameState && data.room.gameState) {
          window.updateOnlineGameState(data.room.gameState);
          
          // fusionSystem 동기화 - gameState에 fusionSystem이 없으면 window.fusionSystem을 연결
          if (window.gameState && data.room.gameState.fusionSystem) {
            // gameState에 fusionSystem이 없으면 window.fusionSystem을 연결
            if (!window.gameState.fusionSystem && window.fusionSystem) {
              window.gameState.fusionSystem = window.fusionSystem;
              console.log('window.fusionSystem을 gameState에 연결했습니다.');
            }
            
            if (window.gameState.fusionSystem) {
              window.gameState.fusionSystem.loadState(data.room.gameState.fusionSystem);
            }
          }
          
          // 별 관리 시스템 동기화
          if (window.gameState && data.room.gameState.starManagement) {
            if (window.starManagement) {
              window.starManagement.loadData(data.room.gameState.starManagement);
            }
          }

          // 컴퓨터 별 관리 시스템 동기화
          if (window.gameState && data.room.gameState.computerStarManagement) {
            if (window.starManagement) {
              window.starManagement.loadComputerData(data.room.gameState.computerStarManagement);
            }
          }
          
          hasChanges = true;
        }

        // 턴 상태 업데이트
        if (data.room.currentPlayerId !== undefined) {
          this.updateTurnStatus(data.room.currentPlayerId, data.room.turnTimeRemaining);
        }

        // 기지 상태 동기화 (변경사항이 있을 때만)
        if (data.room.bases && window.battlefield) {
          const basesChanged = JSON.stringify(window.battlefield.bases) !== JSON.stringify(data.room.bases);
          if (basesChanged) {
            console.log('기지 상태 변경 감지:', data.room.bases);
            window.battlefield.bases = data.room.bases;
            hasChanges = true;
          }
        }
        
        // 전장 상태 동기화 (서버에서 이미 플레이어 관점으로 변환됨)
        if (data.room.battlefield) {
          // 카드 객체 복원
          data.room.battlefield.lanes.forEach(lane => {
            if (lane.player) lane.player = window.restoreCardFromServer(lane.player);
            if (lane.computer) lane.computer = window.restoreCardFromServer(lane.computer);
          });
          
          // 전장 상태 변경 확인
          const battlefieldChanged = JSON.stringify(window.battlefield.lanes) !== JSON.stringify(data.room.battlefield.lanes);
          if (battlefieldChanged) {
            console.log('전장 상태 변경 감지:', data.room.battlefield);
          if (window.syncBattlefield) {
            window.syncBattlefield(data.room.battlefield);
          } else if (window.renderBattlefield) {
            // 전역 battlefield 변수 업데이트
            if (typeof window.battlefield !== 'undefined') {
              window.battlefield = data.room.battlefield;
              console.log('플레이어 관점 전장 상태 업데이트 완료');
            }
            window.renderBattlefield();
            }
            hasChanges = true;
          }
        }

        // 플레이어 손패 상태 동기화 (변경사항이 있을 때만)
        if (data.room.playerHands && window.gameState) {
            const currentPlayerHand = data.room.playerHands[this.playerId];
            if (currentPlayerHand) {
            const handChanged = JSON.stringify(window.gameState.playerHand) !== JSON.stringify(currentPlayerHand);
            if (handChanged) {
              console.log('손패 상태 변경 감지:', currentPlayerHand);
              window.gameState.playerHand = currentPlayerHand;
              if (window.renderPlayerHand) {
                window.renderPlayerHand();
              }
              hasChanges = true;
            }
          }
        }
        
        // 온라인 모드에서는 변경사항과 관계없이 UI 업데이트 실행
        if (hasChanges) {
          console.log('게임 상태 변경 감지 - UI 업데이트 실행');
        } else {
          console.log('게임 상태 확인 완료 (변경사항 없음)');
        }
        
        // 별 관리 시스템 턴 처리 (온라인 게임에서도)
        if (window.starManagement) {
          const supernovas = window.starManagement.processTurn();
          if (supernovas > 0) {
            console.log(`온라인 게임: ${supernovas}개의 초신성이 발생했습니다!`);
          }
        }

        // 컴퓨터 별 관리 시스템 턴 처리 (온라인 게임에서도)
        if (window.computerStarManagement) {
          const computerSupernovas = window.computerStarManagement.processTurn();
          if (computerSupernovas > 0) {
            console.log(`온라인 게임 컴퓨터: ${computerSupernovas}개의 초신성이 발생했습니다!`);
          }
        }

        // 온라인 모드에서는 항상 UI 업데이트 실행 (뽑기할 때만 업데이트되는 문제 해결)
        if (window.updateUI) {
          window.updateUI();
        }
      }
    } catch (error) {
      console.error('게임 상태 확인 오류:', error);
      console.error('에러 타입:', error.name);
      console.error('에러 메시지:', error.message);
      console.error('API URL:', this.apiBaseUrl);
      console.error('룸 ID:', this.roomId);
      console.error('플레이어 ID:', this.playerId);
      
      // 네트워크 에러인 경우 폴링 중단
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('네트워크 연결 실패. 폴링을 중단합니다.');
        this.stopPolling();
        this.showMatchingModal('네트워크 연결에 실패했습니다. 페이지를 새로고침해주세요.');
      }
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
    console.log('onlineMatching.endTurn 호출됨', {
      roomId: this.roomId,
      playerId: this.playerId,
      isOnline: this.isOnline,
      gameState: gameState,
      battlefield: battlefield
    });
    
    try {
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

      const response = await fetch(`${this.apiBaseUrl}/api/end-turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: this.playerId,
          gameState: gameState,
          battlefield: battlefield
        })
      });

      // HTTP 에러 처리
      if (!response.ok) {
        console.error(`턴 종료 실패: ${response.status} ${response.statusText}`);
        this.isEndingTurn = false;
        return { error: `서버 오류: ${response.status}` };
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('턴 종료 신호 전송 완료:', data);
        
        // 턴 종료 후 UI 업데이트 (온라인 모드 UI 업데이트 개선)
        if (window.updateUI) {
          window.updateUI();
        }
        
        // 서버에서 이미 플레이어 관점으로 변환된 상태를 받음
        return { 
          success: true, 
          gameState: data.gameState,
          battlefield: data.battlefield,
          turnProcessed: data.turnProcessed
        };
      } else {
        return { error: data.error || '턴을 종료할 수 없습니다.' };
      }
    } catch (error) {
      console.error('턴 종료 오류:', error);
      console.error('에러 타입:', error.name);
      console.error('에러 메시지:', error.message);
      
      // 네트워크 에러인 경우 폴링 중단
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('네트워크 연결 실패. 폴링을 중단합니다.');
        this.stopPolling();
        this.showMatchingModal('네트워크 연결에 실패했습니다. 페이지를 새로고침해주세요.');
      }
      
      return { error: '턴을 종료할 수 없습니다.' };
    } finally {
      // 턴 종료 플래그 리셋
      this.isEndingTurn = false;
    }
  }

  async placeCard(card, laneIndex, side) {
    try {
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
      
      const response = await fetch(`${this.apiBaseUrl}/api/place-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: this.playerId,
          card: cardData,
          laneIndex: laneIndex,
          side: side
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('카드 배치 신호 전송 완료:', data);
        
        // 카드 배치 후 UI 업데이트 (온라인 모드 UI 업데이트 개선)
        if (window.updateUI) {
          window.updateUI();
        }
        
        // 서버에서 이미 플레이어 관점으로 변환된 상태를 받음
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

  // 카드 뽑기 동기화
  async syncCardDraw(cards) {
    try {
      if (!this.roomId) {
        return { error: '룸 ID가 없습니다.' };
      }

      console.log('카드 뽑기 동기화 중...', {
        roomId: this.roomId,
        playerId: this.playerId,
        cards: cards.map(c => c.name)
      });

      const response = await fetch(`${this.apiBaseUrl}/api/draw-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: this.playerId,
          cards: cards
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('카드 뽑기 동기화 완료:', data);
        return { success: true };
      } else {
        return { error: data.error || '카드 뽑기 동기화에 실패했습니다.' };
      }
    } catch (error) {
      console.error('카드 뽑기 동기화 오류:', error);
      return { error: '카드 뽑기 동기화 중 오류가 발생했습니다.' };
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
    
    // 폴링 중지
    this.stopPolling();
    
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

  // 턴 타이머 시작
  startTurnTimer() {
    this.stopTurnTimer(); // 기존 타이머 정리
    
    console.log('턴 타이머 시작');
    
    this.turnTimerInterval = setInterval(async () => {
      if (!this.roomId) return;
      
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/turn-time/${this.roomId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('턴 시간 업데이트:', {
              currentPlayerId: data.currentPlayerId,
              timeRemaining: data.timeRemaining,
              myPlayerId: this.playerId
            });
            this.updateTurnStatus(data.currentPlayerId, data.timeRemaining);
          }
        } else {
          console.error('턴 시간 확인 실패:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('턴 시간 확인 오류:', error);
      }
    }, 1000); // 1초마다 업데이트
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