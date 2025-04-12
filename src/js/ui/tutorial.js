// 튜토리얼 관리 스크립트

let currentTutorialStep = 1;
const totalTutorialSteps = 5;

function initTutorial() {
  // 튜토리얼 단계 버튼 이벤트 리스너 설정
  document.getElementById('prev-tutorial').addEventListener('click', prevTutorialStep);
  document.getElementById('next-tutorial').addEventListener('click', nextTutorialStep);
  document.getElementById('skip-tutorial').addEventListener('click', closeTutorial);
  
  // 단계 표시 업데이트
  document.getElementById('tutorial-total').textContent = totalTutorialSteps;
}

function showTutorial() {
  // 튜토리얼 모달 표시
  const tutorialModal = document.getElementById('tutorial-modal');
  tutorialModal.classList.remove('hidden');
  
  // 첫 단계로 초기화
  setTutorialStep(1);
}

function closeTutorial() {
  // 튜토리얼 모달 닫기
  const tutorialModal = document.getElementById('tutorial-modal');
  tutorialModal.classList.add('hidden');
  
  // 튜토리얼을 이미 봤다는 플래그 저장
  localStorage.setItem('tutorialShown', 'true');
  
  // 게임이 아직 시작되지 않았으면 시작
  if (gameState.playerHand.length === 0) {
    giveInitialCards();
  }
}

function nextTutorialStep() {
  if (currentTutorialStep < totalTutorialSteps) {
    setTutorialStep(currentTutorialStep + 1);
  } else {
    closeTutorial();
  }
}

function prevTutorialStep() {
  if (currentTutorialStep > 1) {
    setTutorialStep(currentTutorialStep - 1);
  }
}

function setTutorialStep(step) {
  // 이전 단계 숨기기
  document.querySelectorAll('.tutorial-step').forEach(stepElement => {
    stepElement.classList.add('hidden');
    stepElement.classList.remove('active');
  });
  
  // 새 단계 표시
  const newStepElement = document.querySelector(`.tutorial-step[data-step="${step}"]`);
  if (newStepElement) {
    newStepElement.classList.remove('hidden');
    setTimeout(() => {
      newStepElement.classList.add('active');
    }, 10);
  }
  
  // 현재 단계 업데이트
  currentTutorialStep = step;
  document.getElementById('tutorial-step').textContent = step;
  
  // 이전/다음 버튼 상태 업데이트
  document.getElementById('prev-tutorial').disabled = (step === 1);
  
  // 마지막 단계인 경우 "다음" 버튼 텍스트 변경
  const nextButton = document.getElementById('next-tutorial');
  if (step === totalTutorialSteps) {
    nextButton.textContent = "시작하기";
  } else {
    nextButton.textContent = "다음";
  }
}

// 튜토리얼 이미지 불러오지 않고 대체 텍스트로 표시
function setupTutorialImages() {
  document.querySelectorAll('[src^="src/images/tutorial/"]').forEach(img => {
    // 이미지를 로드하지 않고 텍스트 대체 요소로 변경
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'tutorial-image-placeholder bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 flex items-center justify-center h-40';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'text-3xl mr-2';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'text-gray-300 italic';
    
    switch (img.getAttribute('alt')) {
      case '게임 화면':
        iconSpan.textContent = '🎮';
        textSpan.textContent = "주기율표의 원소들로 전략적 배틀을 즐기세요";
        break;
      case '카드 뽑기':
        iconSpan.textContent = '🃏';
        textSpan.textContent = "코인으로 다양한 희귀도의 카드를 뽑을 수 있습니다";
        break;
      case '전투 화면':
        iconSpan.textContent = '⚔️';
        textSpan.textContent = "카드를 배치하고 전략적으로 공격하세요";
        break;
      case '분자 합성':
        iconSpan.textContent = '🧪';
        textSpan.textContent = "같은 자리에 원소를 쌓아 강력한 분자를 만드세요";
        break;
      case '카드 강화':
        iconSpan.textContent = '⚡';
        textSpan.textContent = "코인으로 카드를 강화하여 더욱 강력하게 만드세요";
        break;
      default:
        iconSpan.textContent = '📋';
        textSpan.textContent = "튜토리얼에 오신 것을 환영합니다";
    }
    
    placeholderDiv.appendChild(iconSpan);
    placeholderDiv.appendChild(textSpan);
    
    // 이미지를 대체 요소로 교체
    img.parentNode.replaceChild(placeholderDiv, img);
  });
}

// 페이지 로드 시 튜토리얼 이미지 설정
document.addEventListener('DOMContentLoaded', setupTutorialImages);
