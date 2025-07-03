export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { databaseId } = req.query;
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  if (!databaseId) {
    return res.status(400).json({ error: 'Database ID is required' });
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
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}