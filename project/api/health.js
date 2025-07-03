/**
 * 🏥 ENDPOINT DE HEALTH CHECK
 * 
 * Este endpoint verifica el estado de salud de la aplicación:
 * - Conexión a MongoDB
 * - Estado general del sistema
 * - Información de versión
 */

import { checkDatabaseHealth } from '../lib/mongodb.js';

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ MANEJAR PREFLIGHT REQUEST
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ VALIDAR MÉTODO HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use GET.' 
    });
  }

  try {
    console.log('🏥 === HEALTH CHECK ===');
    
    const startTime = Date.now();
    
    // ✅ VERIFICAR CONEXIÓN A MONGODB
    const mongoHealthy = await checkDatabaseHealth();
    
    const responseTime = Date.now() - startTime;
    
    // ✅ PREPARAR RESPUESTA DE SALUD
    const healthStatus = {
      status: mongoHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        mongodb: {
          status: mongoHealthy ? 'up' : 'down',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'up',
          responseTime: `${responseTime}ms`
        }
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    const statusCode = mongoHealthy ? 200 : 503;
    
    console.log(`${mongoHealthy ? '✅' : '❌'} Health check completado - Status: ${healthStatus.status}`);
    
    return res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('❌ Error en health check:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        mongodb: { status: 'unknown' },
        api: { status: 'error' }
      }
    });
  }
}