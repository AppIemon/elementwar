export class ElementCard {
  constructor(element, hp, atk) {
    this.element = element;
    this.hp = hp;
    this.maxHp = hp;
    this.originalMaxHp = hp; // Store original max HP for coin reward
    this.atk = atk;
    this.maxAtk = atk; // Consider adding originalMaxAtk if needed
    
    // 카드 ID 생성 통일 (crypto.randomUUID 우선, 폴백으로 Math.random)
    try {
      this.id = crypto.randomUUID();
    } catch (error) {
      this.id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    this.effects = [];
    this.armor = 0;
    this.lastDamageTurn = 0;
    this.upgradeLevel = 0;
    this.owner = null; // 실제 소유자 (변경되지 않음)
    this.displaySide = null; // 화면 표시 위치 (플레이어 관점에 따라 변경)
    this.isOpponentCard = false; // 상대방 카드 여부 (플레이어 관점에 따라 설정)

    this.rarity = (element && element.rarity) || 'common';

    // Synthesis properties
    this.isSynthesis = false;
    this.components = [];
    this.name = (element && element.name) || 'Unknown';
    this.moleculeId = null; // Store molecule ID if it's a synthesis card
    
    // 상태 이상 시스템
    this.statusEffects = [];
    this.canAct = true; // 행동 가능 여부
    this.atkMultiplier = 1; // 공격력 배수
    this.defMultiplier = 1; // 방어력 배수
    this.resistances = {}; // 저항력 (fire: 0.5 = 화염 피해 50% 감소)
    this.immunities = []; // 면역 상태 (['stun', 'freeze'])
    
    // 반감기 시스템 정보 추가
    if (window.halfLifeSystem && element) {
      this.halflife = window.halfLifeSystem.addHalfLifeToCard(this).halflife;
    }

    // 별 레벨 초기화
    this.starLevel = 0;
    this.starExperience = 0;
    this.starRequiredExp = 100;
  }

  getHealthRatio() {
    return this.hp / this.maxHp;
  }

  isDead() {
    return this.hp <= 0;
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  hasEffect(effectName) {
    return this.effects.some(effect => effect.name === effectName);
  }

  getEffectValue(effectName, valueName) {
    const effect = this.effects.find(e => e.name === effectName);
    if (effect && effect[valueName] !== undefined) {
      return effect[valueName];
    }
    return 0;
  }

  processTurnEffects() {
    // 기존 효과 처리
    this.effects = this.effects.filter(effect => {
      if (effect.duration !== undefined) {
        effect.duration--;

        if (effect.name === 'dot' && effect.damage) {
          this.hp -= effect.damage;
        }

        if ((effect.name === 'heal' || effect.name === 'regeneration') && effect.healing) {
          this.hp = Math.min(this.maxHp, this.hp + effect.healing);
        }

        return effect.duration > 0 || effect.permanent === true;
      }
      return true;
    });

    // 상태 이상 효과 처리
    if (window.statusEffectSystem) {
      window.statusEffectSystem.processTurnEffects(this);
    }
  }

  // 상태 이상 추가
  addStatusEffect(effectName, duration, data = {}) {
    // 면역 체크
    if (this.immunities.includes(effectName)) {
      return false;
    }

    // 기존 효과가 있으면 지속 시간 갱신
    const existingEffect = this.statusEffects.find(e => e.name === effectName);
    if (existingEffect) {
      existingEffect.duration = Math.max(existingEffect.duration, duration);
      Object.assign(existingEffect, data);
      return true;
    }

    // 새 효과 추가
    this.statusEffects.push({
      name: effectName,
      duration: duration,
      ...data
    });

    return true;
  }

  // 상태 이상 제거
  removeStatusEffect(effectName) {
    const index = this.statusEffects.findIndex(e => e.name === effectName);
    if (index !== -1) {
      const effect = this.statusEffects[index];
      const statusEffectInfo = window.statusEffectSystem?.getEffectInfo(effectName);
      if (statusEffectInfo?.onRemove) {
        statusEffectInfo.onRemove(this);
      }
      this.statusEffects.splice(index, 1);
      return true;
    }
    return false;
  }

  // 분자를 에너지로 변환 (기본 에너지 계산 사용)
  convertToEnergy() {
    if (this.type === 'molecule') {
      const energyGained = calculateMoleculeEnergyValue(this);
      if (energyGained > 0) {
        // 에너지 추가
        if (typeof addEnergy === 'function') {
          addEnergy(energyGained, 'player');
        } else {
          if (!gameState.energy) gameState.energy = 0;
          gameState.energy += energyGained;
          
          // fusionSystem과 동기화
          if (gameState.fusionSystem) {
            gameState.fusionSystem.energy = gameState.energy;
          }
        }
        
        showMessage(`🧪 ${this.name}이(가) ${energyGained} 에너지로 변환되었습니다!`, 'energy');
        return true;
      }
    }
    return false;
  }

  // 상태 이상 확인
  hasStatusEffect(effectName) {
    return this.statusEffects.some(e => e.name === effectName);
  }

  // 상태 이상 정보 가져오기
  getStatusEffect(effectName) {
    return this.statusEffects.find(e => e.name === effectName);
  }

  // 피해 받기 (상태 이상 효과 포함)
  takeDamage(damage, damageType = 'normal') {
    if (window.statusEffectSystem) {
      damage = window.statusEffectSystem.processDamageEffects(this, damage, damageType);
    }

    // 저항력 적용
    if (this.resistances[damageType]) {
      damage = Math.floor(damage * this.resistances[damageType]);
    }

    // 방어력 적용
    const finalDamage = Math.max(1, damage - (this.armor || 0));
    this.hp = Math.max(0, this.hp - finalDamage);

    return finalDamage;
  }

  // 회복
  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - oldHp;
  }

  // 공격력 계산 (상태 이상 포함)
  getAttackPower() {
    let attackPower = this.atk;
    
    // 공격력 배수 적용
    attackPower *= (this.atkMultiplier || 1);
    
    // 상태 이상 효과 적용
    const rageEffect = this.getStatusEffect('rage');
    if (rageEffect) {
      attackPower *= 1.5;
    }

    return Math.floor(attackPower);
  }

  // 방어력 계산 (상태 이상 포함)
  getDefensePower() {
    let defensePower = this.armor || 0;
    
    // 방어력 배수 적용
    defensePower *= (this.defMultiplier || 1);
    
    // 상태 이상 효과 적용
    const armorEffect = this.getStatusEffect('armor');
    if (armorEffect) {
      defensePower += armorEffect.armorAmount || 0;
    }

    return Math.floor(defensePower);
  }

  getSpecialAbility() {
    const cardData = this.isSynthesis ? moleculeUpgrades[this.moleculeId] : elementUpgrades[this.element.symbol];
    if (!cardData || !cardData.specialAbilities) {
      return null;
    }

    let highestUnlockedAbility = null;
    let highestLevel = -1;

    for (const levelStr in cardData.specialAbilities) {
      const level = parseInt(levelStr);
      if (this.upgradeLevel >= level && level > highestLevel) {
        highestLevel = level;
        highestUnlockedAbility = cardData.specialAbilities[level];
      }
    }
    return highestUnlockedAbility;
  }

  getAllUnlockedSpecialAbilities() {
    const unlockedAbilities = [];
    const cardData = this.isSynthesis ? moleculeUpgrades[this.moleculeId] : elementUpgrades[this.element.symbol];
    if (!cardData || !cardData.specialAbilities) {
      return unlockedAbilities;
    }

    const sortedLevels = Object.keys(cardData.specialAbilities)
                               .map(Number)
                               .sort((a, b) => a - b);

    for (const level of sortedLevels) {
      if (this.upgradeLevel >= level) {
        unlockedAbilities.push({ level, ...cardData.specialAbilities[level] });
      }
    }
    return unlockedAbilities;
  }
}

function createRandomCard() {
  // 현재까지 발견된 최상위 원소 번호 - 2까지만 등장
  const maxDiscovered = (typeof getMaxDiscoveredElementNumber === 'function') ? getMaxDiscoveredElementNumber() : 1;
  // 최소 cap을 1로 설정하여 H는 항상 나올 수 있도록 함
  const cap = Math.max(1, maxDiscovered - 2);
  const elementsWithWeights = gameState.elementsData
    .filter(element => typeof element.number === 'number' && element.number <= cap)
    .map(element => {
    let reactionCount = 0;
    // reactionsData가 존재하고 배열인지 확인
    if (gameState.reactionsData && Array.isArray(gameState.reactionsData)) {
      gameState.reactionsData.forEach(reaction => {
        if (reaction.elements && reaction.elements.includes(element.number)) {
          reactionCount++;
        }
      });
    }

    const weight = 1 + (reactionCount * 0.2);

    return { element, weight };
  });

  const totalWeight = elementsWithWeights.reduce((sum, item) => sum + item.weight, 0);
  let randomWeight = Math.random() * totalWeight;
  let selectedElement = null;

  for (const item of elementsWithWeights) {
    randomWeight -= item.weight;
    if (randomWeight <= 0) {
      selectedElement = item.element;
      break;
    }
  }

  if (!selectedElement) {
    // 폴백도 cap 내에서 선택
    const fallbackPool = gameState.elementsData.filter(e => typeof e.number === 'number' && e.number <= cap);
    if (fallbackPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallbackPool.length);
      selectedElement = fallbackPool[randomIndex];
    }
  }

  // 최종 폴백: 기본 원소 데이터 사용
  if (!selectedElement) {
    selectedElement = {
      name: 'Unknown',
      number: 0,
      symbol: '?',
      category: 'unknown',
      baseHp: 5,
      baseAtk: 2,
      rarity: 'common'
    };
  }

  // game.js의 computeElementStats 함수와 동일한 능력치 계산 사용
  const { hp, atk } = computeElementStats(selectedElement, selectedElement.rarity || 'common');

  const card = new ElementCard(selectedElement, hp, atk);
  card.rarity = selectedElement.rarity || 'common';
  return card;
}

function addCardToHand(card, player) {
  // card가 유효한지 확인
  if (!card) {
    console.warn('addCardToHand: card가 undefined입니다.');
    return;
  }

  // 카드 소유자 설정
  card.owner = player;

  if (player === 'player') {
    gameState.playerHand.push(card);
  } else {
    gameState.computerHand.push(card);
  }
  
  // 특수 능력 처리 (카드가 손에 추가될 때)
  if (card.specialAbilities) {
    processSpecialAbilities(card, [], player === 'player');
  }
  
  // 시너지 보너스 적용
  const hand = player === 'player' ? gameState.playerHand : gameState.computerHand;
  const synergyBonuses = applySynergyBonus(hand);
  synergyBonuses.forEach(bonus => {
    bonus.cards.forEach(card => {
      card.synergyBonus = bonus.bonus;
    });
  });

  // 온라인 게임에서 서버에 카드 뽑기 알림
  if (window.onlineGameState?.isOnline && window.onlineMatching && player === 'player') {
    console.log('온라인 게임: 카드 뽑기 서버 동기화', card.name);
    window.onlineMatching.syncCardDraw([card]).catch(error => {
      console.error('카드 뽑기 동기화 실패:', error);
    });
  }
}

function createCardElement(card, isInHand = true) {
  const cardElement = document.createElement('div');

  const isSynth = card.isSynthesis;
  const isMolecule = card.type === 'molecule';
  const element = card.element || {};
  
  let displaySymbol, displayNumber, displayName;
  
  // 카드 타입을 더 정확하게 판별
  if ((isMolecule || card.moleculeId) && card.elements && card.elements.length > 1) {
    // 실제 분자 카드 (2개 이상의 원소로 구성)
    displaySymbol = card.symbol || card.name || '?';
    displayNumber = '분자';
    displayName = card.name || '분자';
  } else if (isSynth || card.components) {
    // 합성물 카드
    displaySymbol = card.name || '합성물';
    displayNumber = '합성';
    displayName = card.name || '합성물';
  } else {
    // 일반 원소 카드 (단일 원소로 구성된 "분자"도 포함)
    displaySymbol = element.symbol || '?';
    displayNumber = element.number ? element.number + '번' : '';
    displayName = element.name || '카드';
  }

  let backgroundStyle = element?.color || 'bg-gray-700';
  if ((isMolecule || card.moleculeId) && card.elements && card.elements.length > 1) {
    // 실제 분자 카드만 분자 스타일 적용
    backgroundStyle = `${card.color || 'bg-purple-600'} molecule-flashy`;
  } else if (isSynth) {
    backgroundStyle = 'synthesis-card';
  }

  // 온라인 대전에서 상대방 카드인지 확인 (실제 플레이어 ID 기준)
  let isOpponentCard = false;
  if (window.onlineGameState?.isOnline && !isInHand) {
    // 실제 플레이어 ID를 기준으로 상대방 카드 판별
    if (window.onlineMatching && window.onlineMatching.playerId) {
      const currentPlayerId = window.onlineMatching.playerId;
      const cardPlayerId = card.actualPlayerId;
      
      if (cardPlayerId && cardPlayerId !== currentPlayerId) {
        isOpponentCard = true;
        console.log('온라인 대전 상대방 카드 감지:', card.name, '내 ID:', currentPlayerId, '카드 소유자 ID:', cardPlayerId);
      } else {
        isOpponentCard = false;
        console.log('온라인 대전 내 카드 감지:', card.name, '내 ID:', currentPlayerId, '카드 소유자 ID:', cardPlayerId);
      }
    } else {
      // 폴백: 기존 isOpponentCard 속성 사용
      isOpponentCard = card.isOpponentCard === true;
      if (isOpponentCard) {
        console.log('온라인 대전 상대방 카드 감지 (폴백):', card.name, 'owner:', card.owner, 'isOpponentCard:', card.isOpponentCard);
      }
    }
  }

  cardElement.className = `card h-32 w-24 ${backgroundStyle} rounded-lg shadow-lg flex flex-col items-center justify-between p-2 text-white relative`;
  cardElement.setAttribute('data-card-id', card.id);
  cardElement.id = card.id;
  
  // 온라인 대전에서 상대방 카드 표시 (색깔 바꾸기와 뒤집기 제거)
  if (isOpponentCard) {
    // 상대방 카드임을 표시하는 속성만 추가 (시각적 효과 제거)
    cardElement.setAttribute('data-opponent-card', 'true');
  }
  
  // 세로 반전 적용 (isFlipped 속성이 있는 경우)
  if (card.isFlipped) {
    cardElement.style.transform = (cardElement.style.transform || '') + ' scaleY(-1)';
  }

  // 원소별 실제 색상 적용
  if (!isSynth && element.symbol && window.elementColorSystem) {
    window.elementColorSystem.applyElementColor(cardElement, element);
  }

  if (isInHand) {
    cardElement.draggable = true; // Make hand cards draggable
  }

  // 체력 비율 계산 (분자 카드와 일반 카드 모두 지원)
  const healthRatio = (card.getHealthRatio && typeof card.getHealthRatio === 'function') 
    ? card.getHealthRatio() 
    : ((card.hp && card.maxHp) ? (card.hp / card.maxHp) : 1);
  const healthPercentage = Math.max(0, Math.min(100, healthRatio * 100));

  // 소유자 정보 표시 (온라인 대전에서 상대방 카드는 반전 표시)
  let ownerText = '';
  let ownerClass = '';
  
  if (isOpponentCard) {
    // 상대방 카드 (온라인 대전)
    ownerText = '상대방';
    ownerClass = 'text-red-300';
  } else if (card.owner === 'player') {
    // 내 카드
    ownerText = '플레이어';
    ownerClass = 'text-blue-300';
  } else if (card.owner === 'computer' && !window.onlineGameState?.isOnline) {
    // 오프라인 게임의 AI 카드
    ownerText = '컴퓨터';
    ownerClass = 'text-red-300';
  }

  cardElement.innerHTML = `
    <div class="electron-orbits"></div>
    <div class="text-center relative z-10">
      <div class="text-sm font-bold">${displaySymbol}</div>
      <div class="text-xs">${displayNumber}</div>
      <div class="text-xs mt-1">${displayName}</div>
      ${ownerText ? `<div class="text-xs ${ownerClass} font-semibold">${ownerText}</div>` : ''}
    </div>
    <div class="w-full mt-auto relative z-10">
      <div class="w-full bg-gray-800 rounded-full h-1.5 mb-1">
        <div class="bg-red-500 h-1.5 rounded-full" style="width: ${healthPercentage}%"></div>
      </div>
      <div class="flex justify-between text-xs">
        <div class="font-bold">❤️${window.formatNumber ? window.formatNumber(card.hp || 0) : (card.hp || 0)}</div>
        <div class="font-bold">⚔️${window.formatNumber ? window.formatNumber(card.atk || 0) : (card.atk || 0)}</div>
      </div>
    </div>
  `;

  const rarity = card.rarity || 'common';
  const rankElement = document.createElement('div');
  rankElement.className = `element-rank rank-${rarity}`;
  const rankSymbols = { common: '★', uncommon: '★★', rare: '★★★', epic: '★★★★', legendary: '★★★★★' };
  rankElement.textContent = rankSymbols[rarity] || '★';
  cardElement.appendChild(rankElement);

  if (card.upgradeLevel && card.upgradeLevel > 0) {
    const upgradeElement = document.createElement('div');
    upgradeElement.className = 'special-ability';
    upgradeElement.textContent = `+${card.upgradeLevel}`;
    cardElement.appendChild(upgradeElement);
  }

  // 반감기 UI 추가
  if (window.halfLifeSystem && card.halflife && !card.halflife.isStable) {
    window.halfLifeSystem.addHalfLifeUI(cardElement, card);
  }

  if (isMolecule) {
    const badge = document.createElement('div');
    badge.className = 'special-ability';
    badge.textContent = '🧬';
    cardElement.appendChild(badge);
  } else if (isSynth) {
    const badge = document.createElement('div');
    badge.className = 'special-ability';
    badge.textContent = '⚗️';
    cardElement.appendChild(badge);
  }

  // 특수 능력 표시
  if (card.specialAbilities && card.specialAbilities.length > 0) {
    const abilityBadge = document.createElement('div');
    abilityBadge.className = 'special-ability';
    abilityBadge.textContent = '✨';
    abilityBadge.title = card.specialAbilities.map(ability => ability.name).join(', ');
    cardElement.appendChild(abilityBadge);
  }

  // 상성 표시
  if (card.affinities) {
    const affinityBadge = document.createElement('div');
    affinityBadge.className = 'special-ability';
    affinityBadge.textContent = '⚖️';
    let affinityText = '';
    if (card.affinities.strong_against && card.affinities.strong_against.length > 0) {
      affinityText += '강함: ' + card.affinities.strong_against.join(', ') + '\n';
    }
    if (card.affinities.weak_against && card.affinities.weak_against.length > 0) {
      affinityText += '약함: ' + card.affinities.weak_against.join(', ') + '\n';
    }
    if (card.affinities.synergy_with && card.affinities.synergy_with.length > 0) {
      affinityText += '시너지: ' + card.affinities.synergy_with.join(', ');
    }
    affinityBadge.title = affinityText;
    cardElement.appendChild(affinityBadge);
  }

  // 시너지 보너스 표시
  if (card.synergyBonus && card.synergyBonus > 1) {
    const synergyBadge = document.createElement('div');
    synergyBadge.className = 'special-ability';
    synergyBadge.textContent = '🔗';
    synergyBadge.title = `시너지 보너스: ${Math.round((card.synergyBonus - 1) * 100)}%`;
    cardElement.appendChild(synergyBadge);
  }

  if (isInHand) {
    cardElement.addEventListener('click', () => showCardDetail(card));

    if (typeof handleDragStart === 'function') {
      cardElement.addEventListener('dragstart', handleDragStart);
    } else {
      console.warn("handleDragStart function not found for card drag listener.");
    }
    if (typeof handleDragEnd === 'function') {
      cardElement.addEventListener('dragend', handleDragEnd);
    } else {
      console.warn("handleDragEnd function not found for card drag listener.");
    }
  } else {
    cardElement.addEventListener('click', (event) => {
      const slotElement = event.currentTarget.closest('.lane-slot');
      const laneElement = event.currentTarget.closest('.battlefield-lane');
      if (slotElement && laneElement) {
        const laneIndex = parseInt(laneElement.id.split('-')[1]);
        const side = slotElement.classList.contains('player-slot') ? 'player' : 'computer';
        if (side === 'player' && gameState.isPlayerTurn) {
          showCardUpgradeModal(card, laneIndex, side);
        } else if (side === 'computer') {
          showMessage('상대방 카드는 강화할 수 없습니다.', 'warning');
        } else if (!gameState.isPlayerTurn) {
          showMessage('플레이어 턴이 아닙니다.', 'warning');
        }
      }
    });
  }

  return cardElement;
}

function showCardDetail(card) {
  const modal = document.getElementById('card-detail-modal');
  const content = document.getElementById('modal-content');

  const isSynth = card.isSynthesis;
  const element = card.element || { color: 'bg-gray-600', symbol: '?', number: '합성', name: '합성물', englishName: 'Synthesis', category: '합성물' };
  const elementColor = element.color || 'bg-gray-700';
  const displayName = card.name || element.name;
  const displaySymbol = isSynth ? card.name : element.symbol;
  const displayNumber = isSynth ? '합성' : (element.symbol + ' 원소');
  const displayCategory = isSynth ? '합성물' : (element.category || '원소');
  const displayDescription = isSynth ? '여러 원소가 합쳐진 카드입니다.' : (element.description || '정보 없음');
  const displayEnglishName = isSynth ? 'Synthesis' : (element.englishName || displayName);

  let specialAbilitiesHtml = '';
  const unlockedAbilities = card.getAllUnlockedSpecialAbilities();

  if (unlockedAbilities.length > 0) {
    specialAbilitiesHtml = `
      <div class="mt-3 bg-yellow-900 bg-opacity-50 p-2 rounded-lg">
        <h4 class="font-bold text-yellow-400 mb-1">특수 능력</h4>
        <ul class="list-disc pl-5 text-sm">
          ${unlockedAbilities.map(ability => `
            <li>[Lv ${ability.level}] ${ability.name || '능력'}: ${ability.description}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  let effectsHtml = '';
  if (card.effects && card.effects.length > 0) {
    const activeEffects = card.effects.filter(e => (e.duration !== undefined && e.duration > 0) || e.permanent === true);
    if (activeEffects.length > 0) {
      effectsHtml = `
        <div class="mt-3 bg-purple-900 bg-opacity-50 p-2 rounded-lg">
          <h4 class="font-bold text-purple-400 mb-1">현재 효과</h4>
          <ul class="list-disc pl-5 text-sm">
            ${activeEffects.map(e => `
              <li>${e.description || e.name}
                ${e.duration !== undefined && !e.permanent ? ` (${e.duration}턴 남음)` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
  }

  let upgradeHtml = '';
  if (card.upgradeLevel > 0) {
    upgradeHtml = `
      <div class="mt-3 bg-blue-900 bg-opacity-50 p-2 rounded-lg">
        <h4 class="font-bold text-blue-400 mb-1">업그레이드</h4>
        <p class="text-sm">레벨 ${card.upgradeLevel}</p>
      </div>
    `;
  }

  let synthesisHtml = '';
  if (isSynth && card.components && card.components.length > 0) {
    const componentDisplayList = [];
    const elementCounts = {};
    card.components.forEach(comp => {
      const element = comp.originalElement || comp.element;
      if (element && element.symbol) {
        const symbol = element.symbol;
        elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
      }
    });

    const currentElementCounts = { ...elementCounts };
    const sortedReactions = gameState.reactionsData && Array.isArray(gameState.reactionsData) 
      ? [...gameState.reactionsData].sort((a, b) => b.elements.length - a.elements.length)
      : [];

    let moleculeFound;
    do {
      moleculeFound = false;
      for (const reaction of sortedReactions) {
        if (!reaction.result || reaction.elements.length < 2) continue;

        const required = {};
        let canForm = true;
        for (const elementId of reaction.elements) {
          const el = getElementByNumber(elementId);
          if (!el) { canForm = false; break; }
          required[el.symbol] = (required[el.symbol] || 0) + 1;
        }
        if (!canForm) continue;

        let tempCanForm = true;
        for (const [symbol, count] of Object.entries(required)) {
          if (!currentElementCounts[symbol] || currentElementCounts[symbol] < count) {
            tempCanForm = false;
            break;
          }
        }

        if (tempCanForm) {
          componentDisplayList.push(reaction.result);
          for (const [symbol, count] of Object.entries(required)) {
            currentElementCounts[symbol] -= count;
            if (currentElementCounts[symbol] === 0) {
              delete currentElementCounts[symbol];
            }
          }
          moleculeFound = true;
          break;
        }
      }
    } while (moleculeFound);

    for (const [symbol, count] of Object.entries(currentElementCounts)) {
      if (count > 0) {
        const elData = getElementBySymbol(symbol);
        const name = elData ? elData.name : symbol;
        componentDisplayList.push(`${name}${count > 1 ? ` x${count}` : ''}`);
      }
    }

    componentDisplayList.sort();

    synthesisHtml = `
      <div class="mt-3 bg-teal-900 bg-opacity-50 p-2 rounded-lg">
        <h4 class="font-bold text-teal-400 mb-1">합성 요소</h4>
        <ul class="list-disc pl-5 text-sm">
          ${componentDisplayList.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="text-center mb-4">
      <div class="mx-auto mb-3 ${elementColor} text-white rounded-lg w-32 h-40 p-3 flex flex-col items-center justify-between">
        <div class="text-center">
          <div class="text-2xl font-bold">${displaySymbol}</div>
          <div class="text-lg">${displayNumber}</div>
          <div class="text-base">${displayName}</div>
        </div>
        <div class="w-full">
          <div class="w-full bg-gray-800 rounded-full h-2 mb-1">
            <div class="bg-red-500 h-2 rounded-full" style="width: ${(card.getHealthRatio && typeof card.getHealthRatio === 'function' ? card.getHealthRatio() : ((card.hp && card.maxHp) ? (card.hp / card.maxHp) : 1)) * 100}%"></div>
          </div>
          <div class="flex justify-between text-sm">
            <div>❤️${window.formatNumber ? window.formatNumber(card.hp || 0) : (card.hp || 0)}/${window.formatNumber ? window.formatNumber(card.maxHp || 0) : (card.maxHp || 0)}</div>
            <div>⚔️${window.formatNumber ? window.formatNumber(card.atk || 0) : (card.atk || 0)}</div>
          </div>
        </div>
      </div>
      <h3 class="text-xl font-bold">${displayEnglishName}</h3>
      <p class="text-gray-400">${displayCategory}</p>
    </div>

    <div class="mb-3">
      <h4 class="font-bold text-yellow-400 mb-1">설명</h4>
      <p>${displayDescription}</p>
    </div>

    ${!isSynth && element.number ? `
    <div>
      <h4 class="font-bold text-green-400 mb-1">화학 반응</h4>
      <ul class="list-disc pl-5 text-sm">
        ${getReactionsList(element.number)}
      </ul>
    </div>` : ''}

    ${specialAbilitiesHtml}
    ${effectsHtml}
    ${upgradeHtml}
    ${synthesisHtml}
    
    ${!isSynth && element.number ? `
    <div class="mt-4 bg-purple-900 bg-opacity-50 p-3 rounded-lg">
      <h4 class="font-bold text-purple-400 mb-2">🌟 별 성장 기여도</h4>
      <div class="text-sm text-gray-300">
        ${getStarGrowthContribution(element.symbol)}
      </div>
      <button id="use-for-star-growth" class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm">
        별 성장에 사용하기
      </button>
    </div>` : ''}
  `;

  modal.classList.remove('hidden');
  
  // 별 성장 버튼 이벤트 리스너 추가
  const starGrowthBtn = document.getElementById('use-for-star-growth');
  if (starGrowthBtn && !isSynth && element.number) {
    starGrowthBtn.addEventListener('click', () => {
      if (window.starManagement) {
        const expGained = window.starManagement.growStarWithElements(element.symbol, 1);
        if (expGained > 0) {
          showMessage(`🌟 ${element.symbol} 원소로 별이 성장했습니다! (+${expGained} 경험치)`, 'star');
          modal.classList.add('hidden');
        }
      } else {
        showMessage('별 관리 시스템을 사용할 수 없습니다.', 'error');
      }
    });
  }
}

function hideCardDetailModal() {
  const modal = document.getElementById('card-detail-modal');
  modal.classList.add('hidden');
}

// 별 성장 기여도 정보 반환
function getStarGrowthContribution(elementSymbol) {
  if (['Li', 'Be', 'Na', 'Mg', 'Al'].includes(elementSymbol)) {
    return `🌱 경금속류 - +1 경험치`;
  } else if (['Si', 'P', 'S', 'Ca'].includes(elementSymbol)) {
    return `⚙️ 중금속류 - +5 경험치`;
  } else if (['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe'].includes(elementSymbol)) {
    return `💣 철족 금속류 - +30 경험치`;
  } else {
    return `일반 원소 - 별 성장에 기여하지 않음`;
  }
}

function showCardUpgradeModal(card, laneIndex, side) {
  const modal = document.getElementById('card-upgrade-modal');
  const cardDisplay = document.getElementById('upgrade-card-display');
  const effectDescription = document.getElementById('upgrade-effect-description');
  const upgradeCostEl = document.getElementById('upgrade-cost');
  const currentLevelEl = document.getElementById('current-level');
  const confirmBtn = document.getElementById('confirm-upgrade-btn');
  const cancelBtn = document.getElementById('cancel-upgrade-btn');

  cardDisplay.innerHTML = '';
  const cardElement = createCardElement(card, false);
  cardDisplay.appendChild(cardElement);

  const cardLevel = card.upgradeLevel || 0;
  const nextLevel = cardLevel + 1;
  const cost = calculateUpgradeCost(card);
  const { hpIncrease, atkIncrease } = calculateUpgradeStats(cardLevel);

  effectDescription.innerHTML = `
    <p>레벨 ${cardLevel} → ${nextLevel}</p>
    <p>공격력 +${atkIncrease}</p>
    <p>체력 +${hpIncrease}</p>
    ${getUpcomingAbilityUnlockText(card, nextLevel)}
  `;

  upgradeCostEl.textContent = cost;
  currentLevelEl.textContent = cardLevel;

  const canAfford = getCoinAmount('player') >= cost;
  const maxLevelReached = cardLevel >= (card.isSynthesis ? moleculeUpgrades[card.moleculeId]?.maxLevel : elementUpgrades[card.element.symbol]?.maxLevel || 10);

  confirmBtn.disabled = !canAfford || maxLevelReached;
  if (maxLevelReached) {
    confirmBtn.textContent = '최대 레벨';
    effectDescription.innerHTML += `<p class="text-yellow-400 mt-2">최대 레벨에 도달했습니다.</p>`;
  } else if (!canAfford) {
    confirmBtn.textContent = `강화하기 (코인 부족)`;
  } else {
    confirmBtn.textContent = `강화하기`;
  }

  confirmBtn.onclick = () => {
    const currentCost = calculateUpgradeCost(card);
    if (spendCoins(currentCost, 'player')) {
      const success = upgradeCard(card, 'battlefield');
      if (success) {
        renderBattlefield();
        modal.classList.add('hidden');
      } else {
        addCoins(currentCost, 'player');
        showMessage('카드 강화 중 오류 발생', 'error');
      }
    } else {
      showMessage('카드를 강화하기 위한 코인이 부족합니다.', 'error');
      confirmBtn.disabled = true;
      confirmBtn.textContent = `강화하기 (코인 부족)`;
    }
  };

  cancelBtn.onclick = () => {
    modal.classList.add('hidden');
  };

  modal.classList.remove('hidden');
}

function getUpcomingAbilityUnlockText(card, nextLevel) {
  const cardData = card.isSynthesis ? moleculeUpgrades[card.moleculeId] : elementUpgrades[card.element.symbol];
  if (!cardData || !cardData.specialAbilities) return '';

  const upcomingAbilityLevel = Object.keys(cardData.specialAbilities)
                                    .map(Number)
                                    .find(level => level === nextLevel);

  if (upcomingAbilityLevel) {
    const ability = cardData.specialAbilities[upcomingAbilityLevel];
    return `<p class="text-green-400 mt-1">다음 레벨 특수 능력: ${ability.name}</p>`;
  }
  return '';
}

function calculateUpgradeStats(currentLevel) {
  // JSON 데이터에서 업그레이드 스탯 정보 가져오기
  let hpIncrease = 10;
  let atkIncrease = 8;

  if (gameState.cardStatsData && gameState.cardStatsData.upgradeStats) {
    const upgradeStats = gameState.cardStatsData.upgradeStats;
    hpIncrease = upgradeStats.hpIncreasePerLevel || 10;
    atkIncrease = upgradeStats.atkIncreasePerLevel || 8;
  }

  return { hpIncrease, atkIncrease };
}

function calculateUpgradeCost(card) {
  const level = card.upgradeLevel || 0;
  const cardData = card.isSynthesis ? moleculeUpgrades[card.moleculeId] : elementUpgrades[card.element.symbol];

  if (!cardData) {
    console.error("Upgrade data not found for card:", card);
    return 99999;
  }

  // JSON 데이터에서 업그레이드 비용 정보 가져오기
  let baseCost = 10;
  let costMultiplier = 1.5;
  let rarityMultiplier = 1.0;

  if (gameState.cardStatsData && gameState.cardStatsData.upgradeStats) {
    const upgradeStats = gameState.cardStatsData.upgradeStats;
    baseCost = upgradeStats.baseUpgradeCost || 10;
    costMultiplier = upgradeStats.costMultiplier || 1.5;
  }

  // 희귀도 배수는 JSON 데이터에서 가져오기
  if (gameState.cardStatsData && gameState.cardStatsData.rarityMultipliers) {
    const rarityMultipliers = gameState.cardStatsData.rarityMultipliers;
    rarityMultiplier = rarityMultipliers[card.rarity] || 1.0;
  } else {
    // 폴백: 기본 희귀도 배수
    rarityMultiplier = { common: 1.0, uncommon: 1.1, rare: 1.2, epic: 1.4, legendary: 1.6 }[card.rarity] || 1.0;
  }

  const effectiveMultiplier = costMultiplier * rarityMultiplier;

  return Math.floor(baseCost * Math.pow(effectiveMultiplier + level * 0.15, level + 1));
}

// 서버에서 받은 카드 객체를 ElementCard 인스턴스로 복원하는 함수
function restoreCardFromServer(cardData) {
  if (!cardData) return null;
  
  // 이미 ElementCard 인스턴스인 경우 그대로 반환
  if (cardData instanceof ElementCard) {
    return cardData;
  }
  
  // 일반 객체인 경우 ElementCard 인스턴스로 변환
  const element = cardData.element || {};
  const card = new ElementCard(element, cardData.hp || 0, cardData.atk || 0);
  
  // 모든 속성 복사
  Object.keys(cardData).forEach(key => {
    if (key !== 'id' && cardData[key] !== undefined) {
      card[key] = cardData[key];
    }
  });
  
  // ID는 새로 생성된 것을 유지하거나 기존 ID 사용
  if (cardData.id) {
    card.id = cardData.id;
  }
  
  console.log(`카드 복원 완료: ${card.name} (ID: ${card.id})`);
  return card;
}

// 주요 함수들 export (실제로 정의된 함수들만)
export {
  calculateUpgradeStats,
  restoreCardFromServer,
  createCardElement,
  addCardToHand
};

// Export functions for module imports
export {
  addCardToHand,
  calculateUpgradeStats,
  restoreCardFromServer,
  getStarGrowthContribution
};

// 전역 함수로 노출 (기존 코드와의 호환성을 위해)
window.calculateUpgradeStats = calculateUpgradeStats;
window.restoreCardFromServer = restoreCardFromServer;
window.addCardToHand = addCardToHand;
