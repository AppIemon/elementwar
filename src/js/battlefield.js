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
 * 전투 필드 관련 기능
 */

// 배틀필드 초기화
function initBattlefield() {
  console.log('배틀필드를 초기화합니다.');
  
  // 모든 슬롯 이벤트 리스너 설정
  document.querySelectorAll('.lane-slot').forEach(slot => {
    slot.addEventListener('click', handleSlotClick);
  });
  
  console.log('배틀필드 초기화 완료!');
}

/**
 * 슬롯 클릭 처리
 * @param {Event} e - 클릭 이벤트
 */
function handleSlotClick(e) {
  const slot = e.currentTarget;
  const card = slot.querySelector('.card');
  
  // 카드가 없으면 무시
  if (!card) return;
  
  // 플레이어 카드인지 확인
  const isPlayerSlot = slot.classList.contains('player-slot');
  const isPlayerTurn = window.gameState && window.gameState.playerTurn;
  
  // 플레이어 카드 처리
  if (isPlayerSlot) {
    // 전투 중이면 카드 상세 정보만 표시
    if (window.gameState && window.gameState.battleInProgress) {
      showCardDetail(card);
    } 
    // 플레이어 턴일 때만 강화 가능
    else if (isPlayerTurn) {
      // 카드가 분자인지 확인
      const isMolecule = card.classList.contains('molecule-card');
      
      // 분자 카드는 상세 정보만, 일반 카드는 강화 모달
      if (isMolecule && typeof window.showMoleculeDetail === 'function') {
        window.showMoleculeDetail(card);
      } else if (typeof window.showUpgradeModal === 'function') {
        window.showUpgradeModal(card);
      }
    } 
    // 플레이어 턴이 아니면 상세 정보만 표시
    else if (typeof window.showCardDetail === 'function') {
      window.showCardDetail(card);
    }
  } 
  // 컴퓨터 카드는 상세 정보만 표시 (턴/전투 상태 관계없이)
  else if (slot.classList.contains('computer-slot') && typeof window.showCardDetail === 'function') {
    window.showCardDetail(card);
  }
}

/**
 * 카드 상세 정보 표시 (window.showCardDetail이 없는 경우를 위한 폴백 함수)
 * @param {HTMLElement} card - 카드 요소
 */
function showCardDetail(card) {
  if (typeof window.showCardDetail === 'function') {
    window.showCardDetail(card);
  } else {
    console.log('카드 정보:', card.getAttribute('data-element'));
  }
}

/**
 * 배틀필드 리셋 - 모든 카드 제거
 */
function resetBattlefield() {
  console.log('배틀필드를 리셋합니다.');
  
  // 모든 레인의 카드 제거
  document.querySelectorAll('.battlefield-lane').forEach((lane) => {
    // 플레이어 슬롯 비우기
    const playerSlot = lane.querySelector('.player-slot');
    while (playerSlot && playerSlot.firstChild) {
      playerSlot.removeChild(playerSlot.firstChild);
    }
    
    // 컴퓨터 슬롯 비우기
    const computerSlot = lane.querySelector('.computer-slot');
    while (computerSlot && computerSlot.firstChild) {
      computerSlot.removeChild(computerSlot.firstChild);
    }
  });
  
  // 기지 체력 리셋
  const playerBaseHP = document.getElementById('player-base-hp');
  const playerBaseHPBar = document.getElementById('player-base-hp-bar');
  if (playerBaseHP) playerBaseHP.textContent = '100';
  if (playerBaseHPBar) playerBaseHPBar.style.width = '100%';
  
  const computerBaseHP = document.getElementById('computer-base-hp');
  const computerBaseHPBar = document.getElementById('computer-base-hp-bar');
  if (computerBaseHP) computerBaseHP.textContent = '100';
  if (computerBaseHPBar) computerBaseHPBar.style.width = '100%';
  
  console.log('배틀필드 리셋 완료!');
}

/**
 * 슬롯에서 화학 반응 확인
 * @param {HTMLElement} slot - 반응을 확인할 슬롯
 */
function checkChemicalReactions(slot) {
  if (!slot) return false;
  
  // 슬롯의 모든 원소 카드 가져오기 (분자 카드 제외)
  const elementCards = Array.from(slot.querySelectorAll('.card:not(.molecule-card)'));
  
  // 카드가 2장 미만이면 반응할 수 없음
  if (elementCards.length < 2) return false;
  
  // 카드에서 원소 심볼 추출
  const elements = elementCards.map(card => 
    card.getAttribute('data-element')
  ).filter(Boolean);
  
  // 원소 심볼이 충분하지 않으면 반응 불가
  if (elements.length < 2) return false;
  
  // 반응 가능성 확인
  if (canReactionOccur(elements)) {
    // 반응 실행 (이미 구현된 checkForReactions 함수 사용)
    return window.checkForReactions ? window.checkForReactions(slot) : false;
  }
  
  return false;
}

/**
 * 주어진 원소들로 반응이 가능한지 확인
 * @param {Array} elements - 원소 심볼 배열
 * @returns {boolean} - 반응 가능 여부
 */
function canReactionOccur(elements) {
  if (!elements || elements.length < 2) return false;
  
  // 전역 반응 데이터가 있는 경우
  if (window.REACTIONS_DATA && window.REACTIONS_DATA.length > 0) {
    // 반응 데이터의 원소 번호를 심볼로 변환해서 확인
    for (const reaction of window.REACTIONS_DATA) {
      // 원소 번호 배열을 심볼 배열로 변환
      const reactantSymbols = convertElementNumbersToSymbols(reaction.elements);
      
      // 모든 반응물이 있는지 확인
      if (hasAllElements(elements, reactantSymbols)) {
        return true;
      }
    }
  } else if (window.findMatchingReaction) {
    // findMatchingReaction 함수가 있으면 그것을 사용
    return window.findMatchingReaction(elements) !== null;
  }
  
  return false;
}

/**
 * 원소 번호 배열을 심볼 배열로 변환
 * @param {Array} elementNumbers - 원소 번호 배열
 * @returns {Array} - 원소 심볼 배열
 */
function convertElementNumbersToSymbols(elementNumbers) {
  if (!elementNumbers || !window.ELEMENTS_DATA) return [];
  
  return elementNumbers.map(num => {
    const element = window.ELEMENTS_DATA.find(e => e.number === num);
    return element ? element.symbol : null;
  }).filter(Boolean);
}

/**
 * 모든 필요 원소가 있는지 확인
 * @param {Array} availableElements - 가지고 있는 원소 배열
 * @param {Array} requiredElements - 필요한 원소 배열
 * @returns {boolean} - 모든 필요 원소가 있는지 여부
 */
function hasAllElements(availableElements, requiredElements) {
  // 복사본 생성 (원본 배열을 수정하지 않기 위해)
  const availableCopy = [...availableElements];
  
  // 모든 필요 원소가 있는지 확인
  return requiredElements.every(element => {
    const index = availableCopy.indexOf(element);
    if (index !== -1) {
      availableCopy.splice(index, 1); // 사용한 원소 제거
      return true;
    }
    return false;
  });
}

// 전역에 필요한 함수들을 노출
window.initBattlefield = initBattlefield;
window.resetBattlefield = resetBattlefield;
window.checkChemicalReactions = checkChemicalReactions;
window.canReactionOccur = canReactionOccur;
window.convertElementNumbersToSymbols = convertElementNumbersToSymbols;
window.hasAllElements = hasAllElements;
