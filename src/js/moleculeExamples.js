// molecules.json에서 사용할 수 있는 ability 함수 예시들
// 이 파일은 참고용이며, 실제 molecules.json에 적용할 수 있는 예시들을 제공합니다.

const moleculeAbilityExamples = {
  // 화상 효과
  burnExample: {
    "name": "화염 폭발",
    "ability": "(me, enemy) => { if (enemy) { enemy.addStatusEffect('burn', 3); } }"
  },

  // 독 효과
  poisonExample: {
    "name": "독성 가스",
    "ability": "(me, enemy) => { if (enemy && !enemy.hasStatusEffect('poison')) { enemy.addStatusEffect('poison', 4); } }"
  },

  // 빙결 효과
  freezeExample: {
    "name": "빙결 공격",
    "ability": "(me, enemy) => { if (enemy && !enemy.immunities.includes('freeze')) { enemy.addStatusEffect('freeze', 2); } }"
  },

  // 기절 효과
  stunExample: {
    "name": "충격파",
    "ability": "(me, enemy) => { if (enemy && !enemy.immunities.includes('stun')) { enemy.addStatusEffect('stun', 1); } }"
  },

  // 보호막 효과
  shieldExample: {
    "name": "에너지 보호막",
    "ability": "(me, enemy) => { me.addStatusEffect('shield', 0, {shieldAmount: Math.floor(me.maxHp * 0.2)}); }"
  },

  // 재생 효과
  regenerationExample: {
    "name": "자연 회복",
    "ability": "(me, enemy) => { me.addStatusEffect('regeneration', 5); }"
  },

  // 분노 효과
  rageExample: {
    "name": "광폭화",
    "ability": "(me, enemy) => { me.addStatusEffect('rage', 3); }"
  },

  // 갑옷 효과
  armorExample: {
    "name": "강화 갑옷",
    "ability": "(me, enemy) => { me.addStatusEffect('armor', 4, {armorAmount: Math.floor(me.atk * 0.5)}); }"
  },

  // 복합 효과
  complexExample: {
    "name": "원소 폭발",
    "ability": "(me, enemy) => { if (enemy) { enemy.takeDamage(me.getAttackPower() * 1.5, 'fire'); enemy.addStatusEffect('burn', 2); } me.addStatusEffect('shield', 0, {shieldAmount: Math.floor(me.maxHp * 0.1)}); }"
  },

  // 조건부 효과
  conditionalExample: {
    "name": "응급 처치",
    "ability": "(me, enemy) => { if (me.getHealthRatio() < 0.3) { me.addStatusEffect('regeneration', 3); me.addStatusEffect('shield', 0, {shieldAmount: Math.floor(me.maxHp * 0.15)}); } }"
  },

  // 상대 상태 이상 제거
  cleanseExample: {
    "name": "정화",
    "ability": "(me, enemy) => { if (enemy) { enemy.removeStatusEffect('burn'); enemy.removeStatusEffect('poison'); enemy.removeStatusEffect('freeze'); enemy.removeStatusEffect('stun'); } }"
  },

  // 저항력 부여
  resistanceExample: {
    "name": "원소 저항",
    "ability": "(me, enemy) => { me.resistances.fire = 0.5; me.resistances.ice = 0.5; me.resistances.electric = 0.5; }"
  },

  // 면역 부여
  immunityExample: {
    "name": "상태 이상 면역",
    "ability": "(me, enemy) => { me.immunities.push('stun', 'freeze', 'burn', 'poison'); }"
  },

  // 피해와 상태 이상 동시 적용
  damageAndStatusExample: {
    "name": "독성 칼날",
    "ability": "(me, enemy) => { if (enemy) { const damage = me.getAttackPower() * 0.8; enemy.takeDamage(damage, 'poison'); enemy.addStatusEffect('poison', 3); } }"
  },

  // 체력 비율에 따른 효과
  healthBasedExample: {
    "name": "절체절명",
    "ability": "(me, enemy) => { if (me.getHealthRatio() < 0.2) { me.addStatusEffect('rage', 5); me.atkMultiplier *= 2; } }"
  },

  // 턴 시작 시 효과
  turnStartExample: {
    "name": "자동 회복",
    "ability": "(me, enemy) => { me.heal(Math.floor(me.maxHp * 0.05)); }"
  },

  // 상대 카드 타입에 따른 효과
  typeBasedExample: {
    "name": "원소 상성",
    "ability": "(me, enemy) => { if (enemy && enemy.element && enemy.element.category === 'fire') { enemy.addStatusEffect('burn', 4); } else if (enemy && enemy.element && enemy.element.category === 'water') { enemy.addStatusEffect('freeze', 2); } }"
  }
};

// 전역으로 노출
window.moleculeAbilityExamples = moleculeAbilityExamples;

// 사용법 가이드
console.log(`
=== molecules.json ability 함수 사용법 ===

1. 기본 형식:
   "ability": "(me, enemy) => { /* 로직 */ }"

2. me 객체: 자신의 카드
3. enemy 객체: 상대 카드 (없을 수 있음)

4. 사용 가능한 메서드:
   - me.addStatusEffect(name, duration, data)
   - me.removeStatusEffect(name)
   - me.hasStatusEffect(name)
   - me.takeDamage(damage, type)
   - me.heal(amount)
   - me.getAttackPower()
   - me.getDefensePower()
   - me.getHealthRatio()

5. 예시들:
   ${Object.keys(moleculeAbilityExamples).join(', ')}

자세한 내용은 cardProperties.js 파일을 참고하세요.
`);
