/**
 * 2.5D 테이블 형태의 스타일 적용
 */
document.addEventListener('DOMContentLoaded', function() {
  // 배틀필드 3D 효과 향상
  const battlefield = document.getElementById('battlefield');
  if (battlefield) {
    // 배틀필드에 그림자 깊이감 추가
    battlefield.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)';
    
    // 회전 각도 조정 (식탁에 앉아있는 느낌을 강화)
    battlefield.style.transform = 'rotateX(35deg) translateY(20px)';
  }
  
  // 플레이어와 컴퓨터 기지 3D 효과 향상
  const playerBase = document.getElementById('player-base');
  const computerBase = document.getElementById('computer-base');
  
  if (playerBase) {
    const playerBaseDiv = playerBase.querySelector('div');
    if (playerBaseDiv) {
      playerBaseDiv.style.transform = 'rotateX(35deg) scale3d(1, 0.8, 1)';
      playerBaseDiv.style.transformOrigin = 'center bottom';
      playerBaseDiv.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)';
    }
  }
  
  if (computerBase) {
    const computerBaseDiv = computerBase.querySelector('div');
    if (computerBaseDiv) {
      computerBaseDiv.style.transform = 'rotateX(35deg) scale3d(1, 0.8, 1)';
      computerBaseDiv.style.transformOrigin = 'center top';
      computerBaseDiv.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)';
    }
  }
  
  // 전장 효과 추가
  const lanes = document.querySelectorAll('.battlefield-lane');
  lanes.forEach((lane, index) => {
    // 약간의 그라데이션 추가
    lane.style.background = 'linear-gradient(to bottom, rgba(55, 65, 81, 0.3), rgba(17, 24, 39, 0.3))';
    
    // 레인 사이에 약간의 그림자 효과 추가
    lane.style.boxShadow = 'inset 0 0 5px rgba(0, 0, 0, 0.2)';
    
    // 레인 번호 표시
    const laneNumber = document.createElement('div');
    laneNumber.className = 'absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400';
    laneNumber.textContent = index + 1;
    lane.appendChild(laneNumber);
  });
  
  // 카드 슬롯에 그림자 효과 추가
  const cardSlots = document.querySelectorAll('.lane-slot');
  cardSlots.forEach(slot => {
    slot.style.boxShadow = 'inset 0 0 5px rgba(0, 0, 0, 0.2)';
    slot.style.borderRadius = '0.375rem';
  });

  // 드래그 앤 드롭 관련 스타일 제거 및 수정
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    /* 카드 기본 스타일 */
    .card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative; /* Ensure relative positioning for absolute children */
      overflow: hidden; /* Hide parts of button if needed */
    }

    /* 손패에서 선택된 카드 효과 */
    .card.selected-in-hand {
      box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.8);
      transform: translateY(-5px);
    }

    /* 전장에서 선택된 카드 효과 */
    .card.selected-on-field {
      box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.8);
    }

    /* 카드 정보 버튼 스타일 */
    .card-info-button {
      position: absolute;
      bottom: 4px; /* Adjust as needed */
      right: 4px;  /* Adjust as needed */
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      cursor: pointer;
      z-index: 10; /* Ensure it's above other card content */
      border: none;
      transition: background-color 0.2s, transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .card-info-button:hover {
      transform: scale(1.1);
    }
    /* Specific colors set in ui.js based on card type */
    .element-card .card-info-button { background-color: #3b82f6; } /* blue-500 */
    .element-card .card-info-button:hover { background-color: #60a5fa; } /* blue-400 */
    .molecule-card .card-info-button { background-color: #a855f7; } /* purple-500 */
    .molecule-card .card-info-button:hover { background-color: #c084fc; } /* purple-400 */

    /* 애니메이션 효과 (기존 유지) */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .pulse-animation {
      animation: pulse 1s infinite ease-in-out;
    }

    /* 카드 힐링 효과 */
    .card-heal {
        animation: heal-pulse 1s ease-out;
    }
    @keyframes heal-pulse {
        0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); } /* green-400 */
        70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
        100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
    }

    /* 카드 업그레이드 효과 (기존 애니메이션과 별개로 추가 가능) */
    .card-upgrade-flash {
        animation: upgrade-flash 1.5s ease-out;
    }
     @keyframes upgrade-flash {
        0%, 100% { box-shadow: none; }
        50% { box-shadow: 0 0 20px 5px rgba(250, 204, 21, 0.9); } /* yellow-400 */
    }

  `;
  document.head.appendChild(styleElement);
});
