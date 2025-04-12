/**
 * 게임 상태 관리 모듈
 * 게임의 전체적인 상태를 관리합니다.
 */

// 게임 상태 객체
const gameState = {
  playerScore: 0,
  computerScore: 0,
  isGameActive: true,
  playerHand: [],
  computerHand: [],
  isPlayerTurn: true,
  turnCount: 1,
  selectedCardId: null,
  elementsData: [],
  reactionsData: [],
  upgrades: {
    elements: {},
    molecules: {}
  },
  // 등급별 출현 확률
  rarityChances: {
    basic: { common: 70, uncommon: 25, rare: 4, epic: 1, legendary: 0 },
    premium: { common: 40, uncommon: 40, rare: 15, epic: 5, legendary: 0 },
    legend: { common: 0, uncommon: 30, rare: 40, epic: 20, legendary: 10 }
  }
};

/**
 * 게임 상태 초기화
 */
function initGameState() {
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.isGameActive = true;
  gameState.playerHand = [];
  gameState.computerHand = [];
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
}

/**
 * 손패에 카드 추가
 * @param {Object} card - 카드 객체
 * @param {string} side - 'player' 또는 'computer'
 */
function addCardToHand(card, side) {
  if (!card) return;
  
  if (side === 'player') {
    gameState.playerHand.push(card);
  } else if (side === 'computer') {
    gameState.computerHand.push(card);
  }
}

/**
 * 손패에서 카드 제거
 * @param {string} cardId - 카드 ID
 * @param {string} side - 'player' 또는 'computer'
 */
function removeCardFromHand(cardId, side) {
  if (side === 'player') {
    gameState.playerHand = gameState.playerHand.filter(card => card.id !== cardId);
  } else if (side === 'computer') {
    gameState.computerHand = gameState.computerHand.filter(card => card.id !== cardId);
  }
}

/**
 * 턴 변경
 */
function switchTurn() {
  gameState.isPlayerTurn = !gameState.isPlayerTurn;
  
  if (gameState.isPlayerTurn) {
    gameState.turnCount++;
  }
  
  updateTurnIndicator();
}

/**
 * 플레이어 턴 시작
 */
function startPlayerTurn() {
  gameState.isPlayerTurn = true;
  showMessage(`${gameState.turnCount}턴: 플레이어 차례입니다.`, 'info');
  updateTurnIndicator();
}

// 전역으로 노출
window.gameState = gameState;
window.initGameState = initGameState;
window.addCardToHand = addCardToHand;
window.removeCardFromHand = removeCardFromHand;
window.switchTurn = switchTurn;
window.startPlayerTurn = startPlayerTurn;
