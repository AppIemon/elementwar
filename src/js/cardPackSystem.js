// 카드 팩 시스템
export class CardPackSystem {
  constructor() {
    this.packTypes = {
      bronze: {
        name: '브론즈 팩',
        cost: 5,
        cardCount: 5,
        rarities: { common: 75, uncommon: 20, rare: 5, epic: 0, legendary: 0 },
        description: '입문자용 기본 원소 팩'
      },
      silver: {
        name: '실버 팩',
        cost: 12,
        cardCount: 6,
        rarities: { common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0 },
        description: '균형 잡힌 원소 구성 팩'
      },
      gold: {
        name: '골드 팩',
        cost: 22,
        cardCount: 7,
        rarities: { common: 35, uncommon: 35, rare: 20, epic: 8, legendary: 2 },
        description: '희귀 원소 비중이 높은 팩'
      },
      platinum: {
        name: '플래티넘 팩',
        cost: 35,
        cardCount: 8,
        rarities: { common: 20, uncommon: 35, rare: 28, epic: 12, legendary: 5 },
        description: '상위 원소 등장 확률 증가 팩'
      },
      legendary: {
        name: '레전드 팩',
        cost: 60,
        cardCount: 9,
        rarities: { common: 5, uncommon: 15, rare: 40, epic: 25, legendary: 15 },
        description: '최상급 원소 전용 프리미엄 팩'
      }
    };
    
    // 모든 팩은 동일 희귀도 분포를 사용하고, 카드 수만 다르게 함
    // (팩 희귀도는 카드 수로 차별화)
    this.useUnifiedRarity = true;
    this.defaultRarities = { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 };
    
    this.isOpeningPack = false;
    this.currentPack = null;
    this.openedCards = [];

    // 팩 가격에 따른 카드 수를 기하급수적으로 증가시키도록 재계산
    // baseCost는 가장 저렴한 팩의 가격, baseCount는 해당 팩의 기본 카드 수로 설정
    this.recalculateCardCountsByPrice();
  }

  // 팩 가격 기반 카드 수 재계산 (기하급수 증가)
  recalculateCardCountsByPrice() {
    const packEntries = Object.entries(this.packTypes);
    if (packEntries.length === 0) return;

    // 가장 낮은 가격과 그 카드 수를 기준점으로 사용
    let baseCost = Infinity;
    let baseCount = 5;
    for (const [, pack] of packEntries) {
      if (pack.cost < baseCost) {
        baseCost = pack.cost;
        baseCount = pack.cardCount || baseCount;
      }
    }

    // 지수 성장 계수 (필요 시 튜닝 가능)
    const exponent = 1.2; // 1보다 크면 기하급수적 증가 느낌을 줌

    for (const [, pack] of packEntries) {
      const ratio = Math.max(1, pack.cost / baseCost);
      const computed = Math.round(baseCount * Math.pow(ratio, exponent));
      // 최소 보장은 기존 설정값 유지, 그 이상은 계산값 채택
      pack.cardCount = Math.max(pack.cardCount || baseCount, computed);
    }
  }

  // 카드 팩 구매
  buyPack(packType, playerCoins) {
    const pack = this.packTypes[packType];
    if (!pack) {
      throw new Error('존재하지 않는 팩 타입입니다.');
    }

    if (playerCoins < pack.cost) {
      throw new Error('코인이 부족합니다.');
    }

    return {
      pack: pack,
      cost: pack.cost,
      success: true
    };
  }

  // 카드 팩 열기
  openPack(packType) {
    if (this.isOpeningPack) {
      return { success: false, message: '이미 팩을 열고 있습니다.' };
    }

    const pack = this.packTypes[packType];
    if (!pack) {
      return { success: false, message: '존재하지 않는 팩 타입입니다.' };
    }

    this.isOpeningPack = true;
    this.currentPack = pack;
    this.openedCards = [];

    // 카드 생성
    for (let i = 0; i < pack.cardCount; i++) {
      const card = this.generateCardFromPack(pack);
      if (card) {
        this.openedCards.push(card);
      } else {
        console.error(`카드 생성 실패 (${i + 1}/${pack.cardCount})`);
        // 카드 생성에 실패해도 계속 진행
      }
    }

    // 최소 하나의 카드라도 생성되었는지 확인
    if (this.openedCards.length === 0) {
      this.isOpeningPack = false;
      
      // 온라인 대전에서 elementsData가 로드되지 않았을 때의 특별 처리
      if (onlineGameState && onlineGameState.isOnline && (!gameState.elementsData || gameState.elementsData.length === 0)) {
        return { success: false, message: '게임 데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.' };
      }
      
      return { success: false, message: '카드를 생성할 수 없습니다.' };
    }

    return {
      success: true,
      cards: this.openedCards,
      pack: pack
    };
  }

  // 팩에서 카드 생성
  generateCardFromPack(pack) {
    const rarity = this.selectRarity(this.useUnifiedRarity ? this.defaultRarities : pack.rarities);
    const isLastPack = this.isLastPack(pack);
    const element = this.selectElementByRarity(rarity, isLastPack);
    
    if (!element) {
      console.error('원소를 찾을 수 없습니다:', rarity);
      // 기본 원소(H)를 대체로 사용
      const fallbackElement = this.getFallbackElement();
      if (!fallbackElement) {
        console.error('대체 원소도 찾을 수 없습니다.');
        
        // 온라인 대전에서 데이터가 로드되지 않았을 때 재시도
        if (onlineGameState && onlineGameState.isOnline) {
          console.log('온라인 대전: elementsData 로딩을 기다린 후 재시도합니다.');
          return null; // null을 반환하여 상위에서 처리하도록 함
        }
        
        return null;
      }
      return this.createCardFromElement(fallbackElement, rarity, pack);
    }

    return this.createCardFromElement(element, rarity, pack);
  }

  // 대체 원소 가져오기 (H 원소)
  getFallbackElement() {
    if (!gameState.elementsData || !Array.isArray(gameState.elementsData) || gameState.elementsData.length === 0) {
      console.error('원소 데이터가 로드되지 않았습니다. gameState.elementsData:', gameState.elementsData);
      
      // 온라인 대전에서 데이터 로딩을 기다려보기
      if (onlineGameState && onlineGameState.isOnline) {
        console.log('온라인 대전: elementsData 로딩을 기다립니다...');
        return null; // null을 반환하여 상위에서 처리하도록 함
      }
      
      return null;
    }
    
    const hydrogenElement = gameState.elementsData.find(e => e.symbol === 'H');
    if (hydrogenElement) {
      return hydrogenElement;
    }
    
    // H가 없으면 첫 번째 유효한 원소 반환
    const validElement = gameState.elementsData.find(e => e && e.baseHp && e.baseAtk);
    if (validElement) {
      console.warn('H 원소를 찾을 수 없어서 첫 번째 유효한 원소를 사용합니다:', validElement.symbol);
      return validElement;
    }
    
    console.error('유효한 원소를 찾을 수 없습니다.');
    return null;
  }

  // 원소로부터 카드 생성
  createCardFromElement(element, rarity, pack) {
    if (!element || !element.baseHp || !element.baseAtk) {
      console.error('유효하지 않은 원소 데이터:', element);
      return null;
    }

    const card = new ElementCard(element, element.baseHp, element.baseAtk);
    card.rarity = rarity;
    card.packOrigin = pack.name;
    
    return card;
  }

  // 등급 선택
  selectRarity(rarities) {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(rarities)) {
      cumulative += chance;
      if (random <= cumulative) {
        return rarity;
      }
    }
    
    return 'common'; // 기본값
  }

  // 등급에 따른 원소 선택 (현재까지 발견된 최상위 원소 번호 / 2까지만)
  selectElementByRarity(rarity, isLastPack) {
    console.log('[selectElementByRarity] 시작 - rarity:', rarity, 'isLastPack:', isLastPack);
    
    if (!gameState.elementsData || !Array.isArray(gameState.elementsData)) {
      console.error('원소 데이터가 로드되지 않았습니다. gameState.elementsData:', gameState.elementsData);
      return null;
    }

    console.log('[selectElementByRarity] 원소 데이터 개수:', gameState.elementsData.length);

    // 현재까지 발견된 최상위 원소 번호 - 2까지만 등장
    const maxDiscovered = (typeof getMaxDiscoveredElementNumber === 'function') ? getMaxDiscoveredElementNumber() : 1;
    console.log('[selectElementByRarity] maxDiscovered:', maxDiscovered);
    
    // 최소 cap을 1로 설정하여 H는 항상 나올 수 있도록 함
    const cap = Math.max(1, maxDiscovered - 2);
    console.log('[selectElementByRarity] cap:', cap);
    
    const availableElements = gameState.elementsData.filter(e => {
      const isValid = e && 
        typeof e.number === 'number' && 
        e.number <= cap &&
        e.baseHp && 
        e.baseAtk;
      
      if (!isValid && e) {
        console.log('[selectElementByRarity] 필터링된 원소:', e.symbol, 'number:', e.number, 'baseHp:', e.baseHp, 'baseAtk:', e.baseAtk);
      }
      
      return isValid;
    });
    
    console.log('[selectElementByRarity] 사용 가능한 원소 개수:', availableElements.length);
    
    if (availableElements.length === 0) {
      console.error('사용 가능한 원소가 없습니다. cap:', cap, 'maxDiscovered:', maxDiscovered);
      // 디버깅을 위해 첫 번째 원소라도 반환
      const firstElement = gameState.elementsData.find(e => e && e.baseHp && e.baseAtk);
      if (firstElement) {
        console.warn('[selectElementByRarity] 디버깅: 첫 번째 유효한 원소를 반환합니다:', firstElement.symbol);
        return firstElement;
      }
      return null;
    }

    const elementsOfRarity = availableElements.filter(e => (e.rarity || 'common') === rarity);
    console.log('[selectElementByRarity] 해당 등급 원소 개수:', elementsOfRarity.length);
    
    if (elementsOfRarity.length === 0) {
      // 해당 등급의 원소가 없으면 사용 가능한 원소에서 선택
      console.warn(`등급 '${rarity}'에 해당하는 원소가 없어서 사용 가능한 원소에서 선택합니다.`);
      const randomIndex = Math.floor(Math.random() * availableElements.length);
      return availableElements[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * elementsOfRarity.length);
    return elementsOfRarity[randomIndex];
  }

  // 마지막 팩인지 확인 (정렬된 키의 마지막 항목 기준)
  isLastPack(pack) {
    const keys = Object.keys(this.packTypes);
    const lastKey = keys[keys.length - 1];
    const lastPack = this.packTypes[lastKey];
    return lastPack && lastPack.name === pack.name;
  }

  // 팩 열기 완료
  finishPackOpening() {
    this.isOpeningPack = false;
    this.currentPack = null;
    this.openedCards = [];
  }

  // 팩 정보 가져오기
  getPackInfo(packType) {
    return this.packTypes[packType] || null;
  }

  // 모든 팩 타입 가져오기
  getAllPackTypes() {
    return Object.keys(this.packTypes);
  }
}

// 카드 팩 UI 관리
class CardPackUI {
  constructor() {
    this.packSystem = new CardPackSystem();
    this.packModal = null;
    this.openingAnimation = null;
  }

  // 팩 선택 모달 표시
  showPackSelectionModal() {
    this.createPackModal();
    this.packModal.classList.remove('hidden');
    this.renderPackOptions();
  }

  // 팩 모달 생성
  createPackModal() {
    if (this.packModal) {
      return;
    }

    this.packModal = document.createElement('div');
    this.packModal.id = 'card-pack-modal';
    this.packModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    
    this.packModal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">카드 팩 상점</h2>
          <button id="close-pack-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div id="pack-selection" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <!-- 팩 옵션들이 여기에 렌더링됩니다 -->
        </div>
        
        <div id="pack-opening" class="hidden">
          <div class="text-center">
            <h3 class="text-xl font-bold text-white mb-4">팩을 여는 중...</h3>
            <div id="pack-animation" class="mb-6">
              <!-- 팩 열기 애니메이션이 여기에 표시됩니다 -->
            </div>
            <div id="opened-cards" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <!-- 열린 카드들이 여기에 표시됩니다 -->
            </div>
            <button id="close-pack-opening" class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              확인
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.packModal);

    // 이벤트 리스너 추가
    document.getElementById('close-pack-modal').addEventListener('click', () => {
      this.hidePackModal();
    });

    document.getElementById('close-pack-opening').addEventListener('click', () => {
      this.hidePackOpening();
    });
  }

  // 팩 옵션 렌더링
  renderPackOptions() {
    const packSelection = document.getElementById('pack-selection');
    if (!packSelection) return;

    const playerCoins = getCoinAmount('player');
    
    packSelection.innerHTML = '';
    
    this.packSystem.getAllPackTypes().forEach(packType => {
      const pack = this.packSystem.getPackInfo(packType);
      const canAfford = playerCoins >= pack.cost;
      
      const packElement = document.createElement('div');
      packElement.className = `bg-gray-700 rounded-lg p-6 text-center ${canAfford ? 'hover:bg-gray-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`;
      
      packElement.innerHTML = `
        <div class="text-3xl mb-4">📦</div>
        <h3 class="text-xl font-bold text-white mb-2">${pack.name}</h3>
        <p class="text-gray-300 mb-4">${pack.description}</p>
        <div class="text-sm text-gray-400 mb-4">
          <div>카드 수: ${pack.cardCount}장</div>
          <div>가격: ${pack.cost} 코인</div>
        </div>
        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}" 
                ${!canAfford ? 'disabled' : ''} 
                data-pack-type="${packType}">
          ${canAfford ? '구매하기' : '코인 부족'}
        </button>
      `;
      
      if (canAfford) {
        packElement.addEventListener('click', () => {
          this.buyAndOpenPack(packType);
        });
      }
      
      packSelection.appendChild(packElement);
    });
  }

  // 팩 구매 및 열기
  buyAndOpenPack(packType) {
    try {
      const playerCoins = getCoinAmount('player');
      const result = this.packSystem.buyPack(packType, playerCoins);
      
      if (result.success) {
        // 코인 차감
        if (spendCoins(result.cost, 'player')) {
          // 팩 열기
          this.openPack(packType);
        } else {
          showMessage('코인 사용 중 오류가 발생했습니다.', 'error');
        }
      }
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  // 팩 열기
  openPack(packType) {
    const result = this.packSystem.openPack(packType);
    
    if (result.success) {
      this.showPackOpening(result.cards, result.pack);
    } else {
      showMessage(result.message, 'error');
    }
  }

  // 팩 열기 화면 표시
  showPackOpening(cards, pack) {
    const packSelection = document.getElementById('pack-selection');
    const packOpening = document.getElementById('pack-opening');
    
    if (packSelection && packOpening) {
      packSelection.classList.add('hidden');
      packOpening.classList.remove('hidden');
      
      this.renderPackOpeningAnimation(cards, pack);
    }
  }

  // 팩 열기 애니메이션 렌더링
  renderPackOpeningAnimation(cards, pack) {
    const animationContainer = document.getElementById('pack-animation');
    const cardsContainer = document.getElementById('opened-cards');
    
    if (!animationContainer || !cardsContainer) return;

    // 팩 이미지와 애니메이션
    animationContainer.innerHTML = `
      <div class="relative">
        <div id="pack-image" class="w-32 h-48 mx-auto bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg shadow-lg flex items-center justify-center text-6xl transform transition-all duration-1000">
          📦
        </div>
        <div id="sparkles" class="absolute inset-0 pointer-events-none">
          <!-- 반짝이는 효과가 여기에 추가됩니다 -->
        </div>
      </div>
    `;

    // 카드들을 숨겨진 상태로 렌더링 (실제 카드 디자인 사용)
    cardsContainer.innerHTML = '';
    cards.forEach((card, index) => {
      const cardElement = createCardElement(card, false);
      cardElement.classList.add('opacity-0', 'transform', 'scale-0');
      cardElement.style.width = '120px';
      cardElement.style.height = '160px';
      cardElement.style.willChange = 'transform, opacity';
      cardsContainer.appendChild(cardElement);
    });

    // 애니메이션 시작
    this.startPackOpeningAnimation(cards);
  }

  // 팩 열기 애니메이션 시작 (anime.js 타임라인으로 부드럽게)
  startPackOpeningAnimation(cards) {
    const packImage = document.getElementById('pack-image');
    const cardElements = document.querySelectorAll('#opened-cards .card');
    
    if (!packImage || !cardElements.length) return;

    // 성능 힌트
    packImage.style.willChange = 'transform, opacity';

    if (typeof anime === 'undefined') {
      // 폴백: 기존 로직과 유사하게 동작
      packImage.classList.add('animate-bounce');
      setTimeout(() => {
        packImage.classList.remove('animate-bounce');
        packImage.classList.add('animate-pulse');
        this.addSparkleEffect();
      }, 900);
      setTimeout(() => {
        packImage.classList.add('hidden');
        this.revealCards(cardElements);
      }, 1400);
      return;
    }

    const timeline = anime.timeline({ autoplay: true });

    // 등장 + 가벼운 흔들림
    timeline
      .add({
        targets: packImage,
        opacity: [0, 1],
        scale: [0.9, 1],
        rotateZ: [0, 2, -2, 0],
        duration: 420,
        easing: 'easeOutQuad',
        begin: () => this.addSparkleEffect()
      })
      .add({
        targets: packImage,
        rotate: [
          { value: -3, duration: 120, easing: 'easeInOutQuad' },
          { value: 3, duration: 120, easing: 'easeInOutQuad' },
          { value: -2, duration: 120, easing: 'easeInOutQuad' },
          { value: 2, duration: 120, easing: 'easeInOutQuad' },
          { value: 0, duration: 120, easing: 'easeInOutQuad' }
        ],
        scale: [1, 1.05, 1],
        duration: 360
      })
      .add({
        targets: packImage,
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 240,
        easing: 'easeInQuad',
        complete: () => {
          packImage.classList.add('hidden');
        }
      })
      .add({
        duration: 0,
        complete: () => {
          this.revealCards(cardElements);
        }
      });
  }

  // 반짝이는 효과 추가
  addSparkleEffect() {
    const sparklesContainer = document.getElementById('sparkles');
    if (!sparklesContainer) return;

    for (let i = 0; i < 10; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animationDelay = Math.random() * 2 + 's';
      sparklesContainer.appendChild(sparkle);
    }
  }

  // 카드들 나타나기 (anime.js로 지터 없는 스태거 적용)
  revealCards(cardElements) {
    const useAnime = typeof anime !== 'undefined';
    
    if (useAnime) {
      anime({
        targets: cardElements,
        opacity: [0, 1],
        scale: [0, 1],
        translateY: [-10, 0],
        duration: 500,
        easing: 'easeOutBack',
        delay: anime.stagger(120),
        complete: () => {
          const gainedCards = [...this.packSystem.openedCards];
          if (typeof showInventoryEntryAnimation === 'function') {
            showInventoryEntryAnimation(gainedCards, () => {
              gainedCards.forEach(card => addCardToHand(card, 'player'));
              showMessage(`${gainedCards.length}장의 카드를 획득했습니다!`, 'success');
              updateUI();
            });
          } else {
            gainedCards.forEach(card => addCardToHand(card, 'player'));
            showMessage(`${gainedCards.length}장의 카드를 획득했습니다!`, 'success');
            updateUI();
          }
        }
      });
      return;
    }

    // 폴백
    cardElements.forEach((cardElement, index) => {
      setTimeout(() => {
        cardElement.classList.remove('opacity-0', 'scale-0');
        cardElement.classList.add('opacity-100', 'scale-100');
        cardElement.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      }, index * 200);
    });
    setTimeout(() => {
      const gainedCards = [...this.packSystem.openedCards];
      if (typeof showInventoryEntryAnimation === 'function') {
        showInventoryEntryAnimation(gainedCards, () => {
          gainedCards.forEach(card => addCardToHand(card, 'player'));
          showMessage(`${gainedCards.length}장의 카드를 획득했습니다!`, 'success');
          updateUI();
        });
      } else {
        gainedCards.forEach(card => addCardToHand(card, 'player'));
        showMessage(`${gainedCards.length}장의 카드를 획득했습니다!`, 'success');
        updateUI();
      }
    }, cardElements.length * 200 + 500);
  }

  // 팩 열기 화면 숨기기
  hidePackOpening() {
    this.packSystem.finishPackOpening();
    
    const packSelection = document.getElementById('pack-selection');
    const packOpening = document.getElementById('pack-opening');
    
    if (packSelection && packOpening) {
      packOpening.classList.add('hidden');
      packSelection.classList.remove('hidden');
    }
    
    // UI 업데이트
    updateUI();
  }

  // 팩 모달 숨기기
  hidePackModal() {
    if (this.packModal) {
      this.packModal.classList.add('hidden');
    }
  }
}

// 전역 변수로 카드 팩 UI 인스턴스 생성
window.cardPackUI = new CardPackUI();

// 카드 팩 상점 버튼 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  // 기존 이벤트 리스너 설정 후에 추가
  const setupCardPackEvents = () => {
    // 카드 팩 상점 버튼 추가 (기존 UI에)
    const existingButtons = document.querySelector('.game-controls');
    if (existingButtons && !document.getElementById('card-pack-btn')) {
      const packButton = document.createElement('button');
      packButton.id = 'card-pack-btn';
      packButton.className = 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg';
      packButton.innerHTML = '📦 카드 팩';
      packButton.addEventListener('click', () => {
        window.cardPackUI.showPackSelectionModal();
      });
      
      existingButtons.appendChild(packButton);
    }
  };

  // DOM이 완전히 로드된 후 실행
  setTimeout(setupCardPackEvents, 1000);
});
