/**
 * UI 관련 함수들
 */

// UI 초기화
function initUI() {
    console.log('UI 초기화 중...');
    attachEventListeners();
}

// 플레이어 손패 렌더링
function renderPlayerHand() {
    const playerHand = document.getElementById('player-hand');
    if (!playerHand) return;
    
    // 기존 카드 제거
    playerHand.innerHTML = '';
    
    // 손패 카드 렌더링
    gameState.playerHand.forEach(card => {
        const cardElement = createCardElement(card);
        playerHand.appendChild(cardElement);
    });
}

/**
 * 카드 요소 생성
 * @param {Object} card - 카드 데이터
 * @returns {HTMLElement} - 생성된 카드 엘리먼트
 */
function createCardElement(card) {
    // 카드 컨테이너 생성
    const cardElement = document.createElement('div');
    cardElement.className = `card element-card ${card.color || 'bg-gray-500'} card-${card.rarity || 'common'} p-2 rounded-lg shadow-lg w-28`; // 카드 너비 증가
    cardElement.setAttribute('draggable', 'true');
    cardElement.setAttribute('data-card-id', card.id);
    cardElement.setAttribute('data-element', card.symbol);
    
    if (card.number) {
        cardElement.setAttribute('data-element-number', card.number);
    }
    
    // 기본 스탯 설정
    cardElement.setAttribute('data-power', card.power || card.baseAtk);
    cardElement.setAttribute('data-health', card.health || card.baseHp);
    cardElement.setAttribute('data-max-health', card.maxHealth || card.baseHp);
    cardElement.setAttribute('data-level', card.level || '1');
    
    // 카드 내용 생성
    const cardContent = `
        <div class="text-center font-bold text-lg">${card.symbol}</div>
        <div class="text-center text-sm mb-1">${card.name}</div>
        <div class="element-number text-xs absolute top-1 left-2 opacity-70">${card.number || ''}</div>
        <div class="flex justify-between text-sm">
            <div class="attack">⚔️ ${card.power || card.baseAtk}</div>
            <div class="health">❤️ ${card.health || card.baseHp}</div>
        </div>
        <div class="element-rank absolute bottom-1 left-2 rank-${card.rarity || 'common'}">${getRarityStars(card.rarity)}</div>
    `;
    
    cardElement.innerHTML = cardContent;
    
    // 특수 능력 있는 경우 아이콘 추가
    if (card.specialAbility) {
        const abilityIcon = document.createElement('div');
        abilityIcon.className = 'special-ability-icon';
        abilityIcon.textContent = getAbilityIcon(card.rarity || 'common');
        cardElement.appendChild(abilityIcon);
        
        // 툴팁 추가
        const tooltip = document.createElement('div');
        tooltip.className = 'ability-tooltip';
        tooltip.textContent = card.specialAbility;
        cardElement.appendChild(tooltip);
    }
    
    // 이벤트 리스너 추가
    cardElement.addEventListener('dragstart', handleDragStart);
    cardElement.addEventListener('dragend', handleDragEnd);
    
    // 클릭시 상세 정보 표시
    cardElement.addEventListener('click', (e) => {
        if (!e.target.closest('.special-ability-icon')) {
            showCardDetail(card);
        }
    });
    
    return cardElement;
}

/**
 * 분자 카드 요소 생성
 * @param {Object} molecule - 분자 데이터
 * @param {Array} components - 구성 원소 배열
 * @returns {HTMLElement} - 생성된 분자 카드 엘리먼트
 */
function createMoleculeCardElement(molecule, components = []) {
    const moleculeElement = document.createElement('div');
    moleculeElement.className = `card molecule-card ${molecule.color || 'bg-purple-600'} p-2 rounded-lg shadow-lg w-28 molecule-combine`; // 카드 너비 증가
    moleculeElement.setAttribute('draggable', 'true');
    moleculeElement.setAttribute('data-card-id', molecule.id);
    moleculeElement.setAttribute('data-molecule-id', molecule.id);
    
    // 기본 스탯 설정
    moleculeElement.setAttribute('data-power', molecule.power || molecule.baseAtk);
    moleculeElement.setAttribute('data-health', molecule.health || molecule.baseHp);
    moleculeElement.setAttribute('data-max-health', molecule.maxHealth || molecule.baseHp);
    moleculeElement.setAttribute('data-level', molecule.level || '1');
    
    // 구성 원소 정보 저장
    if (components && components.length > 0) {
        moleculeElement.setAttribute('data-components', JSON.stringify(components));
    }
    
    // 카드 내용 생성
    const cardContent = `
        <div class="text-center font-bold text-white text-lg">${molecule.formula || molecule.id}</div>
        <div class="text-center text-white text-sm mb-1">${molecule.name}</div>
        <div class="flex justify-between text-sm text-white">
            <div class="attack">⚔️ ${molecule.power || molecule.baseAtk}</div>
            <div class="health">❤️ ${molecule.health || molecule.baseHp}</div>
        </div>
        <div class="element-rank absolute bottom-1 left-2 rank-${molecule.rarity || 'uncommon'}">${getRarityStars(molecule.rarity || 'uncommon')}</div>
        <div class="special-effect text-center text-xs mt-1 text-purple-200">${molecule.effect?.type || '특수 효과'}</div>
    `;
    
    moleculeElement.innerHTML = cardContent;
    
    // 특수 능력 아이콘 추가
    const abilityIcon = document.createElement('div');
    abilityIcon.className = 'special-ability-icon';
    abilityIcon.textContent = '⚗️';
    moleculeElement.appendChild(abilityIcon);
    
    // 툴팁 추가
    const tooltip = document.createElement('div');
    tooltip.className = 'ability-tooltip';
    tooltip.textContent = molecule.specialAbility || `분자 능력: ${molecule.effect?.type || '특수 효과'}`;
    moleculeElement.appendChild(tooltip);
    
    // 이벤트 리스너 추가
    moleculeElement.addEventListener('dragstart', handleDragStart);
    moleculeElement.addEventListener('dragend', handleDragEnd);
    
    // 클릭시 상세 정보 표시
    moleculeElement.addEventListener('click', (e) => {
        if (!e.target.closest('.special-ability-icon')) {
            showMoleculeDetail(molecule, components);
        }
    });
    
    return moleculeElement;
}

/**
 * 희귀도에 따른 별 표시
 * @param {string} rarity - 희귀도
 * @returns {string} - 별 문자열
 */
function getRarityStars(rarity) {
    switch(rarity) {
        case 'common': return '★';
        case 'uncommon': return '★★';
        case 'rare': return '★★★';
        case 'epic': return '★★★★';
        case 'legendary': return '★★★★★';
        default: return '★';
    }
}

/**
 * 희귀도에 따른 능력치 아이콘
 * @param {string} rarity - 희귀도
 * @returns {string} - 아이콘 문자
 */
function getAbilityIcon(rarity) {
    switch(rarity) {
        case 'common': return '✧';
        case 'uncommon': return '✦';
        case 'rare': return '✮';
        case 'epic': return '✵';
        case 'legendary': return '✺';
        default: return '✧';
    }
}

/**
 * 카드 상세 정보 표시
 * @param {Object} card - 카드 데이터
 */
function showCardDetail(card) {
    const modalContent = document.getElementById('modal-content');
    const modal = document.getElementById('card-detail-modal');
    
    if (!modalContent || !modal) return;
    
    let content = `
        <div class="text-center mb-4">
            <div class="inline-block ${card.color || 'bg-gray-500'} w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2">${card.symbol}</div>
            <h3 class="text-xl font-bold">${card.name} (${card.englishName || card.name})</h3>
            <div class="text-sm text-gray-400">원자번호: ${card.number || '?'} | 원자량: ${card.atomicWeight || '?'}</div>
            <div class="badge mt-1 ${getRarityBadgeColor(card.rarity)}">${card.rarity || 'common'}</div>
        </div>
        <div class="mb-4">
            <h4 class="text-blue-400 font-bold mb-1">분류</h4>
            <p>${card.category || '미분류'}</p>
        </div>
        <div class="mb-4">
            <h4 class="text-blue-400 font-bold mb-1">설명</h4>
            <p>${card.description || '설명 없음'}</p>
        </div>
        <div class="stats grid grid-cols-2 gap-4 mb-4">
            <div>
                <h4 class="text-blue-400 font-bold mb-1">공격력</h4>
                <div class="text-xl font-bold">${card.power || card.baseAtk}</div>
            </div>
            <div>
                <h4 class="text-blue-400 font-bold mb-1">체력</h4>
                <div class="text-xl font-bold">${card.health || card.baseHp}</div>
            </div>
        </div>
    `;
    
    if (card.specialAbility) {
        content += `
            <div class="mb-4">
                <h4 class="text-blue-400 font-bold mb-1">특수 능력</h4>
                <p>${card.specialAbility}</p>
            </div>
        `;
    }
    
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
}

/**
 * 분자 상세 정보 표시
 * @param {Object} molecule - 분자 데이터
 * @param {Array} components - 구성 원소 배열
 */
function showMoleculeDetail(molecule, components = []) {
    const modalContent = document.getElementById('modal-content');
    const modal = document.getElementById('card-detail-modal');
    
    if (!modalContent || !modal) return;
    
    // 구성 원소 정보 구성
    let elementsHtml = '';
    if (components && components.length > 0) {
        elementsHtml = components.map(element => {
            return `
                <div class="element-info mb-3">
                    <div class="flex items-center">
                        <div class="element-symbol ${element.color || 'bg-gray-500'} w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2">${element.symbol}</div>
                        <div>
                            <div class="font-semibold">${element.name}</div>
                            <div class="text-xs text-gray-400">${element.englishName || element.name}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        elementsHtml = '<p class="text-gray-400">구성 요소 정보가 없습니다.</p>';
    }
    
    let content = `
        <div class="text-center mb-4">
            <div class="inline-block ${molecule.color || 'bg-purple-600'} rounded-lg px-4 py-2 text-2xl font-bold mb-2">${molecule.formula || molecule.id}</div>
            <h3 class="text-xl font-bold">${molecule.name} (${molecule.englishName || molecule.name})</h3>
            <div class="badge mt-1 ${getRarityBadgeColor(molecule.rarity || 'uncommon')}">${molecule.rarity || 'uncommon'}</div>
        </div>
        <div class="mb-4">
            <h4 class="text-blue-400 font-bold mb-1">설명</h4>
            <p>${molecule.description || '설명 없음'}</p>
        </div>
        <div class="mb-4">
            <h4 class="text-blue-400 font-bold mb-1">합성 구성 요소</h4>
            <p class="text-sm mb-2">이 카드는 다음 원소들로 구성되었습니다:</p>
            ${elementsHtml}
        </div>
        <div class="stats grid grid-cols-2 gap-4 mb-4">
            <div>
                <h4 class="text-blue-400 font-bold mb-1">공격력</h4>
                <div class="text-xl font-bold">${molecule.power || molecule.baseAtk}</div>
            </div>
            <div>
                <h4 class="text-blue-400 font-bold mb-1">체력</h4>
                <div class="text-xl font-bold">${molecule.health || molecule.baseHp}</div>
            </div>
        </div>
    `;
    
    if (molecule.effect) {
        content += `
            <div class="mb-4">
                <h4 class="text-blue-400 font-bold mb-1">특수 효과</h4>
                <div class="flex items-center">
                    <span class="text-2xl mr-2">${getEffectIcon(molecule.effect.type)}</span>
                    <span>${getEffectDescription(molecule.effect)}</span>
                </div>
            </div>
        `;
    }
    
    content += `
        <p class="text-sm text-gray-400 italic">합성된 카드는 구성 원소들의 능력치가 합산되어 50% 추가 보너스를 받으며, 하나의 분자처럼 행동합니다.</p>
    `;
    
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
}

/**
 * 효과 타입에 맞는 아이콘 반환
 * @param {string} effectType - 효과 타입
 * @returns {string} - 아이콘 문자
 */
function getEffectIcon(effectType) {
    const icons = {
        'boost_health': '💖',
        'boost_attack': '⚔️',
        'damage': '💥',
        'heal': '💚',
        'shield': '🛡️',
        'poison': '☠️',
        'freeze': '❄️',
        'burn': '🔥',
        // 기타 효과 아이콘
    };
    
    return icons[effectType] || '✨';
}

/**
 * 효과 설명 생성
 * @param {Object} effect - 효과 객체
 * @returns {string} - 효과 설명
 */
function getEffectDescription(effect) {
    if (!effect) return '특수 효과를 발동합니다.';
    
    const descriptions = {
        'boost_health': `체력을 ${effect.value} 증가시킵니다.`,
        'boost_attack': `공격력을 ${effect.value} 증가시킵니다.`,
        'damage': `공격 시 ${effect.value}의 추가 피해를 입힙니다.`,
        'heal': `턴마다 ${effect.value}의 체력을 회복합니다.`,
        'shield': `${effect.value}의 방어력을 제공합니다.`,
        'poison': `${effect.duration || 2}턴 동안 매 턴 ${effect.value}의 중독 피해를 입힙니다.`,
        'freeze': `${effect.duration || 1}턴 동안 대상을 얼립니다.`,
        'burn': `${effect.duration || 2}턴 동안 매 턴 ${effect.value}의 화상 피해를 입힙니다.`,
        // 기타 효과 설명
    };
    
    return descriptions[effect.type] || '특수 효과를 발동합니다.';
}

/**
 * 희귀도에 따른 배지 색상
 * @param {string} rarity - 희귀도
 * @returns {string} - 배지 클래스
 */
function getRarityBadgeColor(rarity) {
    switch(rarity) {
        case 'common': return 'bg-gray-500';
        case 'uncommon': return 'bg-green-500';
        case 'rare': return 'bg-blue-500';
        case 'epic': return 'bg-purple-500';
        case 'legendary': return 'bg-yellow-500';
        default: return 'bg-gray-500';
    }
}

/**
 * 메시지 표시
 * @param {string} message - 메시지
 * @param {string} type - 메시지 타입 ('info', 'success', 'warning', 'error')
 * @param {number} duration - 표시 시간 (ms)
 */
function showMessage(message, type = 'info', duration = 3000) {
    const messageElement = document.getElementById('result-message');
    if (!messageElement) return;
    
    // 메시지 타입에 따른 색상 클래스
    const typeClasses = {
        'info': 'text-blue-400',
        'success': 'text-green-400',
        'warning': 'text-yellow-400',
        'error': 'text-red-400'
    };
    
    // 기존 클래스 제거 후 새 클래스 추가
    messageElement.className = 'text-center text-xl font-bold h-12';
    messageElement.classList.add(typeClasses[type] || 'text-green-400');
    
    // 메시지 설정
    messageElement.textContent = message;
    
    // 일정 시간 후 기본 메시지로 복귀
    setTimeout(() => {
        messageElement.className = 'text-center text-xl font-bold h-12 text-green-400';
        messageElement.textContent = '원소를 배치하세요!';
    }, duration);
}

/**
 * 이벤트 리스너 연결
 */
function attachEventListeners() {
    // 튜토리얼 버튼
    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            const tutorialModal = document.getElementById('tutorial-modal');
            if (tutorialModal) {
                tutorialModal.classList.remove('hidden');
            }
        });
    }
    
    // 튜토리얼 관련 버튼들
    const prevTutorialBtn = document.getElementById('prev-tutorial');
    const nextTutorialBtn = document.getElementById('next-tutorial');
    const skipTutorialBtn = document.getElementById('skip-tutorial');
    
    if (prevTutorialBtn && typeof prevTutorialStep === 'function') {
        prevTutorialBtn.addEventListener('click', prevTutorialStep);
    }
    
    if (nextTutorialBtn && typeof nextTutorialStep === 'function') {
        nextTutorialBtn.addEventListener('click', nextTutorialStep);
    }
    
    if (skipTutorialBtn) {
        skipTutorialBtn.addEventListener('click', () => {
            const tutorialModal = document.getElementById('tutorial-modal');
            if (tutorialModal) {
                tutorialModal.classList.add('hidden');
            }
        });
    }
    
    // 모달 닫기 버튼
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const cardDetailModal = document.getElementById('card-detail-modal');
            if (cardDetailModal) {
                cardDetailModal.classList.add('hidden');
            }
        });
    }
    
    // 분자 도감 닫기 버튼
    const closeCollectionModalBtn = document.getElementById('close-collection-modal');
    if (closeCollectionModalBtn) {
        closeCollectionModalBtn.addEventListener('click', () => {
            const moleculeModal = document.getElementById('molecule-collection-modal');
            if (moleculeModal) {
                moleculeModal.classList.add('hidden');
            }
        });
    }
    
    // 합성 가이드 버튼 - 안전하게 추가
    const headerButtons = document.querySelector('.flex.items-center');
    if (headerButtons && !document.getElementById('synthesis-guide-btn')) {
        try {
            const synthesisGuideBtn = document.createElement('button');
            synthesisGuideBtn.id = 'synthesis-guide-btn';
            synthesisGuideBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white py-1 px-4 rounded-md shadow transition-colors mr-3';
            synthesisGuideBtn.textContent = '합성 가이드';
            
            // 합성 가이드 버튼에 이벤트 리스너 추가
            synthesisGuideBtn.addEventListener('click', () => {
                const guideModal = document.getElementById('synthesis-guide-modal');
                if (guideModal) {
                    guideModal.classList.remove('hidden');
                } else {
                    console.warn('합성 가이드 모달을 찾을 수 없습니다.');
                }
            });
            
            // 버튼을 안전하게 DOM에 추가 
            // 기존 튜토리얼 버튼 앞에 합성 가이드 버튼 추가
            const tutorialButton = document.getElementById('tutorial-btn');
            if (tutorialButton && tutorialButton.parentNode === headerButtons) {
                headerButtons.insertBefore(synthesisGuideBtn, tutorialButton);
            } else {
                // 튜토리얼 버튼이 없거나 예상한 위치에 없는 경우 그냥 헤더 버튼 영역의 첫 번째 자식으로 추가
                headerButtons.prepend(synthesisGuideBtn);
            }
        } catch (error) {
            console.error('합성 가이드 버튼 추가 중 오류:', error);
        }
    }
    
    // 카드 뽑기 버튼들
    const drawButtons = ['draw-basic-btn', 'draw-premium-btn', 'draw-legend-btn'];
    drawButtons.forEach(id => {
        const button = document.getElementById(id);
        if (button && typeof drawCard === 'function') {
            button.addEventListener('click', () => {
                const packType = id.replace('draw-', '').replace('-btn', '');
                drawCard(packType);
            });
        }
    });
    
    // 턴 종료 버튼
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn && typeof endTurn === 'function') {
        endTurnBtn.addEventListener('click', endTurn);
    }
    
    // 게임 리셋 버튼
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn && typeof resetGame === 'function') {
        resetBtn.addEventListener('click', resetGame);
    }
    
    // 기타 버튼 이벤트 리스너도 여기에 추가...
}

// 전역으로 함수 노출
window.initUI = initUI;
window.renderPlayerHand = renderPlayerHand;
window.createCardElement = createCardElement;
window.createMoleculeCardElement = createMoleculeCardElement;
window.showCardDetail = showCardDetail;
window.showMoleculeDetail = showMoleculeDetail;
window.showMessage = showMessage;
