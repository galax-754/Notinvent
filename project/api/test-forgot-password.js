export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔍 === DIAGNÓSTICO FORGOT PASSWORD ===');
    
    // Test 1: Verificar variables de entorno
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET
    };

    console.log('📋 Variables de entorno:', envCheck);

    // Test 2: Intentar importar módulos
    let moduleTests = {};

    try {
      const { findUserByEmail } = await import('../../lib/userService.js');
      moduleTests.userService = 'success';
      console.log('✅ userService importado correctamente');
    } catch (error) {
      moduleTests.userService = `error: ${error.message}`;
      console.log('❌ Error importando userService:', error.message);
    }

    try {
      const { generateToken } = await import('../../lib/auth.js');
      moduleTests.auth = 'success';
      console.log('✅ auth importado correctamente');
    } catch (error) {
      moduleTests.auth = `error: ${error.message}`;
      console.log('❌ Error importando auth:', error.message);
    }

    try {
      const { emailService } = await import('../../lib/emailService.js');
      moduleTests.emailService = 'success';
      console.log('✅ emailService importado correctamente');
    } catch (error) {
      moduleTests.emailService = `error: ${error.message}`;
      console.log('❌ Error importando emailService:', error.message);
    }

    try {
      const { connectToDatabase } = await import('../../lib/mongodb.js');
      moduleTests.mongodb = 'success';
      console.log('✅ mongodb importado correctamente');
    } catch (error) {
      moduleTests.mongodb = `error: ${error.message}`;
      console.log('❌ Error importando mongodb:', error.message);
    }

    // Test 3: Verificar datos de entrada
    const { email } = req.body || {};
    console.log('📧 Email recibido:', email);

    console.log('🔍 === FIN DIAGNÓSTICO ===');

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico completado',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      modules: moduleTests,
      input: { email }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return res.status(500).json({
      error: 'Error en diagnóstico',
      details: error.message
    });
  }
}
