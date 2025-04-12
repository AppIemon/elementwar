/**
 * 모달 관리 모듈
 * 게임에서 사용되는 각종 모달창을 관리합니다.
 */

/**
 * 모달 관련 기능
 */

/**
 * 모달 관련 이벤트 초기화
 */
function initModalEvents() {
  // 카드 강화 모달 닫기
  const cancelUpgradeBtn = document.getElementById('cancel-upgrade-btn');
  if (cancelUpgradeBtn) {
    cancelUpgradeBtn.addEventListener('click', () => {
      document.getElementById('card-upgrade-modal').classList.add('hidden');
    });
  }

  // 튜토리얼 모달 닫기
  const skipTutorialBtn = document.getElementById('skip-tutorial');
  if (skipTutorialBtn) {
    skipTutorialBtn.addEventListener('click', () => {
      document.getElementById('tutorial-modal').classList.add('hidden');
    });
  }

  // 분자 도감 모달 닫기
  const closeCollectionBtn = document.getElementById('close-collection-modal');
  if (closeCollectionBtn) {
    closeCollectionBtn.addEventListener('click', () => {
      document.getElementById('molecule-collection-modal').classList.add('hidden');
    });
  }

  // 카드 상세 정보 모달 닫기
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const detailModal = document.getElementById('card-detail-modal');
      if (detailModal) {
        detailModal.classList.add('hidden');
      }
    });
  }

  // 게임 결과 모달 (새 게임 시작 버튼은 game.js에서 처리)
}

/**
 * 모달 표시
 * @param {string} modalId - 모달 요소 ID
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * 모달 닫기
 * @param {string} modalId - 모달 요소 ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 전역 노출
window.initModalEvents = initModalEvents;
window.showModal = showModal;
window.closeModal = closeModal;
