/**
 * Sistema mejorado de Notificaciones y Correos para NannysLM
 * 
 * Este archivo gestiona:
 * 1. Envío de correos vía SMTP
 * 2. Creación de notificaciones en BD
 * 3. Fallback a console logs si SMTP no está configurado
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');
const { executeQuery } = require('../config/database');

class NotificationSystem {
    constructor() {
        this.smtpConfigured = this.checkSMTPConfig();
        this.transporter = this.smtpConfigured ? this.createTransporter() : null;
        
        // Log del estado
        if (this.smtpConfigured) {
            logger.success('SMTP configurado correctamente');
            logger.info(`   HOST: ${process.env.SMTP_HOST}`);
            logger.info(`   PORT: ${process.env.SMTP_PORT}`);
            logger.info(`   FROM: ${process.env.MAIL_FROM || process.env.SMTP_USER}`);
        } else {
            logger.warn('⚠️ SMTP NO configurado - Los correos se registrarán en consola');
            logger.warn('   Configure las siguientes variables de entorno:');
            logger.warn('   - SMTP_HOST');
            logger.warn('   - SMTP_PORT');
            logger.warn('   - SMTP_USER');
            logger.warn('   - SMTP_PASS');
            logger.warn('   - MAIL_FROM (opcional)');
        }
    }

    /**
     * Verificar si SMTP está configurado
     */
    checkSMTPConfig() {
        return !!(
            process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
        );
    }

    /**
     * Crear transporter de nodemailer
     */
    createTransporter() {
        try {
            return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT, 10),
                secure: parseInt(process.env.SMTP_PORT, 10) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } catch (error) {
            logger.error('❌ Error al crear transporter SMTP:', error.message);
            return null;
        }
    }

    /**
     * Enviar correo con manejo robusto de errores
     */
    async sendEmail(toEmail, subject, html) {
        if (!this.smtpConfigured || !this.transporter) {
            // Fallback a console log
            logger.info('📧 [CORREO NO ENVIADO - SMTP no configurado]');
            logger.info(`   TO: ${toEmail}`);
            logger.info(`   SUBJECT: ${subject}`);
            return { success: true, fallback: true, message: 'Email logged to console' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.MAIL_FROM || `NannysLM <${process.env.SMTP_USER}>`,
                to: toEmail,
                subject,
                html
            });

            logger.success('Correo enviado exitosamente a ${toEmail}`);
            logger.info(`   MessageID: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`❌ Error al enviar correo a ${toEmail}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crear notificación en la BD
     */
    async createNotification(userId, title, message, type, relatedId = null, relatedType = 'general') {
        try {
            const query = `
                INSERT INTO notifications (
                    user_id, title, message, type, is_read, 
                    related_id, related_type, created_at
                ) VALUES (?, ?, ?, ?, false, ?, ?, NOW())
            `;

            const result = await executeQuery(query, [
                userId,
                title,
                message,
                type,
                relatedId,
                relatedType
            ]);

            if (result.success) {
                logger.success('Notificación creada para usuario ${userId}: ${title}`);
                return { success: true, notificationId: result.data.insertId };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('❌ Error al crear notificación en BD:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar notificación completa (correo + BD)
     */
    async sendFullNotification(toEmail, userId, subject, html, title, message, type, relatedId = null, relatedType = 'general') {
        const results = {
            email: null,
            notification: null
        };

        // Enviar correo
        try {
            results.email = await this.sendEmail(toEmail, subject, html);
        } catch (error) {
            logger.error('⚠️ Error al enviar correo:', error.message);
            results.email = { success: false, error: error.message };
        }

        // Crear notificación en BD
        try {
            results.notification = await this.createNotification(userId, title, message, type, relatedId, relatedType);
        } catch (error) {
            logger.error('⚠️ Error al crear notificación en BD:', error.message);
            results.notification = { success: false, error: error.message };
        }

        return results;
    }

    /**
     * Notificar al admin sobre nueva solicitud de verificación
     */
    async notifyAdminNewVerification(adminEmail, adminUserId, adminName, clientName, clientEmail, clientId) {
        const { sendNewVerificationRequestEmail } = require('./email');
        
        const title = '⚠️ Nueva Solicitud de Verificación';
        const message = `${clientName} (${clientEmail}) ha enviado su información para verificación`;
        const subject = '⚠️ Nueva Solicitud de Verificación - NannysLM';
        
        const html = await this.generateEmailHTML('verification-request', {
            adminName,
            clientName,
            clientEmail
        });
        
        // Enviar correo
        const emailResult = await sendNewVerificationRequestEmail(adminEmail, adminName, clientName, clientEmail);
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            adminUserId,
            title,
            message,
            'verification_pending',
            clientId,
            'client'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Notificar al cliente cuando nanny acepta servicio
     */
    async notifyClientServiceAccepted(clientEmail, clientUserId, clientName, nannyName, serviceName, serviceDate, serviceId) {
        const { sendNannyAcceptedServiceEmail } = require('./email');
        
        const title = '✅ Servicio Aceptado';
        const message = `${nannyName} ha aceptado tu servicio: ${serviceName}`;
        
        // Enviar correo
        const emailResult = await sendNannyAcceptedServiceEmail(
            clientEmail,
            clientName,
            nannyName,
            serviceName,
            serviceDate
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            clientUserId,
            title,
            message,
            'service_accepted',
            serviceId,
            'service'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Enviar recordatorio de servicio a nanny
     */
    async sendServiceReminder(nannyEmail, nannyUserId, nannyName, serviceName, serviceDate, serviceId, daysAhead) {
        const { sendServiceReminderEmail } = require('./email');
        
        const title = `🔔 Recordatorio: Servicio ${daysAhead === 1 ? 'mañana' : 'en 3 días'}`;
        const message = `Tienes un servicio programado: ${serviceName} - ${serviceDate}`;
        
        // Enviar correo
        const emailResult = await sendServiceReminderEmail(
            nannyEmail,
            nannyName,
            serviceName,
            serviceDate,
            daysAhead
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            nannyUserId,
            title,
            message,
            'service_reminder',
            serviceId,
            'service'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Notificar al cliente que servicio fue completado
     */
    async notifyClientServiceCompleted(clientEmail, clientUserId, clientName, nannyName, serviceName, serviceDate, serviceId) {
        const { sendServiceCompletedEmail } = require('./email');
        
        const title = '✨ Servicio Completado';
        const message = `El servicio "${serviceName}" con ${nannyName} ha sido completado`;
        
        // Enviar correo
        const emailResult = await sendServiceCompletedEmail(
            clientEmail,
            clientName,
            nannyName,
            serviceName,
            serviceDate
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            clientUserId,
            title,
            message,
            'service_completed',
            serviceId,
            'service'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Notificar al admin sobre nuevo recibo de pago
     */
    async notifyAdminNewPayment(adminEmail, adminUserId, adminName, clientName, serviceName, amount, nannyName, paymentId) {
        const { sendNewPaymentNotificationEmail } = require('./email');
        
        const title = '💰 Nuevo Recibo de Pago Recibido';
        const message = `${clientName} ha enviado un recibo de pago de $${amount} para el servicio: ${serviceName}`;
        
        // Enviar correo
        const emailResult = await sendNewPaymentNotificationEmail(
            adminEmail,
            adminName,
            clientName,
            serviceName,
            amount,
            nannyName
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            adminUserId,
            title,
            message,
            'payment_pending',
            paymentId,
            'payment'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Notificar a nanny sobre nueva calificación recibida
     */
    async notifyNannyNewRating(nannyEmail, nannyUserId, nannyName, clientName, rating, serviceName, serviceId, comment = '') {
        const { sendNannyRatingReceivedEmail } = require('./email');
        
        const stars = '⭐'.repeat(Math.round(rating));
        const title = `${stars} Nueva Calificación: ${rating}/5`;
        const message = `${clientName} te ha calificado con ${rating} estrellas por el servicio: ${serviceName}`;
        
        // Enviar correo
        const emailResult = await sendNannyRatingReceivedEmail(
            nannyEmail,
            nannyName,
            clientName,
            rating,
            serviceName,
            comment
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            nannyUserId,
            title,
            message,
            'rating_received',
            serviceId,
            'service'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Notificar a nanny cuando cliente cancela un servicio
     */
    async notifyNannyCancellation(nannyEmail, nannyUserId, nannyName, clientName, serviceName, serviceDate, serviceId) {
        const { sendServiceCancelledEmail } = require('./email');
        
        const title = '❌ Servicio Cancelado';
        const message = `${clientName} ha cancelado el servicio: ${serviceName} programado para ${serviceDate}`;
        
        // Enviar correo
        const emailResult = await sendServiceCancelledEmail(
            nannyEmail,
            nannyName,
            clientName,
            serviceName,
            serviceDate
        );
        
        // Crear notificación
        const notificationResult = await this.createNotification(
            nannyUserId,
            title,
            message,
            'service_cancelled',
            serviceId,
            'service'
        );
        
        return {
            email: emailResult,
            notification: notificationResult
        };
    }

    /**
     * Método helper para generar HTML de emails (reutilizable)
     */
    async generateEmailHTML(templateType, data) {
        // Este método puede expandirse en el futuro
        return null;
    }
}

// Exportar instancia singleton
module.exports = new NotificationSystem();
