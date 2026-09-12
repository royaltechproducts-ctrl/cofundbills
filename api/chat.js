const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 'CoFundBills Chat API is running.' });

  try {
    const messages = req.body?.messages || [];
    const system   = req.body?.system   || '';

    if (!messages.length) return res.status(400).json({ error: 'No messages provided' });

    const apiKey = process.env.VITE_ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system,
      messages,
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const data = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let raw = '';
        response.on('data', chunk => raw += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch(e) { reject(new Error('Failed to parse: ' + raw)); }
        });
      });
      request.on('error', reject);
      request.write(body);
      request.end();
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
