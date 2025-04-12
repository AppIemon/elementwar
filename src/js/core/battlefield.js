/**
 * 전투 필드 관련 기능
 */

// 배틀필드 객체
const battlefield = {
  lanes: [
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null }
  ],
  
  bases: {
    player: {
      maxHp: 100,
      hp: 100
    },
    computer: {
      maxHp: 100,
      hp: 100
    }
  }
};

/**
 * 배틀필드 초기화
 */
function initBattlefield() {
  console.log('배틀필드를 초기화합니다.');
  
  // 배틀필드 상태 리셋
  resetBattlefield();
  
  // 슬롯 이벤트 리스너 설정
  setupSlotEventListeners();
  
  console.log('배틀필드 초기화 완료!');
}

/**
 * 배틀필드 리셋
 */
function resetBattlefield() {
  // 모든 레인 초기화
  battlefield.lanes.forEach((lane, index) => {
    lane.player = null;
    lane.computer = null;
  });
  
  // 기지 체력 초기화
  battlefield.bases.player.hp = battlefield.bases.player.maxHp;
  battlefield.bases.computer.hp = battlefield.bases.computer.maxHp;
  
  // 전투 필드 시각적 리셋
  resetBattlefieldDisplay();
}

/**
 * 배틀필드 표시 리셋
 */
function resetBattlefieldDisplay() {
  // 모든 카드 슬롯 비우기
  document.querySelectorAll('.lane-slot').forEach(slot => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild);
    }
  });
  
  // 기지 체력 UI 업데이트
  updateBaseDisplay('player');
  updateBaseDisplay('computer');
}

/**
 * 슬롯 이벤트 리스너 설정
 */
function setupSlotEventListeners() {
  // 모든 플레이어 슬롯에 클릭 이벤트 리스너 추가
  document.querySelectorAll('.player-slot').forEach((slot, index) => {
    // 기존 이벤트 리스너 제거 (중복 방지)
    slot.removeEventListener('contextmenu', handlePlayerSlotRightClick); // 우클릭 제거
    slot.removeEventListener('click', handlePlayerSlotClick); // 기존 클릭 제거

    // 새 클릭 이벤트 리스너 추가
    slot.addEventListener('click', handlePlayerSlotClick);
    slot.setAttribute('data-lane-index', index); // 인덱스 설정 확인
  });
}

/**
 * 플레이어 슬롯 클릭 처리 (카드 배치 또는 기존 카드 상호작용)
 * @param {Event} e - 클릭 이벤트
 */
function handlePlayerSlotClick(e) {
    const slot = e.currentTarget;
    const laneIndex = parseInt(slot.getAttribute('data-lane-index'));
    if (isNaN(laneIndex)) {
        console.error("Invalid lane index on slot:", slot);
        return;
    }

    // 1. 손패에서 카드가 선택된 경우 -> 배치 시도
    if (gameState && gameState.isPlayerTurn && gameState.selectedCardId) {
        const selectedCard = gameState.playerHand.find(card => card.id === gameState.selectedCardId);

        if (selectedCard) {
            console.log(`카드 ${selectedCard.id}(${selectedCard.element.symbol})를 레인 ${laneIndex}에 배치 시도 (클릭)`);

            // 카드 배치 시도 (placeCardOnField는 game.js 또는 다른 곳에 있을 수 있음)
            const success = typeof placeCardOnBattlefield === 'function'
                ? placeCardOnBattlefield(selectedCard, laneIndex, 'player')
                : false; // placeCardOnField 함수 확인 필요

            if (success) {
                // 배치 성공 시 손패에서 카드 제거 및 선택 해제
                removeCardFromHand(selectedCard.id, 'player'); // game.js 함수 호출 필요
                gameState.selectedCardId = null;

                // 손패에서 선택 효과 제거 (ui.js 또는 game.js에서 처리)
                const playerHand = document.getElementById('player-hand');
                if (playerHand) {
                    playerHand.querySelectorAll('.card.selected-in-hand').forEach(cardEl => {
                        cardEl.classList.remove('selected-in-hand', 'ring-4', 'ring-yellow-400');
                    });
                }
                // UI 업데이트는 placeCardOnBattlefield 내부 또는 여기서 호출
                // renderPlayerHand(); // placeCardOnBattlefield에서 호출될 수 있음
                // renderBattlefield(); // placeCardOnBattlefield에서 호출될 수 있음
            } else {
                console.log(`레인 ${laneIndex}에 카드 배치 실패`);
                // 실패 시 선택 유지 또는 해제 (정책에 따라)
                // gameState.selectedCardId = null; // 실패 시 해제하려면 주석 해제
            }
        } else {
            console.log('선택된 카드 ID는 있으나 손패에서 카드를 찾을 수 없음:', gameState.selectedCardId);
            gameState.selectedCardId = null; // 상태 초기화
        }
    }
    // 2. 손패 카드가 선택되지 *않았고*, 슬롯에 *내 카드*가 있는 경우 -> 기존 카드 상호작용 (강화 등)
    else if (gameState && gameState.isPlayerTurn && !gameState.selectedCardId) {
        const cardElement = slot.querySelector('.card.player-card:not(.skull-card)'); // 플레이어 카드이고 해골이 아닌 경우
        if (cardElement) {
            const cardId = cardElement.getAttribute('data-card-id');
            const cardData = battlefield.lanes[laneIndex]?.player;

            if (cardData && cardData.id === cardId) {
                console.log(`레인 ${laneIndex}의 기존 카드 클릭됨: ${cardData.element.name}`);
                // 카드 강화 모달 표시 또는 정보 표시
                if (typeof showCardUpgradeModal === 'function') {
                    showCardUpgradeModal(cardData, laneIndex, 'player');
                } else if (typeof showCardDetail === 'function') {
                    showCardDetail(cardData); // 강화 모달 없으면 상세 정보
                }
            }
        } else {
             console.log(`레인 ${laneIndex} 클릭: 배치할 카드 선택 안됨 / 슬롯에 상호작용할 내 카드 없음`);
        }
    } else if (gameState && !gameState.isPlayerTurn) {
        console.log('플레이어 턴이 아닙니다.');
    }
}

/**
 * 기지 표시 업데이트
 * @param {string} side - 'player' 또는 'computer'
 */
function updateBaseDisplay(side) {
  // hp가 정의되지 않았거나 숫자가 아닌 경우 처리
  const base = battlefield.bases[side];
  if (!base) return;

  let displayHP = base.hp;
  if (displayHP === undefined || isNaN(displayHP)) {
    console.error(`${side} 기지 체력 값이 유효하지 않습니다: ${displayHP}`);
    // 기본값으로 복구
    displayHP = base.maxHp || 100;
  }
  
  // 유효한 체력값인지 확인 (음수 방지)
  displayHP = Math.max(0, displayHP);
  
  // 최대 체력
  const maxHP = base.maxHp;
  
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
      
      // 원래 색상으로 복원
      if (side === 'player') {
        barElement.classList.add('bg-blue-500');
      } else {
        barElement.classList.add('bg-red-500');
      }
    }
  }
}

// 전역 노출
window.battlefield = battlefield;
window.initBattlefield = initBattlefield;
window.resetBattlefield = resetBattlefield;
window.updateBaseDisplay = updateBaseDisplay;
