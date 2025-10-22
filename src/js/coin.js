// Initial coins are set in gameState in game.js

function getCoinAmount(side = 'player') {
  return side === 'player' ? gameState.playerCoins : gameState.computerCoins;
}

function addCoins(amount, side = 'player') {
  if (side === 'player') {
    gameState.playerCoins += amount;
    updateCoinDisplay('player');
  } else {
    gameState.computerCoins += amount;
    // updateCoinDisplay('computer'); // Update if computer coins are displayed
    console.log(`Computer coins: ${gameState.computerCoins}`); // Log computer coin changes
  }
}

function spendCoins(amount, side = 'player') {
  if (getCoinAmount(side) >= amount) {
    if (side === 'player') {
      gameState.playerCoins -= amount;
      updateCoinDisplay('player');
    } else {
      gameState.computerCoins -= amount;
      // updateCoinDisplay('computer'); // Update if computer coins are displayed
      console.log(`Computer spent ${amount} coins. Remaining: ${gameState.computerCoins}`); // Log computer spending
    }
    return true;
  }
  return false;
}

function updateCoinDisplay(side = 'player') {
  if (side === 'player') {
    const coinElement = document.getElementById('coin-amount');
    if (coinElement) {
      coinElement.textContent = window.formatNumber ? window.formatNumber(gameState.playerCoins) : gameState.playerCoins;
      // Add animation on change (optional)
      coinElement.closest('.coin-display').classList.add('coin-updated');
      setTimeout(() => {
          coinElement.closest('.coin-display')?.classList.remove('coin-updated');
      }, 300);
    }
  }
  // Add similar logic for computer coin display if it exists in HTML
}

// 에너지 표시 업데이트
function updateEnergyDisplay() {
  const energyElement = document.getElementById('energy-amount');
  if (energyElement && gameState) {
    const currentEnergy = gameState.energy || 0;
    energyElement.textContent = window.formatNumber ? window.formatNumber(currentEnergy) : currentEnergy;
    // Add animation on change (optional)
    energyElement.closest('.energy-display').classList.add('energy-updated');
    setTimeout(() => {
        energyElement.closest('.energy-display')?.classList.remove('energy-updated');
    }, 300);
  }
}

// 열 표시 업데이트
function updateHeatDisplay() {
  const heatElement = document.getElementById('heat-amount');
  if (heatElement && gameState.fusionSystem) {
    const heatText = window.formatNumber ? window.formatNumber(gameState.fusionSystem.heat) : gameState.fusionSystem.heat;
    const maxHeatText = window.formatNumber ? window.formatNumber(gameState.fusionSystem.maxHeat) : gameState.fusionSystem.maxHeat;
    heatElement.textContent = `${heatText}/${maxHeatText}`;
    // Add animation on change (optional)
    heatElement.closest('.heat-display').classList.add('heat-updated');
    setTimeout(() => {
        heatElement.closest('.heat-display')?.classList.remove('heat-updated');
    }, 300);
  }
}

function resetCoins() {
  gameState.playerCoins = 10; // Starting coins
  gameState.computerCoins = 10; // Starting coins
  updateCoinDisplay('player');
  // updateCoinDisplay('computer');
}

// Add CSS for coin update animation (in index.html <style>)
/*
@keyframes coin-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.coin-updated {
  animation: coin-pulse 0.3s ease-in-out;
}
*/

// Expose functions to the global scope
window.spendCoins = spendCoins;
window.addCoins = typeof addCoins !== 'undefined' ? addCoins : undefined; // Expose if needed globally
window.updateCoinDisplay = typeof updateCoinDisplay !== 'undefined' ? updateCoinDisplay : undefined; // Expose if needed globally
window.getCoinAmount = typeof getCoinAmount !== 'undefined' ? getCoinAmount : undefined; // Expose if needed globally
window.updateEnergyDisplay = typeof updateEnergyDisplay !== 'undefined' ? updateEnergyDisplay : undefined;
window.updateHeatDisplay = typeof updateHeatDisplay !== 'undefined' ? updateHeatDisplay : undefined;
