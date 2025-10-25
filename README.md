# 원소 대전 (Element War)

화학 원소 카드 배틀 게임입니다. 주기율표의 원소들을 카드로 수집하고 전략적으로 배치하여 상대방과 대결하세요!

## 🎮 게임 특징

- **118개 원소 카드**: 주기율표의 모든 원소를 카드로 수집
- **전략적 배치**: 5개 라인에 카드를 배치하여 상대방과 대결
- **상성 시스템**: 원소 간의 상성을 고려한 전략적 게임플레이
- **퓨전 시스템**: 원소들을 조합하여 새로운 분자 카드 생성
- **스타 시스템**: 카드를 강화하여 더 강력한 전략 구사

## 🚀 플레이 방법

1. **카드 뽑기**: 코인을 사용하여 새로운 원소 카드를 뽑습니다
2. **카드 배치**: 전장의 5개 라인 중 하나에 카드를 배치합니다
3. **턴 종료**: 모든 카드를 배치한 후 턴을 종료합니다
4. **공격**: 상대방 카드와 자동으로 전투가 진행됩니다
5. **승리**: 상대방의 기지를 파괴하면 승리합니다!

## 🌐 온라인 플레이

- **로컬 서버**: `node server.js`로 로컬 서버 실행 후 온라인 대전 가능
- **Vercel 배포**: [https://elementwar.vercel.app](https://elementwar.vercel.app)에서 온라인 대전
- **GitHub Pages**: [https://appiemon.github.io/elementwar](https://appiemon.github.io/elementwar)에서 정적 버전 플레이

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Animations**: Anime.js
- **Backend**: Node.js, Express.js
- **Deployment**: Vercel, GitHub Pages

## 📁 프로젝트 구조

```
elementwar/
├── index.html              # 메인 HTML 파일
├── src/
│   ├── js/                 # JavaScript 파일들
│   │   ├── game.js         # 게임 로직
│   │   ├── card.js         # 카드 시스템
│   │   ├── battlefield.js  # 전장 관리
│   │   └── ...
│   ├── data/               # 게임 데이터
│   │   ├── elements.json   # 원소 데이터
│   │   └── molecules.json  # 분자 데이터
│   └── assets/             # 이미지 및 아이콘
├── api/                    # Vercel 서버리스 함수
├── server.js               # 로컬 서버
└── package.json            # 의존성 관리
```

## 🚀 로컬 실행

1. 저장소 클론:
```bash
git clone https://github.com/AppIemon/elementwar.git
cd elementwar
```

2. 의존성 설치:
```bash
npm install
```

3. 서버 실행:
```bash
npm start
```

4. 브라우저에서 `http://localhost:3000` 접속

## 🎯 게임 규칙

- 각 턴마다 카드를 뽑고 전장에 배치할 수 있습니다
- 카드는 공격력(ATK)과 체력(HP)을 가집니다
- 같은 라인에 있는 카드끼리 자동으로 전투합니다
- 상대방의 기지 HP를 0으로 만들면 승리합니다
- 원소 간의 상성에 따라 데미지가 증감됩니다

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 개발팀

- **AppIemon** - 프로젝트 리드 및 개발

## 📞 연락처

프로젝트 링크: [https://github.com/AppIemon/elementwar](https://github.com/AppIemon/elementwar)

---

**즐거운 게임 되세요! 🎮✨**
