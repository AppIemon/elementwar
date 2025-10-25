// 튜토리얼 시스템
import { ElementCard, addCardToHand } from './card.js';
import { gameState } from './game.js';

export class TutorialSystem {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.steps = [];
    this.overlay = null;
    this.tooltip = null;
    this.callbacks = {};
    
    this.init();
  }

  init() {
    this.createTutorialOverlay();
    this.createTooltip();
    this.setupSteps();
    this.bindEvents();
  }

  createTutorialOverlay() {
    // 튜토리얼 도커 생성
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'fixed inset-0 z-40 hidden';
    this.overlay.innerHTML = `
      <!-- 클릭 차단 레이어 -->
      <div class="absolute inset-0 bg-black bg-opacity-10 pointer-events-auto" id="tutorial-blocking-layer"></div>
      
      <!-- 하이라이트 영역 (클릭 가능) -->
      <div class="absolute pointer-events-none" id="tutorial-highlight"></div>
      
      <!-- 튜토리얼 도커 (오른쪽 사이드바) -->
      <div class="absolute top-0 right-0 h-full w-96 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-yellow-400/30 shadow-2xl pointer-events-auto" id="tutorial-docker">
        <div class="h-full flex flex-col">
          <!-- 도커 헤더 -->
          <div class="bg-yellow-400 text-gray-900 px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🎓</span>
              <h2 class="text-xl font-bold">튜토리얼</h2>
            </div>
            <button id="tutorial-close" class="text-gray-700 hover:text-gray-900 text-2xl font-bold">&times;</button>
          </div>
          
          <!-- 도커 내용 -->
          <div class="flex-1 p-4 overflow-y-auto">
            <div class="space-y-4">
              <div>
                <h3 id="tutorial-title" class="text-lg font-semibold text-yellow-400 mb-2"></h3>
                <p id="tutorial-description" class="text-gray-300 leading-relaxed"></p>
              </div>
              
              <!-- 진행률 표시 -->
              <div class="bg-gray-700 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-300">진행률</span>
                  <span id="tutorial-progress" class="text-sm text-yellow-400 font-semibold">1 / 12</span>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-2">
                  <div id="tutorial-progress-bar" class="bg-yellow-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
              
              <!-- 툴팁 영역 -->
              <div id="tutorial-tooltip-area" class="bg-blue-900/20 border border-blue-400/30 rounded-lg p-3 hidden">
                <div class="flex items-start space-x-2">
                  <span class="text-blue-400 text-lg">💡</span>
                  <p class="text-blue-300 text-sm" id="tutorial-tooltip-text"></p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 도커 푸터 (버튼들) -->
          <div class="border-t border-gray-600 p-4 bg-gray-800">
            <div class="flex justify-between items-center">
              <button id="tutorial-prev" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                ← 이전
              </button>
              <div class="flex space-x-2">
                <button id="tutorial-skip" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm">
                  건너뛰기
                </button>
                <button id="tutorial-next" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm">
                  다음 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);
  }

  createTooltip() {
    // 툴팁은 도커 내부에 표시되므로 별도 생성 불필요
    this.tooltip = null;
  }

  setupSteps() {
    this.steps = [
      {
        id: 'welcome',
        title: '🌟 원소 대전의 세계에 오신 것을 환영합니다!',
        description: '화학의 신비로운 세계에서 펼쳐지는 전략 카드 게임입니다! 🧪✨\n\n이 튜토리얼을 통해 원소들의 특별한 능력과 분자 합성의 비밀을 배워보세요. 각 원소는 고유한 특성을 가지고 있어 전략적으로 활용할 수 있습니다!',
        target: null,
        action: 'show',
        highlight: false
      },
      {
        id: 'game-overview',
        title: '⚔️ 전장 - 원소들이 만나는 곳',
        description: '이곳이 바로 원소들이 전투를 벌이는 전장입니다! 🏟️\n\n• 5개의 라인으로 구성된 3D 전장\n• 각 라인에 원소 카드를 배치하여 전투\n• 상대방의 기지를 공격하여 승리하세요!\n• 원소의 특성에 따라 다양한 전략이 가능합니다',
        target: '#battlefield',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'player-hand',
        title: '🃏 손패 - 당신의 원소 카드들',
        description: '여기에 당신이 보유한 원소 카드들이 표시됩니다! 🎴\n\n• 카드를 클릭하면 상세 정보 확인 가능\n• 드래그하여 전장에 배치\n• 각 원소마다 고유한 공격력과 체력\n• 원소의 주기율표 분류에 따른 특별한 능력',
        target: '#player-hand',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'card-info',
        title: '🔍 카드 상세 정보 - 원소의 비밀',
        description: '카드를 클릭하면 원소의 모든 정보를 볼 수 있습니다! 🔬\n\n• 원소 기호와 이름\n• 공격력(⚔️)과 체력(❤️)\n• 원소 번호와 분류\n• 특별한 능력과 효과\n• 화학적 특성과 실제 활용법',
        target: '#player-hand .card',
        action: 'highlight',
        highlight: true,
        waitForAction: true
      },
      {
        id: 'resources',
        title: '💰 자원 관리 - 게임의 핵심',
        description: '게임을 진행하기 위한 다양한 자원들이 있습니다! 💎\n\n• 💰 코인: 카드 뽑기와 특수 능력 사용\n• ⚡ 에너지: 분자 합성과 특수 효과\n• 🔥 열: 고온 반응과 강력한 능력\n• ⭐ 별: 핵융합과 우주 원소 생성',
        target: '.coin-display',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'card-drawing',
        title: '📦 카드 뽑기 - 새로운 원소 발견',
        description: '이 버튼을 클릭하여 새로운 원소 카드를 뽑을 수 있습니다! 🎲\n\n• 코인을 소모하여 카드 획득\n• 다양한 등급의 원소 카드\n• 희귀한 원소일수록 강력한 능력\n• 운과 전략이 만나는 순간!',
        target: '#card-pack-btn',
        action: 'highlight',
        highlight: true,
        waitForAction: true
      },
      {
        id: 'card-placement',
        title: '🎯 카드 배치 - 전략적 포지셔닝',
        description: '카드를 드래그하여 전장의 빈 슬롯에 배치하세요! 🎪\n\n• 각 라인에는 한 장의 카드만 배치 가능\n• 상대방과 같은 라인에서 전투\n• 빈 라인에 배치하면 기지 직접 공격\n• 원소의 특성을 고려한 배치가 중요!',
        target: '.lane-slot',
        action: 'highlight',
        highlight: true,
        waitForAction: true
      },
      {
        id: 'turn-end',
        title: '⏭️ 턴 종료 - 전략의 완성',
        description: '카드를 배치했다면 턴 종료 버튼을 클릭하세요! 🎯\n\n• 상대방에게 차례를 넘김\n• 배치한 카드들이 자동으로 전투\n• 전투 결과에 따라 자원 획득\n• 다음 턴을 위한 준비',
        target: '#end-turn-btn',
        action: 'highlight',
        highlight: true,
        waitForAction: true
      },
      {
        id: 'battle-system',
        title: '⚔️ 전투 시스템 - 원소들의 대결',
        description: '같은 라인에 있는 카드들이 서로 공격합니다! 🥊\n\n• 공격력이 높은 카드가 승리\n• 패배한 카드는 파괴\n• 승리한 카드는 상대방 기지 공격\n• 원소의 특성에 따른 특별한 효과',
        target: '#battlefield',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'base-attack',
        title: '🏰 기지 공격 - 승리의 열쇠',
        description: '상대방 카드가 없는 라인에 카드를 배치하면 기지를 직접 공격! 🎯\n\n• 상대방 기지의 HP 감소\n• 기지 HP가 0이 되면 승리\n• 전략적 라인 선택이 중요\n• 다양한 원소로 기지를 공격하세요!',
        target: '#computer-base',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'fusion-system',
        title: '🌟 핵융합 시스템 - 우주의 비밀',
        description: '별을 사용하여 더 강력한 원소를 만들 수 있습니다! 🌌\n\n• 작은 별들을 큰 별로 융합\n• 별을 소모하여 고급 원소 획득\n• 우주에서만 생성되는 특별한 원소들\n• 핵융합의 신비로운 힘을 경험하세요!',
        target: '#star-management-btn',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'molecule-system',
        title: '⚗️ 분자 시스템 - 화학의 조화',
        description: '원소들을 조합하여 분자를 만들 수 있습니다! 🧬\n\n• 분자 합성으로 새로운 카드 생성\n• 분자마다 고유한 특별한 능력\n• 생명, 기체, 산성 등 다양한 분류\n• 화학의 신비로운 조합을 탐험하세요!',
        target: '#molecule-guide-btn',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'energy-system',
        title: '⚡ 에너지 시스템 - 분자의 힘',
        description: '분자를 에너지로 변환하여 특수 능력을 사용하세요! 🔋\n\n• 분자 카드를 에너지로 변환\n• 에너지로 강력한 특수 능력 사용\n• 전체 치료, 공격력 증가 등\n• 전략적 에너지 관리가 승리의 열쇠!',
        target: '#fuel-system-btn',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'online-matching',
        title: '🌐 온라인 매칭 - 전 세계와 대결',
        description: '온라인에서 다른 플레이어와 대결하세요! 🎮\n\n• 실시간 멀티플레이어 대전\n• 다양한 난이도의 상대와 매칭\n• 전 세계 플레이어들과 경쟁\n• 최고의 전략가가 되어보세요!',
        target: '#online-match-btn',
        action: 'highlight',
        highlight: true
      },
      {
        id: 'tutorial-complete',
        title: '🎉 튜토리얼 완료! 원소 대전의 마스터가 되었습니다!',
        description: '축하합니다! 이제 원소 대전의 모든 비밀을 알게 되었습니다! 🏆\n\n• 화학 원소들의 특별한 능력\n• 분자 합성과 핵융합의 신비\n• 전략적 카드 배치와 자원 관리\n• 온라인에서의 치열한 대결\n\n이제 진정한 원소 대전의 마스터가 되어보세요! 🧪✨',
        target: null,
        action: 'show',
        highlight: false
      }
    ];
  }

  bindEvents() {
    // 이벤트 바인딩
    document.getElementById('tutorial-prev').addEventListener('click', () => this.previousStep());
    document.getElementById('tutorial-next').addEventListener('click', () => this.nextStep());
    document.getElementById('tutorial-skip').addEventListener('click', () => this.skipTutorial());
    document.getElementById('tutorial-close').addEventListener('click', () => this.skipTutorial());
    
    // 키보드 이벤트
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      
      if (e.key === 'Escape') {
        this.skipTutorial();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.previousStep();
      }
    });
  }

  startTutorial() {
    this.isActive = true;
    this.currentStep = 0;
    this.showStep();
    this.overlay.classList.remove('hidden');
    
    // 게임 상태 저장 (더 정확한 상태 추적을 위해)
    this.savedGameState = {
      isPlayerTurn: gameState.isPlayerTurn,
      playerHand: [...gameState.playerHand],
      computerHand: [...gameState.computerHand],
      initialDrawCount: gameState.drawCount || 0,
      initialPlayerCoins: gameState.playerCoins || 0,
      initialComputerCoins: gameState.computerCoins || 0
    };
    
    console.log('Tutorial: Starting tutorial with saved state:', this.savedGameState);
    
    // 튜토리얼용 초기 상태 설정
    this.setupTutorialGame();
    
    // 클릭 차단 설정
    this.setupClickBlocking();
    
    // 튜토리얼 시작 효과
    this.showStartEffect();
  }

  showStartEffect() {
    // 시작 축하 효과
    const startOverlay = document.createElement('div');
    startOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, rgba(251, 191, 36, 0.2), rgba(139, 92, 246, 0.2));
      pointer-events: none;
      z-index: 1000;
      animation: tutorial-start-flash 1s ease-out forwards;
    `;
    
    document.body.appendChild(startOverlay);
    
    // 1초 후 제거
    setTimeout(() => {
      if (startOverlay.parentNode) {
        startOverlay.parentNode.removeChild(startOverlay);
      }
    }, 1000);
  }

  setupTutorialGame() {
    // 튜토리얼용 게임 상태 설정
    gameState.isPlayerTurn = true;
    gameState.isGameActive = true;
    
    // 튜토리얼용 카드 제공
    if (gameState.playerHand.length === 0) {
      const hydrogen = gameState.elementsData.find(e => e.symbol === 'H');
      const oxygen = gameState.elementsData.find(e => e.symbol === 'O');
      
      if (hydrogen) {
        const hCard = new ElementCard(hydrogen, hydrogen.baseHp, hydrogen.baseAtk);
        addCardToHand(hCard, 'player');
      }
      
      if (oxygen) {
        const oCard = new ElementCard(oxygen, oxygen.baseHp, oxygen.baseAtk);
        addCardToHand(oCard, 'player');
      }
    }
    
    updateUI();
  }

  showStep() {
    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
      return;
    }

    const step = this.steps[this.currentStep];
    
    // 제목과 설명 업데이트
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-description').textContent = step.description;
    
    // 진행률 업데이트
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;
    document.getElementById('tutorial-progress').textContent = `${this.currentStep + 1} / ${this.steps.length}`;
    document.getElementById('tutorial-progress-bar').style.width = `${progress}%`;
    
    // 진행률에 따른 색상 변화
    const progressBar = document.getElementById('tutorial-progress-bar');
    if (progress < 30) {
      progressBar.className = 'bg-red-400 h-2 rounded-full transition-all duration-300';
    } else if (progress < 70) {
      progressBar.className = 'bg-yellow-400 h-2 rounded-full transition-all duration-300';
    } else {
      progressBar.className = 'bg-green-400 h-2 rounded-full transition-all duration-300';
    }
    
    // 이전/다음 버튼 상태 업데이트
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 0;
    }
    
    if (nextBtn) {
      if (step.waitForAction) {
        // 액션 대기 중일 때는 다음 버튼 비활성화
        nextBtn.disabled = true;
        nextBtn.textContent = '액션 필요';
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        nextBtn.classList.remove('hover:bg-blue-700');
      } else {
        // 액션 대기가 필요하지 않을 때는 정상 활성화
        nextBtn.disabled = false;
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? '완료' : '다음 →';
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        nextBtn.classList.add('hover:bg-blue-700');
      }
    }
    
    // 타겟 하이라이트
    if (step.target && step.highlight) {
      this.highlightTarget(step.target);
    } else {
      this.clearHighlight();
    }
    
    // 툴팁 표시
    if (step.waitForAction && step.target) {
      this.showTooltip(step.target);
    } else {
      this.hideTooltip();
    }
    
    // 액션 콜백 실행
    if (step.action === 'show') {
      this.clearHighlight();
    }
  }

  highlightTarget(selector) {
    this.clearHighlight();
    
    const target = document.querySelector(selector);
    if (!target) {
      console.warn(`Tutorial: Target element not found: ${selector}`);
      return;
    }
    
    const rect = target.getBoundingClientRect();
    const highlight = document.getElementById('tutorial-highlight');
    const blockingLayer = document.getElementById('tutorial-blocking-layer');
    
    // 하이라이트 영역 설정
    highlight.style.left = `${rect.left - 8}px`;
    highlight.style.top = `${rect.top - 8}px`;
    highlight.style.width = `${rect.width + 16}px`;
    highlight.style.height = `${rect.height + 16}px`;
    highlight.style.border = '4px solid #fbbf24';
    highlight.style.borderRadius = '16px';
    highlight.style.boxShadow = '0 0 40px rgba(251, 191, 36, 1), inset 0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.5)';
    highlight.style.pointerEvents = 'auto'; // 클릭 가능하도록 설정
    highlight.style.display = 'block';
    highlight.style.animation = 'tutorial-pulse 1.5s ease-in-out infinite, tutorial-glow 3s ease-in-out infinite';
    highlight.style.zIndex = '45';
    highlight.style.background = 'linear-gradient(45deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))';
    
    // 클릭 이벤트를 하이라이트된 요소로 전달
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Tutorial: Click detected on highlighted element: ${selector}`);
      
      // 실제 타겟 요소로 클릭 이벤트 전달
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        buttons: e.buttons
      });
      
      // 타겟 요소가 실제로 클릭 가능한지 확인
      if (target && typeof target.click === 'function') {
        target.click();
      } else {
        target.dispatchEvent(clickEvent);
      }
      
      // 액션 대기 중인 경우 자동으로 다음 단계로 진행하지 않도록 수정
      const currentStep = this.steps[this.currentStep];
      if (currentStep && currentStep.waitForAction) {
        // 잠시 후 액션 완료 확인
        setTimeout(() => {
          this.checkActionCompletion(currentStep);
        }, 500);
      }
    };
    
    // 기존 이벤트 리스너 제거 후 새로 추가
    highlight.removeEventListener('click', clickHandler);
    highlight.addEventListener('click', clickHandler);
    
    // CSS 애니메이션 추가
    if (!document.getElementById('tutorial-animations')) {
      const style = document.createElement('style');
      style.id = 'tutorial-animations';
      style.textContent = `
        @keyframes tutorial-pulse {
          0%, 100% { 
            box-shadow: 0 0 40px rgba(251, 191, 36, 1), inset 0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.5);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 60px rgba(251, 191, 36, 1.2), inset 0 0 40px rgba(251, 191, 36, 0.5), 0 0 80px rgba(251, 191, 36, 0.7);
            transform: scale(1.05);
          }
        }
        
        @keyframes tutorial-glow {
          0%, 100% { 
            filter: brightness(1) hue-rotate(0deg);
          }
          25% { 
            filter: brightness(1.2) hue-rotate(10deg);
          }
          50% { 
            filter: brightness(1.4) hue-rotate(20deg);
          }
          75% { 
            filter: brightness(1.2) hue-rotate(10deg);
          }
        }
        
        /* 도커 반응형 디자인 */
        @media (max-width: 1024px) {
          #tutorial-docker {
            width: 100vw !important;
            right: 0 !important;
          }
        }
        
        @media (max-width: 768px) {
          #tutorial-docker {
            width: 100vw !important;
            right: 0 !important;
          }
        }
        
        /* 도커 슬라이드 애니메이션 */
        #tutorial-docker {
          animation: slideInFromRight 0.3s ease-out;
        }
        
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes celebration-flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes celebration-particle {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0) rotate(0deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5) translateY(-50px) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.5) translateY(-100px) rotate(360deg);
          }
        }
        
        @keyframes tutorial-start-flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  clearHighlight() {
    const highlight = document.getElementById('tutorial-highlight');
    highlight.style.display = 'none';
  }

  showTooltip(selector) {
    // 도커 내부 툴팁 영역에 표시
    const tooltipArea = document.getElementById('tutorial-tooltip-area');
    const tooltipText = document.getElementById('tutorial-tooltip-text');
    
    if (tooltipArea && tooltipText) {
      const step = this.steps[this.currentStep];
      let tooltipMessage = '💡 하이라이트된 요소를 클릭해보세요!';
      
      // 단계별 맞춤 툴팁 메시지
      switch(step.id) {
        case 'card-info':
          tooltipMessage = '🔍 하이라이트된 카드를 클릭하여 원소의 상세 정보를 확인해보세요!\n\n💡 카드 상세 정보가 열리면 자동으로 다음 단계로 진행됩니다.';
          break;
        case 'card-drawing':
          tooltipMessage = '📦 카드 뽑기 버튼을 클릭하여 새로운 원소를 발견해보세요!\n\n💡 카드를 뽑으면 자동으로 다음 단계로 진행됩니다.';
          break;
        case 'card-placement':
          tooltipMessage = '🎯 카드를 드래그하여 전장의 빈 슬롯에 배치해보세요!\n\n💡 카드가 전장에 배치되면 자동으로 다음 단계로 진행됩니다.';
          break;
        case 'turn-end':
          tooltipMessage = '⏭️ 턴 종료 버튼을 클릭하여 전투를 시작해보세요!\n\n💡 턴이 종료되면 자동으로 다음 단계로 진행됩니다.';
          break;
        default:
          tooltipMessage = '💡 하이라이트된 요소를 클릭해보세요!\n\n💡 액션을 완료하면 자동으로 다음 단계로 진행됩니다.';
      }
      
      tooltipText.textContent = tooltipMessage;
      tooltipArea.classList.remove('hidden');
    }
  }

  hideTooltip() {
    // 도커 내부 툴팁 영역 숨기기
    const tooltipArea = document.getElementById('tutorial-tooltip-area');
    if (tooltipArea) {
      tooltipArea.classList.add('hidden');
    }
  }

  nextStep() {
    const currentStep = this.steps[this.currentStep];
    
    // 액션 대기 중인 경우 체크
    if (currentStep && currentStep.waitForAction) {
      console.log(`Tutorial: Action required for step: ${currentStep.id}`);
      this.checkActionCompletion(currentStep);
      return;
    }
    
    // 액션 대기가 필요하지 않은 경우에만 다음 단계로 진행
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep();
    } else {
      // 마지막 단계인 경우 완료
      this.completeTutorial();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  checkActionCompletion(step) {
    console.log(`Tutorial: Checking action completion for step: ${step.id}`);
    
    // 특정 액션이 완료되었는지 확인
    switch (step.id) {
      case 'card-info':
        // 카드 클릭 완료 확인 (카드 상세 모달이 열렸는지 확인)
        const cardModal = document.getElementById('card-detail-modal');
        if (cardModal && !cardModal.classList.contains('hidden')) {
          console.log('Tutorial: Card detail modal opened, proceeding to next step');
          // 모달이 열렸으면 자동으로 닫고 다음 단계로
          setTimeout(() => {
            if (typeof window.hideCardDetail === 'function') {
              window.hideCardDetail();
            } else {
              cardModal.classList.add('hidden');
            }
            this.currentStep++;
            this.showStep();
          }, 2000); // 2초 후 자동으로 다음 단계로
        } else {
          console.log('Tutorial: Card detail modal not opened yet');
          showMessage('카드를 클릭하여 상세 정보를 확인해주세요!', 'warning');
        }
        break;
        
      case 'card-drawing':
        // 카드 뽑기 완료 확인 - drawCount가 증가했는지 확인
        const initialDrawCount = this.savedGameState?.initialDrawCount || 0;
        if (gameState.drawCount > initialDrawCount) {
          console.log('Tutorial: Card drawing completed, proceeding to next step');
          this.currentStep++;
          this.showStep();
        } else {
          console.log('Tutorial: Card drawing not completed yet');
          showMessage('카드 뽑기 버튼을 클릭해주세요!', 'warning');
        }
        break;
        
      case 'card-placement':
        // 카드 배치 완료 확인
        const hasCardOnField = battlefield.lanes.some(lane => lane.player);
        if (hasCardOnField) {
          console.log('Tutorial: Card placement completed, proceeding to next step');
          this.currentStep++;
          this.showStep();
        } else {
          console.log('Tutorial: Card placement not completed yet');
          showMessage('카드를 전장에 배치해주세요!', 'warning');
        }
        break;
        
      case 'turn-end':
        // 턴 종료 완료 확인
        if (!gameState.isPlayerTurn) {
          console.log('Tutorial: Turn end completed, proceeding to next step');
          this.currentStep++;
          this.showStep();
        } else {
          console.log('Tutorial: Turn end not completed yet');
          showMessage('턴 종료 버튼을 클릭해주세요!', 'warning');
        }
        break;
        
      default:
        console.log('Tutorial: No specific action required, proceeding to next step');
        this.currentStep++;
        this.showStep();
    }
  }

  skipTutorial() {
    this.completeTutorial();
  }

  setupClickBlocking() {
    // 클릭 차단 레이어에서 클릭 이벤트 차단
    const blockingLayer = document.getElementById('tutorial-blocking-layer');
    if (blockingLayer) {
      // 기존 이벤트 리스너 제거
      blockingLayer.removeEventListener('click', this.blockingClickHandler);
      
      // 새로운 클릭 핸들러 정의
      this.blockingClickHandler = (e) => {
        // 하이라이트 영역을 클릭한 경우는 차단하지 않음
        const highlight = document.getElementById('tutorial-highlight');
        if (highlight && highlight.contains(e.target)) {
          return; // 하이라이트 영역 클릭은 허용
        }
        
        // 튜토리얼 도커 영역을 클릭한 경우도 차단하지 않음
        const docker = document.getElementById('tutorial-docker');
        if (docker && docker.contains(e.target)) {
          return; // 도커 영역 클릭은 허용
        }
        
        e.preventDefault();
        e.stopPropagation();
        showMessage('튜토리얼을 진행해주세요!', 'warning');
      };
      
      blockingLayer.addEventListener('click', this.blockingClickHandler);
    }
  }

  completeTutorial() {
    this.isActive = false;
    this.overlay.classList.add('hidden');
    this.clearHighlight();
    this.hideTooltip();
    
    // 클릭 차단 이벤트 리스너 제거
    const blockingLayer = document.getElementById('tutorial-blocking-layer');
    if (blockingLayer && this.blockingClickHandler) {
      blockingLayer.removeEventListener('click', this.blockingClickHandler);
      this.blockingClickHandler = null;
    }
    
    // 게임 상태 복원
    if (this.savedGameState) {
      gameState.isPlayerTurn = this.savedGameState.isPlayerTurn;
      // 필요시 다른 상태도 복원
    }
    
    // 튜토리얼 완료 플래그 저장
    localStorage.setItem('tutorialCompleted', 'true');
    
    // 완료 축하 효과
    this.showCompletionEffect();
    
    showMessage('🎉 축하합니다! 원소 대전의 마스터가 되었습니다! 🧪✨', 'success');
    
    // 완료 콜백 실행
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }
  }

  showCompletionEffect() {
    // 축하 파티클 효과
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.createCelebrationParticle();
      }, i * 50);
    }
    
    // 화면 전체에 축하 효과
    const celebrationOverlay = document.createElement('div');
    celebrationOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 107, 107, 0.1), rgba(139, 92, 246, 0.1));
      pointer-events: none;
      z-index: 1000;
      animation: celebration-flash 2s ease-out forwards;
    `;
    
    document.body.appendChild(celebrationOverlay);
    
    // 2초 후 제거
    setTimeout(() => {
      if (celebrationOverlay.parentNode) {
        celebrationOverlay.parentNode.removeChild(celebrationOverlay);
      }
    }, 2000);
  }

  createCelebrationParticle() {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: linear-gradient(45deg, #ffd700, #ff6b6b, #8b5cf6);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1001;
      left: ${Math.random() * window.innerWidth}px;
      top: ${Math.random() * window.innerHeight}px;
      animation: celebration-particle 3s ease-out forwards;
    `;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  }


  // 콜백 설정
  onComplete(callback) {
    this.callbacks.onComplete = callback;
  }

  // 튜토리얼 완료 여부 확인
  isCompleted() {
    return localStorage.getItem('tutorialCompleted') === 'true';
  }

  // 튜토리얼 리셋
  resetTutorial() {
    localStorage.removeItem('tutorialCompleted');
    this.currentStep = 0;
    this.isActive = false;
  }
}

// DOM이 로드된 후 튜토리얼 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 전역 튜토리얼 시스템 인스턴스
  window.tutorialSystem = new TutorialSystem();
  
  console.log("Tutorial system initialized!");
});

// 튜토리얼 시작 함수
function startTutorial() {
  if (window.tutorialSystem) {
    window.tutorialSystem.startTutorial();
  } else {
    console.warn("Tutorial system not ready yet, retrying...");
    // 튜토리얼 시스템이 아직 로드되지 않은 경우 잠시 후 재시도
    setTimeout(() => {
      if (window.tutorialSystem) {
        window.tutorialSystem.startTutorial();
      } else {
        console.error("Tutorial system failed to load!");
        if (typeof showMessage === 'function') {
          showMessage('튜토리얼 시스템을 로드할 수 없습니다. 페이지를 새로고침해주세요.', 'error');
        }
      }
    }, 100);
  }
}

// 튜토리얼 완료 여부 확인
function isTutorialCompleted() {
  return window.tutorialSystem ? window.tutorialSystem.isCompleted() : false;
}

// 튜토리얼 리셋
function resetTutorial() {
  if (window.tutorialSystem) {
    window.tutorialSystem.resetTutorial();
  }
}

// 전역 함수로 노출 (즉시 사용 가능하도록)
window.startTutorial = startTutorial;
window.isTutorialCompleted = isTutorialCompleted;
window.resetTutorial = resetTutorial;
