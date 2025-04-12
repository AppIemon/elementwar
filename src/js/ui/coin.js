let coinAmount = 20;

function getCoinAmount() {
  return coinAmount;
}

function addCoins(amount) {
  coinAmount += amount;
  updateCoinDisplay();
}

function spendCoins(amount) {
  if (coinAmount < amount) return false;
  
  coinAmount -= amount;
  updateCoinDisplay();
  return true;
}

function resetCoins() {
  coinAmount = 20;
  updateCoinDisplay();
}

function updateCoinDisplay() {
  document.getElementById('coin-amount').textContent = coinAmount;
}
