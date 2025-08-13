export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const results = {
    timestamp: new Date().toISOString(),
    step: 'start',
    errors: [],
    success: false
  };

  try {
    console.log('🔍 === DIAGNÓSTICO DETALLADO PASO A PASO ===');
    
    // PASO 1: Verificar variables de entorno
    results.step = 'environment_check';
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET
    };
    results.environment = envCheck;
    console.log('✅ Variables de entorno verificadas');

    // PASO 2: Importar userService
    results.step = 'userService_import';
    let findUserByEmail;
    try {
      const userServiceModule = await import('../../lib/userService.js');
      findUserByEmail = userServiceModule.findUserByEmail;
      results.userService = { success: true, exports: Object.keys(userServiceModule) };
      console.log('✅ userService importado correctamente');
    } catch (error) {
      results.userService = { success: false, error: error.message };
      results.errors.push(`userService import error: ${error.message}`);
      console.log('❌ Error importando userService:', error.message);
      throw error;
    }

    // PASO 3: Importar auth
    results.step = 'auth_import';
    let generatePasswordResetToken;
    try {
      const authModule = await import('../../lib/auth.js');
      generatePasswordResetToken = authModule.generatePasswordResetToken;
      results.auth = { success: true, exports: Object.keys(authModule) };
      console.log('✅ auth importado correctamente');
    } catch (error) {
      results.auth = { success: false, error: error.message };
      results.errors.push(`auth import error: ${error.message}`);
      console.log('❌ Error importando auth:', error.message);
      throw error;
    }

    // PASO 4: Importar emailService
    results.step = 'emailService_import';
    let emailService;
    try {
      const emailServiceModule = await import('../../lib/emailService.js');
      emailService = emailServiceModule.emailService;
      results.emailService = { success: true, exports: Object.keys(emailServiceModule) };
      console.log('✅ emailService importado correctamente');
    } catch (error) {
      results.emailService = { success: false, error: error.message };
      results.errors.push(`emailService import error: ${error.message}`);
      console.log('❌ Error importando emailService:', error.message);
      throw error;
    }

    // PASO 5: Importar mongodb
    results.step = 'mongodb_import';
    let connectToDatabase;
    try {
      const mongodbModule = await import('../../lib/mongodb.js');
      connectToDatabase = mongodbModule.connectToDatabase;
      results.mongodb = { success: true, exports: Object.keys(mongodbModule) };
      console.log('✅ mongodb importado correctamente');
    } catch (error) {
      results.mongodb = { success: false, error: error.message };
      results.errors.push(`mongodb import error: ${error.message}`);
      console.log('❌ Error importando mongodb:', error.message);
      throw error;
    }

    // PASO 6: Probar con datos reales
    results.step = 'test_with_real_data';
    const { email } = req.body || { email: 'test@example.com' };
    
    try {
      // Probar findUserByEmail
      const user = await findUserByEmail(email);
      results.userLookup = { success: true, userFound: !!user, email };
      console.log('✅ findUserByEmail funcionó');
      
      if (user) {
        // Probar generatePasswordResetToken
        const resetToken = generatePasswordResetToken({
          id: user.id || user._id,
          email: user.email
        });
        results.tokenGeneration = { success: true, tokenLength: resetToken.length };
        console.log('✅ generatePasswordResetToken funcionó');
        
        // Probar conexión a MongoDB
        const { db } = await connectToDatabase();
        results.mongodbConnection = { success: true };
        console.log('✅ Conexión a MongoDB funcionó');
        
        // Probar emailService (sin enviar realmente)
        if (emailService && emailService.sendPasswordResetEmail) {
          results.emailServiceCheck = { success: true, methodExists: true };
          console.log('✅ emailService.sendPasswordResetEmail existe');
        } else {
          results.emailServiceCheck = { success: false, methodExists: false };
          console.log('❌ emailService.sendPasswordResetEmail no existe');
        }
      }
      
    } catch (error) {
      results.testError = { error: error.message, stack: error.stack };
      results.errors.push(`test error: ${error.message}`);
      console.log('❌ Error en prueba con datos reales:', error.message);
    }

    results.success = results.errors.length === 0;
    console.log('🔍 === FIN DIAGNÓSTICO ===');

    return res.status(200).json(results);

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
    results.errors.push(`general error: ${error.message}`);
    results.success = false;
    
    return res.status(500).json(results);
  }
}
