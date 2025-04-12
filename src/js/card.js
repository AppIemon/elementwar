ㄴㄴ/**
 * 카드 관리 시스템
 */

// 카드 ID 카운터
let cardIdCounter = 1;

/**
 * 새 카드 생성
 * @param {Object} elementData - 원소 데이터
 * @returns {Object} - 새 카드 객체
 */
function createCard(elementData) {
  if (!elementData) {
    console.error('원소 데이터가 없습니다.');
    return null;
  }
  
  // 기본 카드 정보
  const card = {
    id: `card-${cardIdCounter++}-${Date.now()}`,
    element: {
      number: elementData.number,
      symbol: elementData.symbol,
      name: elementData.name,
      englishName: elementData.englishName,
      category: elementData.category,
      atomicWeight: elementData.atomicWeight
    },
    baseAtk: elementData.baseAtk || 1,
    baseHp: elementData.baseHp || 1,
    power: elementData.baseAtk || 1,
    health: elementData.baseHp || 1,
    maxHealth: elementData.baseHp || 1,
    level: 1,
    color: elementData.color || 'bg-gray-500',
    rarity: elementData.rarity || 'common',
    specialAbility: elementData.specialAbility || null,
    description: elementData.description || '',
    upgradeCost: getUpgradeCost(elementData.rarity || 'common', 1)
  };
  
  return card;
}

/**
 * 카드 복제
 * @param {Object} card - 복제할 카드
 * @returns {Object} - 복제된 카드
 */
function cloneCard(card) {
  if (!card) return null;
  
  // 새 ID 생성하여 복제
  const clonedCard = { ...card };
  clonedCard.id = `card-${cardIdCounter++}-${Date.now()}`;
  
  return clonedCard;
}

/**
 * 카드 강화 비용 계산
 * @param {string} rarity - 카드 희귀도
 * @param {number} currentLevel - 현재 레벨
 * @returns {number} - 강화 비용
 */
function getUpgradeCost(rarity, currentLevel) {
  // 희귀도별 기본 비용
  const baseCost = {
    'common': 2,
    'uncommon': 3,
    'rare': 5,
    'epic': 8,
    'legendary': 12
  };
  
  // 레벨별 비용 증가
  const levelMultiplier = Math.pow(1.5, currentLevel - 1);
  
  return Math.round((baseCost[rarity] || 2) * levelMultiplier);
}

/**
 * 카드 강화
 * @param {Object} card - 강화할 카드
 * @returns {Object} - 강화된 카드
 */
function upgradeCard(card) {
  if (!card) return null;
  
  // 복제된 카드 생성 (기존 카드 보존)
  const upgradedCard = { ...card };
  
  // 레벨 증가
  upgradedCard.level = (card.level || 1) + 1;
  
  // 능력치 강화 (레벨에 따라 증가)
  const powerIncrease = Math.max(1, Math.floor(card.baseAtk * 0.3));
  const healthIncrease = Math.max(1, Math.floor(card.baseHp * 0.3));
  
  upgradedCard.power = (card.power || card.baseAtk) + powerIncrease;
  upgradedCard.health = (card.health || card.baseHp) + healthIncrease;
  upgradedCard.maxHealth = (card.maxHealth || card.baseHp) + healthIncrease;
  
  // 다음 강화 비용 계산
  upgradedCard.upgradeCost = getUpgradeCost(card.rarity || 'common', upgradedCard.level);
  
  return upgradedCard;
}

/**
 * 랜덤 카드 생성 (희귀도 지정 가능)
 * @param {string} rarity - 희귀도 ('common', 'uncommon', 'rare', 'epic', 'legendary', 또는 'random')
 * @returns {Object} - 생성된 카드
 */
function generateRandomCard(rarity = 'random') {
  // 원소 데이터 로드
  const elements = loadElementsData();
  if (!elements || elements.length === 0) {
    console.error('원소 데이터를 불러올 수 없습니다.');
    return null;
  }
  
  // 희귀도 결정
  let targetRarity = rarity;
  if (rarity === 'random') {
    // 각 희귀도별 확률
    const rarityChances = {
      'common': 60,
      'uncommon': 25,
      'rare': 10,
      'epic': 4,
      'legendary': 1
    };
    
    targetRarity = getRandomRarityByChance(rarityChances);
  }
  
  // 해당 희귀도의 원소들 필터링
  const elementsOfRarity = elements.filter(e => e.rarity === targetRarity);
  
  // 해당 희귀도의 원소가 없으면 전체에서 랜덤 선택
  const elementData = elementsOfRarity.length > 0 
    ? elementsOfRarity[Math.floor(Math.random() * elementsOfRarity.length)]
    : elements[Math.floor(Math.random() * elements.length)];
  
  // 카드 생성
  return createCard(elementData);
}

/**
 * 확률에 따라 랜덤 희귀도 선택
 * @param {Object} chances - 희귀도별 확률
 * @returns {string} - 선택된 희귀도
 */
function getRandomRarityByChance(chances) {
  // 확률 총합 계산
  const totalChance = Object.values(chances).reduce((sum, chance) => sum + chance, 0);
  
  // 0부터 총합 사이의 랜덤 값 생성
  const random = Math.random() * totalChance;
  
  // 누적 확률로 희귀도 결정
  let cumulativeChance = 0;
  for (const [rarity, chance] of Object.entries(chances)) {
    cumulativeChance += chance;
    if (random <= cumulativeChance) {
      return rarity;
    }
  }
  
  // 기본값
  return 'common';
}

/**
 * 원소 데이터 로드
 * @returns {Array} - 원소 데이터 배열
 */
function loadElementsData() {
  // 실제로는 JSON 파일에서 로드하거나 서버에서 가져오기
  // 여기서는 임시로 전역 변수나 하드코딩된 값 사용
  if (window.ELEMENTS_DATA) {
    return window.ELEMENTS_DATA;
  }
  
  // 데이터를 비동기로 가져오거나 임시 데이터 사용
  fetch('src/data/elements.json')
    .then(response => response.json())
    .then(data => {
      window.ELEMENTS_DATA = data;
      return data;
    })
    .catch(error => {
      console.error('원소 데이터 로드 오류:', error);
      return [];
    });
  
  return [];
}

/**
 * 카드 팩에서 카드 뽑기
 * @param {string} packType - 카드 팩 유형 ('basic', 'premium', 'legend')
 * @returns {Array} - 뽑은 카드 배열
 */
function drawCardsFromPack(packType) {
  const cards = [];
  
  // 팩 유형별 카드 획득 규칙
  switch(packType) {
    case 'basic': // 일반 뽑기
      // 일반 카드 1장 확정
      cards.push(generateRandomCard('common'));
      
      // 10% 확률로 언커먼 이상 카드 추가
      if (Math.random() < 0.1) {
        cards.push(generateRandomCard('uncommon'));
      }
      break;
      
    case 'premium': // 고급 뽑기
      // 언커먼 카드 1장 확정
      cards.push(generateRandomCard('uncommon'));
      
      // 30% 확률로 레어 이상 카드 추가
      if (Math.random() < 0.3) {
        cards.push(generateRandomCard('rare'));
      }
      break;
      
    case 'legend': // 레전드 뽑기
      // 레어 카드 1장 확정
      cards.push(generateRandomCard('rare'));
      
      // 에픽/레전드 중 하나 확정
      cards.push(generateRandomCard(Math.random() < 0.8 ? 'epic' : 'legendary'));
      break;
      
    default:
      // 기본 뽑기 (랜덤 카드 1장)
      cards.push(generateRandomCard('random'));
  }
  
  return cards;
}

/**
 * 카드의 HTML 표현 생성
 * @param {Object} card - 카드 데이터
 * @returns {string} - HTML 문자열
 */
function getCardHTML(card) {
  if (!card || !card.element) {
    return `<div class="card bg-red-800 p-2 rounded-lg text-center">잘못된 카드</div>`;
  }
  
  return `
    <div class="card ${card.color || 'bg-gray-500'} p-2 rounded-lg shadow-lg">
      <div class="text-center font-bold">${card.element.symbol}</div>
      <div class="text-center text-sm">${card.element.name}</div>
      <div class="flex justify-between text-sm mt-1">
        <div>⚔️ ${card.power || card.baseAtk}</div>
        <div>❤️ ${card.health || card.baseHp}</div>
      </div>
      <div class="text-xs mt-1 text-center opacity-70">Lv ${card.level || 1}</div>
    </div>
  `;
}

// 전역으로 함수 노출
window.createCard = createCard;
window.upgradeCard = upgradeCard;
window.generateRandomCard = generateRandomCard;
window.drawCardsFromPack = drawCardsFromPack;
window.getCardHTML = getCardHTML;
