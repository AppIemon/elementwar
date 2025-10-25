// 별 융합 UI 관리 (우주 모달에 통합됨)
class StarFusionUI {
  constructor() {
    this.starManagementModal = null;
    this.init();
  }

  init() {
    this.starManagementModal = document.getElementById('star-management-modal');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 별 융합 버튼들 (우주 모달 내부)
    this.setupFusionButtons();
    
    // 별 변환 버튼들 (우주 모달 내부)
    this.setupConversionButtons();
  }

  setupFusionButtons() {
    const grades = ['small', 'medium', 'large', 'giant']; // 꽝(dud) 제외
    
    grades.forEach(grade => {
      const button = document.getElementById(`fuse-${grade}-star`);
      if (button) {
        button.addEventListener('click', () => {
          if (window.starCurrency) {
            const success = window.starCurrency.fuseStars(grade, 'player');
            if (success) {
              this.updateUI();
              // 우주 시스템 UI 업데이트
              if (window.starManagement) {
                window.starManagement.updateUI();
              }
            } else {
              showMessage('별이 부족합니다!', 'warning');
            }
          }
        });
      }
    });
  }

  setupConversionButtons() {
    const grades = ['small', 'medium', 'large', 'giant']; // 꽝(dud) 제외
    
    grades.forEach(grade => {
      const button = document.getElementById(`convert-${grade}-star`);
      if (button) {
        button.addEventListener('click', () => {
          if (window.starCurrency) {
            const success = window.starCurrency.convertStarToElement(grade, 'player');
            if (success) {
              this.updateUI();
              // 우주 시스템 UI 업데이트
              if (window.starManagement) {
                window.starManagement.updateUI();
              }
              // 메인 UI도 업데이트
              if (window.fusionUI && typeof window.fusionUI.updateMainUI === 'function') {
                window.fusionUI.updateMainUI();
              }
            } else {
              showMessage('별이 부족합니다!', 'warning');
            }
          }
        });
      }
    });
  }

  // 변환 버튼 상태 업데이트
  updateConversionButtons() {
    if (!window.starCurrency) return;
    
    const playerStars = window.starCurrency.getStarCount('player');
    const grades = ['small', 'medium', 'large', 'giant'];
    
    grades.forEach(grade => {
      const button = document.getElementById(`convert-${grade}-star`);
      if (button) {
        const canConvert = playerStars >= 1; // 모든 등급은 1개 별로 변환 가능
        button.disabled = !canConvert;
        button.textContent = canConvert ? 
          `${this.getGradeName(grade)} 변환 (1개)` : 
          `${this.getGradeName(grade)} 변환 불가`;
      }
    });
  }

  // 등급 이름 가져오기
  getGradeName(grade) {
    const names = {
      'small': '작은 별',
      'medium': '중간 별', 
      'large': '큰 별',
      'giant': '거대 별'
    };
    return names[grade] || grade;
  }

  // 우주 모달에서 별 융합 기능 사용
  showStarFusionModal() {
    // 이제 우주 모달에서 처리됨
    if (window.starManagement) {
      window.starManagement.showStarManagementModal();
    }
  }

  hideStarFusionModal() {
    // 이제 우주 모달에서 처리됨
    if (window.starManagement) {
      window.starManagement.hideStarManagementModal();
    }
  }

  updateUI() {
    if (window.starCurrency) {
      window.starCurrency.updateUI();
    }
    // 별 변환 버튼 상태 업데이트
    this.updateConversionButtons();
  }
}

// 전역 인스턴스
window.starFusionUI = new StarFusionUI();
