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
  console.log(`📡 Update Page API Request: ${req.method}`);
  console.log(`📡 Request body:`, req.body);

  const token = process.env.NOTION_TOKEN;

  if (!token) {
    console.error('❌ NOTION_TOKEN not configured');
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  // Validar método permitido
  if (!['PATCH', 'PUT', 'POST'].includes(req.method)) {
    console.error(`❌ Method ${req.method} not allowed for update-page endpoint`);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // Obtener pageId del body o query
  const pageId = req.body?.pageId || req.query?.pageId;
  
  if (!pageId) {
    console.error('❌ Page ID is required');
    return res.status(400).json({ error: 'Page ID is required' });
  }

  if (!req.body?.properties) {
    console.error('❌ Properties are required');
    return res.status(400).json({ error: 'Properties are required' });
  }

  try {
    const url = `https://api.notion.com/v1/pages/${pageId}`;
    const options = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: req.body.properties
      })
    };

    console.log(`📤 Sending update to Notion:`, JSON.stringify(options.body, null, 2));
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
      console.error(`❌ Notion Update API error (${response.status}):`, data);
      return res.status(response.status).json(data);
    }

    console.log(`✅ Notion Update API success (${response.status})`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Notion Update API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      endpoint: 'notion-update-page-api'
    });
  }
}
