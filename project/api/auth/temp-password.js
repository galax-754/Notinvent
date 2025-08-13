/**
 * 🔐 ENDPOINT DE CONTRASEÑA TEMPORAL
 * 
 * Este endpoint genera una contraseña temporal y la envía por email:
 * 1. Busca el usuario por email
 * 2. Genera una contraseña temporal
 * 3. Actualiza la contraseña en la base de datos
 * 4. Envía la contraseña por email
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use POST.' 
    });
  }

  try {
    console.log('🔐 === CONTRASEÑA TEMPORAL ===');
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email es requerido' 
      });
    }

    // Importaciones dinámicas
    let findUserByEmail, hashPassword, connectToDatabase, emailService;

    try {
      const userServiceModule = await import('../../lib/userService.js');
      findUserByEmail = userServiceModule.findUserByEmail;
    } catch (error) {
      console.error('❌ Error importando userService:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    try {
      const authModule = await import('../../lib/auth.js');
      hashPassword = authModule.hashPassword;
    } catch (error) {
      console.error('❌ Error importando auth:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    try {
      const mongodbModule = await import('../../lib/mongodb.js');
      connectToDatabase = mongodbModule.connectToDatabase;
    } catch (error) {
      console.error('❌ Error importando mongodb:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    try {
      const emailServiceModule = await import('../../lib/emailService.js');
      emailService = emailServiceModule.emailService;
    } catch (error) {
      console.error('❌ Error importando emailService:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    // Buscar usuario
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Generar contraseña temporal (8 caracteres alfanuméricos)
    const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Hashear contraseña temporal
    const hashedPassword = await hashPassword(tempPassword);

    // Actualizar contraseña en la base de datos
    const { db } = await connectToDatabase();
    const ObjectId = (await import('mongodb')).ObjectId;
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          password: hashedPassword,
          lastLoginAt: new Date().toISOString()
        }
      }
    );

    // Enviar email con contraseña temporal
    const emailSent = await emailService.sendTempPasswordEmail(email, tempPassword, user.name || 'Usuario');

    if (!emailSent) {
      console.error('❌ Error enviando email de contraseña temporal');
      return res.status(500).json({
        error: 'Error enviando email. Intenta nuevamente.'
      });
    }

    console.log('✅ Contraseña temporal enviada exitosamente para:', email);
    console.log('🔐 === FIN DE CONTRASEÑA TEMPORAL ===');

    return res.status(200).json({
      success: true,
      message: 'Contraseña temporal enviada a tu email'
    });

  } catch (error) {
    console.error('❌ Error en contraseña temporal:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
