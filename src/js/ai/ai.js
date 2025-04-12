/**
 * 컴퓨터 AI 관련 기능
 */

/**
 * 컴퓨터 턴 실행
 */
function computerTurn() {
  console.log('컴퓨터 턴 시작');
  
  // 게임 종료 확인
  if (!window.gameState || !window.gameState.isGameActive) return;
  
  // 플레이어 턴이면 종료
  if (window.gameState.isPlayerTurn) return;
  
  // 카드 뽑기
  computerDrawCards();
  
  // 컴퓨터 전략 실행
  setTimeout(() => {
    executeComputerStrategy();
    
    // 전투 시뮬레이션
    if (typeof executeBattles === 'function') {
      executeBattles();
    }
    
    // 플레이어 턴으로 전환
    setTimeout(() => {
      startPlayerTurn();
    }, 1000);
  }, 1000);
}

/**
 * 컴퓨터 카드 뽑기
 */
function computerDrawCards() {
  console.log('컴퓨터 카드 뽑기');
  
  // 게임 상태 확인
  if (!window.gameState) return;
  
  // 컴퓨터 코인 확인
  const coins = getComputerCoins();
  console.log(`컴퓨터 코인: ${coins}`);
  
  // 고급 카드 뽑기 시도
  if (coins >= 5 && Math.random() < 0.3) {
    computerDrawCard('premium');
  } 
  // 일반 카드 뽑기
  else if (coins >= 2) {
    computerDrawCard('basic');
  }
  
  // 손패가 3장 미만이면 추가로 뽑기 시도
  if (window.gameState.computerHand.length < 3 && coins >= 2) {
    computerDrawCard('basic');
  }
}

/**
 * 컴퓨터 카드 뽑기 (타입별)
 * @param {string} type - 'basic' 또는 'premium'
 */
function computerDrawCard(type) {
  // 비용 확인
  const cost = type === 'premium' ? 5 : 2;
  if (getComputerCoins() < cost) return;
  
  // 코인 사용
  spendComputerCoins(cost);
  
  // 랜덤 카드 생성
  let newCard;
  if (type === 'premium') {
    // 프리미엄은 더 높은 등급 카드 확률
    newCard = createRandomCardByRarity('premium');
  } else {
    newCard = createRandomCardByRarity('basic');
  }
  
  // 손패에 추가
  if (newCard) {
    if (typeof addCardToHand === 'function') {
      addCardToHand(newCard, 'computer');
    } else {
      window.gameState.computerHand.push(newCard);
    }
    
    // 시각적 표현 불필요 (숨겨져 있음)
    // 하지만 함수가 존재하면 호출 (개수 업데이트 등)
    if (typeof renderComputerHand === 'function') {
      renderComputerHand();
    } else {
      console.log('컴퓨터 손패에 카드 추가됨 (총 ' + window.gameState.computerHand.length + '장)');
    }
  }
}

/**
 * 컴퓨터 전략 실행
 */
function executeComputerStrategy() {
  console.log('컴퓨터 전략 실행');
  
  // 게임 상태 확인
  if (!window.gameState || !window.battlefield) return;
  
  const { computerHand } = window.gameState;
  const { lanes } = window.battlefield;
  
  // 손패가 없으면 종료
  if (computerHand.length === 0) {
    console.log('컴퓨터 손패 없음');
    return;
  }
  
  // 1. 각 레인의 상태 분석
  const laneStatus = analyzeLanes(lanes);
  
  // 2. 각 레인에 대한 전략 결정
  const strategies = determineStrategies(laneStatus, computerHand);
  
  // 3. 전략에 따라 카드 배치
  executeStrategies(strategies);
  
  // UI 업데이트
  if (typeof renderBattlefield === 'function') {
    renderBattlefield();
  }
}

/**
 * 레인 상태 분석
 * @param {Array} lanes - 배틀필드 레인 배열
 * @returns {Array} - 레인 상태 분석 결과
 */
function analyzeLanes(lanes) {
  return lanes.map((lane, index) => {
    const hasPlayerCard = Boolean(lane.player);
    const hasComputerCard = Boolean(lane.computer);
    const playerPower = lane.player ? (lane.player.power || lane.player.atk || 0) : 0;
    const computerPower = lane.computer ? (lane.computer.power || lane.computer.atk || 0) : 0;
    
    return {
      index,
      hasPlayerCard,
      hasComputerCard,
      playerPower,
      computerPower,
      powerDifference: playerPower - computerPower,
      priority: 0 // 우선순위 (나중에 계산)
    };
  });
}

/**
 * 전략 결정
 * @param {Array} laneStatus - 레인 상태 분석 결과
 * @param {Array} computerHand - 컴퓨터 손패
 * @returns {Array} - 결정된 전략
 */
function determineStrategies(laneStatus, computerHand) {
  // 레인별 우선순위 계산
  laneStatus.forEach(status => {
    // 플레이어 카드가 있고 컴퓨터 카드가 없는 경우 (방어 필요)
    if (status.hasPlayerCard && !status.hasComputerCard) {
      status.priority += 10 + status.playerPower;
    }
    // 컴퓨터 카드가 있는 레인에 추가 카드 배치는 낮은 우선순위
    else if (status.hasComputerCard) {
      status.priority += 3;
    }
    // 빈 레인은 중간 우선순위
    else {
      status.priority += 5;
    }
  });
  
  // 우선순위별로 정렬
  laneStatus.sort((a, b) => b.priority - a.priority);
  
  // 카드 배치 전략 생성
  const strategies = [];
  
  // 사용 가능한 카드 수 확인
  const availableCards = [...computerHand];
  if (availableCards.length === 0) return strategies;
  
  // 레인별로 카드 할당
  for (const lane of laneStatus) {
    if (availableCards.length === 0) break;
    
    // 해당 레인에 배치할 최적 카드 선택
    const bestCardIndex = selectBestCardForLane(availableCards, lane);
    if (bestCardIndex >= 0) {
      strategies.push({
        laneIndex: lane.index,
        card: availableCards[bestCardIndex]
      });
      
      // 사용한 카드 제거
      availableCards.splice(bestCardIndex, 1);
    }
  }
  
  return strategies;
}

/**
 * 레인에 맞는 최적의 카드 선택
 * @param {Array} availableCards - 사용 가능한 카드 목록
 * @param {Object} laneStatus - 레인 상태 정보
 * @returns {number} - 최적 카드의 인덱스 (-1: 적합한 카드 없음)
 */
function selectBestCardForLane(availableCards, laneStatus) {
  if (availableCards.length === 0) return -1;
  
  // 플레이어 카드가 있는 경우, 그보다 강한 카드 선택
  if (laneStatus.hasPlayerCard) {
    // 플레이어 카드보다 강한 카드 찾기
    for (let i = 0; i < availableCards.length; i++) {
      const card = availableCards[i];
      const power = card.power || card.atk || 0;
      
      if (power > laneStatus.playerPower) {
        return i;
      }
    }
    
    // 없으면 가장 강한 카드 선택
    let maxPowerIndex = 0;
    let maxPower = 0;
    
    for (let i = 0; i < availableCards.length; i++) {
      const card = availableCards[i];
      const power = card.power || card.atk || 0;
      
      if (power > maxPower) {
        maxPower = power;
        maxPowerIndex = i;
      }
    }
    
    return maxPowerIndex;
  }
  
  // 플레이어 카드가 없는 경우, 무작위 카드 선택
  return Math.floor(Math.random() * availableCards.length);
}

/**
 * 전략 실행 (카드 배치)
 * @param {Array} strategies - 실행할 전략 목록
 */
function executeStrategies(strategies) {
  if (!window.gameState || !window.battlefield) return;
  
  strategies.forEach(strategy => {
    const { laneIndex, card } = strategy;
    
    // 레인 확인
    if (laneIndex >= 0 && laneIndex < 5 && card) {
      const lane = window.battlefield.lanes[laneIndex];
      
      // 컴퓨터 카드 배치
      if (lane.computer) {
        // 이미 카드가 있으면 스택에 추가
        if (!lane.computer.stacked) lane.computer.stacked = [];
        lane.computer.stacked.push(card);
      } else {
        // 빈 슬롯에 카드 배치
        lane.computer = card;
        lane.computer.stacked = [];
      }
      
      // 손패에서 카드 제거
      window.gameState.computerHand = window.gameState.computerHand.filter(c => c.id !== card.id);
      
      console.log(`컴퓨터가 레인 ${laneIndex}에 ${card.element.name} 카드 배치`);
    }
  });
  
  // 컴퓨터 손패 UI 업데이트
  if (typeof renderComputerHand === 'function') {
    renderComputerHand();
  }
}

/**
 * 플레이어 턴 시작
 */
function startPlayerTurn() {
  if (!window.gameState) return;
  
  window.gameState.isPlayerTurn = true;
  window.gameState.turnCount++;
  
  // 턴당 코인 지급
  if (typeof addCoins === 'function') {
    addCoins(3);
  }
  
  // 턴 표시 업데이트
  if (typeof updateTurnIndicator === 'function') {
    updateTurnIndicator();
  }
  
  // 메시지 표시
  if (typeof showMessage === 'function') {
    showMessage('당신의 차례입니다!', 'info');
  }
  
  console.log('플레이어 턴 시작');
}

// 전역 노출
window.computerTurn = computerTurn;
window.computerDrawCards = computerDrawCards;
window.computerDrawCard = computerDrawCard;
window.executeComputerStrategy = executeComputerStrategy;
window.startPlayerTurn = startPlayerTurn;
