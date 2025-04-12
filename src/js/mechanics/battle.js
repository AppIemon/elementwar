/**
 * 전투 관련 기능
 */

/**
 * 전투 실행
 * 모든 레인에서의 카드 대결과 직접 공격을 처리
 */
function executeBattles() {
  let battleResults = [];
  
  battlefield.lanes.forEach((lane, laneIndex) => {
    const playerCard = lane.player;
    const computerCard = lane.computer;
    
    // 카드 vs 카드 전투
    if (playerCard && computerCard && !playerCard.isSkull && !computerCard.isSkull) {
      const playerAttackResult = executeAttack(playerCard, computerCard);
      const computerAttackResult = executeAttack(computerCard, playerCard);
      
      battleResults.push({
        lane: laneIndex,
        playerAttack: playerAttackResult,
        computerAttack: computerAttackResult
      });
      
      // 컴퓨터 카드 파괴
      if (computerCard.hp <= 0) {
        const coinReward = computerCard.element.rewardCoins || 5;
        addCoins(coinReward);
        gameState.playerScore += 1;
        
        const skullCard = createSkullCard('computer', computerCard.element);
        battlefield.lanes[laneIndex].computer = skullCard;
        
        // 파괴 이펙트
        showCardDestroyEffect(computerCard, laneIndex);
      }
      
      // 플레이어 카드 파괴
      if (playerCard.hp <= 0) {
        gameState.computerScore += 1;
        
        const skullCard = createSkullCard('player', playerCard.element);
        battlefield.lanes[laneIndex].player = skullCard;
        
        // 파괴 이펙트
        showCardDestroyEffect(playerCard, laneIndex);
      }
      
      // 손상된 카드는 마지막 데미지 턴 업데이트
      if (computerCard.hp < computerCard.maxHp) {
        computerCard.lastDamageTurn = gameState.turnCount;
      }
      if (playerCard.hp < playerCard.maxHp) {
        playerCard.lastDamageTurn = gameState.turnCount;
      }
      
      checkChemicalReactions(laneIndex);
    }
    // 플레이어 카드가 있고 컴퓨터 카드가 없거나 해골 카드인 경우
    else if (playerCard && !playerCard.isSkull && (!computerCard || computerCard.isSkull)) {
      // 컴퓨터 기지 직접 공격
      const damage = calculateBaseDamage(playerCard);
      damageBase('computer', damage);
      showMessage(`${playerCard.element.name} 카드가 적 기지에 ${damage}의 피해를 입혔습니다!`, 'success');
    }
    // 컴퓨터 카드가 있고 플레이어 카드가 없거나 해골 카드인 경우
    else if (computerCard && !computerCard.isSkull && (!playerCard || playerCard.isSkull)) {
      // 플레이어 기지 직접 공격
      const damage = calculateBaseDamage(computerCard);
      damageBase('player', damage);
      showMessage(`적 ${computerCard.element.name} 카드가 기지에 ${damage}의 피해를 입혔습니다!`, 'error');
    }
  });
  
  updateScoreDisplay();
  renderBattlefield();
}

/**
 * 카드 공격 실행
 * @param {Object} attacker - 공격하는 카드
 * @param {Object} defender - 방어하는 카드
 * @returns {Object} - 공격 결과 정보
 */
function executeAttack(attacker, defender) {
  if (!attacker || !defender || attacker.isSkull || defender.isSkull) {
    return { success: false };
  }
  
  // 기본 공격력
  let damage = attacker.atk;
  
  // 특수 효과 데미지 추가
  if (attacker.effectType === 'damage' && attacker.effectValue) {
    damage += attacker.effectValue;
  }
  
  // 방어력 계산
  let defense = 0;
  if (defender.effectType === 'defense' && defender.effectValue) {
    defense = defender.effectValue;
  }
  
  // 최종 피해량 (최소 1)
  const finalDamage = Math.max(1, damage - defense);
  
  // 체력 감소
  defender.hp = Math.max(0, defender.hp - finalDamage);
  
  // 공격 결과 반환
  return {
    success: true,
    damage: finalDamage,
    isCritical: false,
    isLethal: defender.hp <= 0
  };
}

/**
 * 기지에 피해 적용
 * @param {string} side - 'player' 또는 'computer'
 * @param {number} damage - 피해량
 */
function damageBase(side, damage) {
  // 기지 정보 접근
  const base = battlefield.bases[side];
  if (!base) return;
  
  // 체력 감소
  base.hp = Math.max(0, base.hp - damage);
  
  // 기지 표시 업데이트
  updateBaseDisplay(side, base.hp);
  
  // 체력이 0이면 게임 종료
  if (base.hp <= 0) {
    endGame(side === 'computer', side === 'player' ? 
      '승리! 적 과학 기지를 파괴했습니다!' : 
      '패배! 과학 기지가 파괴되었습니다.');
  }
}

/**
 * 기본 공격 피해 계산
 * @param {Object} card - 카드 객체
 * @returns {number} - 계산된 피해량
 */
function calculateBaseDamage(card) {
  // 기본 공격력 + 카드 공격력의 일부
  let damage = BASE_ATTACK_DAMAGE + Math.floor(card.atk / 2 * 10) / 10;
  
  // 특수 능력이나 업그레이드에 따른 추가 피해
  if (card.element.baseAttackBonus) {
    damage += Math.floor(card.element.baseAttackBonus * 10) / 10;
  }
  
  // 업그레이드된 카드 추가 피해
  const elementId = card.element.symbol;
  if (gameState.upgrades.elements[elementId] && 
      gameState.upgrades.elements[elementId].level > 0) {
    damage += gameState.upgrades.elements[elementId].level;
  }
  
  return Math.floor(damage * 10) / 10;
}

/**
 * 파괴된 카드를 해골 카드로 대체
 * @param {string} side - 'player' 또는 'computer'
 * @param {Object} originalElement - 원래 원소 정보
 * @returns {Object} - 해골 카드 객체
 */
function createSkullCard(side, originalElement) {
  return {
    id: `skull-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isSkull: true,
    side: side,
    originalElement: originalElement
  };
}

/**
 * 기지 자동 회복
 */
function healBases() {
  // 플레이어 기지 회복
  battlefield.bases.player.hp = Math.min(
    battlefield.bases.player.maxHp, 
    battlefield.bases.player.hp + BASE_HEALING_RATE
  );
  
  // 컴퓨터 기지 회복
  battlefield.bases.computer.hp = Math.min(
    battlefield.bases.computer.maxHp, 
    battlefield.bases.computer.hp + BASE_HEALING_RATE
  );
  
  // 기지 표시 업데이트
  updateBaseDisplay('player', battlefield.bases.player.hp);
  updateBaseDisplay('computer', battlefield.bases.computer.hp);
}

// 전역으로 함수 노출
window.executeBattles = executeBattles;
window.executeAttack = executeAttack;
window.damageBase = damageBase;
window.calculateBaseDamage = calculateBaseDamage;
window.createSkullCard = createSkullCard;
window.healBases = healBases;
