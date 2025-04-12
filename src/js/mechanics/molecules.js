/**
 * 분자 관리 시스템
 */

/**
 * 분자 클래스
 */
class Molecule {
  constructor(id, name, formula, elements, effect) {
    this.id = id || `molecule-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.name = name;
    this.formula = formula;
    this.elements = elements; // 구성 원소 배열
    this.effect = effect; // 특수 효과
    this.power = 0; // 공격력
    this.health = 0; // 체력
    this.maxHealth = 0; // 최대 체력
    this.color = 'bg-purple-600'; // 기본 색상
    this.rarity = 'uncommon'; // 기본 등급
    this.upgradeLevel = 0; // 업그레이드 레벨
    this.isMolecule = true;
  }
  
  /**
   * 분자 초기화 (능력치 계산 등)
   * @param {Array} elementCards - 구성 원소 카드 배열
   * @returns {Molecule} - 초기화된 분자
   */
  initialize(elementCards) {
    if (!elementCards || elementCards.length === 0) return this;
    
    // 기본 능력치 계산 (원소들의 합 + 보너스)
    let totalPower = 0;
    let totalHealth = 0;
    
    elementCards.forEach(card => {
      totalPower += card.power || card.baseAtk || 1;
      totalHealth += card.health || card.baseHp || 1;
    });
    
    // 분자 보너스: 원소들의 합의 50% 추가
    this.power = Math.round(totalPower * 1.5);
    this.health = Math.round(totalHealth * 1.5);
    this.maxHealth = this.health;
    
    return this;
  }
  
  /**
   * 효과 적용
   * @param {Object} sourceCard - 효과 적용 주체 카드
   * @param {Object} targetCard - 효과를 받는 카드
   * @param {Object} battlefield - 전장 정보
   * @returns {boolean} - 효과 적용 성공 여부
   */
  applyEffect(sourceCard, targetCard, battlefield) {
    if (!this.effect || !this.effect.type) return false;
    
    // 효과 유형별 처리
    switch (this.effect.type) {
      case 'heal':
        return this.applyHealEffect(sourceCard, this.effect.value || 1);
      
      case 'damage':
        return this.applyDamageEffect(targetCard, this.effect.value || 1);
      
      case 'poison':
        return this.applyPoisonEffect(targetCard, this.effect.value || 1, this.effect.duration || 2);
      
      case 'burn':
        return this.applyBurnEffect(targetCard, this.effect.value || 1, this.effect.duration || 2);
      
      case 'defense':
        return this.applyDefenseEffect(sourceCard, this.effect.value || 1);
      
      default:
        console.warn(`미구현 효과 유형: ${this.effect.type}`);
        return false;
    }
  }
  
  /**
   * 회복 효과 적용
   * @param {Object} card - 회복 대상 카드
   * @param {number} amount - 회복량
   * @returns {boolean} - 성공 여부
   */
  applyHealEffect(card, amount) {
    if (!card) return false;
    
    // 업그레이드 레벨에 따른 회복량 증가
    const actualAmount = amount + (this.upgradeLevel || 0);
    
    // 체력 회복 (최대 체력 초과 방지)
    card.hp = Math.min(card.maxHp || card.health, card.hp + actualAmount);
    
    // 상태 효과 추가
    card.effectType = 'heal';
    card.effectValue = actualAmount;
    
    // 메시지 표시
    showMessage(`${this.name}이(가) ${actualAmount}만큼 체력을 회복했습니다!`, 'success');
    
    return true;
  }
  
  /**
   * 피해 효과 적용
   * @param {Object} card - 피해 대상 카드
   * @param {number} amount - 피해량
   * @returns {boolean} - 성공 여부
   */
  applyDamageEffect(card, amount) {
    if (!card) return false;
    
    // 업그레이드 레벨에 따른 피해량 증가
    const actualAmount = amount + (this.upgradeLevel || 0);
    
    // 체력 감소
    card.hp -= actualAmount;
    
    // 메시지 표시
    showMessage(`${this.name}이(가) ${actualAmount}의 피해를 입혔습니다!`, 'warning');
    
    return true;
  }
  
  /**
   * 독 효과 적용
   * @param {Object} card - 독 효과 대상 카드
   * @param {number} amount - 독 피해량
   * @param {number} duration - 지속 시간
   * @returns {boolean} - 성공 여부
   */
  applyPoisonEffect(card, amount, duration) {
    if (!card) return false;
    
    // 상태 효과 추가
    card.effectType = 'poison';
    card.effectValue = amount;
    card.effectDuration = duration + (this.upgradeLevel || 0);
    
    // 효과 객체가 없으면 생성
    if (!card.effects) card.effects = [];
    
    // 효과 추가
    card.effects.push({
      type: 'poison',
      damage: amount,
      duration: duration + (this.upgradeLevel || 0)
    });
    
    // 메시지 표시
    showMessage(`${this.name}이(가) 독 효과를 적용했습니다!`, 'warning');
    
    return true;
  }
  
  /**
   * 화상 효과 적용
   * @param {Object} card - 화상 효과 대상 카드
   * @param {number} amount - 화상 피해량
   * @param {number} duration - 지속 시간
   * @returns {boolean} - 성공 여부
   */
  applyBurnEffect(card, amount, duration) {
    if (!card) return false;
    
    // 상태 효과 추가
    card.effectType = 'burn';
    card.effectValue = amount;
    card.effectDuration = duration + (this.upgradeLevel || 0);
    
    // 효과 객체가 없으면 생성
    if (!card.effects) card.effects = [];
    
    // 효과 추가
    card.effects.push({
      type: 'burn',
      damage: amount,
      duration: duration + (this.upgradeLevel || 0)
    });
    
    // 메시지 표시
    showMessage(`${this.name}이(가) 화상 효과를 적용했습니다!`, 'warning');
    
    return true;
  }
  
  /**
   * 방어 효과 적용
   * @param {Object} card - 방어 효과 대상 카드
   * @param {number} amount - 방어력
   * @returns {boolean} - 성공 여부
   */
  applyDefenseEffect(card, amount) {
    if (!card) return false;
    
    // 상태 효과 추가
    card.effectType = 'defense';
    card.effectValue = amount + (this.upgradeLevel || 0);
    
    // 메시지 표시
    showMessage(`${this.name}이(가) ${amount + (this.upgradeLevel || 0)}의 방어력을 제공합니다!`, 'info');
    
    return true;
  }
}

/**
 * 반응 정보에서 분자 생성
 * @param {Object} reaction - 반응 정보
 * @returns {Molecule} - 생성된 분자
 */
function createMoleculeFromReaction(reaction) {
  if (!reaction) return null;
  
  const molecule = new Molecule(
    `molecule-${Date.now()}`,
    reaction.name,
    reaction.formula,
    reaction.reactants,
    reaction.effect
  );
  
  // 추가 속성 설정
  if (reaction.color) molecule.color = reaction.color;
  if (reaction.rarity) molecule.rarity = reaction.rarity;
  if (reaction.description) molecule.description = reaction.description;
  
  return molecule;
}

/**
 * 분자 업그레이드
 * @param {Molecule} molecule - 업그레이드할 분자
 * @param {number} level - 업그레이드 레벨
 * @returns {Molecule} - 업그레이드된 분자
 */
function upgradeMolecule(molecule, level) {
  if (!molecule) return null;
  
  molecule.upgradeLevel = level;
  
  // 능력치 증가 (레벨당 15%)
  const multiplier = 1 + (level * 0.15);
  molecule.power = Math.round(molecule.power * multiplier);
  molecule.maxHealth = Math.round(molecule.maxHealth * multiplier);
  molecule.health = molecule.maxHealth;
  
  return molecule;
}

// 전역 노출
window.Molecule = Molecule;
window.createMoleculeFromReaction = createMoleculeFromReaction;
window.upgradeMolecule = upgradeMolecule;
