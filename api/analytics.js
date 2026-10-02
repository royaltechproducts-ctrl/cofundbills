const { BetaAnalyticsDataClient } = require('@google-analytics/data');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const propertyId  = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GA4_CLIENT_EMAIL;
    const privateKey  = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!propertyId || !clientEmail || !privateKey)
      return res.status(500).json({ error: 'Missing GA4 credentials' });

    const client   = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
    });
    const property = `properties/${propertyId}`;

    const [visitorsRes, pagesRes, devicesRes, citiesRes, sourcesRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [
          { startDate: 'today',     endDate: 'today' },
          { startDate: '7daysAgo',  endDate: 'today' },
          { startDate: '30daysAgo', endDate: 'today' },
        ],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics:    [{ name: 'screenPageViews' }],
        orderBys:   [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics:    [{ name: 'sessions' }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'city' }],
        metrics:    [{ name: 'activeUsers' }],
        orderBys:   [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics:    [{ name: 'sessions' }],
        orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 6,
      }),
    ]);

    const visitors = { today: 0, week: 0, month: 0, sessions: 0 };
    (visitorsRes[0]?.rows || []).forEach((row, i) => {
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const sess  = parseInt(row.metricValues?.[1]?.value || '0');
      if (i === 0) visitors.today   = users;
      if (i === 1) visitors.week    = users;
      if (i === 2) { visitors.month = users; visitors.sessions = sess; }
    });

    const pages   = (pagesRes[0]?.rows   || []).map(r=>({ path:r.dimensionValues?.[0]?.value||'/', views:parseInt(r.metricValues?.[0]?.value||'0') }));
    const devices = (devicesRes[0]?.rows  || []).map(r=>({ device:r.dimensionValues?.[0]?.value||'unknown', sessions:parseInt(r.metricValues?.[0]?.value||'0') }));
    const cities  = (citiesRes[0]?.rows   || []).map(r=>({ city:r.dimensionValues?.[0]?.value||'Unknown', users:parseInt(r.metricValues?.[0]?.value||'0') }));
    const sources = (sourcesRes[0]?.rows  || []).map(r=>({ source:r.dimensionValues?.[0]?.value||'Unknown', sessions:parseInt(r.metricValues?.[0]?.value||'0') }));

    return res.status(200).json({ visitors, pages, devices, cities, sources });
  } catch (err) {
    console.error('GA4 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
