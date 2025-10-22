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
    giveInitialCardsAndCoins();
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

// 튜토리얼 이미지 자리 표시자를 실제 텍스트로 대체
function setupTutorialImages() {
  document.querySelectorAll('[src^="src/images/tutorial/"]').forEach(img => {
    const placeholderText = document.createElement('span');
    switch (img.getAttribute('alt')) {
      case '게임 화면':
        placeholderText.textContent = "게임 화면 이미지 (아직 로드되지 않음)";
        break;
      case '카드 뽑기':
        placeholderText.textContent = "카드 뽑기 방법 설명";
        break;
      case '전투 화면':
        placeholderText.textContent = "전투 진행 방식 설명";
        break;
      case '분자 합성':
        placeholderText.textContent = "분자 합성 과정 설명";
        break;
      case '카드 강화':
        placeholderText.textContent = "카드 강화 방법 설명";
        break;
      default:
        placeholderText.textContent = "튜토리얼 이미지";
    }
    
    img.parentNode.insertBefore(placeholderText, img);
    img.style.display = 'none';
  });
}

// 페이지 로드 시 튜토리얼 이미지 설정
document.addEventListener('DOMContentLoaded', setupTutorialImages);

// Expose functions to the global scope
window.showTutorial = showTutorial;
window.initializeTutorial = initTutorial;
