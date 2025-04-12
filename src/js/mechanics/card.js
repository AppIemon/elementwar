/**
 * 카드 관리 시스템
 */

// 카드 ID 카운터
let cardIdCounter = 1;

/**
 * 원소 카드 클래스
 */
class ElementCard {
  /**
   * 원소 카드 생성자
   * @param {Object} element - 원소 정보
   * @param {number} baseHp - 기본 체력
   * @param {number} baseAtk - 기본 공격력
   */
  constructor(element, baseHp, baseAtk) {
    this.id = `card-${cardIdCounter++}-${Date.now()}`;
    this.element = element;
    this.baseHp = baseHp || element.baseHp || 5;
    this.baseAtk = baseAtk || element.baseAtk || 2;
    this.hp = this.baseHp;
    this.maxHp = this.baseHp;
    this.atk = this.baseAtk;
    this.level = 1;
    this.power = this.baseAtk;
    this.health = this.baseHp;
    this.color = element.color || 'bg-gray-500';
    this.rarity = element.rarity || 'common';
    this.stacked = [];
    this.isSkull = false;
    this.isMolecule = false;
    this.upgradeLevel = 0;
  }
  
  /**
   * 카드 레벨업
   * @returns {ElementCard} - 업그레이드된 카드 인스턴스
   */
  levelUp() {
    this.upgradeLevel++;
    this.level++;
    
    // 레벨에 따른 능력치 증가 (20%씩)
    const powerIncrease = Math.ceil(this.baseAtk * 0.2);
    const healthIncrease = Math.ceil(this.baseHp * 0.2);
    
    this.atk += powerIncrease;
    this.power = this.atk;
    
    this.hp += healthIncrease;
    this.maxHp += healthIncrease;
    this.health = this.hp;
    
    return this;
  }
  
  /**
   * 카드 복제
   * @returns {ElementCard} - 복제된 카드 인스턴스
   */
  clone() {
    const clonedCard = new ElementCard(this.element, this.baseHp, this.baseAtk);
    
    // 복제 시 ID는 새로 생성하되 다른 속성은 유지
    clonedCard.hp = this.hp;
    clonedCard.maxHp = this.maxHp;
    clonedCard.atk = this.atk;
    clonedCard.level = this.level;
    clonedCard.power = this.power;
    clonedCard.health = this.health;
    clonedCard.color = this.color;
    clonedCard.rarity = this.rarity;
    clonedCard.upgradeLevel = this.upgradeLevel;
    
    return clonedCard;
  }
  
  /**
   * 카드 HTML 표현 생성
   * @returns {string} - HTML 문자열
   */
  getHTML() {
    return `
      <div class="card ${this.color} p-2 rounded-lg shadow-lg">
        <div class="text-center font-bold">${this.element.symbol}</div>
        <div class="text-center text-sm">${this.element.name}</div>
        <div class="flex justify-between text-sm mt-1">
          <div>⚔️ ${this.atk}</div>
          <div>❤️ ${this.hp}</div>
        </div>
        <div class="text-xs mt-1 text-center opacity-70">Lv ${this.level}</div>
      </div>
    `;
  }
}

/**
 * 등급에 따른 카드 생성
 * @param {string} rarity - 희귀도
 * @returns {ElementCard|null} - 생성된 카드
 */
function createCardWithRarity(rarity) {
  // 원소 데이터에 접근 (전역 변수 우선 사용, 그 다음 게임 상태)
  const elementsData = window.ELEMENTS_DATA || 
                      (window.gameState ? window.gameState.elementsData : null);
  
  if (!elementsData || elementsData.length === 0) {
    console.error('원소 데이터가 로드되지 않았습니다.');
    return createDefaultCard(rarity);
  }
  
  // 등급에 맞는 원소들 필터링
  const eligibleElements = elementsData.filter(element => {
    if (!element) return false; // element가 undefined인 경우 제외
    // 원소에 등급이 없으면 common으로 간주
    const elementRarity = element.rarity || 'common';
    return elementRarity === rarity;
  });
  
  // 등급에 맞는 원소가 없으면 모든 원소에서 선택
  const elements = eligibleElements.length > 0 ? eligibleElements : elementsData;
  
  if (elements.length === 0) {
    console.error('선택할 원소가 없습니다.');
    return createDefaultCard(rarity);
  }
  
  // 랜덤 원소 선택
  const randomIndex = Math.floor(Math.random() * elements.length);
  const element = elements[randomIndex];
  
  if (!element) {
    console.error('선택된 원소가 정의되지 않았습니다.');
    return createDefaultCard(rarity);
  }
  
  // 원본 데이터 수정 방지를 위한 복사본 생성
  const elementCopy = { ...element };
  
  // 원소에 등급 정보 부여
  elementCopy.rarity = elementCopy.rarity || rarity;
  
  // 등급에 따른 능력치 보정
  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0
  };
  
  const multiplier = rarityMultipliers[rarity] || 1.0;
  
  const baseHp = Math.floor((elementCopy.baseHp || 5) * multiplier);
  const baseAtk = Math.floor((elementCopy.baseAtk || 2) * multiplier);
  
  return new ElementCard(elementCopy, baseHp, baseAtk);
}

/**
 * 기본 카드 생성 (예외 상황용)
 * @param {string} rarity - 희귀도
 * @returns {ElementCard} - 생성된 카드
 */
function createDefaultCard(rarity) {
  const defaultElement = {
    number: 0,
    symbol: '?',
    name: '미확인 원소',
    englishName: 'Unknown Element',
    category: '기타',
    atomicWeight: 0,
    color: 'bg-gray-500',
    baseHp: 5,
    baseAtk: 2,
    rarity: rarity || 'common'
  };
  
  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0
  };
  
  const multiplier = rarityMultipliers[rarity] || 1.0;
  const baseHp = Math.floor(5 * multiplier);
  const baseAtk = Math.floor(2 * multiplier);
  
  return new ElementCard(defaultElement, baseHp, baseAtk);
}

/**
 * 랜덤 카드 생성
 * @returns {ElementCard} - 랜덤 생성된 카드
 */
function createRandomCard() {
  // 랜덤 등급 결정
  const rarities = ['common', 'uncommon', 'rare', 'epic'];
  const chances = [70, 20, 9, 1];
  
  let totalChance = 0;
  for (const chance of chances) {
    totalChance += chance;
  }
  
  let random = Math.random() * totalChance;
  let selectedRarity;
  
  for (let i = 0; i < rarities.length; i++) {
    if (random < chances[i]) {
      selectedRarity = rarities[i];
      break;
    }
    random -= chances[i];
  }
  
  // 기본값으로 common 사용
  if (!selectedRarity) {
    selectedRarity = 'common';
  }
  
  // 선택된 등급으로 카드 생성
  return createCardWithRarity(selectedRarity);
}

// 전역 노출
window.ElementCard = ElementCard;
window.createCardWithRarity = createCardWithRarity;
window.createDefaultCard = createDefaultCard;
window.createRandomCard = createRandomCard;
