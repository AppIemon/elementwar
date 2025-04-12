/**
 * 유틸리티 헬퍼 함수 모음
 */

/**
 * 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 유형 (info, success, warning, error)
 * @param {number} duration - 표시 지속 시간 (ms)
 */
function showMessage(message, type = 'info', duration = 3000) {
  const resultMessage = document.getElementById('result-message');
  if (!resultMessage) return;
  
  // 메시지 타입에 따른 스타일 설정
  let className = 'text-center text-xl font-bold h-12 ';
  switch (type) {
    case 'success':
      className += 'text-green-400';
      break;
    case 'warning':
      className += 'text-yellow-400';
      break;
    case 'error':
      className += 'text-red-400';
      break;
    default:
      className += 'text-blue-400';
  }
  
  resultMessage.className = className;
  resultMessage.textContent = message;
  
  // 지정된 시간 후 메시지 초기화
  if (duration > 0) {
    setTimeout(() => {
      // 이미 다른 메시지가 표시되지 않았을 경우에만
      if (resultMessage.textContent === message) {
        resultMessage.textContent = gameState.isPlayerTurn ? 
          `${gameState.turnCount}턴: 당신의 차례입니다` : 
          `${gameState.turnCount}턴: 컴퓨터 차례입니다`;
      }
    }, duration);
  }
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
 * 난수 생성 (최소값 ~ 최대값)
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} - 생성된 난수
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 확률 기반으로 항목 선택
 * @param {Object} chances - 항목별 확률 {항목명: 확률}
 * @returns {string} - 선택된 항목명
 */
function selectByChance(chances) {
  const totalChance = Object.values(chances).reduce((sum, chance) => sum + chance, 0);
  let random = Math.random() * totalChance;
  
  for (const [item, chance] of Object.entries(chances)) {
    if (random < chance) {
      return item;
    }
    random -= chance;
  }
  
  // 기본값 (배열의 첫 번째 키)
  return Object.keys(chances)[0];
}

// 전역 노출
window.showMessage = showMessage;
window.getRarityStars = getRarityStars;
window.getRandomNumber = getRandomNumber;
window.selectByChance = selectByChance;
