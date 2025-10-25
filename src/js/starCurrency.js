// 별 재화 시스템
export class StarCurrency {
  constructor() {
    this.playerStars = 0; // 플레이어의 별 재화
    this.computerStars = 0; // 컴퓨터의 별 재화
    this.starMass = 0; // 현재 별 질량
    this.starGrades = {
      // 별 등급별 정보 (꽝 제거, 1~26원소만 생성)
      small: { name: '작은 별', size: 1, elementRange: [1, 26], cost: 1, massRequired: 10 },
      medium: { name: '중간 별', size: 2, elementRange: [1, 26], cost: 3, massRequired: 50 },
      large: { name: '큰 별', size: 3, elementRange: [1, 26], cost: 7, massRequired: 200 },
      giant: { name: '거대 별', size: 4, elementRange: [1, 26], cost: 15, massRequired: 500 }
    };
    
    // 원소 그룹별 질량 가중치
    this.elementGroups = {
      // 🌱 경금속류 (Light metals) - 별 질량 +1
      lightMetals: ['Li', 'Be', 'Na', 'Mg', 'Al'],
      // ⚙️ 중금속류 (Intermediate metals) - 별 질량 +5
      intermediateMetals: ['Si', 'P', 'S', 'Ca'],
      // 💣 철족 금속류 (Iron group metals) - 별 질량 +30
      ironGroupMetals: ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe']
    };
  }

  // 별 획득 (H, He 대량으로)
  gainStarsFromHydrogenHelium(hydrogenCount, heliumCount, side = 'player') {
    let starsGained = 0;
    
    // 수소 100개당 별 1개
    starsGained += Math.floor(hydrogenCount / 100);
    
    // 헬륨 50개당 별 1개
    starsGained += Math.floor(heliumCount / 50);
    
    if (starsGained > 0) {
      if (side === 'player') {
        this.playerStars += starsGained;
      } else {
        this.computerStars += starsGained;
      }
      
      this.updateUI();
    }
    
    return starsGained;
  }

  // 기존 별 획득 메서드 (하위 호환성을 위해 유지하지만 사용하지 않음)
  gainStars(elementNumber, side = 'player') {
    // 더 이상 원소 처치로 별을 획득하지 않음
    return 0;
  }

  // 원소로부터 별 질량 추가
  addStarMass(elementSymbol, amount = 1) {
    let massAdded = 0;
    
    if (this.elementGroups.lightMetals.includes(elementSymbol)) {
      massAdded = amount * 1; // 경금속류 +1
    } else if (this.elementGroups.intermediateMetals.includes(elementSymbol)) {
      massAdded = amount * 5; // 중금속류 +5
    } else if (this.elementGroups.ironGroupMetals.includes(elementSymbol)) {
      massAdded = amount * 30; // 철족 금속류 +30
    }
    
    this.starMass += massAdded;
    this.updateUI();
    
    // 질량이 충분하면 별 생성 가능 여부 확인
    this.checkStarGeneration();
    
    return massAdded;
  }

  // 별 생성 가능 여부 확인 및 자동 생성
  checkStarGeneration() {
    const availableGrades = Object.keys(this.starGrades).filter(grade => 
      this.starMass >= this.starGrades[grade].massRequired
    );
    
    if (availableGrades.length > 0) {
      // 가장 높은 등급의 별 생성
      const highestGrade = availableGrades[availableGrades.length - 1];
      this.generateStarFromMass(highestGrade);
    }
  }

  // 질량으로부터 별 생성
  generateStarFromMass(grade) {
    const starInfo = this.starGrades[grade];
    if (!starInfo || this.starMass < starInfo.massRequired) return false;
    
    // 질량 소모
    this.starMass -= starInfo.massRequired;
    
    // 별 생성
    if (window.starManagement) {
      window.starManagement.addFusedStar(grade, 'player');
    }
    
    showMessage(`⭐ ${starInfo.name}이 질량 ${starInfo.massRequired}으로 생성되었습니다!`, 'star');
    this.updateUI();
    
    return true;
  }

  // 현재 별 질량 가져오기
  getStarMass() {
    return this.starMass;
  }

  // 별 질량으로 생성 가능한 최고 등급 확인
  getAvailableStarGrade() {
    const availableGrades = Object.keys(this.starGrades).filter(grade => 
      this.starMass >= this.starGrades[grade].massRequired
    );
    
    return availableGrades.length > 0 ? availableGrades[availableGrades.length - 1] : null;
  }

  // 별 소모
  spendStars(amount, side = 'player') {
    if (side === 'player') {
      if (this.playerStars >= amount) {
        this.playerStars -= amount;
        this.updateUI();
        return true;
      }
    } else {
      if (this.computerStars >= amount) {
        this.computerStars -= amount;
        this.updateUI();
        return true;
      }
    }
    return false;
  }

  // 별 개수 확인
  getStarCount(side = 'player') {
    return side === 'player' ? this.playerStars : this.computerStars;
  }

  // 별 융합 (작은 별들을 큰 별로 만들기)
  fuseStars(grade, side = 'player') {
    const starInfo = this.starGrades[grade];
    if (!starInfo) return false;

    const currentStars = this.getStarCount(side);
    if (currentStars >= starInfo.cost) {
      if (this.spendStars(starInfo.cost, side)) {
        // 융합된 별을 별 관리 시스템에 추가
        if (window.starManagement) {
          window.starManagement.addFusedStar(grade, side);
        }
        return true;
      }
    }
    return false;
  }

  // 별을 우주에서 원소로 변환 (별 재화 하나로 뽑기)
  convertStarToElement(grade, side = 'player') {
    const currentStars = this.getStarCount(side);
    if (currentStars >= 1) {
      if (this.spendStars(1, side)) {
        // 꽝 제거: 1~26번 원소만 생성
        const randomElementNumber = Math.floor(Math.random() * 26) + 1;
        const element = gameState.elementsData.find(e => e.number === randomElementNumber);
        
        if (element && gameState.fusionSystem) {
          gameState.fusionSystem.materials[element.symbol] = (gameState.fusionSystem.materials[element.symbol] || 0) + 1;
          showMessage(`⭐ 별이 ${element.name}(${element.symbol}) 원소를 생성했습니다!`, 'star');
          return true;
        }
      }
    }
    return false;
  }

  // UI 업데이트
  updateUI() {
    // 플레이어 별 표시
    const playerStarsEl = document.getElementById('player-stars-count');
    if (playerStarsEl) {
      playerStarsEl.textContent = window.formatNumber ? window.formatNumber(this.playerStars) : this.playerStars;
    }

    // 컴퓨터 별 표시
    const computerStarsEl = document.getElementById('computer-stars-count');
    if (computerStarsEl) {
      computerStarsEl.textContent = window.formatNumber ? window.formatNumber(this.computerStars) : this.computerStars;
    }

    // 별 질량 표시
    const starMassEl = document.getElementById('star-mass-count');
    if (starMassEl) {
      starMassEl.textContent = window.formatNumber ? window.formatNumber(this.starMass) : this.starMass;
    }

    // 다음 별 생성까지 필요한 질량 표시
    const nextStarEl = document.getElementById('next-star-mass');
    if (nextStarEl) {
      const availableGrade = this.getAvailableStarGrade();
      if (availableGrade) {
        const starInfo = this.starGrades[availableGrade];
        const remainingMass = starInfo.massRequired - this.starMass;
        nextStarEl.textContent = `다음: ${starInfo.name} (${remainingMass} 질량 필요)`;
      } else {
        nextStarEl.textContent = '별 생성 불가';
      }
    }

    // 별 융합 버튼 상태 업데이트
    this.updateFusionButtons();
    
    // 별 변환 버튼 상태 업데이트
    this.updateConversionButtons();
  }

  // 별 융합 버튼 상태 업데이트
  updateFusionButtons() {
    const playerStars = this.playerStars;
    
    Object.keys(this.starGrades).forEach(grade => {
      const starInfo = this.starGrades[grade];
      
      const button = document.getElementById(`fuse-${grade}-star`);
      if (button) {
        const canFuse = playerStars >= starInfo.cost;
        button.disabled = !canFuse;
        button.textContent = canFuse ? 
          `${starInfo.name} 생성 (${starInfo.cost}개)` : 
          `${starInfo.name} 생성 불가`;
      }
    });
  }

  // 별 변환 버튼 상태 업데이트
  updateConversionButtons() {
    const playerStars = this.playerStars;
    const grades = ['small', 'medium', 'large', 'giant'];
    
    grades.forEach(grade => {
      const button = document.getElementById(`convert-${grade}-star`);
      if (button) {
        const canConvert = playerStars >= 1; // 모든 등급은 1개 별로 변환 가능
        button.disabled = !canConvert;
        button.textContent = canConvert ? 
          `${this.starGrades[grade].name} 변환 (1개)` : 
          `${this.starGrades[grade].name} 변환 불가`;
      }
    });
  }

  // 데이터 저장
  saveData() {
    return {
      playerStars: this.playerStars,
      computerStars: this.computerStars,
      starMass: this.starMass
    };
  }

  // 데이터 로드
  loadData(data) {
    if (data) {
      this.playerStars = data.playerStars || 0;
      this.computerStars = data.computerStars || 0;
      this.starMass = data.starMass || 0;
    }
  }
}

// 전역 인스턴스
window.starCurrency = new StarCurrency();
