/**
 * 🚪 ENDPOINT DE LOGOUT
 * 
 * Este endpoint maneja el cierre de sesión:
 * 1. Limpia la cookie de autenticación
 * 2. Retorna confirmación de logout exitoso
 */

import { clearAuthCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ MANEJAR PREFLIGHT REQUEST
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ VALIDAR MÉTODO HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use POST.' 
    });
  }

  try {
    console.log('🚪 === INICIO DE LOGOUT ===');
    
    // ✅ LIMPIAR COOKIE DE AUTENTICACIÓN
    const clearCookie = clearAuthCookie();
    res.setHeader('Set-Cookie', clearCookie);

    console.log('✅ Logout exitoso');
    console.log('🚪 === FIN DE LOGOUT ===');

    return res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}