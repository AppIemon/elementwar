/**
 * UI 스타일 및 시각적 효과 관련 기능
 */

document.addEventListener('DOMContentLoaded', function() {
  // 선택 효과 관련 스타일 추가
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* 카드 선택 효과 */
    .card {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .card.selected {
      box-shadow: 0 0 0 4px rgba(252, 211, 77, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3);
      transform: translateY(-5px);
      z-index: 10;
    }
    
    /* 더블클릭 가이드 텍스트 */
    .card:not(.selected):hover::after {
      content: "더블클릭";
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .card:not(.selected):hover:hover::after {
      opacity: 1;
    }
    
    /* 플레이어 슬롯 하이라이트 */
    .player-slot {
      transition: all 0.3s ease;
    }
    
    .player-slot:hover {
      background-color: rgba(56, 189, 248, 0.2);
      border-radius: 0.5rem;
    }
  `;
  document.head.appendChild(styleElement);
  
  // 툴팁 추가 (카드 사용법)
  const tooltip = document.createElement('div');
  tooltip.className = 'fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-sm max-w-xs opacity-80 pointer-events-none';
  tooltip.innerHTML = '💡 사용법: 카드를 <strong>더블클릭</strong>하여 선택하고, 배치할 <strong>슬롯을 클릭</strong>하세요!';
  document.body.appendChild(tooltip);
  
  // 10초 후 툴팁 제거
  setTimeout(() => {
    tooltip.style.transition = 'opacity 1s ease';
    tooltip.style.opacity = '0';
    setTimeout(() => tooltip.remove(), 1000);
  }, 10000);
});
