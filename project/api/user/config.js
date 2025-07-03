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
  deleteUserConfiguration 
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
    
    const config = await getUserConfiguration(userId);
    
    if (config) {
      // No retornar el token completo por seguridad
      const safeConfig = {
        id: config.id,
        databaseId: config.databaseId,
        workspaceName: config.workspaceName,
        updatedAt: config.updatedAt,
        hasToken: !!config.notionToken, // Solo indicar si existe
      };

      return res.status(200).json({
        success: true,
        config: safeConfig
      });
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
    
    const { notionToken, databaseId, workspaceName } = req.body;

    if (!notionToken || !databaseId) {
      return res.status(400).json({
        error: 'Token de Notion y Database ID son requeridos'
      });
    }

    const savedConfig = await saveUserConfiguration(userId, {
      notionToken,
      databaseId,
      workspaceName
    });

    return res.status(200).json({
      success: true,
      config: savedConfig,
      message: 'Configuración guardada exitosamente'
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
    
    const deleted = await deleteUserConfiguration(userId);
    
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'Configuración eliminada exitosamente'
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