/**
 * 👤 ENDPOINT DE REGISTRO
 * 
 * Este endpoint maneja el registro de nuevos usuarios:
 * 1. Valida los datos de entrada
 * 2. Crea el usuario en MongoDB
 * 3. Genera un JWT token
 * 4. Establece una cookie segura
 * 5. Retorna la información del usuario
 */

import { createUser } from '../../lib/userService.js';
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
    console.log('👤 === INICIO DE REGISTRO ===');
    
    // ✅ PASO 1: Extraer y validar datos de entrada
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      console.log('❌ Datos de registro incompletos');
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    console.log('📧 Intentando registro para:', email);

    // ✅ PASO 2: Crear usuario en la base de datos
    const user = await createUser({
      name,
      email,
      password,
      confirmPassword
    });

    // ✅ PASO 3: Generar JWT token
    const token = generateToken(user);

    // ✅ PASO 4: Establecer cookie segura
    const authCookie = createAuthCookie(token);
    res.setHeader('Set-Cookie', authCookie);

    // ✅ PASO 5: Retornar respuesta exitosa
    console.log('✅ Registro exitoso para:', email);
    console.log('👤 === FIN DE REGISTRO ===');

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        preferences: user.preferences,
      },
      message: 'Cuenta creada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Manejar errores específicos
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (error.message.includes('ya está registrado')) {
      errorMessage = 'Este email ya está registrado';
      statusCode = 409; // Conflict
    } else if (error.message.includes('contraseña') || error.message.includes('email') || error.message.includes('nombre')) {
      errorMessage = error.message;
      statusCode = 400; // Bad Request
    }

    return res.status(statusCode).json({
      error: errorMessage
    });
  }
}