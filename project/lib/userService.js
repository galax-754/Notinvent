/**
 * 👥 SERVICIO DE USUARIOS
 * 
 * Este módulo contiene todas las operaciones relacionadas con usuarios:
 * - Crear usuarios
 * - Buscar usuarios
 * - Actualizar información de usuarios
 * - Gestionar configuraciones de usuario
 */

import { ObjectId } from 'mongodb';
import { getUsersCollection, getConfigurationsCollection, ensureIndexes } from './mongodb.js';
import { hashPassword, verifyPassword, validateUserData, validateEmail } from './auth.js';

/**
 * 👤 FUNCIÓN PARA CREAR UN NUEVO USUARIO
 * 
 * Crea un nuevo usuario en la base de datos con validación completa.
 * 
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña del usuario
 * @param {string} userData.confirmPassword - Confirmación de contraseña
 * @returns {Promise<Object>} Usuario creado (sin contraseña)
 */
export async function createUser(userData) {
  console.log('👤 Iniciando creación de usuario para:', userData.email);

  try {
    // ✅ PASO 1: Validar datos de entrada
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // ✅ PASO 2: Verificar que el email no exista
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Este email ya está registrado');
    }

    // ✅ PASO 3: Hashear la contraseña
    const hashedPassword = await hashPassword(userData.password);

    // ✅ PASO 4: Preparar datos del usuario
    const userToCreate = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      // Campos adicionales opcionales
      preferences: {
        language: 'es-MX',
        theme: 'system',
        notifications: true,
      },
    };

    // ✅ PASO 5: Insertar en la base de datos
    const usersCollection = await getUsersCollection();
    await ensureIndexes(); // Asegurar que los índices existan
    
    const result = await usersCollection.insertOne(userToCreate);
    
    if (!result.insertedId) {
      throw new Error('Error insertando usuario en la base de datos');
    }

    // ✅ PASO 6: Retornar usuario sin contraseña
    const createdUser = {
      id: result.insertedId.toString(),
      name: userToCreate.name,
      email: userToCreate.email,
      createdAt: userToCreate.createdAt.toISOString(),
      lastLoginAt: userToCreate.lastLoginAt.toISOString(),
      preferences: userToCreate.preferences,
    };

    console.log('✅ Usuario creado exitosamente:', createdUser.email);
    return createdUser;

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
}

/**
 * 🔍 FUNCIÓN PARA BUSCAR USUARIO POR EMAIL
 * 
 * Busca un usuario en la base de datos por su email.
 * 
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export async function findUserByEmail(email) {
  try {
    console.log('🔍 Buscando usuario por email:', email);
    
    if (!validateEmail(email)) {
      console.log('❌ Email inválido proporcionado');
      return null;
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (user) {
      console.log('✅ Usuario encontrado:', user.email);
      // Convertir ObjectId a string para el frontend
      user.id = user._id.toString();
      delete user._id;
    } else {
      console.log('❌ Usuario no encontrado');
    }

    return user;
  } catch (error) {
    console.error('❌ Error buscando usuario por email:', error);
    return null;
  }
}

/**
 * 🆔 FUNCIÓN PARA BUSCAR USUARIO POR ID
 * 
 * Busca un usuario en la base de datos por su ID.
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export async function findUserById(userId) {
  try {
    console.log('🆔 Buscando usuario por ID:', userId);
    
    if (!ObjectId.isValid(userId)) {
      console.log('❌ ID de usuario inválido');
      return null;
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });

    if (user) {
      console.log('✅ Usuario encontrado por ID:', user.email);
      // Convertir ObjectId a string y remover contraseña
      user.id = user._id.toString();
      delete user._id;
      delete user.password; // No retornar contraseña
    } else {
      console.log('❌ Usuario no encontrado por ID');
    }

    return user;
  } catch (error) {
    console.error('❌ Error buscando usuario por ID:', error);
    return null;
  }
}

/**
 * 🔐 FUNCIÓN PARA AUTENTICAR USUARIO
 * 
 * Verifica las credenciales de un usuario (email y contraseña).
 * 
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object|null>} Usuario autenticado o null
 */
export async function authenticateUser(email, password) {
  try {
    console.log('🔐 Autenticando usuario:', email);

    // ✅ PASO 1: Buscar usuario por email
    const user = await findUserByEmail(email);
    if (!user) {
      console.log('❌ Usuario no encontrado para autenticación');
      return null;
    }

    // ✅ PASO 2: Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Contraseña inválida para usuario:', email);
      return null;
    }

    // ✅ PASO 3: Actualizar último login
    await updateLastLogin(user.id);

    // ✅ PASO 4: Retornar usuario sin contraseña
    delete user.password;
    user.lastLoginAt = new Date().toISOString();

    console.log('✅ Usuario autenticado exitosamente:', email);
    return user;

  } catch (error) {
    console.error('❌ Error autenticando usuario:', error);
    return null;
  }
}

/**
 * ⏰ FUNCIÓN PARA ACTUALIZAR ÚLTIMO LOGIN
 * 
 * Actualiza la fecha de último login del usuario.
 * 
 * @param {string} userId - ID del usuario
 */
export async function updateLastLogin(userId) {
  try {
    console.log('⏰ Actualizando último login para usuario:', userId);
    
    const usersCollection = await getUsersCollection();
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLoginAt: new Date() } }
    );

    console.log('✅ Último login actualizado');
  } catch (error) {
    console.error('❌ Error actualizando último login:', error);
    // No lanzar error, es una operación secundaria
  }
}

/**
 * ⚙️ FUNCIÓN PARA GUARDAR CONFIGURACIÓN DE USUARIO
 * 
 * Guarda o actualiza la configuración de Notion del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @param {Object} config - Configuración a guardar
 * @param {string} config.notionToken - Token de Notion
 * @param {string} config.databaseId - ID de la base de datos de Notion
 * @param {string} config.workspaceName - Nombre del workspace (opcional)
 * @returns {Promise<Object>} Configuración guardada
 */
export async function saveUserConfiguration(userId, config) {
  try {
    console.log('⚙️ Guardando configuración para usuario:', userId);

    // ✅ Validar datos de entrada
    if (!config.notionToken || !config.databaseId) {
      throw new Error('Token de Notion y Database ID son requeridos');
    }

    const configToSave = {
      userId: new ObjectId(userId),
      type: 'notion',
      notionToken: config.notionToken,
      databaseId: config.databaseId,
      workspaceName: config.workspaceName || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    const configurationsCollection = await getConfigurationsCollection();
    
    // Usar upsert para actualizar si existe o crear si no existe
    const result = await configurationsCollection.replaceOne(
      { userId: new ObjectId(userId), type: 'notion' },
      configToSave,
      { upsert: true }
    );

    console.log('✅ Configuración guardada exitosamente');
    
    // Retornar configuración sin token sensible
    return {
      id: result.upsertedId?.toString() || 'updated',
      userId: userId,
      databaseId: config.databaseId,
      workspaceName: config.workspaceName,
      updatedAt: configToSave.updatedAt.toISOString(),
    };

  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    throw error;
  }
}

/**
 * 📖 FUNCIÓN PARA OBTENER CONFIGURACIÓN DE USUARIO
 * 
 * Obtiene la configuración de Notion del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Configuración del usuario o null
 */
export async function getUserConfiguration(userId) {
  try {
    console.log('📖 Obteniendo configuración para usuario:', userId);

    const configurationsCollection = await getConfigurationsCollection();
    const config = await configurationsCollection.findOne({
      userId: new ObjectId(userId),
      type: 'notion',
      isActive: true,
    });

    if (config) {
      console.log('✅ Configuración encontrada');
      return {
        id: config._id.toString(),
        userId: userId,
        notionToken: config.notionToken,
        databaseId: config.databaseId,
        workspaceName: config.workspaceName,
        updatedAt: config.updatedAt.toISOString(),
      };
    } else {
      console.log('❌ Configuración no encontrada');
      return null;
    }

  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    return null;
  }
}

/**
 * 🗑️ FUNCIÓN PARA ELIMINAR CONFIGURACIÓN DE USUARIO
 * 
 * Elimina la configuración de Notion del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 */
export async function deleteUserConfiguration(userId) {
  try {
    console.log('🗑️ Eliminando configuración para usuario:', userId);

    const configurationsCollection = await getConfigurationsCollection();
    const result = await configurationsCollection.deleteOne({
      userId: new ObjectId(userId),
      type: 'notion',
    });

    const success = result.deletedCount > 0;
    console.log(`${success ? '✅' : '❌'} Configuración ${success ? 'eliminada' : 'no encontrada'}`);
    
    return success;

  } catch (error) {
    console.error('❌ Error eliminando configuración:', error);
    return false;
  }
}

/**
 * 📊 FUNCIÓN PARA OBTENER CONFIGURACIONES DE USUARIO
 * 
 * Obtiene todas las configuraciones de la aplicación del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Configuraciones del usuario o null
 */
export async function getUserAppConfigurations(userId) {
  try {
    console.log('📊 Obteniendo configuraciones de app para usuario:', userId);

    const configurationsCollection = await getConfigurationsCollection();
    const config = await configurationsCollection.findOne({
      userId: new ObjectId(userId),
      type: 'app-config',
      isActive: true,
    });

    if (config) {
      console.log('✅ Configuraciones de app encontradas');
      return {
        id: config._id.toString(),
        userId: userId,
        scanConfigurations: config.scanConfigurations || [],
        displayConfigurations: config.displayConfigurations || [],
        activeDisplayConfig: config.activeDisplayConfig || null,
        scanHistory: config.scanHistory || [],
        demoMode: config.demoMode || false,
        updatedAt: config.updatedAt.toISOString(),
      };
    } else {
      console.log('❌ Configuraciones de app no encontradas');
      return null;
    }

  } catch (error) {
    console.error('❌ Error obteniendo configuraciones de app:', error);
    return null;
  }
}

/**
 * 💾 FUNCIÓN PARA GUARDAR CONFIGURACIONES DE USUARIO
 * 
 * Guarda las configuraciones de la aplicación del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @param {Object} config - Configuraciones a guardar
 * @returns {Promise<Object>} Configuración guardada
 */
export async function saveUserAppConfigurations(userId, config) {
  try {
    console.log('💾 Guardando configuraciones de app para usuario:', userId);

    const configToSave = {
      userId: new ObjectId(userId),
      type: 'app-config',
      scanConfigurations: config.scanConfigurations || [],
      displayConfigurations: config.displayConfigurations || [],
      activeDisplayConfig: config.activeDisplayConfig || null,
      scanHistory: config.scanHistory || [],
      demoMode: config.demoMode || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    const configurationsCollection = await getConfigurationsCollection();
    
    // Usar upsert para actualizar si existe o crear si no existe
    const result = await configurationsCollection.replaceOne(
      { userId: new ObjectId(userId), type: 'app-config' },
      configToSave,
      { upsert: true }
    );

    console.log('✅ Configuraciones de app guardadas exitosamente');
    
    return {
      id: result.upsertedId?.toString() || 'updated',
      userId: userId,
      scanConfigurations: configToSave.scanConfigurations,
      displayConfigurations: configToSave.displayConfigurations,
      activeDisplayConfig: configToSave.activeDisplayConfig,
      scanHistory: configToSave.scanHistory,
      demoMode: configToSave.demoMode,
      updatedAt: configToSave.updatedAt.toISOString(),
    };

  } catch (error) {
    console.error('❌ Error guardando configuraciones de app:', error);
    throw error;
  }
}

/**
 * 🗑️ FUNCIÓN PARA ELIMINAR CONFIGURACIONES DE USUARIO
 * 
 * Elimina las configuraciones de la aplicación del usuario.
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 */
export async function deleteUserAppConfigurations(userId) {
  try {
    console.log('🗑️ Eliminando configuraciones de app para usuario:', userId);

    const configurationsCollection = await getConfigurationsCollection();
    const result = await configurationsCollection.deleteOne({
      userId: new ObjectId(userId),
      type: 'app-config',
    });

    const success = result.deletedCount > 0;
    console.log(`${success ? '✅' : '❌'} Configuraciones de app ${success ? 'eliminadas' : 'no encontradas'}`);
    
    return success;

  } catch (error) {
    console.error('❌ Error eliminando configuraciones de app:', error);
    return false;
  }
}