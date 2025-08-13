/**
 * 🔐 ENDPOINT DE RESTABLECIMIENTO DE CONTRASEÑA
 * 
 * Este endpoint maneja el restablecimiento de contraseña:
 * 1. Valida el token de recuperación
 * 2. Verifica que no haya expirado
 * 3. Actualiza la contraseña del usuario
 */

import { verifyToken } from '../../lib/auth.js';
import { hashPassword } from '../../lib/auth.js';

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    console.log('🔐 === RESTABLECIMIENTO DE CONTRASEÑA ===');
    
    // ✅ PASO 1: Extraer y validar datos de entrada
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      console.log('❌ Token o nueva contraseña no proporcionados');
      return res.status(400).json({ 
        error: 'Token y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      console.log('❌ Contraseña demasiado corta');
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    console.log('🔍 Verificando token de recuperación...');

    // ✅ PASO 2: Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.type !== 'password_reset') {
      console.log('❌ Token inválido o de tipo incorrecto');
      return res.status(400).json({
        error: 'Token de recuperación inválido'
      });
    }

    // ✅ PASO 3: Conectar a la base de datos
    const { connectToDatabase } = await import('../../lib/mongodb.js');
    const { db } = await connectToDatabase();

    // ✅ PASO 4: Verificar que el usuario existe y el token no ha expirado
    const user = await db.collection('users').findOne({
      _id: decoded.id,
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado o token expirado');
      return res.status(400).json({
        error: 'Token de recuperación inválido o expirado'
      });
    }

    // ✅ PASO 5: Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // ✅ PASO 6: Actualizar contraseña y limpiar token
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          lastLoginAt: new Date().toISOString()
        },
        $unset: { 
          resetToken: "",
          resetTokenExpires: ""
        }
      }
    );

    // ✅ PASO 7: Retornar respuesta exitosa
    console.log('✅ Contraseña restablecida exitosamente para:', user.email);
    console.log('🔐 === FIN DE RESTABLECIMIENTO ===');

    return res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en restablecimiento de contraseña:', error);
    
    // No exponer detalles internos del error
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
