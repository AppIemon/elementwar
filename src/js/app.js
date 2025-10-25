// --- Data Loading Functions ---
async function loadElementsData() {
  try {
    const response = await fetch('src/data/elements.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    window.gameState.elementsData = await response.json();
    console.log("Elements data loaded successfully.");
  } catch (error) {
    console.error("Failed to load elements data:", error);
    throw error; // Re-throw to be caught by initializeAppCore
  }
}

async function loadMoleculesData() {
  try {
    const response = await fetch('src/data/molecules.json');
     if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    window.gameState.moleculesData = await response.json();
    console.log("Molecules data loaded successfully.");
  } catch (error) {
    console.error("Failed to load molecules data:", error);
    throw error; // Re-throw
  }
}

// --- Core Initialization ---
async function initializeAppCore() {
    console.log("initializeAppCore: Starting...");
    try {
        // Ensure gameState object exists (it should be defined in game.js)
        if (typeof gameState === 'undefined') {
             // This case should ideally not happen if game.js is loaded first
             console.error("initializeAppCore: gameState is not defined. Check script load order. game.js must load before app.js.");
             throw new Error("gameState is missing.");
        }

        await loadElementsData(); // Loads data into the existing gameState object
        await loadMoleculesData(); // Loads molecules data into the existing gameState object
        initEffectsData(); // Uses data from gameState
        console.log("initializeAppCore: Data loaded.");

        // Initialize game state and basic systems
        if (typeof initGame === 'function') {
            await initGame(); // Modifies the existing gameState object
            console.log("initializeAppCore: initGame completed.");
        } else {
             console.error("initializeAppCore: initGame function not found!");
             throw new Error("initGame is required but not defined.");
        }

        // Initialize other systems if they exist
        if (typeof initUI === 'function') {
             initUI(); // Potentially sets up modal closures, etc. not covered by updateUI
             console.log("initializeAppCore: initUI completed.");
        }
        if (typeof initUpgradeSystem === 'function') {
             initUpgradeSystem();
             console.log("initializeAppCore: initUpgradeSystem completed.");
        }
        if (typeof initMoleculeGuide === 'function') {
             initMoleculeGuide();
             console.log("initializeAppCore: initMoleculeGuide completed.");
        }
        if (typeof window.fusionUI !== 'undefined' && window.fusionUI.init) {
             window.fusionUI.init();
             console.log("initializeAppCore: fusionUI completed.");
        }
        
        // 별 관리 시스템 초기화
        if (typeof window.starManagement !== 'undefined') {
             console.log("initializeAppCore: starManagement initialized.");
        } else {
             console.warn("initializeAppCore: starManagement not found!");
        }

        // 별 재화 시스템 초기화
        if (typeof window.starCurrency !== 'undefined') {
             console.log("initializeAppCore: starCurrency initialized.");
        } else {
             console.warn("initializeAppCore: starCurrency not found!");
        }

        // 별 융합 UI 초기화
        if (typeof window.starFusionUI !== 'undefined') {
             console.log("initializeAppCore: starFusionUI initialized.");
        } else {
             console.warn("initializeAppCore: starFusionUI not found!");
        }

        // Apply rarities after elementsData is loaded
        initializeElementRarities();
        console.log("initializeAppCore: Element rarities initialized.");

        // Perform initial full UI render based on initialized state
        updateUI(); // Renders hand, battlefield, updates coins, base HP etc.
        console.log("initializeAppCore: Initial updateUI completed.");

        // 자동화 타이머 설정 (5초마다 자동화 체크)
        setInterval(() => {
            if (typeof window.fusionUI !== 'undefined' && window.fusionUI.checkAutomation) {
                window.fusionUI.checkAutomation();
            }
        }, 5000); // 5초마다 실행

        // 기존 카드들의 능력치를 새로운 스케일링 공식에 맞게 업데이트
        if (typeof updateExistingCardStats === 'function') {
            updateExistingCardStats();
        }

        // 애니메이션 컨테이너들 정리
        if (typeof window.cleanupAnimationContainers === 'function') {
            window.cleanupAnimationContainers();
        }

    } catch (error) {
        console.error('Core initialization failed:', error);
        showErrorMessage('게임 데이터를 불러오는 중 오류가 발생했습니다.');
        throw error; // Re-throw to stop further execution in DOMContentLoaded
    }
}

// 원소 등급 초기화 - 데이터 로드 후 적용
function initializeElementRarities() {
    // 원소 등급 배분 (118개 원소 기준)
    const elementsByRarity = {
        common: [1, 6, 7, 8, 12, 13, 14, 15, 16, 20, 26, 28, 29, 30, 50, 82],
        uncommon: [2, 5, 10, 11, 17, 18, 19, 22, 24, 25, 27, 31, 32, 34, 36, 38, 40, 48, 49, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 83, 86],
        rare: [3, 4, 9, 21, 23, 33, 35, 37, 39, 41, 42, 44, 45, 46, 47, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 84, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
        epic: [43, 85],
        legendary: []
    };

    // 원소에 등급 부여
    if (!gameState.elementsData) {
        console.error("initializeElementRarities: gameState.elementsData is not loaded!");
        return;
    }
    for (const rarity in elementsByRarity) {
        const elementIds = elementsByRarity[rarity];
        for (const id of elementIds) {
            const element = gameState.elementsData.find(e => e.number === id);
            if (element) {
                element.rarity = rarity;
            }
        }
    }
    console.log("Element rarities assigned.");
}

// Function to give initial cards and coins (called after core init)
function giveInitialCardsAndCoins() {
    console.log("Giving initial cards and coins...");
    // 초기 코인 지급 (Ensure addCoins is accessible)
    if (typeof addCoins === 'function') {
        addCoins(20, 'player'); // Start with 20 coins for the player
    } else {
        console.error("giveInitialCardsAndCoins: addCoins function not found!");
    }

    // 온라인/오프라인 모드 모두에서 초기 카드 제공
    // 고정된 시작 카드 제공: H 3개
    if (typeof addCardToHand === 'function') {
        // H (수소) 3개
        const hydrogenElement = gameState.elementsData.find(e => e.symbol === 'H');
        if (hydrogenElement) {
            const hCard1 = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
            const hCard2 = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
            const hCard3 = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
            addCardToHand(hCard1, 'player');
            addCardToHand(hCard2, 'player');
            addCardToHand(hCard3, 'player');
            console.log("온라인/오프라인 모드: 수소 3개 카드 제공 완료");
        }
    } else {
        console.error("giveInitialCardsAndCoins: addCardToHand function not found!");
    }

    updateUI(); // Update UI after adding cards/coins
    showMessage('게임을 시작합니다!', 'info');
    console.log("Initial cards and coins given.");
}

// Function to display error messages (ensure element exists)
function showErrorMessage(message) {
    const resultMessage = document.getElementById('result-message');
    if (resultMessage) {
        resultMessage.textContent = message;
        resultMessage.className = 'text-center text-xl font-bold h-12 text-red-500';
    } else {
        console.error("showErrorMessage: result-message element not found!");
        alert(message); // Fallback to alert
    }
}

// after loading moleculesData, compute effectsData automatically
function initEffectsData() {
    if (!gameState.moleculesData || gameState.moleculesData.length === 0) {
        console.warn("initEffectsData: moleculesData is not loaded");
        gameState.effectsData = [];
        return;
    }
    
    const types = Array.from(new Set(gameState.moleculesData.map(m => m.effects?.type).filter(Boolean)));
    gameState.effectsData = types.map(type => {
        // pick first sample molecule for defaults
        const sample = gameState.moleculesData.find(m => m.effects?.type === type)?.effects;
        return {
            type,
            name: type,               // you can localize this if desired
            description: '',          // fill as needed
            defaultValue: sample?.value ?? 0,
            defaultDuration: sample?.duration ?? 0
        };
    });
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed.");

    // --- Define Event Setup Function INSIDE DOMContentLoaded ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");
        try {
            // Helper to safely add listener
            const safeAddListener = (id, event, handler) => {
                const element = document.getElementById(id);
                if (element) {
                    // Check if handler is a function before adding
                    if (typeof handler === 'function') {
                         element.addEventListener(event, handler);
                    } else {
                         console.error(`Handler for ${id} is not a function (type: ${typeof handler})`);
                    }
                } else {
                    console.warn(`Element with ID ${id} not found for event listener.`);
                }
            };

            // 난이도 선택 (오프라인 모드에서만 동작)
            safeAddListener('difficulty-select', 'change', (e) => {
                const value = e.target.value;
                if (window.gameState) {
                    // 온라인 모드에서는 난이도 변경 무시
                    if (window.onlineGameState && window.onlineGameState.isOnline) {
                        showMessage('온라인 대전에서는 난이도 설정이 불가능합니다.', 'warning');
                        return;
                    }
                    
                    window.gameState.difficulty = value;
                    try { localStorage.setItem('difficulty', value); } catch (e) {}
                    
                    // 컴퓨터 카드 성장률 업데이트
                    if (typeof window.updateComputerCardGrowth === 'function') {
                        window.updateComputerCardGrowth();
                    }
                    
                    // 컴퓨터 진행도 난이도 배수 업데이트
                    if (window.gameState && window.gameState.computerProgression) {
                        const difficultyMultipliers = {
                            'very_easy': 0.3,
                            'easy': 0.5,
                            'normal': 1.0,
                            'hard': 1.5,
                            'very_hard': 2.0
                        };
                        window.gameState.computerProgression.difficultyMultiplier = difficultyMultipliers[value] || 1.0;
                        
                        // 성장률 재계산
                        if (typeof window.updateComputerGrowthRate === 'function') {
                            window.updateComputerGrowthRate();
                        }
                        
                        console.log(`Computer difficulty multiplier updated to: ${window.gameState.computerProgression.difficultyMultiplier}`);
                    }
                    
                    const diff = window.getDifficultyConfig ? window.getDifficultyConfig() : { name: value };
                    showMessage(`난이도가 ${diff.name}로 변경되었습니다.`, 'info');
                }
            });

            // 뽑기 버튼: 직접 카드 뽑기 시스템으로 복원
            safeAddListener('draw-cards-btn', 'click', () => {
                if (!gameState.isPlayerTurn) {
                    showMessage('플레이어 턴이 아닙니다.', 'warning');
                    return;
                }
                if (!gameState.isGameActive) {
                    showMessage('게임이 종료되었습니다.', 'info');
                    return;
                }
                
                // 직접 카드 뽑기 실행
                drawCards('player');
            });

            // 배치 뽑기 버튼 제거됨 - 카드는 자동 배치됨


            // Other Controls (assuming these functions are globally accessible)
            safeAddListener('end-turn-btn', 'click', endTurn);
            safeAddListener('reset-btn', 'click', resetGame);

            // Modals (assuming these functions are globally accessible)
            safeAddListener('close-modal', 'click', () => {
                if (typeof window.hideCardDetail === 'function') {
                    window.hideCardDetail();
                } else {
                     document.getElementById('card-detail-modal').classList.add('hidden');
                }
            });
            safeAddListener('close-collection-modal', 'click', () => {
                document.getElementById('molecule-collection-modal').classList.add('hidden');
            });
            safeAddListener('close-molecule-viewer', 'click', () => {
                document.getElementById('molecule-viewer-modal').classList.add('hidden');
            });
            // Molecule Viewer Navigation
            safeAddListener('prev-molecule', 'click', () => {
                if (typeof showPrevMolecule === 'function') {
                    showPrevMolecule();
                } else {
                    console.error("showPrevMolecule function not found!");
                }
            });
            safeAddListener('next-molecule', 'click', () => {
                if (typeof showNextMolecule === 'function') {
                    showNextMolecule();
                } else {
                    console.error("showNextMolecule function not found!");
                }
            });
            safeAddListener('new-game-btn', 'click', () => { // For game result modal
                document.getElementById('game-result-modal').classList.add('hidden');
                if (typeof resetGame === 'function') {
                    resetGame();
                }
            });

            // Tutorial button
            safeAddListener('tutorial-btn', 'click', () => {
                const helpModal = document.getElementById('tutorial-help-modal');
                if (helpModal) {
                    helpModal.classList.remove('hidden');
                } else {
                    // 튜토리얼 시스템이 로드되지 않은 경우 직접 시작
                    if (typeof window.startTutorial === 'function') {
                        window.startTutorial();
                    } else {
                        console.warn("Tutorial help modal not found, trying direct start...");
                        showMessage('튜토리얼을 시작합니다...', 'info');
                        // 잠시 후 다시 시도
                        setTimeout(() => {
                            if (typeof window.startTutorial === 'function') {
                                window.startTutorial();
                            } else {
                                showMessage('튜토리얼 시스템을 로드하는 중입니다. 잠시 후 다시 시도해주세요.', 'warning');
                            }
                        }, 500);
                    }
                }
            });

            // Tutorial help modal events
            safeAddListener('close-tutorial-help', 'click', () => {
                document.getElementById('tutorial-help-modal').classList.add('hidden');
            });
            safeAddListener('close-tutorial-help-btn', 'click', () => {
                document.getElementById('tutorial-help-modal').classList.add('hidden');
            });

            safeAddListener('start-tutorial-from-help', 'click', () => {
                document.getElementById('tutorial-help-modal').classList.add('hidden');
                // 튜토리얼 시스템이 로드될 때까지 기다림
                const waitForTutorial = () => {
                    if (typeof window.startTutorial === 'function') {
                        window.startTutorial();
                    } else {
                        // 100ms 후 다시 시도
                        setTimeout(waitForTutorial, 100);
                    }
                };
                waitForTutorial();
            });

            // Card Pack button
            safeAddListener('card-pack-btn', 'click', () => {
                if (typeof window.cardPackUI !== 'undefined' && window.cardPackUI.showPackSelectionModal) {
                    window.cardPackUI.showPackSelectionModal();
                } else {
                    console.error("Card Pack UI not found!");
                    showMessage('카드 팩 시스템을 사용할 수 없습니다.', 'error');
                }
            });

            // Initialize drag and drop (assuming initDragAndDrop is global)
            if (typeof initDragAndDrop === 'function') {
                initDragAndDrop();
            } else {
                 console.error("initDragAndDrop function not found!");
            }

            console.log("Event listeners setup complete.");
        } catch (error) {
            console.error("Error setting up event listeners:", error);
            showErrorMessage("UI 상호작용 설정 중 오류 발생.");
            throw error; // Re-throw if needed
        }
    }
    // --- End Event Setup Function Definition ---

    // --- Execution Flow ---
    try {
        await initializeAppCore(); // Run core initialization first
        console.log("initializeAppCore completed successfully.");

        setupEventListeners(); // Setup listeners only after core init succeeds
        // 인라인 화학 합성실 버튼 핸들러 바인딩
        try {
            const clearInline = document.getElementById('chem-lab-clear-inline');
            const synthInline = document.getElementById('chem-lab-synthesize-inline');
            if (clearInline) clearInline.addEventListener('click', () => { if (window.fusionUI?.clearChemLabSelection) window.fusionUI.clearChemLabSelection(true); });
            if (synthInline) synthInline.addEventListener('click', () => { if (window.fusionUI?.performChemLabSynthesis) window.fusionUI.performChemLabSynthesis(); });
        } catch (e) {}

        // 난이도 초기 로드/동기화
        try {
            const saved = localStorage.getItem('difficulty');
            const select = document.getElementById('difficulty-select');
            if (saved && window.gameState) {
                window.gameState.difficulty = saved;
                if (select) select.value = saved;
            } else if (select && window.gameState) {
                // 셀렉트 초기 상태를 gameState로 반영
                window.gameState.difficulty = select.value || 'normal';
            }
        } catch (e) { /* ignore storage errors */ }

        // Give initial cards
        giveInitialCardsAndCoins();
        console.log("Initial setup flow completed.");

        // 튜토리얼 완료 여부 확인 및 제안
        if (typeof window.isTutorialCompleted === 'function' && !window.isTutorialCompleted()) {
            setTimeout(() => {
                if (confirm('원소 대전에 처음 오셨나요? 튜토리얼을 시작하시겠습니까?')) {
                    window.startTutorial();
                }
            }, 1000);
        }

        // 인라인/모달 합성실 드롭존 바인딩 실행
        if (typeof window.attachChemLabDnD === 'function') {
            window.attachChemLabDnD();
        }

    } catch (error) {
        // Error already logged in initializeAppCore or setupEventListeners
        console.error("Application initialization failed overall.");
        // Error message already shown by the failing function
    }
});

// 배치 뽑기 모달 제거됨 - 카드는 자동 배치됨
