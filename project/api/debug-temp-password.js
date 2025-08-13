/**
 * 🔍 ENDPOINT DE DIAGNÓSTICO PARA CONTRASEÑA TEMPORAL
 * 
 * Este endpoint diagnostica problemas con el método de contraseña temporal
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
    console.log('🔍 === DIAGNÓSTICO CONTRASEÑA TEMPORAL ===');
    
    const { email } = req.body;
    const results = {
      timestamp: new Date().toISOString(),
      input: { email: email || 'no_provided' },
      environment: {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_PORT: !!process.env.SMTP_PORT,
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
        MONGODB_URI: !!process.env.MONGODB_URI,
        JWT_SECRET: !!process.env.JWT_SECRET,
      },
      modules: {},
      user: null,
      tempPassword: null,
      emailTest: null
    };

    // Test 1: Importar userService
    try {
      const userServiceModule = await import('../../lib/userService.js');
      results.modules.userService = 'success';
      console.log('✅ userService importado correctamente');
    } catch (error) {
      results.modules.userService = `error: ${error.message}`;
      console.error('❌ Error importando userService:', error);
    }

    // Test 2: Importar auth
    try {
      const authModule = await import('../../lib/auth.js');
      results.modules.auth = 'success';
      console.log('✅ auth importado correctamente');
    } catch (error) {
      results.modules.auth = `error: ${error.message}`;
      console.error('❌ Error importando auth:', error);
    }

    // Test 3: Importar mongodb
    try {
      const mongodbModule = await import('../../lib/mongodb.js');
      results.modules.mongodb = 'success';
      console.log('✅ mongodb importado correctamente');
    } catch (error) {
      results.modules.emailService = `error: ${error.message}`;
      console.error('❌ Error importando mongodb:', error);
    }

    // Test 4: Importar emailService
    try {
      const emailServiceModule = await import('../../lib/emailService.js');
      results.modules.emailService = 'success';
      console.log('✅ emailService importado correctamente');
    } catch (error) {
      results.modules.emailService = `error: ${error.message}`;
      console.error('❌ Error importando emailService:', error);
    }

    // Test 5: Buscar usuario (si se proporciona email)
    if (email) {
      try {
        const userServiceModule = await import('../../lib/userService.js');
        const findUserByEmail = userServiceModule.findUserByEmail;
        const user = await findUserByEmail(email);
        
        if (user) {
          results.user = {
            found: true,
            id: user.id,
            email: user.email,
            name: user.name || 'no_name'
          };
          console.log('✅ Usuario encontrado:', user.email);
        } else {
          results.user = { found: false };
          console.log('❌ Usuario no encontrado');
        }
      } catch (error) {
        results.user = { error: error.message };
        console.error('❌ Error buscando usuario:', error);
      }
    }

    // Test 6: Generar contraseña temporal
    try {
      const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
      results.tempPassword = {
        generated: true,
        password: tempPassword,
        length: tempPassword.length
      };
      console.log('✅ Contraseña temporal generada:', tempPassword);
    } catch (error) {
      results.tempPassword = { error: error.message };
      console.error('❌ Error generando contraseña temporal:', error);
    }

    // Test 7: Test de email (solo si hay configuración SMTP)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const emailServiceModule = await import('../../lib/emailService.js');
        const emailService = emailServiceModule.emailService;
        
        // Test simple de configuración del transporter
        const testTransporter = emailService.transporter;
        results.emailTest = {
          transporter: 'configured',
          host: testTransporter.options.host,
          port: testTransporter.options.port,
          user: testTransporter.options.auth.user ? 'configured' : 'not_configured'
        };
        console.log('✅ Email service configurado correctamente');
      } catch (error) {
        results.emailTest = { error: error.message };
        console.error('❌ Error configurando email service:', error);
      }
    } else {
      results.emailTest = { error: 'SMTP credentials not configured' };
      console.log('❌ Credenciales SMTP no configuradas');
    }

    console.log('🔍 === FIN DE DIAGNÓSTICO ===');

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico completado',
      results
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
