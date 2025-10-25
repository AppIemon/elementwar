// Health check 엔드포인트
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: '서버가 정상적으로 작동 중입니다.',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check 오류:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Health check 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    });
  }
}
