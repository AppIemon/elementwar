// 별 관리 시스템
class StarManagement {
  constructor() {
    this.stars = 0; // 현재 활성 별 수
    this.totalStarsCreated = 0; // 총 생성된 별 수
    this.supernovaQueue = []; // 초신성 대기열
    this.supernovaTurnDelay = 3; // 별 생성 후 초신성까지의 턴 수
    this.fusedStars = { player: [], computer: [] }; // 융합된 별들
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

  // 턴 진행 시 초신성 처리
  processTurn() {
    const supernovas = [];
    
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
    
    // Fe 수량
    const feCountEl = document.getElementById('fe-count');
    if (feCountEl && gameState.fusionSystem) {
      const feCount = gameState.fusionSystem.materials.Fe || 0;
      feCountEl.textContent = feCount;
      
      // Fe → 별 변환 버튼 제거됨
    }
    
    // 고원자번호 원소 관련 UI 제거됨
    
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
      supernovaQueue: this.supernovaQueue,
      fusedStars: this.fusedStars
    };
  }

  // 데이터 로드
  loadData(data) {
    if (data) {
      this.stars = data.stars || 0;
      this.totalStarsCreated = data.totalStarsCreated || 0;
      this.supernovaQueue = data.supernovaQueue || [];
      this.fusedStars = data.fusedStars || { player: [], computer: [] };
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
  
  .supernova-particle {
    box-shadow: 0 0 10px #fbbf24, 0 0 20px #f59e0b;
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
