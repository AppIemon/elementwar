// 상태 이상 시스템
class StatusEffectSystem {
  constructor() {
    this.effects = new Map();
    this.initializeEffects();
  }

  // 상태 이상 정의
  initializeEffects() {
    // 지속 피해 (DoT)
    this.effects.set('burn', {
      name: '화상',
      type: 'dot',
      duration: 3,
      damage: 0,
      damagePercent: 0.05, // HP의 5%
      color: '#ff4444',
      icon: '🔥',
      description: '매 턴 HP의 5% 피해',
      onApply: (target) => {
        target.addStatusEffect('burn', 3);
        this.showStatusAnimation(target, 'burn');
      },
      onTurn: (target) => {
        const damage = Math.floor(target.hp * 0.05);
        target.takeDamage(damage, 'burn');
        this.showDamageAnimation(target, damage, '#ff4444');
      }
    });

    // 독
    this.effects.set('poison', {
      name: '독',
      type: 'dot',
      duration: 4,
      damage: 0,
      damagePercent: 0.03, // HP의 3%
      color: '#44ff44',
      icon: '☠️',
      description: '매 턴 HP의 3% 피해',
      onApply: (target) => {
        target.addStatusEffect('poison', 4);
        this.showStatusAnimation(target, 'poison');
      },
      onTurn: (target) => {
        const damage = Math.floor(target.hp * 0.03);
        target.takeDamage(damage, 'poison');
        this.showDamageAnimation(target, damage, '#44ff44');
      }
    });

    // 빙결
    this.effects.set('freeze', {
      name: '빙결',
      type: 'debuff',
      duration: 2,
      color: '#44aaff',
      icon: '❄️',
      description: '행동 불가',
      onApply: (target) => {
        target.addStatusEffect('freeze', 2);
        target.canAct = false;
        this.showStatusAnimation(target, 'freeze');
      },
      onTurn: (target) => {
        target.canAct = false;
      },
      onRemove: (target) => {
        target.canAct = true;
      }
    });

    // 기절
    this.effects.set('stun', {
      name: '기절',
      type: 'debuff',
      duration: 1,
      color: '#ffaa44',
      icon: '💫',
      description: '행동 불가',
      onApply: (target) => {
        target.addStatusEffect('stun', 1);
        target.canAct = false;
        this.showStatusAnimation(target, 'stun');
      },
      onTurn: (target) => {
        target.canAct = false;
      },
      onRemove: (target) => {
        target.canAct = true;
      }
    });

    // 보호막
    this.effects.set('shield', {
      name: '보호막',
      type: 'buff',
      duration: 0, // 영구적 (수동으로 제거)
      shieldAmount: 0,
      color: '#ffff44',
      icon: '🛡️',
      description: '피해를 흡수',
      onApply: (target, amount) => {
        target.addStatusEffect('shield', 0, { shieldAmount: amount });
        this.showStatusAnimation(target, 'shield');
      },
      onDamage: (target, damage) => {
        const shield = target.getStatusEffect('shield');
        if (shield && shield.shieldAmount > 0) {
          const absorbed = Math.min(damage, shield.shieldAmount);
          shield.shieldAmount -= absorbed;
          damage -= absorbed;
          this.showShieldAnimation(target, absorbed);
          if (shield.shieldAmount <= 0) {
            target.removeStatusEffect('shield');
          }
        }
        return damage;
      }
    });

    // 재생
    this.effects.set('regeneration', {
      name: '재생',
      type: 'buff',
      duration: 5,
      healing: 0,
      healingPercent: 0.08, // HP의 8%
      color: '#44ff44',
      icon: '💚',
      description: '매 턴 HP의 8% 회복',
      onApply: (target) => {
        target.addStatusEffect('regeneration', 5);
        this.showStatusAnimation(target, 'regeneration');
      },
      onTurn: (target) => {
        const healing = Math.floor(target.maxHp * 0.08);
        target.heal(healing);
        this.showHealAnimation(target, healing);
      }
    });

    // 공격력 증가
    this.effects.set('rage', {
      name: '분노',
      type: 'buff',
      duration: 3,
      atkMultiplier: 1.5,
      color: '#ff4444',
      icon: '😡',
      description: '공격력 50% 증가',
      onApply: (target) => {
        target.addStatusEffect('rage', 3);
        target.atkMultiplier = (target.atkMultiplier || 1) * 1.5;
        this.showStatusAnimation(target, 'rage');
      },
      onRemove: (target) => {
        target.atkMultiplier = (target.atkMultiplier || 1) / 1.5;
      }
    });

    // 방어력 증가
    this.effects.set('armor', {
      name: '갑옷',
      type: 'buff',
      duration: 4,
      armorAmount: 0,
      color: '#888888',
      icon: '🛡️',
      description: '방어력 증가',
      onApply: (target, amount) => {
        target.addStatusEffect('armor', 4, { armorAmount: amount });
        target.armor = (target.armor || 0) + amount;
        this.showStatusAnimation(target, 'armor');
      },
      onRemove: (target) => {
        const armor = target.getStatusEffect('armor');
        if (armor) {
          target.armor = Math.max(0, (target.armor || 0) - armor.armorAmount);
        }
      }
    });
  }

  // 상태 이상 적용
  applyEffect(effectName, target, ...args) {
    const effect = this.effects.get(effectName);
    if (!effect) {
      console.warn(`상태 이상 '${effectName}'을 찾을 수 없습니다.`);
      return false;
    }

    if (effect.onApply) {
      effect.onApply(target, ...args);
    }

    return true;
  }

  // 턴 시작 시 상태 이상 처리
  processTurnEffects(target) {
    const statusEffects = target.statusEffects || [];
    
    for (let i = statusEffects.length - 1; i >= 0; i--) {
      const statusEffect = statusEffects[i];
      const effect = this.effects.get(statusEffect.name);
      
      if (!effect) continue;

      // 턴 시작 시 효과 적용
      if (effect.onTurn) {
        effect.onTurn(target);
      }

      // 지속 시간 감소
      if (statusEffect.duration > 0) {
        statusEffect.duration--;
        
        // 지속 시간이 끝나면 제거
        if (statusEffect.duration <= 0) {
          if (effect.onRemove) {
            effect.onRemove(target);
          }
          statusEffects.splice(i, 1);
        }
      }
    }
  }

  // 피해 계산 시 상태 이상 효과 적용
  processDamageEffects(target, damage, damageType) {
    let finalDamage = damage;
    
    const statusEffects = target.statusEffects || [];
    for (const statusEffect of statusEffects) {
      const effect = this.effects.get(statusEffect.name);
      if (effect && effect.onDamage) {
        finalDamage = effect.onDamage(target, finalDamage, damageType);
      }
    }
    
    return finalDamage;
  }

  // 상태 이상 애니메이션 표시
  showStatusAnimation(target, effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return;

    const cardElement = document.getElementById(target.id);
    if (!cardElement) return;

    // 상태 이상 아이콘 생성
    const statusIcon = document.createElement('div');
    statusIcon.className = 'status-effect-icon';
    statusIcon.textContent = effect.icon;
    statusIcon.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 16px;
      z-index: 10;
      animation: statusEffectAppear 0.5s ease-out;
    `;

    cardElement.appendChild(statusIcon);

    // 3초 후 제거
    setTimeout(() => {
      if (statusIcon.parentNode) {
        statusIcon.parentNode.removeChild(statusIcon);
      }
    }, 3000);
  }

  // 피해 애니메이션 표시
  showDamageAnimation(target, damage, color) {
    const cardElement = document.getElementById(target.id);
    if (!cardElement) return;

    const damageText = document.createElement('div');
    damageText.textContent = `-${damage}`;
    damageText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: ${color};
      font-size: 18px;
      font-weight: bold;
      z-index: 20;
      animation: damageFloat 2s ease-out forwards;
      pointer-events: none;
    `;

    cardElement.appendChild(damageText);

    setTimeout(() => {
      if (damageText.parentNode) {
        damageText.parentNode.removeChild(damageText);
      }
    }, 2000);
  }

  // 회복 애니메이션 표시
  showHealAnimation(target, healing) {
    const cardElement = document.getElementById(target.id);
    if (!cardElement) return;

    const healText = document.createElement('div');
    healText.textContent = `+${healing}`;
    healText.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #44ff44;
      font-size: 16px;
      font-weight: bold;
      z-index: 20;
      animation: healFloat 2s ease-out forwards;
      pointer-events: none;
    `;

    cardElement.appendChild(healText);

    setTimeout(() => {
      if (healText.parentNode) {
        healText.parentNode.removeChild(healText);
      }
    }, 2000);
  }

  // 보호막 애니메이션 표시
  showShieldAnimation(target, absorbed) {
    const cardElement = document.getElementById(target.id);
    if (!cardElement) return;

    const shieldText = document.createElement('div');
    shieldText.textContent = `🛡️ ${absorbed}`;
    shieldText.style.cssText = `
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ffff44;
      font-size: 14px;
      font-weight: bold;
      z-index: 20;
      animation: shieldAbsorb 1.5s ease-out forwards;
      pointer-events: none;
    `;

    cardElement.appendChild(shieldText);

    setTimeout(() => {
      if (shieldText.parentNode) {
        shieldText.parentNode.removeChild(shieldText);
      }
    }, 1500);
  }

  // 상태 이상 정보 가져오기
  getEffectInfo(effectName) {
    return this.effects.get(effectName);
  }

  // 모든 상태 이상 목록 가져오기
  getAllEffects() {
    return Array.from(this.effects.values());
  }
}

// 전역 상태 이상 시스템 인스턴스
window.statusEffectSystem = new StatusEffectSystem();

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes statusEffectAppear {
    0% {
      opacity: 0;
      transform: scale(0.5) translateY(-10px);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) translateY(-5px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes damageFloat {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -80px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -120px) scale(0.8);
    }
  }

  @keyframes healFloat {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -60px) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -100px) scale(0.9);
    }
  }

  @keyframes shieldAbsorb {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -40px) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -80px) scale(0.9);
    }
  }

  .status-effect-icon {
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.8));
  }
`;
document.head.appendChild(style);
