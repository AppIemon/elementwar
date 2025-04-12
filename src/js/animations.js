// anime.js가 존재하는지 확인
function checkAnimeExists() {
  if (typeof anime === 'undefined') {
    console.error('anime.js 라이브러리를 찾을 수 없습니다. 애니메이션이 작동하지 않을 수 있습니다.');
    return false;
  }
  return true;
}

// 카드 파괴 효과 애니메이션 (수정됨)
function showCardDestroyEffect(card, laneIndex) {
  if (!checkAnimeExists()) {
    return; // anime.js가 없으면 애니메이션 생략
  }
  
  // 카드 위치 찾기
  const laneElement = document.getElementById(`lane-${laneIndex}`);
  if (!laneElement) return;
  
  const side = card.owner === 'player' ? 'player' : 'computer';
  const slotSelector = side === 'player' ? '.player-slot' : '.computer-slot';
  const cardSlot = laneElement.querySelector(slotSelector);
  if (!cardSlot) return;
  
  // 파괴 효과 엘리먼트 생성
  const effectElement = document.createElement('div');
  effectElement.className = 'absolute inset-0 z-10 overflow-hidden';
  
  // 파티클 생성
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute rounded-full';
    
    // 카드 색상 기반 파티클 생성
    const cardColor = card.element?.color || 'bg-gray-500';
    const baseColor = cardColor.replace('bg-', '');
    const colors = ['red', 'orange', 'yellow', 'gray', 'white'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.width = `${Math.random() * 5 + 2}px`;
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = randomColor;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    effectElement.appendChild(particle);
  }
  
  cardSlot.appendChild(effectElement);
  
  // 파티클 애니메이션
  const particles = effectElement.querySelectorAll('div');
  
  if (typeof anime !== 'undefined') {
    anime({
      targets: particles,
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      opacity: [1, 0],
      scale: [1, 0],
      easing: 'easeOutExpo',
      duration: 1000,
      delay: anime.stagger(20),
      complete: function() {
        if (effectElement.parentNode) {
          effectElement.remove();
        }
      }
    });
  }

  // 카드 페이드아웃 효과
  const cardElement = cardSlot.querySelector('.card');
  if (cardElement && typeof anime !== 'undefined') {
    anime({
      targets: cardElement,
      opacity: [1, 0],
      scale: [1, 0.8],
      duration: 500,
      easing: 'easeOutQuad'
    });
  }
}

function showDrawAnimation(callback, drawType) {
  if (!checkAnimeExists()) {
    // anime.js가 없는 경우 애니메이션 없이 콜백 실행
    const newCard = createRandomCardByRarity(drawType);
    if (callback && typeof callback === 'function') {
      callback(newCard);
    }
    return;
  }
  
  const container = document.getElementById('draw-animation-container');
  const animationElement = document.getElementById('draw-animation');
  const drawnCardElement = document.getElementById('drawn-card');
  
  // 뽑을 카드 생성
  const newCard = createRandomCardByRarity(drawType);
  
  // 뽑기 종류에 따른 색상 설정
  let packColors = {
    basic: 'from-green-600 to-blue-800',
    premium: 'from-blue-600 to-purple-800',
    legend: 'from-purple-600 to-yellow-800'
  };
  
  // 카드팩 색상 업데이트
  const cardPack = animationElement.querySelector('.card-pack');
  if (cardPack) {
    // 기존 클래스 제거
    cardPack.className = cardPack.className.replace(/from-\w+-\d+ to-\w+-\d+/g, '');
    // 새 클래스 추가
    cardPack.classList.add(...(packColors[drawType] || 'from-purple-600 to-blue-800').split(' '));
  }
  
  // 카드팩 애니메이션 보여주기
  container.classList.remove('hidden');
  
  // 초기 위치 설정
  animationElement.style.transform = 'translateY(100px) scale(0.8)';
  animationElement.style.opacity = '0';
  
  // 카드팩 등장 애니메이션 (단축 버전)
  anime({
    targets: animationElement,
    translateY: 0,
    scale: 1,
    opacity: 1,
    duration: 400,
    easing: 'easeOutQuad',
    complete: function() {
      // 카드 뽑기 (간소화된 애니메이션)
      const cardHTML = createCardDrawnHTML(newCard);
      drawnCardElement.innerHTML = cardHTML;
      drawnCardElement.style.opacity = '1';
      
      // 카드가 패키지에서 나오는 애니메이션
      anime({
        targets: drawnCardElement,
        translateY: [-20, -80],
        scale: [0.8, 1.1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad',
        complete: function() {
          // 애니메이션 바로 종료
          setTimeout(() => {
            container.classList.add('hidden');
            drawnCardElement.innerHTML = '';
            drawnCardElement.style.opacity = '0';
            
            if (callback && typeof callback === 'function') {
              callback(newCard);
            }
          }, 300);
        }
      });
    }
  });
}

function createCardDrawnHTML(card) {
  const elementColor = card.element.color || 'bg-gray-700';
  
  return `
    <div class="card ${elementColor} rounded-lg shadow-lg flex flex-col items-center justify-between p-3 text-white w-full h-full">
      <div class="text-center">
        <div class="text-2xl font-bold">${card.element.symbol}</div>
        <div class="text-sm">${card.element.number > 0 ? card.element.number + '번' : '분자'}</div>
        <div class="text-base mt-2">${card.element.name}</div>
      </div>
      <div class="w-full mt-auto">
        <div class="flex justify-between text-sm">
          <div>❤️${card.hp}</div>
          <div>⚔️${card.atk}</div>
        </div>
      </div>
    </div>
  `;
}

function showMoleculeAnimation(moleculeId, elementsUsed) {
  const container = document.createElement('div');
  container.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
  document.body.appendChild(container);
  
  // 원소 심볼들을 원 형태로 배치
  const elementsDiv = document.createElement('div');
  elementsDiv.className = 'relative w-64 h-64';
  container.appendChild(elementsDiv);
  
  // 각 원소에 대한 원형 배치 요소 생성
  elementsUsed.forEach((elementId, index) => {
    const element = getElementByNumber(elementId);
    if (!element) return;
    
    const angle = (index / elementsUsed.length) * Math.PI * 2;
    const x = Math.cos(angle) * 80 + 80; // 원 중심(80,80)에서 반지름 80
    const y = Math.sin(angle) * 80 + 80;
    
    const elementDiv = document.createElement('div');
    elementDiv.className = `absolute ${element.color || 'bg-gray-500'} rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-lg`;
    elementDiv.style.left = `${x}px`;
    elementDiv.style.top = `${y}px`;
    elementDiv.style.transform = 'translate(-50%, -50%)';
    elementDiv.textContent = element.symbol;
    
    elementsDiv.appendChild(elementDiv);
    
    // 각 원소 애니메이션
    anime({
      targets: elementDiv,
      translateX: [
        { value: (Math.random() - 0.5) * 20, duration: 200, easing: 'easeOutQuad' },
        { value: 0, duration: 200, easing: 'easeInQuad' }
      ],
      translateY: [
        { value: (Math.random() - 0.5) * 20, duration: 200, easing: 'easeOutQuad' },
        { value: 0, duration: 200, easing: 'easeInQuad' }
      ],
      scale: [1, 1.2, 1],
      duration: 400,
      loop: true
    });
  });
  
  // 중앙에 결과 분자 표시
  const centerElement = document.createElement('div');
  centerElement.className = 'absolute bg-yellow-600 rounded-full w-24 h-24 flex items-center justify-center text-white font-bold text-xl';
  centerElement.style.left = '50%';
  centerElement.style.top = '50%';
  centerElement.style.transform = 'translate(-50%, -50%) scale(0)';
  centerElement.textContent = moleculeId;
  elementsDiv.appendChild(centerElement);
  
  // 중앙 원소 애니메이션
  setTimeout(() => {
    // 원소들이 중앙으로 이동하는 애니메이션
    elementsDiv.querySelectorAll('.absolute').forEach((el, i) => {
      if (el !== centerElement) {
        anime({
          targets: el,
          left: '50%',
          top: '50%',
          scale: 0,
          opacity: 0,
          easing: 'easeInExpo',
          duration: 600,
          delay: i * 100
        });
      }
    });
    
    // 중앙 분자 등장 애니메이션
    setTimeout(() => {
      anime({
        targets: centerElement,
        scale: [0, 1.5, 1],
        opacity: [0, 1],
        easing: 'easeOutElastic(1, .6)',
        duration: 1200
      });
      
      // 빛나는 효과
      setTimeout(() => {
        const glowEffect = document.createElement('div');
        glowEffect.className = 'absolute inset-0 bg-yellow-400 rounded-full opacity-0';
        centerElement.appendChild(glowEffect);
        
        anime({
          targets: glowEffect,
          scale: [1, 2],
          opacity: [0.8, 0],
          easing: 'easeOutExpo',
          duration: 1000
        });
        
        // 전체 애니메이션 제거
        setTimeout(() => {
          container.remove();
        }, 1500);
      }, 600);
    }, 600);
  }, 1000);
}

function applyCardUpgradeAnimation(cardElement) {
  if (!checkAnimeExists()) {
    return; // anime.js가 없으면 애니메이션 생략
  }
  
  // 빛나는 효과 표시
  const effectElement = document.createElement('div');
  effectElement.className = 'absolute inset-0 z-10 rounded-lg';
  effectElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
  effectElement.style.background = 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,255,255,0) 70%)';
  effectElement.style.pointerEvents = 'none';
  
  cardElement.style.position = 'relative';
  cardElement.appendChild(effectElement);
  
  // 업그레이드 텍스트 효과
  const upgradeText = document.createElement('div');
  upgradeText.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-lg z-20';
  upgradeText.textContent = 'LEVEL UP!';
  upgradeText.style.textShadow = '0 0 5px gold';
  upgradeText.style.pointerEvents = 'none';
  upgradeText.style.opacity = '0';
  
  cardElement.appendChild(upgradeText);
  
  // 애니메이션 실행
  anime({
    targets: effectElement,
    opacity: [0, 1, 0],
    scale: [0.8, 1.2, 1],
    duration: 1500,
    easing: 'easeOutQuad',
    complete: function() {
      effectElement.remove();
    }
  });
  
  anime({
    targets: upgradeText,
    opacity: [0, 1, 0],
    translateY: [10, -10],
    delay: 200,
    duration: 1000,
    easing: 'easeOutQuad',
    complete: function() {
      upgradeText.remove();
    }
  });
  
  // 카드 자체에 약간의 애니메이션 추가
  anime({
    targets: cardElement,
    scale: [1, 1.1, 1],
    duration: 600,
    easing: 'easeOutElastic(1, .6)'
  });
}
