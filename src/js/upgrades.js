// 업그레이드 시스템 관리

// 원소 업그레이드 정보
const elementUpgrades = {
  // 수소
  "H": {
    name: "수소",
    baseUpgradeCost: 15,
    costMultiplier: 1.4,
    maxLevel: 5,
    upgrades: [
      { level: 1, description: "공격력 +1, 체력 +1" },
      { level: 2, description: "공격력 +2, 체력 +3" },
      { level: 3, description: "특수 능력: 빠른 이동 (첫 턴에 사용시 30% 확률로 추가 행동)" },
      { level: 4, description: "공격력 +3, 체력 +5" },
      { level: 5, description: "특수 능력 강화: 50% 확률로 추가 행동, 공격력 +5" }
    ],
    specialAbility: {
      name: "빠른 이동",
      description: "첫 턴에 사용시 30% 확률로 추가 행동",
      effect: function(card) {
        // 특수 능력 효과 구현
        const isFirstTurn = gameState.turnCount <= 2;
        if (!isFirstTurn) return false;
        
        // 레벨에 따라 확률 조정
        let chance = 0.3; // 기본 30%
        if (card.upgradeLevel >= 5) {
          chance = 0.5; // 레벨 5에서는 50%
        }
        
        if (Math.random() < chance) {
          // 추가 행동 부여
          card.addEffect({
            name: 'quick_move',
            description: '추가 행동',
            duration: 1,
            extraAction: true
          });
          return true;
        }
        return false;
      }
    }
  },
  // 헬륨
  "He": {
    name: "헬륨",
    baseUpgradeCost: 12,
    costMultiplier: 1.3,
    maxLevel: 5,
    upgrades: [
      { level: 1, description: "체력 +3" },
      { level: 2, description: "체력 +5" },
      { level: 3, description: "특수 능력: 부력 (데미지 감소 20%)" },
      { level: 4, description: "체력 +8" },
      { level: 5, description: "특수 능력 강화: 데미지 감소 40%, 체력 +10" }
    ],
    specialAbility: {
      name: "부력",
      description: "데미지 감소 20%",
      effect: function(card) {
        // 특수 능력 효과 구현
      }
    }
  },
  // 리튬
  "Li": {
    name: "리튬",
    baseUpgradeCost: 18,
    costMultiplier: 1.5,
    maxLevel: 5,
    upgrades: [
      { level: 1, description: "공격력 +2, 체력 +1" },
      { level: 2, description: "공격력 +3, 체력 +2" },
      { level: 3, description: "특수 능력: 반응성 (다른 원소와의 반응 데미지 +30%)" },
      { level: 4, description: "공격력 +4, 체력 +3" },
      { level: 5, description: "특수 능력 강화: 반응 데미지 +50%, 공격력 +6" }
    ],
    specialAbility: {
      name: "반응성",
      description: "다른 원소와의 반응 데미지 +30%",
      effect: function(card) {
        // 특수 능력 효과 구현
      }
    }
  }
  // 다른 원소들의 업그레이드 정보도 추가...
};

// 분자 업그레이드 정보
const moleculeUpgrades = {
  // 물
  "H2O": {
    name: "물 (H₂O)",
    baseUpgradeCost: 25,
    costMultiplier: 1.6,
    maxLevel: 3,
    upgrades: [
      { level: 1, description: "지속 효과 기간 +1턴" },
      { level: 2, description: "효과 강도 +30%" },
      { level: 3, description: "특수 효과: 물 속성 카드 체력 재생 속도 2배" }
    ]
  },
  // 이산화탄소
  "CO2": {
    name: "이산화탄소 (CO₂)",
    baseUpgradeCost: 20,
    costMultiplier: 1.5,
    maxLevel: 3,
    upgrades: [
      { level: 1, description: "데미지 +2" },
      { level: 2, description: "지속 피해 적용" },
      { level: 3, description: "특수 효과: 화염 속성 카드에 적용시 데미지 2배" }
    ]
  },
  // 암모니아
  "NH3": {
    name: "암모니아 (NH₃)",
    baseUpgradeCost: 22,
    costMultiplier: 1.5,
    maxLevel: 3,
    upgrades: [
      { level: 1, description: "상대 카드 공격력 -1" },
      { level: 2, description: "효과 지속 시간 +2턴" },
      { level: 3, description: "특수 효과: 식물 속성 카드에 적용시 체력 회복" }
    ]
  }
  // 다른 분자들의 업그레이드 정보도 추가...
};

// 업그레이드 시스템 초기화
function initUpgradeSystem() {
  setupUpgradeEvents();
  populateUpgradeShop();
}

// 업그레이드 관련 이벤트 설정
function setupUpgradeEvents() {
  // 상점 열기 버튼 이벤트 (기존 코드)
  const openShopBtn = document.getElementById('open-shop-btn');
  if (openShopBtn) {
    openShopBtn.addEventListener('click', openUpgradeShop);
  }
  
  // 상점 닫기 버튼 이벤트 (기존 코드)
  const closeShopBtn = document.getElementById('close-shop-modal');
  if (closeShopBtn) {
    closeShopBtn.addEventListener('click', closeUpgradeShop);
  }
  
  // 탭 전환 이벤트는 제거 (업그레이드 탭이 제거되었으므로)
}

// 업그레이드 상점 열기
function openUpgradeShop() {
  refreshUpgradeShop(); // 상점 정보 갱신
  document.getElementById('upgrade-shop-modal').classList.remove('hidden');
}

// 업그레이드 상점 닫기
function closeUpgradeShop() {
  document.getElementById('upgrade-shop-modal').classList.add('hidden');
}

// 업그레이드 탭 전환 함수는 더 이상 필요 없으므로 제거 또는 비활성화
function switchUpgradeTab(tab) {
  console.log("Upgrade tabs have been removed");
  return;
}

// 업그레이드 상점 채우기
function populateUpgradeShop() {
  const elementsContent = document.getElementById('elements-content');
  if (!elementsContent) return; // 요소가 없으면 중단
  
  // 기존 내용 지우기
  elementsContent.innerHTML = '';
  
  // 원소 정보만 표시 (업그레이드 기능 대신)
  Object.keys(elementUpgrades).forEach(elementSymbol => {
    const element = elementUpgrades[elementSymbol];
    const elementInfoCard = createElementInfoCard(elementSymbol, element);
    elementsContent.appendChild(elementInfoCard);
  });
}

// 원소 정보 카드 생성 (업그레이드 대신 정보만 표시)
function createElementInfoCard(id, data) {
  const card = document.createElement('div');
  card.className = 'bg-gray-700 rounded-lg p-4 flex flex-col';
  
  card.innerHTML = `
    <div class="text-lg font-bold text-center mb-2">${data.name}</div>
    <div class="text-center mb-3">
      <span class="text-yellow-400">원소 기호: ${id}</span>
    </div>
    <div class="flex-grow">
      <p class="text-sm mb-2 text-gray-300">${data.specialAbility?.description || '특수 능력 없음'}</p>
    </div>
  `;
  
  return card;
}

// 기존 함수들을 수정하여 확인 로직 추가
function handleUpgrade(event) {
  const id = event.currentTarget.getAttribute('data-id');
  const type = event.currentTarget.getAttribute('data-type');
  const cost = parseInt(event.currentTarget.getAttribute('data-cost'));
  
  // 코인 확인
  if (getCoinAmount() < cost) {
    showMessage('코인이 부족합니다!', 'error');
    return;
  }
  
  // 업그레이드 적용
  if (type === 'element') {
    upgradeElement(id, cost);
  } else {
    upgradeMolecule(id, cost);
  }
}

// 나머지 함수들은 그대로 유지

// 업그레이드 상점 새로고침 - 간소화
function refreshUpgradeShop() {
  populateUpgradeShop();
  updateCoinDisplay();
}
