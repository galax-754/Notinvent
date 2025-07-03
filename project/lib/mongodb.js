/**
 * 🗄️ UTILIDAD DE CONEXIÓN A MONGODB
 * 
 * Esta utilidad maneja la conexión a MongoDB Atlas de forma eficiente,
 * reutilizando conexiones existentes para evitar crear múltiples conexiones
 * en cada request de las funciones serverless.
 * 
 * IMPORTANTE: Las funciones serverless pueden reutilizar conexiones entre
 * requests si la función permanece "caliente", por lo que cachear la conexión
 * mejora significativamente el rendimiento.
 */

import { MongoClient } from 'mongodb';

// ✅ CONFIGURACIÓN DE CONEXIÓN
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'notion_inventory';

// Validar que la URI esté configurada
if (!MONGODB_URI) {
  throw new Error(
    '❌ Por favor define la variable de entorno MONGODB_URI en tu archivo .env.local'
  );
}

/**
 * 🔄 CACHE DE CONEXIÓN GLOBAL
 * 
 * En el entorno serverless, las variables globales persisten entre requests
 * si la función permanece "caliente". Esto nos permite reutilizar la conexión
 * a MongoDB sin tener que reconectar en cada request.
 */
let cachedClient = null;
let cachedDb = null;

/**
 * 🚀 FUNCIÓN PRINCIPAL DE CONEXIÓN
 * 
 * Esta función:
 * 1. Verifica si ya existe una conexión activa (cache)
 * 2. Si no existe, crea una nueva conexión
 * 3. Retorna tanto el cliente como la base de datos
 * 
 * @returns {Promise<{client: MongoClient, db: Db}>} Cliente y base de datos de MongoDB
 */
export async function connectToDatabase() {
  console.log('🔍 Verificando conexión a MongoDB...');

  // ✅ PASO 1: Verificar cache existente
  if (cachedClient && cachedDb) {
    console.log('✅ Reutilizando conexión existente a MongoDB');
    return {
      client: cachedClient,
      db: cachedDb,
    };
  }

  console.log('🔄 Creando nueva conexión a MongoDB...');

  try {
    // ✅ PASO 2: Crear nueva conexión
    const client = new MongoClient(MONGODB_URI, {
      // Opciones de conexión optimizadas para serverless
      maxPoolSize: 10, // Máximo 10 conexiones en el pool
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      bufferMaxEntries: 0, // Deshabilitar buffering
      bufferCommands: false, // Deshabilitar buffering de comandos
    });

    // ✅ PASO 3: Conectar al cliente
    await client.connect();
    console.log('🎉 Conexión a MongoDB establecida exitosamente');

    // ✅ PASO 4: Obtener referencia a la base de datos
    const db = client.db(MONGODB_DB);

    // ✅ PASO 5: Guardar en cache para reutilizar
    cachedClient = client;
    cachedDb = db;

    return {
      client: cachedClient,
      db: cachedDb,
    };
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw new Error(`Error de conexión a MongoDB: ${error.message}`);
  }
}

/**
 * 🔐 FUNCIÓN PARA OBTENER COLECCIÓN DE USUARIOS
 * 
 * Función helper que retorna la colección de usuarios.
 * Incluye la conexión automática a la base de datos.
 * 
 * @returns {Promise<Collection>} Colección de usuarios
 */
export async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

/**
 * ⚙️ FUNCIÓN PARA OBTENER COLECCIÓN DE CONFIGURACIONES
 * 
 * Función helper que retorna la colección de configuraciones de usuario.
 * Aquí se guardan los tokens de Notion y configuraciones personalizadas.
 * 
 * @returns {Promise<Collection>} Colección de configuraciones
 */
export async function getConfigurationsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('user_configurations');
}

/**
 * 📊 FUNCIÓN PARA OBTENER COLECCIÓN DE HISTORIAL
 * 
 * Función helper que retorna la colección de historial de escaneos.
 * 
 * @returns {Promise<Collection>} Colección de historial
 */
export async function getScanHistoryCollection() {
  const { db } = await connectToDatabase();
  return db.collection('scan_history');
}

/**
 * 🧹 FUNCIÓN DE LIMPIEZA (OPCIONAL)
 * 
 * Esta función cierra la conexión a MongoDB. Generalmente no es necesaria
 * en funciones serverless ya que Vercel maneja el ciclo de vida automáticamente,
 * pero puede ser útil para testing o casos especiales.
 */
export async function closeConnection() {
  if (cachedClient) {
    console.log('🔌 Cerrando conexión a MongoDB...');
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('✅ Conexión a MongoDB cerrada');
  }
}

/**
 * 🏥 FUNCIÓN DE VERIFICACIÓN DE SALUD
 * 
 * Verifica que la conexión a MongoDB esté funcionando correctamente.
 * Útil para endpoints de health check.
 * 
 * @returns {Promise<boolean>} true si la conexión está activa
 */
export async function checkDatabaseHealth() {
  try {
    const { db } = await connectToDatabase();
    // Hacer un ping simple a la base de datos
    await db.admin().ping();
    console.log('💚 MongoDB está funcionando correctamente');
    return true;
  } catch (error) {
    console.error('💔 Error en health check de MongoDB:', error);
    return false;
  }
}

/**
 * 📝 FUNCIÓN PARA CREAR ÍNDICES
 * 
 * Crea índices necesarios en las colecciones para optimizar las consultas.
 * Se ejecuta automáticamente cuando es necesario.
 */
export async function ensureIndexes() {
  try {
    console.log('📝 Verificando índices de MongoDB...');
    
    const usersCollection = await getUsersCollection();
    const configurationsCollection = await getConfigurationsCollection();
    const historyCollection = await getScanHistoryCollection();

    // Índices para usuarios
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ createdAt: 1 });

    // Índices para configuraciones
    await configurationsCollection.createIndex({ userId: 1 });
    await configurationsCollection.createIndex({ userId: 1, type: 1 });

    // Índices para historial
    await historyCollection.createIndex({ userId: 1 });
    await historyCollection.createIndex({ scanTime: -1 });
    await historyCollection.createIndex({ userId: 1, scanTime: -1 });

    console.log('✅ Índices de MongoDB verificados/creados');
  } catch (error) {
    console.error('❌ Error creando índices:', error);
    // No lanzar error, los índices son opcionales
  }
}