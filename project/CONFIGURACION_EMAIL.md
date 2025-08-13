# 📧 Configuración del Servicio de Email

Este documento explica cómo configurar el servicio de email para la funcionalidad de recuperación de contraseña.

## 🎯 ¿Qué hace el servicio de email?

- **Recuperación de contraseña**: Envía emails con enlaces para restablecer contraseñas olvidadas
- **Emails de bienvenida**: Envía emails de bienvenida a nuevos usuarios registrados
- **Notificaciones**: Envía notificaciones importantes a los usuarios

## ⚙️ Configuración en Gmail

### Paso 1: Habilitar verificación en dos pasos

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
2. Selecciona **Seguridad**
3. En "Iniciar sesión en Google", selecciona **Verificación en 2 pasos**
4. Sigue los pasos para habilitarla

### Paso 2: Generar contraseña de aplicación

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
2. Selecciona **Seguridad**
3. En "Iniciar sesión en Google", selecciona **Contraseñas de aplicación**
4. Selecciona **Otra (nombre personalizado)**
5. Escribe un nombre como "NotInvent App"
6. Haz clic en **Generar**
7. **Copia la contraseña generada** (16 caracteres)

### Paso 3: Configurar variables de entorno

Agrega estas variables en Vercel:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion_de_16_caracteres
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

## 🔧 Configuración en Vercel

### Variables obligatorias:

1. Ve al [Dashboard de Vercel](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** > **Environment Variables**
4. Agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP de Gmail |
| `SMTP_PORT` | `587` | Puerto SMTP |
| `SMTP_USER` | `tu_email@gmail.com` | Tu email de Gmail |
| `SMTP_PASS` | `contraseña_de_16_caracteres` | Contraseña de aplicación |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.vercel.app` | URL de tu aplicación |

### Variables opcionales:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SMTP_SECURE` | `false` | Usar conexión segura (false para puerto 587) |

## 🧪 Probar la configuración

### 1. Verificar variables de entorno

Visita: `https://tu-app.vercel.app/api/debug-env`

Deberías ver algo como:
```json
{
  "success": true,
  "env": {
    "SMTP_HOST": "Configured",
    "SMTP_USER": "Configured", 
    "SMTP_PASS": "Configured"
  }
}
```

### 2. Probar envío de email

1. Ve a la página de login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Verifica que recibas el email de recuperación

## 🚨 Solución de problemas

### Error: "Invalid login"

- Verifica que la verificación en 2 pasos esté habilitada
- Asegúrate de usar la contraseña de aplicación, no tu contraseña normal
- Verifica que el email esté correcto

### Error: "Authentication failed"

- La contraseña de aplicación puede haber expirado
- Genera una nueva contraseña de aplicación
- Actualiza la variable `SMTP_PASS` en Vercel

### Error: "Connection timeout"

- Verifica que `SMTP_HOST` sea `smtp.gmail.com`
- Verifica que `SMTP_PORT` sea `587`
- Verifica que `SMTP_SECURE` sea `false`

### No se reciben emails

- Revisa la carpeta de spam
- Verifica que el email esté correcto
- Revisa los logs de Vercel para errores

## 📝 Notas importantes

1. **Seguridad**: Nunca uses tu contraseña normal de Gmail
2. **Contraseñas de aplicación**: Son específicas por aplicación
3. **Verificación en 2 pasos**: Es obligatoria para usar contraseñas de aplicación
4. **Límites**: Gmail tiene límites de envío (500 emails/día para cuentas gratuitas)

## 🔄 Actualizar configuración

Si necesitas cambiar la configuración:

1. Actualiza las variables en Vercel
2. Redespliega la aplicación
3. Prueba el envío de emails nuevamente

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Vercel
2. Verifica que todas las variables estén configuradas
3. Prueba con un email diferente
4. Contacta al equipo de desarrollo
