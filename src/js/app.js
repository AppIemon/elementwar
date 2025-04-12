// Global data objects
window.ELEMENTS_DATA = [];
window.REACTIONS_DATA = [];
window.gameState = {
  playerTurn: true,
  battleInProgress: false,
  playerHand: [],
  computerHand: [],
  playerCoins: 10,
  computerCoins: 10,
  turnCount: 1
};

// 전역 변수
let gameInitialized = false;

// DOM이 완전히 로드된 후 초기화 시작
document.addEventListener('DOMContentLoaded', initializeGameApp);

/**
 * 게임 애플리케이션 초기화
 */
async function initializeGameApp() {
  console.log('게임을 초기화하는 중입니다...');
  
  try {
    // 게임 데이터 로드 - 데이터가 완전히 로드될 때까지 기다림
    const gameData = await loadGameData();
    
    // 전역 변수로 데이터 설정 (카드 생성에 필요)
    window.ELEMENTS_DATA = gameData.elementsData;
    window.REACTIONS_DATA = gameData.reactionsData;
    
    // UI 초기화
    if (typeof initUI === 'function') {
      initUI();
    } else {
      console.error('UI 초기화 함수를 찾을 수 없습니다.');
    }
    
    // 이벤트 리스너 연결 및 게임 준비
    setupGame();
    
    gameInitialized = true;
    console.log('게임이 성공적으로 초기화되었습니다!');
  } catch (error) {
    console.error('게임 초기화 중 오류가 발생했습니다:', error);
  }
}

/**
 * 게임 데이터 로드
 */
async function loadGameData() {
  try {
    // 데이터 로딩 직렬화 (순차적으로 로드)
    const elementsData = await loadElementsData();
    const reactionsData = await loadReactionsData();
    
    // 데이터를 게임 상태에 저장
    if (window.gameState) {
      window.gameState.elementsData = elementsData;
      window.gameState.reactionsData = reactionsData;
    }
    
    return { elementsData, reactionsData };
  } catch (error) {
    console.error('데이터 로드 중 오류:', error);
    return { elementsData: [], reactionsData: [] };
  }
}

/**
 * 게임 설정 및 이벤트 리스너 연결
 */
function setupGame() {
  // 배틀필드 초기화
  if (typeof initBattlefield === 'function') {
    initBattlefield();
  } else {
    console.error('배틀필드 초기화 함수를 찾을 수 없습니다.');
  }
  
  // 이벤트 리스너 설정
  setupEventListeners();
  
  // 게임 초기화
  setTimeout(() => {
    if (typeof initGame === 'function') {
      initGame();
      
      // 초기 카드 지급
      dealInitialCards();
    } else {
      console.error('게임 초기화 함수를 찾을 수 없습니다.');
    }
  }, 100);
}

/**
 * 게임 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 카드 뽑기 버튼
  const basicDrawBtn = document.getElementById('draw-basic-btn');
  const premiumDrawBtn = document.getElementById('draw-premium-btn');
  const legendDrawBtn = document.getElementById('draw-legend-btn');
  
  if (basicDrawBtn) basicDrawBtn.addEventListener('click', () => handleBasicDraw());
  if (premiumDrawBtn) premiumDrawBtn.addEventListener('click', () => handlePremiumDraw());
  if (legendDrawBtn) legendDrawBtn.addEventListener('click', () => handleLegendDraw());
  
  // 턴 종료 & 리셋 버튼
  const endTurnBtn = document.getElementById('end-turn-btn');
  const resetBtn = document.getElementById('reset-btn');
  
  if (endTurnBtn) endTurnBtn.addEventListener('click', () => endTurn());
  if (resetBtn) resetBtn.addEventListener('click', () => resetGame());
  
  // 튜토리얼 버튼
  const tutorialBtn = document.getElementById('tutorial-btn');
  if (tutorialBtn && typeof showTutorial === 'function') {
    tutorialBtn.addEventListener('click', showTutorial);
  }
  
  // 모달 이벤트 초기화
  if (typeof initModalEvents === 'function') {
    initModalEvents();
  }
}

/**
 * 초기 카드 지급
 */
function dealInitialCards() {
  // 데이터 로딩 상태 확인
  if (!window.ELEMENTS_DATA || window.ELEMENTS_DATA.length === 0) {
    console.warn('원소 데이터가 아직 로드되지 않았습니다. 초기 카드 지급을 5초 후에 재시도합니다.');
    setTimeout(dealInitialCards, 500);
    return;
  }

  // 플레이어 초기 카드 3장
  for (let i = 0; i < 3; i++) {
    const card = createRandomCard();
    if (card && typeof addCardToHand === 'function') {
      addCardToHand(card, 'player');
    }
  }
  
  // UI 업데이트
  if (typeof renderPlayerHand === 'function') {
    renderPlayerHand();
  }
  
  // 초기 코인 설정
  if (typeof resetCoins === 'function') {
    resetCoins(20); // 플레이어 시작 코인 20개
  }
  
  // 메시지 표시
  if (typeof showMessage === 'function') {
    showMessage('게임이 시작되었습니다! 카드를 전장에 배치하세요.', 'info');
  }
}

/**
 * 랜덤 카드 생성
 * @returns {Object} 생성된 카드
 */
function createRandomCard() {
  // 기존 함수에 위임
  if (typeof createRandomCardByRarity === 'function') {
    return createRandomCardByRarity('basic');
  } else if (typeof createCardWithRarity === 'function') {
    const rarities = ['common', 'uncommon', 'rare'];
    const weights = [70, 25, 5];
    
    // 랜덤 등급 선택
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    let selectedRarity = rarities[0];
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        selectedRarity = rarities[i];
        break;
      }
      random -= weights[i];
    }
    
    // 선택된 등급으로 카드 생성
    return createCardWithRarity(selectedRarity);
  }
  
  // 최후의 수단: ElementCard 클래스 직접 사용 (정의되어 있다고 가정)
  if (typeof ElementCard === 'function' && window.gameState && window.gameState.elementsData) {
    const elements = window.gameState.elementsData;
    const randomIndex = Math.floor(Math.random() * elements.length);
    const element = elements[randomIndex];
    
    return new ElementCard(element, element.baseHp || 5, element.baseAtk || 2);
  }
  
  console.error('카드 생성 기능을 찾을 수 없습니다.');
  return null;
}
