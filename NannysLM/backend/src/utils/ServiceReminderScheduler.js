/**
 * Sistema de recordatorios automáticos para servicios
 * Envía recordatorios a las nannies 3 días y 1 día antes del servicio
 */

const cron = require('node-cron');
const { executeQuery } = require('../config/database');
const notificationSystem = require('./NotificationSystem');
const logger = require('./logger');

class ServiceReminderScheduler {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Iniciar el scheduler
     * Se ejecuta todos los días a las 9:00 AM
     */
    start() {
        if (this.isRunning) {
            logger.warn('Scheduler ya en ejecución');
            return;
        }

        // Ejecutar todos los días a las 9:00 AM
        this.job = cron.schedule('0 9 * * *', async () => {
            logger.info('Ejecutando recordatorios de servicios');
            await this.checkAndSendReminders();
        });

        this.isRunning = true;
        logger.info('Scheduler de recordatorios iniciado (9:00 AM diario)');
        
        // Ejecutar inmediatamente al iniciar (opcional)
        // this.checkAndSendReminders();
    }

    /**
     * Detener el scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            logger.info('Scheduler detenido');
        }
    }

    /**
     * Verificar y enviar recordatorios
     */
    async checkAndSendReminders() {
        try {
            // Calcular fechas para recordatorios
            const today = new Date();
            const threeDaysAhead = new Date(today);
            threeDaysAhead.setDate(today.getDate() + 3);
            const oneDayAhead = new Date(today);
            oneDayAhead.setDate(today.getDate() + 1);

            // Formatear fechas para la query (YYYY-MM-DD)
            const threeDaysDate = threeDaysAhead.toISOString().split('T')[0];
            const oneDayDate = oneDayAhead.toISOString().split('T')[0];

            console.log(`📅 Buscando servicios para:
  - Recordatorio 3 días: ${threeDaysDate}
  - Recordatorio 1 día: ${oneDayDate}`);

            // Buscar servicios confirmados para estas fechas
            const query = `
                SELECT 
                    s.id,
                    s.title,
                    s.start_date,
                    s.start_time,
                    s.nanny_id,
                    n.user_id as nanny_user_id,
                    u.first_name as nanny_first_name,
                    u.last_name as nanny_last_name,
                    u.email as nanny_email
                FROM services s
                JOIN nannys n ON s.nanny_id = n.id
                JOIN users u ON n.user_id = u.id
                WHERE s.status = 'confirmed'
                  AND (DATE(s.start_date) = ? OR DATE(s.start_date) = ?)
                ORDER BY s.start_date, s.start_time
            `;

            const result = await executeQuery(query, [threeDaysDate, oneDayDate]);

            if (!result.success) {
                console.error('❌ Error al buscar servicios para recordatorios:', result.error);
                return;
            }

            const services = result.data;
            console.log(`📋 Encontrados ${services.length} servicios para enviar recordatorios`);

            for (const service of services) {
                const serviceDate = new Date(service.start_date);
                const daysUntilService = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));
                
                // Determinar si es recordatorio de 3 días o 1 día
                let daysAhead;
                if (daysUntilService >= 3) {
                    daysAhead = 3;
                } else if (daysUntilService >= 1) {
                    daysAhead = 1;
                } else {
                    continue; // Servicio es hoy o ya pasó
                }

                // Verificar si ya se envió este recordatorio
                const checkNotificationQuery = `
                    SELECT id FROM notifications 
                    WHERE user_id = ? 
                      AND related_id = ? 
                      AND related_type = 'service'
                      AND type = 'service_reminder'
                      AND message LIKE ?
                `;
                
                const reminderCheckPattern = daysAhead === 3 ? '%en 3 días%' : '%mañana%';
                const notificationCheck = await executeQuery(checkNotificationQuery, [
                    service.nanny_user_id,
                    service.id,
                    reminderCheckPattern
                ]);

                if (notificationCheck.success && notificationCheck.data.length > 0) {
                    console.log(`⏭️ Recordatorio de ${daysAhead} día(s) ya enviado para servicio ${service.id}`);
                    continue;
                }

                // Formatear fecha del servicio
                const serviceDateFormatted = serviceDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const nannyName = `${service.nanny_first_name} ${service.nanny_last_name}`;

                // Enviar recordatorio
                console.log(`📧 Enviando recordatorio de ${daysAhead} día(s) para servicio ${service.id} a ${nannyName}`);
                
                await notificationSystem.sendServiceReminder(
                    service.nanny_email,
                    service.nanny_user_id,
                    nannyName,
                    service.title,
                    `${serviceDateFormatted} - ${service.start_time}`,
                    service.id,
                    daysAhead
                );

                console.log(`✅ Recordatorio enviado exitosamente`);
            }

            console.log('✅ Tarea de recordatorios completada');

        } catch (error) {
            console.error('❌ Error en checkAndSendReminders:', error);
        }
    }

    /**
     * Método manual para probar el sistema de recordatorios
     */
    async testReminders() {
        console.log('🧪 Ejecutando prueba manual de recordatorios...');
        await this.checkAndSendReminders();
    }
}

// Exportar instancia singleton
module.exports = new ServiceReminderScheduler();
