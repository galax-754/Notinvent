/**
 * 🔐 ENDPOINT SIMPLE DE RESTABLECIMIENTO DE CONTRASEÑA
 * 
 * Este endpoint permite restablecer la contraseña de forma manual:
 * 1. Busca el usuario por email
 * 2. Actualiza la contraseña directamente
 * 3. No requiere envío de email
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
    console.log('🔐 === RESTABLECIMIENTO SIMPLE DE CONTRASEÑA ===');
    
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ 
        error: 'Email y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Importaciones dinámicas
    let findUserByEmail, hashPassword, connectToDatabase;

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

    // Buscar usuario
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña en la base de datos
    const { db } = await connectToDatabase();
    
    // Usar el ID convertido a ObjectId
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

    console.log('✅ Contraseña restablecida exitosamente para:', email);
    console.log('🔐 === FIN DE RESTABLECIMIENTO ===');

    return res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en restablecimiento simple:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
