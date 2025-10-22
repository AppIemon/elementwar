// 연구 & 장비 상점 시스템
class ResearchShop {
  constructor() {
    this.upgrades = {
      // 1. 토카막 코일 (자기장) - 에너지 비용 감소
      coil: {
        name: "토카막 코일",
        description: "자기장으로 플라즈마를 구속하여 융합 효율을 높입니다.",
        maxLevel: 20,
        baseCost: 25,
        costMultiplier: 1.2,
        effect: (level) => Math.pow(0.96, level),
        getEffectDescription: (level) => `에너지 비용 ${Math.round((1 - Math.pow(0.96, level)) * 100)}% 감소`
      },
      
      // 2. 레이저 어레이 (가열) - 열 축적 감소, 냉각 속도 증가
      laser: {
        name: "레이저 어레이",
        description: "정밀한 가열로 열 관리를 개선합니다.",
        maxLevel: 20,
        baseCost: 30,
        costMultiplier: 1.2,
        heatReduction: (level) => Math.pow(0.94, level),
        coolRate: (level) => 1 + (0.06 * level),
        getEffectDescription: (level) => `열 축적 ${Math.round((1 - Math.pow(0.94, level)) * 100)}% 감소, 냉각 속도 +${Math.round(0.06 * level * 100)}%`
      },
      
      // 3. 질량분석기 (선별) - 고Z 가중 증가
      analyzer: {
        name: "질량분석기",
        description: "고원자번호 원소 확률을 소폭 높입니다.",
        maxLevel: 20,
        baseCost: 38,
        costMultiplier: 1.2,
        effect: (level) => 0.08 * level,
        getEffectDescription: (level) => `고원자번호 원소 확률 +${Math.round(0.08 * level * 100)}%`
      },
      
      // 4. 연쇄 연소 모델 (시뮬) - 재료 수량 완만화
      simulator: {
        name: "연쇄 연소 모델",
        description: "융합 경로 최적화로 재료 사용량을 줄입니다.",
        maxLevel: 20,
        baseCost: 50,
        costMultiplier: 1.2,
        effect: (level) => 0.01 * level,
        getEffectDescription: (level) => `필요 재료 수량 ${Math.round(0.01 * level * 100)}% 감소`
      },
      
      // 5. 미니 리액터 (발전) - H→E 변환 효율 증가
      reactor: {
        name: "미니 리액터",
        description: "수소를 에너지로 변환하는 효율을 높입니다.",
        maxLevel: 20,
        baseCost: 45,
        costMultiplier: 1.2,
        effect: (level) => 0.15 * level,
        getEffectDescription: (level) => `H→E 변환 효율 +${Math.round(0.15 * level * 100)}%`
      },

      // 6. 양자 컴퓨터 (계산) - 연구 효율 증가
      quantum: {
        name: "양자 컴퓨터",
        description: "양자 계산으로 연구 효율을 높입니다.",
        maxLevel: 20,
        baseCost: 70,
        costMultiplier: 1.3,
        effect: (level) => 1 + (0.1 * level),
        getEffectDescription: (level) => `연구 효율 +${Math.round(0.1 * level * 100)}%`
      },

      // 7. 중력장 발생기 (중력) - 압축 효율 증가
      gravity: {
        name: "중력장 발생기",
        description: "인공 중력으로 압축 효율을 높입니다.",
        maxLevel: 20,
        baseCost: 85,
        costMultiplier: 1.3,
        effect: (level) => 1 + (0.08 * level),
        getEffectDescription: (level) => `압축 효율 +${Math.round(0.08 * level * 100)}%`
      },

      // 8. 뽑기 원소 확장 - 등장 가능 원소 번호 cap 확장 (H, He → Fe)
      drawCap: {
        name: "뽑기 원소 확장",
        description: "뽑기에서 등장 가능한 원소 범위를 확장합니다.",
        maxLevel: 24, // 2 + 24 = 26까지 확장
        baseCost: 50,
        costMultiplier: 1.25,
        effect: (level) => 2 + level, // cap 미리보기용
        getEffectDescription: (level) => `최대 원소 번호: ${Math.min(26, 2 + level)}`
      }
    };
  }

  // 업그레이드 비용 계산
  getUpgradeCost(type, currentLevel) {
    const upgrade = this.upgrades[type];
    if (!upgrade || currentLevel >= upgrade.maxLevel) return Infinity;

    const baseCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    
    if (upgrade.currency === "rare") {
      // 희귀 동위원소로만 구입 가능
      return { coinCost: 0, energyCost: 0, rareCost: baseCost };
    } else {
      // 일반 코인 + 에너지
      const coinCost = Math.ceil(baseCost * 0.8); // 코인 부담 20% 인하
      const energyCost = Math.floor(baseCost * 0.15); // 에너지 부담 15%
      return { coinCost, energyCost, rareCost: 0 };
    }
  }

  // 업그레이드 실행
  upgrade(type, fusionSystem, gameState) {
    const upgrade = this.upgrades[type];
    if (!upgrade) return { success: false, message: "존재하지 않는 업그레이드입니다." };

    // equipment가 undefined인 경우 0으로 초기화
    if (fusionSystem.equipment[type] === undefined) {
      fusionSystem.equipment[type] = 0;
    }
    
    const currentLevel = fusionSystem.equipment[type];
    if (currentLevel >= upgrade.maxLevel) {
      return { success: false, message: "이미 최대 레벨입니다." };
    }

    const cost = this.getUpgradeCost(type, currentLevel);

    if (upgrade.currency === "rare") {
      // 희귀 동위원소로 구입
      const rareCost = cost.rareCost;
      const totalRareIsotopes = Object.keys(fusionSystem.materials)
        .filter(key => key.includes('*'))
        .reduce((sum, key) => sum + (fusionSystem.materials[key] || 0), 0);

      if (totalRareIsotopes < rareCost) {
        return { success: false, message: "희귀 동위원소가 부족합니다." };
      }

      // 희귀 동위원소 소모
      let remainingCost = rareCost;
      for (const [element, count] of Object.entries(fusionSystem.materials)) {
        if (element.includes('*') && remainingCost > 0) {
          const useCount = Math.min(count, remainingCost);
          fusionSystem.materials[element] -= useCount;
          remainingCost -= useCount;
        }
      }
    } else {
      // 일반 코인 + 에너지로 구입
      const coinCost = cost.coinCost;
      const energyCost = cost.energyCost;

      if (gameState.playerCoins < coinCost) {
        return { success: false, message: "코인이 부족합니다." };
      }

      if (fusionSystem.energy < energyCost) {
        return { success: false, message: "에너지가 부족합니다." };
      }

      // 비용 지불
      gameState.playerCoins -= coinCost;
      fusionSystem.energy -= energyCost;
    }

    // 업그레이드 실행
    fusionSystem.equipment[type]++;

    return { 
      success: true, 
      message: `${upgrade.name} 레벨 ${fusionSystem.equipment[type]}로 업그레이드!`,
      newLevel: fusionSystem.equipment[type],
      cost: cost
    };
  }

  // 연구 레벨 업그레이드
  upgradeResearch(fusionSystem, gameState) {
    const cost = 150 + (fusionSystem.researchLevel * 60); // 추가 하향 조정
    const energyCost = Math.floor(cost * 0.2);

    if (gameState.playerCoins < cost - energyCost) {
      return { success: false, message: "코인이 부족합니다." };
    }

    if (fusionSystem.energy < energyCost) {
      return { success: false, message: "에너지가 부족합니다." };
    }

    gameState.playerCoins -= (cost - energyCost);
    fusionSystem.energy -= energyCost;
    fusionSystem.researchLevel++;

    return { 
      success: true, 
      message: `연구 레벨 ${fusionSystem.researchLevel} 달성!`,
      newLevel: fusionSystem.researchLevel,
      cost: cost
    };
  }

  // 업그레이드 정보 가져오기
  getUpgradeInfo(type, currentLevel) {
    const upgrade = this.upgrades[type];
    if (!upgrade) return null;

    // currentLevel이 undefined이거나 NaN인 경우 0으로 설정
    const level = (currentLevel === undefined || isNaN(currentLevel)) ? 0 : currentLevel;
    const cost = this.getUpgradeCost(type, level);
    
    if (upgrade.currency === "rare") {
      // 희귀 동위원소 장비
      return {
        name: upgrade.name,
        description: upgrade.description,
        currentLevel: level,
        maxLevel: upgrade.maxLevel,
        coinCost: 0,
        energyCost: 0,
        rareCost: cost.rareCost,
        currency: "rare",
        effectDescription: upgrade.getEffectDescription ? upgrade.getEffectDescription(level + 1) : "",
        canUpgrade: level < upgrade.maxLevel && cost.rareCost !== Infinity
      };
    } else {
      // 일반 장비
      const energyCost = cost.energyCost;
      const coinCost = cost.coinCost;

      return {
        name: upgrade.name,
        description: upgrade.description,
        currentLevel: level,
        maxLevel: upgrade.maxLevel,
        coinCost: coinCost,
        energyCost: energyCost,
        rareCost: 0,
        currency: "normal",
        effectDescription: upgrade.getEffectDescription ? upgrade.getEffectDescription(level + 1) : "",
        canUpgrade: level < upgrade.maxLevel && cost.coinCost !== Infinity
      };
    }
  }

  // 연구 정보 가져오기
  getResearchInfo(currentLevel) {
    const cost = 500 + (currentLevel * 200);
    const energyCost = Math.floor(cost * 0.4);
    const coinCost = cost - energyCost;

    return {
      name: "핵융합 연구",
      description: "가챠 확률과 융합 효율을 전반적으로 향상시킵니다",
      currentLevel: currentLevel,
      coinCost: coinCost,
      energyCost: energyCost,
      totalCost: cost,
      effectDescription: "가챠 가중치 증가, 융합 효율 향상"
    };
  }

  // 모든 업그레이드 정보 가져오기
  getAllUpgrades(fusionSystem) {
    const upgrades = {};
    for (const type in this.upgrades) {
      // fusionSystem.equipment[type]이 undefined이거나 NaN인 경우 0으로 설정
      const currentLevel = (fusionSystem.equipment[type] === undefined || isNaN(fusionSystem.equipment[type])) ? 0 : fusionSystem.equipment[type];
      upgrades[type] = this.getUpgradeInfo(type, currentLevel);
    }
    return upgrades;
  }
}

// 전역 인스턴스
window.researchShop = new ResearchShop();
