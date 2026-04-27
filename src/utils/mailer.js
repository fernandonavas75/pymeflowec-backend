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

const WelcomeEmail = async (to, fullName, username, password, modules = []) => {
  const modulesHtml = modules.length > 0
    ? `
        <h3 style="color:#1f3864; margin-top:24px;">Módulos solicitados</h3>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr style="background:#2e75b6; color:#fff;">
              <th style="padding:8px 12px; text-align:left;">Módulo</th>
              <th style="padding:8px 12px; text-align:left;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${modules.map((mod, i) => `
            <tr style="background:${i % 2 === 0 ? '#f5f8ff' : '#fff'};">
              <td style="padding:8px 12px; font-weight:600; color:#1f3864;">${mod.name}</td>
              <td style="padding:8px 12px; color:#555;">${mod.description || 'Sin descripción'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p style="font-size:13px; color:#888; margin-top:8px;">
          Estos módulos están habilitados con un período de prueba de <strong>15 días</strong>.
        </p>`
    : `<p>No seleccionaste módulos al registrarte. Puedes activarlos desde tu panel de administración.</p>`;

  try {
    const info = await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to,
      subject: 'Bienvenido a PymeFlowEc — Tu nuevo sistema ERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f3864;">¡Bienvenido a PymeFlowEc!</h2>
          <p>Hola <strong>${fullName}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>

          <div style="background:#f5f8ff; border-left:4px solid #2e75b6; padding:16px 20px; margin:20px 0; border-radius:4px;">
            <p style="margin:0 0 8px;"><strong>Usuario:</strong> ${username}</p>
            <p style="margin:0;"><strong>Contraseña:</strong> ${password}</p>
          </div>
          <p style="font-size:13px; color:#e53e3e;">
            Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión.
          </p>

          ${modulesHtml}

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