/**
 * 전투 필드 렌더링 관련 기능
 */

/**
 * 전체 전장 렌더링
 */
function renderBattlefield() {
  if (!window.battlefield) return;
  
  // 각 레인 렌더링
  for (let i = 0; i < battlefield.lanes.length; i++) {
    renderLane(i);
  }
  
  // 기지 체력 업데이트
  updateBaseHealth();
}

/**
 * 특정 레인 렌더링
 * @param {number} laneIndex - 렌더링할 레인 인덱스
 */
function renderLane(laneIndex) {
  const laneElement = document.getElementById(`lane-${laneIndex}`);
  if (!laneElement || !window.battlefield) return;
  
  const lane = battlefield.lanes[laneIndex];
  if (!lane) return;
  
  // 플레이어 슬롯 렌더링
  const playerSlot = laneElement.querySelector('.player-slot');
  if (playerSlot) {
    // 기존 카드 제거
    while (playerSlot.firstChild) {
      playerSlot.removeChild(playerSlot.firstChild);
    }
    
    // 카드가 있으면 렌더링
    if (lane.player) {
      const cardElement = createCardElement(lane.player, 'player');
      playerSlot.appendChild(cardElement);
    }
  }
  
  // 컴퓨터 슬롯 렌더링
  const computerSlot = laneElement.querySelector('.computer-slot');
  if (computerSlot) {
    // 기존 카드 제거
    while (computerSlot.firstChild) {
      computerSlot.removeChild(computerSlot.firstChild);
    }
    
    // 카드가 있으면 렌더링
    if (lane.computer) {
      const cardElement = createCardElement(lane.computer, 'computer');
      computerSlot.appendChild(cardElement);
    }
  }
}

/**
 * 카드 요소 생성
 * @param {Object} card - 카드 데이터
 * @param {string} side - 'player' 또는 'computer'
 * @returns {HTMLElement} - 카드 DOM 요소
 */
function createCardElement(card, side) {
  const cardElement = document.createElement('div');
  
  if (!card || card.isSkull) {
    cardElement.className = 'skull bg-gray-800 p-2 rounded-lg shadow-lg w-24 h-32 flex items-center justify-center';
    cardElement.innerHTML = '<span class="text-4xl">💀</span>';
    return cardElement;
  }
  
  const isMolecule = card.isMolecule || card.formula;
  const symbolText = isMolecule ? (card.formula || '??') : (card.element?.symbol || '?');
  const nameText = isMolecule ? (card.name || '분자') : (card.element?.name || '원소');
  
  cardElement.className = `card ${isMolecule ? 'molecule-card' : ''} ${card.color || 'bg-gray-500'} p-2 rounded-lg shadow-lg w-full h-full`;
  cardElement.setAttribute('data-card-id', card.id || '');
  cardElement.setAttribute('data-element', symbolText);
  cardElement.setAttribute('data-power', card.power || card.atk || 0);
  cardElement.setAttribute('data-health', card.health || card.hp || 0);
  
  // 카드 내용
  cardElement.innerHTML = `
    <div class="text-center font-bold">${symbolText}</div>
    <div class="text-center text-sm">${nameText}</div>
    <div class="flex justify-between text-sm mt-1">
      <div>⚔️ ${card.power || card.atk || 0}</div>
      <div>❤️ ${card.health || card.hp || 0}${card.maxHealth || card.maxHp ? `/${card.maxHealth || card.maxHp}` : ''}</div>
    </div>
    <div class="element-rank absolute bottom-1 left-2 rank-${card.rarity || 'common'}">${getRarityStars(card.rarity || 'common')}</div>
  `;
  
  // 효과 아이콘 추가
  if (card.effect || card.effectType) {
    const effectType = card.effect?.type || card.effectType;
    if (effectType) {
      const icons = {
        'heal': '💖',
        'damage': '💥',
        'poison': '☠️',
        'burn': '🔥',
        'freeze': '❄️',
        'defense': '🛡️',
        'boost': '⚡'
      };
      
      const icon = icons[effectType] || '✨';
      
      const effectIcon = document.createElement('div');
      effectIcon.className = 'special-ability absolute top-1 right-1 bg-yellow-500 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold';
      effectIcon.textContent = icon;
      
      cardElement.appendChild(effectIcon);
    }
  }
  
  // 상태 효과 표시
  if (card.effectType && card.effectDuration > 0) {
    const effectColors = {
      'poison': 'bg-green-900',
      'burn': 'bg-red-900',
      'freeze': 'bg-blue-900'
    };
    
    const bgColor = effectColors[card.effectType] || 'bg-purple-900';
    
    const statusEffect = document.createElement('div');
    statusEffect.className = `absolute bottom-1 right-1 ${bgColor} text-white text-xs px-1 rounded`;
    statusEffect.textContent = `${card.effectType} ${card.effectDuration}턴`;
    
    cardElement.appendChild(statusEffect);
  }
  
  // 플레이어 측 카드이면 클릭 이벤트 추가
  if (side === 'player') {
    cardElement.addEventListener('click', () => {
      // 카드 선택 및 업그레이드 기능
      if (window.gameState && window.gameState.isPlayerTurn) {
        const laneIndex = parseInt(cardElement.closest('.battlefield-lane').id.replace('lane-', ''));
        
        if (!isNaN(laneIndex) && typeof showCardUpgradeModal === 'function') {
          showCardUpgradeModal(card, laneIndex, 'player');
        }
      }
    });
  }
  
  return cardElement;
}

/**
 * 기지 체력 업데이트
 */
function updateBaseHealth() {
  if (!window.battlefield) return;
  
  // 플레이어 기지 체력
  const playerBaseHp = document.getElementById('player-base-hp');
  const playerBaseHpBar = document.getElementById('player-base-hp-bar');
  
  if (playerBaseHp && playerBaseHpBar) {
    const hp = battlefield.bases.player.hp;
    const maxHp = battlefield.bases.player.maxHp;
    
    playerBaseHp.textContent = Math.max(0, Math.floor(hp));
    playerBaseHpBar.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
    
    if (hp < maxHp * 0.3) {
      playerBaseHpBar.className = 'bg-red-500 h-2 rounded-full';
    } else if (hp < maxHp * 0.6) {
      playerBaseHpBar.className = 'bg-yellow-500 h-2 rounded-full';
    } else {
      playerBaseHpBar.className = 'bg-blue-500 h-2 rounded-full';
    }
  }
  
  // 컴퓨터 기지 체력
  const computerBaseHp = document.getElementById('computer-base-hp');
  const computerBaseHpBar = document.getElementById('computer-base-hp-bar');
  
  if (computerBaseHp && computerBaseHpBar) {
    const hp = battlefield.bases.computer.hp;
    const maxHp = battlefield.bases.computer.maxHp;
    
    computerBaseHp.textContent = Math.max(0, Math.floor(hp));
    computerBaseHpBar.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
    
    if (hp < maxHp * 0.3) {
      computerBaseHpBar.className = 'bg-red-500 h-2 rounded-full';
    } else if (hp < maxHp * 0.6) {
      computerBaseHpBar.className = 'bg-yellow-500 h-2 rounded-full';
    } else {
      computerBaseHpBar.className = 'bg-red-500 h-2 rounded-full';
    }
  }
}

// 전역 노출
window.renderBattlefield = renderBattlefield;
window.renderLane = renderLane;
window.createCardElement = createCardElement;
window.updateBaseHealth = updateBaseHealth;
