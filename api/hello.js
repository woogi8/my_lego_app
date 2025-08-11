export default function handler(req, res) {
  console.log('🔥 Simple test API called:', new Date().toISOString());
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Hello from Vercel API!',
      timestamp: new Date().toISOString(),
      version: '2.1.4-test'
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}