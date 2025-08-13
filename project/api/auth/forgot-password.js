/**
 * 🔐 ENDPOINT DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Este endpoint maneja la solicitud de recuperación de contraseña:
 * 1. Valida que el email existe
 * 2. Genera un token de recuperación
 * 3. Envía un email con el enlace de recuperación
 */

export default async function handler(req, res) {
  // Importaciones dinámicas para evitar problemas de rutas en Vercel
  let findUserByEmail, generateToken, emailService, connectToDatabase;

  try {
    const userServiceModule = await import('../../lib/userService.js');
    findUserByEmail = userServiceModule.findUserByEmail;
  } catch (error) {
    console.error('❌ Error importando userService:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  try {
    const authModule = await import('../../lib/auth.js');
    generateToken = authModule.generateToken;
  } catch (error) {
    console.error('❌ Error importando auth:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  try {
    const emailServiceModule = await import('../../lib/emailService.js');
    emailService = emailServiceModule.emailService;
  } catch (error) {
    console.error('❌ Error importando emailService:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  try {
    const mongodbModule = await import('../../lib/mongodb.js');
    connectToDatabase = mongodbModule.connectToDatabase;
  } catch (error) {
    console.error('❌ Error importando mongodb:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
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
    console.log('🔐 === SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA ===');
    
    // ✅ PASO 1: Extraer y validar datos de entrada
    const { email } = req.body;

    if (!email) {
      console.log('❌ Email no proporcionado');
      return res.status(400).json({ 
        error: 'Email es requerido' 
      });
    }

    console.log('📧 Procesando recuperación para:', email);

    // ✅ PASO 2: Verificar que el usuario existe
    const user = await findUserByEmail(email);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      console.log('❌ Usuario no encontrado para:', email);
      return res.status(200).json({
        success: true,
        message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación'
      });
    }

    // ✅ PASO 3: Generar token de recuperación
    const resetToken = generateToken({
      id: user.id,
      email: user.email,
      type: 'password_reset'
    }, '1h'); // Token válido por 1 hora

    // ✅ PASO 4: Guardar token en la base de datos
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetToken,
          resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        }
      }
    );

    // ✅ PASO 5: Enviar email de recuperación
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      user.name || 'Usuario'
    );

    if (!emailSent) {
      console.error('❌ Error enviando email de recuperación a:', email);
      // Por seguridad, no revelamos el error
      return res.status(200).json({
        success: true,
        message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación'
      });
    }

    // ✅ PASO 6: Retornar respuesta exitosa
    console.log('✅ Email de recuperación enviado exitosamente a:', email);
    console.log('🔐 === FIN DE SOLICITUD DE RECUPERACIÓN ===');

    return res.status(200).json({
      success: true,
      message: 'Si existe una cuenta con ese email, se ha enviado un enlace de recuperación'
    });

  } catch (error) {
    console.error('❌ Error en recuperación de contraseña:', error);
    
    // No exponer detalles internos del error
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
