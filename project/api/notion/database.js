export default async function handler(req, res) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');
  res.setHeader('Content-Type', 'application/json');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Debug: Log del método recibido
  console.log(`📡 Database API Request: ${req.method} to databaseId: ${req.query.databaseId}`);

  const { databaseId } = req.query;
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    console.error('❌ NOTION_TOKEN not configured');
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  if (!databaseId) {
    console.error('❌ Database ID is required');
    return res.status(400).json({ error: 'Database ID is required' });
  }

  // Validar método permitido
  if (!['GET', 'POST'].includes(req.method)) {
    console.error(`❌ Method ${req.method} not allowed for database endpoint`);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    let url = `https://api.notion.com/v1/databases/${databaseId}`;
    let options = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      }
    };

    // Si es POST (query), agregar el body
    if (req.method === 'POST' && req.body) {
      url = `https://api.notion.com/v1/databases/${databaseId}/query`;
      options.body = JSON.stringify(req.body);
      console.log(`📤 Sending database query:`, JSON.stringify(req.body, null, 2));
    }

    console.log(`🌐 Making request to: ${url}`);
    const response = await fetch(url, options);
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      return res.status(500).json({ 
        error: 'Invalid response from Notion API',
        status: response.status,
        statusText: response.statusText
      });
    }

    if (!response.ok) {
      console.error(`❌ Notion Database API error (${response.status}):`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Notion Database API success (${response.status})`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Notion Database API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      endpoint: 'notion-database-api'
    });
  }
}