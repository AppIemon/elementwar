/**
 * 게임 로직 관련 핵심 기능
 */

// 게임 설정 상수
const BASE_ATTACK_DAMAGE = 3;
const BASE_HEALING_RATE = 4;
const CARD_COSTS = {
  basic: 2,
  premium: 5,
  legend: 10
};
const COMPUTER_DRAW_COSTS = {
  basic: 2,
  premium: 4, // 컴퓨터는 약간 할인된 가격
  legend: 8
};

// 컴퓨터 코인 관리
let computerCoins = 0;

// 드로우 애니메이션 진행 중 플래그
let isDrawingAnimationPlaying = false;

function addComputerCoins(amount) {
  computerCoins += amount;
  updateComputerCoinDisplay(); // UI 업데이트 호출
}

function spendComputerCoins(amount) {
  if (computerCoins >= amount) {
    computerCoins -= amount;
    updateComputerCoinDisplay(); // UI 업데이트 호출
    return true;
  }
  return false;
}

function getComputerCoins() {
  return computerCoins;
}

/**
 * 게임 초기화
 */
function initGame() {
  console.log('게임 초기화 중...');
  
  // 점수 초기화
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  
  // 게임 상태 초기화
  gameState.isGameActive = true;
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
  
  // 코인 초기화
  resetCoins(20); // 플레이어 시작 코인 20개
  
  // 컴퓨터 코인 초기화
  computerCoins = 4; // 컴퓨터 시작 코인 4개
  updateComputerCoinDisplay(); // 초기 UI 업데이트
  
  // UI 업데이트
  if (typeof updateScoreDisplay === 'function') {
    updateScoreDisplay();
  }
  
  if (typeof updateTurnIndicator === 'function') {
    updateTurnIndicator();
  }
  
  console.log('게임 초기화 완료!');
}

/**
 * 게임 리셋
 */
function resetGame() {
  console.log("게임 리셋 중...");

  // 게임 상태 초기화
  gameState.playerHand = [];
  gameState.computerHand = [];
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.playerBaseHp = 100;
  gameState.computerBaseHp = 100;
  gameState.gameOver = false;

  // 배틀필드 초기화
  resetBattlefield();

  // 코인 초기화
  resetCoins(); // 플레이어 코인
  computerCoins = 4; // 컴퓨터 코인

  // 메시지 초기화
  showMessage('새 게임 시작! 원소를 배치하세요.', 'info');

  // 초기 카드 지급
  dealInitialCards();

  // UI 업데이트
  updateUI();

  console.log("게임 리셋 완료.");
}

/**
 * 턴 종료
 */
function endTurn() {
  if (!gameState.isPlayerTurn) return;
  
  gameState.isPlayerTurn = false;
  if (typeof showMessage === 'function') {
    showMessage('컴퓨터 차례입니다.', 'info');
  }
  
  // 턴 종료 시 코인 지급
  addCoins(3);
  addComputerCoins(3); // 컴퓨터도 턴 시작 시 코인 획득
  
  gameState.turnCount++;
  
  // 카드 체력 자동 회복 체크
  if (typeof checkCardHealing === 'function') {
    checkCardHealing();
  }
  
  // 기지 체력 자동 회복
  healBases();
  
  // 전투 실행
  if (typeof executeBattles === 'function') {
    executeBattles();
  } else {
    console.warn('전투 실행 함수를 찾을 수 없습니다.');
  }
  
  // UI 업데이트
  if (typeof updateUI === 'function') {
    updateUI();
  } else {
    console.warn('UI 업데이트 함수를 찾을 수 없습니다.');
    
    // 필수 UI 업데이트 함수가 없으면 개별 호출
    if (typeof updateTurnIndicator === 'function') {
      updateTurnIndicator();
    }
  }
  
  // 컴퓨터 턴 실행
  setTimeout(() => {
    computerTurn();
  }, 1500);
}

/**
 * 컴퓨터 턴
 */
function computerTurn() {
  if (gameState.isPlayerTurn) return;

  showMessage("컴퓨터 턴: 생각 중...", 'info');

  // 컴퓨터의 결정을 좀 더 자연스럽게 보이도록 지연 추가
  setTimeout(() => {
    // 1. 카드 뽑기: 보유 코인에 따라 뽑기 전략 결정
    computerDrawCards();

    // 2. 손패의 카드를 전략적으로 배치 (뽑기 후 약간의 딜레이)
    setTimeout(() => {
      computerPlaceCards();

      // 3. 필드의 카드 강화 (배치 후 약간의 딜레이)
      setTimeout(() => {
        computerUpgradeCards();

        // 4. 턴 종료
        setTimeout(() => {
          showMessage("컴퓨터 턴 종료", 'info');
          startPlayerTurn(); // 플레이어 턴 시작 함수 호출
        }, 800);
      }, 500);
    }, 500);
  }, 1000);
}

/**
 * 플레이어 턴 시작
 */
function startPlayerTurn() {
  gameState.isPlayerTurn = true;
  showMessage('플레이어 차례입니다.', 'info');
  updateUI();
}

/**
 * 컴퓨터 카드 뽑기
 */
function computerDrawCards() {
  let maxDrawAttempts = 3; // 무한 루프 방지
  let drawAttempts = 0;

  // 손패가 부족하고 코인이 충분하면 우선적으로 뽑기 시도
  while (gameState.computerHand.length < 5 && getComputerCoins() >= COMPUTER_DRAW_COSTS.basic && drawAttempts < maxDrawAttempts) {
    let drawType = 'basic';
    const currentCoins = getComputerCoins();

    // 고급 카드 뽑기 결정 (확률 기반)
    if (currentCoins >= COMPUTER_DRAW_COSTS.legend && Math.random() < 0.2) { // 20% 확률
      drawType = 'legend';
    } else if (currentCoins >= COMPUTER_DRAW_COSTS.premium && Math.random() < 0.4) { // 40% 확률
      drawType = 'premium';
    }

    // 해당 타입 뽑기 비용 확인
    if (currentCoins >= COMPUTER_DRAW_COSTS[drawType]) {
      computerDrawCard(drawType);
    } else if (currentCoins >= COMPUTER_DRAW_COSTS.basic) {
      // 비싼거 못뽑으면 기본 뽑기 시도
      computerDrawCard('basic');
    }

    drawAttempts++;
  }
  console.log(`컴퓨터 카드 뽑기 시도 완료. 현재 손패: ${gameState.computerHand.length}`);
}

/**
 * 컴퓨터 카드 뽑기 실행
 */
function computerDrawCard(drawType) {
  const cost = COMPUTER_DRAW_COSTS[drawType];
  if (gameState.computerHand.length >= 8) {
    console.log("컴퓨터 손패 가득 참");
    return null; // 손패 가득 참
  }

  if (spendComputerCoins(cost)) {
    const newCard = createRandomCardByRarity(drawType);
    if (newCard) {
      addCardToHand(newCard, 'computer');
      console.log(`컴퓨터가 ${drawType} 카드를 뽑았습니다. (코인: ${getComputerCoins()})`);
      return newCard;
    }
  } else {
    console.log(`컴퓨터 ${drawType} 뽑기 실패 - 코인 부족`);
  }
  return null;
}

/**
 * 컴퓨터 카드 배치
 */
function computerPlaceCards() {
  if (gameState.computerHand.length === 0) return;

  // 최대 2장까지 배치 시도
  const maxPlacement = Math.min(2, gameState.computerHand.length);
  let placedCount = 0;

  // 배치 가능한 슬롯 찾기 (컴퓨터 슬롯이 비어있거나 해골 카드인 경우)
  const availableSlots = [];
  battlefield.lanes.forEach((lane, index) => {
    if (!lane.computer || lane.computer.isSkull) {
      availableSlots.push(index);
    }
  });

  // 배치할 카드 선택 (가장 강한 카드 우선 또는 랜덤)
  const cardsToPlace = [...gameState.computerHand]
    .sort((a, b) => (b.atk + b.hp) - (a.atk + a.hp)) // 가장 강한 카드 순 정렬
    .slice(0, maxPlacement); // 최대 배치 수만큼 선택

  // 카드 배치 실행
  for (const card of cardsToPlace) {
    if (availableSlots.length > 0 && placedCount < maxPlacement) {
      const randomIndex = Math.floor(Math.random() * availableSlots.length);
      const laneIndex = availableSlots[randomIndex];

      if (placeCardOnBattlefield(card, laneIndex, 'computer')) {
        removeCardFromHand(card.id, 'computer');
        placedCount++;
        availableSlots.splice(randomIndex, 1); // 사용된 슬롯 제거
        console.log(`컴퓨터가 카드 ${card.element.symbol}를 레인 ${laneIndex}에 배치`);
      }
    } else {
      break; // 배치할 슬롯이 없거나 최대 배치 수 도달
    }
  }

  if (placedCount > 0) {
    renderBattlefield(); // 배치 후 필드 업데이트
  }
}

/**
 * 컴퓨터 카드 강화
 */
function computerUpgradeCards() {
  let upgraded = false;
  // 전장의 모든 컴퓨터 카드 검사
  for (let i = 0; i < battlefield.lanes.length; i++) {
    const lane = battlefield.lanes[i];

    // 배치된 카드가 있고 해골이 아니면
    if (lane.computer && !lane.computer.isSkull) {
      const card = lane.computer;
      const upgradeLevel = card.upgradeLevel || 0;

      // 강화 비용 계산
      const cost = (upgradeLevel + 1) * 3; // 임시 비용

      // 전략적 강화 결정
      let shouldUpgrade = false;
      if (getComputerCoins() >= cost && upgradeLevel < 3 && Math.random() < 0.5) { // 50% 확률로 강화 시도
        shouldUpgrade = true;
      }

      // 강화 실행
      if (shouldUpgrade) {
        if (computerUpgradeCard(card, cost)) {
          console.log(`컴퓨터가 레인 ${i}의 카드를 강화했습니다! (코인: ${getComputerCoins()})`);
          upgraded = true;
        }
      }
    }
  }
  if (upgraded) {
    renderBattlefield(); // 강화 후 필드 업데이트
  }
}

/**
 * 컴퓨터 카드 강화 실행
 */
function computerUpgradeCard(card, cost) {
  if (spendComputerCoins(cost)) {
    card.atk = (card.atk || card.baseAtk) + Math.max(1, Math.floor(card.baseAtk * 0.3));
    const healthIncrease = Math.max(1, Math.floor(card.baseHp * 0.3));
    card.hp = (card.hp || card.baseHp) + healthIncrease;
    card.maxHp = (card.maxHp || card.baseHp) + healthIncrease;
    card.upgradeLevel = (card.upgradeLevel || 0) + 1;
    card.level = card.upgradeLevel;

    return true;
  }
  return false;
}

/**
 * 기지 자동 회복
 */
function healBases() {
  // 플레이어 기지 회복
  battlefield.bases.player.hp = Math.min(
    battlefield.bases.player.maxHp, 
    battlefield.bases.player.hp + BASE_HEALING_RATE
  );
  
  // 컴퓨터 기지 회복
  battlefield.bases.computer.hp = Math.min(
    battlefield.bases.computer.maxHp, 
    battlefield.bases.computer.hp + BASE_HEALING_RATE
  );
  
  // 기지 표시 업데이트
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay('player');
    updateBaseDisplay('computer');
  }
}

/**
 * 게임 종료
 * @param {boolean} isVictory - 승리 여부
 * @param {string} message - 표시할 메시지
 */
function endGame(isVictory, message) {
  gameState.isGameActive = false;
  
  const resultModal = document.getElementById('game-result-modal');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message-detail');
  
  if (resultTitle) {
    resultTitle.textContent = isVictory ? '승리!' : '패배...';
    resultTitle.className = `text-4xl font-bold mb-4 ${isVictory ? 'text-green-500' : 'text-red-500'}`;
  }
  
  if (resultMessage) {
    resultMessage.textContent = message || (isVictory ? 
      '적 과학 기지를 파괴하여 승리했습니다!' : 
      '과학 기지가 파괴되었습니다.');
  }
  
  // 승리 보상
  if (isVictory && typeof addCoins === 'function') {
    const victoryReward = 50;
    addCoins(victoryReward);
  }
  
  // 모달 표시
  if (resultModal) {
    resultModal.classList.remove('hidden');
  }
}

/**
 * 기지에 데미지 입히기
 * @param {string} side - 'player' 또는 'computer'
 * @param {number} damage - 데미지 양
 */
function damageBase(side, damage) {
  const base = battlefield.bases[side];
  if (!base) return;
  
  // 데미지가 숫자인지 확인
  damage = Number(damage) || 0;
  
  // base.hp가 숫자인지 확인
  if (isNaN(base.hp)) {
    console.error(`${side} 기지의 체력이 숫자가 아닙니다: ${base.hp}`);
    base.hp = base.maxHp || 100;  // 기본값으로 초기화
  }
  
  // 체력 감소
  base.hp = Math.max(0, base.hp - damage);
  
  // 기지 표시 업데이트
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay(side);
  }
  
  // 체력이 0이면 게임 종료
  if (base.hp <= 0) {
    endGame(side === 'computer', side === 'player' ? 
      '승리! 적 과학 기지를 파괴했습니다!' : 
      '패배! 과학 기지가 파괴되었습니다.');
  }
}

/**
 * 카드 요소 생성 (컴퓨터 카드 숨김 처리 추가)
 * @param {Object} card - 카드 데이터
 * @param {string} side - 'player' 또는 'computer'
 * @returns {HTMLElement} - 생성된 카드 요소
 */
function createCardElement(card, side) {
  const cardElement = document.createElement('div');
  const isComputer = side === 'computer';
  const isHidden = isComputer && !card.isSkull; // 컴퓨터 카드이고 파괴되지 않았으면 숨김

  cardElement.className = `card ${card.isSkull ? 'skull-card' : ''} ${side}-card`;

  if (isHidden) {
    // 숨겨진 컴퓨터 카드 스타일
    cardElement.classList.add('bg-gray-600', 'border-2', 'border-gray-500');
  } else if (card.isSkull) {
    // 파괴된 카드 스타일
    cardElement.classList.add('bg-gray-800');
  } else {
    // 일반 원소 카드 스타일 (플레이어 또는 파괴된 컴퓨터)
    cardElement.classList.add(card.element.color || 'bg-gray-500');
  }

  cardElement.classList.add('p-2', 'rounded-lg', 'shadow-lg', 'w-full', 'relative', 'h-full', 'flex', 'flex-col', 'justify-between');

  // 카드 ID 설정
  cardElement.setAttribute('data-card-id', card.id);

  // 원소 정보 설정 (숨겨지지 않은 경우)
  if (!card.isSkull && !isHidden) {
    const elementSymbol = card.element.symbol;
    cardElement.setAttribute('data-element', elementSymbol);
    cardElement.setAttribute('data-power', card.atk);
    cardElement.setAttribute('data-health', card.hp);
    cardElement.setAttribute('data-max-health', card.maxHp);
    if (card.upgradeLevel) {
      cardElement.setAttribute('data-level', card.upgradeLevel);
    }
  }

  // 카드 내용 설정
  if (isHidden) {
    // 숨겨진 컴퓨터 카드 내용
    cardElement.innerHTML = `
      <div class="flex-grow flex items-center justify-center">
        <span class="text-4xl font-bold text-gray-400">?</span>
      </div>
    `;
  } else if (card.isSkull) {
    cardElement.innerHTML = `
      <div class="flex-grow flex flex-col items-center justify-center">
        <div class="text-center font-bold text-gray-300 text-2xl">☠️</div>
        <div class="text-center text-sm text-gray-300 mt-1">파괴됨</div>
      </div>
    `;
  } else {
    cardElement.innerHTML = `
      <div>
        <div class="text-center font-bold">${card.element.symbol}</div>
        <div class="text-center text-sm">${card.element.name}</div>
      </div>
      <div class="mt-auto">
        <div class="flex justify-between text-sm mt-1">
          <div>⚔️ ${card.atk}</div>
          <div>❤️ ${card.hp}</div>
        </div>
        ${card.upgradeLevel ? `<div class="text-xs mt-1 text-center opacity-70">Lv ${card.upgradeLevel}</div>` : ''}
      </div>
    `;
  }

  return cardElement;
}

/**
 * 컴퓨터 코인 UI 업데이트
 */
function updateComputerCoinDisplay() {
  const computerCoinDisplay = document.getElementById('computer-coin-amount');
  if (computerCoinDisplay) {
    computerCoinDisplay.textContent = computerCoins;
  }
}

/**
 * 카드 뽑기 핸들러 수정 (중복 실행 방지)
 */
function handleBasicDraw() {
  if (isDrawingAnimationPlaying) {
    showMessage('뽑기 애니메이션 중입니다.', 'warning');
    return;
  }
  if (getCoinAmount() >= CARD_COSTS.basic) {
    spendCoins(CARD_COSTS.basic);
    drawCardByType('basic');
  } else {
    showMessage('코인이 부족합니다!', 'error');
  }
}

function handlePremiumDraw() {
  if (isDrawingAnimationPlaying) {
    showMessage('뽑기 애니메이션 중입니다.', 'warning');
    return;
  }
  if (getCoinAmount() >= CARD_COSTS.premium) {
    spendCoins(CARD_COSTS.premium);
    drawCardByType('premium');
  } else {
    showMessage('코인이 부족합니다!', 'error');
  }
}

function handleLegendDraw() {
  if (isDrawingAnimationPlaying) {
    showMessage('뽑기 애니메이션 중입니다.', 'warning');
    return;
  }
  if (getCoinAmount() >= CARD_COSTS.legend) {
    spendCoins(CARD_COSTS.legend);
    drawCardByType('legendary'); // 타입 이름 확인 ('legend' or 'legendary')
  } else {
    showMessage('코인이 부족합니다!', 'error');
  }
}

/**
 * 카드 뽑기 실행 함수 (애니메이션 플래그 설정/해제 추가)
 */
function drawCardByType(type) {
  if (gameState.playerHand.length >= 8) {
    showMessage('손패가 가득 찼습니다!', 'warning');
    return;
  }

  const newCard = createRandomCardByRarity(type);
  if (newCard) {
    isDrawingAnimationPlaying = true; // 애니메이션 시작 플래그
    playDrawAnimation(newCard, () => {
      // 애니메이션 완료 후 카드 추가 및 상태 업데이트
      addCardToHand(newCard, 'player');
      updateUI();
      isDrawingAnimationPlaying = false; // 애니메이션 종료 플래그
      console.log(`${type} 뽑기 완료: ${newCard.element.name}`);
    });
  } else {
    console.error("카드 생성 실패:", type);
  }
}

// 전역 노출
window.BASE_ATTACK_DAMAGE = BASE_ATTACK_DAMAGE;
window.BASE_HEALING_RATE = BASE_HEALING_RATE;
window.CARD_COSTS = CARD_COSTS;
window.COMPUTER_DRAW_COSTS = COMPUTER_DRAW_COSTS;
window.initGame = initGame;
window.resetGame = resetGame;
window.endTurn = endTurn;
window.healBases = healBases;
window.endGame = endGame;
window.damageBase = damageBase;
window.addComputerCoins = addComputerCoins;
window.spendComputerCoins = spendComputerCoins;
window.getComputerCoins = getComputerCoins;
window.updateComputerCoinDisplay = updateComputerCoinDisplay;
window.handleBasicDraw = handleBasicDraw;
window.handlePremiumDraw = handlePremiumDraw;
window.handleLegendDraw = handleLegendDraw;
window.updateBaseDisplay = updateBaseDisplay;
window.renderBattlefield = renderBattlefield;
window.createCardElement = createCardElement;
window.createRandomCardByRarity = createRandomCardByRarity;
window.selectRandomRarity = selectRandomRarity;
window.confirmPlayerCardUpgrade = confirmPlayerCardUpgrade;
window.dealInitialCards = dealInitialCards;
window.placeCardOnBattlefield = placeCardOnBattlefield;
window.removeCardFromHand = removeCardFromHand;
window.updateUI = updateUI;