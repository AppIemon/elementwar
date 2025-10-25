// anime.js가 존재하는지 확인
function checkAnimeExists() {
  if (typeof anime === 'undefined') {
    console.error('anime.js 라이브러리를 찾을 수 없습니다. 애니메이션이 작동하지 않을 수 있습니다.');                                                           
    return false;
  }
  return true;
}

// 모바일 디바이스 감지
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
}

// 터치 디바이스 감지
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// 애니메이션 성능 최적화를 위한 설정
function getOptimizedAnimationSettings() {
  const isMobile = isMobileDevice();
  const isTouch = isTouchDevice();
  
  return {
    particleCount: isMobile ? 15 : 30,
    particleSize: isMobile ? 3 : 6,
    animationDuration: isMobile ? 0.25 : 0.35, // 더욱 단축
    enable3D: !isMobile,
    enableComplexEffects: !isMobile
  };
}

// 파티클 효과 생성 함수 (모바일 최적화)
function createParticleEffect(x, y, color = '#ffffff', count = 20, size = 4) {
  const settings = getOptimizedAnimationSettings();
  const optimizedCount = Math.min(count, settings.particleCount);
  const optimizedSize = settings.particleSize;
  
  const particles = [];
  for (let i = 0; i < optimizedCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = optimizedSize + 'px';
    particle.style.height = optimizedSize + 'px';
    particle.style.backgroundColor = color;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.willChange = 'transform, opacity';
    
    document.body.appendChild(particle);
    particles.push(particle);
    
    // 파티클 애니메이션 (모바일 최적화)
    const angle = (Math.PI * 2 * i) / optimizedCount;
    const distance = Math.random() * (settings.enableComplexEffects ? 100 : 60) + (settings.enableComplexEffects ? 50 : 30);
    const duration = (Math.random() * 250 + 150) * settings.animationDuration; // 더욱 단축
    
    anime({
      targets: particle,
      translateX: Math.cos(angle) * distance,
      translateY: Math.sin(angle) * distance,
      scale: [1, 0],
      opacity: [1, 0],
      duration: duration,
      easing: 'easeOutExpo',
      complete: function() {
        particle.remove();
      }
    });
  }
  return particles;
}

// 빛나는 효과 생성
function createShineEffect(element) {
  if (!element) return;
  
  element.classList.add('shine-effect');
  setTimeout(() => {
    element.classList.remove('shine-effect');
  }, 2000);
}

// 카드 등장 애니메이션 (전장 배치용)
function playCardAppearAnimation(cardElement) {
  if (!checkAnimeExists()) return;
  
  // 상대방 카드인지 확인
  const isOpponentCard = cardElement.getAttribute('data-opponent-card') === 'true' || 
                        (cardElement.style.transform && cardElement.style.transform.includes('scaleX(-1)'));
  
  // 초기 상태 설정
  cardElement.style.opacity = '0';
  if (isOpponentCard) {
    // 상대방 카드는 뒤집기 애니메이션 없이 등장
    cardElement.style.transform = 'scale(0.8) translateY(20px) scaleX(-1)';
  } else {
    cardElement.style.transform = 'scale(0.8) translateY(20px) rotateY(180deg)';
  }
  
  if (isOpponentCard) {
    // 상대방 카드는 뒤집기 없이 등장 (빛나는 효과도 제거)
    anime({
      targets: cardElement,
      opacity: [0, 1],
      scale: [0.8, 1.1, 1],
      translateY: [20, -10, 0],
      duration: 250, // 더욱 단축
      easing: 'easeOutElastic(1, .6)'
    });
  } else {
    // 내 카드는 기존 애니메이션
    anime({
      targets: cardElement,
      opacity: [0, 1],
      scale: [0.8, 1.1, 1],
      translateY: [20, -10, 0],
      rotateY: [180, 0],
      duration: 250, // 더욱 단축
      easing: 'easeOutElastic(1, .6)',
      complete: function() {
        createShineEffect(cardElement);
      }
    });
  }
}

// 카드 등장 애니메이션 (손패에서 전장으로)
function playCardEntranceAnimation(cardElement, fromHand = true) {
  if (!checkAnimeExists()) return;
  
  // 상대방 카드인지 확인
  const isOpponentCard = cardElement.getAttribute('data-opponent-card') === 'true' || 
                        (cardElement.style.transform && cardElement.style.transform.includes('scaleX(-1)'));
  
  if (fromHand) {
    // 손패에서 전장으로 이동하는 애니메이션
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 초기 상태 설정
    cardElement.style.opacity = '0';
    if (isOpponentCard) {
      // 상대방 카드는 뒤집기 애니메이션 없이 등장
      cardElement.style.transform = 'scale(0.5) scaleX(-1)';
    } else {
      cardElement.style.transform = 'scale(0.5) rotateY(90deg)';
    }
    cardElement.style.zIndex = '1000';
    
    // 등장 애니메이션
    if (isOpponentCard) {
      // 상대방 카드는 뒤집기 없이 등장 (빛나는 효과와 파티클 효과도 제거)
      anime({
        targets: cardElement,
        opacity: [0, 1],
        scale: [0.5, 1.2, 1],
        duration: 200, // 더욱 단축
        easing: 'easeOutElastic(1, .8)',
        complete: function() {
          // 최종 위치로 정착 (빛나는 효과와 파티클 효과 제거)
          anime({
            targets: cardElement,
            scale: [1, 1.05, 1],
            duration: 70, // 더욱 단축
            easing: 'easeOutQuad'
          });
        }
      });
    } else {
      // 내 카드는 기존 애니메이션
      anime({
        targets: cardElement,
        opacity: [0, 1],
        scale: [0.5, 1.2, 1],
        rotateY: [90, 0],
        duration: 200, // 더욱 단축
        easing: 'easeOutElastic(1, .8)',
        complete: function() {
          // 빛나는 효과
          createShineEffect(cardElement);
          
          // 파티클 효과
          createParticleEffect(centerX, centerY, '#3b82f6', 20, 5);
          
          // 최종 위치로 정착
          anime({
            targets: cardElement,
            scale: [1, 1.05, 1],
            duration: 70, // 더욱 단축
            easing: 'easeOutQuad'
          });
        }
      });
    }
  } else {
    // 일반 등장 애니메이션
    playCardAppearAnimation(cardElement);
  }
}

// 카드 소멸 애니메이션
function playCardDestroyAnimation(cardElement) {
  if (!checkAnimeExists()) return;
  
  const rect = cardElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 소멸 애니메이션
  anime({
    targets: cardElement,
    scale: [1, 1.2, 0],
    rotateZ: [0, 180, 360],
    opacity: [1, 0.5, 0],
    duration: 180, // 더욱 단축
    easing: 'easeInExpo',
    complete: function() {
      // 파괴 파티클 효과
      createParticleEffect(centerX, centerY, '#ef4444', 30, 6);
    }
  });
}

// 카드 클릭 애니메이션
function playCardClickAnimation(cardElement) {
  if (!checkAnimeExists()) return;
  
  anime({
    targets: cardElement,
    scale: [1, 0.95, 1.05, 1],
    rotateZ: [0, -2, 2, 0],
    duration: 100, // 더욱 단축
    easing: 'easeInOutQuad',
    complete: function() {
      createParticleEffect(
        cardElement.offsetLeft + cardElement.offsetWidth / 2,
        cardElement.offsetTop + cardElement.offsetHeight / 2,
        '#facc15',
        15,
        6
      );
    }
  });
}

// 카드 호버 애니메이션 (모바일 최적화)
function playCardHoverAnimation(cardElement, isHovering) {
  if (!checkAnimeExists()) return;
  
  const settings = getOptimizedAnimationSettings();
  
  if (isHovering) {
    const animationProps = {
      scale: 1.05,
      duration: 100, // 더욱 단축
      easing: 'easeOutQuad'
    };
    
    // 3D 효과는 데스크톱에서만
    if (settings.enable3D) {
      animationProps.rotateY = 5;
      animationProps.rotateZ = 2;
    }
    
    anime({
      targets: cardElement,
      ...animationProps
    });
  } else {
    const animationProps = {
      scale: 1,
      duration: 100, // 더욱 단축
      easing: 'easeOutQuad'
    };
    
    // 3D 효과는 데스크톱에서만
    if (settings.enable3D) {
      animationProps.rotateY = 0;
      animationProps.rotateZ = 0;
    }
    
    anime({
      targets: cardElement,
      ...animationProps
    });
  }
}

// 여러 카드 뽑기 애니메이션 함수
function showMultipleDrawAnimation(callback, drawType, cardCount) {
  console.log('[showMultipleDrawAnimation] Starting animation with drawType:', drawType, 'cardCount:', cardCount);
  
  if (!checkAnimeExists()) {
    console.log('[showMultipleDrawAnimation] anime.js not available, using fallback');
    // anime.js가 없는 경우 애니메이션 없이 콜백 실행
    const newCards = [];
    for (let i = 0; i < cardCount; i++) {
      newCards.push(createRandomCard());
    }
    if (callback && typeof callback === 'function') {
      callback(newCards);
    }
    return;
  }
  
  const container = document.getElementById('draw-animation-container');
  const animationElement = document.getElementById('draw-animation');
  const drawnCardElement = document.getElementById('drawn-card');
  
  // 애니메이션 요소들이 존재하는지 확인
  if (!container || !animationElement || !drawnCardElement) {
    console.error('[showMultipleDrawAnimation] 애니메이션 요소를 찾을 수 없습니다.', {
      container: !!container,
      animationElement: !!animationElement,
      drawnCardElement: !!drawnCardElement
    });
    const newCards = [];
    for (let i = 0; i < cardCount; i++) {
      newCards.push(createRandomCard());
    }
    if (callback && typeof callback === 'function') {
      callback(newCards);
    }
    return;
  }
  
  console.log('[showMultipleDrawAnimation] 애니메이션 요소들을 찾았습니다.');
  
  // 이미 진행 중인 애니메이션이 있는지 확인
  if (container.classList.contains('animation-in-progress')) {
    console.log('애니메이션이 이미 진행 중입니다.');
    const newCards = [];
    for (let i = 0; i < cardCount; i++) {
      newCards.push(createRandomCard());
    }
    if (callback && typeof callback === 'function') {
      setTimeout(() => callback(newCards), 100);
    }
    return;
  }
  
  // 애니메이션 중복 실행 방지 플래그 설정
  container.classList.add('animation-in-progress');
  
  // 뽑을 카드들 생성
  const newCards = [];
  for (let i = 0; i < cardCount; i++) {
    newCards.push(createRandomCard());
  }
  
  // 뽑기 종류에 따른 색상 및 효과 설정
  let packConfig = {
    basic: {
      colors: 'from-green-600 to-blue-800',
      particles: '#10b981',
      glow: '#10b981'
    },
    premium: {
      colors: 'from-blue-600 to-purple-800',
      particles: '#3b82f6',
      glow: '#3b82f6'
    },
    legend: {
      colors: 'from-purple-600 to-yellow-800',
      particles: '#facc15',
      glow: '#facc15'
    }
  };

  const config = packConfig[drawType] || packConfig.basic;
  
  // 카드팩 색상 업데이트
  const cardPack = animationElement.querySelector('.card-pack');
  if (cardPack) {
    // 기존 클래스 제거
    cardPack.className = cardPack.className.replace(/from-\w+-\d+ to-\w+-\d+/g, '');
    // 새 클래스 추가
    cardPack.classList.add(...config.colors.split(' '));
    // 그라디언트 애니메이션 추가
    cardPack.style.background = `linear-gradient(45deg, ${config.particles}, ${config.glow})`;
    cardPack.style.backgroundSize = '400% 400%';
    cardPack.style.animation = 'rainbow-bg 3s ease infinite';
  }
  
  // 카드팩 애니메이션 보여주기
  container.classList.remove('hidden');
  
  // 초기 위치 설정
  animationElement.style.transform = 'translateY(150px) scale(0.5) rotateX(60deg)';
  animationElement.style.opacity = '0';
  
  // drawnCardElement 초기화
  drawnCardElement.innerHTML = '';
  drawnCardElement.style.opacity = '0';
  drawnCardElement.style.transform = 'scale(1)';
  
  // 카드팩 등장 애니메이션 - 더 화려하게
  console.log('[showMultipleDrawAnimation] 카드팩 애니메이션 시작');
  anime({
    targets: animationElement,
    translateY: 0,
    scale: [0.5, 1.2, 1],
    rotateX: [60, 0],
    opacity: 1,
    duration: 250, // 더욱 단축
    easing: 'easeOutElastic(1, .8)',
    complete: function() {
      console.log('[showMultipleDrawAnimation] 카드팩 애니메이션 완료');
      // 파티클 효과 추가
      createParticleEffect(
        animationElement.offsetLeft + animationElement.offsetWidth / 2,
        animationElement.offsetTop + animationElement.offsetHeight / 2,
        config.particles,
        30,
        8
      );

      // 카드팩 흔들기 애니메이션 강화
      anime({
        targets: animationElement,
        rotate: [
          { value: -5, duration: 30, easing: 'easeInOutQuad' }, // 더욱 단축
          { value: 5, duration: 30, easing: 'easeInOutQuad' },
          { value: -3, duration: 30, easing: 'easeInOutQuad' },
          { value: 3, duration: 30, easing: 'easeInOutQuad' },
          { value: 0, duration: 30, easing: 'easeInOutQuad' }
        ],
        scale: [1, 1.1, 1],
        complete: function() {
          console.log('[showMultipleDrawAnimation] 카드팩 흔들기 완료, 카드 애니메이션 시작');
          // 여러 카드 뽑기 애니메이션
          showMultipleCardsAnimation(newCards, drawnCardElement, config, callback, container);
        }
      });
    }
  });
}

// 여러 카드 애니메이션 함수
function showMultipleCardsAnimation(cards, drawnCardElement, config, callback, container) {
  console.log('[showMultipleCardsAnimation] 시작, 카드 수:', cards.length);
  const cardElements = [];
  const cardSpacing = 60; // 카드 간 간격
  const startX = -((cards.length - 1) * cardSpacing) / 2;
  
  // 각 카드에 대한 HTML 생성 및 위치 설정
  cards.forEach((card, index) => {
    const cardElement = createCardElement(card, false);
    cardElement.style.position = 'absolute';
    cardElement.style.left = `${startX + index * cardSpacing}px`;
    cardElement.style.top = '0px';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.5) rotateY(180deg)';
    cardElement.style.zIndex = '10';
    cardElement.style.width = '120px';
    cardElement.style.height = '160px';
    
    drawnCardElement.appendChild(cardElement);
    cardElements.push(cardElement);
  });
  
  // 카드들이 순차적으로 나타나는 애니메이션
  cardElements.forEach((cardElement, index) => {
    setTimeout(() => {
      anime({
        targets: cardElement,
        translateY: [-30, -100],
        scale: [0.5, 1.3, 1],
        rotate: [-5, 0],
        rotateY: [180, 0],
        opacity: [0, 1],
        duration: 350, // 50% 단축
        easing: 'easeOutElastic(1, .6)',
        complete: function() {
          // 빛나는 효과 강화
          createShineEffect(cardElement);
          
          // 개별 카드 글로우 효과
          anime({
            targets: cardElement,
            boxShadow: [
              { value: `0 0 30px ${config.glow}`, duration: 120 }, // 더욱 단축
              { value: `0 0 50px ${config.glow}`, duration: 120 },
              { value: `0 0 20px ${config.glow}`, duration: 120 }
            ],
            scale: [1, 1.15, 1],
            duration: 360, // 더욱 단축
            easing: 'easeInOutQuad',
            complete: function() {
              // 최종 파티클 폭발
              createParticleEffect(
                cardElement.offsetLeft + cardElement.offsetWidth / 2,
                cardElement.offsetTop + cardElement.offsetHeight / 2,
                config.particles,
                50,
                6
              );
              
              // 마지막 카드 애니메이션이 끝나면 인벤토리 진입 애니메이션 시작
              if (index === cardElements.length - 1) {
                console.log('[showMultipleCardsAnimation] 마지막 카드 애니메이션 완료, 인벤토리 진입 애니메이션 시작');
                setTimeout(() => {
                  // 인벤토리 진입 애니메이션 실행
                  showInventoryEntryAnimation(cards, () => {
                    container.classList.add('hidden');
                    drawnCardElement.innerHTML = '';
                    drawnCardElement.style.opacity = '0';
                    drawnCardElement.style.transform = 'scale(1)';
                    
                    // 애니메이션 진행 중 플래그 제거
                    container.classList.remove('animation-in-progress');
                    
                    console.log('[showMultipleCardsAnimation] 콜백 실행');
                    if (callback && typeof callback === 'function') {
                      callback(cards);
                    }
                  });
                }, 250); // 50% 단축
              }
            }
          });
        }
      });
    }, index * 15); // 각 카드마다 15ms씩 지연 (더욱 단축)
  });
}

function showDrawAnimation(callback, drawType) {
  if (!checkAnimeExists()) {
    // anime.js가 없는 경우 애니메이션 없이 콜백 실행
    const newCard = createRandomCard();
    if (callback && typeof callback === 'function') {
      callback(newCard);
    }
    return;
  }
  
  const container = document.getElementById('draw-animation-container');
  const animationElement = document.getElementById('draw-animation');
  const drawnCardElement = document.getElementById('drawn-card');
  
  // 애니메이션 요소들이 존재하는지 확인
  if (!container || !animationElement || !drawnCardElement) {
    console.error('애니메이션 요소를 찾을 수 없습니다.');
    const newCard = createRandomCard();
    if (callback && typeof callback === 'function') {
      callback(newCard);
    }
    return;
  }
  
  // 이미 진행 중인 애니메이션이 있는지 확인
  if (container.classList.contains('animation-in-progress')) {
    console.log('애니메이션이 이미 진행 중입니다.');
    const newCard = createRandomCard();
    if (callback && typeof callback === 'function') {
      setTimeout(() => callback(newCard), 100);
    }
    return;
  }
  
  // 애니메이션 중복 실행 방지 플래그 설정
  container.classList.add('animation-in-progress');
  
  // 뽑을 카드 생성
  const newCard = createRandomCard();
  
  // 뽑기 종류에 따른 색상 및 효과 설정
  let packConfig = {
    basic: {
      colors: 'from-green-600 to-blue-800',
      particles: '#10b981',
      glow: '#10b981'
    },
    premium: {
      colors: 'from-blue-600 to-purple-800',
      particles: '#3b82f6',
      glow: '#3b82f6'
    },
    legend: {
      colors: 'from-purple-600 to-yellow-800',
      particles: '#facc15',
      glow: '#facc15'
    }
  };

  const config = packConfig[drawType] || packConfig.basic;
  
  // 카드팩 색상 업데이트
  const cardPack = animationElement.querySelector('.card-pack');
  if (cardPack) {
    // 기존 클래스 제거
    cardPack.className = cardPack.className.replace(/from-\w+-\d+ to-\w+-\d+/g, '');
    // 새 클래스 추가
    cardPack.classList.add(...config.colors.split(' '));
    // 그라디언트 애니메이션 추가
    cardPack.style.background = `linear-gradient(45deg, ${config.particles}, ${config.glow})`;
    cardPack.style.backgroundSize = '400% 400%';
    cardPack.style.animation = 'rainbow-bg 3s ease infinite';
  }
  
  // 카드팩 애니메이션 보여주기
  container.classList.remove('hidden');
  
  // 초기 위치 설정
  animationElement.style.transform = 'translateY(150px) scale(0.5) rotateX(60deg)';
  animationElement.style.opacity = '0';
  
  // 카드팩 등장 애니메이션 - 더 화려하게
  anime({
    targets: animationElement,
    translateY: 0,
    scale: [0.5, 1.2, 1],
    rotateX: [60, 0],
    opacity: 1,
    duration: 250, // 더욱 단축
    easing: 'easeOutElastic(1, .8)',
    complete: function() {
      // 파티클 효과 추가
      createParticleEffect(
        animationElement.offsetLeft + animationElement.offsetWidth / 2,
        animationElement.offsetTop + animationElement.offsetHeight / 2,
        config.particles,
        30,
        8
      );

      // 카드팩 흔들기 애니메이션 강화
      anime({
        targets: animationElement,
        rotate: [
          { value: -5, duration: 50, easing: 'easeInOutQuad' }, // 50% 단축
          { value: 5, duration: 50, easing: 'easeInOutQuad' },
          { value: -3, duration: 50, easing: 'easeInOutQuad' },
          { value: 3, duration: 50, easing: 'easeInOutQuad' },
          { value: 0, duration: 50, easing: 'easeInOutQuad' }
        ],
        scale: [1, 1.1, 1],
        complete: function() {
          // 카드 뽑기
          const cardElement = createCardElement(newCard, false);
          cardElement.style.width = '120px';
          cardElement.style.height = '160px';
          drawnCardElement.innerHTML = '';
          drawnCardElement.appendChild(cardElement);
          drawnCardElement.style.opacity = '0';
          drawnCardElement.style.transform = 'scale(0.5) rotateY(180deg)';
          
          // 카드가 패키지에서 나오는 애니메이션 - 더 화려하게
          anime({
            targets: cardElement,
            translateY: [-30, -100],
            scale: [0.5, 1.3, 1],
            rotate: [-5, 0],
            rotateY: [180, 0],
            opacity: [0, 1],
            duration: 350, // 50% 단축
            easing: 'easeOutElastic(1, .6)',
            complete: function() {
              // 빛나는 효과 강화
              createShineEffect(cardElement);
              
              anime({
                targets: cardElement,
                boxShadow: [
                  { value: `0 0 30px ${config.glow}`, duration: 200 }, // 50% 단축
                  { value: `0 0 50px ${config.glow}`, duration: 200 },
                  { value: `0 0 20px ${config.glow}`, duration: 200 }
                ],
                scale: [1, 1.15, 1],
                duration: 600, // 50% 단축
                easing: 'easeInOutQuad',
                complete: function() {
                  // 최종 파티클 폭발
                  createParticleEffect(
                    cardElement.offsetLeft + cardElement.offsetWidth / 2,
                    cardElement.offsetTop + cardElement.offsetHeight / 2,
                    config.particles,
                    50,
                    6
                  );

                  // 애니메이션 종료 후 콜백 실행
                  setTimeout(() => {
                    container.classList.add('hidden');
                    drawnCardElement.innerHTML = '';
                    drawnCardElement.style.opacity = '0';
                    drawnCardElement.style.transform = 'scale(1)';
                    
                    // 애니메이션 진행 중 플래그 제거
                    container.classList.remove('animation-in-progress');
                    
                    if (callback && typeof callback === 'function') {
                      callback(newCard);
                    }
                  }, 150); // 더욱 단축
                }
              });
            }
          });
        }
      });
    }
  });
}

function createCardDrawnHTML(card) {
  const isSynth = card.isSynthesis;
  const isMolecule = card.type === 'molecule';
  const element = card.element || {};
  
  let displaySymbol, displayNumber, displayName, elementColor;
  
  if (isMolecule) {
    // 분자 카드
    displaySymbol = card.symbol || card.name || '?';
    displayNumber = '분자';
    displayName = card.name || '분자';
    elementColor = card.color || 'bg-purple-600';
  } else if (isSynth) {
    // 합성물 카드
    displaySymbol = card.name || '합성물';
    displayNumber = '합성';
    displayName = card.name || '합성물';
    elementColor = 'bg-gradient-to-br from-yellow-400 to-orange-500';
  } else {
    // 일반 원소 카드
    displaySymbol = element.symbol || '?';
    displayNumber = element.number ? element.number + '번' : '';
    displayName = element.name || '카드';
    elementColor = element.color || 'bg-gray-700';
  }
  
  return `
    <div class="card h-full w-full ${elementColor} rounded-lg shadow-lg flex flex-col items-center justify-between p-4 text-white">
      <div class="text-center">
        <div class="text-xl font-bold">${displaySymbol}</div>
        <div class="text-sm">${displayNumber}</div>
        <div class="text-base mt-2">${displayName}</div>
      </div>
      <div class="w-full mt-auto">
        <div class="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div class="bg-red-500 h-2 rounded-full" style="width: ${card.getHealthRatio ? card.getHealthRatio() * 100 : 100}%"></div>
        </div>
        <div class="flex justify-between text-sm">
          <div class="font-bold">❤️${card.hp}</div>
          <div class="font-bold">⚔️${card.atk}</div>
        </div>
      </div>
    </div>
  `;
}

function showCardDestroyEffect(laneIndex, side) {
  const laneElement = document.getElementById(`lane-${laneIndex}`);
  const slotElement = laneElement.querySelector(`.${side}-slot`);
  
  // 카드 파괴 이펙트 애니메이션
  const destroyEffect = document.createElement('div');
  destroyEffect.className = 'absolute inset-0 flex items-center justify-center z-10';
  
  // 화면 중앙 좌표 계산
  const rect = slotElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 다층 파티클 폭발 효과
  const particleLayers = [
    { count: 30, size: 6, colors: ['#ef4444', '#f97316', '#eab308'], speed: 1.2 },
    { count: 20, size: 4, colors: ['#8b5cf6', '#ec4899', '#06b6d4'], speed: 0.8 },
    { count: 15, size: 8, colors: ['#ffffff', '#fbbf24', '#10b981'], speed: 1.5 }
  ];

  particleLayers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute rounded-full';
      particle.style.width = `${layer.size}px`;
      particle.style.height = `${layer.size}px`;
      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.zIndex = '9999';
      particle.style.pointerEvents = 'none';
    
    // 파티클 색상
      const color = layer.colors[Math.floor(Math.random() * layer.colors.length)];
      particle.style.backgroundColor = color;
      particle.style.boxShadow = `0 0 ${layer.size * 2}px ${color}`;

      document.body.appendChild(particle);
    
    // 파티클 애니메이션: 무작위 방향으로 발사
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 40;
      const duration = (Math.random() * 800 + 600) * layer.speed;
    
    anime({
      targets: particle,
      translateX: Math.cos(angle) * distance,
      translateY: Math.sin(angle) * distance,
        scale: [1, 0.3, 0],
        opacity: [1, 0.8, 0],
        rotate: Math.random() * 720,
      easing: 'easeOutExpo',
        duration: duration,
        delay: layerIndex * 100,
        complete: function() {
          particle.remove();
        }
      });
    }
  });

  // 슬롯에 파괴 효과 추가
  slotElement.appendChild(destroyEffect);
  
  // 강화된 쉐이크 효과
  slotElement.classList.add('base-damage');
  
  // 화면 전체 흔들림 효과
  document.body.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 500);
  
  // 이펙트 제거
  setTimeout(() => {
    destroyEffect.remove();
    slotElement.classList.remove('base-damage');
  }, 1500);
}

function showMoleculeAnimation(moleculeId, elementsUsed) {
  if (!checkAnimeExists()) return;
  
  // 이미 진행 중인 분자 애니메이션이 있는지 확인
  const existingContainer = document.querySelector('.molecule-animation-container');
  if (existingContainer) {
    console.log('분자 애니메이션이 이미 진행 중입니다. 기존 애니메이션을 제거합니다.');
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.className = 'molecule-animation-container fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
  container.style.background = 'radial-gradient(circle, rgba(0,0,0,0.3), rgba(0,0,0,0.8))';
  document.body.appendChild(container);
  
  // 원소 심볼들을 원 형태로 배치
  const elementsDiv = document.createElement('div');
  elementsDiv.className = 'relative w-80 h-80';
  elementsDiv.style.background = 'radial-gradient(circle, rgba(255,255,255,0.1), transparent)';
  elementsDiv.style.borderRadius = '50%';
  elementsDiv.style.border = '2px solid rgba(255,255,255,0.3)';
  container.appendChild(elementsDiv);
  
  // 각 원소에 대한 원형 배치 요소 생성
  elementsUsed.forEach((elementSymbol, index) => {
    // elementSymbol이 문자열인 경우 직접 사용, 아니면 getElementByNumber 호출
    let element;
    if (typeof elementSymbol === 'string') {
      // 문자열인 경우 원소 데이터에서 찾기
      const elementData = gameState.elementsData.find(e => e.symbol === elementSymbol);
      if (elementData) {
        element = elementData;
      } else {
        element = { symbol: elementSymbol, name: elementSymbol, color: 'bg-gray-500' };
      }
    } else {
      element = getElementByNumber(elementSymbol);
    }
    if (!element) return;
    
    // 원소가 2개인 경우 대각선으로 배치, 그 외에는 원형으로 배치
    let angle, x, y;
    if (elementsUsed.length === 2) {
      // 2개인 경우 대각선으로 배치 (왼쪽 위, 오른쪽 아래)
      angle = (index * Math.PI) + (Math.PI / 4); // 45도, 225도
      x = Math.cos(angle) * 80 + 160; // 반지름을 조금 줄임
      y = Math.sin(angle) * 80 + 160;
    } else {
      // 3개 이상인 경우 원형으로 배치
      angle = (index / elementsUsed.length) * Math.PI * 2;
      x = Math.cos(angle) * 100 + 160; // 원 중심(160,160)에서 반지름 100        
      y = Math.sin(angle) * 100 + 160;
    }
    
    const elementDiv = document.createElement('div');
    elementDiv.className = `absolute ${element.color || 'bg-gray-500'} rounded-full w-20 h-20 flex items-center justify-center text-white font-bold text-xl`;   
    elementDiv.style.left = `${x}px`;
    elementDiv.style.top = `${y}px`;
    elementDiv.style.transform = 'translate(-50%, -50%)';
    elementDiv.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    elementDiv.style.border = '2px solid rgba(255,255,255,0.3)';
    elementDiv.textContent = element.symbol;
    
    elementsDiv.appendChild(elementDiv);
    
    // 각 원소 애니메이션 - 더 화려하게
    const animationProps = {
      scale: [1, 1.3, 1],
      rotate: [0, 360],
      duration: 600,
      loop: true,
      direction: 'alternate'
    };
    
    // 원소가 2개인 경우 다른 애니메이션 적용
    if (elementsUsed.length === 2) {
      animationProps.translateX = [
        { value: (index === 0 ? -20 : 20), duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 300, easing: 'easeInQuad' }
      ];
      animationProps.translateY = [
        { value: (index === 0 ? -20 : 20), duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 300, easing: 'easeInQuad' }
      ];
    } else {
      animationProps.translateX = [
        { value: (Math.random() - 0.5) * 30, duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 300, easing: 'easeInQuad' }
      ];
      animationProps.translateY = [
        { value: (Math.random() - 0.5) * 30, duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 300, easing: 'easeInQuad' }
      ];
    }
    
    anime({
      targets: elementDiv,
      ...animationProps
    });
  });
  
  // 중앙에 결과 분자 표시
  const centerElement = document.createElement('div');
  centerElement.className = 'absolute bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-32 h-32 flex items-center justify-center text-white font-bold text-2xl';                      
  centerElement.style.left = '50%';
  centerElement.style.top = '50%';
  centerElement.style.transform = 'translate(-50%, -50%) scale(0)';
  centerElement.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4)';
  centerElement.style.border = '3px solid rgba(255,255,255,0.5)';
  centerElement.textContent = moleculeId;
  elementsDiv.appendChild(centerElement);
  
  // 중앙 원소 애니메이션
  setTimeout(() => {
    // 원소들이 중앙으로 이동하는 애니메이션 - 더 화려하게
    elementsDiv.querySelectorAll('.absolute').forEach((el, i) => {
      if (el !== centerElement) {
        // 파티클 효과 추가
        createParticleEffect(
          el.offsetLeft + el.offsetWidth / 2,
          el.offsetTop + el.offsetHeight / 2,
          '#ffffff',
          15,
          4
        );

        anime({
          targets: el,
          left: '50%',
          top: '50%',
          scale: [1, 0.5, 0],
          opacity: [1, 0.5, 0],
          rotate: [0, 180, 360],
          easing: 'easeInExpo',
          duration: 800,
          delay: i * 150
        });
      }
    });
    
    // 중앙 분자 등장 애니메이션 - 더 화려하게
    setTimeout(() => {
      // 화면 전체 파티클 효과
      createParticleEffect(
        window.innerWidth / 2,
        window.innerHeight / 2,
        '#facc15',
        100,
        6
      );

      anime({
        targets: centerElement,
        scale: [0, 2, 1.2, 1],
        opacity: [0, 1],
        rotate: [0, 360],
        easing: 'easeOutElastic(1, .8)',
        duration: 1500
      });
      
      // 빛나는 효과 - 다층으로
      setTimeout(() => {
        // 외부 글로우
        const outerGlow = document.createElement('div');
        outerGlow.className = 'absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full opacity-0';                                                                         
        outerGlow.style.transform = 'translate(-50%, -50%)';
        outerGlow.style.left = '50%';
        outerGlow.style.top = '50%';
        centerElement.appendChild(outerGlow);

        // 내부 글로우
        const innerGlow = document.createElement('div');
        innerGlow.className = 'absolute inset-0 bg-yellow-300 rounded-full opacity-0';                                                                         
        innerGlow.style.transform = 'translate(-50%, -50%)';
        innerGlow.style.left = '50%';
        innerGlow.style.top = '50%';
        centerElement.appendChild(innerGlow);
        
        anime({
          targets: [outerGlow, innerGlow],
          scale: [1, 3, 1],
          opacity: [0, 0.8, 0],
          easing: 'easeOutExpo',
          duration: 2000
        });

        // 최종 파티클 폭발
        setTimeout(() => {
          createParticleEffect(
            centerElement.offsetLeft + centerElement.offsetWidth / 2,
            centerElement.offsetTop + centerElement.offsetHeight / 2,
            '#facc15',
            80,
            8
          );
        }, 1000);
        
        // 전체 애니메이션 제거
        setTimeout(() => {
          if (container && container.parentNode) {
            container.remove();
          }
        }, 3000);
      }, 800);
    }, 1200);
        }, 1500);
}

function applyCardUpgradeAnimation(cardElement) {
  if (!checkAnimeExists()) return;

  // 카드에 업그레이드 효과 애니메이션
  const effectLayer = document.createElement('div');
  effectLayer.className = 'absolute inset-0 rounded-lg overflow-hidden';
  cardElement.appendChild(effectLayer);
  
  // 화면 중앙 좌표 계산
  const rect = cardElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 다층 파티클 효과
  const particleLayers = [
    { count: 25, size: 4, colors: ['#fbbf24', '#f59e0b'], speed: 1.0, direction: 'up' },
    { count: 20, size: 6, colors: ['#10b981', '#059669'], speed: 0.8, direction: 'out' },
    { count: 15, size: 8, colors: ['#3b82f6', '#1d4ed8'], speed: 1.2, direction: 'spiral' }
  ];

  particleLayers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
    const particle = document.createElement('div');
      particle.className = 'absolute rounded-full';
      particle.style.width = `${layer.size}px`;
      particle.style.height = `${layer.size}px`;
      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.zIndex = '9999';
      particle.style.pointerEvents = 'none';

      const color = layer.colors[Math.floor(Math.random() * layer.colors.length)];
      particle.style.backgroundColor = color;
      particle.style.boxShadow = `0 0 ${layer.size * 3}px ${color}`;

      document.body.appendChild(particle);

      let animationProps = {};
      
      if (layer.direction === 'up') {
        animationProps = {
          translateY: -120 - (Math.random() * 40),
          translateX: (Math.random() - 0.5) * 60,
          rotate: Math.random() * 360
        };
      } else if (layer.direction === 'out') {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80 + 40;
        animationProps = {
          translateX: Math.cos(angle) * distance,
          translateY: Math.sin(angle) * distance,
          rotate: Math.random() * 720
        };
      } else if (layer.direction === 'spiral') {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        animationProps = {
          translateX: Math.cos(angle) * distance,
          translateY: Math.sin(angle) * distance,
          rotate: [0, 720 + Math.random() * 360]
        };
      }
    
    anime({
      targets: particle,
        ...animationProps,
        scale: [1, 0.3, 0],
        opacity: [1, 0.8, 0],
        duration: (Math.random() * 1000 + 800) * layer.speed,
        delay: layerIndex * 100 + Math.random() * 200,
        easing: 'easeOutExpo',
      complete: function() {
        particle.remove();
      }
    });
  }
  });
  
  // 카드 빛나는 효과 강화
  anime({
    targets: cardElement,
    boxShadow: [
      { value: '0 0 20px rgba(255, 215, 0, 0.8)', duration: 400 },
      { value: '0 0 40px rgba(255, 215, 0, 1)', duration: 400 },
      { value: '0 0 60px rgba(255, 215, 0, 0.8)', duration: 400 },
      { value: '0 0 20px rgba(255, 215, 0, 0.5)', duration: 400 }
    ],
    scale: [1, 1.15, 1.05, 1],
    rotateZ: [0, 2, -2, 0],
    duration: 1600,
    easing: 'easeInOutQuad'
  });

  // 빛나는 효과 추가
  createShineEffect(cardElement);
  
  // 효과 레이어 제거
  setTimeout(() => {
    effectLayer.remove();
  }, 2000);
}

// show a quick flash when a molecule is synthesized
function showMoleculeSynthesisAnimation(laneIndex, side, card) {
  const laneEl = document.getElementById(`lane-${laneIndex}`);
  if (!laneEl) return;
  const flash = document.createElement('div');
  flash.className = 'molecule-animation molecule-flash';
  flash.textContent = card.name;
  laneEl.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
}
window.showMoleculeSynthesisAnimation = showMoleculeSynthesisAnimation;

// 카드 간 공격 애니메이션 (기지 공격이 아닌 카드 공격)
function playCardAttackAnimation(attackerCard, defenderCard, laneIndex, attackerSide) {
  if (!checkAnimeExists()) return;

  const laneElement = document.getElementById(`lane-${laneIndex}`);
  if (!laneElement) return;

  const attackerSlot = laneElement.querySelector(`.${attackerSide}-slot`);
  const defenderSlot = laneElement.querySelector(`.${attackerSide === 'player' ? 'computer' : 'player'}-slot`);

  if (!attackerSlot || !defenderSlot) return;

  // 공격자 카드 애니메이션
  const attackerCardElement = attackerSlot.querySelector('.card');
  const defenderCardElement = defenderSlot.querySelector('.card');
  
  if (attackerCardElement && defenderCardElement) {
    // 공격 준비 애니메이션 - 더 역동적으로
    anime({
      targets: attackerCardElement,
      scale: [1, 1.3, 1.1],
      translateY: [0, -15, -5],
      rotateZ: [0, 8, -3],
      duration: 120, // 더욱 단축
      easing: 'easeOutQuad',
      complete: function() {
        // 공격 발사 애니메이션 - 카드가 앞으로 돌진
        anime({
          targets: attackerCardElement,
          translateX: attackerSide === 'player' ? 30 : -30,
          translateY: [0, -8, 0],
          scale: [1.1, 1.2, 1.1],
          rotateZ: [0, 5, 0],
          duration: 80, // 더욱 단축
          easing: 'easeOutCubic',
          complete: function() {
            // 공격 이펙트 생성
            createCardAttackEffect(attackerSlot, defenderSlot, attackerCard, defenderCard);
            
            // 피격자 카드 반응 애니메이션
            anime({
              targets: defenderCardElement,
              scale: [1, 0.95, 1.05, 1],
              translateX: [0, attackerSide === 'player' ? 10 : -10, 0],
              rotateZ: [0, attackerSide === 'player' ? -5 : 5, 0],
              duration: 90, // 더욱 단축
              easing: 'easeInOutQuad'
            });
            
            // 원래 위치로 복귀
            anime({
              targets: attackerCardElement,
              translateX: 0,
              translateY: 0,
              scale: 1,
              rotateZ: 0,
              duration: 90, // 더욱 단축
              easing: 'easeInQuad'
            });
          }
        });
      }
    });
  }
}

// 전투 애니메이션 (기지 공격용)
function playAttackAnimation(attackerCard, defenderCard, laneIndex, attackerSide) {
  if (!checkAnimeExists()) return;

  const laneElement = document.getElementById(`lane-${laneIndex}`);
  if (!laneElement) return;

  const attackerSlot = laneElement.querySelector(`.${attackerSide}-slot`);
  const defenderSlot = laneElement.querySelector(`.${attackerSide === 'player' ? 'computer' : 'player'}-slot`);

  if (!attackerSlot || !defenderSlot) return;

  // 공격자 카드 애니메이션
  const attackerCardElement = attackerSlot.querySelector('.card');
  if (attackerCardElement) {
    // 공격 준비 애니메이션
    anime({
      targets: attackerCardElement,
      scale: [1, 1.2, 1],
      translateY: [0, -10, 0],
      rotateZ: [0, 5, 0],
      duration: 90, // 더욱 단축
      easing: 'easeInOutQuad',
      complete: function() {
        // 공격 발사 애니메이션
        anime({
          targets: attackerCardElement,
          translateX: attackerSide === 'player' ? 20 : -20,
          scale: [1, 1.1, 1],
          duration: 60, // 더욱 단축
          easing: 'easeOutQuad',
          complete: function() {
            // 공격 이펙트 생성
            createAttackEffect(attackerSlot, defenderSlot, attackerCard);
            
            // 원래 위치로 복귀
            anime({
              targets: attackerCardElement,
              translateX: 0,
              scale: 1,
              duration: 60, // 더욱 단축
              easing: 'easeInQuad'
            });
          }
        });
      }
    });
  }
}

// 카드 간 공격 이펙트 생성
function createCardAttackEffect(attackerSlot, defenderSlot, attackerCard, defenderCard) {
  const attackerRect = attackerSlot.getBoundingClientRect();
  const defenderRect = defenderSlot.getBoundingClientRect();
  
  const startX = attackerRect.left + attackerRect.width / 2;
  const startY = attackerRect.top + attackerRect.height / 2;
  const endX = defenderRect.left + defenderRect.width / 2;
  const endY = defenderRect.top + defenderRect.height / 2;

  // 공격자 카드의 색상에 맞는 이펙트 색상 결정
  let effectColor = '#ff6b6b';
  if (attackerCard.element && attackerCard.element.color) {
    // 원소 색상에서 이펙트 색상 추출
    const colorMap = {
      'bg-red-500': '#ff6b6b',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#10b981',
      'bg-yellow-500': '#facc15',
      'bg-purple-500': '#8b5cf6',
      'bg-pink-500': '#ec4899',
      'bg-cyan-500': '#06b6d4',
      'bg-orange-500': '#f97316'
    };
    effectColor = colorMap[attackerCard.element.color] || '#ff6b6b';
  }

  // 공격 파티클 생성 - 더 화려하게
  const attackParticle = document.createElement('div');
  attackParticle.style.position = 'fixed';
  attackParticle.style.left = startX + 'px';
  attackParticle.style.top = startY + 'px';
  attackParticle.style.width = '25px';
  attackParticle.style.height = '25px';
  attackParticle.style.background = `radial-gradient(circle, ${effectColor}, ${effectColor}80)`;
  attackParticle.style.borderRadius = '50%';
  attackParticle.style.zIndex = '9999';
  attackParticle.style.pointerEvents = 'none';
  attackParticle.style.boxShadow = `0 0 30px ${effectColor}`;
  
  document.body.appendChild(attackParticle);

  // 공격 파티클 애니메이션 - 더 역동적으로
  anime({
    targets: attackParticle,
    translateX: endX - startX,
    translateY: endY - startY,
    scale: [1, 1.8, 0.3],
    rotate: [0, 180, 360],
    duration: 175, // 50% 단축
    easing: 'easeInOutCubic',
    complete: function() {
      // 충돌 효과
      createCardCollisionEffect(endX, endY, effectColor);
      attackParticle.remove();
    }
  });

  // 추가 파티클 효과들
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const extraParticle = document.createElement('div');
      extraParticle.style.position = 'fixed';
      extraParticle.style.left = startX + 'px';
      extraParticle.style.top = startY + 'px';
      extraParticle.style.width = '8px';
      extraParticle.style.height = '8px';
      extraParticle.style.background = effectColor;
      extraParticle.style.borderRadius = '50%';
      extraParticle.style.zIndex = '9998';
      extraParticle.style.pointerEvents = 'none';
      
      document.body.appendChild(extraParticle);

      anime({
        targets: extraParticle,
        translateX: (endX - startX) + (Math.random() - 0.5) * 40,
        translateY: (endY - startY) + (Math.random() - 0.5) * 40,
        scale: [1, 0],
        opacity: [1, 0],
        duration: 120, // 더욱 단축
        delay: i * 25, // 50% 단축
        easing: 'easeOutQuad',
        complete: function() {
          extraParticle.remove();
        }
      });
    }, i * 50);
  }
}

// 공격 이펙트 생성 (기지 공격용)
function createAttackEffect(attackerSlot, defenderSlot, attackerCard) {
  const attackerRect = attackerSlot.getBoundingClientRect();
  const defenderRect = defenderSlot.getBoundingClientRect();
  
  const startX = attackerRect.left + attackerRect.width / 2;
  const startY = attackerRect.top + attackerRect.height / 2;
  const endX = defenderRect.left + defenderRect.width / 2;
  const endY = defenderRect.top + defenderRect.height / 2;

  // 공격 파티클 생성
  const attackParticle = document.createElement('div');
  attackParticle.style.position = 'fixed';
  attackParticle.style.left = startX + 'px';
  attackParticle.style.top = startY + 'px';
  attackParticle.style.width = '20px';
  attackParticle.style.height = '20px';
  attackParticle.style.background = 'radial-gradient(circle, #ff6b6b, #ee5a24)';
  attackParticle.style.borderRadius = '50%';
  attackParticle.style.zIndex = '9999';
  attackParticle.style.pointerEvents = 'none';
  attackParticle.style.boxShadow = '0 0 20px #ff6b6b';
  
  document.body.appendChild(attackParticle);

  // 공격 파티클 애니메이션
  anime({
    targets: attackParticle,
    translateX: endX - startX,
    translateY: endY - startY,
    scale: [1, 1.5, 0.5],
    duration: 400,
    easing: 'easeInOutQuad',
    complete: function() {
      // 충돌 효과
      createCollisionEffect(endX, endY);
      attackParticle.remove();
    }
  });
}

// 카드 충돌 효과 생성
function createCardCollisionEffect(x, y, effectColor) {
  // 화면 전체 파티클 효과 - 카드 색상에 맞게
  createParticleEffect(x, y, effectColor, 50, 8);
  
  // 화면 흔들림 효과 - 더 강하게
  document.body.style.animation = 'shake 0.4s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 400);

  // 충돌 지점에 추가 이펙트
  const collisionEffect = document.createElement('div');
  collisionEffect.style.position = 'fixed';
  collisionEffect.style.left = x + 'px';
  collisionEffect.style.top = y + 'px';
  collisionEffect.style.width = '60px';
  collisionEffect.style.height = '60px';
  collisionEffect.style.background = `radial-gradient(circle, ${effectColor}80, transparent)`;
  collisionEffect.style.borderRadius = '50%';
  collisionEffect.style.transform = 'translate(-50%, -50%)';
  collisionEffect.style.zIndex = '9997';
  collisionEffect.style.pointerEvents = 'none';
  
  document.body.appendChild(collisionEffect);

  anime({
    targets: collisionEffect,
    scale: [0, 2, 0],
    opacity: [1, 0.8, 0],
    duration: 600,
    easing: 'easeOutExpo',
    complete: function() {
      collisionEffect.remove();
    }
  });
}

// 충돌 효과 생성 (기지 공격용)
function createCollisionEffect(x, y) {
  // 화면 전체 파티클 효과
  createParticleEffect(x, y, '#ff6b6b', 40, 6);
  
  // 화면 흔들림 효과
  document.body.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 300);
}

// 특수능력 발동 시 카드 애니메이션
function playSpecialAbilityCardAnimation(cardElement, abilityName) {
  if (!checkAnimeExists() || !cardElement) return;
  
  // 카드가 발동하는 듯한 움직임 애니메이션
  anime({
    targets: cardElement,
    scale: [1, 1.3, 1.1, 1],
    translateY: [0, -15, -5, 0],
    rotateZ: [0, 5, -3, 0],
    boxShadow: [
      { value: '0 0 20px rgba(255, 215, 0, 0.8)', duration: 200 },
      { value: '0 0 40px rgba(255, 215, 0, 1)', duration: 300 },
      { value: '0 0 60px rgba(255, 215, 0, 0.8)', duration: 300 },
      { value: '0 0 20px rgba(255, 215, 0, 0.5)', duration: 200 }
    ],
    duration: 1000,
    easing: 'easeOutElastic(1, .6)',
    complete: function() {
      // 빛나는 효과 추가
      createShineEffect(cardElement);
    }
  });
  
  // 카드 주변에 파티클 효과
  const rect = cardElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  createParticleEffect(centerX, centerY, '#facc15', 30, 6);
}

// 특수능력별 효과 애니메이션
function playSpecialAbilityEffectAnimation(abilityName, targetElement, value) {
  if (!checkAnimeExists()) return;
  
  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  let effectConfig = getAbilityEffectConfig(abilityName, value);
  
  // 기본 파티클 효과
  createParticleEffect(centerX, centerY, effectConfig.color, effectConfig.particleCount, effectConfig.particleSize);
  
  // 특수능력별 추가 효과
  switch (abilityName) {
    case '격자 안정':
      playShieldEffect(targetElement);
      break;
    case '이온 결합':
    case '밴드갭 보호':
      playElectricResistanceEffect(targetElement);
      break;
    case '절연장벽':
      playBarrierEffect(targetElement);
      break;
    case '초경질':
      playHardnessEffect(targetElement);
      break;
    case '결정 격자':
      playReflectionEffect(targetElement);
      break;
    case '플루오린화':
    case '에칭':
    case '강산':
      playAcidEffect(targetElement);
      break;
    case '프로톤 공여':
    case '중금속 독':
      playPoisonEffect(targetElement);
      break;
    case '연소성':
    case '급격 산화':
    case '활성 산소':
      playFireEffect(targetElement);
      break;
    case '열폭발':
      playExplosionEffect(targetElement);
      break;
    case '염 효과':
    case '염기 촉매':
    case '도핑 시너지':
      playSynergyEffect(targetElement);
      break;
    case '전자 이동':
      playEnergyEffect(targetElement);
      break;
    case '광통신':
      playLightEffect(targetElement);
      break;
    case '극성 작용':
      playPolarityEffect(targetElement);
      break;
    case '이중결합 사냥':
      playOrganicHunterEffect(targetElement);
      break;
    case '프로톤 포획':
      playProtonCaptureEffect(targetElement);
      break;
    case '산화 클렌즈':
      playCleanseEffect(targetElement);
      break;
    case '가스 구름':
      playGasCloudEffect(targetElement);
      break;
    case '할로겐 돔':
    case '플루오린 돔':
      playDomeEffect(targetElement);
      break;
    case '연무':
      playSmokeEffect(targetElement);
      break;
    case '불활성':
    case '불활성 가스':
    case '비활성':
      playInertEffect(targetElement);
      break;
    case '핵화학':
      playNuclearEffect(targetElement);
      break;
    case '초강산':
    case '초플루오린화':
      playSuperAcidEffect(targetElement);
      break;
    default:
      playGenericEffect(targetElement, effectConfig);
  }
}

// 특수능력별 효과 설정 가져오기
function getAbilityEffectConfig(abilityName, value) {
  const configs = {
    '격자 안정': { color: '#3b82f6', particleCount: 25, particleSize: 6 },
    '이온 결합': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '절연장벽': { color: '#06b6d4', particleCount: 30, particleSize: 7 },
    '밴드갭 보호': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '초경질': { color: '#6b7280', particleCount: 15, particleSize: 4 },
    '결정 격자': { color: '#f59e0b', particleCount: 20, particleSize: 6 },
    '내마모': { color: '#6b7280', particleCount: 15, particleSize: 4 },
    '내열': { color: '#ef4444', particleCount: 20, particleSize: 5 },
    '플루오린화': { color: '#22c55e', particleCount: 25, particleSize: 6 },
    '에칭': { color: '#22c55e', particleCount: 25, particleSize: 6 },
    '강산': { color: '#22c55e', particleCount: 30, particleSize: 7 },
    '프로톤 공여': { color: '#84cc16', particleCount: 20, particleSize: 5 },
    '중금속 독': { color: '#84cc16', particleCount: 25, particleSize: 6 },
    '고독성': { color: '#84cc16', particleCount: 30, particleSize: 7 },
    '연소성': { color: '#ef4444', particleCount: 25, particleSize: 6 },
    '급격 산화': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '활성 산소': { color: '#f59e0b', particleCount: 30, particleSize: 7 },
    '열폭발': { color: '#ef4444', particleCount: 40, particleSize: 8 },
    '열전자 방출': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '염 효과': { color: '#fbbf24', particleCount: 20, particleSize: 5 },
    '염기 촉매': { color: '#fbbf24', particleCount: 20, particleSize: 5 },
    '도핑 시너지': { color: '#3b82f6', particleCount: 20, particleSize: 5 },
    '촉매 시너지': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '전자 이동': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '광통신': { color: '#a78bfa', particleCount: 20, particleSize: 5 },
    '광안료': { color: '#a78bfa', particleCount: 20, particleSize: 5 },
    '광촉매 개시': { color: '#a78bfa', particleCount: 25, particleSize: 6 },
    '산촉매': { color: '#22c55e', particleCount: 20, particleSize: 5 },
    '극성 작용': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '이중결합 사냥': { color: '#84cc16', particleCount: 25, particleSize: 6 },
    '프로톤 포획': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '산화 클렌즈': { color: '#10b981', particleCount: 30, particleSize: 7 },
    '가스 구름': { color: '#6b7280', particleCount: 35, particleSize: 8 },
    '할로겐 돔': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '플루오린 돔': { color: '#8b5cf6', particleCount: 30, particleSize: 7 },
    '연무': { color: '#6b7280', particleCount: 25, particleSize: 6 },
    '확산': { color: '#a78bfa', particleCount: 30, particleSize: 7 },
    '불활성': { color: '#6b7280', particleCount: 15, particleSize: 4 },
    '불활성 가스': { color: '#6b7280', particleCount: 20, particleSize: 5 },
    '비활성': { color: '#6b7280', particleCount: 15, particleSize: 4 },
    '비활성 돌파': { color: '#ef4444', particleCount: 25, particleSize: 6 },
    '용제성': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '연료봉': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '핵화학': { color: '#ef4444', particleCount: 40, particleSize: 8 },
    '전해질': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '촉매': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '친유성': { color: '#84cc16', particleCount: 20, particleSize: 5 },
    '코팅 효과': { color: '#6b7280', particleCount: 20, particleSize: 5 },
    '크로메이트 사이클': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '탈산소': { color: '#ef4444', particleCount: 25, particleSize: 6 },
    '휘발성 증기': { color: '#a78bfa', particleCount: 30, particleSize: 7 },
    'High-k 배리어': { color: '#3b82f6', particleCount: 25, particleSize: 6 },
    'π-스태킹': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '가수분해': { color: '#06b6d4', particleCount: 25, particleSize: 6 },
    '금속-탄소 결합': { color: '#6b7280', particleCount: 25, particleSize: 6 },
    '루이스 포획': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '마취 독성': { color: '#84cc16', particleCount: 25, particleSize: 6 },
    '샌드위치 결합': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '샌드위치 안정': { color: '#f59e0b', particleCount: 20, particleSize: 5 },
    '수소화': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '알킬 라디칼': { color: '#ef4444', particleCount: 20, particleSize: 5 },
    '자강 산화': { color: '#f59e0b', particleCount: 25, particleSize: 6 },
    '저온가스': { color: '#38bdf8', particleCount: 20, particleSize: 5 },
    '전자 공명': { color: '#8b5cf6', particleCount: 20, particleSize: 5 },
    '전자 공여': { color: '#06b6d4', particleCount: 20, particleSize: 5 },
    '전자 수거': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '전자결핍': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '지연 독성': { color: '#84cc16', particleCount: 25, particleSize: 6 },
    '지용성 축적': { color: '#84cc16', particleCount: 25, particleSize: 6 },
    '초강력 플루오린화': { color: '#22c55e', particleCount: 35, particleSize: 8 },
    '초강산': { color: '#ef4444', particleCount: 40, particleSize: 9 },
    '초경질': { color: '#6b7280', particleCount: 25, particleSize: 6 },
    '초플루오린화': { color: '#22c55e', particleCount: 40, particleSize: 9 },
    '와이드 밴드갭': { color: '#8b5cf6', particleCount: 25, particleSize: 6 },
    '오배위 시프트': { color: '#8b5cf6', particleCount: 25, particleSize: 6 }
  };
  
  return configs[abilityName] || { color: '#a78bfa', particleCount: 20, particleSize: 5 };
}

// 분자 특수능력 애니메이션 (간이 공용)
function playMoleculeSpecialAnimation(effectType) {
  if (!checkAnimeExists()) return;
  const x = window.innerWidth / 2;
  const y = 100; // 화면 상단 근처
  let color = '#60a5fa';
  switch (effectType) {
    case 'heal_over_time':
      color = '#10b981';
      break;
    case 'explosive_damage':
    case 'explosive':
      color = '#f59e0b';
      break;
    case 'acid_damage':
    case 'corrosive':
      color = '#22c55e';
      break;
    case 'freeze':
      color = '#38bdf8';
      break;
    case 'poison':
      color = '#84cc16';
      break;
    case 'burn':
      color = '#ef4444';
      break;
    default:
      color = '#a78bfa';
  }
  createParticleEffect(x, y, color, 60, 6);
}

// 특수능력별 구체적인 효과 애니메이션 함수들

// 보호막 효과
function playShieldEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const shield = document.createElement('div');
  shield.className = 'absolute inset-0 rounded-lg border-4 border-blue-400 opacity-0';
  shield.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)';
  targetElement.appendChild(shield);
  
  anime({
    targets: shield,
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.2, 1],
    duration: 1500,
    easing: 'easeOutExpo',
    complete: function() {
      shield.remove();
    }
  });
}

// 전기 저항 효과
function playElectricResistanceEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  // 전기 스파크 효과
  for (let i = 0; i < 5; i++) {
    const spark = document.createElement('div');
    spark.className = 'absolute w-1 h-1 bg-purple-400 rounded-full';
    spark.style.left = Math.random() * 100 + '%';
    spark.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(spark);
    
    anime({
      targets: spark,
      scale: [0, 2, 0],
      opacity: [0, 1, 0],
      duration: 300,
      delay: i * 100,
      complete: function() {
        spark.remove();
      }
    });
  }
}

// 장벽 효과
function playBarrierEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const barrier = document.createElement('div');
  barrier.className = 'absolute inset-0 rounded-lg';
  barrier.style.background = 'linear-gradient(45deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3))';
  barrier.style.border = '2px solid rgba(6, 182, 212, 0.8)';
  targetElement.appendChild(barrier);
  
  anime({
    targets: barrier,
    opacity: [0, 0.6, 0],
    scale: [0.9, 1.1, 1],
    duration: 2000,
    easing: 'easeInOutQuad',
    complete: function() {
      barrier.remove();
    }
  });
}

// 경도 효과
function playHardnessEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  targetElement.classList.add('hardness-effect');
  setTimeout(() => {
    targetElement.classList.remove('hardness-effect');
  }, 1000);
}

// 반사 효과
function playReflectionEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const reflection = document.createElement('div');
  reflection.className = 'absolute inset-0 rounded-lg';
  reflection.style.background = 'radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent)';
  targetElement.appendChild(reflection);
  
  anime({
    targets: reflection,
    opacity: [0, 0.8, 0],
    scale: [1, 1.3, 1],
    duration: 800,
    easing: 'easeOutExpo',
    complete: function() {
      reflection.remove();
    }
  });
}

// 산 효과
function playAcidEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const acid = document.createElement('div');
  acid.className = 'absolute inset-0 rounded-lg';
  acid.style.background = 'linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))';
  targetElement.appendChild(acid);
  
  anime({
    targets: acid,
    opacity: [0, 0.7, 0],
    scale: [0.8, 1.2, 1],
    duration: 1200,
    easing: 'easeInOutQuad',
    complete: function() {
      acid.remove();
    }
  });
}

// 독 효과
function playPoisonEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const poison = document.createElement('div');
  poison.className = 'absolute inset-0 rounded-lg';
  poison.style.background = 'radial-gradient(circle, rgba(132, 204, 22, 0.4), transparent)';
  targetElement.appendChild(poison);
  
  // 독 방울 효과
  for (let i = 0; i < 8; i++) {
    const drop = document.createElement('div');
    drop.className = 'absolute w-2 h-2 bg-green-500 rounded-full';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(drop);
    
    anime({
      targets: drop,
      translateY: [0, -20],
      opacity: [1, 0],
      scale: [1, 0.5],
      duration: 1000,
      delay: i * 100,
      complete: function() {
        drop.remove();
      }
    });
  }
  
  anime({
    targets: poison,
    opacity: [0, 0.6, 0],
    duration: 2000,
    complete: function() {
      poison.remove();
    }
  });
}

// 화염 효과
function playFireEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const fire = document.createElement('div');
  fire.className = 'absolute inset-0 rounded-lg';
  fire.style.background = 'linear-gradient(0deg, rgba(239, 68, 68, 0.4), rgba(245, 158, 11, 0.4))';
  targetElement.appendChild(fire);
  
  // 불꽃 효과
  for (let i = 0; i < 6; i++) {
    const flame = document.createElement('div');
    flame.className = 'absolute w-3 h-3 bg-red-500 rounded-full';
    flame.style.left = Math.random() * 100 + '%';
    flame.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(flame);
    
    anime({
      targets: flame,
      translateY: [0, -30],
      scale: [1, 1.5, 0],
      opacity: [1, 0.8, 0],
      duration: 800,
      delay: i * 150,
      complete: function() {
        flame.remove();
      }
    });
  }
  
  anime({
    targets: fire,
    opacity: [0, 0.7, 0],
    duration: 1500,
    complete: function() {
      fire.remove();
    }
  });
}

// 폭발 효과
function playExplosionEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 대형 폭발 파티클
  createParticleEffect(centerX, centerY, '#ef4444', 50, 10);
  
  // 화면 흔들림
  document.body.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 500);
}

// 시너지 효과
function playSynergyEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const synergy = document.createElement('div');
  synergy.className = 'absolute inset-0 rounded-lg';
  synergy.style.background = 'radial-gradient(circle, rgba(251, 191, 36, 0.3), rgba(59, 130, 246, 0.3))';
  targetElement.appendChild(synergy);
  
  anime({
    targets: synergy,
    opacity: [0, 0.6, 0],
    scale: [0.9, 1.1, 1],
    duration: 1500,
    easing: 'easeInOutQuad',
    complete: function() {
      synergy.remove();
    }
  });
}

// 에너지 효과
function playEnergyEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const energy = document.createElement('div');
  energy.className = 'absolute inset-0 rounded-lg';
  energy.style.background = 'linear-gradient(45deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3))';
  targetElement.appendChild(energy);
  
  // 에너지 파동 효과
  for (let i = 0; i < 3; i++) {
    const wave = document.createElement('div');
    wave.className = 'absolute inset-0 rounded-lg border-2 border-cyan-400';
    wave.style.opacity = '0';
    targetElement.appendChild(wave);
    
    anime({
      targets: wave,
      scale: [0.8, 1.3],
      opacity: [0, 0.8, 0],
      duration: 600,
      delay: i * 200,
      complete: function() {
        wave.remove();
      }
    });
  }
  
  anime({
    targets: energy,
    opacity: [0, 0.5, 0],
    duration: 1200,
    complete: function() {
      energy.remove();
    }
  });
}

// 빛 효과
function playLightEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const light = document.createElement('div');
  light.className = 'absolute inset-0 rounded-lg';
  light.style.background = 'radial-gradient(circle, rgba(167, 139, 250, 0.4), transparent)';
  targetElement.appendChild(light);
  
  anime({
    targets: light,
    opacity: [0, 0.8, 0],
    scale: [0.9, 1.2, 1],
    duration: 1000,
    easing: 'easeOutExpo',
    complete: function() {
      light.remove();
    }
  });
}

// 극성 효과
function playPolarityEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const polarity = document.createElement('div');
  polarity.className = 'absolute inset-0 rounded-lg';
  polarity.style.background = 'linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))';
  targetElement.appendChild(polarity);
  
  anime({
    targets: polarity,
    opacity: [0, 0.6, 0],
    scale: [0.8, 1.1, 1],
    duration: 1200,
    easing: 'easeInOutQuad',
    complete: function() {
      polarity.remove();
    }
  });
}

// 유기 사냥꾼 효과
function playOrganicHunterEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const hunter = document.createElement('div');
  hunter.className = 'absolute inset-0 rounded-lg';
  hunter.style.background = 'radial-gradient(circle, rgba(132, 204, 22, 0.4), transparent)';
  targetElement.appendChild(hunter);
  
  // 사냥꾼 표시 효과
  const crosshair = document.createElement('div');
  crosshair.className = 'absolute inset-0 flex items-center justify-center';
  crosshair.innerHTML = '<div class="w-8 h-8 border-2 border-green-400 rounded-full"></div>';
  targetElement.appendChild(crosshair);
  
  anime({
    targets: crosshair,
    scale: [0, 1.5, 0],
    opacity: [0, 1, 0],
    duration: 800,
    complete: function() {
      crosshair.remove();
    }
  });
  
  anime({
    targets: hunter,
    opacity: [0, 0.6, 0],
    duration: 1000,
    complete: function() {
      hunter.remove();
    }
  });
}

// 프로톤 포획 효과
function playProtonCaptureEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const proton = document.createElement('div');
  proton.className = 'absolute inset-0 rounded-lg';
  proton.style.background = 'radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent)';
  targetElement.appendChild(proton);
  
  // 프로톤 입자 효과
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute w-2 h-2 bg-cyan-400 rounded-full';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(particle);
    
    anime({
      targets: particle,
      translateX: [0, (Math.random() - 0.5) * 40],
      translateY: [0, (Math.random() - 0.5) * 40],
      scale: [1, 0],
      opacity: [1, 0],
      duration: 600,
      delay: i * 100,
      complete: function() {
        particle.remove();
      }
    });
  }
  
  anime({
    targets: proton,
    opacity: [0, 0.6, 0],
    duration: 1000,
    complete: function() {
      proton.remove();
    }
  });
}

// 정화 효과
function playCleanseEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const cleanse = document.createElement('div');
  cleanse.className = 'absolute inset-0 rounded-lg';
  cleanse.style.background = 'linear-gradient(45deg, rgba(16, 185, 129, 0.4), rgba(6, 182, 212, 0.4))';
  targetElement.appendChild(cleanse);
  
  anime({
    targets: cleanse,
    opacity: [0, 0.8, 0],
    scale: [0.9, 1.1, 1],
    duration: 1500,
    easing: 'easeInOutQuad',
    complete: function() {
      cleanse.remove();
    }
  });
}

// 가스 구름 효과
function playGasCloudEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const gas = document.createElement('div');
  gas.className = 'absolute inset-0 rounded-lg';
  gas.style.background = 'radial-gradient(circle, rgba(107, 114, 128, 0.4), transparent)';
  targetElement.appendChild(gas);
  
  // 가스 입자 효과
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute w-1 h-1 bg-gray-400 rounded-full';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(particle);
    
    anime({
      targets: particle,
      translateX: [0, (Math.random() - 0.5) * 60],
      translateY: [0, (Math.random() - 0.5) * 60],
      scale: [1, 2, 0],
      opacity: [1, 0.5, 0],
      duration: 2000,
      delay: i * 100,
      complete: function() {
        particle.remove();
      }
    });
  }
  
  anime({
    targets: gas,
    opacity: [0, 0.6, 0],
    duration: 2500,
    complete: function() {
      gas.remove();
    }
  });
}

// 돔 효과
function playDomeEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const dome = document.createElement('div');
  dome.className = 'absolute inset-0 rounded-lg';
  dome.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent)';
  dome.style.border = '2px solid rgba(139, 92, 246, 0.6)';
  targetElement.appendChild(dome);
  
  anime({
    targets: dome,
    opacity: [0, 0.7, 0],
    scale: [0.8, 1.2, 1],
    duration: 2000,
    easing: 'easeInOutQuad',
    complete: function() {
      dome.remove();
    }
  });
}

// 연무 효과
function playSmokeEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const smoke = document.createElement('div');
  smoke.className = 'absolute inset-0 rounded-lg';
  smoke.style.background = 'linear-gradient(0deg, rgba(107, 114, 128, 0.3), transparent)';
  targetElement.appendChild(smoke);
  
  // 연무 입자 효과
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute w-2 h-2 bg-gray-300 rounded-full';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(particle);
    
    anime({
      targets: particle,
      translateY: [0, -40],
      scale: [1, 1.5, 0],
      opacity: [1, 0.3, 0],
      duration: 1500,
      delay: i * 150,
      complete: function() {
        particle.remove();
      }
    });
  }
  
  anime({
    targets: smoke,
    opacity: [0, 0.5, 0],
    duration: 2000,
    complete: function() {
      smoke.remove();
    }
  });
}

// 불활성 효과
function playInertEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const inert = document.createElement('div');
  inert.className = 'absolute inset-0 rounded-lg';
  inert.style.background = 'radial-gradient(circle, rgba(107, 114, 128, 0.3), transparent)';
  targetElement.appendChild(inert);
  
  anime({
    targets: inert,
    opacity: [0, 0.5, 0],
    scale: [0.9, 1.05, 1],
    duration: 1500,
    easing: 'easeInOutQuad',
    complete: function() {
      inert.remove();
    }
  });
}

// 핵 효과
function playNuclearEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 핵 폭발 파티클
  createParticleEffect(centerX, centerY, '#ef4444', 60, 12);
  
  // 강한 화면 흔들림
  document.body.style.animation = 'shake 0.8s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 800);
}

// 초강산 효과
function playSuperAcidEffect(targetElement) {
  if (!checkAnimeExists()) return;
  
  const acid = document.createElement('div');
  acid.className = 'absolute inset-0 rounded-lg';
  acid.style.background = 'linear-gradient(45deg, rgba(239, 68, 68, 0.5), rgba(245, 158, 11, 0.5))';
  targetElement.appendChild(acid);
  
  // 강한 산성 효과
  for (let i = 0; i < 10; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'absolute w-3 h-3 bg-red-500 rounded-full';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.top = Math.random() * 100 + '%';
    targetElement.appendChild(bubble);
    
    anime({
      targets: bubble,
      scale: [0, 1.5, 0],
      opacity: [0, 0.8, 0],
      duration: 800,
      delay: i * 80,
      complete: function() {
        bubble.remove();
      }
    });
  }
  
  anime({
    targets: acid,
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.3, 1],
    duration: 1500,
    easing: 'easeOutExpo',
    complete: function() {
      acid.remove();
    }
  });
}

// 일반 효과
function playGenericEffect(targetElement, config) {
  if (!checkAnimeExists()) return;
  
  const effect = document.createElement('div');
  effect.className = 'absolute inset-0 rounded-lg';
  effect.style.background = `radial-gradient(circle, ${config.color}40, transparent)`;
  targetElement.appendChild(effect);
  
  anime({
    targets: effect,
    opacity: [0, 0.6, 0],
    scale: [0.9, 1.1, 1],
    duration: 1200,
    easing: 'easeInOutQuad',
    complete: function() {
      effect.remove();
    }
  });
}

// 데미지 애니메이션
function playDamageAnimation(targetElement, damage) {
  if (!checkAnimeExists()) return;

  // 데미지 텍스트 생성
  const damageText = document.createElement('div');
  damageText.textContent = `-${damage}`;
  damageText.style.position = 'absolute';
  damageText.style.color = '#ff6b6b';
  damageText.style.fontSize = '24px';
  damageText.style.fontWeight = 'bold';
  damageText.style.pointerEvents = 'none';
  damageText.style.zIndex = '9999';
  damageText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  
  const rect = targetElement.getBoundingClientRect();
  damageText.style.left = (rect.left + rect.width / 2) + 'px';
  damageText.style.top = (rect.top + rect.height / 2) + 'px';
  damageText.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(damageText);

  // 데미지 텍스트 애니메이션
  anime({
    targets: damageText,
    translateY: [0, -50],
    scale: [0.5, 1.2, 1],
    opacity: [1, 0.8, 0],
    duration: 1000,
    easing: 'easeOutQuad',
    complete: function() {
      damageText.remove();
    }
  });

  // 타겟 요소 흔들림
  targetElement.classList.add('base-damage');
  setTimeout(() => {
    targetElement.classList.remove('base-damage');
  }, 600);
}

// 힐 애니메이션
function playHealAnimation(targetElement, healAmount) {
  if (!checkAnimeExists()) return;

  // 힐 텍스트 생성
  const healText = document.createElement('div');
  healText.textContent = `+${healAmount}`;
  healText.style.position = 'absolute';
  healText.style.color = '#10b981';
  healText.style.fontSize = '20px';
  healText.style.fontWeight = 'bold';
  healText.style.pointerEvents = 'none';
  healText.style.zIndex = '9999';
  healText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  
  const rect = targetElement.getBoundingClientRect();
  healText.style.left = (rect.left + rect.width / 2) + 'px';
  healText.style.top = (rect.top + rect.height / 2) + 'px';
  healText.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(healText);

  // 힐 텍스트 애니메이션
  anime({
    targets: healText,
    translateY: [0, -30],
    scale: [0.8, 1.1, 1],
    opacity: [1, 0.9, 0],
    duration: 1200,
    easing: 'easeOutQuad',
    complete: function() {
      healText.remove();
    }
  });

  // 타겟 요소 힐 효과
  targetElement.classList.add('card-heal');
  setTimeout(() => {
    targetElement.classList.remove('card-heal');
  }, 1500);
}

// 모달 애니메이션
function showModalAnimation(modalElement) {
  if (!checkAnimeExists()) return;

  modalElement.classList.add('modal');
  modalElement.style.opacity = '0';
  modalElement.style.transform = 'scale(0.8) translateY(-20px)';

  anime({
    targets: modalElement,
    opacity: 1,
    scale: 1,
    translateY: 0,
    duration: 400,
    easing: 'easeOutElastic(1, .6)'
  });
}

function hideModalAnimation(modalElement, callback) {
  if (!checkAnimeExists()) {
    if (callback) callback();
    return;
  }

  anime({
    targets: modalElement,
    opacity: 0,
    scale: 0.8,
    translateY: -20,
    duration: 300,
    easing: 'easeInQuad',
    complete: function() {
      if (callback) callback();
    }
  });
}

// 애니메이션 컨테이너 정리 함수
function cleanupAnimationContainers() {
  const containers = [
    '.molecule-animation-container',
    '.batch-draw-container',
    '.inventory-entry-container',
    '.draw-animation-container'
  ];
  
  containers.forEach(selector => {
    const existing = document.querySelector(selector);
    if (existing) {
      existing.remove();
    }
  });
}

// 전역 함수로 노출
window.playAttackAnimation = playAttackAnimation;
window.playCardAttackAnimation = playCardAttackAnimation;
window.playDamageAnimation = playDamageAnimation;
window.playHealAnimation = playHealAnimation;
window.showModalAnimation = showModalAnimation;
window.hideModalAnimation = hideModalAnimation;
window.playCardAppearAnimation = playCardAppearAnimation;
window.playCardEntranceAnimation = playCardEntranceAnimation;
window.playCardDestroyAnimation = playCardDestroyAnimation;
window.playCardClickAnimation = playCardClickAnimation;
window.playCardHoverAnimation = playCardHoverAnimation;
window.createParticleEffect = createParticleEffect;
window.createShineEffect = createShineEffect;
window.createCardAttackEffect = createCardAttackEffect;
window.createCardCollisionEffect = createCardCollisionEffect;
window.showMoleculeSynthesisAnimation = typeof showMoleculeSynthesisAnimation !== 'undefined' ? showMoleculeSynthesisAnimation : undefined;
window.cleanupAnimationContainers = cleanupAnimationContainers;

// 특수능력 애니메이션 함수들 전역 노출
window.playSpecialAbilityCardAnimation = playSpecialAbilityCardAnimation;
window.playSpecialAbilityEffectAnimation = playSpecialAbilityEffectAnimation;
window.getAbilityEffectConfig = getAbilityEffectConfig;
// 배치 뽑기 애니메이션 (여러 번 뽑기)
function showBatchDrawAnimation(callback, drawType, times, cardCount) {
  console.log('[showBatchDrawAnimation] Starting batch animation with times:', times, 'cardCount:', cardCount);
  
  if (!checkAnimeExists()) {
    console.log('[showBatchDrawAnimation] anime.js not available, using fallback');
    // anime.js가 없는 경우 애니메이션 없이 콜백 실행
    const allCards = [];
    for (let batch = 0; batch < times; batch++) {
      for (let i = 0; i < cardCount; i++) {
        allCards.push(createRandomCard());
      }
    }
    if (callback && typeof callback === 'function') {
      callback(allCards);
    }
    return;
  }
  
  // 기존 배치 애니메이션 컨테이너가 있으면 제거
  const existingContainer = document.querySelector('.batch-draw-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
  container.style.background = 'radial-gradient(circle, rgba(0,0,0,0.3), rgba(0,0,0,0.8))';
  document.body.appendChild(container);

  // 배치 뽑기 애니메이션 요소 생성
  const animationElement = document.createElement('div');
  animationElement.className = 'text-center';
  animationElement.innerHTML = `
    <div class="batch-draw-container mb-8">
      <div class="text-4xl mb-4">🎴</div>
      <div class="text-2xl font-bold text-white mb-2">배치 뽑기 진행 중...</div>
      <div class="text-lg text-gray-300">${times}번 × ${cardCount}장 = ${times * cardCount}장</div>
    </div>
    <div class="progress-container w-64 mx-auto">
      <div class="bg-gray-700 rounded-full h-4 mb-2">
        <div class="batch-progress bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500" style="width: 0%"></div>
      </div>
      <div class="text-sm text-gray-400">진행률: <span class="batch-progress-text">0</span>%</div>
    </div>
  `;
  container.appendChild(animationElement);

  // 모든 카드 생성
  const allCards = [];
  for (let batch = 0; batch < times; batch++) {
    for (let i = 0; i < cardCount; i++) {
      allCards.push(createRandomCardByRarity());
    }
  }

  // 배치별 애니메이션 실행
  let currentBatch = 0;
  const totalBatches = times;
  
  function runBatchAnimation() {
    if (currentBatch >= totalBatches) {
      // 모든 배치 완료 - 인벤토리 진입 애니메이션 실행
      setTimeout(() => {
        showInventoryEntryAnimation(allCards, () => {
          container.remove();
          if (callback && typeof callback === 'function') {
            callback(allCards);
          }
        });
      }, 1000);
      return;
    }

    const progress = ((currentBatch + 1) / totalBatches) * 100;
    const progressBar = animationElement.querySelector('.batch-progress');
    const progressText = animationElement.querySelector('.batch-progress-text');
    
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
    if (progressText) {
      progressText.textContent = Math.round(progress);
    }

    // 배치별 카드 애니메이션
    const batchCards = allCards.slice(currentBatch * cardCount, (currentBatch + 1) * cardCount);
    const cardElements = [];
    
    // 카드 요소들 생성
    batchCards.forEach((card, index) => {
      const cardElement = createCardElement(card, false);
      cardElement.className = 'inline-block mx-1';
      cardElement.style.width = '80px';
      cardElement.style.height = '120px';
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'scale(0.5) rotateY(180deg)';
      cardElement.style.transition = 'all 0.3s ease';
      
      animationElement.appendChild(cardElement);
      cardElements.push(cardElement);
    });

    // 카드들이 순차적으로 나타나는 애니메이션
    cardElements.forEach((cardElement, index) => {
      setTimeout(() => {
        anime({
          targets: cardElement,
          opacity: [0, 1],
          scale: [0.5, 1.2, 1],
          rotateY: [180, 0],
          duration: 250,
          easing: 'easeOutElastic(1, .6)',
          complete: function() {
            // 빛나는 효과
            createShineEffect(cardElement);
            
            // 파티클 효과
            const rect = cardElement.getBoundingClientRect();
            createParticleEffect(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              '#3b82f6',
              20,
              4
            );
          }
        });
      }, index * 60);
    });

    // 다음 배치로
    currentBatch++;
    setTimeout(runBatchAnimation, cardElements.length * 60 + 300);
  }

  // 첫 번째 배치 시작
  setTimeout(runBatchAnimation, 300);
}

// 뽑기 결과 모달 표시
function showDrawResultModal(cards, totalCost, side) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modal.style.background = 'rgba(0, 0, 0, 0.8)';
  
  // 카드들을 등급별로 분류
  const cardsByRarity = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: []
  };
  
  cards.forEach(card => {
    const rarity = card.rarity || 'common';
    if (cardsByRarity[rarity]) {
      cardsByRarity[rarity].push(card);
    }
  });
  
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-blue-300">뽑기 완료!</h2>
        <button class="text-gray-400 hover:text-white text-2xl" onclick="this.closest('.fixed').remove()">×</button>
      </div>
      
      <div class="mb-6">
        <div class="text-lg text-green-400 mb-2">${side === 'player' ? '플레이어가' : '컴퓨터가'} ${cards.length}장의 카드를 뽑았습니다!</div>
        <div class="text-sm text-gray-400">총 비용: ${totalCost} 코인</div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3">뽑힌 카드들</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          ${cards.map(card => `
            <div class="card-result bg-gray-700 p-2 rounded text-center">
              <div class="text-sm font-bold text-${getRarityColor(card.rarity)}">${card.element.symbol}</div>
              <div class="text-xs text-gray-400">${card.element.name}</div>
              <div class="text-xs text-gray-400">${card.rarity}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="text-center">
        <button class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold" onclick="this.closest('.fixed').remove()">
          확인
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 모달 애니메이션
  if (window.showModalAnimation) {
    window.showModalAnimation(modal.querySelector('.bg-gray-800'));
  }
}

// 등급별 색상 반환
function getRarityColor(rarity) {
  const colors = {
    common: 'gray-400',
    uncommon: 'green-400',
    rare: 'blue-400',
    epic: 'purple-400',
    legendary: 'yellow-400'
  };
  return colors[rarity] || 'gray-400';
}

// 인벤토리 진입 연출 제거 (즉시 처리)
function showInventoryEntryAnimation(cards, callback) {
  // 기존에 떠 있을 수 있는 관련 컨테이너 정리만 수행
  const existingContainer = document.querySelector('.inventory-entry-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  if (typeof callback === 'function') {
    callback(cards);
  }
}

window.showDrawAnimation = showDrawAnimation;
window.showMultipleDrawAnimation = showMultipleDrawAnimation;
window.showBatchDrawAnimation = showBatchDrawAnimation;
window.showDrawResultModal = showDrawResultModal;
window.showMoleculeAnimation = showMoleculeAnimation;
window.showInventoryEntryAnimation = showInventoryEntryAnimation;
