// Vercel 서버리스 환경에 최적화된 게임 API
module.exports = (req, res) => {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // URL 파싱
    const url = new URL(req.url, `https://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;

    console.log('API 호출:', method, path);

    // 간단한 응답으로 시작
    if (path === '/api/health' && method === 'GET') {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: '게임 API가 정상적으로 작동합니다.'
      });
      return;
    }

    if (path === '/api/start-matching' && method === 'POST') {
      // POST 요청 body 파싱
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { playerName } = data;
          
          if (!playerName) {
            res.status(400).json({ error: '플레이어 이름이 필요합니다.' });
            return;
          }

          // 간단한 매칭 응답
          res.json({
            success: true,
            waiting: true,
            message: '매칭을 기다리는 중입니다...',
            playerName: playerName
          });
        } catch (error) {
          console.error('매칭 시작 오류:', error);
          res.status(500).json({ error: '매칭 시작 중 오류가 발생했습니다.' });
        }
      });
      return;
    }

    if (path === '/api/cancel-matching' && method === 'POST') {
      res.json({ 
        success: true, 
        message: '매칭이 취소되었습니다.' 
      });
      return;
    }

    if (path.startsWith('/api/game-status/') && method === 'GET') {
      const roomId = path.split('/')[3];
      res.json({
        success: true,
        roomId: roomId,
        message: '게임 상태 확인됨'
      });
      return;
    }

    if (path === '/api/end-turn' && method === 'POST') {
      // POST 요청 body 파싱
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.json({
            success: true,
            message: '턴이 종료되었습니다.',
            turnCount: (data.gameState?.turnCount || 1) + 1
          });
        } catch (error) {
          console.error('턴 종료 오류:', error);
          res.status(500).json({ error: '턴 종료 중 오류가 발생했습니다.' });
        }
      });
      return;
    }

    if (path === '/api/place-card' && method === 'POST') {
      // POST 요청 body 파싱
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.json({
            success: true,
            message: '카드가 배치되었습니다.',
            card: data.card,
            laneIndex: data.laneIndex
          });
        } catch (error) {
          console.error('카드 배치 오류:', error);
          res.status(500).json({ error: '카드 배치 중 오류가 발생했습니다.' });
        }
      });
      return;
    }

    // 404 응답
    res.status(404).json({ error: 'API 엔드포인트를 찾을 수 없습니다.' });

  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ error: '내부 서버 오류가 발생했습니다.' });
  }
};