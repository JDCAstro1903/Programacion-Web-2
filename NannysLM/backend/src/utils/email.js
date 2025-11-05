const nodemailer = require('nodemailer');

/**
 * Generar HTML profesional para correo de activación
 */
const getActivationEmailTemplate = (toName, activationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activa tu cuenta en NannysLM</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Contenedor principal -->
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header con gradiente -->
                <div style="background: linear-gradient(135deg, #1EB2E5 0%, #E31B7E 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido a NannysLM!</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">La plataforma más segura para encontrar cuidadores de confianza</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Saludo personalizado -->
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                        Hola <strong>${toName}</strong>,
                    </p>

                    <!-- Mensaje principal -->
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Gracias por registrarte en NannysLM. Estamos emocionados de tenerte como parte de nuestra comunidad. 
                        Para continuar, necesitas verificar tu cuenta haciendo clic en el botón de abajo.
                    </p>

                    <!-- Ícono de seguridad -->
                    <div style="text-align: center; margin: 30px 0;">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="#10B981" opacity="0.1"/>
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #1EB2E5 0%, #0A9BC9 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(30, 178, 229, 0.3);">
                            ✓ Activar mi cuenta
                        </a>
                    </div>

                    <!-- Texto alternativo -->
                    <p style="margin: 20px 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        O copia y pega este enlace en tu navegador:<br/>
                        <span style="color: #64748b; word-break: break-all;">${activationLink}</span>
                    </p>

                    <!-- Línea separadora -->
                    <div style="height: 1px; background: #e2e8f0; margin: 30px 0;"></div>

                    <!-- Información de seguridad -->
                    <div style="background: #f0f9ff; border-left: 4px solid #1EB2E5; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px; color: #0c5460;">
                            <strong>🔒 Información de seguridad:</strong> Este enlace expira en 24 horas. Si no reconoces esta solicitud, simplemente ignora este correo.
                        </p>
                    </div>

                </div>

                <!-- Footer -->
                <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        ¿Preguntas? Contáctanos en <a href="mailto:soporte@nannyslm.com" style="color: #1EB2E5; text-decoration: none; font-weight: 600;">soporte@nannyslm.com</a>
                    </p>
                    <p style="margin: 0;">
                        © 2025 NannysLM. Todos los derechos reservados.
                    </p>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <a href="#" style="color: #1EB2E5; text-decoration: none; margin: 0 8px; font-size: 11px;">Política de privacidad</a>
                        <span style="color: #cbd5e1;">•</span>
                        <a href="#" style="color: #1EB2E5; text-decoration: none; margin: 0 8px; font-size: 11px;">Términos de servicio</a>
                    </div>
                </div>

            </div>

            <!-- Disclaimer -->
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px; line-height: 1.5;">
                Este es un correo automático. Por favor no respondas a este mensaje.
            </p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Enviar correo de activación. Usa variables de entorno para la configuración SMTP.
 * Si no hay configuración SMTP, hace un log con el link de activación (útil en desarrollo).
 */
const sendActivationEmail = async (toEmail, toName, activationLink) => {
    // Leer configuración desde env
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = '✓ Activa tu cuenta en NannysLM';
    const html = getActivationEmailTemplate(toName, activationLink);

    // Si no hay credenciales SMTP, hacer fallback a console.log
    if (!host || !port || !user || !pass) {
        console.log('📨 Activación (sin SMTP): Enlace de activación:', activationLink);
        return { success: true, message: 'Activation link logged to console (SMTP not configured)' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port, 10),
            secure: parseInt(port, 10) === 465, // true for 465, false for other ports
            auth: {
                user,
                pass
            }
        });

        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || `NannysLM <${user}>`,
            to: toEmail,
            subject,
            html
        });

        console.log('📨 Activation email sent:', info.messageId);
        return { success: true, message: 'Email sent', info };
    } catch (error) {
        console.error('❌ Error sending activation email:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Generar HTML profesional para correo de restablecimiento de contraseña
 */
const getPasswordResetEmailTemplate = (toName, resetLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablece tu contraseña en NannysLM</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Contenedor principal -->
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header con gradiente -->
                <div style="background: linear-gradient(135deg, #1EB2E5 0%, #E31B7E 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Restablece tu Contraseña</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Recupera acceso a tu cuenta NannysLM</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Saludo personalizado -->
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                        Hola <strong>${toName}</strong>,
                    </p>

                    <!-- Mensaje principal -->
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este correo de forma segura.
                    </p>

                    <!-- Ícono de contraseña -->
                    <div style="text-align: center; margin: 30px 0;">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="#F59E0B" opacity="0.1" stroke="#F59E0B" stroke-width="1.5"/>
                            <path d="M7 11V7C7 4.239 9.239 2 12 2C14.761 2 17 4.239 17 7V11" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="17" r="1" fill="#F59E0B"/>
                        </svg>
                    </div>

                    <!-- Alerta de seguridad -->
                    <div style="background: #fff7ed; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px; color: #7c2d12;">
                            <strong>⏰ Importante:</strong> Este enlace expira en <strong>1 hora</strong> por razones de seguridad.
                        </p>
                    </div>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                            🔑 Restablecer contraseña
                        </a>
                    </div>

                    <!-- Instrucciones paso a paso -->
                    <div style="background: #f0f9ff; padding: 16px; border-radius: 10px; margin: 20px 0;">
                        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #0c5460;">
                            Si el botón no funciona, sigue estos pasos:
                        </p>
                        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #0c5460; line-height: 1.8;">
                            <li>Copia este enlace</li>
                            <li>Abre NannysLM en tu navegador</li>
                            <li>Pega el enlace en la barra de direcciones</li>
                            <li>Sigue las instrucciones para crear una nueva contraseña</li>
                        </ol>
                    </div>

                    <!-- Texto alternativo -->
                    <p style="margin: 20px 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        O copia y pega este enlace:<br/>
                        <span style="color: #64748b; word-break: break-all; font-size: 11px;">${resetLink}</span>
                    </p>

                    <!-- Línea separadora -->
                    <div style="height: 1px; background: #e2e8f0; margin: 30px 0;"></div>

                    <!-- Consejos de seguridad -->
                    <div style="background: #fef3c7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px; color: #92400e;">
                            <strong>💡 Consejo de seguridad:</strong> Crea una contraseña fuerte con mayúsculas, minúsculas y números. Nunca compartas tu contraseña con nadie.
                        </p>
                    </div>

                </div>

                <!-- Footer -->
                <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        ¿Preguntas? Contáctanos en <a href="mailto:soporte@nannyslm.com" style="color: #1EB2E5; text-decoration: none; font-weight: 600;">soporte@nannyslm.com</a>
                    </p>
                    <p style="margin: 0;">
                        © 2025 NannysLM. Todos los derechos reservados.
                    </p>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <a href="#" style="color: #1EB2E5; text-decoration: none; margin: 0 8px; font-size: 11px;">Política de privacidad</a>
                        <span style="color: #cbd5e1;">•</span>
                        <a href="#" style="color: #1EB2E5; text-decoration: none; margin: 0 8px; font-size: 11px;">Términos de servicio</a>
                    </div>
                </div>

            </div>

            <!-- Disclaimer -->
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px; line-height: 1.5;">
                Este es un correo automático. Por favor no respondas a este mensaje.
            </p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Enviar correo para restablecer contraseña
 */
const sendPasswordResetEmail = async (toEmail, toName, resetLink) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = '🔑 Restablece tu contraseña en NannysLM';
    const html = getPasswordResetEmailTemplate(toName, resetLink);

    if (!host || !port || !user || !pass) {
        console.log('📨 Password reset (sin SMTP): Enlace de restablecimiento:', resetLink);
        return { success: true, message: 'Password reset link logged to console (SMTP not configured)' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port, 10),
            secure: parseInt(port, 10) === 465,
            auth: { user, pass }
        });

        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || `NannysLM <${user}>`,
            to: toEmail,
            subject,
            html
        });

        console.log('📨 Password reset email sent:', info.messageId);
        return { success: true, message: 'Email sent', info };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return { success: false, message: error.message };
    }
};

module.exports = { sendActivationEmail, sendPasswordResetEmail };
