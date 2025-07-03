/**
 * 🔐 ENDPOINT DE LOGIN
 * 
 * Este endpoint maneja la autenticación de usuarios:
 * 1. Valida las credenciales
 * 2. Genera un JWT token
 * 3. Establece una cookie segura
 * 4. Retorna la información del usuario
 */

import { authenticateUser } from '../../lib/userService.js';
import { generateToken, createAuthCookie } from '../../lib/auth.js';

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
    console.log('🔐 === INICIO DE LOGIN ===');
    
    // ✅ PASO 1: Extraer y validar datos de entrada
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Datos de login incompletos');
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    console.log('📧 Intentando login para:', email);

    // ✅ PASO 2: Autenticar usuario
    const user = await authenticateUser(email, password);
    
    if (!user) {
      console.log('❌ Autenticación fallida para:', email);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // ✅ PASO 3: Generar JWT token
    const token = generateToken(user);

    // ✅ PASO 4: Establecer cookie segura
    const authCookie = createAuthCookie(token);
    res.setHeader('Set-Cookie', authCookie);

    // ✅ PASO 5: Retornar respuesta exitosa
    console.log('✅ Login exitoso para:', email);
    console.log('🔐 === FIN DE LOGIN ===');

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        preferences: user.preferences,
      },
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    
    // No exponer detalles internos del error
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}