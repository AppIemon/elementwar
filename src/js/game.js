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

// 뽑기 가격 조정
const CARD_COSTS = {
  basic: 2,
  premium: 5,
  legend: 10
};

const BASE_ATTACK_DAMAGE = 3;
const BASE_HEALING_RATE = 4;

// 컴퓨터 카드 뽑기 비용
const COMPUTER_DRAW_COSTS = {
  basic: 2,
  premium: 4, // 컴퓨터는 약간 할인된 가격
  legend: 8
};

// 컴퓨터 코인 관리
let computerCoins = 0;

function addComputerCoins(amount) {
  computerCoins += amount;
  updateComputerCoinDisplay();
}

function spendComputerCoins(amount) {
  computerCoins = Math.max(0, computerCoins - amount);
  updateComputerCoinDisplay();
}

function getComputerCoins() {
  return computerCoins;
}

function updateComputerCoinDisplay() {
  const computerCoinDisplay = document.getElementById('computer-coin-amount');
  if (computerCoinDisplay) {
    computerCoinDisplay.textContent = computerCoins;
  }
}

async function loadElementsData() {
  const response = await fetch('src/data/elements.json');
  gameState.elementsData = await response.json();
}

async function loadReactionsData() {
  const response = await fetch('src/data/reactions.json');
  gameState.reactionsData = await response.json();
}

function initGame() {
  resetBattlefield();
  updateScoreDisplay();
  updateTurnIndicator();
  
  // 컴퓨터 초기 코인 설정
  computerCoins = 4; // 컴퓨터는 조금 더 많은 코인으로 시작
  updateComputerCoinDisplay();
}

// 카드 뽑기 함수들 - 연타 방지 제거
function handleBasicDraw() {
  drawCardByType('basic');
}

function handlePremiumDraw() {
  drawCardByType('premium');
}

function handleLegendDraw() {
  drawCardByType('legend');
}

// 뽑기 함수 단순화 (연타 가능하게)
function drawCardByType(drawType) {
  if (!gameState.isPlayerTurn) return;
  
  const cost = CARD_COSTS[drawType];
  
  if (getCoinAmount() < cost) {
    showMessage('코인이 부족합니다!', 'error');
    return;
  }
  
  if (gameState.playerHand.length >= 8) {
    showMessage('손패가 가득 찼습니다!', 'error');
    return;
  }
  
  spendCoins(cost);
  
  try {
    // 애니메이션과 함께 카드 뽑기
    showDrawAnimation(function(newCard) {
      addCardToHand(newCard, 'player');
      updateUI();
      showMessage(`${newCard.element.name}(${newCard.element.symbol}) 카드를 뽑았습니다.`, 'success');
    }, drawType);
  } catch (error) {
    console.error('카드 뽑기 애니메이션 실행 중 오류 발생:', error);
    
    // 애니메이션 실패 시 직접 카드 지급
    const newCard = createRandomCardByRarity(drawType);
    addCardToHand(newCard, 'player');
    updateUI();
    showMessage(`${newCard.element.name}(${newCard.element.symbol}) 카드를 뽑았습니다.`, 'success');
  }
}

function endTurn() {
  if (!gameState.isPlayerTurn) return;
  
  gameState.isPlayerTurn = false;
  showMessage('컴퓨터 차례입니다.', 'info');
  
  gameState.turnCount++;
  
  // 카드 체력 자동 회복 체크
  checkCardHealing();
  
  // 기지 체력 자동 회복
  healBases();
  
  executeBattles();
  addCoins(3);
  
  // 컴퓨터 턴 시작 시 기본 코인 제공
  addComputerCoins(2);
  
  updateUI();
  
  setTimeout(computerTurn, 1500);
}

function computerTurn() {
  if (gameState.isPlayerTurn) return;
  
  showMessage("컴퓨터 턴: 생각 중...", 'info');
  
  // 컴퓨터의 결정을 좀 더 자연스럽게 보이도록 지연 추가
  setTimeout(() => {
    // 1. 카드 뽑기: 보유 코인에 따라 뽑기 전략 결정
    computerDrawCards();
    
    // 2. 손패의 카드를 전략적으로 배치
    computerPlaceCards();
    
    // 3. 필드의 카드 강화
    computerUpgradeCards();
    
    // 4. 턴 종료
    setTimeout(() => {
      showMessage("컴퓨터 턴 종료", 'info');
      startPlayerTurn();
    }, 800);
  }, 1000);
}

// 컴퓨터 카드 뽑기 전략
function computerDrawCards() {
  // 손패가 부족하면 우선적으로 뽑기
  while (gameState.computerHand.length < 5 && getComputerCoins() >= COMPUTER_DRAW_COSTS.basic) {
    let drawType = 'basic';
    
    // 고급 카드 뽑기 결정
    if (getComputerCoins() >= COMPUTER_DRAW_COSTS.legend && Math.random() > 0.7) {
      drawType = 'legend';
    } else if (getComputerCoins() >= COMPUTER_DRAW_COSTS.premium && Math.random() > 0.5) {
      drawType = 'premium';
    }
    
    // 카드 뽑기 실행
    computerDrawCard(drawType);
  }
}

// 컴퓨터 카드 뽑기 실행
function computerDrawCard(drawType) {
  // 비용 확인
  const cost = COMPUTER_DRAW_COSTS[drawType];
  if (getComputerCoins() < cost || gameState.computerHand.length >= 8) {
    return null;
  }
  
  // 코인 소비
  spendComputerCoins(cost);
  
  // 카드 생성 및 손패에 추가
  const newCard = createRandomCardByRarity(drawType);
  addCardToHand(newCard, 'computer');
  
  // 간략한 애니메이션 표시
  showMessage(`컴퓨터가 카드를 뽑았습니다.`, 'info');
  
  // UI 업데이트
  renderComputerHand();
  
  return newCard;
}

// 컴퓨터 카드 배치 전략
function computerPlaceCards() {
  if (gameState.computerHand.length === 0) return;
  
  // 최대 2장까지 배치 (전략적 결정)
  const maxPlacement = Math.min(2, gameState.computerHand.length);
  let placed = 0;
  
  // 전략 1: 상대가 있는 레인에 대응하기
  for (let i = 0; i < battlefield.lanes.length && placed < maxPlacement; i++) {
    const lane = battlefield.lanes[i];
    
    // 상대 카드가 있고 내 카드가 없는 레인이면 배치 고려
    if (lane.player && !lane.player.isSkull && (!lane.computer || lane.computer.isSkull)) {
      const bestCard = findBestCounterCard(lane.player, gameState.computerHand);
      if (bestCard) {
        if (placeCardOnBattlefield(bestCard, i, 'computer')) {
          removeCardFromHand(bestCard.id, 'computer');
          placed++;
        }
      }
    }
  }
  
  // 전략 2: 빈 레인에 카드 배치하기
  for (let i = 0; i < battlefield.lanes.length && placed < maxPlacement; i++) {
    const lane = battlefield.lanes[i];
    
    // 빈 레인이거나 아군 카드가 해골인 레인
    if (!lane.computer || lane.computer.isSkull) {
      // 무작위 또는 가장 강한 카드 선택
      const randomIndex = Math.floor(Math.random() * gameState.computerHand.length);
      const card = gameState.computerHand[randomIndex];
      
      if (placeCardOnBattlefield(card, i, 'computer')) {
        removeCardFromHand(card.id, 'computer');
        placed++;
      }
    }
  }
  
  // 전략 3: 기존 합성물에 추가 강화
  if (placed < maxPlacement) {
    for (let i = 0; i < battlefield.lanes.length && placed < maxPlacement; i++) {
      const lane = battlefield.lanes[i];
      
      // 이미 내 카드가 있는 레인
      if (lane.computer && !lane.computer.isSkull) {
        // 추가 합성 가능성이 있는 카드 찾기
        const compatibleCard = findCompatibleCard(lane.computer, gameState.computerHand);
        if (compatibleCard) {
          if (placeCardOnBattlefield(compatibleCard, i, 'computer')) {
            removeCardFromHand(compatibleCard.id, 'computer');
            placed++;
          }
        }
      }
    }
  }
  
  // UI 업데이트
  renderComputerHand();
}

// 컴퓨터 카드 강화 전략
function computerUpgradeCards() {
  // 전장의 모든 컴퓨터 카드 검사
  for (let i = 0; i < battlefield.lanes.length; i++) {
    const lane = battlefield.lanes[i];
    
    // 배치된 카드가 있고 해골이 아니면
    if (lane.computer && !lane.computer.isSkull) {
      const card = lane.computer;
      const upgradeLevel = card.upgradeLevel || 0;
      
      // 강화 비용 계산
      const cost = calculateUpgradeCost(upgradeLevel, card.element.rarity);
      
      // 전략적 강화 결정
      let shouldUpgrade = false;
      
      // 1. 코인이 충분하고 레벨이 낮으면 무조건 강화
      if (getComputerCoins() >= cost && upgradeLevel < 2) {
        shouldUpgrade = true;
      }
      // 2. 상대방 카드와 대치 중이면 승리 가능성에 따라 강화
      else if (lane.player && !lane.player.isSkull) {
        const playerCard = lane.player;
        
        // 내 카드가 약하면 강화 고려
        if (card.atk < playerCard.hp && getComputerCoins() >= cost) {
          shouldUpgrade = true;
        }
      }
      // 3. 상대방 카드가 없으면 기회 강화
      else if (!lane.player && getComputerCoins() >= cost * 1.5) {
        shouldUpgrade = true;
      }
      
      // 강화 실행
      if (shouldUpgrade) {
        const success = computerUpgradeCard(card, cost);
        if (success) {
          showMessage(`컴퓨터가 카드를 강화했습니다!`, 'warning');
        }
      }
    }
  }
}

// 컴퓨터 카드 강화 실행
function computerUpgradeCard(card, cost) {
  // 코인 확인
  if (getComputerCoins() < cost) {
    return false;
  }
  
  // 코인 소비
  spendComputerCoins(cost);
  
  // 현재 레벨 기준으로 능력치 증가
  const currentLevel = card.upgradeLevel || 0;
  const newLevel = currentLevel + 1;
  
  // 기본 증가량
  const atkIncrease = Math.floor(1 + (newLevel * 0.5));
  const hpIncrease = Math.floor(2 + (newLevel * 0.8));
  
  // 능력치 증가
  card.atk += atkIncrease;
  card.maxHp += hpIncrease;
  card.hp += hpIncrease;
  
  // 레벨 증가
  card.upgradeLevel = newLevel;
  
  // 업그레이드 애니메이션은 showCardDestroyEffect 함수가 이미 있다면 실행
  const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
  if (cardElement && typeof applyCardUpgradeAnimation === 'function') {
    applyCardUpgradeAnimation(cardElement);
  }
  
  renderBattlefield();
  return true;
}

// 최적의 대응 카드 찾기
function findBestCounterCard(targetCard, availableCards) {
  if (!availableCards || availableCards.length === 0) return null;
  
  // 점수 기반으로 카드 평가
  let bestCard = null;
  let bestScore = -1;
  
  for (const card of availableCards) {
    let score = 0;
    
    // 1. 공격력이 상대 체력보다 높으면 가산점
    if (card.atk >= targetCard.hp) {
      score += 30;
    } else {
      score += (card.atk / targetCard.hp) * 25;
    }
    
    // 2. 체력이 상대 공격력보다 높으면 가산점
    if (card.hp > targetCard.atk) {
      score += 25;
    } else {
      score += (card.hp / targetCard.atk) * 20;
    }
    
    // 3. 희귀도가 높으면 가산점
    const rarityScores = {
      common: 5,
      uncommon: 10,
      rare: 15,
      epic: 20,
      legendary: 25
    };
    score += rarityScores[card.element.rarity || 'common'] || 5;
    
    // 4. 분자 또는 특수 효과가 있으면 가산점
    if (card.isMolecule) {
      score += 15;
    }
    
    // 최고 점수 카드 선택
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }
  
  return bestCard;
}

// 합성물 생성 가능성이 높은 카드 찾기
function findCompatibleCard(existingCard, availableCards) {
  if (!availableCards || availableCards.length === 0) return null;
  
  // 1. 같은 원소를 가진 카드를 우선적으로 찾음 (H2O와 같은 형태 만들기)
  const element = existingCard.element;
  
  for (const card of availableCards) {
    if (card.element.symbol === element.symbol) {
      return card;
    }
  }
  
  // 2. 알려진 분자 조합 확인
  // 기존 카드가 가진 원소 기호
  const existingElementSymbol = existingCard.element.symbol;
  
  // 결합 가능성이 높은 원소들의 맵
  const commonCombinations = {
    'H': ['O', 'N', 'C', 'S'],
    'O': ['H', 'C', 'N'],
    'C': ['H', 'O', 'N'],
    'N': ['H', 'O'],
    'Cl': ['Na', 'H'],
    'Na': ['Cl'],
    'S': ['H', 'O'],
    'F': ['H'],
    'K': ['Cl', 'O'],
    'Li': ['F', 'Cl', 'O']
  };
  
  // 기존 원소와 잘 결합하는 원소 목록
  const goodMatches = commonCombinations[existingElementSymbol] || [];
  
  // 결합 가능성이 높은 카드 찾기
  for (const match of goodMatches) {
    for (const card of availableCards) {
      if (card.element.symbol === match) {
        return card;
      }
    }
  }
  
  // 3. 그 외에는 랜덤 선택
  if (Math.random() < 0.3) { // 30% 확률로 결합 시도
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }
  
  return null;
}

// 기지 자동 회복
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
  updateBaseDisplay();
}

function executeBattles() {
  let battleResults = [];
  
  battlefield.lanes.forEach((lane, laneIndex) => {
    const playerCard = lane.player;
    const computerCard = lane.computer;
    
    // 카드 vs 카드 전투
    if (playerCard && computerCard && !playerCard.isSkull && !computerCard.isSkull) {
      const playerAttackResult = executeAttack(playerCard, computerCard);
      const computerAttackResult = executeAttack(computerCard, playerCard);
      
      battleResults.push({
        lane: laneIndex,
        playerAttack: playerAttackResult,
        computerAttack: computerAttackResult
      });
      
      // 컴퓨터 카드 파괴
      if (computerCard.hp <= 0) {
        const coinReward = computerCard.element.rewardCoins || 5;
        addCoins(coinReward);
        gameState.playerScore += 1;
        
        const skullCard = createSkullCard('computer', computerCard.element);
        battlefield.lanes[laneIndex].computer = skullCard;
        
        // 파괴 이펙트
        showCardDestroyEffect(computerCard, laneIndex);
      }
      
      // 플레이어 카드 파괴
      if (playerCard.hp <= 0) {
        gameState.computerScore += 1;
        
        const skullCard = createSkullCard('player', playerCard.element);
        battlefield.lanes[laneIndex].player = skullCard;
        
        // 파괴 이펙트
        showCardDestroyEffect(playerCard, laneIndex);
      }
      
      // 손상된 카드는 마지막 데미지 턴 업데이트
      if (computerCard.hp < computerCard.maxHp) {
        computerCard.lastDamageTurn = gameState.turnCount;
      }
      if (playerCard.hp < playerCard.maxHp) {
        playerCard.lastDamageTurn = gameState.turnCount;
      }
      
      checkChemicalReactions(laneIndex);
    }
    // 플레이어 카드가 있고 컴퓨터 카드가 없거나 해골 카드인 경우
    else if (playerCard && !playerCard.isSkull && (!computerCard || computerCard.isSkull)) {
      // 컴퓨터 기지 직접 공격
      const damage = calculateBaseDamage(playerCard);
      damageBase('computer', damage);
      showMessage(`${playerCard.element.name} 카드가 적 기지에 ${damage}의 피해를 입혔습니다!`, 'success');
    }
    // 컴퓨터 카드가 있고 플레이어 카드가 없거나 해골 카드인 경우
    else if (computerCard && !computerCard.isSkull && (!playerCard || playerCard.isSkull)) {
      // 플레이어 기지 직접 공격
      const damage = calculateBaseDamage(computerCard);
      damageBase('player', damage);
      showMessage(`적 ${computerCard.element.name} 카드가 기지에 ${damage}의 피해를 입혔습니다!`, 'error');
    }
  });
  
  updateScoreDisplay();
  renderBattlefield();
}

// 기본 공격 피해 계산 (소수점 첫째자리까지만)
function calculateBaseDamage(card) {
  // 기본 공격력 + 카드 공격력의 일부
  let damage = BASE_ATTACK_DAMAGE + Math.floor(card.atk / 2 * 10) / 10;
  
  // 특수 능력이나 업그레이드에 따른 추가 피해
  if (card.element.baseAttackBonus) {
    damage += Math.floor(card.element.baseAttackBonus * 10) / 10;
  }
  
  // 업그레이드된 카드 추가 피해
  const elementId = card.element.symbol;
  if (gameState.upgrades.elements[elementId] && 
      gameState.upgrades.elements[elementId].level > 0) {
    damage += gameState.upgrades.elements[elementId].level;
  }
  
  return Math.floor(damage * 10) / 10;
}

function endGame(isVictory, message) {
  gameState.isGameActive = false;
  
  const resultModal = document.getElementById('game-result-modal');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message-detail');
  
  if (isVictory) {
    resultTitle.textContent = '승리!';
    resultTitle.className = 'text-4xl font-bold mb-4 text-green-500';
    resultMessage.textContent = message || '적 과학 기지를 파괴하여 승리했습니다!';
    
    // 승리 보상 지급
    const victoryReward = 50;
    addCoins(victoryReward);
  } else {
    resultTitle.textContent = '패배...';
    resultTitle.className = 'text-4xl font-bold mb-4 text-red-500';
    resultMessage.textContent = message || '과학 기지가 파괴되었습니다.';
  }
  
  resultModal.classList.remove('hidden');
  
  document.getElementById('new-game-btn').addEventListener('click', function() {
    resultModal.classList.add('hidden');
    resetGame();
  });
}

function resetGame() {
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.isGameActive = true;
  gameState.playerHand = [];
  gameState.computerHand = [];
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
  
  resetCoins();
  resetBattlefield();
  
  // 초기 카드 지급
  for (let i = 0; i < 3; i++) {
    addCardToHand(createRandomCard(), 'player');
  }
  
  showMessage('게임이 초기화되었습니다. 카드를 배치하세요!', 'info');
  updateUI();
}

function updateScoreDisplay() {
  document.getElementById('player-score').textContent = gameState.playerScore;
  document.getElementById('computer-score').textContent = gameState.computerScore;
}

function updateTurnIndicator() {
  const resultMessage = document.getElementById('result-message');
  
  if (gameState.isPlayerTurn) {
    resultMessage.textContent = `${gameState.turnCount}턴: 플레이어 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-blue-400';
  } else {
    resultMessage.textContent = `${gameState.turnCount}턴: 컴퓨터 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-red-400';
  }
}

function updateUI() {
  renderPlayerHand();
  renderBattlefield();
  updateTurnIndicator();
  updateCoinDisplay();
  updateBaseDisplay();
}

// 등급에 따른 카드 생성
function createCardWithRarity(rarity) {
  // 원소 데이터가 로드되었는지 확인
  if (!gameState.elementsData || gameState.elementsData.length === 0) {
    console.error('원소 데이터가 로드되지 않았습니다.');
    return createDefaultCard(rarity);
  }
  
  // 등급에 맞는 원소들 필터링
  const eligibleElements = gameState.elementsData.filter(element => {
    if (!element) return false; // element가 undefined인 경우 제외
    // 원소에 등급이 없으면 common으로 간주
    const elementRarity = element.rarity || 'common';
    return elementRarity === rarity;
  });
  
  // 등급에 맞는 원소가 없으면 모든 원소에서 선택
  const elements = eligibleElements.length > 0 ? eligibleElements : gameState.elementsData;
  
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

// 기본 카드 생성 (예외 상황용)
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

// 지정된 등급에 맞는 랜덤 카드 생성
function createRandomCardByRarity(drawType) {
  // 뽑기 유형에 따른 등급 확률 가져오기
  const rarityChances = gameState.rarityChances[drawType] || gameState.rarityChances.basic;
  
  // 랜덤 등급 선택
  const rarity = selectRandomRarity(rarityChances);
  
  // 선택된 등급으로 카드 생성
  return createCardWithRarity(rarity);
}

// 확률에 따른 랜덤 등급 선택
function selectRandomRarity(rarityChances) {
  const totalChance = Object.values(rarityChances).reduce((sum, chance) => sum + chance, 0);
  let randomValue = Math.random() * totalChance;
  
  for (const [rarity, chance] of Object.entries(rarityChances)) {
    if (randomValue < chance) {
      return rarity;
    }
    randomValue -= chance;
  }
  
  // 기본값으로 common 반환
  return 'common';
}

// 손패에 카드 추가
function addCardToHand(card, side) {
  if (!card) return;
  
  if (side === 'player') {
    gameState.playerHand.push(card);
  } else if (side === 'computer') {
    gameState.computerHand.push(card);
  }
}

// 손패에서 카드 제거
function removeCardFromHand(cardId, side) {
  if (side === 'player') {
    gameState.playerHand = gameState.playerHand.filter(card => card.id !== cardId);
  } else if (side === 'computer') {
    gameState.computerHand = gameState.computerHand.filter(card => card.id !== cardId);
  }
}

function upgradeCardOnField(card, cost) {
  // 코인 확인
  if (getCoinAmount() < cost) {
    showMessage('코인이 부족합니다!', 'error');
    return false;
  }
  
  // 코인 차감
  spendCoins(cost);
  
  // 현재 레벨 기준으로 능력치 증가
  const currentLevel = card.upgradeLevel || 0;
  const newLevel = currentLevel + 1;
  
  // 기본 증가량
  const atkIncrease = Math.floor(1 + (newLevel * 0.5));
  const hpIncrease = Math.floor(2 + (newLevel * 0.8));
  
  // 능력치 증가
  card.atk += atkIncrease;
  card.maxHp += hpIncrease;
  card.hp += hpIncrease;
  
  // 레벨 증가
  card.upgradeLevel = newLevel;
  
  // 업그레이드 표시 애니메이션
  const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
  if (cardElement) {
    try {
      applyCardUpgradeAnimation(cardElement);
    } catch (error) {
      console.error('카드 업그레이드 애니메이션 오류:', error);
    }
  }
  
  return true;
}

// 카드 강화 처리 함수 추가
function handleCardUpgrade(cardId, laneIndex, side) {
  const lane = battlefield.lanes[laneIndex];
  const card = lane[side];
  
  if (!card || card.isSkull) return;
  
  // 카드 강화 모달 표시
  showCardUpgradeModal(card, laneIndex, side);
}

// 생성 가능한 분자 찾기 함수
function findPossibleMolecules(card) {
  if (!card || card.isSkull) return [];
  
  // 카드와 스택의 원소 정보 수집
  const elementCounts = {};
  
  // 현재 카드 원소 추가
  const cardSymbol = card.element.symbol;
  elementCounts[cardSymbol] = 1;
  
  // 스택된 카드 원소 추가
  if (card.stacked && card.stacked.length > 0) {
    for (const stackedCard of card.stacked) {
      if (stackedCard.originalElement) {
        const stackSymbol = stackedCard.originalElement.symbol;
        if (elementCounts[stackSymbol]) {
          elementCounts[stackSymbol]++;
        } else {
          elementCounts[stackSymbol] = 1;
        }
      }
    }
  }
  
  // 가능한 분자 반응 찾기
  const possibleMolecules = [];
  
  gameState.reactionsData.forEach(reaction => {
    // 필요한 원소 카운트 계산
    const requiredElements = {};
    let needsMoreElements = false;
    
    // 반응에 필요한 원소 카운트
    for (const elementId of reaction.elements) {
      const element = getElementByNumber(elementId);
      if (!element) continue;
      
      const elementSymbol = element.symbol;
      if (requiredElements[elementSymbol]) {
        requiredElements[elementSymbol]++;
      } else {
        requiredElements[elementSymbol] = 1;
      }
    }
    
    // 현재 보유한 원소와 필요한 원소 비교
    for (const [symbol, count] of Object.entries(requiredElements)) {
      if (!elementCounts[symbol] || elementCounts[symbol] < count) {
        needsMoreElements = true;
        break;
      }
    }
    
    // 분자 생성 가능성 확인
    if (!needsMoreElements) {
      // 이미 충분한 원소가 있는 경우 (바로 제작 가능)
      const molecule = createMoleculeFromReaction(reaction);
      if (molecule) {
        molecule.status = 'ready';
        possibleMolecules.push(molecule);
      }
    } else {
      // 더 많은 원소가 필요한 경우
      const missingElements = {};
      let totalMissing = 0;
      
      for (const [symbol, count] of Object.entries(requiredElements)) {
        const currentCount = elementCounts[symbol] || 0;
        if (currentCount < count) {
          const missing = count - currentCount;
          missingElements[symbol] = missing;
          totalMissing += missing;
        }
      }
      
      // 분자 1-2개 원소만 부족한 경우 표시
      if (totalMissing <= 2) {
        const molecule = createMoleculeFromReaction(reaction);
        if (molecule) {
          molecule.status = 'missing';
          molecule.missingElements = missingElements;
          possibleMolecules.push(molecule);
        }
      }
    }
  });
  
  return possibleMolecules;
}

/**
 * 카드 힐링 효과 체크 및 적용
 * 회복 효과가 있는 카드들의 힐링 능력을 확인하고 적용합니다.
 */
function checkCardHealing() {
  // 플레이어 카드 힐링 효과 확인
  document.querySelectorAll('.player-slot .card').forEach(card => {
    // 카드가 힐링 효과를 가지고 있는지 확인
    const effectType = card.getAttribute('data-effect-type');
    const effectValue = parseInt(card.getAttribute('data-effect-value')) || 0;
    
    if (effectType === 'heal' && effectValue > 0) {
      // 카드 자신 힐링
      healCard(card, effectValue);
      
      // 인접한 플레이어 카드들에게 힐링 효과 적용 (선택적)
      const laneElement = card.closest('.battlefield-lane');
      if (laneElement) {
        const laneIndex = parseInt(laneElement.id.replace('lane-', ''));
        applyHealingToAdjacentCards(laneIndex, effectValue, 'player');
      }
    }
  });
  
  // 컴퓨터 카드 힐링 효과 확인
  document.querySelectorAll('.computer-slot .card').forEach(card => {
    // 카드가 힐링 효과를 가지고 있는지 확인
    const effectType = card.getAttribute('data-effect-type');
    const effectValue = parseInt(card.getAttribute('data-effect-value')) || 0;
    
    if (effectType === 'heal' && effectValue > 0) {
      // 카드 자신 힐링
      healCard(card, effectValue);
      
      // 인접한 컴퓨터 카드들에게 힐링 효과 적용 (선택적)
      const laneElement = card.closest('.battlefield-lane');
      if (laneElement) {
        const laneIndex = parseInt(laneElement.id.replace('lane-', ''));
        applyHealingToAdjacentCards(laneIndex, effectValue, 'computer');
      }
    }
  });
  
  console.log('카드 회복 효과가 적용되었습니다.');
}

/**
 * 카드 힐링 적용
 * @param {HTMLElement} card - 힐링할 카드
 * @param {number} healAmount - 회복량
 */
function healCard(card, healAmount) {
  const currentHealth = parseInt(card.getAttribute('data-health')) || 0;
  const maxHealth = parseInt(card.getAttribute('data-max-health')) || currentHealth;
  
  // 최대 체력을 초과하지 않게 회복
  const newHealth = Math.min(currentHealth + healAmount, maxHealth);
  
  // 체력 업데이트
  card.setAttribute('data-health', newHealth);
  
  // 체력 표시 업데이트
  const healthDisplay = card.querySelector('div:last-child div:last-child');
  if (healthDisplay) {
    healthDisplay.textContent = `❤️ ${newHealth}`;
  }
  
  // 힐링 시각 효과 (선택적)
  if (newHealth > currentHealth) {
    card.classList.add('card-heal');
    setTimeout(() => {
      card.classList.remove('card-heal');
    }, 1000);
  }
}

/**
 * 인접 카드에 힐링 효과 적용
 * @param {number} laneIndex - 현재 레인 인덱스
 * @param {number} healAmount - 회복량
 * @param {string} side - 'player' 또는 'computer'
 */
function applyHealingToAdjacentCards(laneIndex, healAmount, side) {
  // 인접한 레인 인덱스 계산
  const adjacentLanes = [laneIndex - 1, laneIndex + 1].filter(idx => idx >= 0 && idx <= 4);
  
  // 인접 레인의 카드에 힐링 적용
  adjacentLanes.forEach(idx => {
    const lane = document.getElementById(`lane-${idx}`);
    if (lane) {
      const slot = lane.querySelector(side === 'player' ? '.player-slot' : '.computer-slot');
      const card = slot?.querySelector('.card');
      
      if (card) {
        // 회복량 감소 (인접한 카드는 효과가 50% 감소)
        const reducedHeal = Math.max(1, Math.floor(healAmount / 2));
        healCard(card, reducedHeal);
      }
    }
  });
}

// 기지 디스플레이 업데이트
function updateBaseDisplay(side, hp) {
  // hp가 정의되지 않았거나 숫자가 아닌 경우 처리
  let displayHP = hp;
  if (displayHP === undefined || isNaN(displayHP)) {
    console.error(`${side} 기지 체력 값이 유효하지 않습니다: ${hp}`);
    // 기본값으로 복구
    displayHP = side === 'player' ? 
      (battlefield?.bases?.player?.hp || 100) : 
      (battlefield?.bases?.computer?.hp || 100);
  }
  
  // 유효한 체력값인지 확인 (음수 방지)
  displayHP = Math.max(0, displayHP);
  
  // 최대 체력 (기본값 100)
  const maxHP = 100;
  
  // 체력 백분율 계산
  const hpPercentage = Math.max(0, Math.min(100, (displayHP / maxHP) * 100));
  
  // 요소 ID 설정
  const hpId = side === 'player' ? 'player-base-hp' : 'computer-base-hp';
  const barId = side === 'player' ? 'player-base-hp-bar' : 'computer-base-hp-bar';
  
  // 체력 숫자 표시 업데이트
  const hpElement = document.getElementById(hpId);
  if (hpElement) {
    hpElement.textContent = Math.floor(displayHP); // 정수로 표시
    
    // 낮은 체력일 때 시각적 피드백
    if (hpPercentage <= 25) {
      hpElement.classList.add('text-red-500');
      hpElement.classList.add('font-bold');
    } else if (hpPercentage <= 50) {
      hpElement.classList.add('text-yellow-500');
      hpElement.classList.remove('text-red-500');
    } else {
      hpElement.classList.remove('text-yellow-500');
      hpElement.classList.remove('text-red-500');
    }
  }
  
  // 체력 바 업데이트
  const barElement = document.getElementById(barId);
  if (barElement) {
    barElement.style.width = `${hpPercentage}%`;
    
    // 체력에 따른 색상 변경
    if (hpPercentage <= 25) {
      barElement.classList.remove('bg-yellow-500');
      barElement.classList.add('bg-red-500');
    } else if (hpPercentage <= 50) {
      barElement.classList.remove('bg-red-500');
      barElement.classList.add('bg-yellow-500');
    } else {
      barElement.classList.remove('bg-yellow-500');
      barElement.classList.remove('bg-red-500');
      
      // 원래 색상으로 복원
      if (side === 'player') {
        barElement.classList.add('bg-blue-500');
      } else {
        barElement.classList.add('bg-red-500');
      }
    }
    
    // 체력이 낮을 때 애니메이션 효과 (선택적)
    if (hpPercentage <= 15) {
      barElement.classList.add('animate-pulse');
    } else {
      barElement.classList.remove('animate-pulse');
    }
  }
  
  // 체력이 0이 되면 게임 결과 처리 (이미 다른 곳에서 처리되는 경우 제거)
  if (displayHP <= 0) {
    // 게임 결과 처리 함수가 있는 경우 호출 (옵션)
    if (typeof checkGameOver === 'function') {
      checkGameOver(); 
    }
  }
}

// damageBase 함수 수정
function damageBase(side, damage) {
  // 기지 정보 접근
  const base = battlefield.bases[side];
  if (!base) return;
  
  // 데미지가 숫자인지 확인
  damage = Number(damage) || 0;
  
  // base.hp가 숫자인지 확인
  if (isNaN(base.hp)) {
    console.error(`${side} 기지의 체력이 숫자가 아닙니다: ${base.hp}`);
    base.hp = base.maxHp || 100;  // 최대 체력 또는 기본값으로 초기화
  }
  
  // 체력 감소
  base.hp = Math.max(0, base.hp - damage);
  
  // 기지 표시 업데이트
  updateBaseDisplay(side, base.hp);
  
  // 체력이 0이면 게임 종료
  if (base.hp <= 0) {
    endGame(side === 'computer', side === 'player' ? 
      '승리! 적 과학 기지를 파괴했습니다!' : 
      '패배! 과학 기지가 파괴되었습니다.');
  }
}

// 전투 필드 렌더링 함수
// 현재 게임 상태에 따라 전장의 모든 카드와 상태를 업데이트합니다.
function renderBattlefield() {
  // 각 레인 업데이트
  battlefield.lanes.forEach((lane, laneIndex) => {
    const laneElement = document.getElementById(`lane-${laneIndex}`);
    if (!laneElement) return;
    
    // 플레이어 슬롯 업데이트
    const playerSlot = laneElement.querySelector('.player-slot');
    if (playerSlot) {
      // 기존 카드 제거
      while (playerSlot.firstChild) {
        playerSlot.removeChild(playerSlot.firstChild);
      }
      
      // 플레이어 카드가 있으면 렌더링
      if (lane.player) {
        const cardElement = createCardElement(lane.player, 'player');
        playerSlot.appendChild(cardElement);
      }
    }
    
    // 컴퓨터 슬롯 업데이트
    const computerSlot = laneElement.querySelector('.computer-slot');
    if (computerSlot) {
      // 기존 카드 제거
      while (computerSlot.firstChild) {
        computerSlot.removeChild(computerSlot.firstChild);
      }
      
      // 컴퓨터 카드가 있으면 렌더링
      if (lane.computer) {
        const cardElement = createCardElement(lane.computer, 'computer');
        computerSlot.appendChild(cardElement);
      }
    }
  });
  
  // 기지 상태 업데이트
  if (battlefield.bases) {
    // 플레이어 기지
    if (battlefield.bases.player) {
      updateBaseDisplay('player', battlefield.bases.player.hp);
    }
    
    // 컴퓨터 기지
    if (battlefield.bases.computer) {
      updateBaseDisplay('computer', battlefield.bases.computer.hp);
    }
  }
  
  // 화학 반응 가능성 체크 (옵션)
  checkAllLanesForReactions();
}

/**
 * 카드 요소 생성
 * @param {Object} card - 카드 데이터
 * @param {string} side - 'player' 또는 'computer'
 * @returns {HTMLElement} - 생성된 카드 요소
 */
function createCardElement(card, side) {
  const cardElement = document.createElement('div');
  cardElement.className = `card ${card.isSkull ? 'skull-card' : ''} ${side === 'player' ? 'player-card' : 'computer-card'}`;
  
  if (card.isMolecule) {
    // 분자 카드 스타일
    cardElement.classList.add('molecule-card');
    cardElement.classList.add(card.color || 'bg-purple-600');
  } else if (card.isSkull) {
    // 파괴된 카드 스타일
    cardElement.classList.add('bg-gray-800');
  } else {
    // 일반 원소 카드 스타일
    cardElement.classList.add(card.element.color || 'bg-gray-500');
  }
  
  cardElement.classList.add('p-2', 'rounded-lg', 'shadow-lg', 'w-full', 'relative');
  
  // 카드 ID 설정
  cardElement.setAttribute('data-card-id', card.id);
  
  // 원소 정보 설정
  if (!card.isSkull) {
    const elementSymbol = card.isMolecule ? card.formula : card.element.symbol;
    cardElement.setAttribute('data-element', elementSymbol);
    
    // 능력치 설정
    cardElement.setAttribute('data-power', card.atk);
    cardElement.setAttribute('data-health', card.hp);
    cardElement.setAttribute('data-max-health', card.maxHp);
    
    // 레벨 설정
    if (card.upgradeLevel) {
      cardElement.setAttribute('data-level', card.upgradeLevel);
    }
    
    // 특수 효과 설정
    if (card.effectType) {
      cardElement.setAttribute('data-effect-type', card.effectType);
      cardElement.setAttribute('data-effect-value', card.effectValue);
      if (card.effectDuration) {
        cardElement.setAttribute('data-effect-duration', card.effectDuration);
      }
    }
  }
  
  // 카드 내용 설정
  if (card.isSkull) {
    cardElement.innerHTML = `
      <div class="text-center font-bold text-gray-300">☠️</div>
      <div class="text-center text-sm text-gray-300">파괴됨</div>
    `;
  } else if (card.isMolecule) {
    // 분자 카드 내용
    cardElement.innerHTML = `
      <div class="text-center font-bold text-white text-lg">${card.formula}</div>
      <div class="text-center text-white text-sm mb-1">${card.name}</div>
      <div class="flex justify-between text-sm text-white">
        <div>⚔️ ${card.atk}</div>
        <div>❤️ ${card.hp}</div>
      </div>
      ${card.effectType ? `<div class="text-xs mt-1 text-center text-purple-200">${getEffectText(card)}</div>` : ''}
    `;
    
    // 특수 효과 아이콘
    if (card.effectType) {
      const effectIcon = document.createElement('div');
      effectIcon.className = 'special-ability absolute top-1 right-1 bg-yellow-500 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold';
      effectIcon.textContent = getEffectIcon(card.effectType);
      cardElement.appendChild(effectIcon);
    }
  } else {
    // 일반 원소 카드 내용
    cardElement.innerHTML = `
      <div class="text-center font-bold">${card.element.symbol}</div>
      <div class="text-center text-sm">${card.element.name}</div>
      <div class="flex justify-between text-sm mt-1">
        <div>⚔️ ${card.atk}</div>
        <div>❤️ ${card.hp}</div>
      </div>
      ${card.upgradeLevel ? `<div class="text-xs mt-1 text-center opacity-70">Lv ${card.upgradeLevel}</div>` : ''}
    `;
  }
  
  // 강화 레벨 표시
  if (card.upgradeLevel && card.upgradeLevel > 0) {
    // 강화 레벨에 따른 별 표시 추가
    const upgradeMarker = document.createElement('div');
    upgradeMarker.className = 'absolute top-1 right-1 bg-yellow-500 text-yellow-900 rounded-full px-1 text-xs font-bold';
    
    // 레벨에 따른 별 개수
    let stars = '';
    for (let i = 0; i < card.upgradeLevel; i++) {
      stars += '★';
    }
    
    upgradeMarker.textContent = stars;
    cardElement.appendChild(upgradeMarker);
  }
  
  return cardElement;
}

/**
 * 효과 아이콘 가져오기
 * @param {string} effectType - 효과 유형
 * @returns {string} - 아이콘 문자
 */
function getEffectIcon(effectType) {
  const icons = {
    'heal': '💖',
    'damage': '💥',
    'poison': '☠️',
    'burn': '🔥',
    'freeze': '❄️',
    'defense': '🛡️',
    'boost': '⚡',
    'corrode': '💧'
  };
  
  return icons[effectType] || '✨';
}

/**
 * 효과 설명 텍스트 가져오기
 * @param {Object} card - 카드 객체
 * @returns {string} - 효과 설명
 */
function getEffectText(card) {
  if (!card || !card.effectType) return '';
  
  const descriptions = {
    'heal': `회복: 매 턴 ${card.effectValue} 회복`,
    'damage': `피해: 공격 시 ${card.effectValue} 추가 피해`,
    'poison': `중독: ${card.effectDuration || 2}턴간 ${card.effectValue} 피해`,
    'burn': `화상: ${card.effectDuration || 2}턴간 ${card.effectValue} 피해`,
    'freeze': `빙결: ${card.effectDuration || 1}턴간 행동 불가`,
    'defense': `방어: ${card.effectValue} 방어력 제공`,
    'boost': `강화: 아군 공격력 ${card.effectValue} 증가`,
    'corrode': `부식: 방어력 무시 ${card.effectValue} 피해`
  };
  
  return descriptions[card.effectType] || '특수 효과';
}

/**
 * 모든 레인에서 화학 반응 가능성 확인
 */
function checkAllLanesForReactions() {
  battlefield.lanes.forEach((lane, laneIndex) => {
    // 플레이어 슬롯에서 반응 가능성 체크
    const playerSlot = document.querySelector(`#lane-${laneIndex} .player-slot`);
    if (playerSlot && playerSlot.children.length > 1) {
      if (typeof checkForReactions === 'function') {
        checkForReactions(playerSlot);
      }
    }
    
    // 컴퓨터 슬롯에서 반응 가능성 체크
    const computerSlot = document.querySelector(`#lane-${laneIndex} .computer-slot`);
    if (computerSlot && computerSlot.children.length > 1) {
      if (typeof checkForReactions === 'function') {
        checkForReactions(computerSlot);
      }
    }
  });
}

// 전역으로 함수 노출
window.updateBaseDisplay = updateBaseDisplay;
window.renderBattlefield = renderBattlefield;
window.createCardElement = createCardElement;
window.createRandomCardByRarity = createRandomCardByRarity;
window.selectRandomRarity = selectRandomRarity;
