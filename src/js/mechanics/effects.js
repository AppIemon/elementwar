/**
 * 카드 효과 관련 기능
 */

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
    'corrode': '💧',
    'boost_health': '💪',
    'boost_attack': '⚔️',
    'damage_over_time': '⏱️',
    'explosive': '💣'
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
    'corrode': `부식: 방어력 무시 ${card.effectValue} 피해`,
    'boost_health': `체력 강화: ${card.effectValue} 체력 증가`,
    'boost_attack': `공격력 강화: ${card.effectValue} 공격력 증가`,
    'damage_over_time': `지속 피해: ${card.effectDuration || 2}턴간 ${card.effectValue} 피해`,
    'explosive': `폭발: ${card.effectValue || 3} 범위 피해`
  };
  
  return descriptions[card.effectType] || '특수 효과';
}

/**
 * 효과 체크 및 적용 (턴 시작 또는 종료 시)
 * @param {string} timing - 'start' 또는 'end'
 */
function applyCardEffects(timing) {
  const allCards = document.querySelectorAll('.card[data-effect-type]');
  
  allCards.forEach(card => {
    const effectType = card.getAttribute('data-effect-type');
    const effectValue = parseInt(card.getAttribute('data-effect-value')) || 0;
    
    // 효과 지속시간이 있으면 감소
    if (card.hasAttribute('data-effect-duration')) {
      let duration = parseInt(card.getAttribute('data-effect-duration'));
      if (timing === 'end' && duration > 0) {
        duration--;
        card.setAttribute('data-effect-duration', duration);
        
        // 지속시간이 끝나면 효과 제거
        if (duration <= 0) {
          card.removeAttribute('data-effect-type');
          card.removeAttribute('data-effect-value');
          card.removeAttribute('data-effect-duration');
          
          // 효과 종료 시각 효과
          card.classList.add('effect-end');
          setTimeout(() => {
            card.classList.remove('effect-end');
          }, 1000);
        }
      }
    }
    
    // 효과 적용 (효과 종류와 타이밍에 따라)
    if (effectType === 'poison' && timing === 'end') {
      // 중독 피해 적용
      const cardObj = getCardObjectFromElement(card);
      if (cardObj) {
        cardObj.hp = Math.max(0, cardObj.hp - effectValue);
        updateCardDisplay(card, cardObj);
      }
    }
    // 다른 효과 타입에 대한 처리 추가
    
  });
}

/**
 * 카드 요소에서 카드 객체 찾기 (내부 함수)
 * @param {HTMLElement} cardElement - 카드 DOM 요소
 * @returns {Object|null} - 카드 객체
 */
function getCardObjectFromElement(cardElement) {
  const cardId = cardElement.getAttribute('data-card-id');
  if (!cardId) return null;
  
  // 카드가 어느 레인에 있는지 찾기
  const laneElement = cardElement.closest('.battlefield-lane');
  if (!laneElement) return null;
  
  const laneIndex = parseInt(laneElement.id.replace('lane-', ''));
  const isPlayerCard = cardElement.closest('.player-slot') !== null;
  
  // battlefield 객체에서 카드 찾기
  const side = isPlayerCard ? 'player' : 'computer';
  return battlefield.lanes[laneIndex]?.[side] || null;
}

/**
 * 카드 디스플레이 업데이트 (내부 함수)
 * @param {HTMLElement} cardElement - 카드 DOM 요소
 * @param {Object} cardObject - 카드 객체
 */
function updateCardDisplay(cardElement, cardObject) {
  if (!cardElement || !cardObject) return;
  
  // 체력 표시 업데이트
  const healthDisplay = cardElement.querySelector('div:last-child div:last-child');
  if (healthDisplay) {
    healthDisplay.textContent = `❤️ ${cardObject.hp}`;
  }
  
  // 공격력 표시 업데이트
  const attackDisplay = cardElement.querySelector('div:last-child div:first-child');
  if (attackDisplay) {
    attackDisplay.textContent = `⚔️ ${cardObject.atk}`;
  }
  
  // 체력 속성 업데이트
  cardElement.setAttribute('data-health', cardObject.hp);
  
  // 체력이 0이하면 파괴 효과
  if (cardObject.hp <= 0) {
    cardElement.classList.add('destroyed');
    
    // 실제 파괴는 전투 모듈에서 처리
  }
}

// 전역으로 함수 노출
window.checkCardHealing = checkCardHealing;
window.healCard = healCard;
window.applyHealingToAdjacentCards = applyHealingToAdjacentCards;
window.getEffectIcon = getEffectIcon;
window.getEffectText = getEffectText;
window.applyCardEffects = applyCardEffects;
