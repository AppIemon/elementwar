/**
 * 코인 시스템 관리
 */

// 플레이어 코인 관리
let coinAmount = 0;

/**
 * 코인 초기화
 * @param {number} amount - 초기 코인 수량 (기본값: 20)
 */
function resetCoins(amount = 20) {
  coinAmount = amount;
  updateCoinDisplay();
}

/**
 * 코인 추가
 * @param {number} amount - 추가할 코인 수량
 */
function addCoins(amount) {
  coinAmount += amount;
  updateCoinDisplay();
  
  // 코인 획득 애니메이션이 있다면 실행
  if (typeof showCoinAnimation === 'function') {
    showCoinAnimation(amount);
  }
}

/**
 * 코인 사용
 * @param {number} amount - 사용할 코인 수량
 * @returns {boolean} - 코인 사용 성공 여부
 */
function spendCoins(amount) {
  if (coinAmount < amount) {
    return false;
  }
  
  coinAmount -= amount;
  updateCoinDisplay();
  return true;
}

/**
 * 코인 수량 확인
 * @returns {number} - 현재 코인 수량
 */
function getCoinAmount() {
  return coinAmount;
}

/**
 * 코인 표시 업데이트
 */
function updateCoinDisplay() {
  const coinDisplay = document.getElementById('coin-amount');
  if (coinDisplay) {
    coinDisplay.textContent = coinAmount;
  }
}

// 컴퓨터 코인 관리
let computerCoins = 0;

/**
 * 컴퓨터 코인 추가
 * @param {number} amount - 추가할 코인 수량
 */
function addComputerCoins(amount) {
  computerCoins += amount;
  updateComputerCoinDisplay();
}

/**
 * 컴퓨터 코인 사용
 * @param {number} amount - 사용할 코인 수량
 * @returns {boolean} - 코인 사용 성공 여부
 */
function spendComputerCoins(amount) {
  if (computerCoins < amount) {
    return false;
  }
  
  computerCoins -= amount;
  updateComputerCoinDisplay();
  return true;
}

/**
 * 컴퓨터 코인 수량 확인
 * @returns {number} - 현재 컴퓨터 코인 수량
 */
function getComputerCoins() {
  return computerCoins;
}

/**
 * 컴퓨터 코인 표시 업데이트
 */
function updateComputerCoinDisplay() {
  const computerCoinDisplay = document.getElementById('computer-coin-amount');
  if (computerCoinDisplay) {
    computerCoinDisplay.textContent = computerCoins;
  }
}

// 전역 노출
window.resetCoins = resetCoins;
window.addCoins = addCoins;
window.spendCoins = spendCoins;
window.getCoinAmount = getCoinAmount;
window.updateCoinDisplay = updateCoinDisplay;
window.addComputerCoins = addComputerCoins;
window.spendComputerCoins = spendComputerCoins;
window.getComputerCoins = getComputerCoins;
window.updateComputerCoinDisplay = updateComputerCoinDisplay;
