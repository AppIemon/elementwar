class ElementCard {
  constructor(element, hp, atk) {
    this.element = element;
    this.hp = hp;
    this.maxHp = hp;
    this.originalMaxHp = hp; // Store original max HP for coin reward
    this.atk = atk;
    this.maxAtk = atk; // Consider adding originalMaxAtk if needed
    this.id = Math.random().toString(36).substring(2, 9);
    this.effects = [];
    this.armor = 0;
    this.lastDamageTurn = 0;
    this.upgradeLevel = 0;
    this.owner = null; // Track owner ('player' or 'computer')

    this.rarity = (element && element.rarity) || 'common';

    // Synthesis properties
    this.isSynthesis = false;
    this.components = [];
    this.name = (element && element.name) || 'Unknown';
    this.moleculeId = null; // Store molecule ID if it's a synthesis card
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
  // 현재까지 발견된 최상위 원소 번호의 절반까지만 등장
  const maxDiscovered = (typeof getMaxDiscoveredElementNumber === 'function') ? getMaxDiscoveredElementNumber() : 1;
  // 최소 cap을 2로 설정하여 H, He 모두 나올 수 있도록 함
  const cap = Math.max(2, Math.floor(maxDiscovered / 2));
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
}

function createCardElement(card, isInHand = true) {
  const cardElement = document.createElement('div');

  const isSynth = card.isSynthesis;
  const isMolecule = card.type === 'molecule';
  const element = card.element || {};
  
  let displaySymbol, displayNumber, displayName;
  
  // 카드 타입을 더 정확하게 판별
  if (isMolecule || card.moleculeId) {
    // 분자 카드
    displaySymbol = card.symbol || card.name || '?';
    displayNumber = '분자';
    displayName = card.name || '분자';
  } else if (isSynth || card.components) {
    // 합성물 카드
    displaySymbol = card.name || '합성물';
    displayNumber = '합성';
    displayName = card.name || '합성물';
  } else {
    // 일반 원소 카드
    displaySymbol = element.symbol || '?';
    displayNumber = element.number ? element.number + '번' : '';
    displayName = element.name || '카드';
  }

  let backgroundStyle = element?.color || 'bg-gray-700';
  if (isMolecule) {
    backgroundStyle = `${card.color || 'bg-purple-600'} molecule-flashy`;
  } else if (isSynth) {
    backgroundStyle = 'synthesis-card';
  }

  cardElement.className = `card h-32 w-24 ${backgroundStyle} rounded-lg shadow-lg flex flex-col items-center justify-between p-2 text-white relative`;
  cardElement.setAttribute('data-card-id', card.id);
  cardElement.id = card.id;

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

  cardElement.innerHTML = `
    <div class="electron-orbits"></div>
    <div class="text-center relative z-10">
      <div class="text-sm font-bold">${displaySymbol}</div>
      <div class="text-xs">${displayNumber}</div>
      <div class="text-xs mt-1">${displayName}</div>
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
  const displayNumber = isSynth ? '합성' : (element.number + '번');
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
  `;

  modal.classList.remove('hidden');
}

function hideCardDetailModal() {
  const modal = document.getElementById('card-detail-modal');
  modal.classList.add('hidden');
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

// 전역 함수로 노출
window.calculateUpgradeStats = calculateUpgradeStats;
