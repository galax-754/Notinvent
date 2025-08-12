/**
 * ⚙️ ENDPOINT DE CONFIGURACIÓN DE USUARIO
 * 
 * Este endpoint maneja las configuraciones de Notion del usuario:
 * - GET: Obtener configuración actual
 * - POST: Guardar nueva configuración
 * - DELETE: Eliminar configuración
 */

import { verifyToken } from '../../lib/auth.js';
import { 
  getUserConfiguration, 
  saveUserConfiguration, 
  deleteUserConfiguration,
  getUserAppConfigurations,
  saveUserAppConfigurations,
  deleteUserAppConfigurations
} from '../../lib/userService.js';

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ MANEJAR PREFLIGHT REQUEST
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log(`⚙️ === INICIO DE ${req.method} CONFIG ===`);
    
    // ✅ PASO 1: Verificar autenticación
    const cookies = req.headers.cookie;
    let authToken = null;

    if (cookies) {
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      authToken = tokenMatch ? tokenMatch[1] : null;
    }

    if (!authToken) {
      return res.status(401).json({
        error: 'Token de autenticación requerido'
      });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return res.status(401).json({
        error: 'Token de autenticación inválido'
      });
    }

    const userId = decoded.userId;
    console.log('👤 Usuario autenticado:', decoded.email);

    // ✅ MANEJAR DIFERENTES MÉTODOS HTTP
    switch (req.method) {
      case 'GET':
        return await handleGetConfig(res, userId);
      
      case 'POST':
        return await handleSaveConfig(req, res, userId);
      
      case 'DELETE':
        return await handleDeleteConfig(res, userId);
      
      default:
        return res.status(405).json({
          error: 'Método no permitido'
        });
    }

  } catch (error) {
    console.error('❌ Error en endpoint de configuración:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/**
 * 📖 MANEJAR GET - Obtener configuración
 */
async function handleGetConfig(res, userId) {
  try {
    console.log('📖 Obteniendo configuración para usuario:', userId);
    
    // Obtener configuración de Notion
    const notionConfig = await getUserConfiguration(userId);
    
    // Obtener configuraciones de la aplicación
    const appConfig = await getUserAppConfigurations(userId);
    
    if (notionConfig || appConfig) {
      const response = {
        success: true,
        notionConfig: notionConfig ? {
          id: notionConfig.id,
          databaseId: notionConfig.databaseId,
          workspaceName: notionConfig.workspaceName,
          updatedAt: notionConfig.updatedAt,
          hasToken: !!notionConfig.notionToken, // Solo indicar si existe
        } : null,
        appConfig: appConfig ? {
          id: appConfig.id,
          scanConfigurations: appConfig.scanConfigurations,
          displayConfigurations: appConfig.displayConfigurations,
          activeDisplayConfig: appConfig.activeDisplayConfig,
          scanHistory: appConfig.scanHistory,
          demoMode: appConfig.demoMode,
          updatedAt: appConfig.updatedAt,
        } : null
      };
      
      return res.status(200).json(response);
    } else {
      return res.status(404).json({
        error: 'Configuración no encontrada'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    throw error;
  }
}

/**
 * 💾 MANEJAR POST - Guardar configuración
 */
async function handleSaveConfig(req, res, userId) {
  try {
    console.log('💾 Guardando configuración para usuario:', userId);
    
    const { notionToken, databaseId, workspaceName, config } = req.body;

    // Si se envía configuración de Notion
    if (notionToken && databaseId) {
      const savedNotionConfig = await saveUserConfiguration(userId, {
        notionToken,
        databaseId,
        workspaceName
      });

      return res.status(200).json({
        success: true,
        notionConfig: savedNotionConfig,
        message: 'Configuración de Notion guardada exitosamente'
      });
    }

    // Si se envía configuración de la aplicación
    if (config) {
      const savedAppConfig = await saveUserAppConfigurations(userId, config);

      return res.status(200).json({
        success: true,
        appConfig: savedAppConfig,
        message: 'Configuración de la aplicación guardada exitosamente'
      });
    }

    return res.status(400).json({
      error: 'Se requiere configuración de Notion o de la aplicación'
    });

  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    
    let errorMessage = 'Error guardando configuración';
    if (error.message.includes('requeridos')) {
      errorMessage = error.message;
    }

    return res.status(400).json({
      error: errorMessage
    });
  }
}

/**
 * 🗑️ MANEJAR DELETE - Eliminar configuración
 */
async function handleDeleteConfig(res, userId) {
  try {
    console.log('🗑️ Eliminando configuración para usuario:', userId);
    
    // Eliminar configuración de Notion
    const deletedNotion = await deleteUserConfiguration(userId);
    
    // Eliminar configuraciones de la aplicación
    const deletedApp = await deleteUserAppConfigurations(userId);
    
    if (deletedNotion || deletedApp) {
      return res.status(200).json({
        success: true,
        message: 'Configuraciones eliminadas exitosamente'
      });
    } else {
      return res.status(404).json({
        error: 'Configuración no encontrada'
      });
    }

  } catch (error) {
    console.error('❌ Error eliminando configuración:', error);
    throw error;
  }
}