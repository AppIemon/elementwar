// 카드 객체 속성 정의 및 사용법 가이드
// 이 파일은 molecules.json의 ability 필드에서 사용할 수 있는 me와 enemy 객체의 속성들을 정의합니다.

/*
=== me (자신의 카드) 객체 속성 ===

기본 속성:
- me.id: 카드 고유 ID
- me.name: 카드 이름
- me.hp: 현재 HP
- me.maxHp: 최대 HP
- me.atk: 기본 공격력
- me.armor: 방어력
- me.owner: 소유자 ('player' 또는 'computer')
- me.element: 원소 정보 객체
- me.isSynthesis: 합성 카드 여부
- me.moleculeId: 분자 ID (합성 카드인 경우)

상태 이상 관련:
- me.statusEffects: 현재 적용된 상태 이상 배열
- me.canAct: 행동 가능 여부 (true/false)
- me.atkMultiplier: 공격력 배수 (기본값: 1)
- me.defMultiplier: 방어력 배수 (기본값: 1)
- me.resistances: 저항력 객체 (예: {fire: 0.5})
- me.immunities: 면역 상태 배열 (예: ['stun', 'freeze'])

메서드:
- me.addStatusEffect(effectName, duration, data): 상태 이상 추가
- me.removeStatusEffect(effectName): 상태 이상 제거
- me.hasStatusEffect(effectName): 상태 이상 확인
- me.getStatusEffect(effectName): 상태 이상 정보 가져오기
- me.takeDamage(damage, damageType): 피해 받기
- me.heal(amount): 회복
- me.getAttackPower(): 공격력 계산 (상태 이상 포함)
- me.getDefensePower(): 방어력 계산 (상태 이상 포함)
- me.getHealthRatio(): HP 비율 (0~1)
- me.isDead(): 죽었는지 확인

=== enemy (상대 카드) 객체 속성 ===

enemy 객체는 me와 동일한 속성과 메서드를 가집니다.

=== 사용 가능한 상태 이상 목록 ===

1. burn (화상)
   - 효과: 매 턴 HP의 5% 피해
   - 지속시간: 3턴
   - 색상: 빨간색 (#ff4444)
   - 아이콘: 🔥

2. poison (독)
   - 효과: 매 턴 HP의 3% 피해
   - 지속시간: 4턴
   - 색상: 초록색 (#44ff44)
   - 아이콘: ☠️

3. freeze (빙결)
   - 효과: 행동 불가
   - 지속시간: 2턴
   - 색상: 파란색 (#44aaff)
   - 아이콘: ❄️

4. stun (기절)
   - 효과: 행동 불가
   - 지속시간: 1턴
   - 색상: 주황색 (#ffaa44)
   - 아이콘: 💫

5. shield (보호막)
   - 효과: 피해를 흡수
   - 지속시간: 영구 (수동 제거)
   - 색상: 노란색 (#ffff44)
   - 아이콘: 🛡️

6. regeneration (재생)
   - 효과: 매 턴 HP의 8% 회복
   - 지속시간: 5턴
   - 색상: 초록색 (#44ff44)
   - 아이콘: 💚

7. rage (분노)
   - 효과: 공격력 50% 증가
   - 지속시간: 3턴
   - 색상: 빨간색 (#ff4444)
   - 아이콘: 😡

8. armor (갑옷)
   - 효과: 방어력 증가
   - 지속시간: 4턴
   - 색상: 회색 (#888888)
   - 아이콘: 🛡️

=== ability 함수 작성 예시 ===

// 화상 적용
"(me, enemy) => { me.addStatusEffect('burn', 3); }"

// 독 적용 (상대가 이미 독에 걸려있지 않은 경우)
"(me, enemy) => { if (!enemy.hasStatusEffect('poison')) { enemy.addStatusEffect('poison', 4); } }"

// 보호막 부여
"(me, enemy) => { me.addStatusEffect('shield', 0, {shieldAmount: me.maxHp * 0.2}); }"

// 상대 기절시키기
"(me, enemy) => { enemy.addStatusEffect('stun', 1); }"

// 자신에게 재생 효과
"(me, enemy) => { me.addStatusEffect('regeneration', 5); }"

// 상대의 상태 이상 제거
"(me, enemy) => { enemy.removeStatusEffect('burn'); enemy.removeStatusEffect('poison'); }"

// 조건부 효과 (상대가 화염 속성인 경우)
"(me, enemy) => { if (enemy.element && enemy.element.category === 'fire') { enemy.addStatusEffect('burn', 2); } }"

// 복합 효과
"(me, enemy) => { 
  me.addStatusEffect('rage', 3); 
  me.addStatusEffect('shield', 0, {shieldAmount: me.maxHp * 0.15}); 
  enemy.addStatusEffect('stun', 1); 
}"

// 피해와 상태 이상 동시 적용
"(me, enemy) => { 
  enemy.takeDamage(me.getAttackPower() * 0.5, 'fire'); 
  enemy.addStatusEffect('burn', 2); 
}"

// 면역 체크 후 효과 적용
"(me, enemy) => { 
  if (!enemy.immunities.includes('stun')) { 
    enemy.addStatusEffect('stun', 1); 
  } 
}"

// 저항력 무시 공격
"(me, enemy) => { 
  const damage = me.getAttackPower() * 1.2; 
  enemy.hp = Math.max(0, enemy.hp - damage); 
}"

// 체력 비율에 따른 효과
"(me, enemy) => { 
  if (me.getHealthRatio() < 0.3) { 
    me.addStatusEffect('rage', 5); 
    me.addStatusEffect('regeneration', 3); 
  } 
}"

=== 주의사항 ===

1. 모든 ability 함수는 문자열로 작성해야 합니다.
2. 함수 내에서 return 문을 사용하지 마세요.
3. me와 enemy 객체를 직접 수정할 수 있습니다.
4. 상태 이상은 자동으로 턴마다 처리됩니다.
5. 면역 상태가 있는 카드는 해당 상태 이상에 걸리지 않습니다.
6. 저항력이 있는 카드는 해당 피해 타입의 피해를 줄여서 받습니다.
7. 보호막이 있는 카드는 피해를 먼저 보호막이 흡수합니다.
8. canAct가 false인 카드는 행동할 수 없습니다.
*/
