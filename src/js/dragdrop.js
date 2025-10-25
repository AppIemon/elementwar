let draggedCardData = null;

// 손패 카드들을 드래그 가능하게 설정
const setupHandCardsDraggable = () => {
    const playerHand = document.getElementById('player-hand');
    if (!playerHand) {
        console.log('setupHandCardsDraggable: Player hand not found');
        return;
    }
    
    const cards = playerHand.querySelectorAll('.card');
    console.log('setupHandCardsDraggable: Found', cards.length, 'cards in hand');
    
    cards.forEach((card, index) => {
        card.draggable = true;
        card.addEventListener('dragstart', handleDragStart);
        console.log(`setupHandCardsDraggable: Made card ${index} draggable:`, card.id);
    });
};

// Initialize drag & drop
const initDragAndDrop = () => {
    const playerHand = document.getElementById('player-hand');
    const battlefieldEl = document.getElementById('battlefield');
    
    // 여러 방법으로 슬롯 찾기
    let battlefieldSlots = document.querySelectorAll('.player-slot');
    if (battlefieldSlots.length === 0) {
        battlefieldSlots = document.querySelectorAll('.lane-slot');
    }
    if (battlefieldSlots.length === 0) {
        battlefieldSlots = document.querySelectorAll('[class*="slot"]');
    }

    console.log('initDragAndDrop: Initializing drag and drop...');
    console.log('Found player hand:', playerHand);
    console.log('Found battlefield:', battlefieldEl);
    console.log('Found battlefield slots:', battlefieldSlots.length);
    
    // 슬롯 정보 출력
    battlefieldSlots.forEach((slot, index) => {
        console.log(`Slot ${index}:`, slot.className, slot.id);
    });

    // Drag start from hand or battlefield container (delegation)
    if (playerHand) {
        playerHand.addEventListener('dragstart', handleDragStart);
        console.log('Added dragstart listener to player hand');
    }
    if (battlefieldEl) {
        battlefieldEl.addEventListener('dragstart', handleDragStart);
        console.log('Added dragstart listener to battlefield');
    }
    
    // 손패 카드들을 드래그 가능하게 설정
    setupHandCardsDraggable();

    // Drop targets: player slots and hand
    battlefieldSlots.forEach((slot, index) => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
        console.log(`Added drop listeners to slot ${index}:`, slot.className);
    });
    

    // Clean up on end
    document.addEventListener('dragend', handleDragEnd);
    console.log('Drag and drop initialization complete');
};

const handleDragStart = event => {
    console.log('handleDragStart: Drag started');
    const cardEl = event.target.closest('.card');
    if (!cardEl) { 
        console.log('handleDragStart: No card element found');
        event.preventDefault(); 
        return; 
    }
    
    const cardId = cardEl.id;
    const parent = cardEl.parentElement;
    console.log('handleDragStart: Card ID:', cardId, 'Parent:', parent);
    
    const origin = parent.id === 'player-hand' ? 'hand'
                 : parent.classList.contains('player-slot') ? 'battlefield'
                 : 'unknown';
    
    console.log('handleDragStart: Origin:', origin, 'Is player turn:', gameState.isPlayerTurn);
    
    if (!gameState.isPlayerTurn || origin === 'unknown') { 
        console.log('handleDragStart: Drag prevented - not player turn or unknown origin');
        event.preventDefault(); 
        return; 
    }
    
    draggedCardData = { 
        id: cardId, 
        origin, 
        laneIndex: parent.closest('.battlefield-lane')?.id.split('-')[1] 
    };
    
    console.log('handleDragStart: Dragged card data:', draggedCardData);
    
    setTimeout(() => cardEl.classList.add('dragging'), 0);
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = event => {
    console.log('handleDragOver: Drag over event triggered');
    event.preventDefault();
    if (!draggedCardData || !gameState.isPlayerTurn) {
        console.log('handleDragOver: No dragged card data or not player turn');
        return;
    }
    const slot = event.currentTarget;
    slot.classList.add('drop-active');
    console.log('handleDragOver: Added drop-active class to slot');
};

const handleDragLeave = event => {
    console.log('handleDragLeave: Drag leave event triggered');
    event.currentTarget.classList.remove('drop-active');
};

const handleDrop = event => {
    console.log('handleDrop: Drop event triggered');
    event.preventDefault();
    const slot = event.currentTarget;
    slot.classList.remove('drop-active');
    
    if (!draggedCardData || !gameState.isPlayerTurn) { 
        console.log('handleDrop: No dragged card data or not player turn');
        draggedCardData = null; 
        return; 
    }
    
    console.log('handleDrop: Dropping card:', draggedCardData);
    
    const laneSlot = slot.closest('.battlefield-lane');
    
    console.log('handleDrop: Lane slot:', laneSlot);
    
    if (laneSlot && draggedCardData.origin === 'hand') {
        // 전장에 카드 배치
        const idx = parseInt(laneSlot.id.split('-')[1],10);
        
        // 디버깅을 위한 로그 추가
        console.log('handleDrop: Searching for card with ID:', draggedCardData.id);
        console.log('handleDrop: Current playerHand:', gameState.playerHand);
        console.log('handleDrop: PlayerHand length:', gameState.playerHand ? gameState.playerHand.length : 'undefined');
        
        const card = gameState.playerHand.find(c=>c.id===draggedCardData.id);
        console.log('handleDrop: Placing card on battlefield, lane:', idx, 'card:', card);
        
        if (card) {
            placeCardOnBattlefield(card, idx, 'player');
        } else {
            console.error('handleDrop: Card not found in player hand:', draggedCardData.id);
            console.error('handleDrop: Available card IDs:', gameState.playerHand.map(c => c.id));
            
            // 폴백: 첫 번째 카드 사용 (임시 해결책)
            if (gameState.playerHand && gameState.playerHand.length > 0) {
                console.log('handleDrop: Using first available card as fallback');
                const fallbackCard = gameState.playerHand[0];
                placeCardOnBattlefield(fallbackCard, idx, 'player');
            } else {
                console.error('handleDrop: No cards available in player hand');
            }
        }
    } else {
        console.log('handleDrop: No valid drop target found');
    }
    
    draggedCardData = null;
};

const handleDragEnd = () => {
    document.querySelectorAll('.drop-active').forEach(el=>el.classList.remove('drop-active'));
    const el = document.querySelector('.dragging');
    el?.classList.remove('dragging');
    draggedCardData = null;
};


// expose
window.initDragAndDrop = initDragAndDrop;
window.setupHandCardsDraggable = setupHandCardsDraggable;

// 화학 합성실 드래그 기능 제거됨