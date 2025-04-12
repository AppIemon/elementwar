// 카드 배치를 위한 클릭 방식 초기화
function initDragAndDrop() {
  const playerHand = document.getElementById('player-hand');
  
  // 손패 영역에 클릭 이벤트 추가
  playerHand.addEventListener('click', handleCardClick);
  
  // 플레이어 슬롯에 클릭 이벤트 추가
  document.querySelectorAll('.player-slot').forEach(slot => {
    slot.addEventListener('click', handleSlotClick);
  });
  
  // 배경 클릭 시 카드 선택 취소
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.card') && !e.target.closest('.player-slot')) {
      clearCardSelection();
    }
  });
}

// 현재 선택된 카드
let selectedCardElement = null;

function handleCardClick(e) {
  if (!gameState.isPlayerTurn) return;
  
  const cardElement = e.target.closest('.card');
  if (!cardElement) return;
  
  // 이미 선택된 카드가 있으면 선택 해제
  if (selectedCardElement) {
    selectedCardElement.classList.remove('card-selected');
  }
  
  // 같은 카드를 다시 클릭하면 선택 취소
  if (selectedCardElement === cardElement) {
    selectedCardElement = null;
    document.querySelectorAll('.player-slot').forEach(slot => {
      slot.classList.remove('slot-highlighted');
    });
    return;
  }
  
  // 새 카드 선택
  selectedCardElement = cardElement;
  cardElement.classList.add('card-selected');
  
  // 배치 가능한 슬롯 하이라이트
  document.querySelectorAll('.player-slot').forEach(slot => {
    slot.classList.add('slot-highlighted');
  });
}

function handleSlotClick(e) {
  if (!gameState.isPlayerTurn || !selectedCardElement) return;
  
  const cardId = selectedCardElement.getAttribute('data-card-id');
  const cardInfo = findCardInHand(cardId);
  
  if (!cardInfo || cardInfo.side !== 'player') return;
  
  const laneElement = e.currentTarget.closest('.battlefield-lane');
  if (!laneElement) return;
  
  const laneIndex = parseInt(laneElement.id.split('-')[1]);
  
  // 카드 배치 처리
  if (placeCardOnBattlefield(cardInfo.card, laneIndex, 'player')) {
    removeCardFromHand(cardId, 'player');
    renderPlayerHand();
    
    const elementName = cardInfo.card.element.name;
    const elementSymbol = cardInfo.card.element.symbol;
    showMessage(`${elementName}(${elementSymbol}) 카드를 ${laneIndex + 1}번 레인에 배치했습니다.`, 'success');
  }
  
  // 선택 상태 초기화
  clearCardSelection();
}

function clearCardSelection() {
  if (selectedCardElement) {
    selectedCardElement.classList.remove('card-selected');
    selectedCardElement = null;
  }
  
  document.querySelectorAll('.player-slot').forEach(slot => {
    slot.classList.remove('slot-highlighted');
  });
}
