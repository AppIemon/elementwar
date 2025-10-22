# 원소 대전 (Element Battle)

화학 원소들을 활용한 카드 배틀 게임입니다.

## Vercel 배포 가이드

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 프로젝트 배포
```bash
vercel
```

### 3. 환경 변수 설정 (선택사항)
Vercel 대시보드에서 다음 환경 변수를 설정할 수 있습니다:
- `PORT`: 서버 포트 (기본값: 3000)

## 로컬 개발

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 프로덕션 서버 실행
```bash
npm start
```

## 파일 구조

```
├── index.html          # 메인 HTML 파일
├── server.js           # Express 서버
├── package.json        # 프로젝트 설정
├── vercel.json         # Vercel 배포 설정
├── .vercelignore       # Vercel 무시 파일
└── src/
    ├── js/             # JavaScript 파일들
    ├── data/           # 게임 데이터
    └── assets/         # 정적 자산
```

## 주요 기능

- 원소 카드 배틀 시스템
- 분자 합성 시스템
- 온라인 멀티플레이어
- 실시간 게임 상태 동기화
- 반응형 UI

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **Deployment**: Vercel
