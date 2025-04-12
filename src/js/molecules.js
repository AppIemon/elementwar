class Molecule {
  constructor(id, name, elements, effect) {
    this.id = id;
    this.name = name;
    this.elements = elements;
    this.effect = effect;
    this.icon = this.generateIcon();
    this.upgradeLevel = 0; // 분자도 업그레이드 가능
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
      
      // 업그레이드 레벨에 따른 효과 강화
      if (sourceCard.upgradeLevel > 0) {
        this.applyUpgradedEffect(sourceCard, targetCard);
      }
      
      return result;
    }
    
    return false;
  }
  
  // 업그레이드 레벨에 따른 추가 효과 적용
  applyUpgradedEffect(sourceCard, targetCard) {
    // 레벨에 따른 추가 효과
    if (sourceCard.upgradeLevel >= 3) {
      // 레벨 3 효과 - 효과 지속시간 증가
      for (const effect of targetCard.effects) {
        if (effect.duration) {
          effect.duration += 1;
        }
      }
      
      // 추가 피해나 회복
      if (this.effect.value) {
        if (this.effect.type.includes('damage') || this.effect.type.includes('burn')) {
          targetCard.hp -= Math.floor(this.effect.value * 0.5); // 50% 추가 피해
          showMessage(`강화된 분자가 추가 피해를 입혔습니다!`, 'warning');
        } else if (this.effect.type.includes('heal')) {
          sourceCard.hp = Math.min(sourceCard.maxHp, sourceCard.hp + Math.floor(this.effect.value * 0.5)); // 50% 추가 회복
          showMessage(`강화된 분자가 추가 회복 효과를 발휘했습니다!`, 'success');
        }
      }
    }
    
    // 레벨 2 효과 - 효과 강도 증가
    else if (sourceCard.upgradeLevel >= 2) {
      if (this.effect.value) {
        // 효과 값 30% 증가
        if (this.effect.type.includes('damage') || this.effect.type.includes('burn')) {
          targetCard.hp -= Math.floor(this.effect.value * 0.3); // 30% 추가 피해
        } else if (this.effect.type.includes('heal')) {
          sourceCard.hp = Math.min(sourceCard.maxHp, sourceCard.hp + Math.floor(this.effect.value * 0.3)); // 30% 추가 회복
        }
      }
    }
    
    // 레벨 1 효과 - 지속시간 약간 증가
    else if (sourceCard.upgradeLevel >= 1) {
      // 효과 지속시간 +1
      for (const effect of targetCard.effects) {
        if (effect.duration) {
          effect.duration += 1;
        }
      }
    }
  }

  // 여기서부터는 기존의 효과 처리 메서드들...
  applyBoostAttack(sourceCard, targetCard) {
    // 효과 강도 향상 (업그레이드 레벨 반영)
    const boostValue = this.effect.value + (sourceCard.upgradeLevel || 0);
    sourceCard.atk += boostValue;
    targetCard.atk += boostValue;
    showMessage(`${this.name}의 효과로 공격력이 ${boostValue} 증가했습니다!`, 'success');
    return true;
  }

  applyBoostHealth(sourceCard, targetCard) {
    // 효과 강도 향상 (업그레이드 레벨 반영)
    const boostValue = this.effect.value + (sourceCard.upgradeLevel * 2 || 0);
    sourceCard.hp += boostValue;
    sourceCard.maxHp += boostValue;
    targetCard.hp += boostValue;
    targetCard.maxHp += boostValue;
    showMessage(`${this.name}의 효과로 체력이 ${boostValue} 증가했습니다!`, 'success');
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

// 효과 설명 문자열 생성 함수 강화
Molecule.prototype.getEffectDescription = function() {
  if (!this.effect) return '효과 없음';
  
  let description = '';
  
  // 효과 유형별로 보기 좋게 표시
  switch (this.effect.type) {
    case 'boost_attack':
      description = `공격력 +${this.effect.value}`;
      break;
    case 'boost_health':
      description = `체력 +${this.effect.value}`;
      break;
    case 'damage':
      description = `피해량 ${this.effect.value}`;
      break;
    case 'explosive':
      description = `폭발 피해 (즉사)`;
      break;
    case 'damage_over_time':
      description = `${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
      break;
    case 'corrosive':
      description = `방어력 -${this.effect.value}`;
      break;
    case 'explosive_damage':
      description = `폭발 피해 ${this.effect.value}${this.effect.aoe ? ' (주변 피해)' : ''}`;
      break;
    case 'shield_reduction':
      description = `보호막 감소 ${this.effect.value}`;
      break;
    case 'suffocation':
      description = `질식: 공격력 20% 감소`;
      break;
    case 'acid_damage':
      description = `산성 피해 ${this.effect.value} (방어력 관통)`;
      break;
    case 'freeze':
      description = `${this.effect.duration || 1}턴 동안 행동 불가`;
      break;
    case 'intoxication':
      description = `중독: 공격이 불규칙해짐`;
      break;
    case 'poison':
      description = `독: ${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
      break;
    case 'heal_over_time':
      description = `${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 회복`;
      break;
    case 'base_damage':
      description = `염기성 피해 ${this.effect.value} (산성과 반응 시 2배 피해)`;
      break;
    case 'burn':
      description = `화상: ${this.effect.duration || 1}턴 동안 매턴 ${this.effect.value} 피해`;
      break;
    case 'armor':
      description = `방어력 +${this.effect.value}`;
      break;
    case 'barrier':
      description = `보호막: ${this.effect.duration || 1}턴 동안 ${this.effect.value} 피해 흡수`;
      break;
    case 'catalyst':
      description = `촉매: 행동 속도 증가`;
      break;
    default:
      description = this.effect.description || `${this.effect.type} 효과`;
  }
  
  // 업그레이드 레벨에 따른 추가 설명
  if (this.upgradeLevel >= 3) {
    description += ' (최대 강화: 효과 지속시간 +1, 효과 강도 +50%)';
  } else if (this.upgradeLevel >= 2) {
    description += ' (강화: 효과 강도 +30%)';
  } else if (this.upgradeLevel >= 1) {
    description += ' (강화: 효과 지속시간 +1턴)';
  }
  
  return description;
};

// 분자 카드 생성 함수 개선 - 더 높은 능력치 부여
function createMoleculeFromReaction(reaction) {
  if (!reaction.moleculeId) return null;
  
  // 분자 기본 정보
  const molecule = new Molecule(
    reaction.moleculeId,
    reaction.moleculeName || reaction.result.split(' ')[0],
    reaction.elements,
    reaction.effect || { type: 'default', description: '기본 효과' }
  );
  
  // 분자 등급 결정 (구성 원소 수와 레어도에 따름)
  const elementCount = reaction.elements.length;
  let rarity = 'common';
  
  if (elementCount >= 5) rarity = 'legendary';
  else if (elementCount >= 4) rarity = 'epic';
  else if (elementCount >= 3) rarity = 'rare';
  else if (elementCount >= 2) rarity = 'uncommon';
  
  molecule.rarity = rarity;
  
  // 분자 정보 확장
  const moleculeInfo = getMoleculeInfo(reaction.moleculeId);
  if (moleculeInfo) {
    molecule.color = moleculeInfo.color || 'bg-purple-600';
    molecule.description = moleculeInfo.description;
    molecule.englishName = moleculeInfo.englishName;
    molecule.formula = moleculeInfo.formula;
    
    // 더 높은 능력치 부여
    molecule.baseHp = moleculeInfo.baseHp || 10 + elementCount * 3;
    molecule.baseAtk = moleculeInfo.baseAtk || 8 + elementCount * 2;
    
    // 특수 능력
    molecule.specialAbility = moleculeInfo.specialAbility;
  } else {
    // 기본 값 설정
    molecule.color = 'bg-purple-600';
    molecule.baseHp = 10 + elementCount * 3;
    molecule.baseAtk = 8 + elementCount * 2;
  }
  
  return molecule;
}

// 분자 정보 조회 함수
function getMoleculeInfo(id) {
  return MOLECULES_DATABASE.find(m => m.id === id);
}

// 레어도에 따른 분자 능력치 보너스
const rarityBonuses = {
  common: { hp: 1, atk: 1 },
  uncommon: { hp: 1.2, atk: 1.3 },
  rare: { hp: 1.4, atk: 1.5 },
  epic: { hp: 1.7, atk: 1.8 },
  legendary: { hp: 2, atk: 2.2 }
};

// 분자 카드 객체 생성 함수
function createMoleculeCard(molecule, baseCard, stackedCards) {
  // 기본 능력치 설정
  const rarity = molecule.rarity || 'uncommon';
  const bonus = rarityBonuses[rarity] || rarityBonuses.uncommon;
  
  // 스택된 카드 능력치 합산
  let totalHp = baseCard.hp;
  let totalAtk = baseCard.atk;
  
  stackedCards.forEach(card => {
    if (card.originalHP) totalHp += card.originalHP;
    if (card.originalATK) totalAtk += card.originalATK;
  });
  
  // 등급에 따른 보너스 적용
  const hp = Math.ceil(totalHp * bonus.hp);
  const atk = Math.ceil(totalAtk * bonus.atk);
  
  // 카드 객체 생성
  const card = {
    id: `molecule-${Math.random().toString(36).substring(2, 9)}`,
    element: {
      symbol: molecule.id,
      name: molecule.name,
      englishName: molecule.englishName || molecule.name,
      description: molecule.description || '',
      number: -1, // 분자는 음수 번호
      color: molecule.color || 'bg-purple-600',
      category: '분자',
      baseHp: molecule.baseHp || hp,
      baseAtk: molecule.baseAtk || atk,
      specialAbility: molecule.specialAbility
    },
    hp: hp,
    maxHp: hp,
    atk: atk,
    maxAtk: atk,
    owner: baseCard.owner,
    isMolecule: true,
    molecules: molecule,
    stacked: baseCard.stacked || [],
    effects: [],
    
    // 기본 메서드 구현
    getHealthRatio: function() {
      return this.hp / this.maxHp;
    },
    
    isDead: function() {
      return this.hp <= 0;
    },
    
    addEffect: function(effect) {
      this.effects.push(effect);
    },
    
    hasEffect: function(effectName) {
      return this.effects.some(effect => effect.name === effectName);
    }
  };
  
  // 스택에 원래 카드도 추가
  card.stacked.push({
    isSkull: true,
    originalElement: baseCard.element,
    originalHP: baseCard.hp,
    originalATK: baseCard.atk,
    owner: baseCard.owner
  });
  
  return card;
}

function getElementByNumber(number) {
  return gameState.elementsData.find(e => e.number === number);
}

/**
 * 분자 관리 시스템
 */

// 분자 데이터베이스 (100개)
const MOLECULES_DATABASE = [
  // 1. 물 H₂O
  {
    id: 'H2O',
    formula: 'H₂O',
    name: '물',
    englishName: 'Water',
    components: ['H', 'H', 'O'],
    description: '지구상에서 가장 중요한 물질 중 하나로, 생명 유지에 필수적입니다.',
    color: 'bg-blue-400',
    baseAtk: 6,
    baseHp: 8,
    rarity: 'uncommon',
    effect: { type: 'heal', value: 2 }
  },
  // 2. 이산화탄소 CO₂
  {
    id: 'CO2',
    formula: 'CO₂',
    name: '이산화탄소',
    englishName: 'Carbon Dioxide',
    components: ['C', 'O', 'O'],
    description: '식물 광합성에 필요하며 온실 효과를 일으키는 기체입니다.',
    color: 'bg-gray-500',
    baseAtk: 7,
    baseHp: 7,
    rarity: 'uncommon',
    effect: { type: 'poison', value: 1, duration: 2 }
  },
  // 3. 메탄 CH₄
  {
    id: 'CH4',
    formula: 'CH₄',
    name: '메탄',
    englishName: 'Methane',
    components: ['C', 'H', 'H', 'H', 'H'],
    description: '가장 간단한 탄화수소로, 천연가스의 주성분입니다.',
    color: 'bg-green-600',
    baseAtk: 10,
    baseHp: 8,
    rarity: 'rare',
    effect: { type: 'burn', value: 3 }
  },
  // 추가 분자들...
  // 4. 암모니아 NH₃
  {
    id: 'NH3',
    formula: 'NH₃',
    name: '암모니아',
    englishName: 'Ammonia',
    components: ['N', 'H', 'H', 'H'],
    description: '자극적인 냄새가 나는 무색 기체로, 비료 제조에 사용됩니다.',
    color: 'bg-yellow-300',
    baseAtk: 9,
    baseHp: 9,
    rarity: 'rare',
    effect: { type: 'poison', value: 2, duration: 3 }
  },
  // 5. 염화나트륨(소금) NaCl
  {
    id: 'NaCl',
    formula: 'NaCl',
    name: '염화나트륨',
    englishName: 'Sodium Chloride',
    components: ['Na', 'Cl'],
    description: '일반적인 소금으로, 음식 조리와 보존에 사용됩니다.',
    color: 'bg-gray-100',
    baseAtk: 6,
    baseHp: 10,
    rarity: 'uncommon',
    effect: { type: 'defense', value: 3 }
  }
  // 나머지 95개는 실제 구현 시 추가 필요
];

/**
 * 지정된 분자 ID에 대한 정보 검색
 * @param {string} id - 분자 ID나 공식
 * @returns {Object|null} - 분자 정보 또는 null
 */
function getMoleculeInfo(id) {
  if (!id) return null;
  
  // ID 또는 공식으로 분자 정보 검색
  return MOLECULES_DATABASE.find(m => 
    m.id === id || m.formula === id || m.formula.replace(/₂|₃|₄/g, '') === id
  ) || null;
}

/**
 * 원소 심볼 목록으로 일치하는 분자 검색
 * @param {Array} elements - 원소 심볼 배열
 * @returns {Object|null} - 일치하는 분자 또는 null
 */
function findMoleculeByElements(elements) {
  if (!elements || elements.length < 2) return null;
  
  // 정렬된 원소 목록
  const sortedElements = [...elements].sort();
  
  // 데이터베이스에서 일치하는 분자 검색
  for (const molecule of MOLECULES_DATABASE) {
    const sortedComponents = [...molecule.components].sort();
    
    // 원소 구성이 정확히 일치하는지 확인
    if (arraysEqual(sortedElements, sortedComponents)) {
      return molecule;
    }
  }
  
  return null;
}

/**
 * 두 배열이 완전히 동일한지 확인
 * @param {Array} arr1 - 첫 번째 배열
 * @param {Array} arr2 - 두 번째 배열
 * @returns {boolean} - 동일 여부
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
}

/**
 * 특정 희귀도의 분자 목록 가져오기
 * @param {string} rarity - 희귀도 ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {Array} - 일치하는 분자 배열
 */
function getMoleculesByRarity(rarity) {
  if (!rarity) return [];
  
  return MOLECULES_DATABASE.filter(m => m.rarity === rarity);
}

/**
 * 플레이어가 발견한 모든 분자 가져오기
 * @returns {Array} - 발견된 분자 배열
 */
function getDiscoveredMolecules() {
  const collection = JSON.parse(localStorage.getItem('moleculeCollection')) || [];
  return collection;
}

/**
 * 분자 이름 표기를 형식화 (아래 첨자 처리 등)
 * @param {string} formula - 분자식
 * @returns {string} - 형식화된 분자식
 */
function formatMolecularFormula(formula) {
  if (!formula) return '';
  
  // 숫자를 아래 첨자로 변환
  return formula.replace(/([0-9]+)/g, (match, number) => {
    // 각 숫자에 맞는 유니코드 아래 첨자로 변환
    const subscripts = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    
    let result = '';
    for (let i = 0; i < number.length; i++) {
      result += subscripts[number[i]] || number[i];
    }
    
    return result;
  });
}

/**
 * 분자 HTML 표현 생성
 * @param {Object} molecule - 분자 객체
 * @returns {string} - HTML 문자열
 */
function getMoleculeHTML(molecule) {
  if (!molecule) return '';
  
  return `
    <div class="molecule-card ${molecule.color || 'bg-purple-600'} p-3 rounded-lg shadow-lg">
      <h3 class="font-bold text-center">${molecule.formula}</h3>
      <p class="text-sm text-center mb-2">${molecule.name}</p>
      <div class="flex justify-between text-sm">
        <span>⚔️ ${molecule.baseAtk}</span>
        <span>❤️ ${molecule.baseHp}</span>
      </div>
      <div class="text-xs mt-2 text-center text-purple-200">
        ${molecule.effect ? getEffectDescription(molecule.effect) : ''}
      </div>
    </div>
  `;
}

/**
 * 효과 설명 생성
 * @param {Object} effect - 효과 객체
 * @returns {string} - 효과 설명
 */
function getEffectDescription(effect) {
  if (!effect) return '';
  
  const effects = {
    'heal': `회복: 턴마다 ${effect.value}의 체력을 회복합니다.`,
    'damage': `피해: 공격 시 ${effect.value}의 추가 피해를 입힙니다.`,
    'poison': `중독: ${effect.duration || 2}턴 동안 매 턴 ${effect.value}의 피해를 입힙니다.`,
    'burn': `화상: ${effect.duration || 2}턴 동안 매 턴 ${effect.value}의 피해를 입힙니다.`,
    'freeze': `빙결: ${effect.duration || 1}턴 동안 대상을 얼립니다.`,
    'defense': `방어: ${effect.value}의 방어력을 추가합니다.`,
    'boost': `강화: 아군 카드의 공격력을 ${effect.value} 증가시킵니다.`,
    'corrode': `부식: ${effect.value}의 피해를 입히고 방어력을 무시합니다.`
  };
  
  return effects[effect.type] || '특수 효과를 발동합니다.';
}

// 전역으로 함수 노출
window.getMoleculeInfo = getMoleculeInfo;
window.findMoleculeByElements = findMoleculeByElements;
window.getMoleculesByRarity = getMoleculesByRarity;
window.getDiscoveredMolecules = getDiscoveredMolecules;
window.formatMolecularFormula = formatMolecularFormula;
window.getMoleculeHTML = getMoleculeHTML;
