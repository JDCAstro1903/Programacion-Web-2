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

/**
 * Generar HTML profesional para correo con credenciales de nanny
 */
const getNannyCredentialsEmailTemplate = (toName, email, password, loginLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tus Credenciales en NannysLM</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Contenedor principal -->
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header con gradiente -->
                <div style="background: linear-gradient(135deg, #E31B7E 0%, #1EB2E5 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenida a NannysLM!</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Tu cuenta ha sido registrada exitosamente</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Saludo personalizado -->
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                        Hola <strong>${toName}</strong>,
                    </p>

                    <!-- Mensaje principal -->
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        ¡Felicidades! Tu cuenta como cuidadora profesional en NannysLM ha sido creada. Te compartimos tus credenciales de acceso para que comiences a usar la plataforma.
                    </p>

                    <!-- Ícono de éxito -->
                    <div style="text-align: center; margin: 30px 0;">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#E31B7E" opacity="0.1"/>
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#E31B7E" stroke-width="1.5"/>
                            <path d="M8 12.5L10.5 15L16 9" stroke="#E31B7E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- Credenciales de acceso -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%); border: 2px solid #E31B7E; border-radius: 12px; padding: 24px; margin: 20px 0;">
                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #92400e; text-align: center;">
                            🔐 Tus Credenciales de Acceso
                        </p>
                        
                        <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 600;">Correo Electrónico:</p>
                            <p style="margin: 0; font-size: 14px; color: #374151; font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; word-break: break-all;">
                                ${email}
                            </p>
                        </div>

                        <div style="background: white; border-radius: 8px; padding: 16px;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 600;">Contraseña Temporal:</p>
                            <p style="margin: 0; font-size: 14px; color: #374151; font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; word-break: break-all;">
                                ${password}
                            </p>
                        </div>

                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #fed7aa;">
                            <p style="margin: 0; font-size: 12px; color: #92400e;">
                                <strong>⚠️ Importante:</strong> Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
                            </p>
                        </div>
                    </div>

                    <!-- Alerta de seguridad -->
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px; color: #7f1d1d;">
                            <strong>🔒 Seguridad:</strong> No compartas estas credenciales con nadie. Nunca pedimos contraseñas por correo después de este.
                        </p>
                    </div>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #E31B7E 0%, #d61569 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(227, 27, 126, 0.3);">
                            🚀 Iniciar Sesión
                        </a>
                    </div>

                    <!-- Guía rápida -->
                    <div style="background: #f0f9ff; border-left: 4px solid #1EB2E5; padding: 16px; border-radius: 10px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #0c5460;">
                            📱 Próximos pasos:
                        </p>
                        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #0c5460; line-height: 1.8;">
                            <li>Haz clic en el botón "Iniciar Sesión" o ve a ${loginLink}</li>
                            <li>Ingresa tu correo y contraseña temporal</li>
                            <li>Completa tu perfil profesional</li>
                            <li>Establece tu disponibilidad horaria</li>
                            <li>¡Comienza a aceptar servicios!</li>
                        </ol>
                    </div>

                    <!-- Línea separadora -->
                    <div style="height: 1px; background: #e2e8f0; margin: 30px 0;"></div>

                    <!-- Datos de contacto -->
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-align: center;">
                        Si tienes preguntas o problemas para acceder, no dudes en contactarnos.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        ¿Preguntas? Contáctanos en <a href="mailto:soporte@nannyslm.com" style="color: #E31B7E; text-decoration: none; font-weight: 600;">soporte@nannyslm.com</a>
                    </p>
                    <p style="margin: 0;">
                        © 2025 NannysLM. Todos los derechos reservados.
                    </p>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <a href="#" style="color: #E31B7E; text-decoration: none; margin: 0 8px; font-size: 11px;">Política de privacidad</a>
                        <span style="color: #cbd5e1;">•</span>
                        <a href="#" style="color: #E31B7E; text-decoration: none; margin: 0 8px; font-size: 11px;">Términos de servicio</a>
                    </div>
                </div>

            </div>

            <!-- Disclaimer -->
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px; line-height: 1.5;">
                Este es un correo automático generado cuando se registra una nueva nanny. Por favor no respondas a este mensaje.
            </p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Enviar correo con credenciales a nueva nanny
 */
const sendNannyCredentialsEmail = async (toEmail, toName, password, loginLink) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = '🎉 Bienvenida a NannysLM - Tus Credenciales de Acceso';
    const html = getNannyCredentialsEmailTemplate(toName, toEmail, password, loginLink);

    if (!host || !port || !user || !pass) {
        console.log('📨 Nanny credentials (sin SMTP): Email:', toEmail, 'Password:', password);
        return { success: true, message: 'Nanny credentials logged to console (SMTP not configured)' };
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

        console.log('📨 Nanny credentials email sent:', info.messageId);
        return { success: true, message: 'Credentials email sent', info };
    } catch (error) {
        console.error('❌ Error sending nanny credentials email:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Template HTML para notificación de servicio disponible
 */
const getServiceNotificationEmailTemplate = (nannyName, serviceData) => {
    const serviceTypeNames = {
        'home-care': 'Niñeras a domicilio',
        'night-care': 'Cuidado nocturno',
        'weekly-care': 'Niñeras por semana',
        'event-care': 'Acompañamiento a eventos',
        'travel-care': 'Acompañamiento en viajes'
    };

    const serviceTypeName = serviceTypeNames[serviceData.service_type] || serviceData.service_type;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo servicio disponible - NannysLM</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #E31B7E 0%, #C01568 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎯 Nuevo Servicio Disponible</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">¡Una familia necesita tu ayuda!</p>
                </div>

                <!-- Contenido -->
                <div style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                        Hola <strong>${nannyName}</strong>,
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Una nueva oportunidad de servicio está disponible. ¡Revisa los detalles y acéptalo antes que otra nanny!
                    </p>

                    <!-- Detalles del servicio -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">📋 Detalles del Servicio</h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Título:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${serviceData.title}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Tipo:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${serviceTypeName}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Fecha:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${formatDate(serviceData.start_date)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Horario:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${serviceData.start_time} - ${serviceData.end_time}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Niños:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${serviceData.number_of_children}
                                </td>
                            </tr>
                            ${serviceData.address ? `
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                                    <strong>Ubicación:</strong>
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                    ${serviceData.address}
                                </td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                    <!-- Alerta de urgencia -->
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px; color: #92400e;">
                            <strong>⏰ ¡Actúa rápido!</strong> El primer nanny en aceptar se llevará el servicio.
                        </p>
                    </div>

                    <!-- Botón de acción -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:4200/nanny/service-details/${serviceData.id}" style="display: inline-block; background: linear-gradient(135deg, #E31B7E 0%, #C01568 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(227, 27, 126, 0.3);">
                            ✓ Ver y Aceptar Servicio
                        </a>
                    </div>

                    <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                        También puedes iniciar sesión en tu dashboard de NannysLM para ver más detalles
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        ¿Preguntas? Contáctanos en <a href="mailto:soporte@nannyslm.com" style="color: #E31B7E; text-decoration: none;">soporte@nannyslm.com</a>
                    </p>
                    <p style="margin: 0;">© 2025 NannysLM. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Enviar notificación de servicio disponible a una nanny
 */
const sendServiceNotificationEmail = async (toEmail, nannyName, serviceData) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = '🎯 Nuevo servicio disponible - ¡Acéptalo ahora!';
    const html = getServiceNotificationEmailTemplate(nannyName, serviceData);

    if (!host || !port || !user || !pass) {
        console.log('📨 Service notification (sin SMTP): Email:', toEmail, 'Service:', serviceData.title);
        return { success: true, message: 'Service notification logged to console (SMTP not configured)' };
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

        console.log('📨 Service notification email sent:', info.messageId);
        return { success: true, message: 'Service notification email sent', info };
    } catch (error) {
        console.error('❌ Error sending service notification email:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Obtener plantilla HTML para verificación aprobada
 */
const getVerificationApprovedEmailTemplate = (clientName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación Aprobada</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header con gradiente verde (éxito) -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✓ ¡Verificación Aprobada!</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Tu documento ha sido validado correctamente</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                        Hola <strong>${clientName}</strong>,
                    </p>

                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Nos complace informarte que tu documento de identificación ha sido verificado y aprobado correctamente. Tu cuenta está completamente activada y lista para usar.
                    </p>

                    <!-- Ícono de éxito -->
                    <div style="text-align: center; margin: 30px 0;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                            <circle cx="12" cy="12" r="11" stroke="#10b981" stroke-width="2" fill="none"/>
                            <path d="M9 12l2 2 4-4" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- Beneficios -->
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #15803d; font-weight: 600;">Ahora puedes:</p>
                        <ul style="margin: 0; padding-left: 20px; list-style: none; color: #17652f; font-size: 14px; line-height: 1.8;">
                            <li style="margin-bottom: 8px;">✓ Acceder a todos los servicios disponibles</li>
                            <li style="margin-bottom: 8px;">✓ Contratar nannys verificadas</li>
                            <li style="margin-bottom: 8px;">✓ Usar tu perfil sin restricciones</li>
                            <li>✓ Acceder a todas las funcionalidades premium</li>
                        </ul>
                    </div>

                    <!-- Botón principal -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:4200/client/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                            → Ir a mi Dashboard
                        </a>
                    </div>

                    <!-- Información adicional -->
                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para asegurarnos de que tengas la mejor experiencia.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        ¿Preguntas? Contáctanos en <a href="mailto:soporte@nannyslm.com" style="color: #10b981; text-decoration: none; font-weight: 600;">soporte@nannyslm.com</a>
                    </p>
                    <p style="margin: 0;">
                        © 2025 NannysLM. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Obtener plantilla HTML para verificación rechazada
 */
const getVerificationRejectedEmailTemplate = (clientName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación Rechazada</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header con gradiente rojo (rechazo) -->
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Verificación Rechazada</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Tu documento no pudo ser validado</p>
                </div>

                <!-- Contenido principal -->
                <div style="padding: 40px 30px;">
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                        Hola <strong>${clientName}</strong>,
                    </p>

                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Lamentablemente, tu documento de identificación no cumplió con los requisitos de verificación. Esto puede deberse a:
                    </p>

                    <!-- Razones posibles -->
                    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <ul style="margin: 0; padding-left: 20px; list-style: none; color: #7f1d1d; font-size: 14px; line-height: 1.8;">
                            <li style="margin-bottom: 8px;">✕ Documento de baja calidad o borroso</li>
                            <li style="margin-bottom: 8px;">✕ Documento expirado o inválido</li>
                            <li style="margin-bottom: 8px;">✕ Información incompleta o ilegible</li>
                            <li>✕ Documento no reconocido en nuestro sistema</li>
                        </ul>
                    </div>

                    <!-- Mensaje de acción -->
                    <p style="margin: 20px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        No te preocupes, puedes <strong>reenviar tu documento</strong> siguiendo estas recomendaciones:
                    </p>

                    <!-- Recomendaciones -->
                    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 12px 0; font-size: 13px; color: #78350f; font-weight: 600;">📋 Recomendaciones:</p>
                        <ul style="margin: 0; padding-left: 20px; list-style: none; color: #92400e; font-size: 13px; line-height: 1.8;">
                            <li style="margin-bottom: 8px;">• Asegúrate de que el documento sea legible</li>
                            <li style="margin-bottom: 8px;">• Evita reflejos o sombras en la foto</li>
                            <li style="margin-bottom: 8px;">• Usa documentos vigentes y válidos</li>
                            <li>• Captura todos los datos de forma clara</li>
                        </ul>
                    </div>

                    <!-- Botón para reenviar -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:4200/client/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                            ↻ Reenviar Documento
                        </a>
                    </div>

                    <!-- Soporte -->
                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
                        Si crees que esto es un error o necesitas asistencia, contáctanos inmediatamente a <a href="mailto:soporte@nannyslm.com" style="color: #ef4444; text-decoration: none; font-weight: 600;">soporte@nannyslm.com</a>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 8px 0;">
                        Equipo de Soporte NannysLM
                    </p>
                    <p style="margin: 0;">
                        © 2025 NannysLM. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Enviar correo de verificación aprobada
 */
const sendVerificationApprovedEmail = async (toEmail, clientName) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = '✓ Tu verificación ha sido aprobada';
    const html = getVerificationApprovedEmailTemplate(clientName);

    if (!host || !port || !user || !pass) {
        console.log('📨 Verification approved email (sin SMTP):', toEmail);
        return { success: true, message: 'Verification approved email logged to console (SMTP not configured)' };
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

        console.log('📨 Verification approved email sent:', info.messageId);
        return { success: true, message: 'Verification approved email sent', info };
    } catch (error) {
        console.error('❌ Error sending verification approved email:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Enviar correo de verificación rechazada
 */
const sendVerificationRejectedEmail = async (toEmail, clientName) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const subject = 'Verificación rechazada - Por favor reintenta';
    const html = getVerificationRejectedEmailTemplate(clientName);

    if (!host || !port || !user || !pass) {
        console.log('📨 Verification rejected email (sin SMTP):', toEmail);
        return { success: true, message: 'Verification rejected email logged to console (SMTP not configured)' };
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

        console.log('📨 Verification rejected email sent:', info.messageId);
        return { success: true, message: 'Verification rejected email sent', info };
    } catch (error) {
        console.error('❌ Error sending verification rejected email:', error);
        return { success: false, message: error.message };
    }
};

module.exports = { 
    sendActivationEmail, 
    sendPasswordResetEmail, 
    sendNannyCredentialsEmail, 
    getNannyCredentialsEmailTemplate,
    sendServiceNotificationEmail,
    sendVerificationApprovedEmail,
    sendVerificationRejectedEmail
};
