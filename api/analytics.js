export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const propertyId  = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GA4_CLIENT_EMAIL;
    let   privateKey  = process.env.GA4_PRIVATE_KEY || '';

    // Clean up the key however Vercel stored it
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();

    if (!propertyId || !clientEmail || !privateKey)
      return res.status(500).json({ error: 'Missing GA4 credentials' });

    const now = Math.floor(Date.now() / 1000);
    const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim  = { iss: clientEmail, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
    const input  = `${b64(header)}.${b64(claim)}`;

    const pemBody = privateKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const bin     = atob(pemBody);
    const der     = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);

    const key = await crypto.subtle.importKey(
      'pkcs8', der.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
    const jwt = `${input}.${Buffer.from(sig).toString('base64url')}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const { access_token, error: tokErr } = await tokenRes.json();
    if (tokErr) return res.status(500).json({ error: `Token: ${tokErr}` });

    const run = body => fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      { method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    ).then(r => r.json());

    const [vR, pR, dR, cR, sR] = await Promise.all([
      run({ dateRanges: [{ startDate: 'today', endDate: 'today' }, { startDate: '7daysAgo', endDate: 'today' }, { startDate: '30daysAgo', endDate: 'today' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }] }),
      run({ dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 5 }),
      run({ dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }] }),
      run({ dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: 'city' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: 5 }),
      run({ dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: 'sessionDefaultChannelGrouping' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
    ]);

    const visitors = { today: 0, week: 0, month: 0, sessions: 0 };
    (vR.rows || []).forEach((r, i) => {
      const u = parseInt(r.metricValues?.[0]?.value || '0');
      const s = parseInt(r.metricValues?.[1]?.value || '0');
      if (i === 0) visitors.today = u;
      if (i === 1) visitors.week  = u;
      if (i === 2) { visitors.month = u; visitors.sessions = s; }
    });

    return res.status(200).json({
      visitors,
      pages:   (pR.rows || []).map(r => ({ path:   r.dimensionValues?.[0]?.value || '/',        views:    parseInt(r.metricValues?.[0]?.value || '0') })),
      devices: (dR.rows || []).map(r => ({ device: r.dimensionValues?.[0]?.value || 'unknown', sessions: parseInt(r.metricValues?.[0]?.value || '0') })),
      cities:  (cR.rows || []).map(r => ({ city:   r.dimensionValues?.[0]?.value || 'Unknown', users:    parseInt(r.metricValues?.[0]?.value || '0') })),
      sources: (sR.rows || []).map(r => ({ source: r.dimensionValues?.[0]?.value || 'Unknown', sessions: parseInt(r.metricValues?.[0]?.value || '0') })),
    });
  } catch (err) {
    console.error('GA4 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
