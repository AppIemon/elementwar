// 원소별 실제 색상 시스템
export class ElementColorSystem {
  constructor() {
    this.elementCategories = {
      // 비금속 원소
      'H': 'element-hydrogen',
      'C': 'element-carbon', 
      'N': 'element-nonmetal',
      'O': 'element-nonmetal',
      'P': 'element-nonmetal',
      'S': 'element-nonmetal',
      'Se': 'element-nonmetal',
      'Te': 'element-nonmetal',
      
      // 비활성 기체
      'He': 'element-noble-gas',
      'Ne': 'element-noble-gas',
      'Ar': 'element-noble-gas',
      'Kr': 'element-noble-gas',
      'Xe': 'element-noble-gas',
      'Rn': 'element-noble-gas',
      
      // 알칼리 금속
      'Li': 'element-alkali-metal',
      'Na': 'element-alkali-metal',
      'K': 'element-alkali-metal',
      'Rb': 'element-alkali-metal',
      'Cs': 'element-alkali-metal',
      'Fr': 'element-alkali-metal',
      
      // 알칼리 토금속
      'Be': 'element-alkaline-earth',
      'Mg': 'element-alkaline-earth',
      'Ca': 'element-alkaline-earth',
      'Sr': 'element-alkaline-earth',
      'Ba': 'element-alkaline-earth',
      'Ra': 'element-alkaline-earth',
      
      // 준금속
      'B': 'element-metalloid',
      'Si': 'element-metalloid',
      'Ge': 'element-metalloid',
      'As': 'element-metalloid',
      'Sb': 'element-metalloid',
      'Po': 'element-metalloid',
      
      // 전이 금속
      'Sc': 'element-transition-metal',
      'Ti': 'element-transition-metal',
      'V': 'element-transition-metal',
      'Cr': 'element-transition-metal',
      'Mn': 'element-transition-metal',
      'Fe': 'element-transition-metal',
      'Co': 'element-transition-metal',
      'Ni': 'element-transition-metal',
      'Cu': 'element-transition-metal',
      'Zn': 'element-transition-metal',
      'Y': 'element-transition-metal',
      'Zr': 'element-transition-metal',
      'Nb': 'element-transition-metal',
      'Mo': 'element-transition-metal',
      'Tc': 'element-transition-metal',
      'Ru': 'element-transition-metal',
      'Rh': 'element-transition-metal',
      'Pd': 'element-transition-metal',
      'Ag': 'element-transition-metal',
      'Cd': 'element-transition-metal',
      'Hf': 'element-transition-metal',
      'Ta': 'element-transition-metal',
      'W': 'element-transition-metal',
      'Re': 'element-transition-metal',
      'Os': 'element-transition-metal',
      'Ir': 'element-transition-metal',
      'Pt': 'element-transition-metal',
      'Au': 'element-gold',
      'Hg': 'element-transition-metal',
      'Rf': 'element-transition-metal',
      'Db': 'element-transition-metal',
      'Sg': 'element-transition-metal',
      'Bh': 'element-transition-metal',
      'Hs': 'element-transition-metal',
      'Mt': 'element-transition-metal',
      'Ds': 'element-transition-metal',
      'Rg': 'element-transition-metal',
      'Cn': 'element-transition-metal',
      
      // 할로겐
      'F': 'element-halogen',
      'Cl': 'element-halogen',
      'Br': 'element-halogen',
      'I': 'element-halogen',
      'At': 'element-halogen',
      'Ts': 'element-halogen',
      
      // 란타넘족
      'La': 'element-lanthanide',
      'Ce': 'element-lanthanide',
      'Pr': 'element-lanthanide',
      'Nd': 'element-lanthanide',
      'Pm': 'element-lanthanide',
      'Sm': 'element-lanthanide',
      'Eu': 'element-lanthanide',
      'Gd': 'element-lanthanide',
      'Tb': 'element-lanthanide',
      'Dy': 'element-lanthanide',
      'Ho': 'element-lanthanide',
      'Er': 'element-lanthanide',
      'Tm': 'element-lanthanide',
      'Yb': 'element-lanthanide',
      'Lu': 'element-lanthanide',
      
      // 악티늄족
      'Ac': 'element-actinide',
      'Th': 'element-actinide',
      'Pa': 'element-actinide',
      'U': 'element-uranium',
      'Np': 'element-actinide',
      'Pu': 'element-actinide',
      'Am': 'element-actinide',
      'Cm': 'element-actinide',
      'Bk': 'element-actinide',
      'Cf': 'element-actinide',
      'Es': 'element-actinide',
      'Fm': 'element-actinide',
      'Md': 'element-actinide',
      'No': 'element-actinide',
      'Lr': 'element-actinide',
      
      // 기타 금속
      'Al': 'element-other-metal',
      'Ga': 'element-other-metal',
      'In': 'element-other-metal',
      'Sn': 'element-other-metal',
      'Tl': 'element-other-metal',
      'Pb': 'element-other-metal',
      'Bi': 'element-other-metal',
      'Fl': 'element-other-metal',
      'Mc': 'element-other-metal',
      'Lv': 'element-other-metal',
      'Og': 'element-other-metal'
    };
  }

  // 원소 심볼로 카테고리 클래스 반환
  getElementCategoryClass(symbol) {
    return this.elementCategories[symbol] || 'element-other-metal';
  }

  // 원소의 전자 수에 따른 궤도 수 계산
  getElectronOrbits(atomicNumber) {
    if (atomicNumber <= 2) return 1;      // K 궤도
    if (atomicNumber <= 10) return 2;     // L 궤도
    if (atomicNumber <= 18) return 3;     // M 궤도
    if (atomicNumber <= 36) return 4;     // N 궤도
    if (atomicNumber <= 54) return 5;     // O 궤도
    if (atomicNumber <= 86) return 6;     // P 궤도
    return 7;                             // Q 궤도
  }

  // 원소의 원자 반지름에 따른 크기 계산
  getAtomicRadius(atomicNumber) {
    const baseRadius = 20;
    const radiusMultiplier = Math.log(atomicNumber) * 5;
    return Math.min(baseRadius + radiusMultiplier, 100);
  }

  // 카드에 원소별 색상 적용
  applyElementColor(cardElement, element) {
    if (!cardElement || !element) return;

    const categoryClass = this.getElementCategoryClass(element.symbol);
    
    // 기존 색상 클래스 제거
    const colorClasses = [
      'element-nonmetal', 'element-noble-gas', 'element-alkali-metal',
      'element-alkaline-earth', 'element-metalloid', 'element-transition-metal',
      'element-halogen', 'element-lanthanide', 'element-actinide',
      'element-other-metal', 'element-hydrogen', 'element-carbon',
      'element-gold', 'element-uranium'
    ];
    
    colorClasses.forEach(cls => cardElement.classList.remove(cls));
    
    // 새 색상 클래스 추가
    cardElement.classList.add(categoryClass);
    
    // 특별한 원소들에 대한 추가 효과
    if (element.symbol === 'H') {
      this.addHydrogenEffect(cardElement);
    } else if (element.symbol === 'C') {
      this.addCarbonEffect(cardElement);
    } else if (element.symbol === 'Au') {
      this.addGoldEffect(cardElement);
    } else if (element.symbol === 'U') {
      this.addUraniumEffect(cardElement);
    }
  }

  // 수소 특별 효과
  addHydrogenEffect(cardElement) {
    cardElement.style.animation = 'hydrogen-glow 2s ease-in-out infinite';
    
    // CSS 애니메이션 추가
    if (!document.getElementById('hydrogen-animation')) {
      const style = document.createElement('style');
      style.id = 'hydrogen-animation';
      style.textContent = `
        @keyframes hydrogen-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.8); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 탄소 특별 효과
  addCarbonEffect(cardElement) {
    cardElement.style.animation = 'carbon-shimmer 3s ease-in-out infinite';
    
    if (!document.getElementById('carbon-animation')) {
      const style = document.createElement('style');
      style.id = 'carbon-animation';
      style.textContent = `
        @keyframes carbon-shimmer {
          0%, 100% { box-shadow: 0 0 20px rgba(45, 55, 72, 0.5); }
          50% { box-shadow: 0 0 30px rgba(45, 55, 72, 0.8), 0 0 50px rgba(45, 55, 72, 0.3); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 금 특별 효과
  addGoldEffect(cardElement) {
    cardElement.style.animation = 'gold-sparkle 2s ease-in-out infinite';
    
    if (!document.getElementById('gold-animation')) {
      const style = document.createElement('style');
      style.id = 'gold-animation';
      style.textContent = `
        @keyframes gold-sparkle {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.9);
            transform: scale(1.02);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 우라늄 특별 효과
  addUraniumEffect(cardElement) {
    cardElement.style.animation = 'uranium-pulse 1.5s ease-in-out infinite';
    
    if (!document.getElementById('uranium-animation')) {
      const style = document.createElement('style');
      style.id = 'uranium-animation';
      style.textContent = `
        @keyframes uranium-pulse {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(196, 69, 105, 0.5);
            filter: brightness(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(196, 69, 105, 0.8);
            filter: brightness(1.2);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 원자 구조 배경 업데이트
  updateAtomicBackground(atomicNumber) {
    const background = document.getElementById('atomic-background');
    if (!background) return;

    const orbits = this.getElectronOrbits(atomicNumber);
    const radius = this.getAtomicRadius(atomicNumber);

    // 핵 크기 업데이트
    const nucleus = background.querySelector('.atomic-nucleus');
    if (nucleus) {
      nucleus.style.width = `${radius}px`;
      nucleus.style.height = `${radius}px`;
    }

    // 활성 궤도 표시
    const orbitElements = background.querySelectorAll('.electron-orbit');
    orbitElements.forEach((orbit, index) => {
      if (index < orbits) {
        orbit.style.opacity = '0.8';
        orbit.style.borderColor = 'rgba(0, 191, 255, 0.3)';
      } else {
        orbit.style.opacity = '0.2';
        orbit.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    });
  }
}

// 전역 인스턴스 생성
window.elementColorSystem = new ElementColorSystem();
