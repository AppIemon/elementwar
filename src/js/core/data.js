/**
 * 게임 데이터 관리 모듈
 * 원소 및 반응 데이터를 로드하고 관리합니다.
 */

// 데이터 저장소 - 전역에서 접근 가능하도록 window 객체에 저장
window.ELEMENTS_DATA = [];
window.REACTIONS_DATA = [];

/**
 * 원소 데이터 로드
 * @returns {Promise<Array>} 원소 데이터 배열
 */
async function loadElementsData() {
  try {
    const response = await fetch('src/data/elements.json');
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`);
    }
    const data = await response.json();
    console.log(`${data.length}개의 원소 데이터를 로드했습니다.`);
    
    // 전역 변수와 로컬 변수에 데이터 저장
    window.ELEMENTS_DATA = data;
    
    // 게임 상태에도 데이터 저장
    if (window.gameState) {
      window.gameState.elementsData = data;
    }
    
    // 원소 등급 초기화
    initializeElementRarities();
    
    return data;
  } catch (error) {
    console.error('원소 데이터 로드 오류:', error);
    
    // 임시 데이터 사용
    const defaultData = getDefaultElementsData();
    window.ELEMENTS_DATA = defaultData;
    
    if (window.gameState) {
      window.gameState.elementsData = defaultData;
    }
    
    return defaultData;
  }
}

/**
 * 반응 데이터 로드
 * @returns {Promise<Array>} 반응 데이터 배열
 */
async function loadReactionsData() {
  try {
    const response = await fetch('src/data/reactions.json');
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`);
    }
    reactionsData = await response.json();
    console.log(`${reactionsData.length}개의 반응 데이터를 로드했습니다.`);
    
    // 전역 변수에 데이터 저장
    window.REACTIONS_DATA = reactionsData;
    
    if (window.gameState) {
      window.gameState.reactionsData = reactionsData;
    }
    
    return reactionsData;
  } catch (error) {
    console.error('반응 데이터 로드 오류:', error);
    // 기본 반응 데이터 사용
    reactionsData = window.CHEMICAL_REACTIONS || [];
    
    // 전역 변수에 데이터 저장
    window.REACTIONS_DATA = reactionsData;
    
    if (window.gameState) {
      window.gameState.reactionsData = reactionsData;
    }
    
    return reactionsData;
  }
}

/**
 * 원소 등급 초기화
 * 원소마다 게임 내 희귀도를 설정합니다.
 */
function initializeElementRarities() {
  // 이미 등급이 설정되어 있으면 건너뛰기
  if (window.ELEMENTS_DATA.length > 0 && window.ELEMENTS_DATA[0].rarity) {
    return;
  }
  
  // 원소 등급 배분
  const elementsByRarity = {
    common: [1, 6, 7, 8],
    uncommon: [2, 5, 10, 12, 13, 14],
    rare: [3, 4, 9, 11, 15, 16],
    epic: [17, 18],
    legendary: [19, 20]
  };
  
  // 원소에 등급 부여
  for (const rarity in elementsByRarity) {
    const elementIds = elementsByRarity[rarity];
    for (const id of elementIds) {
      const element = window.ELEMENTS_DATA.find(e => e.number === id);
      if (element) {
        element.rarity = rarity;
      }
    }
  }
}

/**
 * 기본 원소 데이터 반환 (오류 시 대체용)
 */
function getDefaultElementsData() {
  return [
    {
      number: 1,
      symbol: "H",
      name: "수소",
      englishName: "Hydrogen",
      category: "비금속원소",
      atomicWeight: 1.008,
      color: "bg-blue-300",
      baseHp: 3,
      baseAtk: 3,
      rarity: "common"
    },
    {
      number: 8,
      symbol: "O",
      name: "산소",
      englishName: "Oxygen",
      category: "비금속원소",
      atomicWeight: 16.0,
      color: "bg-red-400",
      baseHp: 4,
      baseAtk: 4,
      rarity: "common"
    }
  ];
}

/**
 * 원소 번호로 원소 데이터 조회
 * @param {number} number - 원소 번호
 * @returns {Object|null} 원소 데이터 또는 null
 */
function getElementByNumber(number) {
  return window.ELEMENTS_DATA.find(e => e.number === number) || null;
}

/**
 * 원소 기호로 원소 데이터 조회
 * @param {string} symbol - 원소 기호
 * @returns {Object|null} 원소 데이터 또는 null
 */
function getElementBySymbol(symbol) {
  return window.ELEMENTS_DATA.find(e => e.symbol === symbol) || null;
}

// 전역 노출
window.loadElementsData = loadElementsData;
window.loadReactionsData = loadReactionsData;
window.getElementByNumber = getElementByNumber;
window.getElementBySymbol = getElementBySymbol;
window.initializeElementRarities = initializeElementRarities;
