function initUI() {
  updateCoinDisplay();
}

function renderPlayerHand() {
  const handElement = document.getElementById('player-hand');
  if (!handElement) return;

  handElement.innerHTML = ''; // Clear current hand display

  // 인벤토리 맨 왼쪽: 화학 합성실 인라인 버튼
  const chemInline = document.createElement('div');
  chemInline.id = 'chem-lab-dropzone-inline';
  chemInline.title = '화학 합성실 열기';
  chemInline.className = 'relative group h-32 w-24 mr-2 rounded border-2 border-solid border-green-500/80 bg-gray-900/60 flex items-center justify-center shadow-lg ring-2 ring-green-400/40 cursor-pointer hover:bg-gray-800/60';
  chemInline.innerHTML = `
    <div class="absolute -top-2 -left-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded">합성</div>
    <div class="chem-lab-empty text-center text-[11px] text-green-300 leading-tight pointer-events-none">
      화학 합성실
      <div class="text-[10px] opacity-80 mt-1">(클릭하여 열기)</div>
    </div>
    <div class="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900/95 text-gray-200 text-xs rounded px-2 py-1 w-44 shadow-xl z-10">
      화학 합성실을 열어 원소를 합성하세요.
    </div>
    <div class="absolute -bottom-2 -left-2 right-0 flex justify-between gap-1">
      <button id="chem-lab-clear-inline" class="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-[10px]">비우기</button>
      <button id="chem-lab-synthesize-inline" class="px-1.5 py-0.5 bg-green-700 hover:bg-green-600 rounded text-[10px] font-bold">배합</button>
    </div>`;
  handElement.appendChild(chemInline);

  // 인라인 화학 합성실 관리 객체 (간단 상태 + 버튼 바인딩)
  if (!window.inlineChemLab) {
    window.inlineChemLab = {
      selection: [],
      addCard(card, fromHand = true) {
        if (!card || card.isSkull || !card.element) {
          showMessage('원소 카드만 합성실에 넣을 수 있습니다.', 'warning');
          return false;
        }
        if (!gameState.fusionSystem) {
          gameState.fusionSystem = { materials: {}, energy: 0, heat: 0, stars: 0 };
        }
        if (!gameState.fusionSystem.materials) {
          gameState.fusionSystem.materials = {};
        }
        if (fromHand) {
          const idx = gameState.playerHand.findIndex(c => c.id === card.id);
          if (idx !== -1) gameState.playerHand.splice(idx, 1);
          renderPlayerHand();
        }
        this.selection.push(card);
        this.render();
        return true;
      },
      clear(returnToHand = true) {
        if (returnToHand) {
          this.selection.forEach(c => gameState.playerHand.push(c));
        }
        this.selection = [];
        renderPlayerHand();
        this.render();
      },
      synthesize() {
        if (this.selection.length < 1) {
          showMessage('최소 1개의 원소 카드를 담아야 합니다.', 'warning');
          return;
        }
        const use2 = this.selection.length === 2;
        const tryCreate2 = (typeof window.createMoleculeFromElements === 'function') ? window.createMoleculeFromElements : (typeof createMoleculeFromElements === 'function' ? createMoleculeFromElements : null);
        const tryCreateN = (typeof window.createMoleculeFromMultipleElements === 'function') ? window.createMoleculeFromMultipleElements : (typeof createMoleculeFromMultipleElements === 'function' ? createMoleculeFromMultipleElements : null);
        let newMoleculeCard = null;
        if (use2 && tryCreate2) newMoleculeCard = tryCreate2(this.selection[0], this.selection[1]);
        else if (!use2 && tryCreateN) newMoleculeCard = tryCreateN(this.selection);
        if (!newMoleculeCard) {
          showMessage('해당 조합으로 만들 수 있는 분자가 없습니다.', 'error');
          return;
        }
        // 인벤토리에 적립 (fusionSystem 재료 맵 사용 시)
        if (!gameState.fusionSystem) gameState.fusionSystem = { materials: {}, energy: 0, heat: 0, stars: 0 };
        if (!gameState.fusionSystem.materials) gameState.fusionSystem.materials = {};
        const molId = newMoleculeCard.id || (newMoleculeCard.formula?.toLowerCase?.() || newMoleculeCard.symbol?.toLowerCase?.());
        if (molId) {
        	const before = gameState.fusionSystem.materials[molId] || 0;
        	gameState.fusionSystem.materials[molId] = before + 1;
        	console.log(`[inlineChemLab.synthesize] 인벤토리 적립: molId=${molId}, 이전=${before}, 이후=${gameState.fusionSystem.materials[molId]}`);
        	
        	// 분자 카드를 손패에 추가
        	if (typeof addCardToHand === 'function') {
        		addCardToHand(newMoleculeCard, 'player');
        		console.log(`[inlineChemLab.synthesize] 분자 카드 손패 추가: ${newMoleculeCard.name}`);
        	}
        } else {
        	console.warn('[inlineChemLab.synthesize] 경고: molId 계산 실패');
        }
        this.selection = [];
        this.render();
        renderPlayerHand();
        if (typeof window.fusionUI?.updateMaterialsDisplay === 'function') {
          try { window.fusionUI.updateMaterialsDisplay(); } catch (e) {}
        }
        if (typeof window.fusionUI?.updateMoleculeSynthesisDisplay === 'function') {
          try { window.fusionUI.updateMoleculeSynthesisDisplay(); } catch (e) {}
        }
        showMessage(`${newMoleculeCard.name || newMoleculeCard.symbol || '분자'}가 인벤토리에 추가되었습니다.`, 'success');
        try { if (typeof window.showMoleculeAnimation === 'function') window.showMoleculeAnimation((newMoleculeCard.symbol || newMoleculeCard.formula || '').toString(), (newMoleculeCard.elements||[]).map(n=>gameState.elementsData?.find(e=>e.number===n)?.symbol).filter(Boolean)); } catch(e) {}
      },
      render() {
        const dz = document.getElementById('chem-lab-dropzone-inline');
        if (!dz) return;
        dz.querySelectorAll('.chem-chip').forEach(el => el.remove());
        const empty = dz.querySelector('.chem-lab-empty');
        if (this.selection.length === 0) { empty?.classList.remove('hidden'); return; }
        empty?.classList.add('hidden');
        const counts = new Map();
        this.selection.forEach(c => {
          const sym = c?.element?.symbol || c?.name || '카드';
          counts.set(sym, (counts.get(sym) || 0) + 1);
        });
        Array.from(counts.entries()).forEach(([label, cnt]) => {
          const chip = document.createElement('div');
          chip.className = 'chem-chip px-2 py-1 rounded bg-gray-700 text-gray-100 text-xs border border-gray-500 flex items-center gap-1';
          chip.innerHTML = `
            <span>${label} ×${cnt}</span>
            <button class="chem-remove-btn text-red-400 hover:text-red-300 hover:bg-red-800/30 px-1 rounded" 
                    data-element="${label}" title="제거">
              −
            </button>
          `;
          dz.appendChild(chip);
          
          // 제거 버튼 이벤트 리스너
          const removeBtn = chip.querySelector('.chem-remove-btn');
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeElement(label);
          });
        });
      },
      removeElement(elementSymbol) {
        // 해당 원소를 하나 제거
        const index = this.selection.findIndex(c => 
          (c?.element?.symbol || c?.name || '카드') === elementSymbol
        );
        if (index !== -1) {
          const removedCard = this.selection.splice(index, 1)[0];
          // 제거된 카드를 손패에 다시 추가
          gameState.playerHand.push(removedCard);
          renderPlayerHand();
          this.render();
        }
      }
    };
  }

  // 인라인 합성실 버튼 바인딩 (비우기/배합)
  bindInlineChemLabButtons();

  // Group cards by element symbol and count them
  const cardGroups = {};
  gameState.playerHand.forEach(card => {
    // 분자 카드와 원소 카드를 구분하여 키 생성
    let key;
    if (card.type === 'molecule' || card.moleculeId) {
      key = `molecule_${card.name || card.symbol || card.formula || '분자'}`;
    } else if (card.isSynthesis || card.components) {
      key = `synthesis_${card.name || '합성물'}`;
    } else {
      key = `element_${card.element?.symbol || card.name || '카드'}`;
    }
    
    if (!cardGroups[key]) {
      cardGroups[key] = {
        cards: [],
        count: 0,
        isSynthesis: card.isSynthesis,
        element: card.element,
        name: card.name,
        type: card.type,
        symbol: card.element?.symbol || card.symbol
      };
    }
    cardGroups[key].cards.push(card);
    cardGroups[key].count++;
  });

  // Render grouped cards
  Object.values(cardGroups).forEach(group => {
    const cardElement = createCardElement(group.cards[0], true); // Use first card as template
    
    // Add count display if more than 1
    if (group.count > 1) {
      const countElement = document.createElement('div');
      countElement.className = 'absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-20';
      countElement.textContent = group.count;
      cardElement.appendChild(countElement);
    }

    // Add + button for element cards to add to chem lab
    if (group.element && !group.isSynthesis && group.type !== 'molecule') {
      const addButton = document.createElement('button');
      addButton.className = 'absolute -top-2 -left-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-20 transition-colors';
      addButton.textContent = '+';
      addButton.title = '화학 합성실에 추가';
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.inlineChemLab) {
          window.inlineChemLab.addCard(group.cards[0], true);
        }
      });
      cardElement.appendChild(addButton);
    }

    // Add click listener for card detail
    cardElement.addEventListener('click', (event) => {
        // Prevent triggering click during drag
        if (cardElement.classList.contains('dragging')) return;
        event.stopPropagation(); // Prevent event bubbling

        const card = group.cards[0]; // Use first card for detail
        if (card && !card.isSkull) {
            showCardDetail(card);
        }
    });

    // Add visual hint for click
    cardElement.style.cursor = 'pointer';
    cardElement.title = '클릭: 카드 상세보기';

    handElement.appendChild(cardElement);
  });

  // Re-setup drag and drop for new cards
  if (typeof setupHandCardsDraggable === 'function') {
    setupHandCardsDraggable();
  }

  // 화학 합성실 클릭 이벤트 추가
  chemInline.addEventListener('click', () => {
    if (typeof window.fusionUI !== 'undefined' && window.fusionUI.showFusionModal) {
      window.fusionUI.showFusionModal();
    }
  });
}

// 인라인 합성실 버튼 바인딩 유틸리티
function bindInlineChemLabButtons() {
  const clearBtn = document.getElementById('chem-lab-clear-inline');
  const synthBtn = document.getElementById('chem-lab-synthesize-inline');
  if (clearBtn) clearBtn.onclick = () => window.inlineChemLab?.clear(true);
  if (synthBtn) synthBtn.onclick = () => window.inlineChemLab?.synthesize();
}

function showMessage(message, type = 'info') {
  const resultMessage = document.getElementById('result-message');
  resultMessage.textContent = message;
  
  let colorClass = 'text-blue-400';
  
  switch (type) {
    case 'success':
      colorClass = 'text-green-400';
      break;
    case 'error':
      colorClass = 'text-red-400';
      break;
    case 'warning':
      colorClass = 'text-yellow-400';
      break;
    case 'energy':
      colorClass = 'text-orange-400';
      break;
  }
  
  resultMessage.className = `text-center text-xl font-bold h-12 ${colorClass}`;
}

let currentMoleculeIndex = 0;
let possibleMoleculesList = [];
let sourceCardForMolecule = null; // Keep track of the card that triggered the modal

// --- Molecule Viewer Logic ---
let currentMoleculeReactions = []; // Store all reactions for the current molecule ID
let currentReactionIndex = 0; // Index of the reaction being displayed

// Updated function to display a specific reaction by index
function updateMoleculeViewerDisplay(moleculeId, reactionIndex) {
    const modal = document.getElementById('molecule-viewer-modal');
    const content = document.getElementById('molecule-viewer-content');
    const prevBtn = document.getElementById('prev-molecule');
    const nextBtn = document.getElementById('next-molecule');

    // Find all reactions that produce this moleculeId
    currentMoleculeReactions = gameState.reactionsData && Array.isArray(gameState.reactionsData) 
      ? gameState.reactionsData.filter(r => r.moleculeId === moleculeId)
      : [];

    if (currentMoleculeReactions.length === 0) {
        content.innerHTML = `<p class="text-red-400">해당 분자(${moleculeId})에 대한 반응 정보를 찾을 수 없습니다.</p>`;
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        return;
    }

    // Clamp the index
    currentReactionIndex = Math.max(0, Math.min(reactionIndex, currentMoleculeReactions.length - 1));

    const reaction = currentMoleculeReactions[currentReactionIndex];
    const elementsNeeded = reaction.elements.map(num => {
        const el = getElementByNumber(num);
        return el ? `<span class="font-bold ${el.color.replace('bg-', 'text-')}">${el.symbol}</span>` : '?';
    }).join(' + ');

    content.innerHTML = `
        <h3 class="text-xl font-bold text-purple-300 mb-2">${reaction.result} (${reaction.moleculeName})</h3>
        <p class="mb-1"><span class="font-semibold text-gray-400">ID:</span> ${reaction.id}</p>
        <p class="mb-1"><span class="font-semibold text-gray-400">필요 원소:</span> ${elementsNeeded}</p>
        <p class="mb-3"><span class="font-semibold text-gray-400">효과 타입:</span> ${reaction.effect.type}</p>
        <div class="bg-gray-700 p-2 rounded">
            <p class="text-sm"><span class="font-semibold">값:</span> ${reaction.effect.value}</p>
            ${reaction.effect.duration ? `<p class="text-sm"><span class="font-semibold">지속시간:</span> ${reaction.effect.duration} 턴</p>` : ''}
            ${Object.entries(reaction.effect).filter(([key]) => !['type', 'value', 'duration'].includes(key)).map(([key, val]) => `<p class="text-sm"><span class="font-semibold">${key}:</span> ${val}</p>`).join('')}
        </div>
        <p class="text-xs text-gray-500 mt-3">반응 ${currentReactionIndex + 1} / ${currentMoleculeReactions.length}</p>
    `;

    // Show/hide navigation buttons
    prevBtn.style.display = currentMoleculeReactions.length > 1 ? 'block' : 'none';
    nextBtn.style.display = currentMoleculeReactions.length > 1 ? 'block' : 'none';

    modal.classList.remove('hidden');
}

function showMoleculeViewer(moleculeId) {
    updateMoleculeViewerDisplay(moleculeId, 0); // Start with the first reaction
}

function showNextMolecule() {
    if (currentMoleculeReactions.length === 0) return;
    const nextIndex = (currentReactionIndex + 1) % currentMoleculeReactions.length;
    updateMoleculeViewerDisplay(currentMoleculeReactions[0].moleculeId, nextIndex); // Use moleculeId from current data
}

function showPrevMolecule() {
    if (currentMoleculeReactions.length === 0) return;
    const prevIndex = (currentReactionIndex - 1 + currentMoleculeReactions.length) % currentMoleculeReactions.length;
    updateMoleculeViewerDisplay(currentMoleculeReactions[0].moleculeId, prevIndex); // Use moleculeId from current data
}

// --- End Molecule Viewer Logic ---

// 분자 생성 가능성 모달 표시
function showMoleculePossibilitiesModal(card, molecules) {
    if (!molecules || molecules.length === 0) return;

    const modal = document.getElementById('molecule-viewer-modal');
    const content = document.getElementById('molecule-viewer-content');
    const prevBtn = document.getElementById('prev-molecule');
    const nextBtn = document.getElementById('next-molecule');
    const closeBtn = document.getElementById('close-molecule-viewer');

    possibleMoleculesList = molecules;
    currentMoleculeIndex = 0;
    sourceCardForMolecule = card; // Store the source card

    updateMoleculeViewerDisplay(); // Initial display

    // --- Event Listeners ---
    // Use .onclick to easily overwrite previous listeners if modal is reused
    prevBtn.onclick = () => {
        if (currentMoleculeIndex > 0) {
            currentMoleculeIndex--;
            updateMoleculeViewerDisplay();
        }
    };

    nextBtn.onclick = () => {
        if (currentMoleculeIndex < possibleMoleculesList.length - 1) {
            currentMoleculeIndex++;
            updateMoleculeViewerDisplay();
        }
    };

    closeBtn.onclick = () => {
        modal.classList.add('hidden');
        // Clear listeners and data
        prevBtn.onclick = null;
        nextBtn.onclick = null;
        closeBtn.onclick = null;
        possibleMoleculesList = [];
        sourceCardForMolecule = null;
    };

    modal.classList.remove('hidden');
}

// Placeholder for manual synthesis function (implement in molecules.js or game.js)
function attemptManualSynthesis(sourceCard, reaction) {
    console.log("Attempting manual synthesis for:", sourceCard.name, "using reaction:", reaction.result);
    // 1. Check cost
    const cost = reaction.cost || 0;
    if (getCoinAmount('player') < cost) {
        showMessage('코인이 부족하여 수동 합성할 수 없습니다.', 'error');
        return;
    }

    // 2. Check if elements are actually present in sourceCard (including components if it's already a synthesis)
    const availableElements = {};
    if (sourceCard.isSynthesis && sourceCard.components) {
        sourceCard.components.forEach(comp => {
            const element = comp.originalElement || comp.element;
            if (element && element.symbol) {
                availableElements[element.symbol] = (availableElements[element.symbol] || 0) + 1;
            }
        });
    } else if (sourceCard.element) {
         availableElements[sourceCard.element.symbol] = 1;
    }

    let canSynthesize = true;
    const required = {};
     for (const elementId of reaction.elements) {
        const el = getElementByNumber(elementId);
        if (!el) {
            console.error(`Element data not found for ID: ${elementId}`);
            canSynthesize = false;
            break;
        }
        required[el.symbol] = (required[el.symbol] || 0) + 1;
    }

    if (canSynthesize) {
        for (const [symbol, count] of Object.entries(required)) {
            if (!availableElements[symbol] || availableElements[symbol] < count) {
                console.log(`Missing element: Need ${count} of ${symbol}, have ${availableElements[symbol] || 0}`);
                canSynthesize = false;
                break;
            }
        }
    }

    if (!canSynthesize) {
         showMessage('합성에 필요한 원소가 부족합니다.', 'error');
         return;
    }

    // 3. Perform synthesis
    spendCoins(cost, 'player');
    // Use createMoleculeFromReaction (assuming it exists and returns an ElementCard)
    const moleculeCard = createMoleculeFromReaction(reaction);
    if (moleculeCard) {
        // Calculate stats based on source card components
        let finalHp = 0;
        let finalAtk = 0;
        const finalComponents = []; // Store simplified component info

        if (sourceCard.isSynthesis && sourceCard.components) {
            sourceCard.components.forEach(comp => {
                 const element = comp.originalElement || comp.element;
                 finalHp += comp.originalHp || element?.baseHp || 0;
                 finalAtk += comp.originalAtk || element?.baseAtk || 0;
                 // Store simplified data for the new molecule's components
                 finalComponents.push({
                     id: comp.id,
                     element: element, // Keep full element data if needed later
                     originalHp: comp.originalHp || element?.baseHp || 0,
                     originalAtk: comp.originalAtk || element?.baseAtk || 0,
                     rarity: comp.rarity || element?.rarity || 'common'
                 });
            });
        } else if (sourceCard.element) {
            // If the source was a single element card
            finalHp = sourceCard.maxHp;
            finalAtk = sourceCard.atk;
            finalComponents.push({
                id: sourceCard.id,
                element: sourceCard.element,
                originalHp: sourceCard.maxHp,
                originalAtk: sourceCard.atk,
                rarity: sourceCard.rarity
            });
        }

        // Assign calculated stats and properties to the new molecule card
        moleculeCard.hp = finalHp;
        moleculeCard.maxHp = finalHp;
        moleculeCard.atk = finalAtk;
        moleculeCard.owner = sourceCard.owner;
        moleculeCard.components = finalComponents; // Store combined components
        moleculeCard.isSynthesis = true; // Mark as synthesis
        moleculeCard.name = generateSynthesisName(moleculeCard.components); // Generate name like H₂O+Na₂
        moleculeCard.rarity = finalComponents.reduce((highest, comp) => { // Calculate rarity
             const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
             const currentRarity = comp.rarity || 'common';
             const highestRarity = highest || 'common';
             return (rarityOrder[currentRarity] > rarityOrder[highestRarity]) ? currentRarity : highestRarity;
        }, 'common');


        // Replace card on battlefield
        const laneIndex = findCardLaneIndex(sourceCard.id, sourceCard.owner);
        if (laneIndex !== -1) {
            battlefield.lanes[laneIndex][sourceCard.owner] = moleculeCard;
            showMessage(`${moleculeCard.name} 분자를 수동으로 합성했습니다!`, 'success');
            // Optional: Add synthesis animation
            // showMoleculeSynthesisAnimation(laneIndex, sourceCard.owner, moleculeCard);
            renderBattlefield();
        } else {
             showMessage('합성 중 오류 발생: 원본 카드를 필드에서 찾을 수 없음', 'error');
             addCoins(cost, 'player'); // Refund cost
        }
    } else {
         showMessage('합성 중 오류 발생: 분자 카드 생성 실패', 'error');
         addCoins(cost, 'player'); // Refund cost
    }
}

// Helper to find lane index of a card (implement in battlefield.js or game.js)
function findCardLaneIndex(cardId, side) {
    for (let i = 0; i < battlefield.lanes.length; i++) {
        if (battlefield.lanes[i][side] && battlefield.lanes[i][side].id === cardId) {
            return i;
        }
    }
    return -1;
}

// --- Upgrade Modal Logic ---
let cardToUpgrade = null;
let upgradeOrigin = null;
let currentUpgradeReactions = [];
let currentUpgradeIndex = 0;

function updateUpgradeReactionDisplay() {
    const viewer = document.getElementById('upgrade-reaction-viewer');
    if (!viewer) return;
    const reaction = currentUpgradeReactions[currentUpgradeIndex];
    const elementsNeeded = reaction.elements.map(num => {
        const el = getElementByNumber(num);
        return el ? `<span class="font-bold ${el.color.replace('bg-', 'text-')}">${el.symbol}</span>` : '?';
    }).join(' + ');

    viewer.querySelector('.reaction-content').innerHTML = `
      <h4 class="text-lg font-semibold">${reaction.result}</h4>
      <p class="text-sm mb-1">필요 원소: ${elementsNeeded}</p>
      <p class="text-sm mb-1">효과: ${reaction.effect.type} ${reaction.effect.value}</p>
    `;

    viewer.querySelector('#prev-upgrade').style.visibility = currentUpgradeIndex > 0 ? 'visible' : 'hidden';
    viewer.querySelector('#next-upgrade').style.visibility = currentUpgradeIndex < currentUpgradeReactions.length - 1 ? 'visible' : 'hidden';
}

function showUpgradeModal(card, origin = 'battlefield') {
    if (!card || card.isSkull) return;
    cardToUpgrade = card; // Store the card
    upgradeOrigin = origin; // Store the origin

    const modal = document.getElementById('card-upgrade-modal');
    const displayArea = document.getElementById('upgrade-card-display');
    const costElement = document.getElementById('upgrade-cost');
    const levelElement = document.getElementById('current-level');
    const effectDescElement = document.getElementById('upgrade-effect-description');
    const confirmBtn = document.getElementById('confirm-upgrade-btn');

    // Clear previous display
    displayArea.innerHTML = '';
    modal.querySelectorAll('.card-description').forEach(el => el.remove());
    document.getElementById('upgrade-reaction-viewer')?.remove();

    // Create a non-draggable copy for display
    const cardElement = createCardElement(card, false);
    cardElement.draggable = false; // Ensure it's not draggable in the modal
    cardElement.classList.remove('cursor-grab');
    displayArea.appendChild(cardElement);

    // Add card description once
    const descHtml = `
      <div class="card-description mb-3 bg-gray-700 p-3 rounded-lg">
        <p>${card.isSynthesis
             ? '여러 원소가 합쳐진 카드입니다.'
             : (card.element.description || '설명 없음')}</p>
      </div>`;
    effectDescElement.insertAdjacentHTML('beforebegin', descHtml);

    // Calculate upgrade cost and effects (using functions from upgrades.js)
    const currentLevel = card.upgradeLevel || 0;
    const cost = calculateUpgradeCost(currentLevel);
    const { hpIncrease, atkIncrease } = calculateUpgradeStats(currentLevel);

    costElement.textContent = cost;
    levelElement.textContent = currentLevel;
    effectDescElement.textContent = `다음 레벨: +${hpIncrease} HP, +${atkIncrease} ATK`;

    // gather matching reactions
    currentUpgradeReactions = gameState.reactionsData && Array.isArray(gameState.reactionsData)
      ? gameState.reactionsData.filter(r => {
          if (card.isSynthesis) return r.elements.every(id => card.components.includes(id));
          return r.elements.includes(card.element.number);
        })
      : [];
    currentUpgradeIndex = 0;

    if (currentUpgradeReactions.length > 0) {
        const viewerHtml = `
          <div id="upgrade-reaction-viewer" class="mt-3 bg-gray-700 p-3 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <button id="prev-upgrade" class="px-2 py-1 bg-gray-600 text-white rounded">&lt;</button>
              <div class="reaction-content"></div>
              <button id="next-upgrade" class="px-2 py-1 bg-gray-600 text-white rounded">&gt;</button>
            </div>
          </div>`;
        effectDescElement.insertAdjacentHTML('afterend', viewerHtml);

        document.getElementById('prev-upgrade').onclick = () => {
            if (currentUpgradeIndex > 0) { currentUpgradeIndex--; updateUpgradeReactionDisplay(); }
        };
        document.getElementById('next-upgrade').onclick = () => {
            if (currentUpgradeIndex < currentUpgradeReactions.length - 1) { currentUpgradeIndex++; updateUpgradeReactionDisplay(); }
        };
        updateUpgradeReactionDisplay();
    }

    // Check if player can afford the upgrade
    if (getCoinAmount('player') < cost) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '코인 부족';
        confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        confirmBtn.classList.remove('hover:bg-yellow-700');
    } else {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '강화하기';
        confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        confirmBtn.classList.add('hover:bg-yellow-700');
    }

    modal.classList.remove('hidden');
}

function hideUpgradeModal() {
    const modal = document.getElementById('card-upgrade-modal');
    modal.querySelectorAll('.card-description, #upgrade-reaction-viewer').forEach(el => el.remove());
    modal.classList.add('hidden');
    cardToUpgrade = null; // Clear the stored card
    upgradeOrigin = null; // Clear origin
    currentUpgradeReactions = [];
    currentUpgradeIndex = 0;
}

// Modify the confirm button listener
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-upgrade-btn');
    const cancelBtn = document.getElementById('cancel-upgrade-btn');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (cardToUpgrade && typeof upgradeCard === 'function') {
                // Pass the origin context to upgradeCard
                const success = upgradeCard(cardToUpgrade, upgradeOrigin);
                if (success) {
                    showMessage(`${cardToUpgrade.name} 강화 완료!`, 'success');
                    // Re-render based on origin
                    if (upgradeOrigin === 'hand') {
                        renderPlayerHand();
                    } else {
                        renderBattlefield();
                    }
                }
                // upgradeCard function should show message on failure
            }
            hideUpgradeModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideUpgradeModal);
    }
});

// 카드 상세 정보 모달 닫기
function hideCardDetail() {
  const modal = document.getElementById('card-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 카드 상세 정보 표시
function showCardDetail(card) {
  const modal = document.getElementById('card-detail-modal');
  const content = document.getElementById('modal-content');

  if (!card || !modal || !content) {
    console.error("Cannot show card detail: Card data or modal elements missing.");
    return;
  }

  // Determine rarity color
  const rarityColorClasses = {
    common: 'text-white',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400'
  };
  const rarityClass = rarityColorClasses[card.rarity || 'common'] || 'text-white';

  // Base card information
  let detailHtml = `
    <div class="flex justify-between items-start mb-3">
      <h2 class="text-2xl font-bold ${rarityClass}">${card.name} ${card.upgradeLevel > 0 ? `<span class="text-yellow-400 text-lg">(+${card.upgradeLevel})</span>` : ''}</h2>
      <span class="text-sm ${rarityClass}">${card.rarity || 'common'}</span>
    </div>
    <div class="flex justify-between text-lg mb-3">
      <span>❤️ ${card.hp} / ${card.maxHp}</span>
      <span>⚔️ ${card.atk}</span>
    </div>
    <p class="text-gray-400 mb-4">${card.element?.description || '합성된 카드입니다.'}</p>
  `;

  // Add Synthesis Information if applicable
  if (card.isSynthesis && card.components && card.components.length > 0) {
    detailHtml += `<div class="bg-gray-700 p-3 rounded-lg mb-4">`;
    detailHtml += `<h3 class="text-lg font-semibold text-purple-300 mb-2">합성 정보</h3>`;

    // Check if it's a specific known molecule
    if (card.reactionId && card.moleculeId) {
         detailHtml += `<p class="mb-1"><span class="font-semibold text-gray-400">분자:</span> ${card.name} (ID: ${card.reactionId})</p>`;
         // Display effect if available
         if (card.effect) {
             detailHtml += `<p class="mb-1"><span class="font-semibold text-gray-400">효과:</span> ${card.effect.type} (값: ${card.effect.value}${card.effect.duration ? `, 지속: ${card.effect.duration}턴` : ''})</p>`;
         }
    } else {
         detailHtml += `<p class="mb-1"><span class="font-semibold text-gray-400">종류:</span> 일반 합성물</p>`;
    }

    // Display base element components
    const componentElements = card.components.map(num => {
        const el = getElementByNumber(num);
        // Use symbol and color if element found
        return el ? `<span class="font-bold ${el.color?.replace('bg-', 'text-') || 'text-white'}">${el.symbol}</span>` : '?';
    });
    detailHtml += `<p><span class="font-semibold text-gray-400">기본 원소:</span> ${componentElements.join(' + ')}</p>`;
    detailHtml += `</div>`;
    
    // Add fuel button for synthesis cards (more energy)
    const currentEnergy = gameState.energy || 0;
    const fuelCost = calculateMoleculeEnergyValue(card); // 분자별 에너지 값 계산
    detailHtml += `<div class="bg-orange-900/30 p-3 rounded-lg mb-4 border border-orange-500/50">`;
    detailHtml += `<h3 class="text-lg font-semibold text-orange-300 mb-2">연료 사용</h3>`;
    detailHtml += `<p class="text-sm text-gray-400 mb-3">현재 에너지: ${currentEnergy} ⚡</p>`;
    detailHtml += `<p class="text-sm text-gray-400 mb-3">이 분자를 연료로 사용하여 <span class="text-orange-300 font-bold">${fuelCost} 에너지</span>를 생성합니다.</p>`;
    detailHtml += `<button id="use-as-fuel" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-bold transition-colors">`;
    detailHtml += `연료로 사용 (+${fuelCost} ⚡)`;
    detailHtml += `</button>`;
    detailHtml += `</div>`;
  }
  // Add Molecule Information if it's a molecule card
  else if (card.type === 'molecule' || card.moleculeId) {
    detailHtml += `<div class="bg-gray-700 p-3 rounded-lg mb-4">`;
    detailHtml += `<h3 class="text-lg font-semibold text-purple-300 mb-2">분자 정보</h3>`;
    detailHtml += `<p><span class="font-semibold text-gray-400">이름:</span> ${card.name || '알 수 없는 분자'}</p>`;
    if (card.symbol) {
      detailHtml += `<p><span class="font-semibold text-gray-400">기호:</span> ${card.symbol}</p>`;
    }
    if (card.formula) {
      detailHtml += `<p><span class="font-semibold text-gray-400">화학식:</span> ${card.formula}</p>`;
    }
    detailHtml += `</div>`;
    
    // Add fuel button for molecule cards
    const currentEnergy = gameState.energy || 0;
    const fuelCost = calculateMoleculeEnergyValue(card);
    detailHtml += `<div class="bg-orange-900/30 p-3 rounded-lg mb-4 border border-orange-500/50">`;
    detailHtml += `<h3 class="text-lg font-semibold text-orange-300 mb-2">연료 사용</h3>`;
    detailHtml += `<p class="text-sm text-gray-400 mb-3">현재 에너지: ${currentEnergy} ⚡</p>`;
    detailHtml += `<p class="text-sm text-gray-400 mb-3">이 분자를 연료로 사용하여 <span class="text-orange-300 font-bold">${fuelCost} 에너지</span>를 생성합니다.</p>`;
    detailHtml += `<button id="use-as-fuel" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-bold transition-colors">`;
    detailHtml += `연료로 사용 (+${fuelCost} ⚡)`;
    detailHtml += `</button>`;
    detailHtml += `</div>`;
  }
  // Add Element Information if it's a base element card
  else if (card.element) {
     detailHtml += `<div class="bg-gray-700 p-3 rounded-lg mb-4">`;
     detailHtml += `<h3 class="text-lg font-semibold text-indigo-300 mb-2">원소 정보</h3>`;
     detailHtml += `<p><span class="font-semibold text-gray-400">번호:</span> ${card.element.number}</p>`;
     detailHtml += `<p><span class="font-semibold text-gray-400">기호:</span> ${card.element.symbol}</p>`;
     detailHtml += `<p><span class="font-semibold text-gray-400">분류:</span> ${card.element.category}</p>`;
     detailHtml += `</div>`;
     
     // Add fusion button if element has 2+ count in hand
     const elementCount = getElementCountInHand(card.element.symbol);
     if (elementCount >= 2) {
       detailHtml += `<div class="bg-purple-900/30 p-3 rounded-lg mb-4 border border-purple-500/50">`;
       detailHtml += `<h3 class="text-lg font-semibold text-purple-300 mb-2">핵융합</h3>`;
       detailHtml += `<p class="text-sm text-gray-400 mb-3">보유: ${elementCount}개 (2개당 1개 생성)</p>`;
       detailHtml += `<button id="fusion-from-detail" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-bold transition-colors mb-2">`;
       detailHtml += `핵융합 실행`;
       detailHtml += `</button>`;
       detailHtml += `</div>`;
     } else {
       detailHtml += `<div class="bg-gray-800 p-3 rounded-lg mb-4">`;
       detailHtml += `<p class="text-sm text-gray-500 text-center">핵융합하려면 2개 이상 필요 (현재: ${elementCount}개)</p>`;
       detailHtml += `</div>`;
     }

     // Add max fusion button (always available if fusion system exists)
     detailHtml += `<div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-3 rounded-lg mb-4 border border-purple-400/50">`;
     detailHtml += `<h3 class="text-lg font-semibold text-yellow-300 mb-2">⚡ 최대 융합</h3>`;
     detailHtml += `<p class="text-sm text-gray-300 mb-3">가진 원소 전부를 최대한 많이 융합합니다</p>`;
     detailHtml += `<button id="max-fusion-from-detail" class="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-2 px-4 rounded font-bold transition-all duration-200 transform hover:scale-105">`;
     detailHtml += `🚀 최대 융합 실행`;
     detailHtml += `</button>`;
     detailHtml += `</div>`;
     
     // Add fuel button for energy generation
     const currentEnergy = gameState.energy || 0;
     const fuelCost = calculateElementEnergyValue(card); // 원소별 에너지 값 계산
     detailHtml += `<div class="bg-orange-900/30 p-3 rounded-lg mb-4 border border-orange-500/50">`;
     detailHtml += `<h3 class="text-lg font-semibold text-orange-300 mb-2">연료 사용</h3>`;
     detailHtml += `<p class="text-sm text-gray-400 mb-3">현재 에너지: ${currentEnergy} ⚡</p>`;
     detailHtml += `<p class="text-sm text-gray-400 mb-3">이 원소를 연료로 사용하여 <span class="text-orange-300 font-bold">${fuelCost} 에너지</span>를 생성합니다.</p>`;
     detailHtml += `<button id="use-as-fuel" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-bold transition-colors">`;
     detailHtml += `연료로 사용 (+${fuelCost} ⚡)`;
     detailHtml += `</button>`;
     detailHtml += `</div>`;
  }


  // Add star growth section for element cards
  if (card.element && !card.isSynthesis) {
    detailHtml += `
      <div class="mt-4 bg-purple-900 bg-opacity-50 p-3 rounded-lg">
        <h4 class="font-bold text-purple-400 mb-2">🌟 별 성장 기여도</h4>
        <div class="text-sm text-gray-300 mb-3">
          ${getStarGrowthContribution(card.element.symbol)}
        </div>
        <button id="use-for-star-growth" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm">
          별 성장에 사용하기
        </button>
      </div>
    `;
  }

  content.innerHTML = detailHtml;
  modal.classList.remove('hidden');
  
  // Add event listener for fusion button
  const fusionBtn = document.getElementById('fusion-from-detail');
  if (fusionBtn && card.element) {
    fusionBtn.addEventListener('click', () => {
      const elementCount = getElementCountInHand(card.element.symbol);
      if (window.fusionUI && typeof window.fusionUI.showFusionModal === 'function') {
        window.fusionUI.showFusionModal(card.element.symbol, elementCount);
        // Close the card detail modal
        modal.classList.add('hidden');
      } else {
        showMessage('핵융합 시스템을 사용할 수 없습니다.', 'error');
      }
    });
  }

  // Add event listener for max fusion button
  const maxFusionBtn = document.getElementById('max-fusion-from-detail');
  if (maxFusionBtn) {
    maxFusionBtn.addEventListener('click', () => {
      if (window.fusionUI && typeof window.fusionUI.performMaxFusion === 'function') {
        window.fusionUI.performMaxFusion();
        // Close the card detail modal
        modal.classList.add('hidden');
      } else {
        showMessage('핵융합 시스템을 사용할 수 없습니다.', 'error');
      }
    });
  }
  
  // Add event listener for star growth button
  const starGrowthBtn = document.getElementById('use-for-star-growth');
  if (starGrowthBtn && card.element && !card.isSynthesis) {
    starGrowthBtn.addEventListener('click', () => {
      if (window.starManagement) {
        const expGained = window.starManagement.growStarWithElements(card.element.symbol, 1);
        if (expGained > 0) {
          showMessage(`🌟 ${card.element.symbol} 원소로 별이 성장했습니다! (+${expGained} 경험치)`, 'star');
          modal.classList.add('hidden');
        }
      } else {
        showMessage('별 관리 시스템을 사용할 수 없습니다.', 'error');
      }
    });
  }

  // Add event listener for fuel button
  const fuelBtn = document.getElementById('use-as-fuel');
  if (fuelBtn) {
    fuelBtn.addEventListener('click', () => {
      // 카드를 손패에서 제거
      const cardIndex = gameState.playerHand.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        gameState.playerHand.splice(cardIndex, 1);
        
        // 카드 타입에 따라 다른 에너지 양 제공
        let energyGained = 1; // 기본값
        
        if (card.element && !card.isSynthesis) {
          // 원소 카드 - 원소별 에너지 값 계산
          energyGained = calculateElementEnergyValue(card);
        } else if (card.isSynthesis || card.type === 'molecule') {
          // 분자 카드 - 분자별 에너지 값 계산
          energyGained = calculateMoleculeEnergyValue(card);
        }
        
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
        
        showMessage(`${card.name}을 연료로 사용하여 에너지를 ${energyGained} 획득했습니다!`, 'energy');
        
        // UI 업데이트
        updateUI();
        
        // 모달 닫기
        modal.classList.add('hidden');
      } else {
        showMessage('카드를 찾을 수 없습니다.', 'error');
      }
    });
  }
}

// 원소별 에너지 지급량 계산
function calculateElementEnergyValue(card) {
  if (!card || !card.element) return 1;
  
  const element = card.element;
  const atomicNumber = element.number || 1;
  const rarity = card.rarity || 'common';
  const category = element.category || '';
  
  // 기본 에너지 값 (원자번호 기반)
  let baseEnergy = Math.floor(Math.pow(atomicNumber, 1.9));
  
  // 희귀도 보너스
  const rarityMultipliers = {
    'common': 1.0,
    'uncommon': 2.0,
    'rare': 4.0,
    'epic': 9.0,
    'legendary': 36.0
  };
  
  baseEnergy = Math.floor(baseEnergy * (rarityMultipliers[rarity] || 1.0));
  
  // 카테고리별 보너스
  const categoryBonuses = {
    '비금속': 1.2,
    '비활성 기체': 1.5,
    '알칼리 금속': 1.1,
    '알칼리 토금속': 1.1,
    '준금속': 1.3,
    '전이 금속': 1.4,
    '할로겐': 1.6,
    '란타넘족': 1.8,
    '악티늄족': 2.0,
    '기타 금속': 1.2
  };
  
  if (categoryBonuses[category]) {
    baseEnergy = Math.floor(baseEnergy * categoryBonuses[category]);
  }
  
  // 특별한 원소들 추가 보너스
  if (element.symbol === 'H') baseEnergy = Math.max(baseEnergy, 2); // 수소는 최소 2
  if (element.symbol === 'C') baseEnergy = Math.max(baseEnergy, 3); // 탄소는 최소 3
  if (element.symbol === 'Au') baseEnergy = Math.max(baseEnergy, 5); // 금은 최소 5
  if (element.symbol === 'U') baseEnergy = Math.max(baseEnergy, 8); // 우라늄은 최소 8
  
  return Math.max(1, baseEnergy); // 최소 1 에너지 보장
}

// 분자별 에너지 지급량 계산
function calculateMoleculeEnergyValue(card) {
  if (!card) return 3;
  
  let baseEnergy = 3; // 기본 분자 에너지
  
  // 분자 복잡도에 따른 보너스
  if (card.components && card.components.length > 0) {
    baseEnergy += card.components.length * 2; // 구성 원소 수만큼 보너스
  }
  
  // 분자 타입별 보너스
  if (card.type === 'molecule') {
    baseEnergy += 2; // 분자 카드 보너스
  }
  
  // 특수 효과가 있는 분자 보너스
  if (card.effect && card.effect.type) {
    baseEnergy += 3; // 특수 효과 보너스
  }
  
  // 희귀도 보너스 (분자도 희귀도가 있을 경우)
  const rarity = card.rarity || 'common';
  const rarityMultipliers = {
    'common': 1.0,
    'uncommon': 1.3,
    'rare': 1.8,
    'epic': 2.5,
    'legendary': 4.0
  };
  
  baseEnergy = Math.floor(baseEnergy * (rarityMultipliers[rarity] || 1.0));
  
  // 분자 이름에 따른 특별 보너스
  if (card.name) {
    const name = card.name.toLowerCase();
    if (name.includes('dna') || name.includes('rna')) baseEnergy += 5; // 생체 분자
    if (name.includes('protein') || name.includes('enzyme')) baseEnergy += 4; // 단백질
    if (name.includes('crystal') || name.includes('diamond')) baseEnergy += 3; // 결정
    if (name.includes('explosive') || name.includes('bomb')) baseEnergy += 2; // 폭발성
  }
  
  return Math.max(3, baseEnergy); // 최소 3 에너지 보장
}

// Get count of specific element in hand
function getElementCountInHand(elementSymbol) {
  if (!gameState.playerHand || !Array.isArray(gameState.playerHand)) return 0;
  
  return gameState.playerHand.filter(card => 
    card && 
    card.element && 
    card.element.symbol === elementSymbol && 
    !card.isSkull && 
    !card.isSynthesis
  ).length;
}

// Function to update the text of draw button with current cost and card count
function updateDrawButtonCosts() {
    const drawBtn = document.getElementById('draw-cards-btn');

    if (drawBtn && typeof getCurrentDrawCost === 'function' && typeof getCurrentCardCount === 'function') {
        const cost = getCurrentDrawCost();
        const cardCount = getCurrentCardCount();
        
        // 뽑기 횟수 제한 해제됨
        drawBtn.textContent = `카드 뽑기 (💰 ${cost} / ${cardCount}장) - ${gameState.drawCount}회`;
        drawBtn.disabled = false;
        drawBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        drawBtn.classList.add('hover:from-green-700', 'hover:to-blue-700');
    }
}

// Alias for updateTurnIndicator to fix the missing function error
function updateTurnDisplay() {
  if (typeof updateTurnIndicator === 'function') {
    updateTurnIndicator();
  } else {
    console.warn("updateTurnIndicator function not found, using fallback");
    
    // 온라인 모드에서는 updateOnlineTurnUI가 처리하므로 여기서는 건드리지 않음
    if (window.onlineGameState && window.onlineGameState.isOnline) {
      console.log("updateTurnDisplay: 온라인 모드에서는 updateOnlineTurnUI가 처리합니다.");
      return;
    }
    
    const resultMessage = document.getElementById('result-message');
    if (resultMessage) {
      if (gameState.isPlayerTurn) {
        const cardsRemaining = gameState.maxCardsPerTurn - gameState.playerCardsPlayedThisTurn;
        resultMessage.textContent = `${gameState.turnCount}턴: 플레이어 차례 (남은 카드: ${cardsRemaining}/${gameState.maxCardsPerTurn})`;
        resultMessage.className = 'text-center text-xl font-bold h-12 text-blue-400';
      } else {
        resultMessage.textContent = `${gameState.turnCount}턴: 컴퓨터 차례`;
        resultMessage.className = 'text-center text-xl font-bold h-12 text-red-400';
      }
    }
  }
}

// Main UI update function
// 에너지 표시 업데이트 함수
function updateEnergyDisplay() {
    const energyElement = document.getElementById('energy-amount');
    if (energyElement && gameState) {
        const currentEnergy = gameState.energy || 0;
        energyElement.textContent = window.formatNumber ? window.formatNumber(currentEnergy) : currentEnergy;
        
        // 에너지 업데이트 애니메이션
        energyElement.classList.add('energy-updated');
        setTimeout(() => {
            energyElement.classList.remove('energy-updated');
        }, 300);
    }
}

function updateUI() {
    console.log("Updating UI...");
    renderPlayerHand();
    renderBattlefield();
    updateCoinDisplay('player');
    updateCoinDisplay('computer'); // If computer coins are displayed
    updateBaseDisplay('player');
    updateBaseDisplay('computer');
    updateTurnDisplay();
    updateDrawButtonCosts(); // Update draw button costs
    updateEnergyDisplay(); // Update energy display
    
    // Apply number formatting to all numbers
    if (window.formatAllNumbers) {
        window.formatAllNumbers();
    }
    
    // Update other UI elements as needed
    console.log("UI Update complete.");
}


// Expose functions to the global scope
window.showMessage = showMessage;
window.hideCardDetail = hideCardDetail; // Expose hideCardDetail function
window.hideCardDetailModal = typeof hideCardDetailModal !== 'undefined' ? hideCardDetailModal : undefined; // Expose if needed globally
window.renderPlayerHand = renderPlayerHand; // Ensure exposed if called externally
window.updateBaseDisplay = typeof updateBaseDisplay !== 'undefined' ? updateBaseDisplay : undefined; // Expose if needed globally
window.initUI = typeof initUI !== 'undefined' ? initUI : undefined; // Expose if needed globally
window.showUpgradeModal = showUpgradeModal; // Expose the function
window.hideUpgradeModal = hideUpgradeModal; // Expose hide function if needed elsewhere
window.updateMoleculeViewerDisplay = updateMoleculeViewerDisplay; // Ensure this is exposed if called externally
window.attemptManualSynthesis = attemptManualSynthesis; // Ensure this is exposed
window.showMoleculeViewer = showMoleculeViewer; // Expose the main function
window.showNextMolecule = showNextMolecule; // Expose navigation
window.showPrevMolecule = showPrevMolecule; // Expose navigation
window.showCardDetail = showCardDetail; // Expose the function
window.updateDrawButtonCosts = updateDrawButtonCosts; // Expose the function
window.updateEnergyDisplay = updateEnergyDisplay; // Expose energy display function
window.updateUI = updateUI; // Expose the main UI update function