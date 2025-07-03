/**
 * 🔍 ENDPOINT DE VERIFICACIÓN DE TOKEN
 * 
 * Este endpoint verifica si un JWT token es válido:
 * 1. Extrae el token de las cookies
 * 2. Verifica la validez del token
 * 3. Busca el usuario en la base de datos
 * 4. Retorna la información del usuario
 */

import { verifyToken } from '../../lib/auth.js';
import { findUserById } from '../../lib/userService.js';

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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
    console.log('🔍 === INICIO DE VERIFICACIÓN ===');
    
    // ✅ PASO 1: Extraer token de las cookies
    const cookies = req.headers.cookie;
    let authToken = null;

    if (cookies) {
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      authToken = tokenMatch ? tokenMatch[1] : null;
    }

    if (!authToken) {
      console.log('❌ Token no encontrado en cookies');
      return res.status(401).json({
        error: 'Token de autenticación no encontrado'
      });
    }

    // ✅ PASO 2: Verificar token JWT
    const decoded = verifyToken(authToken);
    
    if (!decoded) {
      console.log('❌ Token JWT inválido');
      return res.status(401).json({
        error: 'Token de autenticación inválido'
      });
    }

    // ✅ PASO 3: Buscar usuario en la base de datos
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      console.log('❌ Usuario no encontrado para token válido');
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // ✅ PASO 4: Retornar información del usuario
    console.log('✅ Token verificado exitosamente para:', user.email);
    console.log('🔍 === FIN DE VERIFICACIÓN ===');

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        preferences: user.preferences,
      }
    });

  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}