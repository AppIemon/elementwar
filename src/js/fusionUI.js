// 핵융합 시스템 UI 관리
class FusionUI {
  constructor() {
    this.fusionModal = null;
    this.researchModal = null;
    this.starManagementModal = null;
    this.currentTab = 'equipment';
    this.chemLabSelection = [];
  }

  // UI 초기화
  init() {
    this.fusionModal = document.getElementById('fusion-modal');
    this.researchModal = document.getElementById('research-modal');
    this.starManagementModal = document.getElementById('star-management-modal');
    this.setupEventListeners();
    
    // fusionSystem 연결 확인 및 설정
    if (typeof window.gameState !== 'undefined' && window.gameState) {
      if (!window.gameState.fusionSystem && window.fusionSystem) {
        window.gameState.fusionSystem = window.fusionSystem;
        console.log('fusionUI: fusionSystem이 gameState에 연결되었습니다.');
      }
    }
    
    // 연구소 탭 숨기고 "합성물" 탭 라벨로 변경
    try {
      const researchTabBtn = document.querySelector('[data-tab="research"]');
      if (researchTabBtn && researchTabBtn.parentElement) {
        researchTabBtn.parentElement.classList.add('hidden');
      }
      const moleculeTabBtn = document.querySelector('[data-tab="molecule"]');
      if (moleculeTabBtn) moleculeTabBtn.textContent = '합성물';
    } catch (e) { console.warn('탭 라벨 업데이트 실패', e); }
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 핵융합 모달
    const fusionBtn = document.getElementById('fusion-btn');
    const closeFusionModal = document.getElementById('close-fusion-modal');
    
    if (fusionBtn) {
      fusionBtn.addEventListener('click', () => this.showFusionModal());
    }
    
    if (closeFusionModal) {
      closeFusionModal.addEventListener('click', () => this.hideFusionModal());
    }

    // 별 관리 모달
    const starManagementBtn = document.getElementById('star-management-btn');
    const closeStarManagementModal = document.getElementById('close-star-management-modal');
    
    if (starManagementBtn) {
      starManagementBtn.addEventListener('click', () => this.showStarManagementModal());
    }
    
    if (closeStarManagementModal) {
      closeStarManagementModal.addEventListener('click', () => this.hideStarManagementModal());
    }

    // 별 관리 모달 이벤트 설정
    this.setupStarManagementEvents();

    // 자동화 설정
    const autoCompress = document.getElementById('auto-compress');
    const compressThreshold = document.getElementById('compress-threshold');

    if (autoCompress) {
      autoCompress.addEventListener('change', (e) => {
        if (gameState.fusionSystem) {
          gameState.fusionSystem.autoCompress = e.target.checked;
        }
      });
    }

    if (compressThreshold) {
      // 압축 임계값 옵션을 16개 기준으로 업데이트
      compressThreshold.innerHTML = `
        <option value="2">2개 (2→1)</option>
        <option value="4">4개 (4→2→1)</option>
        <option value="8">8개 (8→4→2→1)</option>
        <option value="16" selected>16개 (16→8→4→2→1)</option>
      `;
      
      compressThreshold.addEventListener('change', (e) => {
        if (gameState.fusionSystem) {
          gameState.fusionSystem.compressThreshold = parseInt(e.target.value);
        }
      });
    }

    // 연구 레벨 업그레이드
    const upgradeResearchBtn = document.getElementById('upgrade-research-btn');
    if (upgradeResearchBtn) {
      upgradeResearchBtn.addEventListener('click', () => this.upgradeResearch());
    }
  }


  // 실험실 모달 표시
  showFusionModal() {
    if (this.fusionModal) {
      this.syncMaterialsFromHand();
      this.updateFusionDisplay();
      this.fusionModal.classList.remove('hidden');
      // 화학 합성실 드래그 기능 제거됨
      
      // 튜토리얼 액션 처리
      if (typeof window.onFusionOpened === 'function') {
        window.onFusionOpened();
      }
    }
  }

  // 실험실 모달 숨기기
  hideFusionModal() {
    if (this.fusionModal) {
      this.fusionModal.classList.add('hidden');
    }
  }

  // 핵융합 모달 표시 (개수 선택)
  showFusionModal(elementSymbol, availableCount) {
    if (!elementSymbol || availableCount < 2) return;
    
    const nextElement = this.getNextElementSymbol(elementSymbol);
    if (!nextElement) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.style.background = 'rgba(0, 0, 0, 0.8)';
    modal.id = 'fusion-count-modal';
    
    const maxFusion = Math.floor(availableCount / 2); // 2개당 1개 융합 가능
    const maxCount = Math.min(maxFusion, 100000); // 최대 10개까지
    
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-purple-300">핵융합</h2>
          <button class="text-gray-400 hover:text-white text-2xl" onclick="this.closest('.fixed').remove()">×</button>
        </div>
        
        <div class="mb-6">
          <div class="text-center mb-4">
            <div class="text-lg text-white">${elementSymbol} → ${nextElement}</div>
            <div class="text-sm text-gray-400">보유: ${availableCount}개</div>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm text-gray-300 mb-2">융합할 개수 (2개당 1개 생성)</label>
            <div class="flex items-center gap-4">
              <button id="decrease-count" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded">-</button>
              <input type="number" id="fusion-count" value="1" min="1" max="${maxCount}" 
                     class="bg-gray-700 text-white text-center px-3 py-1 rounded w-20">
              <button id="increase-count" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded">+</button>
            </div>
            <div class="text-xs text-gray-400 mt-1">최대 ${maxCount}개까지 가능</div>
          </div>
          
          <div class="bg-gray-700 p-3 rounded mb-4">
            <div class="text-sm text-gray-300">소모: ${elementSymbol} × <span id="required-count">2</span></div>
            <div class="text-sm text-gray-300">생성: ${nextElement} × <span id="result-count">1</span></div>
          </div>
        </div>

        <div class="flex gap-3">
          <button id="perform-fusion" class="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">
            핵융합 실행
          </button>
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">
            취소
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // 이벤트 리스너 설정
    this.setupFusionCountModal(elementSymbol, nextElement, availableCount, maxCount);
  }

  // 다음 원소 심볼 가져오기
  getNextElementSymbol(symbol) {
    const elementNumber = this.getElementNumber(symbol);
    if (!elementNumber || elementNumber >= 118) return null;
    
    const nextElement = gameState.elementsData?.find(e => e.number === elementNumber + 1);
    return nextElement ? nextElement.symbol : null;
  }

  // 원소 심볼로 원자번호 가져오기
  getElementNumber(symbol) {
    const element = gameState.elementsData?.find(e => e.symbol === symbol);
    return element ? element.number : null;
  }

  // 핵융합 개수 선택 모달 이벤트 설정
  setupFusionCountModal(elementSymbol, nextElement, availableCount, maxCount) {
    const modal = document.getElementById('fusion-count-modal');
    if (!modal) return;

    const countInput = modal.querySelector('#fusion-count');
    const decreaseBtn = modal.querySelector('#decrease-count');
    const increaseBtn = modal.querySelector('#increase-count');
    const performBtn = modal.querySelector('#perform-fusion');
    const requiredCount = modal.querySelector('#required-count');
    const resultCount = modal.querySelector('#result-count');

    // 개수 변경 함수
    const updateCount = (newCount) => {
      const count = Math.max(1, Math.min(newCount, maxCount));
      countInput.value = count;
      requiredCount.textContent = count * 2;
      resultCount.textContent = count;
    };

    // 감소 버튼
    decreaseBtn.addEventListener('click', () => {
      updateCount(parseInt(countInput.value) - 1);
    });

    // 증가 버튼
    increaseBtn.addEventListener('click', () => {
      updateCount(parseInt(countInput.value) + 1);
    });

    // 입력 필드 직접 변경
    countInput.addEventListener('input', () => {
      updateCount(parseInt(countInput.value) || 1);
    });

    // 핵융합 실행
    performBtn.addEventListener('click', () => {
      const count = parseInt(countInput.value) || 1;
      this.performMultipleFusion(elementSymbol, nextElement, count);
      modal.remove();
    });
  }

  // 다중 핵융합 실행
  performMultipleFusion(elementSymbol, nextElement, count) {
    if (!gameState.fusionSystem) return;

    const targetZ = this.getElementNumber(nextElement);
    if (!targetZ) return;

    // 손패에서 실제 카드 제거
    const removedCards = this.removeCardsFromHand(elementSymbol, count * 2);
    if (removedCards.length < count * 2) {
      showMessage(`${elementSymbol} 카드가 부족합니다. (필요: ${count * 2}, 제거: ${removedCards.length})`, 'error');
      return;
    }

    // 융합 애니메이션 표시
    this.showFusionAnimation([targetZ], () => {
      try {
        // 에너지 비용 계산 및 소모
        const energyCost = gameState.fusionSystem.calculateEnergyCost(targetZ) * count;
        const currentEnergy = Number.isFinite(Number(gameState.fusionSystem.energy)) ? Number(gameState.fusionSystem.energy) : 0;
        
        if (currentEnergy < energyCost) {
          // 카드 복구
          removedCards.forEach(card => {
            if (typeof addCardToHand === 'function') {
              addCardToHand(card, 'player');
            } else {
              gameState.playerHand.push(card);
            }
          });
          showMessage(`⚡ 에너지가 부족합니다! (필요: ${energyCost}, 보유: ${currentEnergy})`, 'energy');
          return;
        }

        // 에너지 소모
        gameState.fusionSystem.energy = Math.max(0, currentEnergy - energyCost);
        
        // 열 증가
        gameState.fusionSystem.heat = Math.max(0, (gameState.fusionSystem.heat || 0) + Math.floor(targetZ / 10) * count);

        // 다음 원소 카드 생성
        for (let i = 0; i < count; i++) {
          const nextElementData = gameState.elementsData?.find(e => e.symbol === nextElement);
          if (nextElementData) {
            const newCard = new ElementCard(nextElementData, nextElementData.baseHp, nextElementData.baseAtk);
            if (typeof addCardToHand === 'function') {
              addCardToHand(newCard, 'player');
            } else {
              gameState.playerHand.push(newCard);
            }
          }
        }

        // 잉여 에너지 생성
        const surplusEnergy = Math.floor(targetZ / 5) * count;
        gameState.fusionSystem.energy = Math.max(0, gameState.fusionSystem.energy + surplusEnergy);

        showMessage(`${elementSymbol} ${count * 2}개 → ${nextElement} ${count}개 핵융합 완료! (에너지: -${energyCost} +${surplusEnergy})`, 'success');
        this.updateMainUI();
        
        // 손패 UI 업데이트
        if (typeof renderPlayerHand === 'function') {
          renderPlayerHand();
        }
      } catch (error) {
        console.error('[performMultipleFusion] 융합 실행 중 오류:', error);
        showMessage(`핵융합 실행 중 오류가 발생했습니다: ${error.message}`, 'error');
      }
    });
  }

  // 손패에서 특정 원소 카드 제거
  removeCardsFromHand(elementSymbol, count) {
    const removedCards = [];
    let removedCount = 0;
    
    for (let i = gameState.playerHand.length - 1; i >= 0 && removedCount < count; i--) {
      const card = gameState.playerHand[i];
      if (card && 
          card.element && 
          card.element.symbol === elementSymbol && 
          !card.isSkull && 
          !card.isSynthesis) {
        removedCards.push(gameState.playerHand.splice(i, 1)[0]);
        removedCount++;
      }
    }
    
    return removedCards;
  }

  // 실험실 화면 일괄 갱신
  updateFusionDisplay() {
    this.updateMaterialsDisplay();
    this.updateFusionInterface();
  }

  // 별 관리 모달 표시
  showStarManagementModal() {
    if (this.starManagementModal) {
      if (window.starManagement) {
        window.starManagement.updateUI();
      }
      this.starManagementModal.classList.remove('hidden');
    }
  }

  // 별 관리 모달 숨기기
  hideStarManagementModal() {
    if (this.starManagementModal) {
      this.starManagementModal.classList.add('hidden');
    }
  }

  // 별 관리 모달 이벤트 설정
  setupStarManagementEvents() {
    // Fe를 별로 변환하는 기능 제거됨

    // 고원자번호 원소를 별로 변환하는 기능 제거됨
  }

  // 손패를 기반으로 재료 인벤토리 동기화 (연구소/실험실 진입 시 갱신)
  syncMaterialsFromHand() {
    if (!window.gameState || !gameState.fusionSystem) return;

    const fs = gameState.fusionSystem;
    const hand = Array.isArray(gameState.playerHand) ? gameState.playerHand : [];

    // elementsData 기준으로 원소 심볼 목록 수집 (분자 ID와 구분)
    const elementSymbols = Array.isArray(gameState.elementsData)
      ? gameState.elementsData.map(e => e.symbol)
      : [];

    // 원소 심볼 카운트만 초기화 (분자 키는 건드리지 않음)
    elementSymbols.forEach(sym => { 
      if (fs.materials[sym] !== undefined) {
        fs.materials[sym] = 0; 
      }
    });

    // 손패에서 원소 카드 집계 (합성/해골 제외, 기본 원소만 카운트)
    hand.forEach(card => {
      if (card && !card.isSynthesis && !card.isSkull && card.element && elementSymbols.includes(card.element.symbol)) {
        fs.materials[card.element.symbol] = (fs.materials[card.element.symbol] || 0) + 1;
      }
    });
  }



  // 연구소 모달 제거됨

  // 탭 전환
  switchTab(tabName) {
    // 탭 버튼 업데이트
    const tabs = document.querySelectorAll('.research-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active', 'text-blue-400', 'border-b-2', 'border-blue-400');
      tab.classList.add('text-gray-400');
    });

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active', 'text-blue-400', 'border-b-2', 'border-blue-400');
      activeTab.classList.remove('text-gray-400');
    }

    // 탭 콘텐츠 업데이트
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });

    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }

    this.currentTab = tabName;

    // 탭별 초기 렌더링 훅
    if (tabName === 'molecule') {
      this.updateMoleculeSynthesisDisplay();
    } else if (tabName === 'equipment') {
      this.updateEquipmentList();
    }
  }


  // 재료 표시 업데이트
  updateMaterialsDisplay() {
    const materialsDisplay = document.getElementById('materials-display');
    if (!materialsDisplay || !gameState.fusionSystem) return;

    const materials = gameState.fusionSystem.materials;
    try { console.log('[UI] updateMaterialsDisplay materials snapshot:', JSON.parse(JSON.stringify(materials))); } catch(e) {}
    materialsDisplay.innerHTML = '';

    // 원소와 분자 키를 분리하여 표시
    const elementSymbols = Array.isArray(gameState.elementsData)
      ? gameState.elementsData.map(e => e.symbol)
      : [];
    const elementEntries = Object.entries(materials).filter(([k]) => elementSymbols.includes(k));
    const moleculeEntries = Object.entries(materials).filter(([k, v]) => !elementSymbols.includes(k) && v > 0);

    // 원소 섹션
    const elementsHeader = document.createElement('div');
    elementsHeader.className = 'text-sm text-gray-300 mb-2';
    elementsHeader.textContent = '보유 원소';
    materialsDisplay.appendChild(elementsHeader);

    const elementsGrid = document.createElement('div');
    elementsGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
    materialsDisplay.appendChild(elementsGrid);

    elementEntries.forEach(([symbol, count]) => {
      const materialEl = document.createElement('div');
      materialEl.className = 'bg-gray-700 p-2 rounded text-center cursor-pointer hover:bg-gray-600 transition-colors';
      materialEl.innerHTML = `
        <div class="text-lg font-bold text-blue-300">${symbol}</div>
        <div class="text-xl">${count}</div>
      `;
      
      // Add click listener to show card detail
      materialEl.addEventListener('click', (event) => {
        event.stopPropagation();
        
        // Find the element data
        const elementData = gameState.elementsData?.find(e => e.symbol === symbol);
        if (elementData) {
          // Create a temporary card object for the detail modal
          const tempCard = {
            element: elementData,
            name: elementData.name,
            hp: elementData.baseHp || 10,
            maxHp: elementData.baseHp || 10,
            atk: elementData.baseAtk || 5,
            rarity: elementData.rarity || 'common',
            isSkull: false,
            isSynthesis: false
          };
          
          // Show card detail modal
          if (typeof showCardDetail === 'function') {
            showCardDetail(tempCard);
          }
        }
      });
      
      // Add visual hint
      materialEl.title = `클릭: ${symbol} 상세보기 (${count}개 보유)`;
      
      elementsGrid.appendChild(materialEl);
    });

    // 분자 섹션 (보유 수량이 1 이상인 것만)
    if (moleculeEntries.length > 0) {
      const molHeader = document.createElement('div');
      molHeader.className = 'text-sm text-green-300 mt-4 mb-2';
      molHeader.textContent = '보유 분자';
      materialsDisplay.appendChild(molHeader);

      const molGrid = document.createElement('div');
      molGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
      materialsDisplay.appendChild(molGrid);

      moleculeEntries.forEach(([id, count]) => {
        const materialEl = document.createElement('div');
        materialEl.className = 'bg-gray-700 p-2 rounded text-center border border-green-600/40';
        materialEl.innerHTML = `
          <div class="text-lg font-bold text-green-300">${String(id).toUpperCase()}</div>
          <div class="text-xl">${count}</div>
        `;
        molGrid.appendChild(materialEl);
      });
    }
  }

  // 융합 인터페이스 업데이트
  updateFusionInterface() {
    const fusionInterface = document.getElementById('fusion-interface');
    if (!fusionInterface || !gameState.fusionSystem) return;

    fusionInterface.innerHTML = '';

    // 인라인 합성실로 이전됨: 모달 내 합성실 UI는 제거

    // 에너지 상태 표시 (NaN 보호)
    const energyStatus = document.createElement('div');
    energyStatus.className = 'mb-4 p-3 rounded-lg border';
    const currentEnergy = Number.isFinite(Number(gameState.fusionSystem.energy)) ? Number(gameState.fusionSystem.energy) : 0;
    if (!Number.isFinite(gameState.fusionSystem.energy)) {
      gameState.fusionSystem.energy = currentEnergy; // 상태 복구
    }
    if (currentEnergy < 10) {
      energyStatus.className += ' bg-red-900 border-red-500';
      energyStatus.innerHTML = `
        <div class="text-center">
          <div class="text-red-400 font-bold">⚡ 에너지 부족!</div>
          <div class="text-sm text-gray-300">현재 에너지: ${currentEnergy}</div>
          <div class="text-xs text-gray-400 mt-1">H를 에너지로 변환하거나 기다려서 에너지를 회복하세요</div>
          <button id="convert-h-to-energy" class="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs">
            H를 에너지로 변환
          </button>
        </div>
      `;
    } else if (currentEnergy < 50) {
      energyStatus.className += ' bg-yellow-900 border-yellow-500';
      energyStatus.innerHTML = `
        <div class="text-center">
          <div class="text-yellow-400 font-bold">⚡ 에너지 부족 경고</div>
          <div class="text-sm text-gray-300">현재 에너지: ${currentEnergy}</div>
        </div>
      `;
    } else {
      energyStatus.className += ' bg-green-900 border-green-500';
      energyStatus.innerHTML = `
        <div class="text-center">
          <div class="text-green-400 font-bold">⚡ 에너지 충분</div>
          <div class="text-sm text-gray-300">현재 에너지: ${currentEnergy}</div>
        </div>
      `;
    }
    fusionInterface.appendChild(energyStatus);

    // 배치 융합 버튼 추가
    const batchFusionContainer = document.createElement('div');
    batchFusionContainer.className = 'mb-6 p-4 bg-gray-800 rounded-lg border border-purple-500';
    batchFusionContainer.innerHTML = `
      <div class="text-center mb-4">
        <h3 class="text-xl font-bold text-purple-300 mb-2">배치 핵융합/초신성</h3>
        <p class="text-sm text-gray-400">여러 원소를 한번에 융합하거나 초신성으로 변환할 수 있습니다</p>
      </div>
      <div class="flex flex-wrap gap-2 justify-center">
        <button id="select-all-fusion" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
          모두 선택
        </button>
        <button id="fuse-all-btn" class="px-3 py-1 bg-purple-700 hover:bg-purple-800 rounded text-sm">
          모두 핵융합
        </button>
        <button id="clear-fusion-selection" class="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm">
          선택 해제
        </button>
        <button id="batch-fusion-btn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold">
          선택한 원소들 융합/초신성
        </button>
      </div>
    `;
    fusionInterface.appendChild(batchFusionContainer);

    // 최대 융합 버튼 추가
    const maxFusionContainer = document.createElement('div');
    maxFusionContainer.className = 'mb-6 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg border border-purple-400';
    maxFusionContainer.innerHTML = `
      <div class="text-center mb-4">
        <h3 class="text-xl font-bold text-yellow-300 mb-2">⚡ 최대 융합</h3>
        <p class="text-sm text-gray-300">가진 원소 전부를 최대한 많이 융합합니다</p>
        <p class="text-xs text-gray-400 mt-1">에너지와 재료가 허용하는 한 모든 원소를 자동으로 융합</p>
      </div>
      <div class="flex justify-center">
        <button id="max-fusion-btn" class="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg font-bold text-white shadow-lg transform hover:scale-105 transition-all duration-200">
          🚀 최대 융합 실행
        </button>
      </div>
    `;
    fusionInterface.appendChild(maxFusionContainer);

    // Z=2부터 Z=26까지 융합 옵션 생성 (핵융합만)
    for (let Z = 2; Z <= 26; Z++) {
      const required = gameState.fusionSystem.calculateRequiredMaterials(Z);
      const energyCost = gameState.fusionSystem.calculateEnergyCost(Z);
      const previousElement = gameState.fusionSystem.getSymbolByNumber(Z - 1);
      const targetElement = gameState.fusionSystem.getSymbolByNumber(Z);
      const available = gameState.fusionSystem.materials[previousElement] || 0;

      const fsEnergy = Number.isFinite(Number(gameState.fusionSystem.energy)) ? Number(gameState.fusionSystem.energy) : 0;
      if (!Number.isFinite(gameState.fusionSystem.energy)) {
        gameState.fusionSystem.energy = fsEnergy; // 상태 복구
      }
      const canFuse = available >= required && fsEnergy >= energyCost;

      const fusionOption = document.createElement('div');
      fusionOption.className = `bg-gray-700 p-4 rounded-lg flex justify-between items-center ${(!canFuse && gameState.fusionSystem.energy < energyCost) ? 'border border-red-500 bg-red-900' : ''}`;
      
      fusionOption.innerHTML = `
        <div class="flex items-center gap-3">
          <input 
            type="checkbox" 
            class="fusion-checkbox w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            data-target-z="${Z}"
            ${canFuse ? '' : 'disabled'}
          />
          <div>
            <div class="text-lg font-bold text-purple-300">${previousElement} → ${targetElement}</div>
            <div class="text-sm text-gray-400">
              필요: ${previousElement}×${required} (보유: ${available}) | 에너지: ${energyCost} (보유: ${fsEnergy})
            </div>
            ${!canFuse ? `
              <div class="text-xs text-red-400 mt-1">
                ${available < required ? `재료 부족` : 
                  gameState.fusionSystem.energy < energyCost ? `⚡ 에너지 부족! H를 에너지로 변환하세요` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        <button 
          class="fusion-btn px-4 py-2 rounded ${canFuse ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed opacity-50'}" 
          ${canFuse ? '' : 'disabled'}
          data-target-z="${Z}"
          title="${!canFuse ? (available < required ? `재료 부족: ${previousElement} ${available}/${required}` : 
            gameState.fusionSystem.energy < energyCost ? `⚡ 에너지 부족: ${gameState.fusionSystem.energy}/${energyCost}\nH를 에너지로 변환하세요!` : '') : ''}"
        >
          ${canFuse ? '핵융합' : '❌'}
        </button>
      `;

      // 융합 버튼 이벤트 리스너
      const fuseBtn = fusionOption.querySelector('.fusion-btn');
      if (fuseBtn && canFuse) {
        fuseBtn.addEventListener('click', () => this.performFusion(Z));
      }

      fusionInterface.appendChild(fusionOption);
    }

    // 배치 융합 이벤트 리스너 설정
    this.setupBatchFusionListeners();
    
    // H를 에너지로 변환하는 버튼 이벤트 리스너 설정
    this.setupEnergyConversionListeners();

    // 화학 합성실 드래그 기능 제거됨
  }

  // 융합 실행
  performFusion(targetZ) {
    try {
      if (!gameState.fusionSystem) {
        console.warn('fusionSystem이 없습니다. window.fusionSystem을 사용합니다.');
        if (!window.fusionSystem) {
          showMessage('핵융합 시스템이 초기화되지 않았습니다.', 'error');
          return;
        }
        // window.fusionSystem을 gameState에 연결
        gameState.fusionSystem = window.fusionSystem;
      }

      // 입력 검증
      if (!Number.isInteger(targetZ) || targetZ < 2 || targetZ > 118) {
        showMessage(`잘못된 원자번호: ${targetZ}`, 'error');
        return;
      }

    // 단일 융합도 시각적 피드백 제공
    this.showFusionAnimation([targetZ], () => {
        try {
      const result = gameState.fusionSystem.performFusion(targetZ);
      if (result.success) {
        showMessage(result.message, 'success');
        this.updateFusionDisplay();
        this.updateMainUI();
        // 손패 UI 업데이트
        if (typeof renderPlayerHand === 'function') {
          renderPlayerHand();
        }
      } else {
            const messageType = result.message.includes('에너지가 부족') ? 'energy' : 
                              result.message.includes('재료') ? 'warning' : 'error';
        showMessage(result.message, messageType);
      }
        } catch (error) {
          console.error('[performFusion] 융합 실행 중 오류:', error);
          showMessage(`융합 실행 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
      });
    } catch (error) {
      console.error('[performFusion] UI 오류:', error);
      showMessage(`융합 UI 오류가 발생했습니다: ${error.message}`, 'error');
    }
  }



  // 융합 애니메이션 표시
  showFusionAnimation(fusionTargets, callback) {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
    container.style.background = 'radial-gradient(circle, rgba(0,0,0,0.3), rgba(0,0,0,0.8))';
    document.body.appendChild(container);

    // 융합 애니메이션 요소 생성
    const animationElement = document.createElement('div');
    animationElement.className = 'text-center';
    animationElement.innerHTML = `
      <div class="fusion-reactor bg-gradient-to-br from-purple-600 to-blue-800 rounded-full w-64 h-64 flex items-center justify-center mb-8 mx-auto">
        <div class="text-6xl">⚛️</div>
      </div>
      <div class="text-2xl font-bold text-white mb-4">핵융합/초신성 진행 중...</div>
      <div class="text-lg text-gray-300">${fusionTargets.length}개 원소 융합/초신성</div>
    `;
    container.appendChild(animationElement);

    // 애니메이션 실행
    if (typeof anime !== 'undefined') {
      anime({
        targets: animationElement.querySelector('.fusion-reactor'),
        rotate: [0, 360],
        scale: [1, 1.2, 1],
        duration: 1200,
        easing: 'easeInOutQuad',
        complete: function() {
          // 파티클 효과
          if (window.createParticleEffect) {
            const rect = animationElement.querySelector('.fusion-reactor').getBoundingClientRect();
            window.createParticleEffect(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              '#8b5cf6',
              50,
              8
            );
          }
          
          setTimeout(() => {
            container.remove();
            if (callback) callback();
          }, 300);
        }
      });
    } else {
      // anime.js가 없는 경우 단순 지연
      setTimeout(() => {
        container.remove();
        if (callback) callback();
      }, 1200);
    }
  }


  // 자동화 설정 업데이트 (압축만 설정 가능)
  updateAutomationSettings() {
    if (!gameState.fusionSystem) return;

    const autoCompress = document.getElementById('auto-compress');
    const compressThreshold = document.getElementById('compress-threshold');

    if (autoCompress) autoCompress.checked = gameState.fusionSystem.autoCompress;
    if (compressThreshold) compressThreshold.value = gameState.fusionSystem.compressThreshold;
  }

  // 연구소 디스플레이 제거됨

  // 장비 목록 업데이트
  updateEquipmentList() {
    const equipmentList = document.getElementById('equipment-list');
    if (!equipmentList || !gameState.fusionSystem || !window.researchShop) return;

    equipmentList.innerHTML = '';

    const upgrades = window.researchShop.getAllUpgrades(gameState.fusionSystem);

    // 장비를 카테고리별로 그룹화
    const categories = {
      '기본 장비': ['coil', 'laser', 'analyzer', 'simulator', 'reactor'],
      '고급 장비': ['quantum', 'gravity'],
      '최첨단 장비': ['superconductor', 'atomic', 'antimatter', 'dimension'],
      '희귀 동위원소 장비': ['isotope', 'rareStorage', 'accelerator', 'entanglement']
    };

    Object.entries(categories).forEach(([categoryName, equipmentTypes]) => {
      const categoryEl = document.createElement('div');
      categoryEl.className = 'mb-6';
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'text-xl font-bold text-purple-300 mb-4';
      categoryTitle.textContent = categoryName;
      categoryEl.appendChild(categoryTitle);

      const equipmentGrid = document.createElement('div');
      equipmentGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

      equipmentTypes.forEach(type => {
        const info = upgrades[type];
        if (!info) return;

        const equipmentEl = document.createElement('div');
        equipmentEl.className = 'bg-gray-700 p-4 rounded-lg border border-gray-600';
        
        // 비용 표시 결정
        let costDisplay = '';
        if (info.currency === 'rare') {
          costDisplay = `<div class="text-sm text-purple-400">비용: ⭐${info.rareCost} (희귀 동위원소)</div>`;
        } else {
          costDisplay = `<div class="text-sm text-yellow-400">비용: 💰${info.coinCost} + ⚡${info.energyCost}</div>`;
        }

        equipmentEl.innerHTML = `
          <h4 class="text-lg font-bold text-blue-300 mb-2">${info.name}</h4>
          <p class="text-sm text-gray-400 mb-3">${info.description}</p>
          <div class="mb-3">
            <div class="text-sm">레벨: ${info.currentLevel}/${info.maxLevel}</div>
            ${costDisplay}
            <div class="text-sm text-green-400">${info.effectDescription}</div>
          </div>
          <button 
            class="upgrade-btn w-full py-2 px-4 rounded ${info.canUpgrade ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed'}" 
            ${info.canUpgrade ? '' : 'disabled'}
            data-type="${type}"
          >
            ${info.canUpgrade ? '업그레이드' : '최대 레벨'}
          </button>
        `;

        // 업그레이드 버튼 이벤트 리스너
        const upgradeBtn = equipmentEl.querySelector('.upgrade-btn');
        if (upgradeBtn && info.canUpgrade) {
          upgradeBtn.addEventListener('click', () => this.upgradeEquipment(type));
        }

        equipmentGrid.appendChild(equipmentEl);
      });

      categoryEl.appendChild(equipmentGrid);
      equipmentList.appendChild(categoryEl);
    });
  }

  // 장비 업그레이드
  upgradeEquipment(type) {
    if (!gameState.fusionSystem || !window.researchShop) return;

    const result = window.researchShop.upgrade(type, gameState.fusionSystem, gameState);
    
    if (result.success) {
      showMessage(result.message, 'success');
      this.updateResearchDisplay();
      this.updateMainUI();
    } else {
      showMessage(result.message, 'error');
    }
  }

  // 연구 정보 업데이트
  updateResearchInfo() {
    const researchInfo = document.getElementById('research-info');
    if (!researchInfo || !gameState.fusionSystem || !window.researchShop) return;

    const info = window.researchShop.getResearchInfo(gameState.fusionSystem.researchLevel);
    
    researchInfo.innerHTML = `
      <div class="mb-2">
        <div class="text-lg font-bold text-cyan-300">${info.name}</div>
        <div class="text-sm text-gray-400">${info.description}</div>
      </div>
      <div class="mb-2">
        <div class="text-sm">현재 레벨: ${info.currentLevel}</div>
        <div class="text-sm text-yellow-400">비용: 💰${info.coinCost} + ⚡${info.energyCost}</div>
        <div class="text-sm text-green-400">${info.effectDescription}</div>
      </div>
    `;
  }

  // 연구 레벨 업그레이드
  upgradeResearch() {
    if (!gameState.fusionSystem || !window.researchShop) return;

    const result = window.researchShop.upgradeResearch(gameState.fusionSystem, gameState);
    
    if (result.success) {
      showMessage(result.message, 'success');
      this.updateResearchDisplay();
      this.updateMainUI();
    } else {
      showMessage(result.message, 'error');
    }
  }

  // 연구 디스플레이 업데이트
  updateResearchDisplay() {
    this.updateResearchInfo();
    this.updateEquipmentList();
  }

  // 분자 합성 표시 업데이트
  updateMoleculeSynthesisDisplay() {
    const moleculeList = document.getElementById('molecule-synthesis-list');
    if (!moleculeList || !gameState.fusionSystem) return;

    // 상단에 보유 원소 요약 및 추천 분자 표시 컨테이너 구성
    moleculeList.innerHTML = '';

    const headerContainer = document.createElement('div');
    headerContainer.className = 'space-y-4 mb-6';

    // 보유 원소 목록
    const materials = gameState.fusionSystem.materials || {};
    const ownedWrapper = document.createElement('div');
    ownedWrapper.className = 'bg-gray-800 p-4 rounded-lg border border-gray-600';
    ownedWrapper.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-lg font-bold text-blue-300">보유 원소</h4>
        <span class="text-xs text-gray-400">합성에 사용 가능한 원소 개수</span>
      </div>
      <div class="flex flex-wrap gap-2" id="owned-elements"></div>
    `;
    headerContainer.appendChild(ownedWrapper);

    const ownedContainer = ownedWrapper.querySelector('#owned-elements');
    const materialEntries = Object.entries(materials).filter(([, c]) => c > 0);
    if (materialEntries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-gray-400 text-sm';
      empty.textContent = '보유한 원소가 없습니다. 카드 뽑기나 융합으로 원소를 확보하세요.';
      ownedContainer.appendChild(empty);
    } else {
      materialEntries
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([symbol, count]) => {
          const pill = document.createElement('span');
          pill.className = 'px-2 py-1 rounded bg-gray-700 text-gray-200 text-xs border border-gray-500';
          pill.textContent = `${symbol}: ${count}`;
          ownedContainer.appendChild(pill);
        });
    }

    // 추천 분자: 현재 보유 원소로 당장 합성 가능하거나 부족 수가 최소인 순 정렬
    const recommendWrapper = document.createElement('div');
    recommendWrapper.className = 'bg-gray-800 p-4 rounded-lg border border-green-600/40';
    recommendWrapper.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-lg font-bold text-green-300">추천 분자</h4>
        <span class="text-xs text-gray-400">보유 원소 기반 추천</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="recommended-molecules"></div>
    `;
    headerContainer.appendChild(recommendWrapper);

    const recommendedContainer = recommendWrapper.querySelector('#recommended-molecules');
    const moleculesData = gameState.moleculesData || [];
    const recommendations = moleculesData.map(m => {
      const req = m.elementCounts || {};
      let missing = 0;
      let craftableTimes = Infinity;
      Object.entries(req).forEach(([sym, need]) => {
        const have = materials[sym] || 0;
        if (have < need) missing += (need - have);
        craftableTimes = Math.min(craftableTimes, Math.floor(have / need));
      });
      if (craftableTimes === Infinity) craftableTimes = 0;
      const priority = (m.rarity === 'legendary') ? 0 : (m.rarity === 'epic' ? 1 : (m.rarity === 'rare' ? 2 : 3));
      return { data: m, missing, craftableTimes, priority };
    })
    .sort((a, b) => (a.missing - b.missing) || (a.priority - b.priority))
    .slice(0, 6);

    if (recommendations.length === 0) {
      const none = document.createElement('div');
      none.className = 'text-gray-400 text-sm';
      none.textContent = '추천할 분자가 없습니다.';
      recommendedContainer.appendChild(none);
    } else {
      recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'bg-gray-700 p-3 rounded border border-gray-600';
        const reqList = Object.entries(rec.data.elementCounts || {})
          .map(([sym, cnt]) => `<span class="px-2 py-0.5 rounded bg-gray-800 text-xs ${((materials[sym]||0) >= cnt) ? 'text-green-300' : 'text-red-300'}">${sym}:${cnt}</span>`)
          .join(' ');
        const canCraft = rec.missing === 0;
        card.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <div class="font-bold ${canCraft ? 'text-green-300' : 'text-gray-200'}">${rec.data.name} (${rec.data.symbol || rec.data.formula || ''})</div>
            ${canCraft ? `<span class="text-xs text-green-300">합성 가능 ×${Math.max(1, rec.craftableTimes)}</span>` : `<span class="text-xs text-yellow-300">부족: ${rec.missing}</span>`}
          </div>
          <div class="flex flex-wrap gap-1">${reqList}</div>
        `;
        recommendedContainer.appendChild(card);
      });
    }

    moleculeList.appendChild(headerContainer);

    const availableMolecules = [
      { id: 'h2o', name: '물', symbol: 'H₂O', recipe: { 'H': 2, 'O': 1 }, priority: 'high' },
      { id: 'o2', name: '산소', symbol: 'O₂', recipe: { 'O': 2 }, priority: 'high' },
      { id: 'n2', name: '질소', symbol: 'N₂', recipe: { 'N': 2 }, priority: 'high' },
      { id: 'co2', name: '이산화탄소', symbol: 'CO₂', recipe: { 'C': 1, 'O': 2 }, priority: 'high' },
      { id: 'no2', name: '이산화질소', symbol: 'NO₂', recipe: { 'N': 1, 'O': 2 }, priority: 'high' },
      { id: 'nh3', name: '암모니아', symbol: 'NH₃', recipe: { 'N': 1, 'H': 3 }, priority: 'high' },
      { id: 'hcl', name: '염화수소', symbol: 'HCl', recipe: { 'H': 1, 'Cl': 1 }, priority: 'high' },
      { id: 'h2so4', name: '황산', symbol: 'H₂SO₄', recipe: { 'H': 2, 'S': 1, 'O': 4 }, priority: 'medium' },
      { id: 'hno3', name: '질산', symbol: 'HNO₃', recipe: { 'H': 1, 'N': 1, 'O': 3 }, priority: 'medium' },
      { id: 'naoh', name: '수산화나트륨', symbol: 'NaOH', recipe: { 'Na': 1, 'O': 1, 'H': 1 }, priority: 'medium' },
      { id: 'caco3', name: '탄산칼슘', symbol: 'CaCO₃', recipe: { 'Ca': 1, 'C': 1, 'O': 3 }, priority: 'medium' },
      { id: 'nacl', name: '염화나트륨', symbol: 'NaCl', recipe: { 'Na': 1, 'Cl': 1 }, priority: 'medium' },
      { id: 'ch4', name: '메탄', symbol: 'CH₄', recipe: { 'C': 1, 'H': 4 }, priority: 'low' },
      { id: 'c6h12o6', name: '포도당', symbol: 'C₆H₁₂O₆', recipe: { 'C': 6, 'H': 12, 'O': 6 }, priority: 'low' },
      { id: 'c2h5oh', name: '에탄올', symbol: 'C₂H₅OH', recipe: { 'C': 2, 'H': 6, 'O': 1 }, priority: 'low' },
      { id: 'c8h10n4o2', name: '카페인', symbol: 'C₈H₁₀N₄O₂', recipe: { 'C': 8, 'H': 10, 'N': 4, 'O': 2 }, priority: 'low' }
    ];

    // 리스트 본문 시작 라벨
    const listHeader = document.createElement('h4');
    listHeader.className = 'text-md font-bold text-green-300 mt-2 mb-2';
    listHeader.textContent = '모든 분자';
    moleculeList.appendChild(listHeader);

    // 우선순위별로 분자 정렬 (high -> medium -> low)
    const sortedMolecules = availableMolecules.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    sortedMolecules.forEach(molecule => {
      const energyCost = gameState.fusionSystem.calculateMoleculeEnergyCost(molecule.id);
      const requiredMaterials = gameState.fusionSystem.calculateMoleculeRequiredMaterials(molecule.id);
      const ownedCount = gameState.fusionSystem.materials[molecule.id] || 0;
      try { console.log('[UI] molecule card', molecule.id, 'owned=', ownedCount, 'required=', requiredMaterials); } catch(e) {}
      
      // 재료 충족 여부 확인
      let canSynthesize = true;
      let missingMaterials = [];
      
      for (const [element, required] of Object.entries(requiredMaterials)) {
        if (gameState.fusionSystem.materials[element] < required) {
          canSynthesize = false;
          missingMaterials.push(`${element} (${gameState.fusionSystem.materials[element]}/${required})`);
        }
      }
      
      if (gameState.fusionSystem.energy < energyCost) {
        canSynthesize = false;
      }

      const moleculeEl = document.createElement('div');
      moleculeEl.className = `bg-gray-600 p-4 rounded-lg ${canSynthesize ? 'hover:bg-gray-500' : 'opacity-50'}`;
      
      moleculeEl.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h4 class="text-lg font-bold text-green-300">${molecule.name} (${molecule.symbol})</h4>
          <span class="text-sm text-gray-400">에너지: ${energyCost}</span>
        </div>
        
        <div class="mb-3">
          <div class="text-sm text-gray-300 mb-1">필요 재료:</div>
          <div class="flex flex-wrap gap-2">
            ${Object.entries(requiredMaterials).map(([element, count]) => 
              `<span class="bg-gray-700 px-2 py-1 rounded text-xs ${gameState.fusionSystem.materials[element] >= count ? 'text-green-300' : 'text-red-300'}">${element}: ${count}</span>`
            ).join('')}
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-400">
            보유: ${ownedCount}개
          </div>
          <button 
            class="synthesize-molecule-btn ${canSynthesize ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 cursor-not-allowed'} text-white py-1 px-3 rounded text-sm"
            data-molecule-id="${molecule.id}"
            ${!canSynthesize ? 'disabled' : ''}
          >
            ${canSynthesize ? '합성' : '재료 부족'}
          </button>
        </div>
      `;
      
      moleculeList.appendChild(moleculeEl);
    });

    // 합성 버튼 이벤트 리스너 추가
    const synthesizeBtns = moleculeList.querySelectorAll('.synthesize-molecule-btn');
    synthesizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const moleculeId = e.target.dataset.moleculeId;
        this.synthesizeMolecule(moleculeId);
      });
    });
  }

  // 분자 합성 실행
  synthesizeMolecule(moleculeId) {
    try {
      if (!gameState.fusionSystem) {
        console.warn('fusionSystem이 없습니다. window.fusionSystem을 사용합니다.');
        if (!window.fusionSystem) {
          showMessage('핵융합 시스템이 초기화되지 않았습니다.', 'error');
          return;
        }
        // window.fusionSystem을 gameState에 연결
        gameState.fusionSystem = window.fusionSystem;
      }

      if (!moleculeId || typeof moleculeId !== 'string') {
        showMessage('잘못된 분자 ID입니다.', 'error');
        return;
      }

    const result = gameState.fusionSystem.performMoleculeSynthesis(moleculeId);
    
    if (result.success) {
      // 합성 애니메이션: 사용된 원소 심볼 배열 생성
      try {
        const required = gameState.fusionSystem.calculateMoleculeRequiredMaterials(moleculeId) || {};
        const elementsUsed = [];
        Object.entries(required).forEach(([sym, cnt]) => {
            if (Number.isInteger(cnt) && cnt > 0) {
          for (let i = 0; i < cnt; i++) elementsUsed.push(sym);
            }
        });
        if (typeof window.showMoleculeAnimation === 'function') {
          window.showMoleculeAnimation(moleculeId.toUpperCase(), elementsUsed);
        }
        // 분자 특수능력 애니메이션 (효과 타입 조회)
        const molData = (gameState.moleculesData || []).find(m => m.id === moleculeId);
        const effectType = molData?.effects?.type;
        if (effectType && typeof window.playMoleculeSpecialAnimation === 'function') {
          window.playMoleculeSpecialAnimation(effectType);
        }
        } catch (e) { 
          console.warn('합성 애니메이션 실행 중 오류', e); 
        }
      showMessage(result.message, 'success');
      this.updateMoleculeSynthesisDisplay();
      this.updateMainUI();
    } else {
        const messageType = result.message.includes('에너지가 부족') ? 'energy' : 
                          result.message.includes('재료') ? 'warning' : 'error';
        showMessage(result.message, messageType);
      }
    } catch (error) {
      console.error('[synthesizeMolecule] 분자 합성 중 오류:', error);
      showMessage(`분자 합성 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  }

  // 메인 UI 업데이트 (에너지, 열 표시)
  updateMainUI() {
    try {
    if (!gameState.fusionSystem) return;

    const energyEl = document.getElementById('energy-amount');
    const heatEl = document.getElementById('heat-amount');

    if (energyEl) {
      const currentEnergy = Number.isFinite(Number(gameState.fusionSystem.energy)) ? Number(gameState.fusionSystem.energy) : 0;
      if (!Number.isFinite(gameState.fusionSystem.energy)) {
        gameState.fusionSystem.energy = currentEnergy; // 상태 복구
      }
      energyEl.textContent = currentEnergy;
      // 에너지가 부족할 때 시각적 표시
      if (currentEnergy < 10) {
        energyEl.classList.add('text-red-400', 'animate-pulse');
        energyEl.classList.remove('text-yellow-400');
      } else if (currentEnergy < 50) {
        energyEl.classList.add('text-yellow-400');
        energyEl.classList.remove('text-red-400', 'animate-pulse');
      } else {
        energyEl.classList.remove('text-red-400', 'text-yellow-400', 'animate-pulse');
      }
    }
      if (heatEl) heatEl.textContent = gameState.fusionSystem.heat || 0;
    } catch (error) {
      console.error('[updateMainUI] UI 업데이트 중 오류:', error);
    }
  }


  // 자동화 체크 (턴마다 호출)
  checkAutomation() {
    this._performAutomationCheck();
  }

  // 즉시 자동화 체크 (카드 배치 시 호출)
  checkAutomationImmediate() {
    this._performAutomationCheck();
  }

  // 내부 자동화 체크 메서드 (중복 제거)
  _performAutomationCheck() {
    try {
    if (!gameState.fusionSystem) return;

    // 자동 압축 체크
    const compressResults = gameState.fusionSystem.checkAutoCompress();
    if (compressResults && compressResults.length > 0) {
      // 압축 결과를 상세히 표시
      let message = '자동 압축 완료!\n';
      compressResults.forEach(result => {
        message += `\n${result.element}: ${result.steps.join(', ')}`;
      });
      showMessage(message, 'info');
      this.updateMainUI();
      // 손패 UI 업데이트
      if (typeof renderPlayerHand === 'function') {
        renderPlayerHand();
      }
    }

    // 열 냉각
    gameState.fusionSystem.coolDown();
    this.updateMainUI();
    } catch (error) {
      console.error('[자동화 체크] 오류 발생:', error);
    }
  }

  // 배치 융합 이벤트 리스너 설정
  setupBatchFusionListeners() {
    // 모두 선택 버튼
    const selectAllBtn = document.getElementById('select-all-fusion');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.fusion-checkbox:not(:disabled)');
        checkboxes.forEach(checkbox => {
          checkbox.checked = true;
        });
      });
    }

    // 선택 해제 버튼
    const clearSelectionBtn = document.getElementById('clear-fusion-selection');
    if (clearSelectionBtn) {
      clearSelectionBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.fusion-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
      });
    }

    // 모두 융합 버튼
    const fuseAllBtn = document.getElementById('fuse-all-btn');
    if (fuseAllBtn) {
      fuseAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.fusion-checkbox:checked');
        const targetZs = Array.from(checkboxes).map(cb => parseInt(cb.dataset.targetZ));
        if (targetZs.length > 0) {
          this.performBatchFusion(targetZs);
        } else {
          showMessage('융합할 원소를 선택해주세요.', 'warning');
        }
      });
    }

    // 선택한 원소들 융합 버튼
    const batchFusionBtn = document.getElementById('batch-fusion-btn');
    if (batchFusionBtn) {
      batchFusionBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.fusion-checkbox:checked');
        const targetZs = Array.from(checkboxes).map(cb => parseInt(cb.dataset.targetZ));
        if (targetZs.length > 0) {
          this.performBatchFusion(targetZs);
        } else {
          showMessage('융합할 원소를 선택해주세요.', 'warning');
        }
      });
    }

    // 최대 융합 버튼
    const maxFusionBtn = document.getElementById('max-fusion-btn');
    if (maxFusionBtn) {
      maxFusionBtn.addEventListener('click', () => {
        this.performMaxFusion();
      });
    }
  }

  // 배치 융합 실행
  performBatchFusion(targetZs) {
    if (!gameState.fusionSystem) {
      showMessage('핵융합 시스템이 초기화되지 않았습니다.', 'error');
      return;
    }

    if (!Array.isArray(targetZs) || targetZs.length === 0) {
      showMessage('융합할 원소가 없습니다.', 'warning');
      return;
    }

    // 융합 가능한 원소들만 필터링 (25번까지만 핵융합)
    const validTargets = targetZs.filter(Z => {
      if (!Number.isInteger(Z) || Z < 2 || Z > 25) return false; // 25번까지만 핵융합
      
      const required = gameState.fusionSystem.calculateRequiredMaterials(Z);
      const energyCost = gameState.fusionSystem.calculateEnergyCost(Z);
      const previousElement = gameState.fusionSystem.getSymbolByNumber(Z - 1);
      const available = gameState.fusionSystem.materials[previousElement] || 0;
      const fsEnergy = Number.isFinite(Number(gameState.fusionSystem.energy)) ? Number(gameState.fusionSystem.energy) : 0;
      
      return available >= required && fsEnergy >= energyCost;
    });

    if (validTargets.length === 0) {
      showMessage('융합 가능한 원소가 없습니다.', 'warning');
      return;
    }

    // 융합 애니메이션 표시
    this.showFusionAnimation(validTargets, () => {
      try {
        let successCount = 0;
        let totalEnergyUsed = 0;

        validTargets.forEach(Z => {
          const result = gameState.fusionSystem.performFusion(Z);
          if (result.success) {
            successCount++;
            const energyCost = gameState.fusionSystem.calculateEnergyCost(Z);
            totalEnergyUsed += energyCost;
          }
        });

        if (successCount > 0) {
          showMessage(`배치 융합 완료! ${successCount}개 원소 융합 (에너지: ${totalEnergyUsed})`, 'success');
          this.updateFusionDisplay();
      this.updateMainUI();
      // 손패 UI 업데이트
      if (typeof renderPlayerHand === 'function') {
        renderPlayerHand();
      }
        } else {
          showMessage('융합에 실패했습니다.', 'error');
        }
      } catch (error) {
        console.error('[performBatchFusion] 배치 융합 실행 중 오류:', error);
        showMessage(`배치 융합 실행 중 오류가 발생했습니다: ${error.message}`, 'error');
      }
    });
  }

  // 최대 융합 실행
  performMaxFusion() {
    if (!gameState.fusionSystem) {
      showMessage('핵융합 시스템이 초기화되지 않았습니다.', 'error');
      return;
    }

    try {
      // 융합 애니메이션 표시 (대상이 많을 수 있으므로 일반적인 애니메이션)
      this.showFusionAnimation([], () => {
        try {
          const result = gameState.fusionSystem.performMaxFusion();
          
          if (result.success) {
            showMessage(result.message, 'success');
            this.updateFusionDisplay();
            this.updateMainUI();
            
            // 손패 UI 업데이트
            if (typeof renderPlayerHand === 'function') {
              renderPlayerHand();
            }
            
            // materials 동기화 (손패 변경 반영)
            if (gameState.fusionSystem && typeof gameState.fusionSystem.syncMaterialsFromHand === 'function') {
              gameState.fusionSystem.syncMaterialsFromHand();
            }
          } else {
            const messageType = result.message.includes('에너지가 부족') ? 'energy' : 
                              result.message.includes('재료') ? 'warning' : 'error';
            showMessage(result.message, messageType);
          }
        } catch (error) {
          console.error('[performMaxFusion] 최대 융합 실행 중 오류:', error);
          showMessage(`최대 융합 실행 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
      });
    } catch (error) {
      console.error('[performMaxFusion] UI 오류:', error);
      showMessage(`최대 융합 UI 오류가 발생했습니다: ${error.message}`, 'error');
    }
  }

  // 에너지 변환 이벤트 리스너 설정
  setupEnergyConversionListeners() {
    const convertHToEnergyBtn = document.getElementById('convert-h-to-energy');
    if (convertHToEnergyBtn) {
      convertHToEnergyBtn.addEventListener('click', () => {
        if (gameState.fusionSystem) {
          const hCount = gameState.fusionSystem.materials.H || 0;
          if (hCount > 0) {
            const energyGained = Math.min(hCount, 50); // 최대 50 에너지
            gameState.fusionSystem.materials.H = Math.max(0, hCount - energyGained);
            gameState.fusionSystem.energy += energyGained;
            showMessage(`H ${energyGained}개를 에너지로 변환했습니다!`, 'success');
            this.updateFusionDisplay();
    this.updateMainUI();
          } else {
            showMessage('H가 부족합니다.', 'warning');
          }
        }
      });
    }
  }

  // 화학 합성실 선택 초기화
  clearChemLabSelection(isInline = false) {
    this.chemLabSelection = [];
    
    // UI에서 선택 표시 제거
    const selectedElements = document.querySelectorAll('.chem-lab-element.selected');
    selectedElements.forEach(el => {
      el.classList.remove('selected');
    });
    
    if (isInline) {
      // 인라인 합성실 UI 업데이트
      this.updateInlineChemLabDisplay();
    }
    
    showMessage('합성실 선택이 초기화되었습니다.', 'info');
  }

  // 화학 합성실 합성 실행
  performChemLabSynthesis() {
    if (!gameState.fusionSystem) {
      showMessage('핵융합 시스템이 초기화되지 않았습니다.', 'error');
      return;
    }

    if (this.chemLabSelection.length === 0) {
      showMessage('합성할 원소를 선택해주세요.', 'warning');
      return;
    }

    // 선택된 원소들의 수량 계산
    const elementCounts = {};
    this.chemLabSelection.forEach(symbol => {
      elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
    });

    // 재료 충족 여부 확인
    const materials = gameState.fusionSystem.materials;
    for (const [symbol, needed] of Object.entries(elementCounts)) {
      if ((materials[symbol] || 0) < needed) {
        showMessage(`${symbol}가 부족합니다. (필요: ${needed}, 보유: ${materials[symbol] || 0})`, 'warning');
        return;
      }
    }

    // 에너지 확인 (기본 10 에너지)
    const energyCost = 10;
    if (gameState.fusionSystem.energy < energyCost) {
      showMessage(`에너지가 부족합니다. (필요: ${energyCost}, 보유: ${gameState.fusionSystem.energy})`, 'warning');
      return;
    }

    // 재료 소모 및 에너지 사용
    for (const [symbol, needed] of Object.entries(elementCounts)) {
      materials[symbol] = Math.max(0, (materials[symbol] || 0) - needed);
    }
    gameState.fusionSystem.energy -= energyCost;

    // 랜덤 원소 생성 (1-92번 원소 중에서)
    const randomElementNumber = Math.floor(Math.random() * 92) + 1;
    const element = gameState.elementsData.find(e => e.number === randomElementNumber);
    
    if (element) {
      materials[element.symbol] = (materials[element.symbol] || 0) + 1;
      showMessage(`합성 성공! ${element.name}(${element.symbol}) 원소를 획득했습니다!`, 'success');
      
      // 선택 초기화
      this.clearChemLabSelection(true);
      
      // UI 업데이트
      this.updateFusionDisplay();
      this.updateMainUI();
      
      // 손패 UI 업데이트
      if (typeof renderPlayerHand === 'function') {
        renderPlayerHand();
      }
    } else {
      showMessage('합성에 실패했습니다.', 'error');
    }
  }

  // 인라인 화학 합성실 디스플레이 업데이트
  updateInlineChemLabDisplay() {
    const selectionDisplay = document.getElementById('chem-lab-selection-display');
    if (selectionDisplay) {
      if (this.chemLabSelection.length === 0) {
        selectionDisplay.innerHTML = '<div class="text-gray-400 text-center py-4">합성할 원소를 선택하세요</div>';
      } else {
        const elementCounts = {};
        this.chemLabSelection.forEach(symbol => {
          elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
        });
        
        const elementsHtml = Object.entries(elementCounts)
          .map(([symbol, count]) => `<span class="bg-blue-600 text-white px-2 py-1 rounded text-sm">${symbol}×${count}</span>`)
          .join(' ');
        
        selectionDisplay.innerHTML = `
          <div class="text-center">
            <div class="text-sm text-gray-300 mb-2">선택된 원소:</div>
            <div class="flex flex-wrap gap-2 justify-center">${elementsHtml}</div>
          </div>
        `;
      }
    }
  }

}

// 전역 인스턴스
window.fusionUI = new FusionUI();

// 전역 함수로 노출
window.checkAutomationImmediate = function() {
  if (window.fusionUI && window.fusionUI.checkAutomationImmediate) {
    window.fusionUI.checkAutomationImmediate();
  }
};
