// 핵융합 시스템 - 새로운 게임 메커니즘
class FusionSystem {
  constructor() {
    this.energy = 0; // 초기 에너지는 0으로 설정 (gameState.energy와 통합)
    this.heat = 0;
    this.maxHeat = 100;
    this.autoCompress = true;
    this.compressThreshold = 6; // 6개 기준으로 변경
    this.researchLevel = 0;
    this.rareIsotopeProbability = 0.01; // 희귀 동위원소 기본 확률 1%
    this.equipment = {
      coil: 0,        // 토카막 코일 (자기장)
      laser: 0,       // 레이저 어레이 (가열)
      analyzer: 0,    // 질량분석기 (선별)
      simulator: 0,   // 연쇄 연소 모델 (시뮬)
      reactor: 0,     // 미니 리액터 (발전)
      quantum: 0,     // 양자 컴퓨터 (계산)
      gravity: 0,     // 중력장 발생기 (중력)
      isotope: 0,     // 동위원소 분리기 (희귀 확률 증가)
      drawCap: 0      // 뽑기 원소 확장 (등장 cap 확장)
    };
    this.milestones = {
      oxygen: false,  // O(8) 제작
      iron: false,    // Fe(26) 제작
      krypton: false, // Kr(36) 제작
      xenon: false,   // Xe(54) 제작
      uranium: false  // U(92) 제작
    };
    this.fusionQueue = [];
    this.materials = {
      H: 0, He: 0, Li: 0, Be: 0, B: 0, C: 0, N: 0, O: 0,
      F: 0, Ne: 0, Na: 0, Mg: 0, Al: 0, Si: 0, P: 0, S: 0,
      Cl: 0, Ar: 0, K: 0, Ca: 0, Sc: 0, Ti: 0, V: 0, Cr: 0,
      Mn: 0, Fe: 0
    };
    // 별 자원은 별 관리 시스템에서 관리됨
  }

  // equipment 초기화 및 NaN 복구
  initializeEquipment() {
    const defaultEquipment = {
      coil: 0,        // 토카막 코일 (자기장)
      laser: 0,       // 레이저 어레이 (가열)
      analyzer: 0,    // 질량분석기 (선별)
      simulator: 0,   // 연쇄 연소 모델 (시뮬)
      reactor: 0,     // 미니 리액터 (발전)
      quantum: 0,     // 양자 컴퓨터 (계산)
      gravity: 0,     // 중력장 발생기 (중력)
      isotope: 0,     // 동위원소 분리기 (희귀 확률 증가)
      drawCap: 0      // 뽑기 원소 확장 (등장 cap 확장)
    };

    // equipment가 없거나 일부 키가 누락된 경우 초기화
    if (!this.equipment) {
      this.equipment = { ...defaultEquipment };
    } else {
      // 각 장비가 undefined이거나 NaN인 경우 0으로 초기화
      for (const [key, defaultValue] of Object.entries(defaultEquipment)) {
        if (this.equipment[key] === undefined || isNaN(this.equipment[key])) {
          this.equipment[key] = defaultValue;
        }
      }
    }
  }

  // 분자 합성 시스템 - 실제 분자 데이터 사용
  getMoleculeWeights() {
    // 실제 분자 데이터가 없으면 빈 객체 반환
    if (!gameState.moleculesData || !Array.isArray(gameState.moleculesData)) {
      console.warn('분자 데이터가 로드되지 않았습니다.');
      return {};
    }

    // 연구 레벨에 따른 가중치 증폭
    const alpha = 0.1;
    const beta = 0.8;
    const R = this.researchLevel;

    // 연구 캡(최대 원자번호) 계산
    let cap = 26;
    try {
      if (typeof window !== 'undefined' && window.gameState && typeof window.getMaxElementNumberByResearch === 'function') {
        cap = Math.min(26, window.getMaxElementNumberByResearch());
      }
    } catch (e) {
      // 폴백: cap=26 유지
    }

    const adjustedWeights = {};
    
    // 실제 분자 데이터를 사용하여 가중치 계산
    gameState.moleculesData.forEach(molecule => {
      if (!molecule.id || !molecule.elements || !Array.isArray(molecule.elements)) {
        return; // 유효하지 않은 분자 데이터 건너뛰기
      }

      // 분자의 최대 원자번호 계산
      const maxZ = Math.max(...molecule.elements);
      
      // cap을 넘지 않는 분자만 선택
      if (maxZ <= cap) {
        // 희귀도에 따른 기본 가중치 설정
        let baseWeight = 50; // 기본 가중치
        switch (molecule.rarity) {
          case 'common':
            baseWeight = 100;
            break;
          case 'uncommon':
            baseWeight = 80;
            break;
          case 'rare':
            baseWeight = 60;
            break;
          case 'epic':
            baseWeight = 40;
            break;
          case 'legendary':
            baseWeight = 20;
            break;
        }

        // 원소 개수에 따른 가중치 조정 (너무 복잡한 분자는 확률 낮춤)
        const elementCount = molecule.elements.length;
        if (elementCount > 4) {
          baseWeight *= 0.5;
        } else if (elementCount > 2) {
          baseWeight *= 0.8;
        }

        // 연구 레벨에 따른 가중치 증폭
        const weightMultiplier = 1 + alpha * Math.pow(R, beta);
        adjustedWeights[molecule.id] = Math.floor(baseWeight * weightMultiplier);
      }
    });

    return adjustedWeights;
  }

  // 분자 가챠 실행 (분자만 생성)
  performMoleculeGacha(count = 1) {
    const weights = this.getMoleculeWeights();
    const results = {};

    // 필터 결과가 비었으면 바로 빈 결과 반환 (원소 카드 경로로 폴백되도록)
    if (!weights || Object.keys(weights).length === 0) {
      return results;
    }

    for (let i = 0; i < count; i++) {
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;

      for (const [molecule, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
          results[molecule] = (results[molecule] || 0) + 1;
          this.materials[molecule] = (this.materials[molecule] || 0) + 1;
          break;
        }
      }
    }

    return results;
  }

  // 분자 레시피의 요구 원소 중 최대 원자번호 계산
  getMoleculeMaxAtomicNumber(moleculeId) {
    // 실제 분자 데이터에서 직접 계산
    if (!gameState.moleculesData || !Array.isArray(gameState.moleculesData)) {
      return null;
    }

    const molecule = gameState.moleculesData.find(m => m.id === moleculeId);
    if (!molecule || !molecule.elements || !Array.isArray(molecule.elements)) {
      return null;
    }

    // 분자의 elements 배열에서 최대값 반환
    return Math.max(...molecule.elements);
  }

  // 원소 기호로 원자번호 찾기 (동적 데이터 우선)
  getNumberBySymbol(symbol) {
    if (!symbol) return null;
    // 동적으로 로드된 데이터가 있으면 우선 사용
    if (typeof gameState !== 'undefined' && Array.isArray(gameState.elementsData)) {
      const found = gameState.elementsData.find(e => e.symbol === symbol);
      if (found && typeof found.number === 'number') return found.number;
    }
    // 폴백: 1~26 맵
    const map = {
      H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8,
      F: 9, Ne: 10, Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16,
      Cl: 17, Ar: 18, K: 19, Ca: 20, Sc: 21, Ti: 22, V: 23, Cr: 24,
      Mn: 25, Fe: 26
    };
    return map[symbol] ?? null;
  }

  // 배치 분자 가챠 실행 (여러 개 한번에)
  performBatchMoleculeGacha(count = 1) {
    const weights = this.getMoleculeWeights();
    const results = {};
    const drawnMolecules = []; // 뽑힌 분자들을 순서대로 저장

    for (let i = 0; i < count; i++) {
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;

      for (const [molecule, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
          results[molecule] = (results[molecule] || 0) + 1;
          this.materials[molecule] = (this.materials[molecule] || 0) + 1;
          drawnMolecules.push({
            id: molecule,
            name: molecule,
            type: 'molecule'
          });
          break;
        }
      }
    }

    return {
      results: results,
      drawnMolecules: drawnMolecules,
      totalCount: count
    };
  }

  // 희귀 동위원소 랜덤 선택
  getRandomRareIsotope() {
    const rareIsotopes = [
      'H*', 'He*', 'Li*', 'Be*', 'B*', 'C*', 'N*', 'O*'
    ];
    return rareIsotopes[Math.floor(Math.random() * rareIsotopes.length)];
  }

  // 원자번호로 기호 찾기
  getSymbolByNumber(number) {
    // 동적으로 로드된 데이터가 있으면 우선 사용
    if (typeof gameState !== 'undefined' && Array.isArray(gameState.elementsData)) {
      const found = gameState.elementsData.find(e => e.number === number);
      if (found) return found.symbol;
    }
    // 폴백: 기본 맵 (1~26)
    const symbols = {
      1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O',
      9: 'F', 10: 'Ne', 11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S',
      17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr',
      25: 'Mn', 26: 'Fe'
    };
    return symbols[number];
  }

  // 에너지 비용 계산 (핵융합/초신성 시스템)
  calculateEnergyCost(targetZ) {
    let baseCost = 0;
    
    if (targetZ <= 8) {
      // 1~8번: 핵융합 - 최소 에너지 필요 (1~5)
      baseCost = Math.max(1, Math.floor(targetZ * 0.5));
    } else if (targetZ <= 26) {
      // 9~26번: 핵융합 - 적은 에너지 소모
      baseCost = Math.pow(targetZ - 8, 1.2) * 0.5;
    } else if (targetZ <= 92) {
      // 27~92번: 초신성 - 별 자원 필요 + 에너지 소모
      const progression = (targetZ - 26) / (92 - 26); // 0~1 사이의 진행도
      baseCost = Math.pow(progression, 2) * 50; // 0에서 50까지 점진적 증가
    } else {
      // 93~118번: 초신성 - 기하급수적 증가
      const excess = targetZ - 92;
      baseCost = 50 * Math.pow(2, excess); // 50, 100, 200, 400, 800...
    }
    
    // 연구/장비 보너스 적용
    const coilReduction = Math.pow(0.96, this.equipment.coil);
    const researchReduction = 1 - (this.researchLevel * 0.02);
    const milestoneReduction = this.getMilestoneReduction(targetZ);
    
    baseCost *= coilReduction * researchReduction * milestoneReduction;
    
    // 과열 패널티 (에너지 소모가 있을 때만)
    if (baseCost > 0) {
      const overheatPenalty = 1 + Math.pow(this.heat, 1.2) / 100;
      baseCost *= overheatPenalty;
    }
    
    return Math.floor(baseCost);
  }

  // 단일 융합에 필요한 이전 원소 개수 계산
  calculateRequiredMaterials(targetZ) {
    // 난이도에 따라 점진적으로 증가
    if (targetZ <= 8) return 2;               // 경원소 구간: 2개
    if (targetZ <= 26) return Math.max(2, Math.ceil((targetZ - 8) / 4) + 2); // 중원소 구간
    // 초신성 구간: 더 많은 재료 요구
    return Math.min(20, Math.ceil((targetZ - 26) / 6) + 5);
  }

  // 초신성 별 자원 비용 계산 (더 이상 사용하지 않음)
  calculateStarCost(targetZ) {
    return 0; // 별은 이제 자동 초신성으로 처리됨
  }

  // 분자 합성 에너지 비용 계산
  calculateMoleculeEnergyCost(moleculeId) {
    // 필요 재료 총합을 바탕으로 기본 비용 산정
    const required = this.calculateMoleculeRequiredMaterials(moleculeId);
    const totalAtoms = Object.values(required).reduce((s, v) => s + v, 0);
    let base = 2 * totalAtoms; // 원자 한 개당 2 에너지 기준

    // 연구/장비 보너스 적용 (coil과 research는 에너지 감축, simulator는 재료에 이미 반영됨)
    const coilReduction = Math.pow(0.97, this.equipment.coil);
    const researchReduction = 1 - (this.researchLevel * 0.01);
    base *= coilReduction * researchReduction;

    // 과열 패널티
    const overheatPenalty = 1 + Math.pow(this.heat, 1.1) / 120;
    base *= overheatPenalty;

    return Math.max(0, Math.floor(base));
  }

  // 분자 합성 필요 재료 계산 (실제 분자 데이터 사용)
  calculateMoleculeRequiredMaterials(moleculeId) {
    // 실제 분자 데이터에서 찾기
    if (!gameState.moleculesData || !Array.isArray(gameState.moleculesData)) {
      console.warn('분자 데이터가 로드되지 않았습니다.');
      return {};
    }

    const molecule = gameState.moleculesData.find(m => m.id === moleculeId);
    if (!molecule || !molecule.elementCounts) {
      console.warn(`분자 ${moleculeId}를 찾을 수 없거나 elementCounts가 없습니다.`);
      return {};
    }

    // 연구 레벨에 따른 재료 효율성 개선
    const efficiency = 1 - (this.researchLevel * 0.05);
    const simulatorReduction = Math.max(0.02, 0.01 * this.equipment.simulator);
    const totalEfficiency = Math.max(0.5, efficiency - simulatorReduction);
    
    const requiredMaterials = {};
    for (const [element, count] of Object.entries(molecule.elementCounts)) {
      requiredMaterials[element] = Math.ceil(count * totalEfficiency);
    }
    
    return requiredMaterials;
  }

  // 분자 합성 실행
  performMoleculeSynthesis(moleculeId) {
    try {
    const requiredMaterials = this.calculateMoleculeRequiredMaterials(moleculeId) || {};
      const energyCost = this.calculateMoleculeEnergyCost(moleculeId);
      
      // NaN 및 무한대 값 검증
      if (!Number.isFinite(energyCost) || energyCost < 0) {
        console.warn(`[performMoleculeSynthesis] 잘못된 에너지 비용: ${energyCost}, moleculeId: ${moleculeId}`);
        return { 
          success: false, 
          message: `분자 합성 에너지 비용 계산 오류: ${moleculeId}` 
        };
      }

      // 재료 확인
      for (const [element, required] of Object.entries(requiredMaterials)) {
        const currentAmount = this.materials[element] || 0;
        if (currentAmount < required) {
          return { 
            success: false, 
            message: `${element}가 부족합니다. (필요: ${required}, 보유: ${currentAmount})` 
        };
      }
    }

    // 에너지 확인 (gameState.energy와 동기화)
      const currentEnergy = Number.isFinite(Number(gameState.energy)) ? Number(gameState.energy) : 0;
      if (currentEnergy < energyCost) {
      return { 
        success: false, 
          message: `에너지가 부족합니다. (필요: ${energyCost}, 보유: ${currentEnergy})` 
      };
    }

    // 분자 합성 실행
    for (const [element, required] of Object.entries(requiredMaterials)) {
        this.materials[element] = Math.max(0, (this.materials[element] || 0) - required);
    }

      gameState.energy = Math.max(0, currentEnergy - energyCost);
      this.energy = gameState.energy; // 동기화
      this.heat = Math.max(0, (this.heat || 0) + 5); // 열 증가
    this.materials[moleculeId] = (this.materials[moleculeId] || 0) + 1;

    return { 
      success: true, 
      message: `${moleculeId} 분자 합성 성공! (소모: 에너지 ${energyCost})`,
      moleculeId: moleculeId,
      energyCost: energyCost
    };
    } catch (error) {
      console.error(`[performMoleculeSynthesis] 오류 발생:`, error);
      return { 
        success: false, 
        message: `분자 합성 중 오류가 발생했습니다: ${error.message}` 
      };
    }
  }


  // 난이도 계수
  getDifficultyMultiplier(Z) {
    if (Z <= 8) return 1.0;
    if (Z <= 26) return 1.1;  // Fe까지
    if (Z <= 56) return 1.2;  // Ba까지
    return 1.35;              // 57~92
  }

  // 마일스톤 보너스
  getMasteryBonus(Z) {
    let bonus = 0;
    if (this.milestones.oxygen && Z <= 8) bonus += 0.08;
    if (this.milestones.iron && Z <= 26) bonus += 0.06;
    if (this.milestones.krypton && Z <= 36) bonus += 0.04;
    if (this.milestones.xenon && Z <= 54) bonus += 0.04;
    if (this.milestones.uranium && Z <= 92) bonus += 0.06;
    return Math.min(bonus, 0.3); // 최대 30% 보너스
  }

  // 마일스톤 감소율 계산
  getMilestoneReduction(Z) {
    let reduction = 1.0; // 기본값: 감소 없음
    
    if (this.milestones.oxygen && Z <= 8) reduction *= 0.95; // 5% 감소
    if (this.milestones.iron && Z <= 26) reduction *= 0.93; // 7% 감소
    if (this.milestones.krypton && Z <= 36) reduction *= 0.92; // 8% 감소
    if (this.milestones.xenon && Z <= 54) reduction *= 0.90; // 10% 감소
    if (this.milestones.uranium && Z <= 92) reduction *= 0.88; // 12% 감소
    
    return reduction;
  }

  // 핵융합/초신성 실행 (단일)
  performFusion(targetZ) {
    try {
      // 입력 검증
      if (!Number.isInteger(targetZ) || targetZ < 2 || targetZ > 118) {
        return { success: false, message: `잘못된 원자번호: ${targetZ}` };
      }

    const requiredMaterials = this.calculateRequiredMaterials(targetZ);
    const energyCost = this.calculateEnergyCost(targetZ);
    const starCost = this.calculateStarCost(targetZ);
    const previousElement = this.getSymbolByNumber(targetZ - 1);
    const isSupernova = targetZ > 26;

      // NaN 및 무한대 값 검증
      if (!Number.isFinite(requiredMaterials) || !Number.isFinite(energyCost) || !Number.isFinite(starCost)) {
        console.warn(`[performFusion] 잘못된 계산값: requiredMaterials=${requiredMaterials}, energyCost=${energyCost}, starCost=${starCost}, targetZ=${targetZ}`);
        return { success: false, message: `핵융합 계산 오류: ${targetZ}` };
      }

      if (!previousElement) {
        return { success: false, message: `이전 원소를 찾을 수 없습니다: ${targetZ - 1}` };
      }

    // 재료 확인
      const currentMaterials = this.materials[previousElement] || 0;
      if (currentMaterials < requiredMaterials) {
        return { success: false, message: `${previousElement}가 부족합니다. (필요: ${requiredMaterials}, 보유: ${currentMaterials})` };
    }

    // 에너지 확인 - 모든 경우에 에너지가 필요함 (gameState.energy와 동기화)
      const currentEnergy = Number.isFinite(Number(gameState.energy)) ? Number(gameState.energy) : 0;
      if (currentEnergy < energyCost) {
        return { success: false, message: `⚡ 에너지가 부족합니다! (필요: ${energyCost}, 보유: ${currentEnergy})\nH를 에너지로 변환하거나 기다려서 에너지를 회복하세요.` };
    }

    // 수소는 선택적으로 사용 (있으면 사용, 없어도 핵융합 가능)
    const hydrogenCount = this.materials.H || 0;
    const minHydrogen = Math.max(1, Math.floor(targetZ / 5));
    
    // 수소가 있으면 사용하지만, 없어도 핵융합은 계속 진행
    if (hydrogenCount >= minHydrogen) {
      this.materials.H = Math.max(0, hydrogenCount - minHydrogen);
    }

    // 별 자원 확인 제거 (자동 초신성으로 처리됨)

    // 융합/초신성 실행 - 재료 소모
    this.materials[previousElement] = Math.max(0, currentMaterials - requiredMaterials);
    
    // 별 성장도 증가 (원소 사용으로 인한)
    if (window.starManagement) {
      window.starManagement.growStarWithElements(previousElement, requiredMaterials);
    }
    
    // 에너지 소모
    gameState.energy = Math.max(0, currentEnergy - energyCost);
    this.energy = gameState.energy; // 동기화
    
    // 열 증가
    this.heat = Math.max(0, (this.heat || 0) + Math.floor(targetZ / 10));

    const targetSymbol = this.getSymbolByNumber(targetZ);
      if (!targetSymbol) {
        return { success: false, message: `대상 원소를 찾을 수 없습니다: ${targetZ}` };
      }
      
    this.materials[targetSymbol] = (this.materials[targetSymbol] || 0) + 1;

    // 생성된 원소를 손패에 카드로 추가
    this.addElementCardToHand(targetSymbol);

    // 마일스톤 체크
    this.checkMilestones(targetZ);

    // 잉여 에너지 생성
    const surplusEnergy = Math.floor(targetZ / 5);
      gameState.energy = Math.max(0, gameState.energy + surplusEnergy);
      this.energy = gameState.energy; // 동기화

    const processName = isSupernova ? '초신성' : '핵융합';
    const starText = isSupernova ? `, 별: ${starCost}` : '';

    return { 
      success: true, 
      message: `${targetSymbol} ${processName} 성공! (소모: ${previousElement}×${requiredMaterials}, 에너지: ${energyCost}${starText})`,
      surplusEnergy: surplusEnergy,
      targetSymbol: targetSymbol,
      requiredMaterials: requiredMaterials,
      previousElement: previousElement,
      energyCost: energyCost,
      starCost: starCost,
      isSupernova: isSupernova
    };
    } catch (error) {
      console.error(`[performFusion] 오류 발생:`, error);
      return { 
        success: false, 
        message: `핵융합 중 오류가 발생했습니다: ${error.message}` 
      };
    }
  }

  // 배치 핵융합/초신성 실행 (여러 개 한번에)
  performBatchFusion(fusionTargets) {
    try {
      // 입력 검증
      if (!Array.isArray(fusionTargets) || fusionTargets.length === 0) {
        return { success: false, message: '융합 대상이 없습니다.' };
      }

      // 각 targetZ 검증
      for (const targetZ of fusionTargets) {
        if (!Number.isInteger(targetZ) || targetZ < 2 || targetZ > 118) {
          return { success: false, message: `잘못된 원자번호: ${targetZ}` };
        }
      }

      const results = [];
      const totalEnergyCost = fusionTargets.reduce((sum, targetZ) => {
        const cost = this.calculateEnergyCost(targetZ);
        return Number.isFinite(cost) ? sum + cost : sum;
      }, 0);
      
      const totalStarCost = fusionTargets.reduce((sum, targetZ) => {
        const cost = this.calculateStarCost(targetZ);
        return Number.isFinite(cost) ? sum + cost : sum;
      }, 0);
      
      const totalHeatIncrease = fusionTargets.reduce((sum, targetZ) => sum + Math.floor(targetZ / 10), 0);
      
      // NaN 검증
      if (!Number.isFinite(totalEnergyCost) || !Number.isFinite(totalStarCost)) {
        console.warn(`[performBatchFusion] 잘못된 계산값: totalEnergyCost=${totalEnergyCost}, totalStarCost=${totalStarCost}`);
        return { success: false, message: '배치 융합 계산 오류' };
      }
      
      // 전체 에너지 비용 확인 (gameState.energy와 동기화)
      const currentEnergy = Number.isFinite(Number(gameState.energy)) ? Number(gameState.energy) : 0;
      if (currentEnergy < totalEnergyCost) {
        return { 
          success: false, 
          message: `⚡ 에너지가 부족합니다! (필요: ${totalEnergyCost}, 보유: ${currentEnergy})\nH를 에너지로 변환하거나 기다려서 에너지를 회복하세요.` 
        };
      }

      // 별 자원 확인 제거 (자동 초신성으로 처리됨)

      // 각 융합에 대해 재료 확인 (수소 요구사항 제거)
      for (const targetZ of fusionTargets) {
        const requiredMaterials = this.calculateRequiredMaterials(targetZ);
        const previousElement = this.getSymbolByNumber(targetZ - 1);
        
        if (!Number.isFinite(requiredMaterials) || !previousElement) {
          return { success: false, message: `융합 계산 오류: ${targetZ}` };
        }
        
        const currentMaterials = this.materials[previousElement] || 0;
        if (currentMaterials < requiredMaterials) {
          return { 
            success: false, 
            message: `${previousElement}가 부족합니다. (필요: ${requiredMaterials}, 보유: ${currentMaterials})` 
          };
        }
      }

      // 모든 융합 실행
      for (const targetZ of fusionTargets) {
        const requiredMaterials = this.calculateRequiredMaterials(targetZ);
        const energyCost = this.calculateEnergyCost(targetZ);
        const starCost = this.calculateStarCost(targetZ);
        const previousElement = this.getSymbolByNumber(targetZ - 1);
        const targetSymbol = this.getSymbolByNumber(targetZ);
        const isSupernova = targetZ > 26;

        // 재료 소모
        this.materials[previousElement] = Math.max(0, (this.materials[previousElement] || 0) - requiredMaterials);
        
        // 수소는 선택적으로 사용 (있으면 사용, 없어도 핵융합 가능)
        const hydrogenCount = this.materials.H || 0;
        const minHydrogen = Math.max(1, Math.floor(targetZ / 5));
        if (hydrogenCount >= minHydrogen) {
          this.materials.H = Math.max(0, hydrogenCount - minHydrogen);
        }
        
        // 결과 생성
        this.materials[targetSymbol] = (this.materials[targetSymbol] || 0) + 1;

        // 생성된 원소를 손패에 카드로 추가
        this.addElementCardToHand(targetSymbol);

        // 마일스톤 체크
        this.checkMilestones(targetZ);

        results.push({
          targetZ: targetZ,
          targetSymbol: targetSymbol,
          previousElement: previousElement,
          requiredMaterials: requiredMaterials,
          energyCost: energyCost,
          starCost: starCost,
          isSupernova: isSupernova
        });
      }

      // 에너지, 열 처리 (별 자원 제거)
      gameState.energy = Math.max(0, currentEnergy - totalEnergyCost);
      this.energy = gameState.energy; // 동기화
      this.heat = Math.max(0, (this.heat || 0) + totalHeatIncrease);

      // 잉여 에너지 생성
      const totalSurplusEnergy = fusionTargets.reduce((sum, targetZ) => sum + Math.floor(targetZ / 5), 0);
      gameState.energy = Math.max(0, gameState.energy + totalSurplusEnergy);
      this.energy = gameState.energy; // 동기화

      const fusionCount = fusionTargets.filter(z => z <= 26).length;
      const supernovaCount = fusionTargets.filter(z => z > 26).length;
      let processText = '';
      if (fusionCount > 0 && supernovaCount > 0) {
        processText = `${fusionCount}개 핵융합, ${supernovaCount}개 초신성 완료!`;
      } else if (fusionCount > 0) {
        processText = `${fusionCount}개 핵융합 완료!`;
      } else {
        processText = `${supernovaCount}개 초신성 완료!`;
      }

      return {
        success: true,
        message: processText,
        results: results,
        totalEnergyCost: totalEnergyCost,
        totalStarCost: totalStarCost,
        totalSurplusEnergy: totalSurplusEnergy,
        totalHeatIncrease: totalHeatIncrease
      };
    } catch (error) {
      console.error(`[performBatchFusion] 오류 발생:`, error);
      return { 
        success: false, 
        message: `배치 융합 중 오류가 발생했습니다: ${error.message}` 
      };
    }
  }

  // 최대 융합 실행 - 반복적으로 융합 가능한 모든 원소를 융합
  performMaxFusion() {
    try {
      console.log('[performMaxFusion] 최대 융합 시작');
      
      // 손패를 기반으로 재료 인벤토리 동기화
      this.syncMaterialsFromHand();
      
      console.log('[performMaxFusion] 동기화 후 상태:', {
        energy: this.energy,
        materials: this.materials,
        elementsData: gameState.elementsData?.length
      });
      
      const allResults = [];
      let totalSuccessCount = 0;
      let totalEnergyUsed = 0;
      let roundCount = 0;
      const maxRounds = 100; // 무한 루프 방지
      
      // 융합이 불가능할 때까지 반복
      while (roundCount < maxRounds) {
        roundCount++;
        console.log(`[performMaxFusion] 라운드 ${roundCount} 시작`);
        
        // 현재 라운드에서 융합 가능한 원소 찾기
        const fusionTargets = this.findFusionTargets();
        
        if (fusionTargets.length === 0) {
          console.log(`[performMaxFusion] 라운드 ${roundCount}: 융합 가능한 원소 없음`);
          break;
        }
        
        console.log(`[performMaxFusion] 라운드 ${roundCount}: ${fusionTargets.length}개 융합 대상 발견`);
        
        // 현재 라운드의 융합 실행
        const roundResults = [];
        let roundSuccessCount = 0;
        let roundEnergyUsed = 0;
        
        for (const targetZ of fusionTargets) {
          const fusionResult = this.performSingleFusion(targetZ);
          if (fusionResult.success) {
            roundResults.push(fusionResult);
            roundSuccessCount++;
            roundEnergyUsed += fusionResult.energyCost;
          }
        }
        
        if (roundSuccessCount === 0) {
          console.log(`[performMaxFusion] 라운드 ${roundCount}: 융합 실패`);
          break;
        }
        
        // 결과 누적
        allResults.push(...roundResults);
        totalSuccessCount += roundSuccessCount;
        totalEnergyUsed += roundEnergyUsed;
        
        console.log(`[performMaxFusion] 라운드 ${roundCount} 완료: ${roundSuccessCount}개 융합`);
        
        // 재료 인벤토리 재동기화 (새로 생성된 카드들 반영)
        this.syncMaterialsFromHand();
      }
      
      if (totalSuccessCount > 0) {
        let message = `${totalSuccessCount}개 핵융합 완료! (에너지: ${totalEnergyUsed}, ${roundCount}라운드)`;
        
        // 자동 압축 체크
        const compressResults = this.checkAutoCompress();
        if (compressResults && compressResults.length > 0) {
          message += `\n자동 압축: ${compressResults.length}개 원소 압축됨`;
        }

        return {
          success: true,
          message: message,
          results: allResults,
          totalEnergyUsed: totalEnergyUsed,
          successCount: totalSuccessCount,
          rounds: roundCount
        };
      } else {
        // 디버깅을 위한 상세 정보 수집
        const debugInfo = [];
        const currentEnergy = Number.isFinite(Number(this.energy)) ? Number(this.energy) : 0;
        
        const elementSymbols = Array.isArray(gameState.elementsData)
          ? gameState.elementsData.map(e => e.symbol)
          : [];
        
        // 각 원소별 상태 확인
        for (const symbol of elementSymbols.slice(0, 5)) { // 처음 5개만 확인
          const currentZ = this.getNumberBySymbol(symbol);
          if (!currentZ || currentZ >= 26) continue;
          
          const nextZ = currentZ + 1;
          const available = this.materials[symbol] || 0;
          const required = this.calculateRequiredMaterials(nextZ);
          const energyCost = this.calculateEnergyCost(nextZ);
          
          debugInfo.push(`${symbol}(${currentZ}): 보유=${available}, 필요=${required}, 에너지=${energyCost}`);
        }
        
        let message = '융합 가능한 원소가 없습니다.\n';
        if (currentEnergy === 0) {
          message += '에너지가 없습니다. H를 에너지로 변환하세요.';
        } else {
          message += '재료나 에너지가 부족합니다.';
        }
        
        console.log('[performMaxFusion] 디버그 정보:', {
          currentEnergy,
          materials: this.materials,
          debugInfo
        });
        
        return { 
          success: false, 
          message: message
        };
      }
    } catch (error) {
      console.error(`[performMaxFusion] 오류 발생:`, error);
      return { 
        success: false, 
        message: `최대 융합 중 오류가 발생했습니다: ${error.message}` 
      };
    }
  }

  // 융합 가능한 원소들을 찾는 메서드 (단일 라운드용)
  findFusionTargets() {
    const fusionTargets = [];
    const elementSymbols = Array.isArray(gameState.elementsData)
      ? gameState.elementsData.map(e => e.symbol)
      : [];

    console.log('[findFusionTargets] 현재 재료 상태:', this.materials);
    console.log('[findFusionTargets] 현재 에너지:', this.energy);

    // 각 원소에 대해 융합 가능한지 확인 (25번까지만 핵융합)
    for (const symbol of elementSymbols) {
      const currentZ = this.getNumberBySymbol(symbol);
      if (!currentZ || currentZ >= 25) continue; // 25번(Mn)까지만 핵융합

      const nextZ = currentZ + 1;
      const available = this.materials[symbol] || 0;
      const required = this.calculateRequiredMaterials(nextZ);
      const energyCost = this.calculateEnergyCost(nextZ);
      const currentEnergy = Number.isFinite(Number(this.energy)) ? Number(this.energy) : 0;

      console.log(`[findFusionTargets] ${symbol}(${currentZ}) -> ${this.getSymbolByNumber(nextZ)}(${nextZ}): 보유=${available}, 필요=${required}, 에너지=${energyCost}, 현재에너지=${currentEnergy}`);
      
      // 핵융합 가능한 조건 확인 (에너지, 재료만 확인 - 수소는 선택사항)
      if (available >= required && currentEnergy >= energyCost) {
        
        // 가능한 융합 횟수 계산 (재료 제한)
        const maxFusions = Math.floor(available / required);
        
        // 에너지 제한 고려
        const energyLimitedFusions = Math.floor(currentEnergy / energyCost);
        
        const actualFusions = Math.min(maxFusions, energyLimitedFusions);
        
        console.log(`[findFusionTargets] ${symbol} -> ${this.getSymbolByNumber(nextZ)}: 실제융합가능=${actualFusions} (재료제한=${maxFusions}, 에너지제한=${energyLimitedFusions})`);
        
        if (actualFusions > 0) {
          // 융합 대상 추가 (각 원소당 최대 1개씩만)
          fusionTargets.push(nextZ);
          console.log(`[findFusionTargets] 융합 대상 추가: ${this.getSymbolByNumber(nextZ)}(${nextZ})`);
        }
      } else {
        console.log(`[findFusionTargets] ${symbol} -> ${this.getSymbolByNumber(nextZ)}: 융합 불가 (재료=${available >= required}, 에너지=${currentEnergy >= energyCost})`);
      }
    }

    console.log(`[findFusionTargets] 최종 융합 대상: ${fusionTargets.length}개`, fusionTargets.map(z => this.getSymbolByNumber(z)));
    return fusionTargets;
  }

  // 단일 융합을 수행하는 메서드
  performSingleFusion(targetZ) {
    try {
        const requiredMaterials = this.calculateRequiredMaterials(targetZ);
        const energyCost = this.calculateEnergyCost(targetZ);
        const previousElement = this.getSymbolByNumber(targetZ - 1);
        const targetSymbol = this.getSymbolByNumber(targetZ);

        // 손패에서 실제 카드 제거
        const removedCards = this.removeCardsFromHand(previousElement, requiredMaterials);
        
        if (removedCards.length < requiredMaterials) {
        console.warn(`[performSingleFusion] ${previousElement} 카드 부족: 필요 ${requiredMaterials}, 제거 ${removedCards.length}`);
          // 부족한 카드를 다시 손패에 추가
          removedCards.forEach(card => {
            if (typeof addCardToHand === 'function') {
              addCardToHand(card, 'player');
            } else {
              gameState.playerHand.push(card);
            }
          });
        return { success: false, message: '재료 부족' };
        }

        // 에너지 소모
        this.energy = Math.max(0, this.energy - energyCost);
        gameState.energy = this.energy; // 동기화
        
        // 열 증가
        this.heat = Math.max(0, (this.heat || 0) + Math.floor(targetZ / 10));

        // 결과 생성
        this.materials[targetSymbol] = (this.materials[targetSymbol] || 0) + 1;

        // 생성된 원소를 손패에 카드로 추가
        this.addElementCardToHand(targetSymbol);

        // 마일스톤 체크
        this.checkMilestones(targetZ);

        // 잉여 에너지 생성
        const surplusEnergy = Math.floor(targetZ / 5);
        this.energy = Math.max(0, this.energy + surplusEnergy);
        gameState.energy = this.energy; // 동기화

      return {
        success: true,
          targetZ: targetZ,
          targetSymbol: targetSymbol,
          previousElement: previousElement,
          requiredMaterials: requiredMaterials,
          energyCost: energyCost
      };
    } catch (error) {
      console.error(`[performSingleFusion] 오류 발생:`, error);
      return { 
        success: false, 
        message: `단일 융합 중 오류가 발생했습니다: ${error.message}` 
      };
    }
  }

  // 마일스톤 체크
  checkMilestones(Z) {
    if (Z === 8 && !this.milestones.oxygen) {
      this.milestones.oxygen = true;
      this.researchLevel++;
    } else if (Z === 26 && !this.milestones.iron) {
      this.milestones.iron = true;
      this.researchLevel++;
    } else if (Z === 36 && !this.milestones.krypton) {
      this.milestones.krypton = true;
      this.researchLevel++;
    } else if (Z === 54 && !this.milestones.xenon) {
      this.milestones.xenon = true;
      this.researchLevel++;
    } else if (Z === 92 && !this.milestones.uranium) {
      this.milestones.uranium = true;
      this.researchLevel++;
    }
  }

  // 자동 압축 - 모든 원소에 대해 16개 → 8개 → 4개 → 2개 → 1개 압축 (연쇄 압축 포함)
  checkAutoCompress() {
    if (!this.autoCompress) return null;

    const compressionResults = [];
    const elementSymbols = Array.isArray(gameState.elementsData)
      ? gameState.elementsData.map(e => e.symbol)
      : [];

    // 연쇄 압축을 위해 여러 번 반복 (최대 20회로 제한)
    let maxIterations = 20;
    let hasCompression = true;

    while (hasCompression && maxIterations > 0) {
      hasCompression = false;
      maxIterations--;

      // 각 원소에 대해 압축 체크 (H부터 Fe까지)
      for (const symbol of elementSymbols) {
        if (this.materials[symbol] >= this.compressThreshold) { // 임계값 이상이면 압축 가능
          const compressed = this.performElementCompression(symbol);
          if (compressed) {
            compressionResults.push(compressed);
            hasCompression = true; // 압축이 발생했으므로 다시 체크
          }
        }
      }
    }

    return compressionResults.length > 0 ? compressionResults : null;
  }

  // 특정 원소의 압축 수행 (임계값에 따라 동적 압축)
  performElementCompression(symbol) {
    let currentCount = this.materials[symbol] || 0;
    let totalCompressed = 0;
    const compressionSteps = [];
    const threshold = this.compressThreshold;

    // 임계값에 따라 압축 단계 결정
    const compressionLevels = [];
    if (threshold >= 16) compressionLevels.push(16);
    if (threshold >= 8) compressionLevels.push(8);
    if (threshold >= 6) compressionLevels.push(6);
    if (threshold >= 4) compressionLevels.push(4);
    if (threshold >= 2) compressionLevels.push(2);

    // 각 압축 단계별로 처리
    for (const level of compressionLevels) {
      if (currentCount >= level) {
        const compressCount = Math.floor(currentCount / level);
        this.materials[symbol] -= compressCount * level;
        const nextElement = this.getNextElement(symbol);
        if (nextElement) {
          const outputCount = Math.floor(level / 2);
          this.materials[nextElement] = (this.materials[nextElement] || 0) + compressCount * outputCount;
          
          // 압축으로 생성된 원소를 손패에 카드로 추가
          for (let i = 0; i < compressCount * outputCount; i++) {
            this.addElementCardToHand(nextElement);
          }
          
          compressionSteps.push(`${symbol} ${level}개 → ${nextElement} ${outputCount}개 (${compressCount}회)`);
          totalCompressed += compressCount;
          currentCount = this.materials[symbol] || 0;
        }
      }
    }

    return totalCompressed > 0 ? {
      element: symbol,
      totalCompressed: totalCompressed,
      steps: compressionSteps
    } : null;
  }

  // 다음 원소 번호 찾기 (Z+1)
  getNextElement(symbol) {
    const currentZ = this.getNumberBySymbol(symbol);
    if (!currentZ) return null;
    
    const nextZ = currentZ + 1;
    return this.getSymbolByNumber(nextZ);
  }

  // 원소를 손패에 카드로 추가
  addElementCardToHand(symbol) {
    try {
      if (!symbol || typeof symbol !== 'string') {
        console.warn(`[addElementCardToHand] 잘못된 심볼: ${symbol}`);
        return;
      }

      if (typeof addCardToHand !== 'function') {
        console.warn('[addElementCardToHand] addCardToHand 함수를 찾을 수 없습니다.');
        return;
      }

      // 원소 데이터 찾기
      const elementData = Array.isArray(gameState.elementsData) 
        ? gameState.elementsData.find(e => e.symbol === symbol)
        : null;

      if (!elementData) {
        console.warn(`[addElementCardToHand] 원소 데이터를 찾을 수 없습니다: ${symbol}`);
        return;
      }

      // ElementCard 클래스가 있는지 확인
      if (typeof ElementCard !== 'undefined') {
        const elementCard = new ElementCard(elementData, elementData.baseHp, elementData.baseAtk);
        addCardToHand(elementCard, 'player');
        console.log(`[addElementCardToHand] ${symbol} 카드를 손패에 추가했습니다.`);
      } else {
        console.warn('[addElementCardToHand] ElementCard 클래스를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error(`[addElementCardToHand] 오류 발생:`, error);
    }
  }

  // 손패를 기반으로 재료 인벤토리 동기화
  syncMaterialsFromHand() {
    if (!window.gameState || !this) return;

    const hand = Array.isArray(gameState.playerHand) ? gameState.playerHand : [];

    // elementsData 기준으로 원소 심볼 목록 수집 (분자 ID와 구분)
    const elementSymbols = Array.isArray(gameState.elementsData)
      ? gameState.elementsData.map(e => e.symbol)
      : [];

    // 원소 심볼 카운트만 초기화 (분자 키는 건드리지 않음)
    elementSymbols.forEach(sym => { 
      if (this.materials[sym] !== undefined) {
        this.materials[sym] = 0; 
      }
    });

    // 손패에서 원소 카드 집계 (합성/해골 제외, 기본 원소만 카운트)
    hand.forEach(card => {
      if (card && !card.isSynthesis && !card.isSkull && card.element && elementSymbols.includes(card.element.symbol)) {
        this.materials[card.element.symbol] = (this.materials[card.element.symbol] || 0) + 1;
      }
    });

    console.log('[syncMaterialsFromHand] 손패 카드 수:', hand.length);
    console.log('[syncMaterialsFromHand] 손패 원소 카드들:', hand.filter(card => card && card.element && !card.isSynthesis && !card.isSkull).map(card => card.element.symbol));
    console.log('[syncMaterialsFromHand] 동기화 완료:', this.materials);
  }

  // 손패에서 특정 원소 카드 제거
  removeCardsFromHand(elementSymbol, count) {
    const removedCards = [];
    let removedCount = 0;
    
    for (let i = gameState.playerHand.length - 1; i >= 0 && removedCount < count; i--) {
      const card = gameState.playerHand[i];
      if (card && 
          card.element && 
          card.element.symbol === elementSymbol && 
          !card.isSkull && 
          !card.isSynthesis) {
        removedCards.push(gameState.playerHand.splice(i, 1)[0]);
        removedCount++;
      }
    }
    
    console.log(`[removeCardsFromHand] ${elementSymbol} ${removedCount}개 제거됨`);
    return removedCards;
  }


  // 열 냉각
  coolDown() {
    const coolRate = 1 + (0.06 * this.equipment.laser);
    this.heat = Math.max(0, this.heat - coolRate);
  }

  // H를 에너지로 변환 (gameState.energy와 동기화)
  convertHToEnergy(HAmount) {
    const k = 8 + (this.equipment.reactor * 1); // 리액터 레벨에 따라 효율 증가, 기본 효율도 개선
    const energyGained = Math.floor(HAmount / k);
    this.materials.H -= HAmount;
    gameState.energy += energyGained;
    this.energy = gameState.energy; // 동기화
    return energyGained;
  }

  // 별 변환 메서드들은 별 관리 시스템으로 이동됨

  // 장비 업그레이드
  upgradeEquipment(type, level) {
    if (this.equipment[type] < 20) {
      this.equipment[type] = level;
      return true;
    }
    return false;
  }

  // 연구 레벨 업그레이드
  upgradeResearch() {
    this.researchLevel++;
    return true;
  }

  // 게임 상태 저장
  saveState() {
    return {
      energy: gameState.energy, // gameState.energy 사용
      heat: this.heat,
      autoCompress: this.autoCompress,
      compressThreshold: this.compressThreshold,
      researchLevel: this.researchLevel,
      equipment: { ...this.equipment },
      milestones: { ...this.milestones },
      materials: { ...this.materials },
      stars: this.stars
    };
  }

  // 게임 상태 로드
  loadState(state) {
    gameState.energy = state.energy || 0;
    this.energy = gameState.energy; // 동기화
    this.heat = state.heat || 0;
    this.autoCompress = state.autoCompress || false;
    this.compressThreshold = state.compressThreshold || 4;
    this.researchLevel = state.researchLevel || 0;
    this.equipment = { ...this.equipment, ...state.equipment };
    this.milestones = { ...this.milestones, ...state.milestones };
    this.materials = { ...this.materials, ...state.materials };
    this.stars = state.stars || 0;
  }
}

// 전역 인스턴스
window.fusionSystem = new FusionSystem();

// gameState와 fusionSystem 연결 함수
function connectFusionSystemToGameState() {
  if (typeof window.gameState !== 'undefined' && window.gameState) {
    try {
      Object.defineProperty(window.gameState, 'fusionSystem', {
        get() { return window.fusionSystem; },
        set(v) { window.fusionSystem = v; },
        configurable: true
      });
      console.log('fusionSystem이 gameState에 연결되었습니다.');
    } catch (e) {
      // defineProperty 실패 시 마지막 수단으로 참조만 재할당
      window.gameState.fusionSystem = window.fusionSystem;
      console.log('fusionSystem이 gameState에 직접 할당되었습니다.');
    }
  }
}

// 즉시 연결 시도
connectFusionSystemToGameState();

// gameState가 나중에 생성되는 경우를 대비해 주기적으로 연결 시도
const fusionConnectionInterval = setInterval(() => {
  if (typeof window.gameState !== 'undefined' && window.gameState && !window.gameState.fusionSystem) {
    connectFusionSystemToGameState();
    clearInterval(fusionConnectionInterval); // 연결되면 중단
  }
}, 100); // 100ms마다 체크

// 5초 후에는 중단 (무한 루프 방지)
setTimeout(() => {
  clearInterval(fusionConnectionInterval);
}, 5000);
