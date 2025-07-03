# Notion Inventory Manager

Una aplicación moderna para gestionar inventarios usando Notion como base de datos, con funcionalidades de escaneo de códigos de barras y actualizaciones automáticas.

## 🚀 Características

- **Conexión segura con Notion**: Integración completa con la API de Notion
- **Escaneo de códigos de barras**: Soporte para cámara y entrada manual
- **Configuraciones personalizables**: Define qué campos actualizar automáticamente
- **Modo demo**: Explora todas las funcionalidades sin configuración
- **Interfaz multiidioma**: Español e Inglés
- **Responsive design**: Optimizado para móviles, tablets y desktop
- **Historial de actividad**: Rastrea todos los cambios realizados

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Base de datos**: Notion API
- **Escaneo**: html5-qrcode
- **Iconos**: Lucide React

## 📋 Requisitos previos

1. **Cuenta de Notion**: Necesitas una cuenta activa de Notion
2. **Integración de Notion**: Crear una integración en [notion.so/my-integrations](https://www.notion.so/my-integrations)
3. **Base de datos de Notion**: Una base de datos compartida con tu integración

## 🔧 Configuración de Notion

### 1. Crear una integración

1. Ve a [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Haz clic en "New integration"
3. Completa los detalles:
   - **Name**: Nombre de tu integración (ej: "Inventory Manager")
   - **Logo**: Opcional
   - **Associated workspace**: Selecciona tu workspace
4. Haz clic en "Submit"
5. **Copia el "Internal Integration Token"** - lo necesitarás más tarde

### 2. Configurar la base de datos

1. Crea una nueva página en Notion o usa una existente
2. Agrega una base de datos (Database)
3. Configura las columnas que necesites, por ejemplo:
   - **ID** (Title): Identificador único del artículo
   - **Name** (Text): Nombre del artículo
   - **Status** (Select): Estado (Active, Inactive, Maintenance)
   - **Stock Available** (Checkbox): Si está disponible
   - **Condition** (Select): Condición (Excellent, Good, Fair, Poor)
   - **Location** (Text): Ubicación física
   - **Serial Number** (Text): Número de serie
   - **Last Revision** (Date): Última revisión
   - **Next Revision** (Date): Próxima revisión

### 3. Compartir la base de datos

1. En tu base de datos de Notion, haz clic en "Share"
2. Haz clic en "Invite"
3. Busca el nombre de tu integración y selecciónala
4. Asegúrate de que tenga permisos de "Can edit"
5. Haz clic en "Invite"

### 4. Obtener el ID de la base de datos

1. Abre tu base de datos en Notion
2. Copia la URL de la página
3. El ID de la base de datos es la parte entre la última `/` y el `?` (si existe)
   
   Ejemplo:
   ```
   https://notion.so/workspace/Database-Name-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
   El ID sería: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## 🚀 Instalación y desarrollo local

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd notion-inventory-manager
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tu token de Notion:

```env
NOTION_TOKEN=secret_tu_token_de_notion_aqui
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🌐 Despliegue en Vercel

### 1. Preparar el proyecto

Asegúrate de que todos los cambios estén guardados y el proyecto funcione localmente.

### 2. Subir a GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Haz clic en "New Project"
3. Conecta tu repositorio de GitHub
4. Selecciona tu proyecto
5. En "Environment Variables", agrega:
   - **Name**: `NOTION_TOKEN`
   - **Value**: Tu token de integración de Notion
6. Haz clic en "Deploy"

### 4. Configurar dominio (opcional)

Una vez desplegado, puedes configurar un dominio personalizado en la configuración del proyecto en Vercel.

## 📱 Uso de la aplicación

### Modo Demo

Para probar la aplicación sin configurar Notion:

1. Abre la aplicación
2. Haz clic en "Explorar en Modo Demo"
3. Explora todas las funcionalidades con datos de ejemplo

### Conexión real con Notion

1. Abre la aplicación
2. Ingresa tu token de integración
3. Ingresa el ID de tu base de datos
4. Opcionalmente, agrega el nombre de tu workspace
5. Haz clic en "Conectar a Notion"

### Crear configuraciones de escaneo

1. Ve a la sección "Configuración"
2. Haz clic en "Nueva Configuración"
3. Define:
   - **Nombre**: Identificador de la configuración
   - **Campo de búsqueda**: Por qué campo buscar (ID, Serial Number, etc.)
   - **Campos objetivo**: Qué campos actualizar automáticamente
4. Guarda la configuración

### Escanear artículos

1. Ve a la sección "Escanear"
2. Selecciona una configuración
3. Elige el modo de escaneo:
   - **Cámara**: Usa la cámara para escanear códigos de barras
   - **Manual**: Ingresa el código manualmente
4. Una vez encontrado el artículo, aplica la configuración

## 🔒 Seguridad

- **Tokens seguros**: Los tokens de Notion se almacenan como variables de entorno en el servidor
- **API Routes**: Todas las llamadas a Notion pasan por funciones serverless seguras
- **No exposición**: Las credenciales nunca se exponen en el frontend
- **CORS configurado**: Configuración adecuada de CORS para seguridad

## 🐛 Solución de problemas

### Error: "Database not found"

1. Verifica que el ID de la base de datos sea correcto
2. Asegúrate de que la integración tenga acceso a la base de datos
3. Confirma que la integración tenga permisos de "Can edit"

### Error: "Invalid token"

1. Verifica que el token de integración sea correcto
2. Asegúrate de que la integración esté activa
3. Regenera el token si es necesario

### Problemas de escaneo

1. Permite el acceso a la cámara en tu navegador
2. Asegúrate de tener buena iluminación
3. Verifica que el código de barras sea legible

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema