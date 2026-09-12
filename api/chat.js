const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  const messages = (req.body && req.body.messages) ? req.body.messages : [];
  const system = (req.body && req.body.system) ? req.body.system : '';
  const apiKey = process.env.VITE_ANTHROPIC_KEY;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: system,
    messages: messages,
  });

  return new Promise(function(resolve) {
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

    const request = https.request(options, function(response) {
      let raw = '';
      response.on('data', function(chunk) { raw += chunk; });
      response.on('end', function() {
        try {
          const data = JSON.parse(raw);
          res.status(200).json(data);
        } catch(e) {
          res.status(500).json({ error: 'Parse error' });
        }
        resolve();
      });
    });

    request.on('error', function(e) {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(body);
    request.end();
  });
};
