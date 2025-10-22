// 특수능력 매핑 시스템
// molecules.json의 특수능력을 코드에서 사용할 수 있는 형식으로 변환

const SPECIAL_ABILITY_MAPPING = {
  // 보호/방어 관련
  "격자 안정": {
    effect: "shield_generation",
    value: 8,
    condition: "turn_start",
    description: "턴 시작 시 보호막(HP 8%) 부여"
  },
  "이온 결합": {
    effect: "electric_resistance", 
    value: 20,
    condition: "always",
    description: "자신이 받는 '전기' 피해 -20%"
  },
  "절연장벽": {
    effect: "electric_immunity",
    value: 50,
    condition: "turn_start",
    duration: 2,
    description: "2턴 동안 아군 전체 전기·이온화 피해 50% 감소(중첩 불가)"
  },
  "밴드갭 보호": {
    effect: "electric_resistance",
    value: 40,
    condition: "always",
    description: "전기 피해 -40%"
  },
  "초경질": {
    effect: "physical_resistance",
    value: 30,
    condition: "always",
    description: "받는 물리 피해 -30%"
  },
  "결정 격자": {
    effect: "damage_reflection",
    value: 15,
    condition: "on_damage",
    description: "피격 시 반사(ATK 15%)"
  },
  "내마모": {
    effect: "durability_boost",
    value: 25,
    condition: "always",
    description: "내구도 +25%"
  },
  "내열": {
    effect: "heat_resistance",
    value: 50,
    condition: "always",
    description: "열 피해 -50%"
  },

  // 공격/피해 관련
  "플루오린화": {
    effect: "defense_reduction",
    value: 20,
    condition: "on_attack",
    duration: 2,
    description: "대상 방어 -20%(2턴)"
  },
  "에칭": {
    effect: "defense_reduction",
    value: 30,
    condition: "on_attack",
    duration: 2,
    description: "맞춘 대상 방어 -30%(2턴)"
  },
  "강산": {
    effect: "armor_piercing",
    value: 15,
    condition: "on_attack",
    description: "방어무시 15% 추가 피해"
  },
  "프로톤 공여": {
    effect: "corrosion_damage",
    value: 30,
    condition: "on_attack",
    duration: 2,
    description: "적 1명에 '부식'(턴당 ATK 30%, 2턴)"
  },
  "중금속 독": {
    effect: "poison_damage",
    value: 25,
    condition: "on_attack",
    duration: 3,
    description: "중금속 독성 피해(턴당 ATK 25%, 3턴)"
  },
  "고독성": {
    effect: "spread_poison",
    value: 2,
    condition: "on_kill",
    description: "처치 시 인접 적에게 '부식' 2중첩"
  },
  "연소성": {
    effect: "fire_damage_boost",
    value: 20,
    condition: "always",
    description: "화염 피해 +20%"
  },
  "급격 산화": {
    effect: "oxidation_damage",
    value: 35,
    condition: "on_attack",
    description: "급격 산화 피해 +35%"
  },
  "활성 산소": {
    effect: "reactive_oxygen",
    value: 40,
    condition: "on_attack",
    description: "활성 산소 피해 +40%"
  },
  "열폭발": {
    effect: "thermal_explosion",
    value: 50,
    condition: "on_death",
    description: "사망 시 열폭발 피해"
  },
  "열전자 방출": {
    effect: "thermionic_emission",
    value: 30,
    condition: "on_attack",
    description: "열전자 방출 피해 +30%"
  },

  // 버프/시너지 관련
  "염 효과": {
    effect: "salt_synergy",
    value: 8,
    condition: "turn_start",
    duration: 2,
    description: "아군 '염(무기염)' ATK +8% (2턴)"
  },
  "염기 촉매": {
    effect: "base_catalyst",
    value: 10,
    condition: "always",
    description: "아군 '염기' ATK +10%"
  },
  "도핑 시너지": {
    effect: "doping_synergy",
    value: 12,
    condition: "always",
    description: "'반도체' 아군 ATK +12%"
  },
  "촉매 시너지": {
    effect: "catalyst_synergy",
    value: 15,
    condition: "always",
    description: "촉매 효과 +15%"
  },
  "전자 이동": {
    effect: "energy_recovery",
    value: 1,
    condition: "turn_start",
    description: "아군 에너지 회복 +1"
  },
  "광통신": {
    effect: "skill_cooldown_reduction",
    value: 10,
    condition: "always",
    description: "아군 스킬 쿨타임 10% 가속"
  },
  "광안료": {
    effect: "light_pigment",
    value: 25,
    condition: "always",
    description: "광안료 효과 +25%"
  },
  "광촉매 개시": {
    effect: "photocatalyst_initiation",
    value: 30,
    condition: "turn_start",
    description: "광촉매 개시 효과 +30%"
  },
  "산촉매": {
    effect: "acid_catalyst",
    value: 1,
    condition: "on_skill_use",
    description: "아군 스킬 쿨다운 -1(자신 사용 시)"
  },

  // 디버프/상태이상 관련
  "극성 작용": {
    effect: "debuff_amplification",
    value: 25,
    condition: "on_attack",
    description: "디버프 적에게 추가 피해 +25%"
  },
  "이중결합 사냥": {
    effect: "organic_hunter",
    value: 35,
    condition: "on_attack",
    description: "'유기(지방족/방향족)' 적에게 추가 피해 +35%"
  },
  "프로톤 포획": {
    effect: "buff_removal",
    value: 1,
    condition: "on_attack",
    description: "적 버프 1개 제거"
  },
  "산화 클렌즈": {
    effect: "cleanse_debuffs",
    value: 100,
    condition: "turn_start",
    description: "아군 디버프 제거"
  },

  // 특수 효과
  "가스 구름": {
    effect: "gas_cloud",
    value: 1,
    condition: "on_death",
    duration: 1,
    description: "사망 시 '혼탁' 지대 생성(1턴)"
  },
  "할로겐 돔": {
    effect: "halogen_dome",
    value: 10,
    condition: "always",
    description: "주변 1칸 적 명중 -10%"
  },
  "플루오린 돔": {
    effect: "fluorine_dome",
    value: 15,
    condition: "always",
    description: "주변 1칸 적 명중 -15%"
  },
  "연무": {
    effect: "smoke_screen",
    value: 20,
    condition: "on_attack",
    duration: 2,
    description: "연무로 적 명중률 -20% (2턴)"
  },
  "확산": {
    effect: "spread_effect",
    value: 1,
    condition: "on_death",
    description: "사망 시 효과 확산"
  },

  // 면역/저항
  "불활성": {
    effect: "inert_immunity",
    value: 100,
    condition: "always",
    description: "'산화/환원' 디버프 면역"
  },
  "불활성 가스": {
    effect: "noble_gas_immunity",
    value: 100,
    condition: "always",
    description: "모든 디버프 면역"
  },
  "비활성": {
    effect: "inactive_immunity",
    value: 100,
    condition: "always",
    description: "자신이 '산화/환원' 디버프에 면역"
  },
  "비활성 돌파": {
    effect: "inert_penetration",
    value: 50,
    condition: "on_attack",
    description: "불활성 가스 면역 무시 +50%"
  },

  // 기타 특수 효과
  "용제성": {
    effect: "solvent_effect",
    value: 15,
    condition: "always",
    description: "용해 효과 +15%"
  },
  "연료봉": {
    effect: "fuel_rod",
    value: 30,
    condition: "always",
    description: "연료봉 효과 +30%"
  },
  "핵화학": {
    effect: "nuclear_chemistry",
    value: 50,
    condition: "on_attack",
    description: "핵화학 피해 +50%"
  },
  "전해질": {
    effect: "electrolyte_boost",
    value: 25,
    condition: "always",
    description: "전해질 효과 +25%"
  },
  "촉매": {
    effect: "catalyst_boost",
    value: 20,
    condition: "always",
    description: "촉매 효과 +20%"
  },
  "친유성": {
    effect: "lipophilic_effect",
    value: 30,
    condition: "always",
    description: "친유성 효과 +30%"
  },
  "코팅 효과": {
    effect: "coating_effect",
    value: 25,
    condition: "always",
    description: "코팅 효과 +25%"
  },
  "크로메이트 사이클": {
    effect: "chromate_cycle",
    value: 40,
    condition: "turn_start",
    description: "크로메이트 사이클 효과 +40%"
  },
  "탈산소": {
    effect: "deoxygenation",
    value: 35,
    condition: "on_attack",
    description: "탈산소 효과 +35%"
  },
  "휘발성 증기": {
    effect: "volatile_vapor",
    value: 45,
    condition: "on_attack",
    description: "휘발성 증기 피해 +45%"
  },

  // 고급 특수 효과
  "High-k 배리어": {
    effect: "high_k_barrier",
    value: 60,
    condition: "always",
    description: "High-k 배리어 보호 +60%"
  },
  "π-스태킹": {
    effect: "pi_stacking",
    value: 35,
    condition: "always",
    description: "π-스태킹 효과 +35%"
  },
  "가수분해": {
    effect: "hydrolysis",
    value: 40,
    condition: "on_attack",
    description: "가수분해 피해 +40%"
  },
  "금속-탄소 결합": {
    effect: "metal_carbon_bond",
    value: 50,
    condition: "always",
    description: "금속-탄소 결합 효과 +50%"
  },
  "루이스 포획": {
    effect: "lewis_capture",
    value: 30,
    condition: "on_attack",
    description: "루이스 포획 효과 +30%"
  },
  "마취 독성": {
    effect: "anesthetic_toxicity",
    value: 25,
    condition: "on_attack",
    duration: 3,
    description: "마취 독성 피해(턴당 ATK 25%, 3턴)"
  },
  "샌드위치 결합": {
    effect: "sandwich_bonding",
    value: 45,
    condition: "always",
    description: "샌드위치 결합 효과 +45%"
  },
  "샌드위치 안정": {
    effect: "sandwich_stability",
    value: 30,
    condition: "always",
    description: "샌드위치 안정 효과 +30%"
  },
  "수소화": {
    effect: "hydrogenation",
    value: 35,
    condition: "on_attack",
    description: "수소화 효과 +35%"
  },
  "알킬 라디칼": {
    effect: "alkyl_radical",
    value: 10,
    condition: "always",
    description: "치명타 확률 +10%"
  },
  "자강 산화": {
    effect: "self_oxidation",
    value: 40,
    condition: "on_attack",
    description: "자강 산화 효과 +40%"
  },
  "저온가스": {
    effect: "cryogenic_gas",
    value: 30,
    condition: "on_attack",
    description: "저온가스 효과 +30%"
  },
  "전자 공명": {
    effect: "electron_resonance",
    value: 25,
    condition: "always",
    description: "전자 공명 효과 +25%"
  },
  "전자 공여": {
    effect: "electron_donor",
    value: 30,
    condition: "on_attack",
    description: "전자 공여 효과 +30%"
  },
  "전자 수거": {
    effect: "electron_scavenger",
    value: 35,
    condition: "on_attack",
    description: "전자 수거 효과 +35%"
  },
  "전자결핍": {
    effect: "electron_deficiency",
    value: 40,
    condition: "on_attack",
    description: "전자결핍 효과 +40%"
  },
  "지연 독성": {
    effect: "delayed_toxicity",
    value: 20,
    condition: "on_attack",
    duration: 4,
    description: "지연 독성 피해(턴당 ATK 20%, 4턴)"
  },
  "지용성 축적": {
    effect: "lipid_solubility",
    value: 50,
    condition: "always",
    description: "지용성 축적 효과 +50%"
  },
  "초강력 플루오린화": {
    effect: "super_fluorination",
    value: 60,
    condition: "on_attack",
    description: "초강력 플루오린화 피해 +60%"
  },
  "초강산": {
    effect: "super_acid",
    value: 70,
    condition: "on_attack",
    description: "초강산 피해 +70%"
  },
  "초경질": {
    effect: "ultra_hardness",
    value: 50,
    condition: "always",
    description: "초경질 효과 +50%"
  },
  "초플루오린화": {
    effect: "super_fluorination",
    value: 80,
    condition: "on_attack",
    description: "초플루오린화 피해 +80%"
  },
  "와이드 밴드갭": {
    effect: "wide_bandgap",
    value: 40,
    condition: "always",
    description: "와이드 밴드갭 효과 +40%"
  },
  "오배위 시프트": {
    effect: "coordination_shift",
    value: 35,
    condition: "on_attack",
    description: "오배위 시프트 효과 +35%"
  }
};

// 특수능력 매핑 함수
function mapSpecialAbility(ability) {
  if (typeof ability === 'string') {
    return SPECIAL_ABILITY_MAPPING[ability] || null;
  }
  
  if (ability && ability.name) {
    const mapped = SPECIAL_ABILITY_MAPPING[ability.name];
    if (mapped) {
      return {
        ...mapped,
        name: ability.name,
        text: ability.text || mapped.description
      };
    }
  }
  
  return null;
}

// 분자의 특수능력을 코드 형식으로 변환
function convertMoleculeSpecialAbilities(molecule) {
  if (!molecule.specialAbilities || !Array.isArray(molecule.specialAbilities)) {
    return [];
  }
  
  return molecule.specialAbilities.map(ability => {
    const mapped = mapSpecialAbility(ability);
    if (mapped) {
      return {
        name: ability.name,
        text: ability.text,
        effect: mapped.effect,
        value: mapped.value,
        condition: mapped.condition,
        duration: mapped.duration
      };
    }
    return ability; // 매핑되지 않은 경우 원본 반환
  });
}

// 전역으로 사용할 수 있도록 내보내기
if (typeof window !== 'undefined') {
  window.SPECIAL_ABILITY_MAPPING = SPECIAL_ABILITY_MAPPING;
  window.mapSpecialAbility = mapSpecialAbility;
  window.convertMoleculeSpecialAbilities = convertMoleculeSpecialAbilities;
}

// Node.js 환경에서도 사용할 수 있도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SPECIAL_ABILITY_MAPPING,
    mapSpecialAbility,
    convertMoleculeSpecialAbilities
  };
}
