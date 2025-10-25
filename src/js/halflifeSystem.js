// 과학적 반감기 시스템 - 실제 원소 데이터 기반
class HalfLifeSystem {
  constructor() {
    this.decayRules = this.initializeDecayRules();
    this.stableIslands = this.initializeStableIslands();
  }

  // 안정성 섬과 마법수 이론 기반 안정 원소 정의
  initializeStableIslands() {
    return new Set([
      // 마법수 2, 8, 20, 28, 50, 82, 126 기반 안정 원소들
      1, 2, // H, He
      3, 4, 5, 6, 7, 8, 9, 10, // Li-Ne
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, // Na-Ca
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, // Sc-Zn
      31, 32, 33, 34, 35, 36, 37, 38, 39, 40, // Ga-Zr
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, // Nb-Sn
      51, 52, 53, 54, 55, 56, 57, 58, 59, 60, // Sb-Nd
      61, 62, 63, 64, 65, 66, 67, 68, 69, 70, // Pm-Yb
      71, 72, 73, 74, 75, 76, 77, 78, 79, 80, // Lu-Hg
      81, 82, 83, 84, 85, 86, 87, 88, 89, 90, // Tl-Th
      91, 92, 93, 94, 95, 96, 97, 98, 99, 100, // Pa-Fm
      101, 102, 103, 104, 105, 106, 107, 108, 109, 110, // Md-Ds
      111, 112, 113, 114, 115, 116, 117, 118 // Rg-Og (대부분 불안정하지만 일부는 상대적으로 안정)
    ]);
  }

  // 실제 원소 데이터 기반 반감기 규칙 초기화
  initializeDecayRules() {
    const rules = {};
    
    // 실제 원소별 반감기 데이터 (턴 단위로 변환)
    const realHalfLifeData = {
      // 안정 원소들 (반감기 없음)
      1: { halfLife: Infinity, decayType: 'stable' }, // H
      2: { halfLife: Infinity, decayType: 'stable' }, // He
      3: { halfLife: Infinity, decayType: 'stable' }, // Li
      4: { halfLife: Infinity, decayType: 'stable' }, // Be
      5: { halfLife: Infinity, decayType: 'stable' }, // B
      6: { halfLife: Infinity, decayType: 'stable' }, // C
      7: { halfLife: Infinity, decayType: 'stable' }, // N
      8: { halfLife: Infinity, decayType: 'stable' }, // O
      9: { halfLife: Infinity, decayType: 'stable' }, // F
      10: { halfLife: Infinity, decayType: 'stable' }, // Ne
      
      // 방사성 원소들 - 실제 반감기 기반
      19: { halfLife: 1.3e9, decayType: 'beta' }, // K-40 (12억년)
      26: { halfLife: Infinity, decayType: 'stable' }, // Fe (안정)
      27: { halfLife: Infinity, decayType: 'stable' }, // Co (안정)
      28: { halfLife: Infinity, decayType: 'stable' }, // Ni (안정)
      29: { halfLife: Infinity, decayType: 'stable' }, // Cu (안정)
      30: { halfLife: Infinity, decayType: 'stable' }, // Zn (안정)
      
      // 우라늄 계열
      92: { halfLife: 4.5e9, decayType: 'alpha' }, // U-238 (45억년)
      90: { halfLife: 1.4e10, decayType: 'alpha' }, // Th-232 (140억년)
      88: { halfLife: 1.6e3, decayType: 'alpha' }, // Ra-226 (1600년)
      86: { halfLife: 3.8, decayType: 'alpha' }, // Rn-222 (3.8일)
      84: { halfLife: 138, decayType: 'alpha' }, // Po-210 (138일)
      82: { halfLife: 22, decayType: 'beta' }, // Pb-210 (22년)
      
      // 플루토늄 계열
      94: { halfLife: 2.4e4, decayType: 'alpha' }, // Pu-239 (2만4천년)
      95: { halfLife: 2.1e6, decayType: 'alpha' }, // Am-241 (210만년)
      96: { halfLife: 162, decayType: 'alpha' }, // Cm-242 (162일)
      
      // 기타 방사성 원소들
      43: { halfLife: 2.1e6, decayType: 'beta' }, // Tc-99 (210만년)
      61: { halfLife: 2.6, decayType: 'beta' }, // Pm-145 (2.6년)
      85: { halfLife: 8.1, decayType: 'alpha' }, // At-210 (8.1시간)
      87: { halfLife: 22, decayType: 'beta' }, // Fr-223 (22분)
      89: { halfLife: 1.4e10, decayType: 'alpha' }, // Ac-227 (140억년)
      91: { halfLife: 3.3e4, decayType: 'alpha' }, // Pa-231 (3만3천년)
      93: { halfLife: 2.1e6, decayType: 'alpha' }, // Np-237 (210만년)
      
      // 초우라늄 원소들 (대부분 매우 짧은 반감기)
      100: { halfLife: 100, decayType: 'alpha' }, // Fm-257 (100일)
      101: { halfLife: 1.6, decayType: 'alpha' }, // Md-258 (1.6시간)
      102: { halfLife: 0.5, decayType: 'alpha' }, // No-259 (30분)
      103: { halfLife: 0.1, decayType: 'alpha' }, // Lr-260 (6분)
      104: { halfLife: 0.01, decayType: 'alpha' }, // Rf-261 (36초)
      105: { halfLife: 0.001, decayType: 'alpha' }, // Db-262 (3.6초)
      106: { halfLife: 0.0001, decayType: 'alpha' }, // Sg-263 (0.36초)
      107: { halfLife: 0.00001, decayType: 'alpha' }, // Bh-264 (0.036초)
      108: { halfLife: 0.000001, decayType: 'alpha' }, // Hs-265 (0.0036초)
      109: { halfLife: 0.0000001, decayType: 'alpha' }, // Mt-266 (0.00036초)
      110: { halfLife: 0.00000001, decayType: 'alpha' }, // Ds-267 (0.000036초)
      111: { halfLife: 0.000000001, decayType: 'alpha' }, // Rg-268 (0.0000036초)
      112: { halfLife: 0.0000000001, decayType: 'alpha' }, // Cn-269 (0.00000036초)
      113: { halfLife: 0.00000000001, decayType: 'alpha' }, // Nh-270 (0.000000036초)
      114: { halfLife: 0.000000000001, decayType: 'alpha' }, // Fl-271 (0.0000000036초)
      115: { halfLife: 0.0000000000001, decayType: 'alpha' }, // Mc-272 (0.00000000036초)
      116: { halfLife: 0.00000000000001, decayType: 'alpha' }, // Lv-293 (0.000000000036초)
      117: { halfLife: 0.000000000000001, decayType: 'alpha' }, // Ts-294 (0.0000000000036초)
      118: { halfLife: 0.0000000000000001, decayType: 'alpha' } // Og-294 (0.00000000000036초)
    };
    
    // 모든 원소에 대해 규칙 생성
    for (let i = 1; i <= 118; i++) {
      if (realHalfLifeData[i]) {
        const data = realHalfLifeData[i];
        if (data.halfLife === Infinity) {
          // 안정 원소
          rules[i] = { 
            turns: 0, 
            decayProducts: [],
            decayType: 'stable',
            isStable: true
          };
        } else {
          // 방사성 원소 - 실제 반감기를 게임 턴으로 변환
          const gameTurns = this.convertToGameTurns(data.halfLife);
          rules[i] = {
            turns: gameTurns,
            decayProducts: this.calculateRealisticDecayProducts(i, data.decayType),
            decayType: data.decayType,
            isStable: false
          };
        }
      } else {
        // 데이터가 없는 원소는 안정으로 가정
        rules[i] = { 
          turns: 0, 
          decayProducts: [],
          decayType: 'stable',
          isStable: true
        };
      }
    }
    
    return rules;
  }

  // 실제 반감기를 게임 턴으로 변환 (로그 스케일 사용)
  convertToGameTurns(realHalfLife) {
    if (realHalfLife >= 1e9) return 50; // 10억년 이상: 50턴
    if (realHalfLife >= 1e6) return 40; // 100만년 이상: 40턴
    if (realHalfLife >= 1e3) return 30; // 1000년 이상: 30턴
    if (realHalfLife >= 1) return 20; // 1년 이상: 20턴
    if (realHalfLife >= 0.1) return 15; // 0.1년 이상: 15턴
    if (realHalfLife >= 0.01) return 10; // 0.01년 이상: 10턴
    if (realHalfLife >= 0.001) return 5; // 0.001년 이상: 5턴
    if (realHalfLife >= 0.0001) return 3; // 0.0001년 이상: 3턴
    if (realHalfLife >= 0.00001) return 2; // 0.00001년 이상: 2턴
    return 1; // 그 외: 1턴
  }

  // 실제 방사성 붕괴 패턴 기반 분열 생성물 계산
  calculateRealisticDecayProducts(elementNumber, decayType) {
    if (elementNumber <= 2) return []; // 수소, 헬륨은 분열하지 않음
    
    const products = [];
    
    switch (decayType) {
      case 'alpha':
        // 알파 붕괴: He-4 핵 방출 (원자번호 -2, 질량수 -4)
        const alphaProduct = elementNumber - 2;
        if (alphaProduct > 0) {
          products.push({
            elementNumber: alphaProduct,
            probability: 1.0,
            type: 'alpha',
            description: '알파 붕괴'
          });
        }
        break;
        
      case 'beta':
        // 베타 붕괴: 중성자가 양성자로 변환 (원자번호 +1, 질량수 동일)
        const betaProduct = elementNumber + 1;
        if (betaProduct <= 118) {
          products.push({
            elementNumber: betaProduct,
            probability: 1.0,
            type: 'beta',
            description: '베타 붕괴'
          });
        }
        break;
        
      case 'gamma':
        // 감마 붕괴: 에너지만 방출 (원소는 동일하지만 에너지 상태 변화)
        products.push({
          elementNumber: elementNumber,
          probability: 1.0,
          type: 'gamma',
          description: '감마 붕괴 (에너지 방출)'
        });
        break;
        
      case 'fission':
        // 핵분열: 두 개의 작은 원소로 분열
        const fissionProduct1 = Math.floor(elementNumber * 0.4);
        const fissionProduct2 = Math.floor(elementNumber * 0.6);
        
        if (fissionProduct1 > 0) {
          products.push({
            elementNumber: fissionProduct1,
            probability: 0.5,
            type: 'fission',
            description: '핵분열 생성물 1'
          });
        }
        
        if (fissionProduct2 > 0) {
          products.push({
            elementNumber: fissionProduct2,
            probability: 0.5,
            type: 'fission',
            description: '핵분열 생성물 2'
          });
        }
        break;
        
      default:
        // 기본 분열 (원자번호 -1)
        const defaultProduct = elementNumber - 1;
        if (defaultProduct > 0) {
          products.push({
            elementNumber: defaultProduct,
            probability: 1.0,
            type: 'decay',
            description: '일반 붕괴'
          });
        }
    }
    
    return products;
  }

  // 기존 함수 호환성을 위한 래퍼
  calculateDecayProducts(elementNumber) {
    const rule = this.decayRules[elementNumber];
    if (!rule) return [];
    
    return this.calculateRealisticDecayProducts(elementNumber, rule.decayType);
  }

  // 카드에 반감기 정보 추가
  addHalfLifeToCard(card) {
    if (!card || !card.element) return card;
    
    const elementNumber = card.element.number;
    const halflifeInfo = this.decayRules[elementNumber];
    
    if (halflifeInfo) {
      // 기존 반감기 정보가 있으면 유지, 없으면 새로 생성
      if (!card.halflife) {
        card.halflife = {
          maxTurns: halflifeInfo.turns,
          currentTurns: 0,
          decayProducts: halflifeInfo.decayProducts,
          isStable: halflifeInfo.turns === 0
        };
      } else {
        // 기존 반감기 정보가 있으면 maxTurns와 decayProducts만 업데이트
        card.halflife.maxTurns = halflifeInfo.turns;
        card.halflife.decayProducts = halflifeInfo.decayProducts;
        card.halflife.isStable = halflifeInfo.turns === 0;
        // currentTurns는 기존 값 유지
      }
    }
    
    return card;
  }

  // 과학적 확률적 반감기 진행 업데이트
  updateHalfLife(card) {
    if (!card || !card.halflife || card.halflife.isStable) return false;
    
    card.halflife.currentTurns++;
    
    // 지수적 붕괴 확률 계산 (실제 반감기 공식 기반)
    const decayProbability = this.calculateDecayProbability(card.halflife);
    
    // 확률에 따라 붕괴 발생
    if (Math.random() < decayProbability) {
      return this.decayCard(card);
    }
    
    return false;
  }

  // 지수적 붕괴 확률 계산 (N(t) = N₀ * e^(-λt))
  calculateDecayProbability(halflife) {
    if (halflife.isStable || halflife.maxTurns === 0) return 0;
    
    // 붕괴 상수 λ = ln(2) / t₁/₂
    const decayConstant = Math.log(2) / halflife.maxTurns;
    
    // 1턴 동안의 붕괴 확률 = 1 - e^(-λ)
    const probability = 1 - Math.exp(-decayConstant);
    
    return Math.min(probability, 0.5); // 최대 50% 확률로 제한
  }

  // 카드 분열 처리
  decayCard(card) {
    if (!card || !card.halflife || card.halflife.isStable) return null;
    
    const decayProducts = card.halflife.decayProducts;
    if (!decayProducts || decayProducts.length === 0) return null;
    
    // 확률에 따라 분열 생성물 선택
    const selectedProducts = this.selectDecayProducts(decayProducts);
    
    // 분열 애니메이션 재생
    this.playDecayAnimation(card);
    
    // 분열 생성물 카드들 생성
    const newCards = [];
    for (const product of selectedProducts) {
      const newCard = this.createDecayProductCard(product, card);
      if (newCard) {
        newCards.push(newCard);
      }
    }
    
    return newCards;
  }

  // 과학적 확률 기반 분열 생성물 선택
  selectDecayProducts(decayProducts) {
    const selectedProducts = [];
    
    for (const product of decayProducts) {
      // 각 생성물의 확률에 따라 선택
      if (Math.random() < product.probability) {
        selectedProducts.push(product);
      }
    }
    
    // 아무것도 선택되지 않았으면 가장 확률이 높은 것을 선택
    if (selectedProducts.length === 0 && decayProducts.length > 0) {
      const highestProbability = Math.max(...decayProducts.map(p => p.probability));
      const fallbackProduct = decayProducts.find(p => p.probability === highestProbability);
      if (fallbackProduct) {
        selectedProducts.push(fallbackProduct);
      }
    }
    
    return selectedProducts;
  }

  // 과학적 붕괴 유형 기반 분열 생성물 카드 생성
  createDecayProductCard(product, originalCard) {
    if (!window.elementsData) return null;
    
    const elementData = window.elementsData.find(e => e.number === product.elementNumber);
    if (!elementData) return null;
    
    // 붕괴 유형에 따른 스탯 비율 계산
    let statRatio = this.calculateStatRatio(product.type, originalCard);
    
    const newCard = new ElementCard(
      elementData,
      Math.floor(originalCard.hp * statRatio),
      Math.floor(originalCard.atk * statRatio)
    );
    
    // 기본 속성 설정
    newCard.maxHp = newCard.hp;
    newCard.originalMaxHp = newCard.hp;
    newCard.maxAtk = newCard.atk;
    newCard.rarity = elementData.rarity || 'common';
    newCard.upgradeLevel = 0;
    newCard.armor = 0;
    newCard.lastDamageTurn = gameState.turnCount;
    newCard.owner = originalCard.owner;
    newCard.isDecayProduct = true;
    newCard.decayType = product.type;
    newCard.originalElement = originalCard.element;
    newCard.decayDescription = product.description;
    
    return newCard;
  }

  // 붕괴 유형에 따른 스탯 비율 계산
  calculateStatRatio(decayType, originalCard) {
    switch (decayType) {
      case 'alpha':
        // 알파 붕괴: He-4 핵 방출로 인한 질량 손실 (약 4 amu)
        return 0.95; // 95% 스탯 유지
        
      case 'beta':
        // 베타 붕괴: 질량 변화 거의 없음
        return 0.98; // 98% 스탯 유지
        
      case 'gamma':
        // 감마 붕괴: 에너지만 방출, 질량 변화 없음
        return 1.0; // 100% 스탯 유지
        
      case 'fission':
        // 핵분열: 두 개로 분열하므로 각각 40-60%
        return 0.5; // 50% 스탯 유지
        
      default:
        return 0.8; // 기본 80% 스탯 유지
    }
  }

  // 분열 애니메이션 재생
  playDecayAnimation(card) {
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (!cardElement) return;
    
    // 분열 효과 클래스 추가
    cardElement.classList.add('card-decay');
    
    // 파티클 효과 생성
    this.createDecayParticles(cardElement);
    
    // 1초 후 효과 제거
    setTimeout(() => {
      cardElement.classList.remove('card-decay');
    }, 1000);
  }

  // 분열 파티클 효과 생성
  createDecayParticles(cardElement) {
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'decay-particle';
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 4px;
        height: 4px;
        background: #ff6b6b;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: decayParticle 1s ease-out forwards;
        --angle: ${(i * 45)}deg;
        --distance: ${50 + Math.random() * 30}px;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 1000);
    }
  }

  // 전장의 모든 카드 반감기 업데이트
  updateAllHalfLives() {
    const decayedCards = [];
    
    battlefield.lanes.forEach((lane, laneIndex) => {
      ['player', 'computer'].forEach(side => {
        const card = lane[side];
        if (card && !card.isSkull) {
          const decayProducts = this.updateHalfLife(card);
          if (decayProducts) {
            decayedCards.push({
              laneIndex,
              side,
              originalCard: card,
              decayProducts
            });
          }
        }
      });
    });
    
    return decayedCards;
  }

  // 분열된 카드 처리
  handleDecayedCards(decayedCards) {
    for (const decayed of decayedCards) {
      const { laneIndex, side, originalCard, decayProducts } = decayed;
      
      // 원본 카드 제거
      battlefield.lanes[laneIndex][side] = null;
      
      // 분열 생성물들을 손패에 추가
      for (const product of decayProducts) {
        if (side === 'player') {
          addCardToHand(product, 'player');
        } else {
          addCardToHand(product, 'computer');
        }
      }
      
      // 메시지 표시
      const productNames = decayProducts.map(p => p.element.name).join(', ');
      showMessage(`${originalCard.element.name}이(가) 분열하여 ${productNames}이(가) 되었습니다!`, 'info');
    }
    
    // 전장 다시 렌더링
    renderBattlefield();
    renderPlayerHand();
  }

  // 과학적 반감기 UI 추가
  addHalfLifeUI(cardElement, card) {
    if (!card.halflife || card.halflife.isStable) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'halflife-progress';
    
    // 붕괴 확률 계산
    const decayProbability = this.calculateDecayProbability(card.halflife);
    const probabilityPercent = Math.round(decayProbability * 100);
    
    // 붕괴 유형에 따른 색상 설정
    const decayTypeColor = this.getDecayTypeColor(card.halflife.decayType);
    
    progressBar.innerHTML = `
      <div class="halflife-bar">
        <div class="halflife-fill" style="width: ${(card.halflife.currentTurns / card.halflife.maxTurns) * 100}%; background: ${decayTypeColor}"></div>
      </div>
      <div class="halflife-text">
        <div class="halflife-turns">${card.halflife.currentTurns}/${card.halflife.maxTurns}</div>
        <div class="halflife-probability">${probabilityPercent}%</div>
        <div class="halflife-type">${this.getDecayTypeSymbol(card.halflife.decayType)}</div>
      </div>
    `;
    
    // 붕괴 유형 데이터 속성 추가
    progressBar.setAttribute('data-decay-type', card.halflife.decayType);
    
    cardElement.appendChild(progressBar);
  }

  // 붕괴 유형별 색상 반환
  getDecayTypeColor(decayType) {
    switch (decayType) {
      case 'alpha': return 'linear-gradient(90deg, #ff6b6b, #ff8e8e)'; // 빨간색
      case 'beta': return 'linear-gradient(90deg, #4ade80, #6ee7b7)'; // 초록색
      case 'gamma': return 'linear-gradient(90deg, #fbbf24, #fcd34d)'; // 노란색
      case 'fission': return 'linear-gradient(90deg, #8b5cf6, #a78bfa)'; // 보라색
      default: return 'linear-gradient(90deg, #6b7280, #9ca3af)'; // 회색
    }
  }

  // 붕괴 유형별 기호 반환
  getDecayTypeSymbol(decayType) {
    switch (decayType) {
      case 'alpha': return 'α';
      case 'beta': return 'β';
      case 'gamma': return 'γ';
      case 'fission': return '⚛';
      default: return '⚡';
    }
  }

  // 과학적 반감기 UI 업데이트
  updateHalfLifeUI(cardElement, card) {
    if (!card.halflife || card.halflife.isStable) return;
    
    const fillElement = cardElement.querySelector('.halflife-fill');
    const turnsElement = cardElement.querySelector('.halflife-turns');
    const probabilityElement = cardElement.querySelector('.halflife-probability');
    
    if (fillElement) {
      fillElement.style.width = `${(card.halflife.currentTurns / card.halflife.maxTurns) * 100}%`;
    }
    
    if (turnsElement) {
      turnsElement.textContent = `${card.halflife.currentTurns}/${card.halflife.maxTurns}`;
    }
    
    if (probabilityElement) {
      const decayProbability = this.calculateDecayProbability(card.halflife);
      const probabilityPercent = Math.round(decayProbability * 100);
      probabilityElement.textContent = `${probabilityPercent}%`;
    }
  }
}

// 전역 반감기 시스템 인스턴스
window.halfLifeSystem = new HalfLifeSystem();

// 과학적 반감기 CSS 스타일
const halflifeStyles = `
  .halflife-progress {
    position: absolute;
    bottom: 5px;
    left: 5px;
    right: 5px;
    height: 16px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .halflife-bar {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    position: relative;
  }
  
  .halflife-fill {
    height: 100%;
    border-radius: 8px;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .halflife-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    animation: shimmer 2s infinite;
  }
  
  .halflife-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 7px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  
  .halflife-turns {
    font-size: 8px;
    font-weight: 900;
  }
  
  .halflife-probability {
    font-size: 6px;
    opacity: 0.9;
  }
  
  .halflife-type {
    font-size: 8px;
    font-weight: bold;
  }
  
  .card-decay {
    animation: cardDecay 1s ease-in-out;
  }
  
  @keyframes cardDecay {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(0.8); opacity: 0; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes decayParticle {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(cos(var(--angle)) * var(--distance)),
        calc(sin(var(--angle)) * var(--distance))
      ) scale(0);
      opacity: 0;
    }
  }
  
  /* 붕괴 유형별 특별 효과 */
  .halflife-progress[data-decay-type="alpha"] {
    box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
  }
  
  .halflife-progress[data-decay-type="beta"] {
    box-shadow: 0 0 5px rgba(74, 222, 128, 0.5);
  }
  
  .halflife-progress[data-decay-type="gamma"] {
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.5);
  }
  
  .halflife-progress[data-decay-type="fission"] {
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
  }
`;

// 스타일을 head에 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = halflifeStyles;
document.head.appendChild(styleSheet);
