let battlefield = {
  lanes: [
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null },
    { player: null, computer: null }
  ],
  bases: {
    player: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) },
    computer: { hp: Math.pow(10, 20), maxHp: Math.pow(10, 20) }
  }
};

// 상성 시스템 함수들
function calculateAffinityDamage(attacker, defender) {
  let damageMultiplier = 1;
  
  if (attacker.affinities && defender.category) {
    // 강한 상성 체크
    if (attacker.affinities.strong_against && 
        attacker.affinities.strong_against.includes(defender.category)) {
      damageMultiplier *= 1.5;
    }
    
    // 약한 상성 체크
    if (attacker.affinities.weak_against && 
        attacker.affinities.weak_against.includes(defender.category)) {
      damageMultiplier *= 0.7;
    }
  }
  
  // 별 시스템 전투 보너스 적용
  if (attacker.starLevel && attacker.starLevel > 0) {
    const starBonus = 1 + (attacker.starLevel * 0.2); // 별 레벨당 20% 공격력 증가
    damageMultiplier *= starBonus;
  }
  
  return damageMultiplier;
}

function checkSynergy(card1, card2) {
  if (!card1.affinities || !card2.affinities) return false;
  
  const synergy1 = card1.affinities.synergy_with || [];
  const synergy2 = card2.affinities.synergy_with || [];
  
  return synergy1.some(type => synergy2.includes(type));
}

function applySynergyBonus(cards) {
  const bonuses = [];
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (checkSynergy(cards[i], cards[j])) {
        bonuses.push({
          cards: [cards[i], cards[j]],
          bonus: 1.2 // 20% 보너스
        });
      }
    }
  }
  
  return bonuses;
}

// 분자 생성 함수들 - molecules.js의 함수를 사용
function createMoleculeFromElements(element1, element2) {
  // molecules.js의 createMoleculeFromElements 함수를 호출
  if (typeof window.createMoleculeFromElements === 'function') {
    return window.createMoleculeFromElements(element1, element2);
  }
  
  console.error('[battlefield.js] createMoleculeFromElements function not found in molecules.js');
  return null;
}

function createMoleculeFromCombination(molecule1, molecule2) {
  // molecules.js의 synthesizeCards 함수를 사용
  if (typeof window.synthesizeCards === 'function') {
    return window.synthesizeCards(molecule1, molecule2);
  }
  
  console.error('[battlefield.js] synthesizeCards function not found in molecules.js');
  return null;
}

function createCardFromMolecule(moleculeData) {
  // molecules.js의 createCardFromMolecule 함수를 사용
  if (typeof window.createCardFromMolecule === 'function') {
    return window.createCardFromMolecule(moleculeData);
  }
  
  console.error('[battlefield.js] createCardFromMolecule function not found in molecules.js');
  return null;
}

// 교체된 카드를 생성하는 함수 (동일한 스탯으로)
function createReplacedCard(originalCard) {
  if (!originalCard) {
    console.error('[createReplacedCard] Original card is null or undefined');
    return null;
  }

  // 새로운 카드 객체 생성
  const replacedCard = new ElementCard(
    originalCard.element,
    originalCard.hp,
    originalCard.atk
  );

  // 모든 속성 복사
  replacedCard.maxHp = originalCard.maxHp;
  replacedCard.originalMaxHp = originalCard.originalMaxHp;
  replacedCard.maxAtk = originalCard.maxAtk;
  replacedCard.rarity = originalCard.rarity;
  replacedCard.upgradeLevel = originalCard.upgradeLevel;
  replacedCard.armor = originalCard.armor;
  replacedCard.lastDamageTurn = 0; // 손패로 돌아가므로 데미지 턴 초기화
  
  // 합성 관련 속성 복사
  replacedCard.isSynthesis = originalCard.isSynthesis;
  replacedCard.components = originalCard.components ? [...originalCard.components] : [];
  replacedCard.name = originalCard.name;
  replacedCard.moleculeId = originalCard.moleculeId;
  replacedCard.type = originalCard.type;
  replacedCard.symbol = originalCard.symbol;
  replacedCard.color = originalCard.color;
  replacedCard.elements = originalCard.elements ? [...originalCard.elements] : [];
  
  // 효과 복사 (깊은 복사)
  replacedCard.effects = originalCard.effects ? originalCard.effects.map(effect => ({ ...effect })) : [];
  
  // 특수 능력 복사
  if (originalCard.specialAbilities) {
    replacedCard.specialAbilities = [...originalCard.specialAbilities];
  }
  
  // 상성 정보 복사
  if (originalCard.affinities) {
    replacedCard.affinities = { ...originalCard.affinities };
  }
  
  // 시너지 보너스 초기화 (손패에서는 별도로 계산됨)
  replacedCard.synergyBonus = 1;
  
  // 반감기 정보 복사 (기존 반감기 진행 상태 유지)
  if (originalCard.halflife) {
    replacedCard.halflife = {
      maxTurns: originalCard.halflife.maxTurns,
      currentTurns: originalCard.halflife.currentTurns, // 기존 진행 상태 유지
      decayProducts: originalCard.halflife.decayProducts ? [...originalCard.halflife.decayProducts] : [],
      isStable: originalCard.halflife.isStable
    };
  }
  
  // 소유자 정보 초기화
  replacedCard.owner = null;
  
  // 온라인 대전 상대방 카드 표시 정보 복사
  if (originalCard && typeof originalCard === 'object' && originalCard.isOpponentCard !== undefined) {
    replacedCard.isOpponentCard = originalCard.isOpponentCard;
  }
  
  console.log(`[createReplacedCard] Created replaced card: ${replacedCard.name} (HP: ${replacedCard.hp}, ATK: ${replacedCard.atk})`);
  
  return replacedCard;
}

function updateBattlefieldSynergy() {
  // 전장의 모든 카드 수집
  const allCards = [];
  battlefield.lanes.forEach(lane => {
    if (lane.player) allCards.push(lane.player);
    if (lane.computer) allCards.push(lane.computer);
  });
  
  // 시너지 보너스 적용
  const synergyBonuses = applySynergyBonus(allCards);
  synergyBonuses.forEach(bonus => {
    bonus.cards.forEach(card => {
      card.synergyBonus = bonus.bonus;
    });
  });
}

function resetBattlefield() {
  battlefield.lanes.forEach(lane => {
    lane.player = null;
    lane.computer = null;
  });
  
  // 기지 체력을 10^20으로 명시적으로 설정 (initGame과 동일하게)
  const baseHp = Math.pow(10, 20);
  battlefield.bases.player.hp = baseHp;
  battlefield.bases.player.maxHp = baseHp;
  battlefield.bases.computer.hp = baseHp;
  battlefield.bases.computer.maxHp = baseHp;

  renderBattlefield();
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay();
  }
}

function placeCardOnBattlefield(card, laneIndex, side) {
  const lane = battlefield.lanes[laneIndex];

  if (!lane) return false;

  const currentCard = lane[side];
  const isPlayerAction = side === 'player';

  // 턴당 카드 제한 제거됨

  if (currentCard && !currentCard.isSkull && card && !card.isSkull) {
    console.log(`[placeCard] Card already exists in lane ${laneIndex} (${side})`);
    console.log(`[placeCard] Current card: ${currentCard.name}, Type: ${currentCard.type || 'element'}`);
    console.log(`[placeCard] Dropped card: ${card.name}, Type: ${card.type || 'element'}`);

    // 전장에 이미 카드가 있는 경우 배합하지 않고 교체
    showMessage('이미 카드가 있는 자리입니다. 카드를 교체합니다.', 'warning');
    
    // 기존 카드를 인벤토리(손패)에 동일한 스탯으로 추가
    if (side === 'player') {
      const replacedCard = createReplacedCard(currentCard);
      addCardToHand(replacedCard, 'player');
      showMessage(`${replacedCard.name}이(가) 손패로 돌아왔습니다.`, 'info');
    }
    
    // 기존 카드를 새 카드로 교체
    card.owner = side;
    card.lastDamageTurn = gameState.turnCount;
    
    // 온라인 대전에서 상대방 카드 표시를 위한 정보 추가
    if (window.onlineGameState?.isOnline && card && typeof card === 'object') {
      // 온라인 대전에서는 computer 슬롯이 상대방 플레이어
      card.isOpponentCard = (side === 'computer');
    }
    // 분자 카드와 원소 카드를 구분하여 안전하게 속성 설정
    if (card.type === 'molecule' && card.elements && card.elements.length > 1) {
      // 실제 분자 카드 (2개 이상의 원소로 구성)
      card.isSynthesis = true;
      card.components = card.components || (card.elements || []);
      card.name = card.name || card.symbol || '분자';
    } else if (card.type === 'molecule' && card.elements && card.elements.length === 1) {
      // 단일 원소로 구성된 "분자"는 실제로는 원소 카드로 처리
      card.isSynthesis = false;
      card.components = [];
      card.name = (card.element && card.element.name) ? card.element.name : (card.name || '카드');
    } else {
      // 일반 원소 카드
      card.components = [];
      card.isSynthesis = false;
      card.name = (card.element && card.element.name) ? card.element.name : (card.name || '카드');
    }
    
    battlefield.lanes[laneIndex][side] = card;

    // 카드 제거 로직 (드래그 앤 드롭 또는 온라인 게임)
    if (draggedCardData && draggedCardData.id === card.id) {
      if (draggedCardData.origin === 'hand' && isPlayerAction) {
        removeCardFromHand(card.id, 'player');
      } else if (draggedCardData.origin === 'battlefield') {
        const originLane = battlefield.lanes[draggedCardData.originLaneIndex];
        if (originLane && originLane[draggedCardData.originSide] && originLane[draggedCardData.originSide].id === card.id) {
          originLane[draggedCardData.originSide] = null;
          console.log(`[placeCard] Cleared original battlefield slot: Lane ${draggedCardData.originLaneIndex}, Side ${draggedCardData.originSide}`);
        }
      }
    } else if (window.onlineGameState?.isOnline && side === 'player') {
      // 온라인 게임에서 플레이어 카드 배치 시 손패에서 제거
      removeCardFromHand(card.id, 'player');
      console.log(`[placeCard] 온라인 게임: 손패에서 카드 제거 - ${card.name}`);
    } else if (isPlayerAction && !draggedCardData) {
      // 일반적인 플레이어 액션 (드래그 앤 드롭이 아닌 경우)
      removeCardFromHand(card.id, 'player');
      console.log(`[placeCard] 일반 플레이어 액션: 손패에서 카드 제거 - ${card.name}`);
    } else {
      console.log("[placeCard] Card source wasn't drag-and-drop, removal skipped in this block.");
    }

    // 카드 제한 제거됨

    // 시너지 보너스 업데이트
    updateBattlefieldSynergy();
    
    // 온라인 게임인 경우 상대방에게 카드 배치 알림
    if (window.onlineGameState?.isOnline && window.onlineMatching) {
      console.log('카드 배치 이벤트 전송:', {
        card: card.name,
        laneIndex: laneIndex,
        side: side
      });
      
      // 온라인 게임에서는 서버 응답을 기다린 후 렌더링
      window.onlineMatching.placeCard(card, laneIndex, side).then(result => {
        if (result.success) {
          console.log('카드 배치 완료:', result);
          // 서버에서 받은 전장 상태로 업데이트
          if (result.battlefield) {
            // battlefield 객체의 속성을 업데이트
            battlefield.lanes = result.battlefield.lanes || battlefield.lanes;
            battlefield.bases = result.battlefield.bases || battlefield.bases;
            renderBattlefield();
          }
        } else {
          console.error('카드 배치 실패:', result.error);
          // 오류 발생 시 사용자에게 알림 및 복구 시도
          if (window.game && window.game.showMessage) {
            window.game.showMessage('카드 배치 중 오류가 발생했습니다: ' + result.error, 'error');
          }
          // 카드를 손패로 되돌리기
          if (side === 'player') {
            addCardToHand(card, 'player');
            renderPlayerHand();
          }
        }
      }).catch(error => {
        console.error('카드 배치 중 예외 발생:', error);
        if (window.game && window.game.showMessage) {
          window.game.showMessage('카드 배치 중 연결 오류가 발생했습니다. 재연결을 시도합니다.', 'error');
        }
        // 카드를 손패로 되돌리기
        if (side === 'player') {
          addCardToHand(card, 'player');
          renderPlayerHand();
        }
      });
    } else {
      // 오프라인 게임에서는 즉시 렌더링
      renderBattlefield();
    }
    
    // 자동화 체크 (카드 배치 후 즉시 실행)
    if (typeof window.checkAutomationImmediate === 'function') {
      window.checkAutomationImmediate();
    }
    
    // 튜토리얼 액션 처리
    if (typeof window.onCardPlaced === 'function') {
      window.onCardPlaced(card, laneIndex, side);
    }
    
    renderBattlefield();

    return true;
  } else if (currentCard === null) {
    card.owner = side;
    card.lastDamageTurn = gameState.turnCount;
    
    // 온라인 대전에서 상대방 카드 표시를 위한 정보 추가
    if (window.onlineGameState?.isOnline && card && typeof card === 'object') {
      // 온라인 대전에서는 computer 슬롯이 상대방 플레이어
      card.isOpponentCard = (side === 'computer');
    }

    // 분자 카드와 원소 카드를 구분하여 안전하게 속성 설정
    if (card.type === 'molecule' && card.elements && card.elements.length > 1) {
      // 실제 분자 카드 (2개 이상의 원소로 구성)
      card.isSynthesis = true;
      card.components = card.components || (card.elements || []);
      card.name = card.name || card.symbol || '분자';
    } else if (card.type === 'molecule' && card.elements && card.elements.length === 1) {
      // 단일 원소로 구성된 "분자"는 실제로는 원소 카드로 처리
      card.isSynthesis = false;
      card.components = [];
      card.name = (card.element && card.element.name) ? card.element.name : (card.name || '카드');
    } else {
      // 일반 원소 카드
      card.components = [];
      card.isSynthesis = false;
      card.name = (card.element && card.element.name) ? card.element.name : (card.name || '카드');
    }

    battlefield.lanes[laneIndex][side] = card;

    // 카드 제한 제거됨
    
    // 시너지 보너스 업데이트
    updateBattlefieldSynergy();
    
    // 온라인 게임인 경우 상대방에게 카드 배치 알림
    if (window.onlineGameState?.isOnline && window.onlineMatching) {
      console.log('카드 배치 이벤트 전송:', {
        card: card.name,
        laneIndex: laneIndex,
        side: side
      });
      
      // 온라인 게임에서는 서버 응답을 기다린 후 렌더링
      window.onlineMatching.placeCard(card, laneIndex, side).then(result => {
        if (result.success) {
          console.log('카드 배치 완료:', result);
          // 서버에서 받은 전장 상태로 업데이트
          if (result.battlefield) {
            // battlefield 객체의 속성을 업데이트
            battlefield.lanes = result.battlefield.lanes || battlefield.lanes;
            battlefield.bases = result.battlefield.bases || battlefield.bases;
            renderBattlefield();
          }
        } else {
          console.error('카드 배치 실패:', result.error);
          // 오류 발생 시 사용자에게 알림 및 복구 시도
          if (window.game && window.game.showMessage) {
            window.game.showMessage('카드 배치 중 오류가 발생했습니다: ' + result.error, 'error');
          }
          // 카드를 손패로 되돌리기
          if (side === 'player') {
            addCardToHand(card, 'player');
            renderPlayerHand();
          }
        }
      }).catch(error => {
        console.error('카드 배치 중 예외 발생:', error);
        if (window.game && window.game.showMessage) {
          window.game.showMessage('카드 배치 중 연결 오류가 발생했습니다. 재연결을 시도합니다.', 'error');
        }
        // 카드를 손패로 되돌리기
        if (side === 'player') {
          addCardToHand(card, 'player');
          renderPlayerHand();
        }
      });
    } else {
      // 오프라인 게임에서는 즉시 렌더링
      renderBattlefield();
    }
    
    // 자동화 체크 (카드 배치 후 즉시 실행)
    if (typeof window.checkAutomationImmediate === 'function') {
      window.checkAutomationImmediate();
    }
    
    // 튜토리얼 액션 처리
    if (typeof window.onCardPlaced === 'function') {
      window.onCardPlaced(card, laneIndex, side);
    }
    
    renderBattlefield();

    // 원자 구조 배경 업데이트
    if (window.elementColorSystem && card.element && card.element.number) {
      window.elementColorSystem.updateAtomicBackground(card.element.number);
    }

    if (draggedCardData && draggedCardData.origin === 'hand' && isPlayerAction && draggedCardData.id === card.id) {                                             
      removeCardFromHand(card.id, 'player');
    } else if (draggedCardData && draggedCardData.origin === 'battlefield' && draggedCardData.id === card.id) {                                                 
      const originLane = battlefield.lanes[draggedCardData.originLaneIndex];
      if (originLane && originLane[draggedCardData.originSide] && originLane[draggedCardData.originSide].id === card.id) {                                      
        originLane[draggedCardData.originSide] = null;
        console.log(`[placeCard] Moved card: Cleared original battlefield slot: Lane ${draggedCardData.originLaneIndex}, Side ${draggedCardData.originSide}`);  
      }
    } else if (isPlayerAction && !draggedCardData) {
      // 일반적인 플레이어 액션 (드래그 앤 드롭이 아닌 경우)
      removeCardFromHand(card.id, 'player');
      console.log(`[placeCard] 일반 플레이어 액션: 손패에서 카드 제거 - ${card.name}`);
    }

    return true;
  }

  showMessage('카드를 놓을 수 없는 곳입니다.', 'error');
  return false;
}

function removeCardFromHand(cardId, side) {
  const hand = (side === 'player') ? gameState.playerHand : gameState.computerHand;
  const handIndex = hand.findIndex(c => c.id === cardId);
  if (handIndex !== -1) {
    hand.splice(handIndex, 1);
    console.log(`[removeCardFromHand] Removed card ${cardId} from ${side} hand.`);
    if (side === 'player') {
      renderPlayerHand();
    }
  } else {
    console.warn(`[removeCardFromHand] Card ${cardId} not found in ${side} hand.`);
  }
}

function getHighestRarity(rarities) {
  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  let highest = 'common';
  let highestIndex = -1;
  for (const rarity of rarities) {
    const index = order.indexOf(rarity);
    if (index > highestIndex) {
      highestIndex = index;
      highest = rarity;
    }
  }
  return highest;
}

function canPlaceCardInLane(laneIndex, side) {
  const lane = battlefield.lanes[laneIndex];
  if (!lane) return false;

  return true;
}

function updateLaneElementStats(laneIndex) {
  const lane = battlefield.lanes[laneIndex];

  if (lane.player && !lane.player.isSkull && !lane.player.statsUpdated) {
    const stats = calculateTotalElementStats(laneIndex, 'player');
    lane.player.atk += stats.atkBonus;
    lane.player.maxHp += stats.hpBonus;
    lane.player.hp += stats.hpBonus;
    lane.player.statsUpdated = true;
  }

  if (lane.computer && !lane.computer.isSkull && !lane.computer.statsUpdated) {
    const stats = calculateTotalElementStats(laneIndex, 'computer');
    lane.computer.atk += stats.atkBonus;
    lane.computer.maxHp += stats.hpBonus;
    lane.computer.hp += stats.hpBonus;
    lane.computer.statsUpdated = true;
  }
}

function calculateTotalElementStats(laneIndex, side) {
  let atkBonus = 0;
  let hpBonus = 0;

  for (let i = 0; i < battlefield.lanes.length; i++) {
    if (i !== laneIndex) {
      const otherLane = battlefield.lanes[i];
      const otherCard = otherLane[side];

      if (otherCard && !otherCard.isSkull) {
        const rarityBonus = {
          common: 0.05,
          uncommon: 0.08,
          rare: 0.12,
          epic: 0.15,
          legendary: 0.2
        };

        const bonus = rarityBonus[otherCard.element.rarity || 'common'] || 0.05;

        atkBonus += Math.floor(otherCard.atk * bonus);
        hpBonus += Math.floor(otherCard.hp * bonus);
      }
    }
  }

  return { atkBonus, hpBonus };
}

function checkChemicalReactions(laneIndex) {
  const lane = battlefield.lanes[laneIndex];

  if (!lane.player || !lane.computer) {
    return false;
  }

  // 화학 반응 시스템이 제거되었으므로 항상 false 반환
  return false;
}

function renderBattlefield() {
  console.log("[renderBattlefield] Rendering battlefield...");
  battlefield.lanes.forEach((lane, index) => {
    const laneElement = document.getElementById(`lane-${index}`);
    if (!laneElement) {
      console.error(`Lane element lane-${index} not found!`);
      return;
    }

    const playerSlot = laneElement.querySelector('.player-slot');
    const computerSlot = laneElement.querySelector('.computer-slot');

    if (!playerSlot || !computerSlot) {
      console.error(`Slots not found in lane-${index}`);
      return;
    }

    playerSlot.innerHTML = '';
    computerSlot.innerHTML = '';

    if (lane.player) {
      const cardElement = createCardElement(lane.player, false);
      playerSlot.appendChild(cardElement);
      
      // 반감기 UI 업데이트
      if (window.halfLifeSystem && lane.player.halflife && !lane.player.halflife.isStable) {
        window.halfLifeSystem.updateHalfLifeUI(cardElement, lane.player);
      }
      
      // 카드 등장 애니메이션 (손패에서 전장으로)
      if (window.playCardEntranceAnimation) {
        setTimeout(() => {
          window.playCardEntranceAnimation(cardElement, true);
        }, index * 100); // 각 라인마다 100ms씩 지연
      }
    }

    if (lane.computer) {
      const cardElement = createCardElement(lane.computer, false);
      computerSlot.appendChild(cardElement);
      console.log(`컴퓨터 카드 렌더링: ${lane.computer.name} (라인 ${index})`);
      
      // 반감기 UI 업데이트
      if (window.halfLifeSystem && lane.computer.halflife && !lane.computer.halflife.isStable) {
        window.halfLifeSystem.updateHalfLifeUI(cardElement, lane.computer);
      }
      
      // 카드 등장 애니메이션 (컴퓨터 카드)
      if (window.playCardEntranceAnimation) {
        setTimeout(() => {
          window.playCardEntranceAnimation(cardElement, true);
        }, (index * 100) + 200); // 플레이어 카드보다 200ms 늦게
      }
    }
  });
  console.log("[renderBattlefield] Battlefield rendering complete.");
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay();
  } else {
    console.warn("updateBaseDisplay function not found after renderBattlefield");
  }
}

function findCardInBattlefield(cardId) {
  for (let i = 0; i < battlefield.lanes.length; i++) {
    const lane = battlefield.lanes[i];

    if (lane.player && lane.player.id === cardId) {
      return { card: lane.player, lane: i, side: 'player' };
    }

    if (lane.computer && lane.computer.id === cardId) {
      return { card: lane.computer, lane: i, side: 'computer' };
    }
  }

  return null;
}

function findCardInHand(cardId) {
  const playerIndex = gameState.playerHand.findIndex(card => card.id === cardId);
  if (playerIndex !== -1) {
    return { card: gameState.playerHand[playerIndex], index: playerIndex, side: 'player' };
  }

  const computerIndex = gameState.computerHand.findIndex(card => card.id === cardId);
  if (computerIndex !== -1) {
    return { card: gameState.computerHand[computerIndex], index: computerIndex, side: 'computer' };
  }

  return null;
}

function removeCardFromHand(cardId, side) {
  const hand = (side === 'player') ? gameState.playerHand : gameState.computerHand;
  const index = hand.findIndex(card => card.id === cardId);
  if (index !== -1) {
    hand.splice(index, 1);
    if (side === 'player') {
      renderPlayerHand();
    }
    return true;
  }
  return false;
}

function updateBaseDisplay() {
  const playerHpElement = document.getElementById('player-base-hp');
  const computerHpElement = document.getElementById('computer-base-hp');
  
  if (playerHpElement) {
    playerHpElement.textContent = window.formatToUtg ? window.formatToUtg(battlefield.bases.player.hp) : battlefield.bases.player.hp;
  }
  const playerHpPercent = (battlefield.bases.player.hp / battlefield.bases.player.maxHp) * 100;
  const playerHpBar = document.getElementById('player-base-hp-bar');
  if (playerHpBar) {
    playerHpBar.style.width = `${playerHpPercent}%`;
  }

  if (computerHpElement) {
    computerHpElement.textContent = window.formatToUtg ? window.formatToUtg(battlefield.bases.computer.hp) : battlefield.bases.computer.hp;
  }
  const computerHpPercent = (battlefield.bases.computer.hp / battlefield.bases.computer.maxHp) * 100;
  const computerHpBar = document.getElementById('computer-base-hp-bar');
  if (computerHpBar) {
    computerHpBar.style.width = `${computerHpPercent}%`;
  }
}

function checkCardHealing() {
  battlefield.lanes.forEach(lane => {
    healCardIfNeeded(lane.player);
    healCardIfNeeded(lane.computer);
  });
}

function healCardIfNeeded(card) {
  if (!card || card.hp <= 0) return;

  const turnsSinceLastDamage = gameState.turnCount - (card.lastDamageTurn || 0);

  if (turnsSinceLastDamage >= 2 && card.hp < card.maxHp) {
    card.hp = Math.min(card.maxHp, card.hp + 1);

    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
      cardElement.classList.add('card-heal');
      setTimeout(() => {
        cardElement.classList.remove('card-heal');
      }, 1000);
    }
  }
}

function handleCardDeath(laneIndex, side) {
  console.log(`Card died at lane ${laneIndex}, side ${side}. Removing.`);
  battlefield.lanes[laneIndex][side] = null;
  renderBattlefield();
}

function resolveAttack(attackerCard, targetCard, attackerLaneIndex, targetLaneIndex, attackerSide) {
  // 공격 시 특수능력 발동 (공격자)
  if (attackerCard.specialAbilities && Array.isArray(attackerCard.specialAbilities)) {
    attackerCard.specialAbilities.forEach(ability => {
      if (ability && ability.condition === 'on_attack') {
        if (typeof processSpecialAbilities === 'function') {
          processSpecialAbilities(attackerCard, [targetCard], attackerSide === 'player');
        }
      }
    });
  }
  
  // 피격 시 특수능력 발동 (피격자)
  if (targetCard.specialAbilities && Array.isArray(targetCard.specialAbilities)) {
    targetCard.specialAbilities.forEach(ability => {
      if (ability && ability.condition === 'on_damage') {
        if (typeof processSpecialAbilities === 'function') {
          processSpecialAbilities(targetCard, [attackerCard], attackerSide === 'computer');
        }
      }
    });
  }
  
  targetCard.hp -= attackerCard.atk;
  playDamageAnimation(targetLaneIndex, attackerSide === 'player' ? 'computer' : 'player');

  if (targetCard.hp <= 0) {
    console.log(`${targetCard.name} defeated by ${attackerCard.name}.`);
    
    // 별 획득 (철 이상 원소 처치 시)
    if (window.starCurrency && targetCard.element && targetCard.element.number >= 26) {
      const starsGained = window.starCurrency.gainStars(targetCard.element.number, attackerSide);
      if (starsGained > 0) {
        showMessage(`⭐ ${targetCard.element.name} 처치로 별 ${starsGained}개 획득!`, 'star');
      }
    }
    
    // 사망 시 특수능력 발동 (피격자)
    if (targetCard.specialAbilities && Array.isArray(targetCard.specialAbilities)) {
      targetCard.specialAbilities.forEach(ability => {
        if (ability && ability.condition === 'on_death') {
          if (typeof processSpecialAbilities === 'function') {
            processSpecialAbilities(targetCard, [attackerCard], attackerSide === 'computer');
          }
        }
      });
    }
    
    // 처치 시 특수능력 발동 (공격자)
    if (attackerCard.specialAbilities && Array.isArray(attackerCard.specialAbilities)) {
      attackerCard.specialAbilities.forEach(ability => {
        if (ability && ability.condition === 'on_kill') {
          if (typeof processSpecialAbilities === 'function') {
            processSpecialAbilities(attackerCard, [targetCard], attackerSide === 'player');
          }
        }
      });
    }
    
    if (targetCard.originalMaxHp > 0) {
      // 원소 번호에 따른 가파른 보상 코인 증가
      let coinReward = targetCard.originalMaxHp;
      
      // 원소 카드인 경우 원소 번호에 따른 보너스 적용
      if (targetCard.element && targetCard.element.number) {
        const elementNumber = targetCard.element.number;
        const elementBonus = Math.floor(Math.pow(elementNumber, 1.3) * 0.5);
        coinReward += elementBonus;
      }
      
      // 분자 카드인 경우 원소 조합에 따른 보너스 적용
      if (targetCard.elements && targetCard.elements.length > 0) {
        const maxElementNumber = Math.max(...targetCard.elements);
        const minElementNumber = Math.min(...targetCard.elements);
        const moleculeBonus = Math.floor((Math.pow(maxElementNumber, 1.2) + Math.pow(minElementNumber, 1.1)) * 0.3);
        coinReward += moleculeBonus;
      }
      
      // 합성 카드인 경우 컴포넌트에 따른 보너스 적용
      if (targetCard.components && targetCard.components.length > 0) {
        const maxComponentNumber = Math.max(...targetCard.components);
        const minComponentNumber = Math.min(...targetCard.components);
        const synthesisBonus = Math.floor((Math.pow(maxComponentNumber, 1.1) + Math.pow(minComponentNumber, 1.05)) * 0.2);
        coinReward += synthesisBonus;
      }
      
      addCoins(coinReward, attackerCard.owner);
      showMessage(`${attackerCard.owner === 'player' ? '플레이어' : '컴퓨터'}가 ${coinReward} 코인을 획득했습니다!`, 'coin');
      
      // 카드 처치 시 에너지 지급 (플레이어만)
      if (attackerCard.owner === 'player') {
        let energyReward = 1; // 기본 에너지 보상
        
        // 원소 카드인 경우 원소별 에너지 값 계산
        if (targetCard.element && !targetCard.isSynthesis) {
          energyReward = window.calculateElementEnergyValue ? window.calculateElementEnergyValue(targetCard) : 1;
        } else if (targetCard.isSynthesis || targetCard.type === 'molecule') {
          // 분자 카드인 경우 분자별 에너지 값 계산
          energyReward = window.calculateMoleculeEnergyValue ? window.calculateMoleculeEnergyValue(targetCard) : 2;
        }
        
        // 에너지 추가
        if (typeof addEnergy === 'function') {
          addEnergy(energyReward, 'player');
        } else {
          if (!gameState.energy) gameState.energy = 0;
          gameState.energy += energyReward;
          
          // fusionSystem과 동기화
          if (gameState.fusionSystem) {
            gameState.fusionSystem.energy = gameState.energy;
          }
        }
        
        showMessage(`카드 처치로 에너지 ${energyReward}를 획득했습니다!`, 'energy');
      }
    }
    handleCardDeath(targetLaneIndex, attackerSide === 'player' ? 'computer' : 'player');
    return true;
  }
  return false;
}

window.placeCardOnBattlefield = placeCardOnBattlefield;
window.renderBattlefield = renderBattlefield;
window.resetBattlefield = typeof resetBattlefield !== 'undefined' ? resetBattlefield : undefined;
window.updateBaseDisplay = typeof updateBaseDisplay !== 'undefined' ? updateBaseDisplay : undefined;
window.findCardInHand = typeof findCardInHand !== 'undefined' ? findCardInHand : undefined;
window.removeCardFromHand = typeof removeCardFromHand !== 'undefined' ? removeCardFromHand : undefined;
window.createReplacedCard = createReplacedCard;

// 에너지 계산 함수들을 전역으로 노출
window.calculateElementEnergyValue = typeof calculateElementEnergyValue !== 'undefined' ? calculateElementEnergyValue : undefined;
window.calculateMoleculeEnergyValue = typeof calculateMoleculeEnergyValue !== 'undefined' ? calculateMoleculeEnergyValue : undefined;
