/**
 * 화학 반응 및 분자 합성 관련 기능
 */

// 화학 반응 규칙 정의 (주요 분자들)
const CHEMICAL_REACTIONS = [
  // 물 (H₂O)
  { 
    reactants: ['H', 'H', 'O'], 
    formula: 'H₂O', 
    name: '물', 
    englishName: 'Water',
    description: '생명 유지에 필수적인 물질입니다.',
    color: 'bg-blue-400',
    effect: { type: 'heal', value: 2 },
    rarity: 'uncommon'
  },
  
  // 이산화탄소 (CO₂)
  { 
    reactants: ['C', 'O', 'O'], 
    formula: 'CO₂', 
    name: '이산화탄소', 
    englishName: 'Carbon Dioxide',
    description: '식물 광합성에 필요한 기체입니다.',
    color: 'bg-gray-500',
    effect: { type: 'poison', value: 1, duration: 2 },
    rarity: 'uncommon'
  },
  
  // 메탄 (CH₄)
  { 
    reactants: ['C', 'H', 'H', 'H', 'H'], 
    formula: 'CH₄', 
    name: '메탄', 
    englishName: 'Methane',
    description: '천연가스의 주성분인 무색 가스입니다.',
    color: 'bg-green-600',
    effect: { type: 'burn', value: 3 },
    rarity: 'rare'
  },
  
  // 암모니아 (NH₃)
  { 
    reactants: ['N', 'H', 'H', 'H'], 
    formula: 'NH₃', 
    name: '암모니아', 
    englishName: 'Ammonia',
    description: '자극적인 냄새가 나는 무색 기체입니다.',
    color: 'bg-yellow-300',
    effect: { type: 'poison', value: 2, duration: 3 },
    rarity: 'rare'
  },
  
  // 염화나트륨 (NaCl - 소금)
  { 
    reactants: ['Na', 'Cl'], 
    formula: 'NaCl', 
    name: '염화나트륨', 
    englishName: 'Sodium Chloride',
    description: '일반적인 소금으로 조미료로 사용됩니다.',
    color: 'bg-gray-100',
    effect: { type: 'defense', value: 3 },
    rarity: 'uncommon'
  },
  
  // 아세트산 (CH₃COOH - 식초)
  { 
    reactants: ['C', 'C', 'H', 'H', 'H', 'O', 'O', 'H'], 
    formula: 'CH₃COOH', 
    name: '아세트산', 
    englishName: 'Acetic Acid',
    description: '식초의 주요 성분으로 신맛을 냅니다.',
    color: 'bg-yellow-200',
    effect: { type: 'corrode', value: 2 },
    rarity: 'rare'
  },
  
  // 에탄올 (C₂H₅OH - 알코올)
  { 
    reactants: ['C', 'C', 'H', 'H', 'H', 'H', 'H', 'O', 'H'], 
    formula: 'C₂H₅OH', 
    name: '에탄올', 
    englishName: 'Ethanol',
    description: '알코올 음료의 주성분입니다.',
    color: 'bg-blue-200',
    effect: { type: 'burn', value: 2, duration: 2 },
    rarity: 'rare'
  }
  
  // 여기에 추가 반응 규칙 추가... (실제로는 100개 정도)
];

/**
 * 슬롯에서 화학 반응을 확인하고 처리합니다
 * @param {HTMLElement} slot - 확인할 슬롯
 */
function checkForReactions(slot) {
  if (!slot) return;
  
  // 슬롯의 모든 원소 카드 가져오기 (분자 카드 제외)
  const elementCards = Array.from(slot.querySelectorAll('.card:not(.molecule-card)'));
  
  // 반응 확인을 위한 최소 2개의 카드 필요
  if (elementCards.length < 2) return;
  
  console.log(`${elementCards.length}개의 원소 카드 발견, 반응 확인 중...`);
  
  // 카드에서 원소 심볼 추출
  const elements = elementCards.map(card => 
    card.getAttribute('data-element')
  ).filter(Boolean);
  
  console.log("슬롯 내 원소:", elements.join(', '));
  
  // 가능한 반응 검색
  const reaction = findMatchingReaction(elements);
  
  // 반응이 있으면 분자 생성
  if (reaction) {
    console.log(`반응 발견: ${reaction.reactants.join(' + ')} → ${reaction.formula}`);
    createMoleculeFromReaction(reaction, slot, elementCards);
    return true;
  } else {
    console.log('일치하는 반응을 찾을 수 없습니다.');
    return false;
  }
}

/**
 * 주어진 원소들에 대해 일치하는 반응을 찾습니다
 * @param {Array} elements - 원소 심볼 배열
 * @returns {Object|null} - 일치하는 반응 또는 null
 */
function findMatchingReaction(elements) {
  if (!elements || elements.length < 2) return null;
  
  // 각 반응식 확인
  for (const reaction of CHEMICAL_REACTIONS) {
    // 카드에 있는 원소들이 반응에 필요한 모든 원소를 포함하는지 확인
    
    // 원소 심볼 복사본 생성
    const availableElements = [...elements];
    
    // 모든 필요 원소가 있는지 확인
    const hasAllReactants = reaction.reactants.every(reactant => {
      const index = availableElements.indexOf(reactant);
      if (index !== -1) {
        // 찾은 원소 제거 (중복 계산 방지)
        availableElements.splice(index, 1);
        return true;
      }
      return false;
    });
    
    // 모든 필요 원소가 있고, 남은 원소 수가 올바른 경우
    if (hasAllReactants && availableElements.length === elements.length - reaction.reactants.length) {
      return reaction;
    }
  }
  
  return null;
}

/**
 * 반응 정보를 바탕으로 분자 카드를 생성합니다
 * @param {Object} reaction - 반응 정보
 * @param {HTMLElement} slot - 대상 슬롯
 * @param {Array} elementCards - 원소 카드 요소 배열
 */
function createMoleculeFromReaction(reaction, slot, elementCards) {
  // 합성 애니메이션 효과 표시
  showSynthesisAnimation(slot);
  
  // 원소 카드 정보 수집
  const elementsInfo = elementCards.map(card => ({
    symbol: card.getAttribute('data-element'),
    name: card.querySelector('.text-center:nth-child(2)')?.textContent || '원소',
    power: parseInt(card.getAttribute('data-power')) || 1,
    health: parseInt(card.getAttribute('data-health')) || 1
  }));
  
  // 반응에 필요한 원소들만 선택 (나머지는 그대로 둠)
  const usedElements = [];
  const remainingCards = [...elementCards];
  
  // 반응식의 각 원소에 대해
  for (const reactant of reaction.reactants) {
    // 남은 카드 중 해당 원소를 찾음
    const index = remainingCards.findIndex(card => 
      card.getAttribute('data-element') === reactant
    );
    
    if (index !== -1) {
      // 사용된 원소 정보 저장
      usedElements.push({
        element: reactant,
        card: remainingCards[index]
      });
      
      // 사용된 카드 제거
      remainingCards.splice(index, 1);
    }
  }
  
  // 반응에 사용된 카드들만 제거
  usedElements.forEach(item => {
    item.card.remove();
  });
  
  // 분자 능력치 계산 (사용된 원소들의 합 + 50% 보너스)
  const totalPower = Math.round(
    usedElements.reduce((sum, item) => sum + (parseInt(item.card.getAttribute('data-power')) || 1), 0) * 1.5
  );
  
  const totalHealth = Math.round(
    usedElements.reduce((sum, item) => sum + (parseInt(item.card.getAttribute('data-health')) || 1), 0) * 1.5
  );
  
  // 분자 고유 ID 생성
  const moleculeId = `molecule-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 분자 카드 요소 생성
  const moleculeCard = document.createElement('div');
  moleculeCard.className = `card molecule-card ${reaction.color || 'bg-purple-600'} p-2 rounded-lg shadow-lg w-28`;
  moleculeCard.setAttribute('data-card-id', moleculeId);
  moleculeCard.setAttribute('data-element', reaction.formula);
  moleculeCard.setAttribute('draggable', 'true');
  
  // 능력치 설정
  moleculeCard.setAttribute('data-power', totalPower);
  moleculeCard.setAttribute('data-health', totalHealth);
  moleculeCard.setAttribute('data-max-health', totalHealth);
  moleculeCard.setAttribute('data-level', '1');
  
  // 특수 효과 설정
  if (reaction.effect) {
    moleculeCard.setAttribute('data-effect-type', reaction.effect.type);
    moleculeCard.setAttribute('data-effect-value', reaction.effect.value);
    if (reaction.effect.duration) {
      moleculeCard.setAttribute('data-effect-duration', reaction.effect.duration);
    }
  }
  
  // 구성 원소 저장
  const componentElements = usedElements.map(item => item.element);
  moleculeCard.setAttribute('data-components', JSON.stringify(componentElements));
  moleculeCard.setAttribute('data-rarity', reaction.rarity || 'uncommon');
  
  // 카드 내용 설정
  moleculeCard.innerHTML = `
    <div class="text-center font-bold text-white text-lg">${reaction.formula}</div>
    <div class="text-center text-white text-sm mb-1">${reaction.name}</div>
    <div class="flex justify-between text-sm text-white">
      <div>⚔️ ${totalPower}</div>
      <div>❤️ ${totalHealth}</div>
    </div>
    <div class="text-xs mt-1 text-center text-purple-200">${getEffectText(reaction.effect)}</div>
    <div class="element-rank absolute bottom-1 left-2 rank-${reaction.rarity || 'uncommon'}">${getRarityStars(reaction.rarity || 'uncommon')}</div>
  `;
  
  // 특수 효과 아이콘
  if (reaction.effect) {
    const effectIcon = document.createElement('div');
    effectIcon.className = 'special-ability absolute top-1 right-1 bg-yellow-500 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold';
    effectIcon.textContent = getEffectIcon(reaction.effect.type);
    moleculeCard.appendChild(effectIcon);
  }
  
  // 분자 카드를 슬롯에 추가
  slot.appendChild(moleculeCard);
  
  // 분자 생성 이벤트 발생
  const event = new CustomEvent('moleculeSynthesized', { 
    detail: { 
      formula: reaction.formula,
      name: reaction.name,
      effect: reaction.effect,
      power: totalPower,
      health: totalHealth
    }
  });
  document.dispatchEvent(event);
  
  // 도감에 추가
  addToMoleculeCollection(reaction);
  
  // 성공 메시지 표시
  showMessage(`${reaction.formula} (${reaction.name}) 분자가 합성되었습니다!`, 'success');
  
  return moleculeCard;
}

/**
 * 합성 애니메이션 표시
 * @param {HTMLElement} slot - 애니메이션 표시할 슬롯
 */
function showSynthesisAnimation(slot) {
  // 애니메이션 컨테이너
  const animContainer = document.createElement('div');
  animContainer.className = 'molecule-animation absolute inset-0 z-20';
  
  // 섬광 효과
  const flash = document.createElement('div');
  flash.className = 'molecule-flash absolute inset-0 rounded-lg';
  animContainer.appendChild(flash);
  
  // 파티클 효과
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'molecule-particles';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.backgroundColor = getRandomColor();
    animContainer.appendChild(particle);
    
    // 애니메이션 라이브러리가 있으면 활용
    if (window.anime) {
      window.anime({
        targets: particle,
        translateX: window.anime.random(-50, 50),
        translateY: window.anime.random(-50, 50),
        scale: [1, 0],
        opacity: [1, 0],
        easing: 'easeOutExpo',
        duration: 1000,
        delay: window.anime.random(0, 300)
      });
    } else {
      // 기본 애니메이션 (CSS 기반)
      particle.style.animation = 'particle-fade 1s forwards';
    }
  }
  
  // 슬롯에 애니메이션 추가
  slot.appendChild(animContainer);
  
  // 애니메이션 완료 후 제거
  setTimeout(() => {
    animContainer.remove();
  }, 1000);
}

/**
 * 랜덤 색상 생성
 * @returns {string} - rgba 색상
 */
function getRandomColor() {
  const colors = [
    'rgba(239, 68, 68, 0.8)',   // 빨강
    'rgba(59, 130, 246, 0.8)',  // 파랑
    'rgba(16, 185, 129, 0.8)',  // 녹색
    'rgba(245, 158, 11, 0.8)',  // 주황
    'rgba(168, 85, 247, 0.8)'   // 보라
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
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
    'corrode': '💧'
  };
  
  return icons[effectType] || '✨';
}

/**
 * 효과 설명 텍스트 가져오기
 * @param {Object} effect - 효과 객체
 * @returns {string} - 효과 설명
 */
function getEffectText(effect) {
  if (!effect) return '';
  
  const descriptions = {
    'heal': `회복: 매 턴 ${effect.value} 회복`,
    'damage': `피해: 공격 시 ${effect.value} 추가 피해`,
    'poison': `중독: ${effect.duration || 2}턴간 ${effect.value} 피해`,
    'burn': `화상: ${effect.duration || 2}턴간 ${effect.value} 피해`,
    'freeze': `빙결: ${effect.duration || 1}턴간 행동 불가`,
    'defense': `방어: ${effect.value} 방어력 제공`,
    'boost': `강화: 아군 공격력 ${effect.value} 증가`,
    'corrode': `부식: 방어력 무시 ${effect.value} 피해`
  };
  
  return descriptions[effect.type] || '특수 효과';
}

/**
 * 희귀도에 따른 별 표시
 * @param {string} rarity - 희귀도
 * @returns {string} - 별 표시
 */
function getRarityStars(rarity) {
  const stars = {
    'common': '★',
    'uncommon': '★★',
    'rare': '★★★',
    'epic': '★★★★',
    'legendary': '★★★★★'
  };
  
  return stars[rarity] || '★';
}

/**
 * 분자 도감에 추가
 * @param {Object} reaction - 반응 정보
 */
function addToMoleculeCollection(reaction) {
  // 로컬 스토리지에서 분자 도감 정보 가져오기
  let collection = JSON.parse(localStorage.getItem('moleculeCollection')) || [];
  
  // 이미 수집된 분자인지 확인
  const existingIndex = collection.findIndex(m => m.formula === reaction.formula);
  
  if (existingIndex === -1) {
    // 새로운 분자 추가
    collection.push({
      formula: reaction.formula,
      name: reaction.name,
      englishName: reaction.englishName,
      reactants: reaction.reactants,
      description: reaction.description,
      color: reaction.color,
      effect: reaction.effect,
      rarity: reaction.rarity,
      discoveredAt: new Date().toISOString()
    });
    
    // 로컬 스토리지에 저장
    localStorage.setItem('moleculeCollection', JSON.stringify(collection));
    
    console.log(`새로운 분자가 도감에 추가되었습니다: ${reaction.formula}`);
    
    // UI에 알림 표시
    showMessage(`새로운 분자 ${reaction.formula}(${reaction.name})를 발견했습니다!`, 'success', 5000);
  }
}

/**
 * 메시지 표시 (UI 함수, 필요시 구현)
 * @param {string} message - 메시지 내용
 * @param {string} type - 메시지 유형
 * @param {number} duration - 표시 시간 (ms)
 */
function showMessage(message, type = 'info', duration = 3000) {
  // UI 모듈에 구현되어 있으면 그것을 사용
  if (window.showMessage) {
    window.showMessage(message, type, duration);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

// 전역으로 함수 노출
window.checkForReactions = checkForReactions;
window.findMatchingReaction = findMatchingReaction;
window.createMoleculeFromReaction = createMoleculeFromReaction;
window.showSynthesisAnimation = showSynthesisAnimation;
