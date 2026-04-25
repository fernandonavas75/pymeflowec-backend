'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   parseInt(process.env.MAIL_PORT, 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

//para depurar

const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Conexión al servidor de correo verificada correctamente.');
  } catch (error) {
    console.error('Error al verificar la conexión al servidor de correo:', error);
  }
};


const sendPasswordResetEmail = async (to, fullName, resetToken) => {
  try {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const info = await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject: 'Recuperación de contraseña — PymeFlowEc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f3864;">Recuperación de contraseña</h2>
        <p>Hola <strong>${fullName}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para continuar:</p>
        <a href="${resetUrl}"
           style="display:inline-block; padding:12px 24px; background:#2e75b6;
                  color:#fff; text-decoration:none; border-radius:4px; margin:16px 0;">
          Restablecer contraseña
        </a>
        <p>Este enlace expira en <strong>30 minutos</strong>.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
        <p style="color:#999; font-size:12px;">PymeFlowEc — Sistema ERP para PYMEs</p>
      </div>
    `,
  });
   console.log('Correo de recuperación enviado:', info.messageId);
   return true;
  }catch (error) {
    console.error('Error al enviar el correo de recuperación:', error);
    return false;
  };
  
};

const WelcomeEmail = async (to, fullName) => {

  try {
    const info = await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to,
      subject: 'Bienvenido a PymeFlowEc — Tu nuevo sistema ERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f3864;">¡Bienvenido a PymeFlowEc!</h2>
          <p>Hola <strong>${fullName}</strong>,</p>
          <p>Estamos encantados de tenerte con nosotros. Has iniciado sesión en PymeFlowEc, tu nuevo sistema ERP diseñado especialmente para pymes.</p>
          <p>Explora nuestras funcionalidades y descubre cómo podemos ayudarte a optimizar tu negocio.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
          <p style="color:#999; font-size:12px;">PymeFlowEc — Sistema ERP para PYMEs</p>
        </div>
      `,
    });
    console.log('Correo de bienvenida enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo de bienvenida:', error);
    return false;
  }
};

module.exports = { transporter, sendPasswordResetEmail, verifyConnection, WelcomeEmail };