// 숫자 포맷팅 시스템 - 소숫점 한자리까지 표시
class NumberFormatting {
  constructor() {
    // 숫자 단위 매핑 (지수 -> 단위)
    this.units = {
      3: 'K',      // Thousand
      6: 'M',      // Million
      9: 'B',      // Billion
      12: 'T',     // Trillion
      15: 'Qa',    // Quadrillion
      18: 'Qi',    // Quintillion
      21: 'Sx',    // Sextillion
      24: 'Sp',    // Septillion
      27: 'Oc',    // Octillion
      30: 'No',    // Nonillion
      33: 'Dc',    // Decillion
      36: 'Ud',    // Undecillion
      39: 'Dd',    // Duodecillion
      42: 'Td',    // Tredecillion
      45: 'Qad',   // Quattuordecillion
      48: 'Qid',   // Quindecillion
      51: 'Sxd',   // Sexdecillion
      54: 'Spd',   // Septendecillion
      57: 'Ocd',   // Octodecillion
      60: 'Nod',   // Novemdecillion
      63: 'Vg',    // Vigintillion
      66: 'Uvg',   // Unvigintillion
      69: 'Dvg',   // Duovigintillion
      72: 'Tvg',   // Tresvigintillion
      75: 'Qavg',  // Quattuorvigintillion
      78: 'Qivg',  // Quinvigintillion
      81: 'Sxvg',  // Sexvigintillion
      84: 'Spvg',  // Septenvigintillion
      87: 'Ocvg',  // Octovigintillion
      90: 'Novg',  // Novemvigintillion
      93: 'Tg',    // Trigintillion
      96: 'Utg'    // Untrigintillion
    };
  }

  // 숫자를 포맷팅된 문자열로 변환 (소숫점 한자리까지)
  formatNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) {
      return '0';
    }

    // 0인 경우
    if (number === 0) {
      return '0';
    }

    // 음수 처리
    const isNegative = number < 0;
    const absNumber = Math.abs(number);

    // 1000 미만인 경우 그대로 반환 (소숫점 한자리까지)
    if (absNumber < 1000) {
      return (isNegative ? '-' : '') + absNumber.toFixed(1);
    }

    // 지수 계산
    const exponent = Math.floor(Math.log10(absNumber));
    const unitExponent = Math.floor(exponent / 3) * 3;
    
    // 단위 찾기
    const unit = this.units[unitExponent];
    if (!unit) {
      // 96 이상의 지수인 경우 Utg 사용
      return (isNegative ? '-' : '') + (absNumber / Math.pow(10, 96)).toFixed(1) + 'Utg';
    }

    // 정규화된 숫자 계산 (소숫점 한자리까지)
    const normalizedNumber = absNumber / Math.pow(10, unitExponent);
    const formattedNumber = normalizedNumber.toFixed(1);

    return (isNegative ? '-' : '') + formattedNumber + unit;
  }

  // 큰 숫자를 Utg 단위로 변환 (기지 체력용)
  formatToUtg(number) {
    if (typeof number !== 'number' || isNaN(number)) {
      return '0Utg';
    }

    if (number === 0) {
      return '0Utg';
    }

    const isNegative = number < 0;
    const absNumber = Math.abs(number);

    // 10^96으로 나누어 Utg 단위로 변환
    const utgValue = absNumber / Math.pow(10, 96);
    const formattedValue = utgValue.toFixed(1);

    return (isNegative ? '-' : '') + formattedValue + 'Utg';
  }

  // 문자열에서 숫자 추출하여 포맷팅
  formatStringNumber(str) {
    const number = parseFloat(str);
    return this.formatNumber(number);
  }

  // HTML 요소의 텍스트 내용을 포맷팅
  formatElementText(element) {
    if (!element) return;
    
    const text = element.textContent;
    const number = parseFloat(text);
    
    if (!isNaN(number)) {
      element.textContent = this.formatNumber(number);
    }
  }

  // 모든 숫자 표시 요소를 포맷팅
  formatAllNumbers() {
    // 카드의 HP, ATK 표시
    document.querySelectorAll('.card').forEach(card => {
      const hpElement = card.querySelector('[class*="❤️"]');
      const atkElement = card.querySelector('[class*="⚔️"]');
      
      if (hpElement) {
        const hpText = hpElement.textContent;
        const hpMatch = hpText.match(/(\d+)/);
        if (hpMatch) {
          const hpNumber = parseInt(hpMatch[1]);
          hpElement.textContent = hpText.replace(/\d+/, this.formatNumber(hpNumber));
        }
      }
      
      if (atkElement) {
        const atkText = atkElement.textContent;
        const atkMatch = atkText.match(/(\d+)/);
        if (atkMatch) {
          const atkNumber = parseInt(atkMatch[1]);
          atkElement.textContent = atkText.replace(/\d+/, this.formatNumber(atkNumber));
        }
      }
    });

    // 기지 체력 표시
    const playerBaseHp = document.getElementById('player-base-hp');
    const computerBaseHp = document.getElementById('computer-base-hp');
    
    if (playerBaseHp) {
      const hpText = playerBaseHp.textContent;
      const hpNumber = parseFloat(hpText);
      if (!isNaN(hpNumber)) {
        playerBaseHp.textContent = this.formatToUtg(hpNumber);
      }
    }
    
    if (computerBaseHp) {
      const hpText = computerBaseHp.textContent;
      const hpNumber = parseFloat(hpText);
      if (!isNaN(hpNumber)) {
        computerBaseHp.textContent = this.formatToUtg(hpNumber);
      }
    }

    // 코인 표시
    const playerCoins = document.getElementById('player-coins');
    const computerCoins = document.getElementById('computer-coins');
    
    if (playerCoins) {
      const coinsText = playerCoins.textContent;
      const coinsNumber = parseFloat(coinsText);
      if (!isNaN(coinsNumber)) {
        playerCoins.textContent = this.formatNumber(coinsNumber);
      }
    }
    
    if (computerCoins) {
      const coinsText = computerCoins.textContent;
      const coinsNumber = parseFloat(coinsText);
      if (!isNaN(coinsNumber)) {
        computerCoins.textContent = this.formatNumber(coinsNumber);
      }
    }
  }
}

// 전역 인스턴스 생성
window.numberFormatting = new NumberFormatting();

// 편의 함수들
window.formatNumber = (number) => window.numberFormatting.formatNumber(number);
window.formatToUtg = (number) => window.numberFormatting.formatToUtg(number);
window.formatAllNumbers = () => window.numberFormatting.formatAllNumbers();
