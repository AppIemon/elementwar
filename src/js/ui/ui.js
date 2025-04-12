/**
 * 이벤트 리스너 연결
 */
function attachEventListeners() {
  // 튜토리얼 버튼 이벤트 리스너
  const tutorialBtn = document.getElementById('tutorial-btn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      const tutorialModal = document.getElementById('tutorial-modal');
      if (tutorialModal) {
        tutorialModal.classList.remove('hidden');
      }
    });
  }

  // 합성 가이드 버튼 관련 코드 제거
  const headerButtons = document.querySelector('.flex.items-center');
  if (headerButtons) {
    // 합성 가이드 버튼 제거
    const existingSynthesisBtn = document.getElementById('synthesis-guide-btn');
    if (existingSynthesisBtn) {
      existingSynthesisBtn.remove();
    }
  }

  // 모달 닫기 버튼 이벤트 리스너
  const closeModalButtons = document.querySelectorAll('[id^="close-"]');
  closeModalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const modal = button.closest('.fixed');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // 카드 뽑기 버튼 이벤트 리스너
  document.getElementById('draw-basic-btn')?.addEventListener('click', handleBasicDraw);
  document.getElementById('draw-premium-btn')?.addEventListener('click', handlePremiumDraw);
  document.getElementById('draw-legend-btn')?.addEventListener('click', handleLegendDraw);

  // 턴 종료 & 리셋 버튼 이벤트 리스너
  document.getElementById('end-turn-btn')?.addEventListener('click', endTurn);
  document.getElementById('reset-btn')?.addEventListener('click', resetGame);

  // 플레이어 손패 클릭 이벤트 리스너
  const playerHand = document.getElementById('player-hand');
  if (playerHand && !playerHand.dataset.listenerAttached) {
    playerHand.addEventListener('click', handleHandCardClick);
    playerHand.dataset.listenerAttached = 'true';
  }
}

/**
 * UI 관련 기능
 */

/**
 * UI 초기화
 */
function initUI() {
  console.log('UI 초기화 중...');
  if (window.uiInitialized) return;
  window.uiInitialized = true;

  attachEventListeners();
  updateCoinDisplay(); // 플레이어 코인 초기화
  console.log('UI 초기화 완료');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 카드 뽑기 버튼
  const basicDrawBtn = document.getElementById('draw-basic-btn');
  const premiumDrawBtn = document.getElementById('draw-premium-btn');
  const legendDrawBtn = document.getElementById('draw-legend-btn');
  
  if (basicDrawBtn) basicDrawBtn.addEventListener('click', handleBasicDraw);
  if (premiumDrawBtn) premiumDrawBtn.addEventListener('click', handlePremiumDraw);
  if (legendDrawBtn) legendDrawBtn.addEventListener('click', handleLegendDraw);
  
  // 턴 종료 & 리셋 버튼
  const endTurnBtn = document.getElementById('end-turn-btn');
  const resetBtn = document.getElementById('reset-btn');
  
  if (endTurnBtn) endTurnBtn.addEventListener('click', endTurn);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);
  
  // 튜토리얼 버튼
  const tutorialBtn = document.getElementById('tutorial-btn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', function() {
      if (typeof showTutorial === 'function') {
        showTutorial();
      } else {
        showModal('tutorial');
      }
    });
  }
}

/**
 * 일반 카드 뽑기 처리
 */
function handleBasicDraw() {
  drawCardByType('basic');
}

/**
 * 프리미엄 카드 뽑기 처리
 */
function handlePremiumDraw() {
  drawCardByType('premium');
}

/**
 * 레전드 카드 뽑기 처리
 */
function handleLegendDraw() {
  drawCardByType('legend');
}

/**
 * 카드 뽑기 처리
 * @param {string} drawType - 뽑기 유형 ('basic', 'premium', 'legend')
 */
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
      renderPlayerHand();
      showMessage(`${newCard.element.name}(${newCard.element.symbol}) 카드를 뽑았습니다.`, 'success');
    }, drawType);
  } catch (error) {
    console.error('카드 뽑기 애니메이션 실행 중 오류 발생:', error);
    
    // 애니메이션 실패 시 직접 카드 지급
    const newCard = createRandomCardByRarity(drawType);
    if (newCard) {
      addCardToHand(newCard, 'player');
      renderPlayerHand();
      showMessage(`${newCard.element.name}(${newCard.element.symbol}) 카드를 뽑았습니다.`, 'success');
    }
  }
}

/**
 * 턴 종료 처리
 */
function endTurn() {
  if (!gameState.isPlayerTurn) return;
  
  gameState.isPlayerTurn = false;
  showMessage('컴퓨터 차례입니다.', 'info');
  
  gameState.turnCount++;
  
  // 카드 체력 자동 회복 체크
  if (typeof checkCardHealing === 'function') {
    checkCardHealing();
  }
  
  // 기지 체력 자동 회복
  if (typeof healBases === 'function') {
    healBases();
  } else {
    console.warn('기지 회복 함수를 찾을 수 없습니다.');
  }
  
  // 전투 실행
  if (typeof executeBattles === 'function') {
    executeBattles();
  }
  
  // 턴 종료 시 코인 지급
  addCoins(3);
  
  // 컴퓨터 턴 시작 시 기본 코인 제공
  if (typeof addComputerCoins === 'function') {
    addComputerCoins(2);
  }
  
  // UI 업데이트
  updateUI();
  
  // 컴퓨터 턴 실행
  setTimeout(() => {
    if (typeof computerTurn === 'function') {
      computerTurn();
    } else {
      console.warn('컴퓨터 턴 함수를 찾을 수 없습니다.');
      startPlayerTurn();
    }
  }, 1500);
}

/**
 * 플레이어 손패 렌더링
 */
function renderPlayerHand() {
  const playerHand = document.getElementById('player-hand');
  if (!playerHand) return;

  // 기존 카드 제거
  playerHand.innerHTML = '';

  // 손패 카드 렌더링
  gameState.playerHand.forEach(card => {
    const cardElement = createCardElement(card);
    playerHand.appendChild(cardElement);
  });

  // 기존 핸들러 제거 (중복 방지)
  playerHand.removeEventListener('click', handleHandCardClick);
  // 손패 카드 클릭 이벤트 리스너 (이벤트 위임)
  playerHand.addEventListener('click', handleHandCardClick);
}

/**
 * 손패 카드 클릭 핸들러
 * @param {Event} e - 클릭 이벤트
 */
function handleHandCardClick(e) {
  const clickedCardElement = e.target.closest('.card');
  if (!clickedCardElement) return; // 카드가 아닌 영역 클릭 시 무시

  const cardId = clickedCardElement.getAttribute('data-card-id');
  const playerHand = document.getElementById('player-hand');

  // 이미 선택된 카드인지 확인
  const isSelected = clickedCardElement.classList.contains('selected-in-hand');

  // 모든 손패 카드의 선택 효과 제거
  playerHand.querySelectorAll('.card.selected-in-hand').forEach(card => {
    card.classList.remove('selected-in-hand');
    // 필요시 추가 스타일 제거 (예: 테두리)
    card.classList.remove('ring-4', 'ring-yellow-400');
  });

  // 다른 카드를 클릭했거나, 아무것도 선택되지 않았던 경우
  if (!isSelected) {
    clickedCardElement.classList.add('selected-in-hand');
    // 선택 시각 효과 추가 (예: 테두리)
    clickedCardElement.classList.add('ring-4', 'ring-yellow-400');
    gameState.selectedCardId = cardId;
    console.log('선택된 카드 ID:', cardId);
  } else {
    // 같은 카드를 다시 클릭한 경우 선택 해제
    gameState.selectedCardId = null;
    console.log('카드 선택 해제');
  }
}

/**
 * 카드 요소 생성
 * @param {Object} card - 카드 데이터
 * @returns {HTMLElement} - 생성된 카드 엘리먼트
 */
function createCardElement(card) {
  // 카드 컨테이너 생성
  const cardElement = document.createElement('div');
  cardElement.className = `card element-card ${card.color || 'bg-gray-500'} card-${card.rarity || 'common'} p-2 rounded-lg shadow-lg w-28 cursor-pointer relative`; // Added relative positioning
  cardElement.setAttribute('data-card-id', card.id);
  cardElement.setAttribute('data-element', card.symbol);

  // 카드 내용 생성
  const cardContent = `
      <div class="text-center font-bold text-lg">${card.symbol}</div>
      <div class="text-center text-sm mb-1">${card.name}</div>
      <div class="element-number text-xs absolute top-1 left-2 opacity-70">${card.number || ''}</div>
      <div class="flex justify-between text-sm mt-1">
          <div class="attack">⚔️ ${card.power || card.baseAtk}</div>
          <div class="health">❤️ ${card.health || card.baseHp}</div>
      </div>
      <div class="element-rank absolute bottom-1 left-2 rank-${card.rarity || 'common'}">${getRarityStars(card.rarity)}</div>
  `;
  cardElement.innerHTML = cardContent;

  // 특수 능력 아이콘 (기존과 동일)
  // ...

  // --- Info Button ---
  const infoButton = document.createElement('button');
  infoButton.className = 'card-info-button absolute bottom-1 right-1 w-5 h-5 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold z-10';
  infoButton.innerHTML = 'ℹ️';
  infoButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card selection when clicking the button
      showCardDetail(card);
  });
  cardElement.appendChild(infoButton);

  return cardElement;
}

/**
 * 컴퓨터 손패 렌더링
 * 시각적으로 표시할 필요 없이 내부 데이터만 관리
 */
function renderComputerHand() {
  if (!window.gameState) return;
  
  // 컴퓨터 손패 개수 표시 (필요한 경우)
  const computerHandCount = document.getElementById('computer-hand-count');
  if (computerHandCount) {
    computerHandCount.textContent = gameState.computerHand.length;
  }
  
  // 콘솔에 로그 (디버깅용)
  console.log(`컴퓨터 손패: ${gameState.computerHand.length}장`);
}

/**
 * 손패에 카드 추가
 * @param {Object} card - 추가할 카드
 * @param {string} side - 'player' 또는 'computer'
 */
function addCardToHand(card, side) {
  if (!window.gameState) return;
  
  if (side === 'player') {
    gameState.playerHand.push(card);
  } else if (side === 'computer') {
    gameState.computerHand.push(card);
  }
}

/**
 * UI 업데이트
 */
function updateUI() {
  renderPlayerHand();
  renderComputerHand();
  updateTurnIndicator();
  updateCoinDisplay();
  if (typeof updateComputerCoinDisplay === 'function') {
    updateComputerCoinDisplay();
  }
}

/**
 * 점수 표시 업데이트
 */
function updateScoreDisplay() {
  if (!window.gameState) return;
  
  const playerScoreElement = document.getElementById('player-score');
  const computerScoreElement = document.getElementById('computer-score');
  
  if (playerScoreElement) {
    playerScoreElement.textContent = gameState.playerScore;
  }
  
  if (computerScoreElement) {
    computerScoreElement.textContent = gameState.computerScore;
  }
}

/**
 * 턴 표시기 업데이트
 */
function updateTurnIndicator() {
  if (!window.gameState) return;
  
  const resultMessage = document.getElementById('result-message');
  if (!resultMessage) return;
  
  if (gameState.isPlayerTurn) {
    resultMessage.textContent = `${gameState.turnCount}턴: 플레이어 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-blue-400';
  } else {
    resultMessage.textContent = `${gameState.turnCount}턴: 컴퓨터 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-red-400';
  }
}

/**
 * 손패 순서 업데이트
 */
function updateHandOrder() {
  // 현재 손패 UI에서 카드 ID 가져오기
  const handContainer = document.getElementById('player-hand');
  if (!handContainer || !window.gameState) return;
  
  const cardElements = Array.from(handContainer.querySelectorAll('.card'));
  const cardIds = cardElements.map(card => card.getAttribute('data-card-id'));
  
  // 게임 상태의 손패를 새 순서에 맞게 재정렬
  const newHandOrder = [];
  cardIds.forEach(id => {
    const card = gameState.playerHand.find(c => c.id === id);
    if (card) {
      newHandOrder.push(card);
    }
  });
  
  // 손패 업데이트
  gameState.playerHand = newHandOrder;
}

/**
 * 희귀도에 따른 텍스트 색상 클래스 반환
 * @param {string} rarity - 희귀도
 * @returns {string} - 색상 클래스
 */
function getRarityTextColor(rarity) {
  const colors = {
    common: 'text-gray-300',
    uncommon: 'text-green-300',
    rare: 'text-blue-300',
    epic: 'text-purple-300',
    legendary: 'text-yellow-300'
  };
  
  return colors[rarity] || colors.common;
}

/**
 * 카드 상세 정보 모달 표시
 * @param {Object} card - 카드 데이터
 */
function showCardDetailModal(card) {
  if (!card || !card.element) return;
  
  const modalContent = document.getElementById('modal-content');
  if (!modalContent) return;
  
  // 모달 내용 생성
  let content = `
    <div class="text-center mb-4">
      <div class="inline-block ${card.color || card.element.color || 'bg-gray-500'} w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2">${card.element.symbol}</div>
      <h3 class="text-xl font-bold">${card.element.name} (${card.element.englishName || card.element.name})</h3>
      <div class="text-sm text-gray-400">원자번호: ${card.element.number || '?'} | 원자량: ${card.element.atomicWeight || '?'}</div>
      <div class="mt-1 ${getRarityTextColor(card.rarity)}">${getRarityStars(card.rarity)}</div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-blue-400 font-bold mb-1">분류</h4>
      <p>${card.element.category || '미분류'}</p>
    </div>
    
    <div class="mb-4">
      <h4 class="text-blue-400 font-bold mb-1">설명</h4>
      <p>${card.element.description || '설명 없음'}</p>
    </div>
    
    <div class="stats grid grid-cols-2 gap-4 mb-4">
      <div>
        <h4 class="text-blue-400 font-bold mb-1">공격력</h4>
        <div class="text-xl font-bold">${card.power || card.atk || card.baseAtk || '?'}</div>
      </div>
      <div>
        <h4 class="text-blue-400 font-bold mb-1">체력</h4>
        <div class="text-xl font-bold">${card.health || card.hp || card.baseHp || '?'}</div>
      </div>
    </div>
  `;
  
  // 특수 능력이 있는 경우 추가
  if (card.element.specialAbility || card.specialAbility) {
    content += `
      <div class="mb-4">
        <h4 class="text-blue-400 font-bold mb-1">특수 능력</h4>
        <p>${card.element.specialAbility || card.specialAbility}</p>
      </div>
    `;
  }
  
  // 모달에 내용 설정
  modalContent.innerHTML = content;
  
  // 모달 표시
  const modal = document.getElementById('card-detail-modal');
  if (modal) modal.classList.remove('hidden');
}

/**
 * 카드 랜덤 생성 (희귀도 기반)
 * @param {string} drawType - 뽑기 유형
 * @returns {Object} - 생성된 카드
 */
function createRandomCardByRarity(drawType) {
  // 게임 상태에서 확률 정보 가져오기
  const rarityChances = gameState.rarityChances?.[drawType] || {
    common: 70, 
    uncommon: 25, 
    rare: 4, 
    epic: 1, 
    legendary: 0
  };
  
  // 랜덤 희귀도 선택
  const rarity = selectRandomRarity(rarityChances);
  
  // 카드 생성 함수 호출
  return typeof createCardWithRarity === 'function' ? 
    createCardWithRarity(rarity) : 
    createBasicCard(rarity);
}

/**
 * 확률에 따른 랜덤 희귀도 선택
 * @param {Object} rarityChances - 희귀도별 확률
 * @returns {string} - 선택된 희귀도
 */
function selectRandomRarity(rarityChances) {
  const totalChance = Object.values(rarityChances).reduce((sum, chance) => sum + chance, 0);
  let randomValue = Math.random() * totalChance;
  
  for (const [rarity, chance] of Object.entries(rarityChances)) {
    if (randomValue < chance) {
      return rarity;
    }
    randomValue -= chance;
  }
  
  // 기본값 반환
  return 'common';
}

/**
 * 기본 카드 생성 (대체용)
 * @param {string} rarity - 희귀도
 * @returns {Object} - 카드 객체
 */
function createBasicCard(rarity) {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    element: {
      number: 0,
      symbol: '?',
      name: '미확인 원소',
      englishName: 'Unknown Element',
      category: '기타',
      atomicWeight: 0
    },
    baseAtk: 3,
    baseHp: 5,
    power: 3,
    health: 5,
    level: 1,
    rarity: rarity,
    color: 'bg-gray-500'
  };
}

// 전역 노출
window.initUI = initUI;
window.renderPlayerHand = renderPlayerHand;
window.renderComputerHand = renderComputerHand;
window.updateScoreDisplay = updateScoreDisplay;
window.updateTurnIndicator = updateTurnIndicator;
window.updateUI = updateUI;
window.showCardDetailModal = showCardDetailModal;
window.handleBasicDraw = handleBasicDraw;
window.handlePremiumDraw = handlePremiumDraw;
window.handleLegendDraw = handleLegendDraw;
window.endTurn = endTurn;
window.createRandomCardByRarity = createRandomCardByRarity;
window.addCardToHand = addCardToHand;