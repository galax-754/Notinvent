/**
 * 🔐 UTILIDADES DE AUTENTICACIÓN
 * 
 * Este módulo contiene todas las funciones relacionadas con autenticación:
 * - Hashing de contraseñas
 * - Generación y verificación de JWT tokens
 * - Validación de datos de usuario
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ CONFIGURACIÓN DE SEGURIDAD
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12; // Número de rondas para bcrypt (más alto = más seguro pero más lento)

/**
 * 🔒 FUNCIÓN PARA HASHEAR CONTRASEÑAS
 * 
 * Usa bcrypt para hashear contraseñas de forma segura.
 * NUNCA almacenes contraseñas en texto plano.
 * 
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
export async function hashPassword(password) {
  try {
    console.log('🔒 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    console.log('✅ Contraseña hasheada exitosamente');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hasheando contraseña:', error);
    throw new Error('Error procesando contraseña');
  }
}

/**
 * 🔓 FUNCIÓN PARA VERIFICAR CONTRASEÑAS
 * 
 * Compara una contraseña en texto plano con su hash almacenado.
 * 
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada almacenada
 * @returns {Promise<boolean>} true si las contraseñas coinciden
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    console.log('🔓 Verificando contraseña...');
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Verificación de contraseña: ${isValid ? 'exitosa' : 'fallida'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error verificando contraseña:', error);
    return false;
  }
}

/**
 * 🎫 FUNCIÓN PARA GENERAR JWT TOKEN
 * 
 * Crea un token JWT con la información del usuario.
 * El token incluye el ID del usuario y expira según la configuración.
 * 
 * @param {Object} user - Objeto del usuario
 * @param {string} user.id - ID del usuario
 * @param {string} user.email - Email del usuario
 * @returns {string} JWT token
 */
export function generateToken(user) {
  try {
    console.log('🎫 Generando JWT token para usuario:', user.email);
    
    const payload = {
      userId: user.id || user._id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    console.log('✅ JWT token generado exitosamente');
    return token;
  } catch (error) {
    console.error('❌ Error generando JWT token:', error);
    throw new Error('Error generando token de autenticación');
  }
}

/**
 * 🔐 FUNCIÓN PARA GENERAR TOKEN DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Crea un token JWT específico para recuperación de contraseña.
 * Este token expira en 1 hora por seguridad.
 * 
 * @param {Object} user - Objeto del usuario
 * @param {string} user.id - ID del usuario
 * @param {string} user.email - Email del usuario
 * @returns {string} JWT token de recuperación
 */
export function generatePasswordResetToken(user) {
  try {
    console.log('🔐 Generando token de recuperación para usuario:', user.email);
    
    const payload = {
      userId: user.id || user._id,
      email: user.email,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h', // Token válido por 1 hora
    });

    console.log('✅ Token de recuperación generado exitosamente');
    return token;
  } catch (error) {
    console.error('❌ Error generando token de recuperación:', error);
    throw new Error('Error generando token de recuperación');
  }
}

/**
 * 🔍 FUNCIÓN PARA VERIFICAR JWT TOKEN
 * 
 * Verifica y decodifica un JWT token.
 * Retorna la información del usuario si el token es válido.
 * 
 * @param {string} token - JWT token a verificar
 * @returns {Object|null} Información del usuario o null si es inválido
 */
export function verifyToken(token) {
  try {
    console.log('🔍 Verificando JWT token...');
    
    if (!token) {
      console.log('❌ Token no proporcionado');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT token verificado exitosamente para usuario:', decoded.email);
    
    return decoded;
  } catch (error) {
    console.error('❌ Error verificando JWT token:', error.message);
    return null;
  }
}

/**
 * 📧 FUNCIÓN PARA VALIDAR EMAIL
 * 
 * Valida que el formato del email sea correcto.
 * 
 * @param {string} email - Email a validar
 * @returns {boolean} true si el email es válido
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  console.log(`📧 Validación de email ${email}: ${isValid ? 'válido' : 'inválido'}`);
  return isValid;
}

/**
 * 🔐 FUNCIÓN PARA VALIDAR CONTRASEÑA
 * 
 * Valida que la contraseña cumpla con los requisitos de seguridad.
 * 
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con isValid y errores
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('La contraseña es requerida');
  } else {
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
  }

  const isValid = errors.length === 0;
  console.log(`🔐 Validación de contraseña: ${isValid ? 'válida' : 'inválida'}`);
  
  return {
    isValid,
    errors
  };
}

/**
 * 👤 FUNCIÓN PARA VALIDAR DATOS DE USUARIO
 * 
 * Valida todos los datos de un usuario (registro).
 * 
 * @param {Object} userData - Datos del usuario
 * @returns {Object} Objeto con isValid y errores
 */
export function validateUserData(userData) {
  const { name, email, password, confirmPassword } = userData;
  const errors = [];

  // Validar nombre
  if (!name || name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  // Validar email
  if (!validateEmail(email)) {
    errors.push('El formato del email es inválido');
  }

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validar confirmación de contraseña
  if (password !== confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }

  const isValid = errors.length === 0;
  console.log(`👤 Validación de datos de usuario: ${isValid ? 'válidos' : 'inválidos'}`);
  
  return {
    isValid,
    errors
  };
}

/**
 * 🍪 FUNCIÓN PARA CREAR COOKIE DE AUTENTICACIÓN
 * 
 * Crea una cookie segura para almacenar el JWT token.
 * 
 * @param {string} token - JWT token
 * @returns {string} String de cookie para Set-Cookie header
 */
export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return [
    `auth-token=${token}`,
    'HttpOnly', // No accesible desde JavaScript del cliente
    'SameSite=Strict', // Protección CSRF
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 días en segundos
    'Path=/', // Disponible en toda la aplicación
    ...(isProduction ? ['Secure'] : []), // HTTPS solo en producción
  ].join('; ');
}

/**
 * 🧹 FUNCIÓN PARA LIMPIAR COOKIE DE AUTENTICACIÓN
 * 
 * Crea una cookie que expira inmediatamente para hacer logout.
 * 
 * @returns {string} String de cookie para limpiar autenticación
 */
export function clearAuthCookie() {
  return [
    'auth-token=',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    'Path=/',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');
}