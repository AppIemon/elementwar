var gameState = {
  playerScore: 0,
  computerScore: 0,
  isGameActive: true,
  playerHand: [],
  computerHand: [],
  isPlayerTurn: true,
  turnCount: 1,
  selectedCardId: null,
  elementsData: [],
  moleculesData: [],
  reactionsData: [], // 반응 데이터 (현재 빈 배열로 초기화)
  effectsData: [],
  cardStatsData: null, // 카드 스탯 데이터 (JSON에서 로드)
  playerCoins: 20, // Starting coins for player (increased)
  computerCoins: 20, // Starting coins for computer (increased)
  energy: 0, // Player energy
  drawCount: 0, // 통일된 뽑기 횟수 추적
  // 뽑기 가격과 카드 수, 등급 확률을 동적으로 계산
  baseDrawCost: 1, // 기본 뽑기 가격 (핵융합 시스템에 맞게 조정)
  baseCardCount: 4, // 기본 카드 수 (더 많은 카드 제공)
  costMultiplier: 1.15, // 가격 증가 배수 (더 완만하게 조정)
  cardCountMultiplier: 1.1, // 카드 수 증가 배수 (완만하게 조정)
  // 턴당 카드 제한 제거됨
  // 핵융합 시스템 상태
  fusionSystem: null,
  // 난이도: 'easy' | 'normal' | 'hard'
  difficulty: 'normal',
  // 컴퓨터 진행도 관리
  computerProgression: {
    baseGrowthRate: 1.0, // 기본 성장률
    currentGrowthRate: 1.0, // 현재 성장률
    difficultyMultiplier: 1.0, // 난이도 배수
    turnGrowthIncrement: 0.05, // 턴마다 증가하는 성장률
    maxGrowthRate: 2.5 // 최대 성장률
  },
  // 컴퓨터 별 관리 시스템
  computerStarManagement: null
};

// 카드 스탯 데이터 로드 함수 (elements.json과 molecules.json 사용)
async function loadCardStatsData() {
  try {
    // elements.json과 molecules.json이 이미 app.js에서 로드되었는지 확인
    if (gameState.elementsData && gameState.moleculesData) {
      console.log('카드 스탯 데이터가 이미 로드되었습니다.');
      gameState.cardStatsData = {
        elements: gameState.elementsData,
        molecules: gameState.moleculesData
      };
      return true;
    }

    // 만약 로드되지 않았다면 직접 로드
    const [elementsResponse, moleculesResponse] = await Promise.all([
      fetch('src/data/elements.json'),
      fetch('src/data/molecules.json')
    ]);

    if (!elementsResponse.ok) {
      throw new Error(`Elements HTTP error! status: ${elementsResponse.status}`);
    }
    if (!moleculesResponse.ok) {
      throw new Error(`Molecules HTTP error! status: ${moleculesResponse.status}`);
    }

    const elementsData = await elementsResponse.json();
    const moleculesData = await moleculesResponse.json();
    
    gameState.elementsData = elementsData;
    gameState.moleculesData = moleculesData;
    gameState.cardStatsData = {
      elements: elementsData,
      molecules: moleculesData
    };
    
    console.log('카드 스탯 데이터가 성공적으로 로드되었습니다.');
    return true;
  } catch (error) {
    console.error('카드 스탯 데이터 로드 실패:', error);
    gameState.cardStatsData = null;
    return false;
  }
}

// 통합 데이터 로드 함수
async function loadAllGameData() {
  console.log('모든 게임 데이터 로딩 시작...');
  
  try {
    // 1. 카드 스탯 데이터 로드 (elements.json과 molecules.json 포함)
    const cardStatsLoaded = await loadCardStatsData();
    
    if (!cardStatsLoaded) {
      console.error('카드 스탯 데이터 로드에 실패했습니다.');
      return false;
    }
    
    // 2. 데이터 로드 상태 확인
    if (!gameState.elementsData || gameState.elementsData.length === 0) {
      console.warn('원소 데이터가 로드되지 않았습니다.');
      return false;
    } else {
      console.log(`원소 데이터 로드됨: ${gameState.elementsData.length}개`);
    }
    
    if (!gameState.moleculesData || gameState.moleculesData.length === 0) {
      console.warn('분자 데이터가 로드되지 않았습니다.');
      return false;
    } else {
      console.log(`분자 데이터 로드됨: ${gameState.moleculesData.length}개`);
    }
    
    console.log('모든 게임 데이터 로딩 완료');
    return true;
  } catch (error) {
    console.error('게임 데이터 로딩 중 오류 발생:', error);
    return false;
  }
}

// 연구 레벨에 따른 등장 가능 최대 원소 번호 계산 (기본 1=H, 2=He만, 연구로 확장)
// 규칙: cap = Math.min(26, 2 + (gameState.fusionSystem?.researchLevel || 0))
// - 연구 레벨 0: 2 (H, He)
// - 연구 레벨 n: 2+n (최대 26)
function getMaxElementNumberByResearch() {
  // 우선순위: 전용 업그레이드 drawCap 레벨 -> 기존 researchLevel (하위호환)
  const fs = gameState.fusionSystem || {};
  const drawCapLevel = (fs.equipment && typeof fs.equipment.drawCap === 'number') ? fs.equipment.drawCap : 0;
  const fallbackResearchLevel = (typeof fs.researchLevel === 'number') ? fs.researchLevel : 0;
  const effectiveLevel = Math.max(drawCapLevel, fallbackResearchLevel);
  const cap = Math.min(26, 2 + effectiveLevel);
  return cap;
}

// 현재까지 발견된 최상위 원소 번호 찾기
function getMaxDiscoveredElementNumber() {
  let maxNumber = 1; // 최소값은 H(1)
  
  console.log('[getMaxDiscoveredElementNumber] 시작');
  
  // 손패에서 원소 카드 확인
  if (Array.isArray(gameState.playerHand)) {
    gameState.playerHand.forEach(card => {
      if (card && card.element && typeof card.element.number === 'number') {
        maxNumber = Math.max(maxNumber, card.element.number);
        console.log('[getMaxDiscoveredElementNumber] 플레이어 손패에서 발견:', card.element.symbol, card.element.number);
      }
    });
  }
  
  // 컴퓨터 손패에서 원소 카드 확인
  if (Array.isArray(gameState.computerHand)) {
    gameState.computerHand.forEach(card => {
      if (card && card.element && typeof card.element.number === 'number') {
        maxNumber = Math.max(maxNumber, card.element.number);
        console.log('[getMaxDiscoveredElementNumber] 컴퓨터 손패에서 발견:', card.element.symbol, card.element.number);
      }
    });
  }
  
  // 전장에 있는 원소 카드 확인
  if (window.battlefield && Array.isArray(battlefield.lanes)) {
    battlefield.lanes.forEach(lane => {
      if (lane && lane.player && lane.player.element && typeof lane.player.element.number === 'number') {
        maxNumber = Math.max(maxNumber, lane.player.element.number);
        console.log('[getMaxDiscoveredElementNumber] 전장 플레이어에서 발견:', lane.player.element.symbol, lane.player.element.number);
      }
      if (lane && lane.computer && lane.computer.element && typeof lane.computer.element.number === 'number') {
        maxNumber = Math.max(maxNumber, lane.computer.element.number);
        console.log('[getMaxDiscoveredElementNumber] 전장 컴퓨터에서 발견:', lane.computer.element.symbol, lane.computer.element.number);
      }
    });
  }
  
  // 핵융합 시스템의 재료에서 원소 확인
  if (gameState.fusionSystem && gameState.fusionSystem.materials) {
    Object.keys(gameState.fusionSystem.materials).forEach(symbol => {
      if (gameState.fusionSystem.materials[symbol] > 0) {
        const element = gameState.elementsData && gameState.elementsData.find ? gameState.elementsData.find(e => e.symbol === symbol) : null;
        if (element && typeof element.number === 'number') {
          maxNumber = Math.max(maxNumber, element.number);
          console.log('[getMaxDiscoveredElementNumber] 핵융합 재료에서 발견:', element.symbol, element.number);
        }
      }
    });
  }
  
  // 온라인 대전에서는 최소 2 (H, He)를 보장
  const finalMax = Math.max(maxNumber, 2);
  console.log('[getMaxDiscoveredElementNumber] 최종 결과:', finalMax, '(원본:', maxNumber, ')');
  
  return finalMax;
}


// 온라인 게임 관련 변수
let onlineGameState = {
  isOnline: false,
  roomId: '',
  opponentName: '',
  isHost: false,
  playerTurnEnded: false,
  opponentTurnEnded: false,
  waitingForOpponent: false
};

// 카드 뽑기 관련 변수 추가
const drawState = {
  isDrawing: false,  // 현재 뽑기 진행 중인지
  queue: []          // 뽑기 대기열
};

// 통일된 뽑기 시스템 함수들
function getCurrentDrawCost() {
  return Math.floor(gameState.baseDrawCost * Math.pow(gameState.costMultiplier, gameState.drawCount));
}

function getCurrentCardCount() {
  return Math.floor(gameState.baseCardCount * Math.pow(gameState.cardCountMultiplier, gameState.drawCount));
}

// 난이도 설정 유틸 (5단계)
function getDifficultyConfig() {
  const d = gameState.difficulty || 'normal';
  if (d === 'very_easy') {
    return {
      mistakeChance: 0.8,      // 매우 자주 실수
      chooseTopK: 5,           // 상위 5개 중 랜덤
      aggressionBonus: 0.3,    // 공격 성향 매우 약함
      thinkDelayMs: 800,       // 매우 짧게 생각
      drawThreshold: 9,        // 손패 9장 미만이면 뽑기 선호
      cardGrowthRate: 0.5,     // 카드 성장률 매우 낮음
      name: '매우 쉬움'
    };
  }
  if (d === 'easy') {
    return {
      mistakeChance: 0.6,      // 자주 실수
      chooseTopK: 4,           // 상위 4개 중 랜덤
      aggressionBonus: 0.5,    // 공격 성향 약함
      thinkDelayMs: 1000,      // 짧게 생각
      drawThreshold: 8,        // 손패 8장 미만이면 뽑기 선호
      cardGrowthRate: 0.7,     // 카드 성장률 낮음
      name: '쉬움'
    };
  }
  if (d === 'normal') {
    return {
      mistakeChance: 0.4,      // 가끔 실수
      chooseTopK: 3,           // 상위 3개 중 선택
      aggressionBonus: 0.8,    // 공격 성향 보통
      thinkDelayMs: 1200,      // 보통 생각 시간
      drawThreshold: 7,        // 손패 7장 미만이면 뽑기 선호
      cardGrowthRate: 1.0,     // 카드 성장률 보통
      name: '보통'
    };
  }
  if (d === 'hard') {
    return {
      mistakeChance: 0.2,      // 가끔 실수
      chooseTopK: 2,           // 상위 2개 중 선택
      aggressionBonus: 1.2,    // 공격 성향 강함
      thinkDelayMs: 1500,      // 오래 생각
      drawThreshold: 6,        // 손패 6장 미만이면 뽑기 선호
      cardGrowthRate: 1.3,     // 카드 성장률 높음
      name: '어려움'
    };
  }
  if (d === 'very_hard') {
    return {
      mistakeChance: 0.05,     // 거의 실수 안함
      chooseTopK: 1,           // 최고 선택만
      aggressionBonus: 1.5,    // 공격 성향 매우 강함
      thinkDelayMs: 2000,      // 매우 오래 생각
      drawThreshold: 5,        // 손패 5장 미만이면 뽑기 선호
      cardGrowthRate: 1.6,     // 카드 성장률 매우 높음
      name: '매우 어려움'
    };
  }
  // 기본값 (normal)
  return {
    mistakeChance: 0.4,
    chooseTopK: 3,
    aggressionBonus: 0.8,
    thinkDelayMs: 1200,
    drawThreshold: 7,
    cardGrowthRate: 1.0,
    name: '보통'
  };
}

// 특수 능력 시스템
function processSpecialAbilities(card, targetCards, isPlayerCard) {
  if (!card.specialAbilities) return;
  
  card.specialAbilities.forEach(ability => {
    if (checkAbilityCondition(ability, card, targetCards, isPlayerCard)) {
      executeSpecialAbility(ability, card, targetCards, isPlayerCard);
    }
  });
}

function checkAbilityCondition(ability, card, targetCards, isPlayerCard) {
  if (!ability || !ability.condition) return false;
  
  switch (ability.condition) {
    case 'allies_count >= 3':
      return isPlayerCard ? gameState.playerHand.length >= 3 : gameState.computerHand.length >= 3;
    case 'enemies_count >= 2':
      return isPlayerCard ? gameState.computerHand.length >= 2 : gameState.playerHand.length >= 2;
    case 'has_status_effect':
      return targetCards.some(target => target.statusEffects && target.statusEffects.length > 0);
    case 'water_present':
      return targetCards.some(target => target.id === 'h2o');
    case 'water_contact':
      return targetCards.some(target => target.id === 'h2o');
    case 'metal_target':
      return targetCards.some(target => target.category === '금속' || target.category === '전이 금속');
    case 'turn_start':
      return true; // 매 턴 시작 시
    case 'on_attack':
      return targetCards && targetCards.length > 0;
    case 'on_damage':
      return true;
    case 'on_death':
      return card && card.hp <= 0;
    case 'on_kill':
      return targetCards && targetCards.some(target => target.hp <= 0);
    case 'on_skill_use':
      return true; // 스킬 사용 시
    case 'allies_with_status':
      const allies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      return allies.some(ally => ally.statusEffects && ally.statusEffects.length > 0);
    case 'ally_takes_damage':
      return true; // 아군이 피해를 받을 때
    case 'always':
      return true;
    default:
      return false;
  }
}

// 카드 객체로부터 DOM 요소를 찾는 함수
function findCardElement(card) {
  if (!card || !card.id) return null;
  
  // 전장에서 카드 찾기
  const battlefieldCard = document.querySelector(`[data-card-id="${card.id}"]`);
  if (battlefieldCard) return battlefieldCard;
  
  // 손패에서 카드 찾기
  const handCard = document.querySelector(`#${card.id}`);
  if (handCard) return handCard;
  
  return null;
}

function executeSpecialAbility(ability, card, targetCards, isPlayerCard) {
  if (!ability || !ability.effect) return;
  
  // ability 함수 실행 (새로운 시스템)
  if (ability.ability && typeof ability.ability === 'string') {
    try {
      // ability 함수 문자열을 실제 함수로 변환
      const abilityFunction = new Function('me', 'enemy', ability.ability);
      
      // me와 enemy 객체 설정
      const me = card;
      const enemy = targetCards.length > 0 ? targetCards[0] : null;
      
      // 함수 실행
      abilityFunction(me, enemy);
      
      // UI 업데이트
      if (me.statusEffects && me.statusEffects.length > 0) {
        updateCardStatusEffects(me);
      }
      if (enemy && enemy.statusEffects && enemy.statusEffects.length > 0) {
        updateCardStatusEffects(enemy);
      }
      
      return; // ability 함수가 실행되면 기존 switch문 건너뛰기
    } catch (error) {
      console.error('Ability 함수 실행 오류:', error);
      console.error('Ability 코드:', ability.ability);
    }
  }
  
  // 특수능력 발동 시 카드 애니메이션 트리거
  const cardElement = findCardElement(card);
  if (cardElement && window.playSpecialAbilityCardAnimation) {
    // 특수능력 이름 가져오기 (매핑된 이름 우선, 없으면 원본 이름 사용)
    const abilityName = ability.name || ability.effect;
    window.playSpecialAbilityCardAnimation(cardElement, abilityName);
  }
  
  // 특수능력 효과 애니메이션을 위한 지연
  setTimeout(() => {
    if (cardElement && window.playSpecialAbilityEffectAnimation) {
      const abilityName = ability.name || ability.effect;
      window.playSpecialAbilityEffectAnimation(abilityName, cardElement, ability.value);
    }
  }, 200);
  
  switch (ability.effect) {
    // 기존 효과들
    case 'heal_all_allies':
      const allies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      allies.forEach(ally => {
        if (ally && typeof ally.hp === 'number') {
          ally.hp = Math.min(ally.hp + ability.value, ally.baseStats ? ally.baseStats.hp : ally.maxHp);
        }
      });
      break;
    case 'cleanse_all_status':
      const alliesToCleanse = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      alliesToCleanse.forEach(ally => {
        if (ally && ally.statusEffects) {
          ally.statusEffects = [];
        }
      });
      break;
    case 'weaken_all_enemies':
      const enemies = isPlayerCard ? gameState.computerHand : gameState.playerHand;
      enemies.forEach(enemy => {
        if (enemy && typeof enemy.atk === 'number') {
          enemy.atk = Math.max(enemy.atk - ability.value, 1);
        }
      });
      break;
    case 'acid_damage':
      targetCards.forEach(target => {
        if (target && target.id === 'h2o' && typeof target.hp === 'number') {
          target.hp -= ability.value;
        }
      });
      break;
    case 'explosive_damage':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          target.hp -= ability.value;
        }
      });
      break;
    case 'dehydration':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'dehydration',
            value: ability.value,
            duration: ability.duration
          });
        }
      });
      break;
    case 'metal_corrosion':
      targetCards.forEach(target => {
        if (target && (target.category === '금속' || target.category === '전이 금속') && typeof target.hp === 'number') {
          target.hp -= ability.value * 3;
        }
      });
      break;
    case 'boost_all_allies':
      const alliesToBoost = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      alliesToBoost.forEach(ally => {
        if (ally) {
          ally.tempBoost = ability.value;
          ally.tempBoostDuration = ability.duration;
        }
      });
      break;
    case 'accelerate_healing':
      const alliesToHeal = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      alliesToHeal.forEach(ally => {
        if (ally && ally.statusEffects && ally.statusEffects.length > 0) {
          ally.healingMultiplier = ability.value;
        }
      });
      break;
    case 'damage_transfer':
      // 아군이 피해를 받을 때 포도당이 대신 받는 로직
      break;

    // 새로운 분자 특수능력들
    case 'shield_generation':
      if (card && typeof card.hp === 'number') {
        const shieldAmount = Math.floor(card.maxHp * ability.value / 100);
        if (!card.shield) card.shield = 0;
        card.shield += shieldAmount;
        playMoleculeSpecialAnimation('heal_over_time');
      }
      break;
      
    case 'electric_resistance':
      if (card) {
        if (!card.resistances) card.resistances = {};
        card.resistances.electric = (card.resistances.electric || 0) + ability.value;
      }
      break;
      
    case 'electric_immunity':
      const alliesForImmunity = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      alliesForImmunity.forEach(ally => {
        if (ally) {
          if (!ally.tempEffects) ally.tempEffects = {};
          ally.tempEffects.electricImmunity = {
            value: ability.value,
            duration: ability.duration || 2
          };
        }
      });
      playMoleculeSpecialAnimation('freeze');
      break;
      
    case 'physical_resistance':
      if (card) {
        if (!card.resistances) card.resistances = {};
        card.resistances.physical = (card.resistances.physical || 0) + ability.value;
      }
      break;
      
    case 'damage_reflection':
      if (card) {
        if (!card.reflectDamage) card.reflectDamage = 0;
        card.reflectDamage += ability.value;
      }
      break;
      
    case 'defense_reduction':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'defense_reduction',
            value: ability.value,
            duration: ability.duration || 2
          });
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'armor_piercing':
      if (card) {
        if (!card.armorPiercing) card.armorPiercing = 0;
        card.armorPiercing += ability.value;
      }
      break;
      
    case 'corrosion_damage':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'corrosion',
            value: ability.value,
            duration: ability.duration || 2
          });
        }
      });
      playMoleculeSpecialAnimation('corrosive');
      break;
      
    case 'poison_damage':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'poison',
            value: ability.value,
            duration: ability.duration || 3
          });
        }
      });
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'spread_poison':
      // 인접한 적들에게 독성 전파
      const adjacentTargets = getAdjacentTargets(card, isPlayerCard);
      adjacentTargets.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'corrosion',
            value: ability.value * 10, // 2중첩 = 20%
            duration: 2
          });
        }
      });
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'fire_damage_boost':
      if (card) {
        if (!card.damageBoosts) card.damageBoosts = {};
        card.damageBoosts.fire = (card.damageBoosts.fire || 0) + ability.value;
      }
      break;
      
    case 'oxidation_damage':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(target.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'reactive_oxygen':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(target.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'thermal_explosion':
      const explosionTargets = isPlayerCard ? gameState.computerHand : gameState.playerHand;
      explosionTargets.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'thermionic_emission':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'salt_synergy':
      const saltAllies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      saltAllies.forEach(ally => {
        if (ally && ally.category === '염(무기염)') {
          if (!ally.tempBoosts) ally.tempBoosts = {};
          ally.tempBoosts.atk = (ally.tempBoosts.atk || 0) + ability.value;
          if (ability.duration) {
            ally.tempBoosts.atkDuration = ability.duration;
          }
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'base_catalyst':
      const baseAllies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      baseAllies.forEach(ally => {
        if (ally && ally.category === '염기') {
          if (!ally.tempBoosts) ally.tempBoosts = {};
          ally.tempBoosts.atk = (ally.tempBoosts.atk || 0) + ability.value;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'doping_synergy':
      const semiconductorAllies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      semiconductorAllies.forEach(ally => {
        if (ally && ally.category === '반도체') {
          if (!ally.tempBoosts) ally.tempBoosts = {};
          ally.tempBoosts.atk = (ally.tempBoosts.atk || 0) + ability.value;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'catalyst_synergy':
      if (card) {
        if (!card.catalystBoost) card.catalystBoost = 0;
        card.catalystBoost += ability.value;
      }
      break;
      
    case 'energy_recovery':
      if (isPlayerCard && gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.energy + ability.value, gameState.maxEnergy);
      }
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'skill_cooldown_reduction':
      const skillAllies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      skillAllies.forEach(ally => {
        if (ally) {
          if (!ally.skillCooldownReduction) ally.skillCooldownReduction = 0;
          ally.skillCooldownReduction += ability.value;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'acid_catalyst':
      if (card) {
        if (!card.skillCooldownReduction) card.skillCooldownReduction = 0;
        card.skillCooldownReduction += ability.value;
      }
      break;
      
    case 'debuff_amplification':
      if (card) {
        if (!card.debuffAmplification) card.debuffAmplification = 0;
        card.debuffAmplification += ability.value;
      }
      break;
      
    case 'organic_hunter':
      if (card) {
        if (!card.damageBoosts) card.damageBoosts = {};
        card.damageBoosts.organic = (card.damageBoosts.organic || 0) + ability.value;
      }
      break;
      
    case 'buff_removal':
      targetCards.forEach(target => {
        if (target && target.buffs && target.buffs.length > 0) {
          target.buffs.splice(0, ability.value);
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'cleanse_debuffs':
      const cleanseAllies = isPlayerCard ? gameState.playerHand : gameState.computerHand;
      cleanseAllies.forEach(ally => {
        if (ally && ally.statusEffects) {
          ally.statusEffects = [];
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'gas_cloud':
      // 혼탁 지대 생성 (구현 필요)
      createGasCloud(card, ability.duration || 1);
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'halogen_dome':
    case 'fluorine_dome':
      if (card) {
        if (!card.accuracyReduction) card.accuracyReduction = 0;
        card.accuracyReduction += ability.value;
      }
      break;
      
    case 'smoke_screen':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'accuracy_reduction',
            value: ability.value,
            duration: ability.duration || 2
          });
        }
      });
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'spread_effect':
      // 효과 확산 (구현 필요)
      spreadEffect(card, ability.value);
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'inert_immunity':
    case 'noble_gas_immunity':
    case 'inactive_immunity':
      if (card) {
        if (!card.immunities) card.immunities = [];
        card.immunities.push('oxidation', 'reduction');
      }
      break;
      
    case 'inert_penetration':
      if (card) {
        if (!card.immunityPenetration) card.immunityPenetration = 0;
        card.immunityPenetration += ability.value;
      }
      break;
      
    case 'solvent_effect':
      if (card) {
        if (!card.solventBoost) card.solventBoost = 0;
        card.solventBoost += ability.value;
      }
      break;
      
    case 'fuel_rod':
      if (card) {
        if (!card.fuelRodBoost) card.fuelRodBoost = 0;
        card.fuelRodBoost += ability.value;
      }
      break;
      
    case 'nuclear_chemistry':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'electrolyte_boost':
      if (card) {
        if (!card.electrolyteBoost) card.electrolyteBoost = 0;
        card.electrolyteBoost += ability.value;
      }
      break;
      
    case 'catalyst_boost':
      if (card) {
        if (!card.catalystBoost) card.catalystBoost = 0;
        card.catalystBoost += ability.value;
      }
      break;
      
    case 'lipophilic_effect':
      if (card) {
        if (!card.lipophilicBoost) card.lipophilicBoost = 0;
        card.lipophilicBoost += ability.value;
      }
      break;
      
    case 'coating_effect':
      if (card) {
        if (!card.coatingBoost) card.coatingBoost = 0;
        card.coatingBoost += ability.value;
      }
      break;
      
    case 'chromate_cycle':
      if (card) {
        if (!card.chromateCycle) card.chromateCycle = 0;
        card.chromateCycle += ability.value;
      }
      break;
      
    case 'deoxygenation':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'volatile_vapor':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    // 고급 특수 효과들
    case 'high_k_barrier':
      if (card) {
        if (!card.barrierBoost) card.barrierBoost = 0;
        card.barrierBoost += ability.value;
      }
      break;
      
    case 'pi_stacking':
      if (card) {
        if (!card.piStacking) card.piStacking = 0;
        card.piStacking += ability.value;
      }
      break;
      
    case 'hydrolysis':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'metal_carbon_bond':
      if (card) {
        if (!card.metalCarbonBond) card.metalCarbonBond = 0;
        card.metalCarbonBond += ability.value;
      }
      break;
      
    case 'lewis_capture':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'anesthetic_toxicity':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'anesthetic_poison',
            value: ability.value,
            duration: ability.duration || 3
          });
        }
      });
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'sandwich_bonding':
      if (card) {
        if (!card.sandwichBonding) card.sandwichBonding = 0;
        card.sandwichBonding += ability.value;
      }
      break;
      
    case 'sandwich_stability':
      if (card) {
        if (!card.sandwichStability) card.sandwichStability = 0;
        card.sandwichStability += ability.value;
      }
      break;
      
    case 'hydrogenation':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'alkyl_radical':
      if (card) {
        if (!card.criticalChance) card.criticalChance = 0;
        card.criticalChance += ability.value;
      }
      break;
      
    case 'self_oxidation':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('explosive');
      break;
      
    case 'cryogenic_gas':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'freeze',
            value: ability.value,
            duration: 2
          });
        }
      });
      playMoleculeSpecialAnimation('freeze');
      break;
      
    case 'electron_resonance':
      if (card) {
        if (!card.electronResonance) card.electronResonance = 0;
        card.electronResonance += ability.value;
      }
      break;
      
    case 'electron_donor':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'electron_scavenger':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'electron_deficiency':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'delayed_toxicity':
      targetCards.forEach(target => {
        if (target) {
          if (!target.statusEffects) target.statusEffects = [];
          target.statusEffects.push({
            type: 'delayed_poison',
            value: ability.value,
            duration: ability.duration || 4
          });
        }
      });
      playMoleculeSpecialAnimation('poison');
      break;
      
    case 'lipid_solubility':
      if (card) {
        if (!card.lipidSolubility) card.lipidSolubility = 0;
        card.lipidSolubility += ability.value;
      }
      break;
      
    case 'super_fluorination':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'super_acid':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('acid_damage');
      break;
      
    case 'ultra_hardness':
      if (card) {
        if (!card.ultraHardness) card.ultraHardness = 0;
        card.ultraHardness += ability.value;
      }
      break;
      
    case 'wide_bandgap':
      if (card) {
        if (!card.wideBandgap) card.wideBandgap = 0;
        card.wideBandgap += ability.value;
      }
      break;
      
    case 'coordination_shift':
      targetCards.forEach(target => {
        if (target && typeof target.hp === 'number') {
          const damage = Math.floor(card.atk * ability.value / 100);
          target.hp -= damage;
        }
      });
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    case 'light_pigment':
      if (card) {
        if (!card.lightPigment) card.lightPigment = 0;
        card.lightPigment += ability.value;
      }
      break;
      
    case 'photocatalyst_initiation':
      if (card) {
        if (!card.photocatalystInitiation) card.photocatalystInitiation = 0;
        card.photocatalystInitiation += ability.value;
      }
      playMoleculeSpecialAnimation('heal_over_time');
      break;
      
    default:
      console.warn('알 수 없는 특수능력:', ability.effect);
      break;
  }
}

// 인접한 대상들을 찾는 함수
function getAdjacentTargets(card, isPlayerCard) {
  const targets = [];
  // 전장에서 인접한 카드들을 찾는 로직 (구현 필요)
  return targets;
}

// 가스 구름 생성 함수
function createGasCloud(card, duration) {
  // 혼탁 지대 생성 로직 (구현 필요)
  console.log('가스 구름 생성:', duration);
}

// 효과 확산 함수
function spreadEffect(card, value) {
  // 효과 확산 로직 (구현 필요)
  console.log('효과 확산:', value);
}

// 상성 시스템
function calculateAffinityDamage(attacker, defender) {
  let damageMultiplier = 1;
  
  if (attacker.affinities && defender.category) {
    // 강한 상성 체크
    if (attacker.affinities.strong_against && 
        attacker.affinities.strong_against.includes(defender.category)) {
      damageMultiplier *= 1.5;
    }
    
    // 약한 상성 체크
    if (attacker.affinities.weak_against && 
        attacker.affinities.weak_against.includes(defender.category)) {
      damageMultiplier *= 0.7;
    }
  }
  
  return damageMultiplier;
}

// 시너지 시스템
function checkSynergy(card1, card2) {
  if (!card1.affinities || !card2.affinities) return false;
  
  const synergy1 = card1.affinities.synergy_with || [];
  const synergy2 = card2.affinities.synergy_with || [];
  
  return synergy1.some(type => synergy2.includes(type));
}

function applySynergyBonus(cards) {
  const bonuses = [];
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (checkSynergy(cards[i], cards[j])) {
        bonuses.push({
          cards: [cards[i], cards[j]],
          bonus: 1.2 // 20% 보너스
        });
      }
    }
  }
  
  return bonuses;
}

function getRarityChances() {
  const drawCount = gameState.drawCount;
  
  // 뽑기 횟수가 많아질수록 더 좋은 등급의 확률이 증가 (더 관대한 확률)
  if (drawCount < 3) {
    // 초기: 더 좋은 카드 확률 증가
    return { common: 50, uncommon: 35, rare: 12, epic: 2.5, legendary: 0.5 };
  } else if (drawCount < 6) {
    // 중기: 더 좋은 카드 확률 증가
    return { common: 30, uncommon: 40, rare: 20, epic: 8, legendary: 2 };
  } else if (drawCount < 10) {
    // 후기: 더 좋은 카드 확률 증가
    return { common: 15, uncommon: 25, rare: 35, epic: 20, legendary: 5 };
  } else {
    // 최종: 더 좋은 카드 확률 증가
    return { common: 5, uncommon: 15, rare: 30, epic: 35, legendary: 15 };
  }
}

// 턴 진행에 따른 희귀도 확률 조정 함수
function adjustRarityChancesForTurn(baseChances, turnCount) {
  const adjustedChances = { ...baseChances };
  
  // 턴이 진행될수록 고급 등급 확률 증가
  const turnBonus = Math.min(0.3, (turnCount - 1) * 0.02); // 턴마다 2%씩 증가, 최대 30%
  
  // common 확률 감소
  adjustedChances.common = Math.max(5, adjustedChances.common - turnBonus * 20);
  
  // uncommon 확률 약간 증가
  adjustedChances.uncommon = Math.min(50, adjustedChances.uncommon + turnBonus * 10);
  
  // rare 확률 증가
  adjustedChances.rare = Math.min(45, adjustedChances.rare + turnBonus * 15);
  
  // epic 확률 증가
  adjustedChances.epic = Math.min(40, adjustedChances.epic + turnBonus * 8);
  
  // legendary 확률 증가
  adjustedChances.legendary = Math.min(20, adjustedChances.legendary + turnBonus * 5);
  
  // 확률 합계가 100이 되도록 정규화
  const total = Object.values(adjustedChances).reduce((sum, chance) => sum + chance, 0);
  for (const rarity in adjustedChances) {
    adjustedChances[rarity] = (adjustedChances[rarity] / total) * 100;
  }
  
  return adjustedChances;
}

const BASE_ATTACK_DAMAGE = 2; // Reduced base damage for longer games
const BASE_HEALING_RATE = 8; // Increased base healing for longer games

// --- ADDED UI Functions ---

function updateScoreDisplay() {
  console.log("updateScoreDisplay: Updating scores..."); // Add log
  const playerScoreEl = document.getElementById('player-score');
  const computerScoreEl = document.getElementById('computer-score');
  if (playerScoreEl) {
      playerScoreEl.textContent = gameState.playerScore;
  } else {
      console.error("updateScoreDisplay: Player score element not found!");
  }
  if (computerScoreEl) {
      computerScoreEl.textContent = gameState.computerScore;
  } else {
      console.error("updateScoreDisplay: Computer score element not found!");
  }
  console.log("updateScoreDisplay: Scores updated.");
}

function updateTurnIndicator() {
  console.log("updateTurnIndicator: Updating turn message...", {
    turnCount: gameState.turnCount,
    isPlayerTurn: gameState.isPlayerTurn,
    isOnline: onlineGameState.isOnline
  });
  
  // 온라인 모드에서는 updateOnlineTurnUI가 처리하므로 여기서는 건드리지 않음
  if (onlineGameState.isOnline) {
    console.log("updateTurnIndicator: 온라인 모드에서는 updateOnlineTurnUI가 처리합니다.");
    return;
  }
  
  const resultMessage = document.getElementById('result-message');
  if (!resultMessage) {
      console.error("updateTurnIndicator: Result message element not found!");
      return;
  }

  if (gameState.isPlayerTurn) {
    resultMessage.textContent = `${gameState.turnCount}턴: 플레이어 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-blue-400';
    console.log("updateTurnIndicator: 플레이어 차례로 설정됨");
  } else {
    resultMessage.textContent = `${gameState.turnCount}턴: 컴퓨터 차례`;
    resultMessage.className = 'text-center text-xl font-bold h-12 text-red-400';
    console.log("updateTurnIndicator: 컴퓨터 차례로 설정됨 (오프라인)");
  }
  console.log("updateTurnIndicator: Turn message updated to:", resultMessage.textContent);
}

// --- End ADDED UI Functions ---

// 원소 능력치 스케일 함수: JSON 데이터를 사용하여 계산
function getElementStage(elementNumber) {
  if (elementNumber <= 10) return 0;
  if (elementNumber <= 20) return 1;
  if (elementNumber <= 40) return 2;
  if (elementNumber <= 70) return 3;
  return 4;
}

function computeElementStats(element, rarity) {
  // JSON 데이터가 로드되지 않은 경우 기본값 사용
  if (!gameState.cardStatsData) {
    console.warn('카드 스탯 데이터가 로드되지 않았습니다. 기본값을 사용합니다.');
    return computeElementStatsFallback(element, rarity);
  }

  const statsData = gameState.cardStatsData;
  const number = element?.number || 1;
  const stage = getElementStage(number);
  
  // stageMultipliers가 존재하지 않는 경우를 대비한 안전장치
  const stageMultiplier = (statsData.stageMultipliers && statsData.stageMultipliers[stage.toString()]) || Math.pow(1.3, stage);

  // 희귀도 배수 조정
  const rarityMultipliers = statsData.rarityMultipliers || {};
  const rarityMul = rarityMultipliers[rarity || element?.rarity || 'common'] || 1.0;

  // 우선순위에 따른 기본 스탯 결정
  let baseHp, baseAtk;
  
  // 1순위: elements.json의 baseHp, baseAtk 사용 (이미 로드된 경우)
  if (element.baseHp !== undefined && element.baseAtk !== undefined) {
    baseHp = element.baseHp;
    baseAtk = element.baseAtk;
  }
  // 2순위: card_stats.json의 specialElements 사용
  else if (element?.symbol && statsData.specialElements && statsData.specialElements[element.symbol]) {
    const specialElement = statsData.specialElements[element.symbol];
    baseHp = specialElement.baseHp;
    baseAtk = specialElement.baseAtk;
  }
  // 3순위: 기본 공식 사용
  else {
    const baseStats = statsData.baseStats || { baseHp: 12, baseAtk: 6, hpGrowthRate: 0.8, atkGrowthRate: 0.7 };
    baseHp = baseStats.baseHp + Math.floor(Math.pow(number, baseStats.hpGrowthRate));
    baseAtk = baseStats.baseAtk + Math.floor(Math.pow(number, baseStats.atkGrowthRate));
  }

  // 카테고리 보너스 적용
  const category = element?.category;
  let categoryHpMultiplier = 1.0;
  let categoryAtkMultiplier = 1.0;
  
  if (category && statsData.categoryBonuses && statsData.categoryBonuses[category]) {
    const categoryBonus = statsData.categoryBonuses[category];
    categoryHpMultiplier = categoryBonus.hpMultiplier || 1.0;
    categoryAtkMultiplier = categoryBonus.atkMultiplier || 1.0;
  }

  let hp = Math.floor(baseHp * stageMultiplier * rarityMul * categoryHpMultiplier);
  let atk = Math.floor(baseAtk * stageMultiplier * rarityMul * categoryAtkMultiplier);

  // 결정론적(난수 없는) ±10% 변동: 원소번호+희귀도로부터 고정 배율 생성
  const rarityKey = (rarity || element?.rarity || 'common');
  let rarityHash = 0;
  for (let i = 0; i < rarityKey.length; i++) {
    rarityHash = ((rarityHash << 5) - rarityHash) + rarityKey.charCodeAt(i);
    rarityHash |= 0;
  }
  const seed = (number * 131 + (rarityHash >>> 0)) >>> 0;
  const t = (seed % 1000) / 1000; // 0.000 ~ 0.999
  const varianceRange = statsData.varianceRange || { min: 0.9, max: 1.1 };
  const variance = varianceRange.min + t * (varianceRange.max - varianceRange.min);

  hp = Math.max(1, Math.floor(hp * variance));
  atk = Math.max(1, Math.floor(atk * variance));

  return { hp, atk };
}

// JSON 데이터가 없을 때 사용하는 폴백 함수
function computeElementStatsFallback(element, rarity) {
  const number = element?.number || 1;
  const stage = getElementStage(number);
  const stageMultiplier = Math.pow(1.3, stage);

  // 희귀도 배수 조정 (더 균형잡힌 수치)
  const rarityMultipliers = { common: 1.0, uncommon: 1.3, rare: 1.8, epic: 2.5, legendary: 3.5 };
  const rarityMul = rarityMultipliers[rarity || element?.rarity || 'common'] || 1.0;

  // 기본치: 낮은 수치에서 시작해 단계 배수로 성장; 원자번호에 따른 미세 증가 포함
  const baseHp = 12 + Math.floor(Math.pow(number, 0.8));
  const baseAtk = 6 + Math.floor(Math.pow(number, 0.7));

  let hp = Math.floor(baseHp * stageMultiplier * rarityMul);
  let atk = Math.floor(baseAtk * stageMultiplier * rarityMul);

  // 결정론적(난수 없는) ±10% 변동: 원소번호+희귀도로부터 고정 배율 생성
  const rarityKey = (rarity || element?.rarity || 'common');
  let rarityHash = 0;
  for (let i = 0; i < rarityKey.length; i++) {
    rarityHash = ((rarityHash << 5) - rarityHash) + rarityKey.charCodeAt(i);
    rarityHash |= 0;
  }
  const seed = (number * 131 + (rarityHash >>> 0)) >>> 0;
  const t = (seed % 1000) / 1000; // 0.000 ~ 0.999
  const variance = 0.9 + t * 0.2; // 0.9 ~ 1.1

  hp = Math.max(1, Math.floor(hp * variance));
  atk = Math.max(1, Math.floor(atk * variance));

  return { hp, atk };
}

async function initGame() {
  console.log("Initializing game state...");

  // 모든 게임 데이터 로드
  await loadAllGameData();

  // 애니메이션 컨테이너들 정리
  if (typeof window.cleanupAnimationContainers === 'function') {
    window.cleanupAnimationContainers();
  }

  // --- Modify properties instead of reassigning gameState ---
  // Clear arrays
  gameState.playerHand.length = 0;
  gameState.computerHand.length = 0;

  // Reset values
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.isGameActive = true;
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
  gameState.playerCoins = 20;
  gameState.computerCoins = 20;
  gameState.drawCount = 0;
  gameState.energy = 100; // 초기 에너지 제공

  // 온라인 모드가 아닌 경우에만 오프라인 모드로 설정
  if (!onlineGameState.isOnline) {
    console.log('initGame: 오프라인 모드로 설정');
    // 오프라인 모드로 설정
    setOnlineMode(false, '', '');
  } else {
    console.log('initGame: 온라인 모드 유지');
  }

  // 핵융합 시스템 초기화
  if (window.fusionSystem) {
    // fusionSystem을 gameState에 연결
    gameState.fusionSystem = window.fusionSystem;
    
    // equipment 초기화 및 NaN 복구
    if (gameState.fusionSystem.initializeEquipment) {
      gameState.fusionSystem.initializeEquipment();
    }
    // 에너지 동기화
    gameState.fusionSystem.energy = gameState.energy;
    
    console.log("핵융합 시스템이 초기화되었습니다.");
  } else {
    console.warn("핵융합 시스템이 로드되지 않았습니다.");
    // fusionSystem이 없으면 기본 객체 생성
    gameState.fusionSystem = {
      energy: gameState.energy,
      heat: 0,
      maxHeat: 100,
      autoCompress: true,
      compressThreshold: 6,
      researchLevel: 0,
      rareIsotopeProbability: 0.01,
      equipment: {
        coil: 0, laser: 0, analyzer: 0, simulator: 0, reactor: 0,
        quantum: 0, gravity: 0, isotope: 0, drawCap: 0
      },
      milestones: {
        oxygen: false, iron: false, krypton: false, xenon: false, uranium: false
      },
      fusionQueue: [],
      materials: {
        H: 0, He: 0, Li: 0, Be: 0, B: 0, C: 0, N: 0, O: 0,
        F: 0, Ne: 0, Na: 0, Mg: 0, Al: 0, Si: 0, P: 0, S: 0,
        Cl: 0, Ar: 0, K: 0, Ca: 0, Sc: 0, Ti: 0, V: 0, Cr: 0,
        Mn: 0, Fe: 0
      }
    };
    console.log("기본 핵융합 시스템 객체가 생성되었습니다.");
  }

  battlefield.bases.player.hp = Math.pow(10, 20);
  battlefield.bases.computer.hp = Math.pow(10, 20);
  console.log("initGame: Resetting battlefield...");
  resetBattlefield();

  console.log("initGame: Updating score display...");
  updateScoreDisplay();
  console.log("initGame: Score display updated.");

  console.log("initGame: Updating turn indicator...");
  updateTurnIndicator();
  console.log("initGame: Turn indicator updated.");

  console.log("initGame: Finished.");
  // Initialize computer coins display if needed (optional)
}

// 새로운 핵융합 가챠 시스템으로 랜덤 카드 생성 (턴 진행에 따라 더 좋은 카드)
function createRandomCardByRarity() {
  // 현재까지 발견된 최상위 원소 번호의 절반까지만 등장
  const maxDiscovered = getMaxDiscoveredElementNumber();
  
  // 턴 진행에 따른 카드 품질 스케일링
  const turnCount = gameState.turnCount || 1;
  const turnScalingFactor = Math.min(1.5, 1 + (turnCount - 1) * 0.1); // 턴마다 10%씩 증가, 최대 1.5배
  
  // 기본 cap 계산 (최소 1로 설정하여 H는 항상 나올 수 있도록 함)
  let baseCap = Math.max(1, Math.floor(maxDiscovered / 1.5));
  
  // 턴 진행에 따라 cap 증가 (더 높은 번호의 원소도 등장 가능)
  const turnBoost = Math.floor((turnCount - 1) * 0.5); // 턴마다 0.5씩 증가
  const cap = Math.min(maxDiscovered, baseCap + turnBoost);
  
  const lightElements = gameState.elementsData.filter(e => e.number <= cap);
  
  if (lightElements.length === 0) {
    console.warn("Z≤26 원소가 없습니다. 기본 카드 생성.");
    return createCardWithRarity('common');
  }

  // 분자 합성 시스템이 있으면 분자 가챠 실행 (확률적으로)
  if (gameState.fusionSystem && Math.random() < 0.3) { // 30% 확률로 분자 생성
    const gachaResults = gameState.fusionSystem.performMoleculeGacha(1);
    const moleculeId = Object.keys(gachaResults)[0];
    
    if (moleculeId) {
      // 분자 데이터에서 분자 정보 찾기
      const moleculeData = gameState.moleculesData.find(m => m.id === moleculeId);
      if (moleculeData) {
        const newCard = createCardFromMolecule(moleculeData);
        return newCard;
      }
    }
  }

  // 희귀도 기반 가중치 선택 (턴 진행에 따라 더 좋은 등급 확률 증가)
  const baseRarityChances = getRarityChances();
  const rarityChances = adjustRarityChancesForTurn(baseRarityChances, turnCount);
  const totalChance = Object.values(rarityChances).reduce((sum, chance) => sum + chance, 0);
  let randomChance = Math.random() * totalChance;
  
  let selectedRarity = 'common';
  for (const [rarity, chance] of Object.entries(rarityChances)) {
    randomChance -= chance;
    if (randomChance <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  // 선택된 희귀도의 원소들 중에서 선택
  const elementsOfRarity = lightElements.filter(e => (e.rarity || 'common') === selectedRarity);
  const elementsToChoose = elementsOfRarity.length > 0 ? elementsOfRarity : lightElements;
  
  const randomIndex = Math.floor(Math.random() * elementsToChoose.length);
  const element = elementsToChoose[randomIndex];
  
  // 원소 능력치 스케일 규칙 적용
  const { hp: scaledHp, atk: scaledAtk } = computeElementStats(element, selectedRarity);
  const newCard = new ElementCard(element, scaledHp, scaledAtk);
  newCard.rarity = selectedRarity;
  
  return newCard;
}

// 등급에 따른 카드 생성 (Stat Rebalancing)
function createCardWithRarity(rarity) {
  console.log(`[createCardWithRarity] Attempting to create card with rarity: ${rarity}`);
  const eligibleElements = gameState.elementsData.filter(element => {
    const elementRarity = element.rarity || 'common'; // Default to common if rarity is missing
    return elementRarity === rarity;
  });

  console.log(`[createCardWithRarity] Found ${eligibleElements.length} elements matching rarity ${rarity}.`);

  // If no elements match the target rarity, fall back based on rarity level
  let elementsToUse = eligibleElements;
  if (elementsToUse.length === 0) {
      console.warn(`[createCardWithRarity] No elements found for rarity ${rarity}. Falling back...`);
      if (rarity === 'legendary' || rarity === 'epic') {
          // Fallback to rare/uncommon if legendary/epic not found
          elementsToUse = gameState.elementsData.filter(e => ['rare', 'uncommon'].includes(e.rarity || 'common'));
      } else if (rarity === 'rare') {
           // Fallback to uncommon/common if rare not found
          elementsToUse = gameState.elementsData.filter(e => ['uncommon', 'common'].includes(e.rarity || 'common'));
      } else {
          // Default fallback to all elements if even common/uncommon filtering fails
          elementsToUse = gameState.elementsData;
      }
       console.log(`[createCardWithRarity] Using fallback elements. Count: ${elementsToUse.length}`);
       if (elementsToUse.length === 0) { // Final check if even fallback failed
            console.error("[createCardWithRarity] No elements available at all!");
            return null; // Cannot create a card
       }
  }


  const randomIndex = Math.floor(Math.random() * elementsToUse.length);
  const element = elementsToUse[randomIndex];

  // Ensure element data is valid before proceeding
  if (!element) {
      console.error("[createCardWithRarity] Selected element is undefined or null after filtering/fallback.");
      return null;
  }
   console.log(`[createCardWithRarity] Selected element: ${element.name} (Number: ${element.number})`);


  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.8,
    epic: 2.5,
    legendary: 3.5
  };

  // Use the element's actual rarity for multiplier, or the target rarity if falling back?
  // Let's use the element's actual rarity for stat calculation.
  const elementActualRarity = element.rarity || 'common';
  const { hp: finalHp, atk: finalAtk } = computeElementStats(element, elementActualRarity);
  const newCard = new ElementCard(element, finalHp, finalAtk);
  // Assign the element's actual rarity to the card instance
  newCard.rarity = elementActualRarity;
  console.log(`[createCardWithRarity] Created card: ${newCard.name}, Rarity: ${newCard.rarity}, HP: ${newCard.hp}, ATK: ${newCard.atk}`);
  return newCard;
}

// 기존 카드들의 능력치를 새로운 스케일링 공식에 맞게 업데이트
function updateExistingCardStats() {
  // 플레이어 핸드의 카드들 업데이트
  gameState.playerHand.forEach(card => {
    if (card.element && card.element.number) {
      const stats = computeElementStats(card.element, card.rarity);
      card.maxHp = stats.hp;
      card.hp = Math.min(card.hp, card.maxHp);
      card.atk = stats.atk;
    }
  });
  
  // 컴퓨터 핸드의 카드들 업데이트
  gameState.computerHand.forEach(card => {
    if (card.element && card.element.number) {
      const stats = computeElementStats(card.element, card.rarity);
      card.maxHp = stats.hp;
      card.hp = Math.min(card.hp, card.maxHp);
      card.atk = stats.atk;
    }
  });
  
  // 전장의 카드들 업데이트
  battlefield.lanes.forEach(lane => {
    ['player', 'computer'].forEach(side => {
      const card = lane[side];
      if (card && card.element && card.element.number && !card.isSkull) {
        const stats = computeElementStats(card.element, card.rarity);
        card.maxHp = stats.hp;
        card.hp = Math.min(card.hp, card.maxHp);
        card.atk = stats.atk;
      }
    });
  });
  
  console.log("기존 카드들의 능력치가 새로운 스케일링 공식에 맞게 업데이트되었습니다.");
}

// --- ADD Definition for calculateBaseDamage ---
function calculateBaseDamage(card) {
    // Basic implementation: return the card's attack value
    // Add more complex logic here if needed (e.g., buffs, debuffs)
    if (!card || typeof card.atk !== 'number') {
        console.warn("calculateBaseDamage: Invalid card or attack value.", card);
        return 0;
    }
    return card.atk;
}
// --- END ADD Definition ---

// 빈 라인 찾기 함수
function findAvailableLane(side) {
    for (let i = 0; i < battlefield.lanes.length; i++) {
        const lane = battlefield.lanes[i];
        const currentCard = lane[side];
        if (!currentCard || currentCard.isSkull) {
            return i;
        }
    }
    return -1; // 빈 라인이 없음
}

// 통일된 카드 뽑기 함수 (손패에 추가)
function drawCards(side) {
    // 온라인 모드에서 자신의 턴이 아닐 때 뽑기 방지
    if (onlineGameState.isOnline && side === 'player') {
        if (window.onlineMatching && window.onlineMatching.currentPlayerId !== window.onlineMatching.playerId) {
            showMessage('자신의 차례가 아닙니다. 상대방의 차례를 기다려주세요.', 'warning');
            return;
        }
    }
    
    // 뽑기 횟수 제한 해제됨
    
    const cost = getCurrentDrawCost();
    const cardCount = getCurrentCardCount();
    
    console.log(`Drawing ${cardCount} cards for ${side} (cost: ${cost})`);
    
    if (typeof showMultipleDrawAnimation === 'function') {
        showMultipleDrawAnimation((newCards) => {
            if (newCards && newCards.length > 0) {
                // 컴퓨터인 경우 점진적 성장률 적용
                if (side === 'computer') {
                    const growthRate = gameState.computerProgression.currentGrowthRate;
                    
                    newCards.forEach(card => {
                        // 원본 능력치 저장 (성장률 재적용을 위해)
                        if (!card.baseHp) card.baseHp = card.hp;
                        if (!card.baseAtk) card.baseAtk = card.atk;
                        
                        // 카드 능력치에 성장률 적용
                        if (card.hp && card.maxHp) {
                            card.hp = Math.floor(card.hp * growthRate);
                            card.maxHp = Math.floor(card.maxHp * growthRate);
                        }
                        if (card.atk) {
                            card.atk = Math.floor(card.atk * growthRate);
                        }
                        
                        console.log(`Computer card enhanced by ${growthRate.toFixed(2)}x growth rate: ${card.name} (HP: ${card.hp}, ATK: ${card.atk})`);
                    });
                }
                
                // 모든 카드를 손패에 추가
                newCards.forEach(card => {
                    addCardToHand(card, side);
                });
                
                // H 초과분을 에너지로 변환 (플레이어만)
                if (side === 'player' && gameState.fusionSystem) {
                    const hCount = gameState.fusionSystem.materials.H || 0;
                    if (hCount > 0) {
                        const energyGained = gameState.fusionSystem.convertHToEnergy(hCount);
                        if (energyGained > 0) {
                            showMessage(`H ${hCount}개가 에너지 ${energyGained}로 변환되었습니다!`, 'info');
                        }
                    }
                    
                    // Fe 초과분은 그대로 유지 (별 변환 제거)
                }
                
                showMessage(`${side === 'player' ? '플레이어가' : '컴퓨터가'} ${newCards.length}장의 카드를 뽑았습니다! (비용: ${cost} 코인)`, 'success');
                
                // 튜토리얼 액션 처리
                if (typeof window.onCardsDrawn === 'function') {
                  window.onCardsDrawn(side, newCards.length);
                }
                
                // 뽑기 횟수 증가
                gameState.drawCount++;
                
                // 온라인 게임에서는 카드 뽑기 동기화는 폴링으로 처리
                
                updateUI(); // Update UI after adding cards to hand
            } else {
                showMessage('카드 뽑기 중 오류 발생', 'error');
            }
        }, 'unified', cardCount);
    } else {
        console.error("showMultipleDrawAnimation function not found!");
        // Fallback without animation
        const newCards = [];
        for (let i = 0; i < cardCount; i++) {
            const card = createRandomCardByRarity();
            if (card) {
                // 컴퓨터인 경우 난이도에 따른 카드 성장률 적용
                if (side === 'computer') {
                    const diff = getDifficultyConfig();
                    const growthRate = diff.cardGrowthRate || 1.0;
                    
                    // 카드 능력치에 성장률 적용
                    if (card.hp && card.maxHp) {
                        card.hp = Math.floor(card.hp * growthRate);
                        card.maxHp = Math.floor(card.maxHp * growthRate);
                    }
                    if (card.atk) {
                        card.atk = Math.floor(card.atk * growthRate);
                    }
                    
                    console.log(`Computer card enhanced by ${growthRate}x growth rate: ${card.name} (HP: ${card.hp}, ATK: ${card.atk})`);
                }
                
                newCards.push(card);
            }
        }
        
        if (newCards.length > 0) {
            // 모든 카드를 손패에 추가
            newCards.forEach(card => {
                addCardToHand(card, side);
            });
            
            // H 초과분을 에너지로 변환 (플레이어만)
            if (side === 'player' && gameState.fusionSystem) {
                const hCount = gameState.fusionSystem.materials.H || 0;
                if (hCount > 0) {
                    const energyGained = gameState.fusionSystem.convertHToEnergy(hCount);
                    if (energyGained > 0) {
                        showMessage(`H ${hCount}개가 에너지 ${energyGained}로 변환되었습니다!`, 'info');
                    }
                }
                
                // Fe 초과분은 그대로 유지 (별 변환 제거)
            }
            
            showMessage(`${side === 'player' ? '플레이어가' : '컴퓨터가'} ${newCards.length}장의 카드를 뽑았습니다! (비용: ${cost} 코인)`, 'success');
            
            // 튜토리얼 액션 처리
            if (typeof window.onCardsDrawn === 'function') {
              window.onCardsDrawn(side, newCards.length);
            }
            
            // 온라인 게임인 경우 상대방에게 카드 뽑기 알림
            // 온라인 게임에서는 카드 뽑기 동기화는 폴링으로 처리
            
            updateUI();
        } else {
            showMessage('카드 뽑기 중 오류 발생', 'error');
        }
    }
}

// 통일된 뽑기 대기열 함수
function queueDrawCard(side) {
    console.log(`Queueing draw for ${side}`);
    // Example logic: Add to queue and process later
    if (!drawState.isDrawing) {
        processDrawQueue(); // Start processing if not already running
    }
    drawState.queue.push({ side: side });
}

// 통일된 뽑기 대기열 처리
async function processDrawQueue() {
    if (drawState.isDrawing || drawState.queue.length === 0) {
        return;
    }
    drawState.isDrawing = true;

    const drawRequest = drawState.queue.shift(); // Get the next draw request

    // 통일된 뽑기 실행
    drawCards(drawRequest.side);
    
    drawState.isDrawing = false;
    processDrawQueue(); // Process next item in queue
}

// 애니메이션 없이 카드 뽑기 함수 (컴퓨터용, 손패에 추가)
function drawCardsWithoutAnimation(side) {
    // 뽑기 횟수 제한 해제됨
    
    const cost = getCurrentDrawCost();
    const cardCount = getCurrentCardCount();
    
    console.log(`Drawing ${cardCount} cards for ${side} without animation (cost: ${cost})`);
    
    const newCards = [];
    for (let i = 0; i < cardCount; i++) {
        const card = createRandomCardByRarity();
        if (card) {
            // 컴퓨터인 경우 점진적 성장률 적용
            if (side === 'computer') {
                const growthRate = gameState.computerProgression.currentGrowthRate;
                
                // 원본 능력치 저장 (성장률 재적용을 위해)
                if (!card.baseHp) card.baseHp = card.hp;
                if (!card.baseAtk) card.baseAtk = card.atk;
                
                // 카드 능력치에 성장률 적용
                if (card.hp && card.maxHp) {
                    card.hp = Math.floor(card.hp * growthRate);
                    card.maxHp = Math.floor(card.maxHp * growthRate);
                }
                if (card.atk) {
                    card.atk = Math.floor(card.atk * growthRate);
                }
                
                console.log(`Computer card enhanced by ${growthRate.toFixed(2)}x growth rate: ${card.name} (HP: ${card.hp}, ATK: ${card.atk})`);
            }
            
            newCards.push(card);
        }
    }
    
    if (newCards.length > 0) {
        // 모든 카드를 손패에 추가
        newCards.forEach(card => {
            addCardToHand(card, side);
        });
        
        // H 초과분을 에너지로 변환 (플레이어만)
        if (side === 'player' && gameState.fusionSystem) {
            const hCount = gameState.fusionSystem.materials.H || 0;
            if (hCount > 0) {
                const energyGained = gameState.fusionSystem.convertHToEnergy(hCount);
                if (energyGained > 0) {
                    showMessage(`H ${hCount}개가 에너지 ${energyGained}로 변환되었습니다!`, 'info');
                }
            }
            
            // Fe 초과분은 그대로 유지 (별 변환 제거)
        }
        
        console.log(`${side} drew ${newCards.length} cards without animation`);
        
        // 뽑기 횟수 증가
        gameState.drawCount++;
        
        // 온라인 게임인 경우 상대방에게 카드 뽑기 알림
        // 온라인 게임에서는 카드 뽑기 동기화는 폴링으로 처리
        
        updateUI(); // Update UI after adding cards to hand
    } else {
        showMessage('카드 뽑기 중 오류 발생', 'error');
    }
}
// --- End Placeholders ---

async function endTurn() {
  console.log('endTurn 함수 호출됨', {
    isPlayerTurn: gameState.isPlayerTurn,
    isOnline: onlineGameState.isOnline,
    onlineMatching: !!window.onlineMatching
  });
  
  if (!gameState.isPlayerTurn) {
    console.log('턴 종료 실패: 플레이어 턴이 아님');
    return;
  }

  // 온라인 게임인 경우
  if (onlineGameState.isOnline) {
    console.log('온라인 게임: 턴 종료 신호 전송');
    console.log('온라인 상태 확인:', {
      onlineGameState: onlineGameState,
      windowOnlineMatching: !!window.onlineMatching,
      roomId: window.onlineMatching?.roomId,
      playerId: window.onlineMatching?.playerId
    });

    // 현재 턴인 플레이어인지 확인
    if (window.onlineMatching && window.onlineMatching.currentPlayerId) {
      const isMyTurn = window.onlineMatching.currentPlayerId === window.onlineMatching.playerId;
      if (!isMyTurn) {
        console.log('턴 종료 실패: 현재 턴이 아님', {
          currentPlayerId: window.onlineMatching.currentPlayerId,
          myPlayerId: window.onlineMatching.playerId
        });
        showMessage('현재 턴이 아닙니다. 상대방의 차례입니다.', 'warning');
        return;
      }
    }
    
    // 온라인 게임에서도 핵융합 자동화 체크 실행
    if (gameState.fusionSystem) {
      console.log('온라인 게임: 핵융합 자동화 체크 실행');
      
      // 손패를 기반으로 재료 인벤토리 동기화
      gameState.fusionSystem.syncMaterialsFromHand();
      
      // 자동 압축 체크
      if (gameState.fusionSystem.autoCompress) {
        const compressResults = gameState.fusionSystem.checkAutoCompress();
        if (compressResults && compressResults.length > 0) {
          showMessage(`자동 압축: ${compressResults.length}개 원소 압축됨`, 'info');
          // UI 업데이트
          if (window.fusionUI && typeof window.fusionUI.updateFusionDisplay === 'function') {
            window.fusionUI.updateFusionDisplay();
          }
          if (window.renderPlayerHand) {
            window.renderPlayerHand();
          }
        }
      }
      
      // 최대 융합 실행 (온라인에서도 가능하도록)
      if (gameState.fusionSystem.performMaxFusion) {
        const maxFusionResult = gameState.fusionSystem.performMaxFusion();
        if (maxFusionResult.success && maxFusionResult.successCount > 0) {
          showMessage(maxFusionResult.message, 'success');
          // UI 업데이트
          if (window.fusionUI && typeof window.fusionUI.updateFusionDisplay === 'function') {
            window.fusionUI.updateFusionDisplay();
          }
          if (window.renderPlayerHand) {
            window.renderPlayerHand();
          }
        }
      }
    }
    
    // 별 관리 시스템 턴 처리
    if (window.starManagement) {
      const supernovas = window.starManagement.processTurn();
      if (supernovas > 0) {
        console.log(`${supernovas}개의 초신성이 발생했습니다!`);
      }
    }
    
    // Express API를 통해 턴 종료 신호 전송 (서버에서 공격 처리)
    if (window.onlineMatching) {
      console.log('onlineMatching.endTurn 호출 시작');
      
      // fusionSystem 상태를 gameState에 포함
      const gameStateWithFusion = { ...gameState };
      if (gameState.fusionSystem) {
        gameStateWithFusion.fusionSystem = gameState.fusionSystem.saveState();
      }
      
      console.log('턴 종료 데이터:', {
        roomId: window.onlineMatching.roomId,
        playerId: window.onlineMatching.playerId,
        gameState: gameStateWithFusion,
        battlefield: battlefield
      });
      
      const result = await window.onlineMatching.endTurn(gameStateWithFusion, battlefield);
      
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        console.log('턴 종료 결과:', result);
        
        // 서버에서 받은 게임 상태로 업데이트
        if (result.gameState) {
          updateOnlineGameState(result.gameState);
        }
        
        // 전장 상태 업데이트
        if (result.battlefield) {
          // battlefield 객체의 속성을 업데이트
          battlefield.lanes = result.battlefield.lanes || battlefield.lanes;
          battlefield.bases = result.battlefield.bases || battlefield.bases;
          renderBattlefield();
        }
        
        // 턴이 실제로 진행되었는지 확인
        if (result.turnProcessed) {
          console.log('턴이 진행되었습니다.');
          showMessage('턴이 진행되었습니다!', 'success');
        } else {
          console.log('상대방을 기다리는 중...');
          showMessage('턴을 종료했습니다. 상대방을 기다리는 중...', 'info');
        }
        
        // 온라인 모드에서는 updateOnlineTurnUI만 호출
        updateOnlineTurnUI();
      }
    }
    return;
  }

  // 오프라인 게임 (기존 로직) - 온라인 모드가 아닌 경우에만 실행
  if (!onlineGameState.isOnline) {
    gameState.turnCount++;

    checkCardHealing('player');
    executeBaseAttacks('player');
    // 플레이어 턴 종료 시 전투 실행 (플레이어 턴 상태 유지)
    executeBattles();
    
    // 반감기 시스템 처리
    if (window.halfLifeSystem) {
      const decayedCards = window.halfLifeSystem.updateAllHalfLives();
      if (decayedCards.length > 0) {
        window.halfLifeSystem.handleDecayedCards(decayedCards);
      }
    }
    
    addCoins(5, 'player'); // Player also gets coins per turn
    
    // 턴 상태 변경을 전투 후로 이동
    gameState.isPlayerTurn = false;
    
    // 튜토리얼 액션 처리
    if (typeof window.onTurnEnded === 'function') {
      window.onTurnEnded();
    }
    
    // 온라인 모드인지 확인하여 적절한 메시지 표시
    if (onlineGameState.isOnline) {
      showMessage('상대방 차례입니다.', 'info');
    } else {
      showMessage('컴퓨터 차례입니다.', 'info');
    }

    // 핵융합 자동화 체크
    if (typeof window.fusionUI !== 'undefined' && window.fusionUI.checkAutomation) {
      window.fusionUI.checkAutomation();
    }

    // 별 관리 시스템 턴 처리
    if (window.starManagement) {
      const supernovas = window.starManagement.processTurn();
      if (supernovas > 0) {
        console.log(`${supernovas}개의 초신성이 발생했습니다!`);
      }
    }

    updateUI();

    setTimeout(computerTurn, 1500);
  }
}

async function computerTurn() {
  if (gameState.isPlayerTurn || !gameState.isGameActive) return;
  
  // 온라인 모드에서는 컴퓨터 턴을 실행하지 않음
  if (onlineGameState.isOnline) {
    console.log("온라인 모드에서는 컴퓨터 턴을 실행하지 않습니다.");
    return;
  }

  console.log("--- Computer Turn Start ---");
  showMessage('컴퓨터가 전략을 세우는 중...', 'info');

  try {
    // 컴퓨터 성장률 업데이트 (턴마다 점진적 증가)
    updateComputerGrowthRate();
    
    const diff = getDifficultyConfig();
    // 스마트 카드 뽑기 로직 - 턴 진행에 따라 더 자주 뽑도록 개선
    const turnCount = gameState.turnCount || 1;
    const drawThresholdMultiplier = Math.max(0.5, 1 - (turnCount - 1) * 0.02); // 턴마다 2%씩 감소, 최소 0.5배
    const adjustedDrawThreshold = Math.ceil(diff.drawThreshold * drawThresholdMultiplier);
    
    if (gameState.computerHand.length < adjustedDrawThreshold) {
      const cost = getCurrentDrawCost();
      
      if (gameState.computerCoins >= cost) {
        if (spendCoins(cost, 'computer')) {
          drawCardsWithoutAnimation('computer');
          showMessage(`컴퓨터가 카드를 뽑았습니다. (비용: ${cost} 코인)`, 'info');
          console.log(`Computer drew cards for ${cost} coins.`);
        }
      }
    }
    
    // 추가 뽑기 로직 - 코인이 충분하면 더 뽑기
    if (gameState.computerHand.length < 6 && gameState.computerCoins >= getCurrentDrawCost() * 2) {
      const cost = getCurrentDrawCost();
      if (spendCoins(cost, 'computer')) {
        drawCardsWithoutAnimation('computer');
        showMessage(`컴퓨터가 추가로 카드를 뽑았습니다. (비용: ${cost} 코인)`, 'info');
        console.log(`Computer drew additional cards for ${cost} coins.`);
      }
    }

    // 컴퓨터 별 관리 시스템 처리
    if (window.starManagement) {
      const computerStarManagement = window.computerStarManagement || new StarManagement();
      window.computerStarManagement = computerStarManagement;
      gameState.computerStarManagement = computerStarManagement;
      
      // 컴퓨터 별 관리 시스템 턴 처리
      const supernovas = computerStarManagement.processTurn();
      if (supernovas > 0) {
        console.log(`컴퓨터: ${supernovas}개의 초신성이 발생했습니다!`);
      }
      
      // 컴퓨터 별 성장 로직 (원소 사용 시)
      if (computerStarManagement.starSystemActive) {
        // 컴퓨터가 사용한 원소들로 별 성장
        const usedElements = getComputerUsedElements();
        usedElements.forEach(({ symbol, amount }) => {
          computerStarManagement.growStarWithElements(symbol, amount);
        });
        
        // 컴퓨터 초신성 뽑기 사용 로직
        performComputerSupernovaGacha(computerStarManagement);
      }
    }

    // 컴퓨터 별 사용 로직
    if (window.starCurrency && window.starCurrency.getStarCount('computer') > 0) {
      const computerStars = window.starCurrency.getStarCount('computer');
      
      // 30% 확률로 별을 융합하거나 변환
      if (Math.random() < 0.3) {
        const grades = ['small', 'medium', 'large', 'giant']; // 꽝(dud) 제외
        const availableGrades = grades.filter(grade => {
          const starInfo = window.starCurrency.starGrades[grade];
          return computerStars >= starInfo.cost && !starInfo.isDud;
        });
        
        if (availableGrades.length > 0) {
          const randomGrade = availableGrades[Math.floor(Math.random() * availableGrades.length)];
          
          // 50% 확률로 융합, 50% 확률로 변환
          if (Math.random() < 0.5) {
            // 별 융합
            if (window.starCurrency.fuseStars(randomGrade, 'computer')) {
              showMessage(`컴퓨터가 ${window.starCurrency.starGrades[randomGrade].name}을 생성했습니다!`, 'info');
            }
          } else {
            // 별을 원소로 변환
            if (window.starCurrency.convertStarToElement(randomGrade, 'computer')) {
              showMessage(`컴퓨터가 ${window.starCurrency.starGrades[randomGrade].name}을 원소로 변환했습니다!`, 'info');
            }
          }
        }
      }
    }

    // 스마트 카드 배치 로직
    if (gameState.computerHand.length > 0) {
      const bestMove = findBestComputerMove();
      
      if (bestMove) {
        const { card, laneIndex, reason } = bestMove;
        
        // 쉬움 난이도에서는 가끔 실수로 배치하지 않음
        if (Math.random() < getDifficultyConfig().mistakeChance * 0.2) {
          console.log('Easy mistake: 컴퓨터가 배치를 건너뜀');
        } else if (placeCardOnBattlefield(card, laneIndex, 'computer')) {
          removeCardFromHand(card.id, 'computer');
          showMessage(`컴퓨터가 ${card.name}을 라인 ${laneIndex + 1}에 배치했습니다. (${reason})`, 'info');
          console.log(`Computer placed ${card.name} in lane ${laneIndex}. Reason: ${reason}`);
        }
      }
    }

    // 턴 종료 후 처리
    console.log("Computer: Checking card healing...");
    checkCardHealing('computer');
    console.log("Computer: Executing base attacks...");
    executeBaseAttacks('computer');
    console.log("Computer: Executing battles...");
    executeBattles();
    console.log("Computer: Adding coins...");
    addCoins(5, 'computer');
    
    // 컴퓨터 턴 종료 후 플레이어 턴으로 전환
    gameState.isPlayerTurn = true;
    showMessage('플레이어 차례입니다.', 'info');


    // 자동화 체크 (컴퓨터 턴에서도)
    if (typeof window.checkAutomationImmediate === 'function') {
      window.checkAutomationImmediate();
    }

    // 난이도별 생각 시간
    await new Promise(r => setTimeout(r, getDifficultyConfig().thinkDelayMs));
  } catch (error) {
    console.error("Error during computer turn:", error);
  } finally {
    // 게임이 활성화되어 있지 않아도 턴을 제대로 종료해야 함
    console.log("--- Computer Turn End ---");
    updateUI();
  }
}

// 컴퓨터가 사용한 원소들 추적
function getComputerUsedElements() {
  const usedElements = [];
  
  // 컴퓨터가 배치한 카드들에서 원소 추출
  gameState.computerHand.forEach(card => {
    if (card && card.element && !card.isSynthesis) {
      usedElements.push({
        symbol: card.element.symbol,
        amount: 1
      });
    }
  });
  
  // 컴퓨터가 핵융합에 사용한 원소들 (추정)
  if (gameState.fusionSystem && gameState.fusionSystem.materials) {
    Object.entries(gameState.fusionSystem.materials).forEach(([symbol, count]) => {
      if (count > 0) {
        usedElements.push({
          symbol: symbol,
          amount: Math.floor(count * 0.1) // 10% 정도 사용한다고 가정
        });
      }
    });
  }
  
  return usedElements;
}

// 컴퓨터 초신성 뽑기 실행
function performComputerSupernovaGacha(computerStarManagement) {
  if (!computerStarManagement.starSystemActive || computerStarManagement.stars < 1) {
    return;
  }
  
  // 사용 가능한 초신성 뽑기들 필터링
  const availableGachas = computerStarManagement.supernovaGachas.filter(gacha => 
    computerStarManagement.unlockedSupernovaGachas.includes(gacha.id) &&
    computerStarManagement.stars >= gacha.cost
  );
  
  if (availableGachas.length === 0) {
    return;
  }
  
  // 20% 확률로 초신성 뽑기 사용
  if (Math.random() < 0.2) {
    const randomGacha = availableGachas[Math.floor(Math.random() * availableGachas.length)];
    
    if (computerStarManagement.performSupernovaGacha(randomGacha.id)) {
      showMessage(`컴퓨터가 ${randomGacha.name} 뽑기를 사용했습니다!`, 'info');
      console.log(`Computer used ${randomGacha.name} gacha`);
    }
  }
}

// 스마트한 컴퓨터 전략 함수
function findBestComputerMove() {
  const availableCards = gameState.computerHand.filter(card => card && !card.isSkull);
  if (availableCards.length === 0) return null;

  const moves = [];
  const diff = getDifficultyConfig();
  
  // 각 카드와 각 라인에 대한 점수 계산
  availableCards.forEach((card, cardIndex) => {
    for (let laneIndex = 0; laneIndex < battlefield.lanes.length; laneIndex++) {
      const lane = battlefield.lanes[laneIndex];
      const computerSlot = lane.computer;
      const playerSlot = lane.player;
      
      // 빈 슬롯이거나 해골인 경우만 배치 가능
      if (computerSlot === null || (computerSlot && computerSlot.isSkull)) {
        const score = calculateMoveScore(card, laneIndex, computerSlot, playerSlot);
        moves.push({
          card: card,
          cardIndex: cardIndex,
          laneIndex: laneIndex,
          score: score.score,
          reason: score.reason
        });
      }
    }
  });

  // 점수가 높은 순으로 정렬
  moves.sort((a, b) => b.score - a.score);

  if (moves.length === 0) return null;

  // 난이도에 따른 실수/랜덤성 주입
  if (Math.random() < diff.mistakeChance * 1.5) {
    const k = Math.min(diff.chooseTopK + 1, moves.length); // 더 많은 선택지에서 랜덤 선택
    const choice = moves[Math.floor(Math.random() * k)];
    return choice;
  }

  // 항상 최고 선택이 아닌 상위 2-3개 중에서 선택
  const topChoices = Math.min(3, moves.length);
  const randomChoice = Math.floor(Math.random() * topChoices);
  return moves[randomChoice];
}

// 카드 배치 점수 계산 함수
function calculateMoveScore(card, laneIndex, computerSlot, playerSlot) {
  let score = 0;
  let reason = '';
  const diff = getDifficultyConfig();

  // 1. 공격 우선순위 (플레이어 카드가 있는 라인) - 턴 진행에 따라 더 공격적
  if (playerSlot && !playerSlot.isSkull) {
    const attackPower = card.atk || 0;
    const playerHp = playerSlot.hp || 0;
    
    // 턴 진행에 따른 공격성 증가
    const turnCount = gameState.turnCount || 1;
    const aggressionMultiplier = Math.min(2.0, 1 + (turnCount - 1) * 0.05); // 턴마다 5%씩 증가, 최대 2배
    const enhancedAggressionBonus = diff.aggressionBonus * aggressionMultiplier;
    
    // 플레이어 카드를 한 번에 처치할 수 있는지
    if (attackPower >= playerHp) {
      score += Math.floor(1000 * enhancedAggressionBonus);
      reason = '플레이어 카드 처치 가능';
    } else {
      // 플레이어 카드에게 피해를 줄 수 있는지
      score += Math.floor(attackPower * 10 * enhancedAggressionBonus);
      reason = '플레이어 카드 공격';
    }
  }
  
  // 2. 기지 직접 공격 가능성 - 턴 진행에 따라 더 공격적
  else if (!playerSlot || playerSlot.isSkull) {
    const attackPower = card.atk || 0;
    const playerBaseHp = battlefield.bases.player.hp || 0;
    
    // 턴 진행에 따른 공격성 증가
    const turnCount = gameState.turnCount || 1;
    const aggressionMultiplier = Math.min(2.0, 1 + (turnCount - 1) * 0.05); // 턴마다 5%씩 증가, 최대 2배
    const enhancedAggressionBonus = diff.aggressionBonus * aggressionMultiplier;
    
    // 기지 체력이 낮으면 더 높은 점수
    score += Math.floor((attackPower * 5 + (1000 - playerBaseHp) / 10) * enhancedAggressionBonus);
    reason = '기지 직접 공격';
  }

  // 3. 카드 희귀도 고려 (턴 진행에 따라 더 높은 가중치)
  const turnCount = gameState.turnCount || 1;
  const rarityMultiplier = Math.min(2.0, 1 + (turnCount - 1) * 0.1); // 턴마다 10%씩 증가, 최대 2배
  
  const rarityBonus = {
    'common': 0,
    'uncommon': 10,
    'rare': 25,
    'epic': 50,
    'legendary': 100
  };
  score += Math.floor((rarityBonus[card.rarity] || 0) * rarityMultiplier);

  // 4. 카드 체력 고려 (생존력)
  const hp = card.hp || 0;
  score += hp * 2;

  // 5. 특수 능력 고려
  if (card.specialAbilities && card.specialAbilities.length > 0) {
    score += 30;
    reason += ' (특수 능력 보유)';
  }

  // 6. 상성 고려
  if (playerSlot && !playerSlot.isSkull && card.affinities) {
    const affinityMultiplier = calculateAffinityDamage(card, playerSlot);
    if (affinityMultiplier > 1) {
      score += 50;
      reason += ' (상성 유리)';
    } else if (affinityMultiplier < 1) {
      score -= 20;
      reason += ' (상성 불리)';
    }
  }

  // 7. 분자 합성 가능성 고려
  if (computerSlot && !computerSlot.isSkull) {
    // 분자 합성 가능성 체크 (간단한 버전)
    const canSynthesize = checkSynthesisPossibility(card, computerSlot);
    if (canSynthesize) {
      score += 100;
      reason += ' (분자 합성 가능)';
    }
  }

  // 8. 라인별 전략적 가치
  const laneValue = calculateLaneValue(laneIndex);
  score += laneValue;

  return { score: Math.max(0, score), reason: reason || '기본 배치' };
}

// 라인별 전략적 가치 계산
function calculateLaneValue(laneIndex) {
  let value = 0;
  
  // 중앙 라인(2)이 가장 가치 있음
  if (laneIndex === 2) {
    value += 20;
  }
  // 중앙 근처 라인들
  else if (laneIndex === 1 || laneIndex === 3) {
    value += 10;
  }
  // 가장자리 라인들
  else {
    value += 5;
  }
  
  return value;
}

// 분자 합성 가능성 체크 (간단한 버전)
function checkSynthesisPossibility(card, existingCard) {
  if (!card.element || !existingCard.element) return false;
  
  // 간단한 분자 합성 체크 (H + O = H2O 등)
  const cardSymbol = card.element.symbol;
  const existingSymbol = existingCard.element.symbol;
  
  // 물 분자 합성 체크
  if ((cardSymbol === 'H' && existingSymbol === 'O') || 
      (cardSymbol === 'O' && existingSymbol === 'H')) {
    return true;
  }
  
  // 기타 간단한 분자들
  const synthesisPairs = [
    ['H', 'Cl'], // HCl
    ['Na', 'Cl'], // NaCl
    ['C', 'O'], // CO
    ['N', 'H'] // NH3
  ];
  
  for (const pair of synthesisPairs) {
    if ((cardSymbol === pair[0] && existingSymbol === pair[1]) ||
        (cardSymbol === pair[1] && existingSymbol === pair[0])) {
      return true;
    }
  }
  
  return false;
}

// 기지 치유 기능 제거됨 - 에너지 구매로 대체

function executeBaseAttacks(attackingSide) {
  console.log("Executing base attacks...");
  const attackerSide = attackingSide; // 현재 턴의 공격측만 공격
  const defenderSide = attackerSide === 'player' ? 'computer' : 'player';
  battlefield.lanes.forEach((lane, index) => {
    const attackerCard = lane[attackerSide];
    const defenderCard = lane[defenderSide];

    if (attackerCard && !defenderCard) {
      const damage = calculateBaseDamage(attackerCard);
      if (damage > 0) {
        console.log(`Lane ${index}: ${attackerSide}'s ${attackerCard.name} attacks ${defenderSide} base for ${damage} damage.`);
        damageBase(defenderSide, damage);
        if (typeof playAttackAnimation === 'function') {
          playAttackAnimation(attackerCard, null, index, attackerSide);
        } else {
          console.warn("playAttackAnimation function not found!");
        }
      }
    }
  });
  updateBaseDisplay();
  console.log("Base attacks execution finished.");
}

// --- Game End Logic ---
function endGame(winner) {
  if (!gameState.isGameActive) return; // Prevent multiple calls

  gameState.isGameActive = false;
  console.log(`Game Over! Winner: ${winner}`);

  // 애니메이션 컨테이너들 정리
  if (typeof window.cleanupAnimationContainers === 'function') {
    window.cleanupAnimationContainers();
  }

  // Show game result modal (assuming showGameResultModal exists in ui.js)
  if (typeof showGameResultModal === 'function') {
    showGameResultModal(winner);
  } else {
    // Fallback alert
    alert(`게임 종료! ${winner === 'player' ? '플레이어' : '컴퓨터'} 승리!`);
  }

  // Disable buttons, etc.
  const endTurnBtn = document.getElementById('end-turn-btn');
  if (endTurnBtn) endTurnBtn.disabled = true;
  const healBtn = document.getElementById('heal-base-btn');
  if (healBtn) healBtn.disabled = true;
  // Consider disabling draw buttons etc.
  document.querySelectorAll('.draw-btn').forEach(btn => btn.disabled = true); // Example
}
// --- End Game End Logic ---

// --- Base Damage Logic ---
function damageBase(side, amount) {
  if (!gameState.isGameActive) return; // Don't deal damage if game is over

  const base = battlefield.bases[side];
  if (base) {
    base.hp = Math.max(0, base.hp - amount);
    console.log(`${side} base took ${amount} damage, HP remaining: ${base.hp}`);
    updateBaseDisplay(side); // Update specific base display

    // Add visual effect for damage
    const baseElement = document.getElementById(`${side}-base`);
    if (baseElement) {
      baseElement.classList.add('base-damage');
      // Remove the class after the animation completes
      setTimeout(() => {
        baseElement.classList.remove('base-damage');
      }, 500); // Match animation duration
    }

    // Check for game over - Calls the endGame function defined above
    if (base.hp <= 0) {
      endGame(side === 'player' ? 'computer' : 'player'); // The opponent wins
    }
  }
}
// --- End Base Damage Logic ---

function executeBattles() {
  let battleResults = [];
  console.log("[executeBattles] Starting battles..."); // Add log

  battlefield.lanes.forEach((lane, laneIndex) => {
    const playerCard = lane.player;
    const computerCard = lane.computer;

    if (playerCard && computerCard && !playerCard.isSkull && !computerCard.isSkull) {
      console.log(`[executeBattles] Lane ${laneIndex}: Player (${playerCard.name}) vs Computer (${computerCard.name})`);

      // 턴에 따라 한 쪽만 공격하도록 수정
      let attackResult = null;
      if (gameState.isPlayerTurn) {
        // 플레이어 턴: 플레이어 카드가 컴퓨터 카드를 공격
        // 카드 간 공격 애니메이션 실행
        if (window.playCardAttackAnimation) {
          window.playCardAttackAnimation(playerCard, computerCard, laneIndex, 'player');
        }
        
        attackResult = window.executeAttack(playerCard, computerCard);
        battleResults.push({
          lane: laneIndex,
          playerAttack: attackResult,
          computerAttack: null
        });
      } else {
        // 컴퓨터 턴: 컴퓨터 카드가 플레이어 카드를 공격
        // 카드 간 공격 애니메이션 실행
        if (window.playCardAttackAnimation) {
          window.playCardAttackAnimation(computerCard, playerCard, laneIndex, 'computer');
        }
        
        attackResult = window.executeAttack(computerCard, playerCard);
        battleResults.push({
          lane: laneIndex,
          playerAttack: null,
          computerAttack: attackResult
        });
      }

      // Check results and handle card destruction / skull placement
      if (computerCard.hp <= 0) {
        console.log(`[executeBattles] Lane ${laneIndex}: Computer card ${computerCard.name} destroyed.`);
        
        // 카드 소멸 애니메이션 실행
        const computerCardElement = document.querySelector(`[data-card-id="${computerCard.id}"]`);
        if (computerCardElement && window.playCardDestroyAnimation) {
          window.playCardDestroyAnimation(computerCardElement);
        }
        
        const coinReward = (computerCard.element?.rewardCoins || computerCard.rarityMultipliers || 1) * 2; // Example reward
        addCoins(coinReward, 'player');
        gameState.playerScore += 1;

        // 카드 소멸 후 해골 카드로 교체 (애니메이션 완료 후)
        setTimeout(() => {
          // Ensure createSkullCard is accessible
          if (typeof createSkullCard === 'function') {
              const skullCard = createSkullCard('computer', computerCard.element || { name: computerCard.name }); // Pass element or basic info
              battlefield.lanes[laneIndex].computer = skullCard;
          } else {
               console.error("createSkullCard function not found!");
               battlefield.lanes[laneIndex].computer = null; // Fallback: just remove
          }

          // Ensure showCardDestroyEffect is accessible
          if (typeof showCardDestroyEffect === 'function') {
              showCardDestroyEffect(laneIndex, 'computer');
          } else {
               console.warn("showCardDestroyEffect function not found!");
          }
          
          // 전장 다시 렌더링
          renderBattlefield();
        }, 500); // 소멸 애니메이션 완료 후
      }

      if (playerCard.hp <= 0) {
         console.log(`[executeBattles] Lane ${laneIndex}: Player card ${playerCard.name} destroyed.`);
         
         // 카드 소멸 애니메이션 실행
         const playerCardElement = document.querySelector(`[data-card-id="${playerCard.id}"]`);
         if (playerCardElement && window.playCardDestroyAnimation) {
           window.playCardDestroyAnimation(playerCardElement);
         }
         
        gameState.computerScore += 1;

        // 카드 소멸 후 해골 카드로 교체 (애니메이션 완료 후)
        setTimeout(() => {
          if (typeof createSkullCard === 'function') {
              const skullCard = createSkullCard('player', playerCard.element || { name: playerCard.name });
              battlefield.lanes[laneIndex].player = skullCard;
          } else {
               console.error("createSkullCard function not found!");
               battlefield.lanes[laneIndex].player = null;
          }

          if (typeof showCardDestroyEffect === 'function') {
              showCardDestroyEffect(laneIndex, 'player');
          } else {
               console.warn("showCardDestroyEffect function not found!");
          }
          
          // 전장 다시 렌더링
          renderBattlefield();
        }, 500); // 소멸 애니메이션 완료 후
      }

      // Update last damage turn (useful for regeneration effects later)
      if (attackResult && attackResult.damageDealt > 0) {
        if (gameState.isPlayerTurn && computerCard.hp > 0) {
          computerCard.lastDamageTurn = gameState.turnCount;
        } else if (!gameState.isPlayerTurn && playerCard.hp > 0) {
          playerCard.lastDamageTurn = gameState.turnCount;
        }
      }

      // Check for reactions after battle
      if (typeof checkChemicalReactions === 'function') {
          checkChemicalReactions(laneIndex);
      } else {
          console.warn("checkChemicalReactions function not found!");
      }


    }
    // Base attacks are handled in executeBaseAttacks, no need to repeat here
    // else if (playerCard && !computerCard && !playerCard.isSkull) { ... }
    // else if (computerCard && !playerCard && !computerCard.isSkull) { ... }
  });

  console.log("[executeBattles] Battles finished. Updating score and rendering.");
  updateScoreDisplay();
  renderBattlefield(); // Render changes after all battles in the loop are processed

  // 전투 후 턴 시작/지속형 특수능력 적용 보정
  triggerOngoingAndTurnStartAbilities();
  
  // 상태 이상 효과 처리
  processStatusEffects();
}

// 상태 이상 효과 처리
function processStatusEffects() {
  if (!window.statusEffectSystem) return;
  
  // 모든 전장의 카드에 대해 상태 이상 처리
  battlefield.lanes.forEach((lane, laneIndex) => {
    ['player', 'computer'].forEach(side => {
      const card = lane[side];
      if (card && !card.isSkull) {
        // 카드의 상태 이상 효과 처리
        card.processTurnEffects();
        
        // 상태 이상 UI 업데이트
        updateCardStatusEffects(card);
      }
    });
  });
}

// 카드 상태 이상 UI 업데이트
function updateCardStatusEffects(card) {
  const cardElement = document.getElementById(card.id);
  if (!cardElement) return;
  
  // 기존 상태 이상 아이콘 제거
  const existingIcons = cardElement.querySelectorAll('.status-effect-icon');
  existingIcons.forEach(icon => icon.remove());
  
  // 현재 상태 이상 아이콘 표시
  if (card.statusEffects && card.statusEffects.length > 0) {
    card.statusEffects.forEach((statusEffect, index) => {
      const effectInfo = window.statusEffectSystem.getEffectInfo(statusEffect.name);
      if (effectInfo) {
        const statusIcon = document.createElement('div');
        statusIcon.className = 'status-effect-icon';
        statusIcon.textContent = effectInfo.icon;
        statusIcon.title = `${effectInfo.name} (${statusEffect.duration}턴 남음)`;
        statusIcon.style.cssText = `
          position: absolute;
          top: ${5 + index * 20}px;
          right: 5px;
          font-size: 14px;
          z-index: 10;
          color: ${effectInfo.color};
          filter: drop-shadow(0 0 3px rgba(0,0,0,0.8));
        `;
        cardElement.appendChild(statusIcon);
      }
    });
  }
}

// 분자의 특수능력 보정: 턴 시작형과 지속형을 전장에 일괄 적용
function triggerOngoingAndTurnStartAbilities() {
  const applyForSide = (side) => {
    battlefield.lanes.forEach((lane) => {
      const card = lane[side];
      if (!card || card.isSkull) return;
      if (card.specialAbilities && Array.isArray(card.specialAbilities)) {
        // 턴 시작형 처리
        card.specialAbilities.forEach(ability => {
          if (!ability) return;
          if (ability.condition === 'turn_start' || ability.condition === 'always') {
            try {
              // 턴 시작/지속형 특수능력도 애니메이션과 함께 실행
              executeSpecialAbility(ability, card, [], side === 'player');
            } catch (e) {
              console.warn('특수능력 실행 오류:', e);
            }
          }
        });
      }
    });
  };

  applyForSide('player');
  applyForSide('computer');
}

function resetGame() {
  console.log('resetGame 호출됨, 현재 온라인 상태:', onlineGameState.isOnline);
  
  gameState.playerScore = 0;
  gameState.computerScore = 0;
  gameState.isGameActive = true; // Reactivate game
  gameState.playerHand = [];
  gameState.computerHand = [];
  gameState.isPlayerTurn = true;
  gameState.turnCount = 1;
  gameState.selectedCardId = null;
  gameState.playerCoins = 20;
  gameState.computerCoins = 20;
  gameState.drawCount = 0; // Reset draw count
  gameState.energy = 100; // 초기 에너지 제공

  // fusionSystem 초기화 확인
  if (!gameState.fusionSystem && window.fusionSystem) {
    console.log('resetGame: fusionSystem 초기화 중...');
    gameState.fusionSystem = window.fusionSystem;
    console.log('fusionSystem이 gameState에 연결되었습니다.');
  }

  // 별 재화 시스템 리셋
  if (window.starCurrency) {
    window.starCurrency.playerStars = 0;
    window.starCurrency.computerStars = 0;
    window.starCurrency.updateUI();
  }

  // 별 관리 시스템 리셋
  if (window.starManagement) {
    window.starManagement.stars = 0;
    window.starManagement.totalStarsCreated = 0;
    window.starManagement.supernovaQueue = [];
    window.starManagement.fusedStars = { player: [], computer: [] };
    window.starManagement.updateUI();
  }

  // Reset base HP specifically (과학 기지 체력 1Utg)
  battlefield.bases.player.hp = Math.pow(10, 20);
  battlefield.bases.computer.hp = Math.pow(10, 20);

  // 애니메이션 컨테이너들 정리
  if (typeof window.cleanupAnimationContainers === 'function') {
    window.cleanupAnimationContainers();
  }

  resetBattlefield(); // Resets lanes and ensures bases are at max HP

  // 온라인 모드가 아닌 경우에만 컴퓨터 카드 생성
  if (!onlineGameState.isOnline) {
    console.log('오프라인 모드: 플레이어와 컴퓨터 카드 생성');
    // 고정된 시작 카드 제공: H 3개 (플레이어)
    // 공정성 확보: 양측 모두 동일 경로로 랜덤 카드 3장 지급
    for (let i = 0; i < 3; i++) {
      const pCard = createRandomCardByRarity();
      if (pCard) addCardToHand(pCard, 'player');
    }

    for (let i = 0; i < 3; i++) {
      const cCard = createRandomCardByRarity();
      if (cCard) {
        // 컴퓨터 초기 카드에도 점진적 성장률 적용
        const growthRate = gameState.computerProgression.currentGrowthRate;
        
        // 원본 능력치 저장 (성장률 재적용을 위해)
        if (!cCard.baseHp) cCard.baseHp = cCard.hp;
        if (!cCard.baseAtk) cCard.baseAtk = cCard.atk;
        
        // 카드 능력치에 성장률 적용
        if (cCard.hp && cCard.maxHp) {
          cCard.hp = Math.floor(cCard.hp * growthRate);
          cCard.maxHp = Math.floor(cCard.maxHp * growthRate);
        }
        if (cCard.atk) {
          cCard.atk = Math.floor(cCard.atk * growthRate);
        }
        
        console.log(`Computer initial card enhanced by ${growthRate.toFixed(2)}x growth rate: ${cCard.name} (HP: ${cCard.hp}, ATK: ${cCard.atk})`);
        addCardToHand(cCard, 'computer');
      }
    }
  } else {
    console.log('온라인 모드: 수소 3개 카드 생성');
    // 온라인 모드에서도 수소 3개 제공
    if (gameState.elementsData && Array.isArray(gameState.elementsData) && gameState.elementsData.length > 0) {
      const hydrogenElement = gameState.elementsData.find(e => e.symbol === 'H');
      if (hydrogenElement) {
        for (let i = 0; i < 3; i++) {
          const hCard = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
          addCardToHand(hCard, 'player');
        }
        console.log('온라인 모드: 수소 카드 3개 생성 완료');
      } else {
        console.error('온라인 모드: 수소 원소를 찾을 수 없습니다.');
        // 폴백: 첫 번째 원소 사용
        const fallbackElement = gameState.elementsData[0];
        if (fallbackElement) {
          for (let i = 0; i < 3; i++) {
            const fallbackCard = new ElementCard(fallbackElement, fallbackElement.baseHp, fallbackElement.baseAtk);
            addCardToHand(fallbackCard, 'player');
          }
          console.log('온라인 모드: 폴백 원소 카드 3개 생성 완료');
        }
      }
    } else {
      console.error('온라인 모드: elementsData가 로드되지 않았습니다. 데이터 로딩을 기다립니다.');
      // 데이터 로딩을 기다린 후 카드 생성
      setTimeout(() => {
        if (gameState.elementsData && Array.isArray(gameState.elementsData) && gameState.elementsData.length > 0) {
          const hydrogenElement = gameState.elementsData.find(e => e.symbol === 'H');
          if (hydrogenElement) {
            for (let i = 0; i < 3; i++) {
              const hCard = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
              addCardToHand(hCard, 'player');
            }
            console.log('온라인 모드: 지연된 수소 카드 3개 생성 완료');
            updateUI();
          }
        } else {
          console.error('온라인 모드: 지연 후에도 elementsData를 찾을 수 없습니다.');
        }
      }, 1000);
    }
  }

  showMessage('게임이 초기화되었습니다. 카드를 배치하세요!', 'info');
  updateUI();

  // Re-enable buttons if they were disabled
  const endTurnBtn = document.getElementById('end-turn-btn');
  if (endTurnBtn) endTurnBtn.disabled = false;
  // Re-enable other buttons as needed
}

function updateBaseDisplay(side = null) {
  const sides = side ? [side] : ['player', 'computer'];
  sides.forEach(s => {
    const base = battlefield.bases[s];
    const hpElement = document.getElementById(`${s}-base-hp`);
    const hpBarElement = document.getElementById(`${s}-base-hp-bar`);

    if (hpElement && hpBarElement && base) {
      hpElement.textContent = base.hp;
      // Calculate width based on maxHp (now 1000)
      const widthPercent = Math.max(0, (base.hp / base.maxHp) * 100);
      hpBarElement.style.width = `${widthPercent}%`;
    } else {
      // console.error(`updateBaseDisplay: Elements for ${s} base not found or base data missing.`);
    }
  });
}

// 에너지 관련 함수들
function addEnergy(amount, side) {
    if (!gameState.isGameActive) return false;
    
    if (side === 'player') {
        if (!gameState.energy) gameState.energy = 0;
        
        gameState.energy += amount;
        
        // fusionSystem과 동기화
        if (gameState.fusionSystem) {
            gameState.fusionSystem.energy = gameState.energy;
        }
        
        console.log(`Player energy increased by ${amount}. Current energy: ${gameState.energy}`);
        
        // 에너지 표시 업데이트
        if (typeof updateEnergyDisplay === 'function') {
            updateEnergyDisplay();
        }
        
        return true;
    }
    
    return false;
}

function spendEnergy(amount, side) {
    if (!gameState.isGameActive) return false;
    
    if (side === 'player') {
        if (!gameState.energy) gameState.energy = 0;
        
        if (gameState.energy < amount) {
            return false; // Not enough energy
        }
        
        gameState.energy = Math.max(0, gameState.energy - amount);
        
        // fusionSystem과 동기화
        if (gameState.fusionSystem) {
            gameState.fusionSystem.energy = gameState.energy;
        }
        
        console.log(`Player energy decreased by ${amount}. Current energy: ${gameState.energy}`);
        
        // 에너지 표시 업데이트
        if (typeof updateEnergyDisplay === 'function') {
            updateEnergyDisplay();
        }
        
        return true;
    }
    
    return false;
}

function getEnergyAmount(side) {
    if (side === 'player') {
        return gameState.energy || 0;
    }
    return 0;
}

function updateUI() {
  console.log('updateUI 호출됨');
  console.log('현재 게임 상태:', gameState);
  console.log('현재 전장 상태:', battlefield);
  
  if (typeof renderPlayerHand === 'function') {
    renderPlayerHand();
  }
  
  if (typeof renderBattlefield === 'function') {
    renderBattlefield();
  }
  
  if (typeof updateTurnIndicator === 'function') {
    updateTurnIndicator();
  }
  
  if (typeof updateCoinDisplay === 'function') {
    updateCoinDisplay('player');
  }
  
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay();
  }

  // 핵융합 시스템 UI 업데이트
  if (typeof window.fusionUI !== 'undefined' && window.fusionUI.updateMainUI) {
    window.fusionUI.updateMainUI();
  }

  // 자동화 체크 (UI 업데이트마다 즉시 실행)
  if (typeof window.checkAutomationImmediate === 'function') {
    window.checkAutomationImmediate();
  }

  // 에너지와 열 표시 업데이트
  if (typeof updateEnergyDisplay === 'function') {
    updateEnergyDisplay();
  }
  if (typeof updateHeatDisplay === 'function') {
    updateHeatDisplay();
  }
  
  console.log('updateUI 완료');
}

// Function to get the current cost of drawing cards (통일된 시스템)
function getCurrentDrawCost() {
  return Math.floor(gameState.baseDrawCost * Math.pow(gameState.costMultiplier, gameState.drawCount));
}

// 컴퓨터 성장률을 턴 진행에 따라 점진적으로 업데이트하는 함수
function updateComputerGrowthRate() {
  const turnCount = gameState.turnCount || 1;
  const progression = gameState.computerProgression;
  
  // 턴 진행에 따른 성장률 계산 (점진적 증가)
  const turnBasedGrowth = progression.baseGrowthRate + (turnCount - 1) * progression.turnGrowthIncrement;
  
  // 난이도 배수 적용
  const finalGrowthRate = Math.min(
    turnBasedGrowth * progression.difficultyMultiplier,
    progression.maxGrowthRate
  );
  
  // 현재 성장률 업데이트
  progression.currentGrowthRate = finalGrowthRate;
  
  console.log(`Computer growth rate updated: ${finalGrowthRate.toFixed(2)}x (turn ${turnCount}, difficulty multiplier: ${progression.difficultyMultiplier})`);
  
  return finalGrowthRate;
}

// 컴퓨터 카드 성장률 업데이트 함수 (기존 함수 개선)
function updateComputerCardGrowth() {
  // 점진적 성장률 계산
  const growthRate = updateComputerGrowthRate();
  
  // 컴퓨터 손패의 카드들 업데이트
  gameState.computerHand.forEach(card => {
    if (card && !card.isSkull) {
      // 원본 능력치를 기준으로 성장률 재적용
      if (card.baseHp && card.baseAtk) {
        card.hp = Math.floor(card.baseHp * growthRate);
        card.maxHp = Math.floor(card.baseHp * growthRate);
        card.atk = Math.floor(card.baseAtk * growthRate);
      } else {
        // 원본 능력치가 없으면 현재 능력치에 성장률 적용
        if (card.hp && card.maxHp) {
          card.hp = Math.floor(card.hp * growthRate);
          card.maxHp = Math.floor(card.maxHp * growthRate);
        }
        if (card.atk) {
          card.atk = Math.floor(card.atk * growthRate);
        }
      }
    }
  });
  
  // 전장의 컴퓨터 카드들 업데이트
  battlefield.lanes.forEach(lane => {
    const computerCard = lane.computer;
    if (computerCard && !computerCard.isSkull) {
      if (computerCard.baseHp && computerCard.baseAtk) {
        computerCard.hp = Math.floor(computerCard.baseHp * growthRate);
        computerCard.maxHp = Math.floor(computerCard.baseHp * growthRate);
        computerCard.atk = Math.floor(computerCard.baseAtk * growthRate);
      } else {
        if (computerCard.hp && computerCard.maxHp) {
          computerCard.hp = Math.floor(computerCard.hp * growthRate);
          computerCard.maxHp = Math.floor(computerCard.maxHp * growthRate);
        }
        if (computerCard.atk) {
          computerCard.atk = Math.floor(computerCard.atk * growthRate);
        }
      }
    }
  });
  
  console.log(`Computer cards updated with ${growthRate.toFixed(2)}x growth rate`);
  updateUI();
}

// Expose necessary functions and variables to the global scope
window.gameState = gameState;
window.getCurrentDrawCost = getCurrentDrawCost;
window.getCurrentCardCount = getCurrentCardCount;
window.updateComputerGrowthRate = updateComputerGrowthRate;
window.updateComputerCardGrowth = updateComputerCardGrowth;
window.getRarityChances = getRarityChances;
window.queueDrawCard = queueDrawCard;
window.drawCards = drawCards; // Expose unified draw function
window.drawCardsWithoutAnimation = drawCardsWithoutAnimation; // Expose animation-free draw function
window.findAvailableLane = findAvailableLane; // Expose find available lane function
window.updateExistingCardStats = updateExistingCardStats; // Expose card stats update function
window.endTurn = typeof endTurn !== 'undefined' ? endTurn : undefined;
window.resetGame = typeof resetGame !== 'undefined' ? resetGame : undefined;
window.initGame = typeof initGame !== 'undefined' ? initGame : undefined;
window.updateUI = typeof updateUI !== 'undefined' ? updateUI : undefined;
window.createRandomCard = typeof createRandomCard !== 'undefined' ? createRandomCard : undefined;
window.addCardToHand = typeof addCardToHand !== 'undefined' ? addCardToHand : undefined;
window.getElementByNumber = typeof getElementByNumber !== 'undefined' ? getElementByNumber : (num) => gameState.elementsData.find(e => e.number === num);
window.getElementBySymbol = typeof getElementBySymbol !== 'undefined' ? getElementBySymbol : (sym) => gameState.elementsData.find(e => e.symbol === sym);
window.calculateBaseDamage = calculateBaseDamage;
window.computeElementStats = computeElementStats; // Expose computeElementStats function
window.loadCardStatsData = loadCardStatsData; // Expose loadCardStatsData function
window.loadAllGameData = loadAllGameData; // Expose loadAllGameData function
window.spendCoins = typeof spendCoins !== 'undefined' ? spendCoins : undefined;
window.addCoins = typeof addCoins !== 'undefined' ? addCoins : undefined;
window.addEnergy = addEnergy; // Expose energy functions
window.spendEnergy = spendEnergy;
window.getEnergyAmount = getEnergyAmount;
window.updateBaseDisplay = updateBaseDisplay; // Ensure exposed if called elsewhere directly
window.damageBase = damageBase; // Expose if needed
window.endGame = endGame; // Expose endGame
window.updateComputerCardGrowth = updateComputerCardGrowth; // Expose computer card growth update

// --- Add missing executeAttack function ---
function executeAttack(attackerCard, defenderCard) {
    // Basic attack: use calculateBaseDamage and deduct HP
    let damage = calculateBaseDamage(attackerCard);
    
    // 상성 시스템 적용
    if (defenderCard) {
        const affinityMultiplier = calculateAffinityDamage(attackerCard, defenderCard);
        damage = Math.floor(damage * affinityMultiplier);
        
        // 시너지 보너스 적용
        if (attackerCard.synergyBonus) {
            damage = Math.floor(damage * attackerCard.synergyBonus);
        }
        
        defenderCard.hp = Math.max(0, defenderCard.hp - damage);
    }
    
    return { damageDealt: damage };
}
window.executeAttack = executeAttack;

// --- 온라인 게임 관련 함수들 ---

// 온라인 모드 설정
function setOnlineMode(isOnline, roomId = '', opponentName = '') {
  console.log('=== 온라인 모드 설정 시작 ===');
  console.log('설정할 값:', { isOnline, roomId, opponentName });
  console.log('설정 전 상태:', onlineGameState);
  
  onlineGameState.isOnline = isOnline;
  onlineGameState.roomId = roomId;
  onlineGameState.opponentName = opponentName;
  
  // 온라인 턴 상태 리셋
  onlineGameState.playerTurnEnded = false;
  onlineGameState.opponentTurnEnded = false;
  onlineGameState.waitingForOpponent = false;
  
  // Express API 기반 통신 사용
  
  console.log('설정 후 상태:', onlineGameState);
  
  // UI 업데이트
  updateOnlineModeUI();
  updateOnlineTurnUI();
  
  // 전역 변수 업데이트
  window.onlineGameState = onlineGameState;
  
  // fusionSystem 초기화 확인
  if (isOnline && !gameState.fusionSystem && window.fusionSystem) {
    console.log('온라인 모드: fusionSystem 초기화 중...');
    gameState.fusionSystem = window.fusionSystem;
    console.log('fusionSystem이 gameState에 연결되었습니다.');
  }
  
  // 온라인 모드인 경우 게임 상태 동기화 확인
  if (isOnline && roomId) {
    console.log('온라인 모드: 게임 상태 동기화 확인 중...');
    
    // 서버에 게임 상태 확인 요청
    // 온라인 게임 상태 확인은 폴링으로 처리
  }
  
  console.log('=== 온라인 모드 설정 완료 ===');
}

// 온라인 모드 UI 업데이트
function updateOnlineModeUI() {
  console.log('=== 온라인 모드 UI 업데이트 시작 ===');
  console.log('현재 onlineGameState:', onlineGameState);
  console.log('isOnline:', onlineGameState.isOnline);
  console.log('opponentName:', onlineGameState.opponentName);
  
  const computerInfo = document.querySelector('.computer-info h2');
  if (computerInfo) {
    if (onlineGameState.isOnline) {
      computerInfo.textContent = onlineGameState.opponentName || '상대방';
      console.log('✅ 상대방 이름으로 업데이트:', onlineGameState.opponentName);
    } else {
      computerInfo.textContent = '컴퓨터';
      console.log('✅ 컴퓨터로 업데이트');
    }
  } else {
    console.warn('❌ computer-info h2 요소를 찾을 수 없습니다.');
  }
  
  // 온라인 매칭 버튼 상태 업데이트
  const onlineMatchBtn = document.getElementById('online-match-btn');
  if (onlineMatchBtn) {
    if (onlineGameState.isOnline) {
      onlineMatchBtn.textContent = '🌐 온라인 게임 중';
      onlineMatchBtn.disabled = true;
      onlineMatchBtn.classList.add('opacity-50', 'cursor-not-allowed');
      console.log('✅ 온라인 매칭 버튼 비활성화');
    } else {
      onlineMatchBtn.textContent = '🌐 온라인 매칭';
      onlineMatchBtn.disabled = false;
      onlineMatchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      console.log('✅ 온라인 매칭 버튼 활성화');
    }
  } else {
    console.warn('❌ online-match-btn 요소를 찾을 수 없습니다.');
  }
  
  // 온라인 모드에서 난이도 선택 UI 숨기기/보이기
  const difficultyContainer = document.querySelector('.difficulty-container');
  if (difficultyContainer) {
    if (onlineGameState.isOnline) {
      difficultyContainer.style.display = 'none';
      console.log('✅ 난이도 선택 UI 숨김');
    } else {
      difficultyContainer.style.display = 'block';
      console.log('✅ 난이도 선택 UI 표시');
    }
  } else {
    console.warn('❌ difficulty-container 요소를 찾을 수 없습니다.');
  }

  // 게임 리셋 버튼 제어
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    if (onlineGameState.isOnline) {
      resetBtn.classList.add('hidden');
      console.log('✅ 온라인 게임 중 - 리셋 버튼 숨김');
    } else {
      resetBtn.classList.remove('hidden');
      console.log('✅ 오프라인 게임 - 리셋 버튼 표시');
    }
  } else {
    console.warn('❌ reset-btn 요소를 찾을 수 없습니다.');
  }
  
  // 턴 표시 업데이트
  updateOnlineTurnUI();
  
  console.log('=== 온라인 모드 UI 업데이트 완료 ===');
}

// 온라인 턴 UI 업데이트 - 현재 턴인 플레이어만 턴 종료 가능
function updateOnlineTurnUI(isMyTurn = null) {
  // 온라인 모드가 아니면 실행하지 않음
  if (!onlineGameState.isOnline) {
    console.log("updateOnlineTurnUI: 온라인 모드가 아니므로 실행하지 않습니다.");
    return;
  }
  
  const endTurnBtn = document.getElementById('end-turn-btn');
  const resultMessage = document.getElementById('result-message');
  
  // isMyTurn이 제공되지 않으면 기존 로직 사용 (하위 호환성)
  if (isMyTurn === null) {
    isMyTurn = gameState.isPlayerTurn;
  }
  
  console.log("updateOnlineTurnUI: 온라인 턴 UI 업데이트", { isMyTurn, turnCount: gameState.turnCount });
  
  if (isMyTurn) {
    // 내 차례 - 턴 종료 가능
    if (endTurnBtn) {
      endTurnBtn.textContent = '턴 종료';
      endTurnBtn.disabled = false;
      endTurnBtn.onclick = endTurn;
    }
    if (resultMessage) {
      resultMessage.textContent = `${gameState.turnCount}턴: 내 차례`;
      resultMessage.className = 'text-center text-xl font-bold h-12 text-green-400';
    }
  } else {
    // 상대방 차례 - 턴 종료 불가
    if (endTurnBtn) {
      endTurnBtn.textContent = '상대방 차례';
      endTurnBtn.disabled = true;
      endTurnBtn.onclick = null;
    }
    if (resultMessage) {
      resultMessage.textContent = `${gameState.turnCount}턴: 상대방 차례`;
      resultMessage.className = 'text-center text-xl font-bold h-12 text-red-400';
    }
  }
}

// 온라인 게임 상태 동기화
function syncGameState() {
  // 온라인 게임 상태 동기화는 폴링으로 처리
}

// 온라인 게임 상태 업데이트
function updateOnlineGameState(newGameState) {
  console.log('게임 상태 동기화 시작:', {
    oldTurnCount: gameState.turnCount,
    newTurnCount: newGameState.turnCount,
    oldIsPlayerTurn: gameState.isPlayerTurn,
    newIsPlayerTurn: newGameState.isPlayerTurn,
    oldPlayerCoins: gameState.playerCoins,
    newPlayerCoins: newGameState.playerCoins,
    hasElementsData: !!(newGameState.elementsData && newGameState.elementsData.length > 0),
    hasMoleculesData: !!(newGameState.moleculesData && newGameState.moleculesData.length > 0)
  });
  
  // 온라인 모드에서는 난이도 동기화 제거 (플레이어 vs 플레이어이므로)
  // 난이도는 오프라인 모드에서만 사용
  
  // elementsData와 moleculesData가 있으면 먼저 설정
  if (newGameState.elementsData && newGameState.elementsData.length > 0) {
    gameState.elementsData = newGameState.elementsData;
    console.log(`온라인 모드: elementsData 로드됨 (${newGameState.elementsData.length}개)`);
  }
  if (newGameState.moleculesData && newGameState.moleculesData.length > 0) {
    gameState.moleculesData = newGameState.moleculesData;
    console.log(`온라인 모드: moleculesData 로드됨 (${newGameState.moleculesData.length}개)`);
  }
  
  // 서버에서 받은 게임 상태로 업데이트 (개별 플레이어 상태 포함)
  // 단, 손패는 보존 (서버에서 빈 배열로 전송될 수 있음)
  const currentPlayerHand = [...gameState.playerHand];
  const currentComputerHand = [...gameState.computerHand];
  
  Object.assign(gameState, newGameState);
  
  // fusionSystem 상태 업데이트
  if (newGameState.fusionSystem && gameState.fusionSystem) {
    console.log('fusionSystem 상태 동기화 중...');
    gameState.fusionSystem.loadState(newGameState.fusionSystem);
    console.log('fusionSystem 상태 동기화 완료');
  }
  
  // 별 관리 시스템 상태 업데이트
  if (newGameState.starManagement && window.starManagement) {
    console.log('별 관리 시스템 상태 동기화 중...');
    window.starManagement.loadData(newGameState.starManagement);
    console.log('별 관리 시스템 상태 동기화 완료');
  }

  // 컴퓨터 별 관리 시스템 상태 업데이트
  if (newGameState.computerStarManagement && window.starManagement) {
    console.log('컴퓨터 별 관리 시스템 상태 동기화 중...');
    window.starManagement.loadComputerData(newGameState.computerStarManagement);
    console.log('컴퓨터 별 관리 시스템 상태 동기화 완료');
  }
  
  // 손패가 비어있거나 서버에서 전송되지 않은 경우 로컬 손패 유지
  if (!newGameState.playerHand || newGameState.playerHand.length === 0) {
    gameState.playerHand = currentPlayerHand;
  }
  if (!newGameState.computerHand || newGameState.computerHand.length === 0) {
    gameState.computerHand = currentComputerHand;
  }
  
  console.log('게임 상태 업데이트 완료:', {
    turnCount: gameState.turnCount,
    isPlayerTurn: gameState.isPlayerTurn,
    playerCoins: gameState.playerCoins,
    computerCoins: gameState.computerCoins,
    elementsDataCount: gameState.elementsData ? gameState.elementsData.length : 0,
    moleculesDataCount: gameState.moleculesData ? gameState.moleculesData.length : 0,
    playerHandCount: gameState.playerHand ? gameState.playerHand.length : 0,
    computerHandCount: gameState.computerHand ? gameState.computerHand.length : 0
  });
  
  // 핵융합 시스템 에너지 동기화
  if (gameState.fusionSystem) {
    gameState.fusionSystem.energy = gameState.energy;
    console.log('핵융합 시스템 에너지 동기화:', gameState.energy);
  }
  
  // 온라인 모드에서 초기 카드가 없으면 생성 (중복 방지)
  // app.js의 giveInitialCardsAndCoins()에서 이미 초기 카드를 제공하므로 여기서는 제거
  // 단, 서버에서 손패가 완전히 비어있는 경우에만 폴백으로 생성
  if (gameState.elementsData && gameState.elementsData.length > 0) {
    if (!gameState.playerHand || gameState.playerHand.length === 0) {
      console.log('온라인 모드: 서버에서 손패가 비어있음 - 폴백 수소 카드 생성');
      const hydrogenElement = gameState.elementsData.find(e => e.symbol === 'H');
      if (hydrogenElement) {
        for (let i = 0; i < 3; i++) {
          const hCard = new ElementCard(hydrogenElement, hydrogenElement.baseHp, hydrogenElement.baseAtk);
          addCardToHand(hCard, 'player');
        }
        console.log('온라인 모드: 폴백 수소 카드 3개 생성 완료');
      }
    } else {
      console.log('온라인 모드: 손패가 이미 존재함 - 중복 생성 방지');
    }
  }
  
  // UI 업데이트
  if (typeof updateUI === 'function') {
    updateUI();
  }
  
  // 점수 표시 업데이트
  if (typeof updateScoreDisplay === 'function') {
    updateScoreDisplay();
  }
  
  // 턴 표시 업데이트
  if (typeof updateTurnIndicator === 'function') {
    updateTurnIndicator();
  }
  
  // 코인 표시 업데이트
  if (typeof updateCoinDisplay === 'function') {
    updateCoinDisplay('player');
    updateCoinDisplay('computer');
  }
  
  // 기지 표시 업데이트
  if (typeof updateBaseDisplay === 'function') {
    updateBaseDisplay();
  }
  
  // 온라인 턴 UI 업데이트
  if (typeof updateOnlineTurnUI === 'function') {
    updateOnlineTurnUI();
  }
  
  // 온라인 모드 UI 업데이트 (상대방 이름, 버튼 상태 등)
  if (typeof updateOnlineModeUI === 'function') {
    updateOnlineModeUI();
  }
  
  console.log('게임 상태 동기화 완료');
}

// 온라인 게임에서 턴 종료 처리 - 서버에서 자동 처리되므로 제거됨
function processOnlineTurnEnd() {
  // 이 함수는 더 이상 사용되지 않음 - 서버에서 턴 동기화 처리
  console.log('processOnlineTurnEnd 호출됨 - 서버에서 턴 동기화 처리 중');
}

// 턴 종료 대기 시간 제한 제거됨 - 서버에서 턴 동기화 처리
let turnTimeoutId = null;

function startTurnTimeout() {
  // 타임아웃 로직 제거됨 - 서버에서 턴 동기화 처리
  console.log('턴 종료 신호 전송됨, 서버에서 턴 동기화 대기 중...');
}

function clearTurnTimeout() {
  if (turnTimeoutId) {
    clearTimeout(turnTimeoutId);
    turnTimeoutId = null;
  }
}

// 온라인 게임 종료
function endOnlineGame() {
  if (onlineGameState.isOnline) {
    onlineGameState.isOnline = false;
    onlineGameState.roomId = '';
    onlineGameState.opponentName = '';
    onlineGameState.isHost = false;
    
    updateOnlineModeUI();
    
    // 온라인 매칭 시스템에 게임 종료 알림
    if (window.onlineMatching) {
      window.onlineMatching.endOnlineGame();
    }
  }
}

// 게임 리셋 시 온라인 모드도 리셋
const originalResetGame = window.resetGame;
window.resetGame = function() {
  if (originalResetGame) {
    originalResetGame();
  }
  
  // 온라인 모드가 아닌 경우에만 리셋
  if (!onlineGameState.isOnline) {
    endOnlineGame();
  }
};

// 전장 상태 동기화
function syncBattlefield(newBattlefield) {
  if (newBattlefield) {
    console.log('전장 상태 동기화 시작:', newBattlefield);
    
    // 온라인 게임인 경우 서버에서 이미 플레이어 관점으로 변환된 데이터를 사용
    let processedBattlefield = newBattlefield;
    if (window.onlineGameState?.isOnline) {
      console.log('온라인 게임: 서버에서 플레이어 관점으로 변환된 데이터 사용');
      
      // 카드 객체 복원
      if (processedBattlefield.lanes) {
        processedBattlefield.lanes.forEach(lane => {
          if (lane.player) lane.player = window.restoreCardFromServer(lane.player);
          if (lane.computer) lane.computer = window.restoreCardFromServer(lane.computer);
        });
      }
    }
    
    // 전장 상태 업데이트 - 깊은 복사로 안전하게 동기화
    try {
      // JSON을 통한 깊은 복사 (구조화 복제)
      const deepCopiedBattlefield = JSON.parse(JSON.stringify(processedBattlefield));
      
      // 기존 전장 상태를 안전하게 교체
      battlefield.lanes = deepCopiedBattlefield.lanes || battlefield.lanes;
      battlefield.bases = deepCopiedBattlefield.bases || battlefield.bases;
      
      console.log('전장 상태 깊은 복사 완료');
    } catch (error) {
      console.error('전장 상태 깊은 복사 실패, 얕은 복사로 대체:', error);
      // 폴백: 얕은 복사
      Object.assign(battlefield, processedBattlefield);
    }
    
    // 전장 렌더링
    if (typeof renderBattlefield === 'function') {
      renderBattlefield();
    }
    
    // UI 업데이트
    if (typeof updateUI === 'function') {
      updateUI();
    }
    
    // 기지 표시 업데이트
    if (typeof updateBaseDisplay === 'function') {
      updateBaseDisplay();
    }
    
    console.log('전장 상태가 동기화되었습니다.');
  }
}

// 카드 배치 동기화 (Socket.IO 기반)
function syncCardPlacement(data) {
  console.log('카드 배치 동기화 시작:', data);
  
  if (data.card && data.laneIndex >= 0 && data.laneIndex < battlefield.lanes.length) {
    const lane = battlefield.lanes[data.laneIndex];
    if (lane) {
      // 카드 정보 설정
      const card = data.card;
      // owner는 서버에서 받은 원본 값 유지, side는 화면 표시용
      card.lastDamageTurn = gameState.turnCount;
      
      // 카드 이름 설정
      if (card.element) {
        card.name = card.element.name;
      } else if (!card.name) {
        card.name = '알 수 없는 카드';
      }
      
      // 카드 ID가 없으면 생성 - UUID 사용
      if (!card.id) {
        try {
          card.id = `card_${crypto.randomUUID()}`;
        } catch (error) {
          // crypto.randomUUID()가 지원되지 않는 경우 폴백
          card.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      }
      
      // 카드 타입 설정
      if (!card.type) {
        card.type = 'element';
      }
      
      // 전장에 카드 배치 - 서버에서 받은 side 값을 사용하여 올바른 위치에 배치
      // 서버에서 이미 각 플레이어의 관점에 맞게 side 값을 설정해줌
      const displaySide = data.side || 'player';
      lane[displaySide] = card;
      
      console.log(`카드 배치됨: ${card.name} (ID: ${card.id})이 라인 ${data.laneIndex}의 ${displaySide}에 배치됨 (owner: ${card.owner}, displaySide: ${displaySide})`);
      
      // 전장 렌더링
      if (typeof renderBattlefield === 'function') {
        renderBattlefield();
      }
      
      // UI 업데이트
      if (typeof updateUI === 'function') {
        updateUI();
      }
      
      console.log('카드 배치 동기화 완료');
    }
  } else {
    console.error('카드 배치 동기화 실패: 잘못된 데이터', data);
  }
}

// 카드 뽑기 동기화 (Socket.IO 기반)
function syncCardDraw(data) {
  if (data.side && data.cardCount) {
    // 상대방의 카드 뽑기 알림만 표시 (실제 카드는 서버에서 관리)
    if (typeof showMessage === 'function') {
      showMessage(`${data.playerName}이 ${data.cardCount}장의 카드를 뽑았습니다.`, 'info');
    }
    
    console.log(`카드 뽑기 동기화: ${data.playerName}이 ${data.cardCount}장의 카드를 뽑음`);
  }
}

// 전역 변수와 함수로 노출
window.gameState = gameState;
window.battlefield = battlefield;
window.onlineGameState = onlineGameState;
window.setOnlineMode = setOnlineMode;
window.syncGameState = syncGameState;
window.updateOnlineGameState = updateOnlineGameState;
window.endOnlineGame = endOnlineGame;
window.updateOnlineTurnUI = updateOnlineTurnUI;
window.processOnlineTurnEnd = processOnlineTurnEnd;
window.syncBattlefield = syncBattlefield;
window.syncCardPlacement = syncCardPlacement;
window.syncCardDraw = syncCardDraw;
window.startTurnTimeout = startTurnTimeout;
window.clearTurnTimeout = clearTurnTimeout;