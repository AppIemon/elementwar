// 별 관리 시스템 (새로운 시스템)
class StarManagement {
  constructor() {
    this.stars = 0; // 현재 활성 별 수
    this.totalStarsCreated = 0; // 총 생성된 별 수
    this.supernovaQueue = []; // 초신성 대기열
    this.supernovaTurnDelay = 3; // 별 생성 후 초신성까지의 턴 수
    this.fusedStars = { player: [], computer: [] }; // 융합된 별들
    
    // 새로운 시스템
    this.starLevel = 1; // 별 레벨 (1부터 시작)
    this.starExp = 0; // 현재 경험치
    this.starSystemActive = false; // 별 시스템 활성화 여부 (100턴부터)
    this.starSystemStartTurn = 100; // 별 시스템 시작 턴
    this.unlockedSupernovaGachas = []; // 해금된 초신성 뽑기들
    
    // 초신성 뽑기 정의 (레벨 기반)
    this.supernovaGachas = [
      { id: 'supernova_1', name: '1차 초신성', range: [27, 37], unlockRequirement: 2, cost: 1 },
      { id: 'supernova_2', name: '2차 초신성', range: [38, 48], unlockRequirement: 4, cost: 2 },
      { id: 'supernova_3', name: '3차 초신성', range: [49, 59], unlockRequirement: 6, cost: 3 },
      { id: 'supernova_4', name: '4차 초신성', range: [60, 70], unlockRequirement: 8, cost: 4 },
      { id: 'supernova_5', name: '5차 초신성', range: [71, 81], unlockRequirement: 10, cost: 5 },
      { id: 'supernova_6', name: '6차 초신성', range: [82, 92], unlockRequirement: 12, cost: 6 },
      { id: 'supernova_7', name: '7차 초신성', range: [93, 99], unlockRequirement: 14, cost: 7 },
      { id: 'supernova_8', name: '8차 초신성', range: [100, 106], unlockRequirement: 16, cost: 8 },
      { id: 'supernova_9', name: '9차 초신성', range: [107, 112], unlockRequirement: 18, cost: 9 },
      { id: 'supernova_10', name: '10차 초신성', range: [113, 118], unlockRequirement: 20, cost: 10 }
    ];
  }

  // 레벨별 필요 경험치 계산 (지수적 증가)
  getRequiredExp(level) {
    // 레벨 1: 100, 레벨 2: 200, 레벨 3: 400, 레벨 4: 800... (2배씩 증가)
    return Math.floor(100 * Math.pow(2, level - 1));
  }

  // 현재 레벨에서 다음 레벨까지 필요한 경험치
  getExpToNextLevel() {
    return this.getRequiredExp(this.starLevel) - this.starExp;
  }

  // 경험치 추가 및 레벨업 처리
  addExp(amount) {
    this.starExp += amount;
    let leveledUp = false;
    
    // 레벨업 체크
    while (this.starExp >= this.getRequiredExp(this.starLevel)) {
      this.starExp -= this.getRequiredExp(this.starLevel);
      this.starLevel++;
      leveledUp = true;
      
      // 초신성 뽑기 해금 체크
      this.checkSupernovaGachaUnlocks();
      
      showMessage(`🌟 별이 레벨 ${this.starLevel}로 성장했습니다!`, 'star');
    }
    
    return leveledUp;
  }

  // 별 생성 (Fe 변환) - 제거됨
  // createStarsFromFe(feCount) {
  //   // 철을 별로 변환하는 기능이 제거되었습니다.
  //   return 0;
  // }

  // 별 생성 (고원자번호 원소 변환) - 제거됨
  // createStarsFromHeavyElements(elementSymbol, amount) {
  //   // 고원자번호 원소를 별로 변환하는 기능이 제거되었습니다.
  //   return 0;
  // }

  // 융합된 별 추가
  addFusedStar(grade, side = 'player') {
    const starInfo = window.starCurrency.starGrades[grade];
    if (!starInfo) return false;

    const fusedStar = {
      id: Date.now() + Math.random(),
      grade: grade,
      size: starInfo.size,
      elementRange: starInfo.elementRange,
      createdAt: Date.now(),
      turnsRemaining: this.supernovaTurnDelay
    };

    this.fusedStars[side].push(fusedStar);
    this.stars++;
    this.totalStarsCreated++;
    
    // 초신성 대기열에도 추가
    this.supernovaQueue.push({
      id: fusedStar.id,
      turnsRemaining: this.supernovaTurnDelay,
      createdAt: Date.now(),
      grade: grade,
      side: side
    });

    showMessage(`⭐ ${starInfo.name}이 생성되었습니다!`, 'star');
    return true;
  }

  // 턴 진행 시 초신성 처리 및 별 시스템 활성화
  processTurn() {
    const supernovas = [];
    
    // 100턴부터 별 시스템 활성화
    if (!this.starSystemActive && gameState.turnCount >= this.starSystemStartTurn) {
      this.activateStarSystem();
    }
    
    // 헬륨으로 인한 초신성 턴 감소 계산
    const heliumCount = gameState.fusionSystem ? (gameState.fusionSystem.materials.He || 0) : 0;
    const turnReduction = Math.floor(heliumCount / 10); // 헬륨 10개당 1턴 감소
    
    // 대기열의 각 별의 남은 턴 수 감소
    this.supernovaQueue = this.supernovaQueue.map(star => {
      // 기본 턴 감소
      star.turnsRemaining--;
      
      // 헬륨으로 인한 추가 턴 감소
      if (turnReduction > 0) {
        star.turnsRemaining = Math.max(0, star.turnsRemaining - turnReduction);
      }
      
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
    
    // 헬륨 효과 메시지 표시
    if (turnReduction > 0 && supernovas.length > 0) {
      showMessage(`💫 헬륨 ${heliumCount}개로 초신성 턴 ${turnReduction}턴 단축!`, 'star');
    }
    
    return supernovas.length;
  }

  // 별 시스템 활성화 (100턴부터)
  activateStarSystem() {
    this.starSystemActive = true;
    this.stars = 1; // 별 하나 생성
    this.totalStarsCreated = 1;
    
    showMessage(`🌟 100턴 달성! 별 시스템이 활성화되었습니다!`, 'star');
    this.updateUI();
  }


  // 원소로 별 키우기 (경험치 시스템)
  growStarWithElements(elementSymbol, amount = 1) {
    // 별 시스템이 활성화되지 않은 경우 무시
    if (!this.starSystemActive) {
      return 0;
    }
    
    let expAdded = 0;
    
    // 원소 그룹별 경험치 가중치
    if (['Li', 'Be', 'Na', 'Mg', 'Al'].includes(elementSymbol)) {
      expAdded = amount * 1; // 경금속류 +1 경험치
    } else if (['Si', 'P', 'S', 'Ca'].includes(elementSymbol)) {
      expAdded = amount * 5; // 중금속류 +5 경험치
    } else if (['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe'].includes(elementSymbol)) {
      expAdded = amount * 30; // 철족 금속류 +30 경험치
    }
    
    if (expAdded > 0) {
      const leveledUp = this.addExp(expAdded);
      
      if (!leveledUp) {
        showMessage(`🌟 ${elementSymbol} 원소로 별이 성장했습니다! (+${expAdded} 경험치)`, 'star');
      }
      
      this.updateUI();
      return expAdded;
    }
    
    return 0;
  }

  // 초신성 뽑기 해금 체크 (레벨 기반)
  checkSupernovaGachaUnlocks() {
    this.supernovaGachas.forEach(gacha => {
      if (this.starLevel >= gacha.unlockRequirement && !this.unlockedSupernovaGachas.includes(gacha.id)) {
        this.unlockedSupernovaGachas.push(gacha.id);
        showMessage(`🌟 ${gacha.name} 뽑기가 해금되었습니다!`, 'star');
      }
    });
  }

  // 초신성 뽑기 실행
  performSupernovaGacha(gachaId) {
    // 별 시스템이 활성화되지 않은 경우
    if (!this.starSystemActive) {
      showMessage('100턴부터 별 시스템을 사용할 수 있습니다!', 'warning');
      return false;
    }
    
    const gacha = this.supernovaGachas.find(g => g.id === gachaId);
    if (!gacha || !this.unlockedSupernovaGachas.includes(gachaId)) {
      showMessage('해금되지 않은 초신성 뽑기입니다!', 'warning');
      return false;
    }
    
    if (this.stars < gacha.cost) {
      showMessage(`별이 부족합니다! (필요: ${gacha.cost}개)`, 'warning');
      return false;
    }
    
    // 별 소모
    this.stars -= gacha.cost;
    
    // 랜덤 원소 생성
    const [minElement, maxElement] = gacha.range;
    const randomElementNumber = Math.floor(Math.random() * (maxElement - minElement + 1)) + minElement;
    const element = gameState.elementsData.find(e => e.number === randomElementNumber);
    
    if (element && gameState.fusionSystem) {
      gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
      showMessage(`🌟 ${gacha.name}! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'star');
      
      // 특별한 초신성 애니메이션
      this.showSupernovaGachaAnimation(gacha);
      
      this.updateUI();
      return true;
    }
    
    return false;
  }

  // 초신성 뽑기 애니메이션
  showSupernovaGachaAnimation(gacha) {
    const container = document.querySelector('.battlefield-container');
    if (container) {
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'supernova-gacha-particle';
        particle.style.cssText = `
          position: absolute;
          width: 6px;
          height: 6px;
          background: radial-gradient(circle, #fbbf24, #f59e0b, #dc2626);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          animation: supernova-gacha-explosion 3s ease-out forwards;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 3000);
      }
    }
  }

  // 초신성 실행 (1~26번 원소 획득)
  performSupernova(star) {
    // 융합된 별인 경우 등급에 따른 원소 범위 사용
    if (star.grade && star.side) {
      const starInfo = window.starCurrency.starGrades[star.grade];
      if (starInfo) {
        const [minElement, maxElement] = starInfo.elementRange;
        const randomElementNumber = Math.floor(Math.random() * (maxElement - minElement + 1)) + minElement;
        const element = gameState.elementsData.find(e => e.number === randomElementNumber);
        
        if (element) {
          // 핵융합 시스템에 원소 추가
          if (gameState.fusionSystem) {
            gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
          }
          
          // 메시지 표시
          showMessage(`🌟 ${starInfo.name} 초신성! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'star');
          
          // 애니메이션 효과
          this.showSupernovaAnimation();
        }
      } else {
        // 기본 범위 (1-26번 원소)
        const randomElementNumber = Math.floor(Math.random() * 26) + 1;
        const element = gameState.elementsData.find(e => e.number === randomElementNumber);
        
        if (element) {
          // 핵융합 시스템에 원소 추가
          if (gameState.fusionSystem) {
            gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
          }
          
          // 메시지 표시
          showMessage(`🌟 별 초신성! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'star');
          
          // 애니메이션 효과
          this.showSupernovaAnimation();
        }
      }
    } else {
      // 기본 범위 (1-26번 원소)
      const randomElementNumber = Math.floor(Math.random() * 26) + 1;
      const element = gameState.elementsData.find(e => e.number === randomElementNumber);
      
      if (element) {
        // 핵융합 시스템에 원소 추가
        if (gameState.fusionSystem) {
          gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
        }
        
        // 메시지 표시
        showMessage(`🌟 별 초신성! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'star');
        
        // 애니메이션 효과
        this.showSupernovaAnimation();
      }
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

  // 우주 모달 표시
  showStarManagementModal() {
    const modal = document.getElementById('star-management-modal');
    if (modal) {
      // 별 재화 시스템 UI 업데이트
      if (window.starCurrency) {
        window.starCurrency.updateUI();
      }
      // 별 관리 시스템 UI 업데이트
      this.updateUI();
      // 별 융합 UI 업데이트
      if (window.starFusionUI) {
        window.starFusionUI.updateUI();
      }
      modal.classList.remove('hidden');
    }
  }

  // 우주 모달 숨김
  hideStarManagementModal() {
    const modal = document.getElementById('star-management-modal');
    if (modal) {
      modal.classList.add('hidden');
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
    
    // 별 레벨 표시
    const starLevelEl = document.getElementById('star-level-count');
    if (starLevelEl) {
      starLevelEl.textContent = `Lv.${this.starLevel}`;
    }
    
    // 별 경험치 표시
    const starExpEl = document.getElementById('star-exp-count');
    if (starExpEl) {
      const expToNext = this.getExpToNextLevel();
      const requiredExp = this.getRequiredExp(this.starLevel);
      starExpEl.textContent = `${this.starExp}/${requiredExp} (${expToNext} 남음)`;
    }
    
    // 별 경험치 바 업데이트
    const starExpBar = document.getElementById('star-exp-bar');
    if (starExpBar) {
      const requiredExp = this.getRequiredExp(this.starLevel);
      const expPercent = (this.starExp / requiredExp) * 100;
      starExpBar.style.width = `${expPercent}%`;
    }
    
    // 별 시스템 활성화 상태 표시
    const nextAutoGenEl = document.getElementById('next-auto-generation');
    if (nextAutoGenEl) {
      if (!this.starSystemActive) {
        const remainingTurns = this.starSystemStartTurn - (gameState.turnCount || 0);
        nextAutoGenEl.textContent = `${remainingTurns}턴 후 별 시스템 활성화`;
      } else {
        nextAutoGenEl.textContent = '별 시스템 활성화됨';
      }
    }
    
    // 초신성 뽑기 UI 업데이트
    this.updateSupernovaGachaUI();
    
    // 초신성 대기열 업데이트
    this.updateSupernovaQueue();
  }

  // 초신성 뽑기 UI 업데이트
  updateSupernovaGachaUI() {
    const container = document.getElementById('supernova-gacha-container');
    if (!container) return;
    
    // 별 시스템이 비활성화된 경우
    if (!this.starSystemActive) {
      const remainingTurns = this.starSystemStartTurn - (gameState.turnCount || 0);
      container.innerHTML = `
        <div class="col-span-full bg-gray-600 p-6 rounded text-center">
          <div class="text-4xl mb-4">⏰</div>
          <h4 class="text-xl font-bold text-gray-300 mb-2">별 시스템 대기 중</h4>
          <p class="text-gray-400">${remainingTurns}턴 후 별 시스템이 활성화됩니다</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.supernovaGachas.map(gacha => {
      const isUnlocked = this.unlockedSupernovaGachas.includes(gacha.id);
      const canAfford = this.stars >= gacha.cost;
      
      return `
        <div class="bg-gray-600 p-4 rounded ${isUnlocked ? '' : 'opacity-50'}">
          <h4 class="text-lg font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-400'} mb-2">
            ${gacha.name}
          </h4>
          <p class="text-sm text-gray-300 mb-2">
            원소 범위: ${gacha.range[0]}-${gacha.range[1]}번
          </p>
          <p class="text-sm text-gray-300 mb-2">
            해금 조건: 별 레벨 ${gacha.unlockRequirement}
          </p>
          <p class="text-sm text-gray-300 mb-3">
            비용: ${gacha.cost}개 별
          </p>
          <button 
            id="supernova-gacha-${gacha.id}" 
            class="w-full py-2 px-4 rounded ${isUnlocked && canAfford ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}"
            ${!isUnlocked || !canAfford ? 'disabled' : ''}
          >
            ${!isUnlocked ? '해금 필요' : !canAfford ? '별 부족' : '뽑기 실행'}
          </button>
        </div>
      `;
    }).join('');
    
    // 이벤트 리스너 추가
    this.supernovaGachas.forEach(gacha => {
      const button = document.getElementById(`supernova-gacha-${gacha.id}`);
      if (button) {
        button.addEventListener('click', () => {
          this.performSupernovaGacha(gacha.id);
        });
      }
    });
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
      supernovaQueue: this.supernovaQueue,
      fusedStars: this.fusedStars,
      starLevel: this.starLevel,
      starExp: this.starExp,
      starSystemActive: this.starSystemActive,
      unlockedSupernovaGachas: this.unlockedSupernovaGachas
    };
  }

  // 컴퓨터 데이터 저장
  saveComputerData() {
    if (window.computerStarManagement) {
      return window.computerStarManagement.saveData();
    }
    return null;
  }

  // 데이터 로드
  loadData(data) {
    if (data) {
      this.stars = data.stars || 0;
      this.totalStarsCreated = data.totalStarsCreated || 0;
      this.supernovaQueue = data.supernovaQueue || [];
      this.fusedStars = data.fusedStars || { player: [], computer: [] };
      this.starLevel = data.starLevel || 1;
      this.starExp = data.starExp || 0;
      this.starSystemActive = data.starSystemActive || false;
      this.unlockedSupernovaGachas = data.unlockedSupernovaGachas || [];
    }
  }

  // 컴퓨터 데이터 로드
  loadComputerData(data) {
    if (data && window.computerStarManagement) {
      window.computerStarManagement.loadData(data);
    }
  }
}

// CSS 애니메이션 추가
const starStyle = document.createElement('style');
starStyle.textContent = `
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
  
  @keyframes supernova-gacha-explosion {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0) rotate(0deg);
    }
    25% {
      opacity: 0.9;
      transform: scale(1.5) translateY(-30px) rotate(90deg);
    }
    50% {
      opacity: 0.8;
      transform: scale(2.5) translateY(-60px) rotate(180deg);
    }
    75% {
      opacity: 0.6;
      transform: scale(3) translateY(-90px) rotate(270deg);
    }
    100% {
      opacity: 0;
      transform: scale(0.5) translateY(-150px) rotate(360deg);
    }
  }
  
  .supernova-particle {
    box-shadow: 0 0 10px #fbbf24, 0 0 20px #f59e0b;
  }
  
  .supernova-gacha-particle {
    box-shadow: 0 0 15px #fbbf24, 0 0 30px #f59e0b, 0 0 45px #dc2626;
  }
`;
document.head.appendChild(starStyle);

// 전역 인스턴스
window.starManagement = new StarManagement();

// 우주 모달 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
  // 우주 모달 열기 버튼
  const starManagementBtn = document.getElementById('star-management-btn');
  if (starManagementBtn) {
    starManagementBtn.addEventListener('click', () => {
      window.starManagement.showStarManagementModal();
    });
  }

  // 우주 모달 닫기 버튼
  const closeStarManagementModal = document.getElementById('close-star-management-modal');
  if (closeStarManagementModal) {
    closeStarManagementModal.addEventListener('click', () => {
      window.starManagement.hideStarManagementModal();
    });
  }
});
