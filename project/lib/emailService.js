/**
 * 📧 SERVICIO DE EMAIL
 * 
 * Este servicio maneja el envío de emails usando Nodemailer:
 * - Emails de recuperación de contraseña
 * - Emails de bienvenida
 * - Emails de verificación
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 📧 ENVIAR EMAIL DE RECUPERACIÓN DE CONTRASEÑA
   * 
   * @param {string} email - Email del usuario
   * @param {string} resetToken - Token de recuperación
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  async sendPasswordResetEmail(email, resetToken, userName = 'Usuario') {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"NotInvent" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - NotInvent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Recuperación de Contraseña</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hola <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Has solicitado restablecer tu contraseña en <strong>NotInvent</strong>. 
              Haz clic en el botón de abajo para crear una nueva contraseña:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si no solicitaste este cambio, puedes ignorar este email. 
              El enlace expirará en 1 hora por seguridad.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `,
      text: `
        Recuperación de Contraseña - NotInvent
        
        Hola ${userName},
        
        Has solicitado restablecer tu contraseña en NotInvent.
        Visita el siguiente enlace para crear una nueva contraseña:
        
        ${resetLink}
        
        Si no solicitaste este cambio, puedes ignorar este email.
        El enlace expirará en 1 hora por seguridad.
        
        Este es un email automático, por favor no respondas a este mensaje.
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de recuperación enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      return false;
    }
  }

  /**
   * 📧 ENVIAR EMAIL DE CONTRASEÑA TEMPORAL
   * 
   * @param {string} email - Email del usuario
   * @param {string} tempPassword - Contraseña temporal generada
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  async sendTempPasswordEmail(email, tempPassword, userName = 'Usuario') {
    const mailOptions = {
      from: `"NotInvent" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Contraseña Temporal - NotInvent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Contraseña Temporal</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hola <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Has solicitado restablecer tu contraseña en <strong>NotInvent</strong>. 
              Aquí tienes tu contraseña temporal:
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #007bff;">
              <h3 style="color: #007bff; margin: 0; font-size: 24px; letter-spacing: 2px;">${tempPassword}</h3>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Contraseña Temporal</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>Instrucciones:</strong>
            </p>
            <ol style="color: #666; font-size: 16px; line-height: 1.6;">
              <li>Usa esta contraseña temporal para iniciar sesión</li>
              <li>Una vez dentro, ve a tu perfil y cambia la contraseña</li>
              <li>Esta contraseña temporal solo es válida para este inicio de sesión</li>
            </ol>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si no solicitaste este cambio, contacta con soporte inmediatamente.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `,
      text: `
        Contraseña Temporal - NotInvent
        
        Hola ${userName},
        
        Has solicitado restablecer tu contraseña en NotInvent.
        Aquí tienes tu contraseña temporal:
        
        ${tempPassword}
        
        Instrucciones:
        1. Usa esta contraseña temporal para iniciar sesión
        2. Una vez dentro, ve a tu perfil y cambia la contraseña
        3. Esta contraseña temporal solo es válida para este inicio de sesión
        
        Si no solicitaste este cambio, contacta con soporte inmediatamente.
        
        Este es un email automático, por favor no respondas a este mensaje.
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de contraseña temporal enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de contraseña temporal:', error);
      return false;
    }
  }

  /**
   * 📧 ENVIAR EMAIL DE BIENVENIDA
   * 
   * @param {string} email - Email del usuario
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  async sendWelcomeEmail(email, userName) {
    const mailOptions = {
      from: `"NotInvent" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '¡Bienvenido a NotInvent!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎉 ¡Bienvenido a NotInvent!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hola <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              ¡Gracias por registrarte en <strong>NotInvent</strong>! 
              Estamos emocionados de tenerte como parte de nuestra comunidad.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Ya puedes comenzar a usar todas las funcionalidades de la plataforma.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
        </div>
      `,
      text: `
        ¡Bienvenido a NotInvent!
        
        Hola ${userName},
        
        ¡Gracias por registrarte en NotInvent! 
        Estamos emocionados de tenerte como parte de nuestra comunidad.
        
        Ya puedes comenzar a usar todas las funcionalidades de la plataforma.
        
        Si tienes alguna pregunta, no dudes en contactarnos.
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
