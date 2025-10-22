// 별 관리 시스템
class StarManagement {
  constructor() {
    this.stars = 0; // 현재 활성 별 수
    this.totalStarsCreated = 0; // 총 생성된 별 수
    this.supernovaQueue = []; // 초신성 대기열
    this.supernovaTurnDelay = 3; // 별 생성 후 초신성까지의 턴 수
  }

  // 별 생성 (Fe 변환)
  createStarsFromFe(feCount) {
    const starsGained = Math.floor(feCount / 5);
    if (starsGained > 0) {
      this.stars += starsGained;
      this.totalStarsCreated += starsGained;
      
      // 각 별을 초신성 대기열에 추가
      for (let i = 0; i < starsGained; i++) {
        this.supernovaQueue.push({
          id: Date.now() + Math.random(),
          turnsRemaining: this.supernovaTurnDelay,
          createdAt: Date.now()
        });
      }
      
      return starsGained;
    }
    return 0;
  }

  // 별 생성 (고원자번호 원소 변환)
  createStarsFromHeavyElements(elementSymbol, amount) {
    const element = gameState.elementsData.find(e => e.symbol === elementSymbol);
    if (!element) return 0;
    
    // 원자번호가 높을수록 더 많은 별 생성
    const starsPerElement = Math.floor(element.number / 10);
    const starsGained = starsPerElement * amount;
    
    if (starsGained > 0) {
      this.stars += starsGained;
      this.totalStarsCreated += starsGained;
      
      // 각 별을 초신성 대기열에 추가
      for (let i = 0; i < starsGained; i++) {
        this.supernovaQueue.push({
          id: Date.now() + Math.random(),
          turnsRemaining: this.supernovaTurnDelay,
          createdAt: Date.now()
        });
      }
      
      return starsGained;
    }
    return 0;
  }

  // 턴 진행 시 초신성 처리
  processTurn() {
    const supernovas = [];
    
    // 대기열의 각 별의 남은 턴 수 감소
    this.supernovaQueue = this.supernovaQueue.map(star => {
      star.turnsRemaining--;
      if (star.turnsRemaining <= 0) {
        supernovas.push(star);
        this.stars--; // 활성 별 수 감소
      }
      return star;
    }).filter(star => star.turnsRemaining > 0); // 완료된 별 제거
    
    // 초신성 실행
    supernovas.forEach(star => {
      this.performSupernova(star);
    });
    
    return supernovas.length;
  }

  // 초신성 실행 (랜덤 원소 획득)
  performSupernova(star) {
    // 랜덤 원소 생성 (1-92번 원소 중에서)
    const randomElementNumber = Math.floor(Math.random() * 92) + 1;
    const element = gameState.elementsData.find(e => e.number === randomElementNumber);
    
    if (element) {
      // 핵융합 시스템에 원소 추가
      if (gameState.fusionSystem) {
        gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
      }
      
      // 메시지 표시
      showMessage(`🌟 초신성! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'star');
      
      // 애니메이션 효과
      this.showSupernovaAnimation();
    }
  }

  // 초신성 애니메이션
  showSupernovaAnimation() {
    // 간단한 파티클 효과
    const container = document.querySelector('.battlefield-container');
    if (container) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'supernova-particle';
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, #fbbf24, #f59e0b);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          animation: supernova-explosion 2s ease-out forwards;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 2000);
      }
    }
  }

  // UI 업데이트
  updateUI() {
    // 활성 별 수
    const activeStarsEl = document.getElementById('active-stars-count');
    if (activeStarsEl) {
      activeStarsEl.textContent = this.stars;
    }
    
    // 대기 중인 초신성 수
    const pendingSupernovasEl = document.getElementById('pending-supernovas-count');
    if (pendingSupernovasEl) {
      pendingSupernovasEl.textContent = this.supernovaQueue.length;
    }
    
    // 총 생성된 별 수
    const totalStarsEl = document.getElementById('total-stars-created');
    if (totalStarsEl) {
      totalStarsEl.textContent = this.totalStarsCreated;
    }
    
    // Fe 수량
    const feCountEl = document.getElementById('fe-count');
    if (feCountEl && gameState.fusionSystem) {
      const feCount = gameState.fusionSystem.materials.Fe || 0;
      feCountEl.textContent = feCount;
      
      // Fe → 별 변환 버튼 상태
      const convertFeBtn = document.getElementById('convert-fe-to-stars');
      if (convertFeBtn) {
        const canConvert = feCount >= 5;
        convertFeBtn.disabled = !canConvert;
        convertFeBtn.textContent = canConvert ? `별 생성 (${Math.floor(feCount / 5)}개)` : '별 생성 불가';
      }
    }
    
    // 고원자번호 원소 수량
    const heavyElementsEl = document.getElementById('heavy-elements-count');
    if (heavyElementsEl && gameState.fusionSystem) {
      let heavyCount = 0;
      for (const [symbol, count] of Object.entries(gameState.fusionSystem.materials)) {
        const element = gameState.elementsData.find(e => e.symbol === symbol);
        if (element && element.number > 20 && count > 0) {
          heavyCount += count;
        }
      }
      heavyElementsEl.textContent = heavyCount;
      
      // 고원소 → 별 변환 버튼 상태
      const convertHeavyBtn = document.getElementById('convert-heavy-to-stars');
      if (convertHeavyBtn) {
        convertHeavyBtn.disabled = heavyCount === 0;
        convertHeavyBtn.textContent = heavyCount > 0 ? '별 생성 가능' : '별 생성 불가';
      }
    }
    
    // 초신성 대기열 업데이트
    this.updateSupernovaQueue();
  }

  // 초신성 대기열 UI 업데이트
  updateSupernovaQueue() {
    const queueEl = document.getElementById('supernova-queue');
    if (!queueEl) return;
    
    if (this.supernovaQueue.length === 0) {
      queueEl.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <div class="text-4xl mb-2">🌌</div>
          <p>대기 중인 초신성이 없습니다</p>
        </div>
      `;
    } else {
      queueEl.innerHTML = this.supernovaQueue.map(star => `
        <div class="bg-gray-600 p-3 rounded flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-2xl">⭐</div>
            <div>
              <div class="text-sm text-gray-300">초신성까지</div>
              <div class="text-lg font-bold text-orange-400">${star.turnsRemaining}턴</div>
            </div>
          </div>
          <div class="text-xs text-gray-400">
            ${new Date(star.createdAt).toLocaleTimeString()}
          </div>
        </div>
      `).join('');
    }
  }

  // 데이터 저장
  saveData() {
    return {
      stars: this.stars,
      totalStarsCreated: this.totalStarsCreated,
      supernovaQueue: this.supernovaQueue
    };
  }

  // 데이터 로드
  loadData(data) {
    if (data) {
      this.stars = data.stars || 0;
      this.totalStarsCreated = data.totalStarsCreated || 0;
      this.supernovaQueue = data.supernovaQueue || [];
    }
  }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes supernova-explosion {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    50% {
      opacity: 0.8;
      transform: scale(2) translateY(-20px);
    }
    100% {
      opacity: 0;
      transform: scale(0.5) translateY(-100px);
    }
  }
  
  .supernova-particle {
    box-shadow: 0 0 10px #fbbf24, 0 0 20px #f59e0b;
  }
`;
document.head.appendChild(style);

// 전역 인스턴스
window.starManagement = new StarManagement();
