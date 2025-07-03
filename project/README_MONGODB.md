# 🗄️ Guía de Configuración de MongoDB Atlas

Esta guía te ayudará a configurar MongoDB Atlas para tu aplicación de inventario Notion.

## 📋 Requisitos Previos

1. **Cuenta de MongoDB Atlas**: Crea una cuenta gratuita en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Conocimientos básicos**: Familiaridad con bases de datos NoSQL

## 🚀 Configuración Paso a Paso

### 1. Crear un Cluster en MongoDB Atlas

1. **Inicia sesión** en MongoDB Atlas
2. **Crea un nuevo proyecto** o usa uno existente
3. **Haz clic en "Build a Database"**
4. **Selecciona "Shared" (gratuito)** para empezar
5. **Elige un proveedor de nube** (AWS, Google Cloud, o Azure)
6. **Selecciona una región** cercana a tus usuarios
7. **Nombra tu cluster** (ej: "notion-inventory-cluster")
8. **Haz clic en "Create Cluster"**

### 2. Configurar Acceso a la Base de Datos

#### 2.1 Crear un Usuario de Base de Datos

1. Ve a **"Database Access"** en el menú lateral
2. Haz clic en **"Add New Database User"**
3. Selecciona **"Password"** como método de autenticación
4. **Crea un username y password seguros**
   ```
   Username: notion-inventory-user
   Password: [genera una contraseña segura]
   ```
5. En **"Database User Privileges"**, selecciona **"Read and write to any database"**
6. Haz clic en **"Add User"**

#### 2.2 Configurar Acceso de Red

1. Ve a **"Network Access"** en el menú lateral
2. Haz clic en **"Add IP Address"**
3. Para desarrollo, puedes usar **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Para producción, agrega las IPs específicas de Vercel o tu servidor
5. Haz clic en **"Confirm"**

### 3. Obtener la Cadena de Conexión

1. Ve a **"Database"** en el menú lateral
2. Haz clic en **"Connect"** en tu cluster
3. Selecciona **"Connect your application"**
4. Elige **"Node.js"** como driver y la versión más reciente
5. **Copia la cadena de conexión**, se verá así:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 4. Configurar Variables de Entorno

1. **Crea un archivo `.env.local`** en la raíz de tu proyecto
2. **Agrega la configuración de MongoDB**:
   ```env
   # Reemplaza <username>, <password> y <cluster> con tus valores reales
   MONGODB_URI=mongodb+srv://notion-inventory-user:tu-password@cluster0.xxxxx.mongodb.net/notion_inventory?retryWrites=true&w=majority
   
   # Nombre de la base de datos
   MONGODB_DB=notion_inventory
   
   # Clave secreta para JWT (genera una segura)
   JWT_SECRET=tu-clave-secreta-super-segura-de-al-menos-32-caracteres
   
   # Tiempo de expiración de tokens
   JWT_EXPIRES_IN=7d
   ```

### 5. Estructura de la Base de Datos

La aplicación creará automáticamente las siguientes colecciones:

#### 📁 **users** - Información de usuarios
```javascript
{
  _id: ObjectId,
  name: "Juan Pérez",
  email: "juan@example.com",
  password: "hash_bcrypt_de_la_contraseña",
  createdAt: ISODate,
  lastLoginAt: ISODate,
  isActive: true,
  preferences: {
    language: "es-MX",
    theme: "system",
    notifications: true
  }
}
```

#### ⚙️ **user_configurations** - Configuraciones de Notion
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Referencia al usuario
  type: "notion",
  notionToken: "secret_token_encrypted",
  databaseId: "database_id_from_notion",
  workspaceName: "Mi Workspace",
  createdAt: ISODate,
  updatedAt: ISODate,
  isActive: true
}
```

#### 📊 **scan_history** - Historial de escaneos
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Referencia al usuario
  itemId: "INV-001",
  itemName: "Laptop Dell",
  scanTime: ISODate,
  configurationUsed: "Stock Check",
  fieldsModified: ["Stock Available", "Last Revision"],
  metadata: {
    userAgent: "...",
    ipAddress: "...",
    location: "..."
  }
}
```

### 6. Índices Automáticos

La aplicación creará automáticamente estos índices para optimizar las consultas:

```javascript
// Colección users
{ email: 1 } // Único
{ createdAt: 1 }

// Colección user_configurations  
{ userId: 1 }
{ userId: 1, type: 1 }

// Colección scan_history
{ userId: 1 }
{ scanTime: -1 }
{ userId: 1, scanTime: -1 }
```

## 🔒 Seguridad y Mejores Prácticas

### 1. **Contraseñas Seguras**
- Usa contraseñas de al menos 12 caracteres
- Incluye mayúsculas, minúsculas, números y símbolos
- Nunca hardcodees contraseñas en el código

### 2. **Variables de Entorno**
- Nunca subas archivos `.env` al repositorio
- Usa diferentes bases de datos para desarrollo y producción
- Rota las claves JWT periódicamente

### 3. **Acceso de Red**
- En producción, restringe el acceso a IPs específicas
- Usa VPN o IP whitelisting cuando sea posible
- Monitorea los logs de acceso regularmente

### 4. **Backup y Recuperación**
- MongoDB Atlas hace backups automáticos
- Configura alertas para monitorear el uso
- Prueba la restauración de backups periódicamente

## 🚀 Despliegue en Vercel

### 1. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings > Environment Variables**
3. Agrega las siguientes variables:
   ```
   MONGODB_URI = tu_cadena_de_conexion_completa
   MONGODB_DB = notion_inventory
   JWT_SECRET = tu_clave_secreta_jwt
   JWT_EXPIRES_IN = 7d
   NODE_ENV = production
   ```

### 2. Verificar la Conexión

1. Despliega tu aplicación
2. Visita `https://tu-app.vercel.app/api/health`
3. Deberías ver una respuesta como:
   ```json
   {
     "status": "healthy",
     "services": {
       "mongodb": { "status": "up" },
       "api": { "status": "up" }
     }
   }
   ```

## 🛠️ Funciones Disponibles

### 🔐 **Autenticación**
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Cerrar sesión

### ⚙️ **Configuración de Usuario**
- `GET /api/user/config` - Obtener configuración
- `POST /api/user/config` - Guardar configuración
- `DELETE /api/user/config` - Eliminar configuración

### 🏥 **Monitoreo**
- `GET /api/health` - Estado de salud del sistema

## 🐛 Solución de Problemas

### Error: "MongoNetworkError"
- **Causa**: Problema de conectividad de red
- **Solución**: Verifica que tu IP esté en la whitelist de MongoDB Atlas

### Error: "Authentication failed"
- **Causa**: Credenciales incorrectas
- **Solución**: Verifica username/password en la cadena de conexión

### Error: "Database not found"
- **Causa**: Nombre de base de datos incorrecto
- **Solución**: Verifica la variable `MONGODB_DB`

### Error: "Connection timeout"
- **Causa**: Firewall o configuración de red
- **Solución**: Verifica la configuración de Network Access en Atlas

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Vercel Functions
2. **Verifica las variables de entorno**
3. **Consulta la documentación** de MongoDB Atlas
4. **Usa el endpoint de health check** para diagnosticar

## 🎯 Próximos Pasos

Una vez configurado MongoDB:

1. ✅ Registra tu primer usuario
2. ✅ Configura tu integración con Notion
3. ✅ Comienza a usar el sistema de inventario
4. ✅ Monitorea el uso y rendimiento

¡Tu backend con MongoDB Atlas está listo para usar! 🚀