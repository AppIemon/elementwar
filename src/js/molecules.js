export class Molecule {
  constructor(id, name, elements, effect) {
    this.id = id;
    this.name = name;
    this.elements = elements;
    this.effect = effect;
    this.icon = this.generateIcon();
    this.starLevel = 0; // 분자 별 레벨
    this.starExperience = 0; // 별 경험치
    this.starRequiredExp = 100; // 다음 별 레벨까지 필요한 경험치
  }

  generateIcon() {
    return this.elements.map(e => {
      const element = getElementByNumber(e);
      return element ? element.symbol : '?';
    }).join('');
  }

  applyEffect(sourceCard, targetCard, battlefield) {
    const effectHandlers = {
      'boost_attack': this.applyBoostAttack,
      'boost_health': this.applyBoostHealth,
      'damage': this.applyDamage,
      'explosive': this.applyExplosive,
      'damage_over_time': this.applyDamageOverTime,
      'corrosive': this.applyCorrosive,
      'explosive_damage': this.applyExplosiveDamage,
      'shield_reduction': this.applyShieldReduction,
      'suffocation': this.applySuffocation,
      'acid_damage': this.applyAcidDamage,
      'freeze': this.applyFreeze,
      'intoxication': this.applyIntoxication,
      'poison': this.applyPoison,
      'heal_over_time': this.applyHealOverTime,
      'base_damage': this.applyBaseDamage,
      'burn': this.applyBurn,
      'armor': this.applyArmor,
      'barrier': this.applyBarrier,
      'water_reactive': this.applyWaterReactive,
      'desiccation': this.applyDesiccation,
      'acid_rain': this.applyAcidRain,
      'glass_corrosion': this.applyGlassCorrosion,
      'solvent': this.applySolvent,
      'energy_boost': this.applyEnergyBoost,
      'fortification': this.applyFortification,
      'oxidizer': this.applyOxidizer,
      'dehydration': this.applyDehydration,
      'regeneration': this.applyRegeneration,
      'inert_shield': this.applyInertShield,
      'silicon_bond': this.applySiliconBond,
      'purification': this.applyPurification,
      'caustic': this.applyCaustic,
      'electrolyte': this.applyElectrolyte,
      'catalyst': this.applyCatalyst,
      'acid_splash': this.applyAcidSplash,
      'hardening': this.applyHardening,
      'spontaneous_combustion': this.applySpontaneousCombustion,
      'toxic_gas': this.applyToxicGas,
      'anesthesia': this.applyAnesthesia,
      'reducing_agent': this.applyReducingAgent,
      'rotten_egg': this.applyRottenEgg,
      'antioxidant': this.applyAntioxidant,
      'dna_repair': this.applyDnaRepair
    };

    const handler = effectHandlers[this.effect.type];
    if (handler) {
      const result = handler.call(this, sourceCard, targetCard, battlefield);
      
      
      return result;
    }
    
    return false;
  }

  // 효과 타입 반환 (분자별 시스템용)
  getEffectType() {
    const damageEffects = ['damage', 'explosive', 'damage_over_time', 'corrosive', 'explosive_damage', 'acid_damage', 'base_damage', 'burn', 'acid_rain', 'acid_splash', 'spontaneous_combustion', 'toxic_gas', 'caustic'];
    const healingEffects = ['heal_over_time', 'regeneration', 'dna_repair', 'antioxidant'];
    const boostEffects = ['boost_attack', 'boost_health', 'energy_boost', 'fortification', 'catalyst'];
    
    if (damageEffects.includes(this.effect.type)) {
      return 'damage';
    } else if (healingEffects.includes(this.effect.type)) {
      return 'healing';
    } else if (boostEffects.includes(this.effect.type)) {
      return 'boost';
    }
    
    return 'other';
  }

  applyBoostAttack(sourceCard, targetCard) {
    sourceCard.atk += this.effect.value;
    targetCard.atk += this.effect.value;
    return true;
  }

  applyBoostHealth(sourceCard, targetCard) {
    sourceCard.hp += this.effect.value;
    sourceCard.maxHp += this.effect.value;
    targetCard.hp += this.effect.value;
    targetCard.maxHp += this.effect.value;
    return true;
  }

  applyDamage(sourceCard, targetCard) {
    sourceCard.hp -= this.effect.value;
    targetCard.hp -= this.effect.value;
    return true;
  }

  applyExplosive(sourceCard, targetCard) {
    sourceCard.hp = 0;
    targetCard.hp = 0;
    return true;
  }

  applyDamageOverTime(sourceCard, targetCard) {
    const effect = {
      name: 'dot',
      damage: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 지속 피해`
    };
    
    sourceCard.addEffect(effect);
    targetCard.addEffect(effect);
    return true;
  }

  applyCorrosive(sourceCard, targetCard) {
    const effect = {
      name: 'corrosive',
      armorReduction: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 방어력 감소`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyExplosiveDamage(sourceCard, targetCard, battlefield) {
    const damage = this.effect.value;
    
    targetCard.hp -= damage;
    
    if (this.effect.aoe) {
      this.applyAreaEffect(battlefield, targetCard.owner, (card) => {
        card.hp -= Math.floor(damage / 2);
      });
    }
    
    return true;
  }

  applyShieldReduction(sourceCard, targetCard) {
    if (targetCard.shield) {
      targetCard.shield = Math.max(0, targetCard.shield - this.effect.value);
    }
    return true;
  }

  applySuffocation(sourceCard, targetCard) {
    const effect = {
      name: 'suffocation',
      damageMultiplier: 0.8,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 공격력 감소`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyAcidDamage(sourceCard, targetCard) {
    const armorPenetration = targetCard.armor ? Math.min(targetCard.armor, this.effect.value) : 0;
    targetCard.hp -= (this.effect.value + armorPenetration);
    
    if (targetCard.armor) {
      targetCard.armor = Math.max(0, targetCard.armor - this.effect.value);
    }
    
    return true;
  }

  applyFreeze(sourceCard, targetCard) {
    const effect = {
      name: 'freeze',
      skipTurn: true,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의해 1턴 동안 행동 불가`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyIntoxication(sourceCard, targetCard) {
    const effect = {
      name: 'intoxication',
      damageRandomizer: true,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의해 공격이 불규칙해짐`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyPoison(sourceCard, targetCard) {
    const effect = {
      name: 'poison',
      damage: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 독 피해`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyHealOverTime(sourceCard, targetCard) {
    const effect = {
      name: 'heal',
      amount: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 지속 치유`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applyBaseDamage(sourceCard, targetCard) {
    if (targetCard.hasEffect('acid')) {
      targetCard.hp -= this.effect.value * 2; // 산성 효과가 있으면 피해 2배
      showMessage("화학 반응: 염기와 산의 반응으로 피해가 2배로 증가!", "warning");
    } else {
      targetCard.hp -= this.effect.value;
    }
    return true;
  }

  applyBurn(sourceCard, targetCard) {
    const effect = {
      name: 'burn',
      damage: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 화상 피해`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyArmor(sourceCard, targetCard) {
    sourceCard.armor = (sourceCard.armor || 0) + this.effect.value;
    return true;
  }

  applyBarrier(sourceCard, targetCard) {
    const effect = {
      name: 'barrier',
      armor: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 보호막`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applyWaterReactive(sourceCard, targetCard, battlefield) {
    const hasWaterInBattlefield = battlefield.lanes.some(lane => {
      return (lane.player && !lane.player.isSkull && this.isWaterElement(lane.player.element)) || 
             (lane.computer && !lane.computer.isSkull && this.isWaterElement(lane.computer.element));
    });
    
    if (hasWaterInBattlefield) {
      // 물 원소가 필드에 있으면 폭발
      this.applyExplosiveDamage(sourceCard, targetCard, battlefield);
      showMessage(`${this.name}이(가) 물과 반응하여 폭발했습니다!`, "warning");
    }
    
    return true;
  }

  isWaterElement(element) {
    return element && (element.name === "물" || element.symbol === "H2O");
  }

  applyDesiccation(sourceCard, targetCard) {
    const waterRemovalMultiplier = 1.5; // 수분 제거로 인한 피해 증폭
    targetCard.hp -= this.effect.value;
    
    const effect = {
      name: 'desiccation',
      healingReduction: 0.5, // 회복 효과 50% 감소
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 회복 방해`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyAreaEffect(battlefield, excludeOwner, effectFn) {
    battlefield.lanes.forEach(lane => {
      if (lane.player && !lane.player.isSkull && lane.player.owner !== excludeOwner) {
        effectFn(lane.player);
      }
      
      if (lane.computer && !lane.computer.isSkull && lane.computer.owner !== excludeOwner) {
        effectFn(lane.computer);
      }
    });
  }

  applyAcidRain(sourceCard, targetCard, battlefield) {
    const damage = this.effect.value;
    
    if (this.effect.aoe) {
      this.applyAreaEffect(battlefield, null, (card) => {
        card.hp -= damage;
      });
      showMessage("산성비가 내려 모든 카드가 피해를 입었습니다!", "warning");
    } else {
      targetCard.hp -= damage;
    }
    
    return true;
  }

  applyGlassCorrosion(sourceCard, targetCard) {
    if (targetCard.element.symbol === "Si" || targetCard.element.name.includes("규소")) {
      targetCard.hp = 0;
      showMessage("불화수소가 규소(유리) 기반 카드를 완전히 파괴했습니다!", "warning");
    } else {
      targetCard.hp -= this.effect.value;
    }
    return true;
  }

  applySolvent(sourceCard, targetCard) {
    const effect = {
      name: 'solvent',
      armorReduction: this.effect.value,
      effectReduction: true,
      duration: 1,
      description: `${this.name}에 의해 효과 제거`
    };
    
    targetCard.addEffect(effect);
    
    // 모든 효과 제거
    targetCard.effects = targetCard.effects.filter(e => e.permanent === true);
    
    return true;
  }

  applyEnergyBoost(sourceCard, targetCard) {
    const effect = {
      name: 'energy_boost',
      attackBoost: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 공격력 증가`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applyFortification(sourceCard, targetCard) {
    sourceCard.armor = (sourceCard.armor || 0) + this.effect.value;
    sourceCard.hp += this.effect.value;
    return true;
  }

  applyOxidizer(sourceCard, targetCard) {
    // 산화제는 불과 함께하면 폭발적인 효과
    if (targetCard.element.name.includes("불") || targetCard.element.symbol.includes("F")) {
      targetCard.hp -= this.effect.value * 2;
      showMessage("산화제가 불과 반응하여 폭발적인 피해를 입혔습니다!", "warning");
    } else {
      targetCard.hp -= this.effect.value;
    }
    return true;
  }

  applyDehydration(sourceCard, targetCard) {
    targetCard.hp -= this.effect.value;
    
    if (targetCard.maxHp > 3) {
      targetCard.maxHp -= 1;
      showMessage("황산의 탈수 작용으로 최대 체력이 감소했습니다!", "warning");
    }
    
    return true;
  }

  applyRegeneration(sourceCard, targetCard) {
    const effect = {
      name: 'regeneration',
      healing: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 체력 재생`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applyInertShield(sourceCard, targetCard) {
    const effect = {
      name: 'inert_shield',
      damageReduction: 0.5,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 피해 감소`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applySiliconBond(sourceCard, targetCard) {
    const effect = {
      name: 'silicon_bond',
      permanentArmor: this.effect.value,
      permanent: true,
      description: `${this.name}에 의한 영구 방어력`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applyPurification(sourceCard, targetCard) {
    if (this.effect.cleanse) {
      // 부정적인 효과 제거
      targetCard.effects = targetCard.effects.filter(e => 
        !['poison', 'burn', 'corrosive', 'suffocation', 'freeze', 'dot'].includes(e.name));
    }
    
    return true;
  }

  applyCaustic(sourceCard, targetCard) {
    const effect = {
      name: 'caustic',
      armorDamage: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 방어구 손상`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyElectrolyte(sourceCard, targetCard) {
    if (this.effect.conductor) {
      // 전기 카드와의 상호작용
      const hasElectricityInHand = gameState.playerHand.some(card => 
        card.element && (card.element.name.includes("번개") || card.element.symbol.includes("Li")));
      
      if (hasElectricityInHand) {
        sourceCard.atk += this.effect.value * 2;
        showMessage("전해질이 전기 카드와 공명하여 공격력이 강화됩니다!", "success");
      }
    }
    return true;
  }

  applyCatalyst(sourceCard, targetCard) {
    if (this.effect.speedup) {
      const effect = {
        name: 'catalyst',
        actionSpeedup: this.effect.speedup,
        duration: 2,
        description: `${this.name}에 의한 행동 속도 증가`
      };
      
      sourceCard.addEffect(effect);
    }
    return true;
  }

  applyAcidSplash(sourceCard, targetCard, battlefield) {
    if (this.effect.aoe) {
      const damage = this.effect.value;
      this.applyAreaEffect(battlefield, targetCard.owner, (card) => {
        card.hp -= damage;
      });
      showMessage("황산이 주변에 튀어 광역 피해를 입혔습니다!", "warning");
    } else {
      targetCard.hp -= this.effect.value * 1.5;
    }
    return true;
  }

  applyHardening(sourceCard, targetCard) {
    const effect = {
      name: 'hardening',
      armor: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 단단해짐`
    };
    
    sourceCard.addEffect(effect);
    return true;
  }

  applySpontaneousCombustion(sourceCard, targetCard, battlefield) {
    targetCard.hp -= this.effect.value;
    
    // 공기 중에서 자연 발화
    const effect = {
      name: 'combustion',
      damage: 1,
      duration: 3,
      description: "공기 중에서 자연 발화"
    };
    
    const nearbyCards = this.getNearbyCards(battlefield, targetCard);
    nearbyCards.forEach(card => {
      card.addEffect(effect);
    });
    
    return true;
  }

  getNearbyCards(battlefield, targetCard) {
    const result = [];
    let targetLaneIndex = -1;
    let targetPosition = null;
    
    // 타겟 카드의 위치 찾기
    battlefield.lanes.forEach((lane, index) => {
      if (lane.player === targetCard) {
        targetLaneIndex = index;
        targetPosition = 'player';
      } else if (lane.computer === targetCard) {
        targetLaneIndex = index;
        targetPosition = 'computer';
      }
    });
    
    if (targetLaneIndex === -1) return result;
    
    // 인접한 라인 카드 추가
    if (targetLaneIndex > 0) {
      const prevLane = battlefield.lanes[targetLaneIndex - 1];
      if (prevLane[targetPosition] && !prevLane[targetPosition].isSkull) {
        result.push(prevLane[targetPosition]);
      }
    }
    
    if (targetLaneIndex < battlefield.lanes.length - 1) {
      const nextLane = battlefield.lanes[targetLaneIndex + 1];
      if (nextLane[targetPosition] && !nextLane[targetPosition].isSkull) {
        result.push(nextLane[targetPosition]);
      }
    }
    
    return result;
  }

  applyToxicGas(sourceCard, targetCard) {
    const effect = {
      name: 'toxic_gas',
      damage: this.effect.value,
      attackReduction: 1,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 독성 피해`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyAnesthesia(sourceCard, targetCard) {
    const effect = {
      name: 'anesthesia',
      skipAttack: true,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의해 공격 불가`
    };
    
    targetCard.addEffect(effect);
    return true;
  }

  applyReducingAgent(sourceCard, targetCard) {
    // 산화된 카드를 원래대로 복구
    targetCard.effects = targetCard.effects.filter(e => !e.name.includes('oxid'));
    
    targetCard.atk = Math.min(targetCard.atk + this.effect.value, targetCard.maxAtk || targetCard.atk + this.effect.value);
    
    return true;
  }

  applyRottenEgg(sourceCard, targetCard) {
    if (this.effect.distraction) {
      const effect = {
        name: 'distraction',
        missChance: 0.3,
        duration: 2,
        description: "악취로 인한 공격 실패 확률 증가"
      };
      
      targetCard.addEffect(effect);
    }
    return true;
  }

  applyAntioxidant(sourceCard, targetCard) {
    const effect = {
      name: 'antioxidant',
      immuneToDot: true,
      healing: 1,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 지속 피해 면역`
    };
    
    if (this.effect.immunity) {
      sourceCard.addEffect(effect);
    }
    
    return true;
  }

  applyDnaRepair(sourceCard, targetCard) {
    const effect = {
      name: 'dna_repair',
      healing: this.effect.value,
      duration: this.effect.duration || 1,
      description: `${this.name}에 의한 체력 회복`
    };
    
    if (this.effect.regeneration) {
      sourceCard.hp = Math.min(sourceCard.hp + this.effect.value, sourceCard.maxHp);
      sourceCard.addEffect(effect);
    }
    
    return true;
  }
}

// 효과 설명 문자열 생성 함수 추가
Molecule.prototype.getEffectDescription = function() {
  if (!this.effect) return '효과 없음';
  
  // 효과 유형별로 보기 좋게 표시
  switch (this.effect.type) {
    case 'boost_attack':
      return `공격력 +${this.effect.value}`;
    case 'boost_health':
      return `체력 +${this.effect.value}`;
    case 'damage':
      return `피해량 ${this.effect.value}`;
    case 'explosive':
      return `폭발 피해 (즉사)`;
    case 'damage_over_time':
      return `${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
    case 'corrosive':
      return `방어력 -${this.effect.value}`;
    case 'explosive_damage':
      return `폭발 피해 ${this.effect.value}${this.effect.aoe ? ' (주변 피해)' : ''}`;
    case 'shield_reduction':
      return `보호막 감소 ${this.effect.value}`;
    case 'suffocation':
      return `질식: 공격력 20% 감소`;
    case 'acid_damage':
      return `산성 피해 ${this.effect.value} (방어력 관통)`;
    case 'freeze':
      return `${this.effect.duration || 1}턴 동안 행동 불가`;
    case 'intoxication':
      return `중독: 공격이 불규칙해짐`;
    case 'poison':
      return `독: ${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
    case 'heal_over_time':
      return `${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 회복`;
    case 'base_damage':
      return `염기성 피해 ${this.effect.value} (산성과 반응 시 2배 피해)`;
    case 'burn':
      return `화상: ${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
    case 'armor':
      return `방어력 +${this.effect.value}`;
    case 'barrier':
      return `보호막: ${this.effect.duration || 1}턴 동안 ${this.effect.value} 피해 흡수`;
    case 'catalyst':
      return `촉매: 행동 속도 증가`;
    default:
      return this.effect.description || `${this.effect.type} 효과`;
  }
};


function getElementByNumber(number) {
  return gameState.elementsData.find(e => e.number === number);
}

// 분자 생성 함수 (화학 반응 대신 직접 분자 생성)
function createMoleculeFromElements(element1, element2) {
  if (!gameState || !gameState.moleculesData || !Array.isArray(gameState.elementsData)) return null;

  const toSymbol = (num) => gameState.elementsData.find(e => e.number === num)?.symbol;
  const selCounts = {};
  [element1, element2].forEach(el => {
    const sym = el?.element?.symbol || toSymbol(el?.element?.number);
    if (!sym) return;
    selCounts[sym] = (selCounts[sym] || 0) + 1;
  });

  const matchingMolecule = gameState.moleculesData.find(mol => {
    const req = mol.elementCounts || {};
    const selKeys = Object.keys(selCounts);
    const reqKeys = Object.keys(req);
    if (selKeys.length !== reqKeys.length) return false;
    return reqKeys.every(sym => selCounts[sym] === req[sym]);
  });

  if (matchingMolecule) return createCardFromMolecule(matchingMolecule);
  return null;
}

// 3개 이상의 원소로 분자 생성하는 함수 추가
function createMoleculeFromMultipleElements(elements) {
  if (!gameState || !gameState.moleculesData || !Array.isArray(gameState.elementsData) || elements.length < 2) return null;

  const selCounts = {};
  elements.forEach(el => {
    const sym = el?.element?.symbol || gameState.elementsData.find(e => e.number === el?.element?.number)?.symbol;
    if (!sym) return;
    selCounts[sym] = (selCounts[sym] || 0) + 1;
  });

  const matchingMolecule = gameState.moleculesData.find(mol => {
    const req = mol.elementCounts || {};
    const selKeys = Object.keys(selCounts);
    const reqKeys = Object.keys(req);
    
    // 원소 종류 수가 다르면 매칭되지 않음
    if (selKeys.length !== reqKeys.length) return false;
    
    // 각 원소의 개수가 정확히 일치해야 함
    const exactMatch = reqKeys.every(sym => selCounts[sym] === req[sym]);
    
    // 추가 검증: 단일 원소로만 구성된 분자는 최소 2개 이상의 원소가 필요
    if (reqKeys.length === 1 && Object.values(req)[0] === 1) {
      return false; // 단일 원소 1개로는 분자를 만들 수 없음
    }
    
    return exactMatch;
  });

  if (matchingMolecule) return createCardFromMolecule(matchingMolecule);
  return null;
}

// 분자 카드 생성 함수
function createCardFromMolecule(moleculeData) {
  // 상위원소를 많이 포함하고 재료가 많을수록 극 버프
  const elementNumbers = moleculeData.elements || [];
  const counts = moleculeData.elementCounts || {};
  const maxZ = Math.max(...elementNumbers);
  const uniqueCount = elementNumbers.length;
  const totalMaterials = Object.values(counts).reduce((a, b) => a + b, uniqueCount);

  // 상위원소 단계 가중치(게임의 computeElementStats 단계 정의에 맞춤)
  function getStage(z){ if(z<=10)return 0; if(z<=20)return 1; if(z<=40)return 2; if(z<=70)return 3; return 4; }
  const avgStage = elementNumbers.length > 0 ? (elementNumbers.map(getStage).reduce((a,b)=>a+b,0) / elementNumbers.length) : 0;

  // 기본 분자치: JSON 데이터 우선 사용, 구성 원소 기반 계산
  let baseHp, baseAtk;
  
  // 1순위: molecules.json의 baseStats 사용
  if (moleculeData.baseStats?.hp !== undefined && moleculeData.baseStats?.atk !== undefined) {
    baseHp = moleculeData.baseStats.hp;
    baseAtk = moleculeData.baseStats.atk;
  }
  // 2순위: card_stats.json의 moleculeStats 사용
  else if (gameState.cardStatsData?.moleculeStats) {
    const moleculeStats = gameState.cardStatsData.moleculeStats;
    let elementHp = 0, elementAtk = 0;
    
    elementNumbers.forEach(z => {
      const el = getElementByNumber(z);
      if (el) {
        const stats = window.computeElementStats ? window.computeElementStats(el, el.rarity) : { hp: el.baseHp || 10, atk: el.baseAtk || 5 };
        elementHp += stats.hp;
        elementAtk += stats.atk;
      }
    });
    
    if (elementNumbers.length > 0) {
      baseHp = Math.floor((elementHp / elementNumbers.length) * moleculeStats.baseHpMultiplier);
      baseAtk = Math.floor((elementAtk / elementNumbers.length) * moleculeStats.baseAtkMultiplier);
    } else {
      baseHp = 20;
      baseAtk = 10;
    }
  }
  // 3순위: 구성 원소 기반 계산 (기존 방식)
  else {
    baseHp = 0;
    baseAtk = 0;
    elementNumbers.forEach(z => {
      const el = getElementByNumber(z);
      if (el) {
        const stats = window.computeElementStats ? window.computeElementStats(el, el.rarity) : { hp: el.baseHp || 10, atk: el.baseAtk || 5 };
        baseHp += stats.hp;
        baseAtk += stats.atk;
      }
    });
    if (elementNumbers.length > 0) {
      baseHp = Math.floor(baseHp * 0.8); // 합산 후 기본 보정
      baseAtk = Math.floor(baseAtk * 0.8);
    } else {
      baseHp = 20;
      baseAtk = 10;
    }
  }

  // 극 버프: 상위원소(단계)와 재료 수(총량)에 의해 증폭
  // 단계 1당 1.7배를 기반으로, 평균 단계와 최댓값의 조합으로 가중
  const stagePower = Math.pow(1.7, avgStage) * Math.pow(1.3, getStage(maxZ));
  // 재료 총량이 많을수록, 그리고 서로 다른 재료 수가 많을수록 강해짐
  const materialPower = Math.pow(1.15, totalMaterials) * Math.pow(1.1, uniqueCount - 1);

  const synergyPower = 1 + (uniqueCount >= 2 ? (uniqueCount - 1) * 0.2 : 0);

  const boostedHp = Math.floor(baseHp * stagePower * materialPower * synergyPower);
  const boostedAtk = Math.floor(baseAtk * stagePower * materialPower * (synergyPower * 0.9 + 0.1));

  const finalHp = Math.max(moleculeData.baseStats?.hp || 20, boostedHp);
  const finalAtk = Math.max(moleculeData.baseStats?.atk || 10, boostedAtk);

  return {
    id: moleculeData.id,
    name: moleculeData.name,
    symbol: moleculeData.symbol,
    formula: moleculeData.formula,
    description: moleculeData.description,
    rarity: moleculeData.rarity || 'common',
    color: moleculeData.color || 'bg-gray-600',
    elements: moleculeData.elements || [],
    elementCounts: moleculeData.elementCounts || {},
    baseStats: { 
      hp: moleculeData.baseStats?.hp || 20, 
      atk: moleculeData.baseStats?.atk || 10 
    },
    hp: finalHp,
    atk: finalAtk,
    maxHp: finalHp,
    maxAtk: finalAtk,
    originalMaxHp: finalHp, // 원본 최대 체력 저장 (코인 보상용)
    effects: moleculeData.effects || [],
    specialAbilities: convertMoleculeSpecialAbilities ? convertMoleculeSpecialAbilities(moleculeData) : (moleculeData.specialAbilities || []),
    affinities: moleculeData.affinities || [],
    category: moleculeData.category || 'molecule',
    type: 'molecule',
    owner: 'player',
    lastDamageTurn: 0,
    isSkull: false,
    isSynthesis: false,
    upgradeLevel: 0,
    armor: 0,
    shield: 0,
    // ElementCard와 호환성을 위한 메서드들
    getHealthRatio() {
      return this.hp / this.maxHp;
    },
    isDead() {
      return this.hp <= 0;
    },
    addEffect(effect) {
      if (!this.effects) this.effects = [];
      this.effects.push(effect);
    },
    hasEffect(effectName) {
      return this.effects && this.effects.some(effect => effect.name === effectName);
    },
    getEffectValue(effectName, valueName) {
      const effect = this.effects && this.effects.find(e => e.name === effectName);
      if (effect && effect[valueName] !== undefined) {
        return effect[valueName];
      }
      return 0;
    },
    processTurnEffects() {
      if (!this.effects) return;
      this.effects = this.effects.filter(effect => {
        if (effect.duration !== undefined) {
          effect.duration--;

          if (effect.name === 'dot' && effect.damage) {
            this.hp -= effect.damage;
          }

          if ((effect.name === 'heal' || effect.name === 'regeneration') && effect.healing) {
            this.hp = Math.min(this.maxHp, this.hp + effect.healing);
          }

          return effect.duration > 0 || effect.permanent === true;
        }
        return true;
      });
    }
  };


  return moleculeCard;
}

// 자동 분자 합성 확인 함수
function checkAutoMoleculeCreation(laneIndex, side) {
  const lane = battlefield.lanes[laneIndex];
  const card = lane[side];

  // 카드 유효성 및 소유자 확인
  if (!card || card.isSkull || card.owner !== side) return false;

  // 원소 카드인 경우에만 분자 생성 시도
  if (card.type !== 'element' && !card.element) return false;

  // 주변에 다른 원소가 있는지 확인
  const adjacentLanes = [laneIndex - 1, laneIndex + 1].filter(i => i >= 0 && i < battlefield.lanes.length);
  
  // 인접한 원소들을 수집
  const adjacentElements = [];
  for (const adjLaneIndex of adjacentLanes) {
    const adjLane = battlefield.lanes[adjLaneIndex];
    const adjCard = adjLane[side];
    
    if (adjCard && adjCard.type === 'element' && adjCard.element && 
        adjCard.element.number !== card.element.number) {
      adjacentElements.push({card: adjCard, laneIndex: adjLaneIndex});
    }
  }
  
  // 2개 원소로 분자 생성 시도 (이제 인벤토리에 생성)
  for (const adjElement of adjacentElements) {
    const newMolecule = createMoleculeFromElements(card, adjElement.card);
    if (newMolecule) {
      console.log(`[checkAutoMoleculeCreation] Auto-molecule creation (to inventory) triggered! Molecule: ${newMolecule.name}`);

      // 인벤토리에 적립
      if (window.gameState?.fusionSystem) {
        const molId = newMolecule.id || (newMolecule.formula?.toLowerCase?.() || newMolecule.symbol?.toLowerCase?.());
        if (molId) {
          const before = gameState.fusionSystem.materials[molId] || 0;
          gameState.fusionSystem.materials[molId] = before + 1;
          console.log(`[checkAutoMoleculeCreation-2elem] 인벤토리 적립: molId=${molId}, 이전=${before}, 이후=${gameState.fusionSystem.materials[molId]}`);
          
          // 분자 카드를 손패에 추가
          if (typeof addCardToHand === 'function') {
            addCardToHand(newMolecule, 'player');
            console.log(`[checkAutoMoleculeCreation-2elem] 분자 카드 손패 추가: ${newMolecule.name}`);
          }
        } else {
          console.warn('[checkAutoMoleculeCreation-2elem] 경고: molId 계산 실패');
        }
      }

      // 사용한 원소 카드 제거 (분자를 필드에 배치하지 않음)
      battlefield.lanes[laneIndex][side] = null;
      battlefield.lanes[adjElement.laneIndex][side] = null;

      try { console.log(`[checkAutoMoleculeCreation-2elem] materials 스냅샷:`, JSON.parse(JSON.stringify(gameState.fusionSystem.materials||{}))); } catch(e) {}
      showMessage(`분자 생성: ${newMolecule.name}가 인벤토리에 추가되었습니다.`, 'success');
      return true;
    }
  }
  
  // 3개 이상의 원소로 분자 생성 시도 (물 H2O 등) - 인벤토리에 생성
  if (adjacentElements.length >= 1) {
    const allElements = [card, ...adjacentElements.map(ae => ae.card)];
    const newMolecule = createMoleculeFromMultipleElements(allElements);
    if (newMolecule) {
      console.log(`[checkAutoMoleculeCreation] Multi-element molecule creation (to inventory) triggered! Molecule: ${newMolecule.name}`);

      // 인벤토리에 적립
      if (window.gameState?.fusionSystem) {
        const molId = newMolecule.id || (newMolecule.formula?.toLowerCase?.() || newMolecule.symbol?.toLowerCase?.());
        if (molId) {
          const before = gameState.fusionSystem.materials[molId] || 0;
          gameState.fusionSystem.materials[molId] = before + 1;
          console.log(`[checkAutoMoleculeCreation-Nelem] 인벤토리 적립: molId=${molId}, 이전=${before}, 이후=${gameState.fusionSystem.materials[molId]}`);
          
          // 분자 카드를 손패에 추가
          if (typeof addCardToHand === 'function') {
            addCardToHand(newMolecule, 'player');
            console.log(`[checkAutoMoleculeCreation-Nelem] 분자 카드 손패 추가: ${newMolecule.name}`);
          }
        } else {
          console.warn('[checkAutoMoleculeCreation-Nelem] 경고: molId 계산 실패');
        }
      }

      // 사용한 원소 카드들 제거 (필드에 분자 배치하지 않음)
      battlefield.lanes[laneIndex][side] = null;
      adjacentElements.forEach(ae => {
        battlefield.lanes[ae.laneIndex][side] = null;
      });

      try { console.log(`[checkAutoMoleculeCreation-Nelem] materials 스냅샷:`, JSON.parse(JSON.stringify(gameState.fusionSystem.materials||{}))); } catch(e) {}
      showMessage(`분자 생성: ${newMolecule.name}가 인벤토리에 추가되었습니다.`, 'success');
      return true;
    }
  }

  return false;
}

// Helper function to get element data by symbol (needs implementation)
function getElementBySymbol(symbol) {
    return gameState.elementsData.find(el => el.symbol === symbol);
}

// Assuming findPossibleMolecules is defined here:
function findPossibleMolecules(card, laneIndex, side) {
  if (!gameState || !gameState.moleculesData) return [];
  
  const possibleMolecules = [];
  
  // 현재 카드와 인접한 카드들을 확인
  const adjacentLanes = [laneIndex - 1, laneIndex + 1].filter(i => i >= 0 && i < battlefield.lanes.length);
  
  for (const adjLaneIndex of adjacentLanes) {
    const adjLane = battlefield.lanes[adjLaneIndex];
    const adjCard = adjLane[side];
    
    if (adjCard && adjCard.type === 'element' && adjCard.element && 
        adjCard.element.number !== card.element.number) {
      // 두 원소로 분자 생성 시도
      const newMolecule = createMoleculeFromElements(card, adjCard);
      if (newMolecule) {
        possibleMolecules.push({
          molecule: newMolecule,
          laneIndex: adjLaneIndex,
          description: `${card.element.symbol} + ${adjCard.element.symbol} = ${newMolecule.name}`
        });
      }
    }
  }
  
  return possibleMolecules;
}

// New function to synthesize two card objects
function synthesizeCards(card1, card2) {
    if (!card1 || !card2 || card1.isSkull || card2.isSkull) {
        console.error("[synthesizeCards] Invalid input cards.", card1, card2);
        return null;
    }

    console.log(`[synthesizeCards] Attempting to synthesize: ${card1.name} and ${card2.name}`);

    // 1. Combine Components
    const components1 = card1.isSynthesis ? card1.components : [card1.element.number];
    const components2 = card2.isSynthesis ? card2.components : [card2.element.number];
    const combinedComponents = [...components1, ...components2].sort((a, b) => a - b);

    console.log(`[synthesizeCards] Combined components: ${JSON.stringify(combinedComponents)}`);

    // 2. Check for Molecule Formation
    let matchingMolecule = null;
    if (gameState.moleculesData) {
        matchingMolecule = gameState.moleculesData.find(mol => {
            if (mol.elements.length !== combinedComponents.length) return false;
            const molElements = [...mol.elements].sort((a, b) => a - b);
            return molElements.every((elem, index) => elem === combinedComponents[index]);
        });
    }

    console.log(`[synthesizeCards] molecule search result:`, matchingMolecule);

    // 3. Create New Card Data with enhanced stats based on element combination
    const maxElementNumber = Math.max(...combinedComponents);
    const minElementNumber = Math.min(...combinedComponents);
    
    // 원소 조합에 따른 가파른 증가 공식
    const elementPower = Math.pow(maxElementNumber, 1.4) + Math.pow(minElementNumber, 1.1);
    const synergyBonus = combinedComponents.length > 1 ? Math.pow(combinedComponents.length, 1.2) : 1;
    
    // 기본 합산 능력치
    const baseHp = (card1.maxHp || 0) + (card2.maxHp || 0);
    const baseAtk = (card1.atk || 0) + (card2.atk || 0);
    
    // 원소 조합 보너스 적용
    const enhancedHp = Math.floor(baseHp * (1 + elementPower * 0.3 * synergyBonus));
    const enhancedAtk = Math.floor(baseAtk * (1 + elementPower * 0.25 * synergyBonus));
    
    let newCardData = {
        components: combinedComponents,
        isSynthesis: true,
        // Enhanced Stats based on element combination
        maxHp: enhancedHp,
        hp: enhancedHp, // Use enhanced HP for current HP too
        atk: enhancedAtk,
        upgradeLevel: 0, // Start upgrades from 0 for new synthesis
        // Determine Rarity (e.g., highest rarity of components)
        rarity: 'common', // Placeholder, calculate below
        // Other properties will be filled based on reaction or defaults
    };

    const componentElements = combinedComponents.map(num => getElementByNumber(num)).filter(el => el);
    if (componentElements.length > 0) {
        newCardData.rarity = getHighestRarity(componentElements.map(el => el.rarity || 'common'));
    }

    if (matchingMolecule) {
        // --- Molecule Formed ---
        console.log(`[synthesizeCards] SUCCESS: ${matchingMolecule.name} formed.`);                                                                             
        newCardData.name = matchingMolecule.name;
        newCardData.moleculeId = matchingMolecule.id;
        newCardData.effect = matchingMolecule.effects;
        newCardData.specialAbilities = matchingMolecule.specialAbilities;
        newCardData.affinities = matchingMolecule.affinities;
        newCardData.category = matchingMolecule.category;
        newCardData.rarity = matchingMolecule.rarity;
    } else {
        // 일반 합성물 생성 금지: 매칭되는 분자가 없으면 합성 실패 처리
        console.log('[synthesizeCards] FAILED: No specific molecule formed. Generic synthesis is disabled.');
        return null;
    }

    // 4. Create a new Card instance
    if (matchingMolecule) {
        // 분자 카드 생성
        const newSynthesizedCard = createCardFromMolecule(matchingMolecule);
        newSynthesizedCard.components = combinedComponents;
        newSynthesizedCard.isSynthesis = true;
        newSynthesizedCard.owner = 'player';
        newSynthesizedCard.id = generateUniqueId();
        
        console.log("[synthesizeCards] Created new molecule card:", newSynthesizedCard);
        return newSynthesizedCard;
    }
}

// Helper function to get highest rarity (ensure it's defined or imported)
function getHighestRarity(rarities) {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    let highest = 'common';
    let highestIndex = -1;
    for (const rarity of rarities) {
        const index = order.indexOf(rarity);
        if (index > highestIndex) {
            highestIndex = index;
            highest = rarity;
        }
    }
    return highest;
}

// Helper function for unique IDs (ensure it's defined or imported)
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 9);
}

// 분자 데이터 로딩 상태 확인 함수
function checkMoleculesDataLoaded() {
  console.log('[checkMoleculesDataLoaded] Checking molecules data...');
  console.log('[checkMoleculesDataLoaded] gameState exists:', !!gameState);
  console.log('[checkMoleculesDataLoaded] moleculesData exists:', !!gameState?.moleculesData);
  console.log('[checkMoleculesDataLoaded] moleculesData length:', gameState?.moleculesData?.length || 0);
  
  if (gameState?.moleculesData?.length > 0) {
    console.log('[checkMoleculesDataLoaded] Sample molecule:', gameState.moleculesData[0]);
  }
  
  return !!(gameState && gameState.moleculesData && gameState.moleculesData.length > 0);
}

// Export functions for module imports
export {
  findPossibleMolecules,
  checkAutoMoleculeCreation,
  synthesizeCards,
  createMoleculeFromElements,
  createMoleculeFromMultipleElements,
  createCardFromMolecule,
  checkMoleculesDataLoaded,
  getElementByNumber
};

// Expose functions globally
window.findPossibleMolecules = findPossibleMolecules;
window.checkAutoMoleculeCreation = typeof checkAutoMoleculeCreation !== 'undefined' ? checkAutoMoleculeCreation : undefined;
window.synthesizeCards = synthesizeCards;
window.createMoleculeFromElements = createMoleculeFromElements;
window.createMoleculeFromMultipleElements = createMoleculeFromMultipleElements;
window.createCardFromMolecule = createCardFromMolecule;
window.checkMoleculesDataLoaded = checkMoleculesDataLoaded;
