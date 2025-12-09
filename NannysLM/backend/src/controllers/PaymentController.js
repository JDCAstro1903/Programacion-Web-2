const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { 
    sendPaymentApprovedEmail,
    sendPaymentRejectedEmail,
    sendNewPaymentNotificationEmail 
} = require('../utils/email');
const notificationSystem = require('../utils/NotificationSystem');
const { uploadImage, deleteImage, extractPublicId } = require('../config/cloudinary');

/**
 * Controlador para gestión de pagos
 */
class PaymentController {
    
    /**
     * Crear notificación de pago en la base de datos
     */
    static async createPaymentNotification(userId, title, message, type, paymentId) {
        try {
            // Validar que no haya undefined - convertir a null si es necesario
            const params = [
                userId ?? null,
                title ?? 'Notificación de Pago',
                message ?? '',
                type ?? 'payment_notif',
                paymentId ?? null
            ];

            // Verificar que userId y paymentId no sean null
            if (!params[0] || !params[4]) {
                const error = `Parámetros inválidos: userId=${userId}, paymentId=${paymentId}`;
                logger.error(`❌ ${error}`);
                return { success: false, error };
            }

            const query = `
                INSERT INTO notifications (
                    user_id, title, message, type, is_read, 
                    related_id, related_type, created_at
                ) VALUES (?, ?, ?, ?, false, ?, 'payment', NOW())
            `;

            const result = await executeQuery(query, params);

            if (result.success) {
                logger.success(`Notificación creada para usuario ${userId}: ${title}`);
                return result;
            } else {
                logger.error(`❌ Error al crear notificación: ${result.error}`);
                return result;
            }
        } catch (error) {
            logger.error('❌ Error en createPaymentNotification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener todos los datos de un pago para notificaciones
     */
    static async getPaymentDataForNotification(paymentId) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.amount,
                    p.payment_status,
                    p.client_id,
                    p.nanny_id,
                    -- Cliente
                    uc.id as client_user_id,
                    uc.first_name as client_first_name,
                    uc.last_name as client_last_name,
                    uc.email as client_email,
                    -- Nanny
                    un.id as nanny_user_id,
                    un.first_name as nanny_first_name,
                    un.last_name as nanny_last_name,
                    un.email as nanny_email,
                    -- Servicio
                    s.title as service_title,
                    -- Admin (primer usuario con user_type 'admin')
                    ua.id as admin_user_id,
                    ua.email as admin_email,
                    ua.first_name as admin_first_name,
                    ua.last_name as admin_last_name
                FROM payments p
                LEFT JOIN clients c ON p.client_id = c.id
                LEFT JOIN users uc ON c.user_id = uc.id
                LEFT JOIN nannys n ON p.nanny_id = n.id
                LEFT JOIN users un ON n.user_id = un.id
                LEFT JOIN services s ON p.service_id = s.id
                LEFT JOIN users ua ON ua.user_type = 'admin'
                WHERE p.id = ?
                LIMIT 1
            `;

            const result = await executeQuery(query, [paymentId]);
            
            if (result.success && result.data.length > 0) {
                return result.data[0];
            } else {
                logger.error(`❌ No se encontraron datos para el pago ${paymentId}`);
                return null;
            }
        } catch (error) {
            logger.error('❌ Error en getPaymentDataForNotification:', error);
            return null;
        }
    }
    
    /**
     * Obtener todos los pagos con información completa
     */
    static async getPayments(req, res) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.service_id,
                    p.amount,
                    p.payment_status,
                    p.platform_fee,
                    p.nanny_amount,
                    p.payment_date,
                    p.receipt_url,
                    p.created_at,
                    p.updated_at,
                    p.client_id,
                    p.nanny_id,
                    -- Información del cliente
                    uc.id as client_user_id,
                    uc.first_name as client_first_name,
                    uc.last_name as client_last_name,
                    uc.email as client_email,
                    uc.phone_number as client_phone,
                    -- Información de la nanny
                    un.id as nanny_user_id,
                    un.first_name as nanny_first_name,
                    un.last_name as nanny_last_name,
                    un.email as nanny_email,
                    un.phone_number as nanny_phone,
                    -- Información del servicio
                    s.id as service_id_ref,
                    s.title as service_title,
                    s.start_date,
                    s.end_date,
                    s.start_time,
                    s.end_time,
                    s.total_hours,
                    s.status as service_status
                FROM payments p
                LEFT JOIN services s ON p.service_id = s.id
                LEFT JOIN clients c ON p.client_id = c.id
                LEFT JOIN users uc ON c.user_id = uc.id
                LEFT JOIN nannys n ON p.nanny_id = n.id
                LEFT JOIN users un ON n.user_id = un.id
                ORDER BY p.created_at DESC
            `;

            const result = await executeQuery(query);

            console.log('📊 getPayments - Resultado de la query:', {
                success: result.success,
                totalRows: result.data?.length || 0,
                firstRow: result.data?.[0] || 'No hay datos'
            });

            if (result.success) {
                const payments = result.data.map(payment => ({
                    id: payment.id,
                    service_id: payment.service_id,
                    amount: parseFloat(payment.amount),
                    payment_status: payment.payment_status,
                    platform_fee: parseFloat(payment.platform_fee || 0),
                    nanny_amount: parseFloat(payment.nanny_amount || 0),
                    payment_date: payment.payment_date,
                    receipt_url: payment.receipt_url,
                    created_at: payment.created_at,
                    updated_at: payment.updated_at,
                    // Cliente
                    client_first_name: payment.client_first_name,
                    client_last_name: payment.client_last_name,
                    client_email: payment.client_email,
                    client_phone: payment.client_phone,
                    client_user_id: payment.client_user_id,
                    // Nanny
                    nanny_first_name: payment.nanny_first_name,
                    nanny_last_name: payment.nanny_last_name,
                    nanny_email: payment.nanny_email,
                    nanny_phone: payment.nanny_phone,
                    nanny_user_id: payment.nanny_user_id,
                    // Servicio
                    service_start_date: payment.start_date,
                    service_end_date: payment.end_date,
                    service_start_time: payment.start_time,
                    service_end_time: payment.end_time,
                    service_total_hours: parseFloat(payment.total_hours || 0),
                    service_status: payment.service_status
                }));

                logger.success('Pagos procesados:', payments.length);

                res.json({
                    success: true,
                    data: payments
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error obteniendo pagos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener un pago por ID
     */
    static async getPaymentById(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    p.*,
                    uc.first_name as client_first_name,
                    uc.last_name as client_last_name,
                    un.first_name as nanny_first_name,
                    un.last_name as nanny_last_name
                FROM payments p
                INNER JOIN clients c ON p.client_id = c.id
                INNER JOIN users uc ON c.user_id = uc.id
                INNER JOIN nannys n ON p.nanny_id = n.id
                INNER JOIN users un ON n.user_id = un.id
                WHERE p.id = ?
            `;

            const result = await executeQuery(query, [id]);

            if (result.success && result.data.length > 0) {
                const payment = result.data[0];
                
                res.json({
                    success: true,
                    data: {
                        id: payment.id,
                        serviceId: payment.service_id,
                        amount: parseFloat(payment.amount),
                        paymentStatus: payment.payment_status,
                        platformFee: parseFloat(payment.platform_fee || 0),
                        nannyAmount: parseFloat(payment.nanny_amount || 0),
                        paymentDate: payment.payment_date,
                        receiptUrl: payment.receipt_url,
                        clientName: `${payment.client_first_name} ${payment.client_last_name}`,
                        nannyName: `${payment.nanny_first_name} ${payment.nanny_last_name}`,
                        createdAt: payment.created_at,
                        updatedAt: payment.updated_at
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Pago no encontrado'
                });
            }

        } catch (error) {
            logger.error('Error obteniendo pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Crear un nuevo pago
     */
    static async createPayment(req, res) {
        try {
            const {
                serviceId,
                clientId,
                nannyId,
                amount,
                platformFee = 0,
                receiptUrl
            } = req.body;

            // Calcular monto para la nanny
            const nannyAmount = amount - platformFee;

            const query = `
                INSERT INTO payments (
                    service_id, client_id, nanny_id, amount, 
                    platform_fee, nanny_amount, receipt_url, payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
            `;

            const result = await executeQuery(query, [
                serviceId,
                clientId,
                nannyId,
                amount,
                platformFee,
                nannyAmount,
                receiptUrl
            ]);

            if (result.success) {
                const paymentId = result.data.insertId;
                
                // Obtener datos del pago para notificaciones
                const paymentData = await PaymentController.getPaymentDataForNotification(paymentId);
                
                // Notificar al admin sobre el nuevo pago
                if (paymentData && paymentData.admin_user_id) {
                    const notifTitle = `💰 Nuevo Pago Recibido - $${amount.toFixed(2)}`;
                    const notifMessage = `${paymentData.client_first_name} ${paymentData.client_last_name} ha enviado un pago pendiente de revisión`;
                    
                    try {
                        await PaymentController.createPaymentNotification(
                            paymentData.admin_user_id,
                            notifTitle,
                            notifMessage,
                            'payment_review',
                            paymentId
                        );
                        logger.success(`Notificación DB creada para admin sobre nuevo pago #${paymentId}`);
                    } catch (notifError) {
                        logger.error(`⚠️ Error al crear notificación en BD para pago #${paymentId}:`, notifError);
                    }

                    // Enviar email al admin
                    try {
                        await sendNewPaymentNotificationEmail(
                            paymentData.admin_email,
                            paymentData.admin_first_name,
                            `${paymentData.client_first_name} ${paymentData.client_last_name}`,
                            paymentData.service_title || 'Sin título',
                            amount,
                            `${paymentData.nanny_first_name} ${paymentData.nanny_last_name}`
                        );
                        logger.success(`Email notificación enviado al admin (${paymentData.admin_email}) sobre nuevo pago #${paymentId}`);
                    } catch (emailError) {
                        logger.error(`⚠️ Error al enviar email al admin para pago #${paymentId}:`, emailError.message);
                    }
                }

                res.status(201).json({
                    success: true,
                    message: 'Pago creado exitosamente',
                    data: { id: paymentId }
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error creando pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Actualizar estado de un pago
     */
    static async updatePaymentStatus(req, res) {
        try {
            const { id } = req.params;
            const { paymentStatus, transactionId } = req.body;

            let query = 'UPDATE payments SET payment_status = ?';
            const params = [paymentStatus];

            if (transactionId) {
                query += ', transaction_id = ?';
                params.push(transactionId);
            }

            if (paymentStatus === 'completed') {
                query += ', payment_date = NOW()';
            }

            query += ' WHERE id = ?';
            params.push(id);

            const result = await executeQuery(query, params);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Estado del pago actualizado exitosamente'
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error actualizando pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener estadísticas de pagos
     */
    static async getPaymentStats(req, res) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN payment_status = 'completed' THEN platform_fee ELSE 0 END) as total_fees
                FROM payments
            `;

            const result = await executeQuery(query);

            if (result.success && result.data.length > 0) {
                const stats = result.data[0];
                
                res.json({
                    success: true,
                    data: {
                        totalPayments: stats.total_payments,
                        completed: stats.completed,
                        pending: stats.pending,
                        failed: stats.failed,
                        totalRevenue: parseFloat(stats.total_revenue || 0),
                        totalFees: parseFloat(stats.total_fees || 0)
                    }
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Subir comprobante de pago (por el cliente)
     */
    static async uploadPaymentReceipt(req, res) {
        try {
            const { paymentId } = req.params;
            const userId = req.user?.id;
            const { executeQuery } = require('../config/database');
            
            logger.info('📤 Intentando subir comprobante:');
            logger.info('  - paymentId:', paymentId);
            logger.info('  - userId:', userId);
            logger.info('  - req.file:', req.file ? req.file.filename : 'undefined');
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }
            
            if (!req.file) {
                logger.info('❌ No hay archivo receipt');
                return res.status(400).json({
                    success: false,
                    message: 'No se seleccionó ningún archivo de comprobante'
                });
            }

            console.log('📄 Archivo recibido:', {
                name: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });

            // Verificar que el pago existe y pertenece al cliente
            const paymentQuery = `
                SELECT p.*, c.user_id 
                FROM payments p
                INNER JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            `;
            
            const paymentResult = await executeQuery(paymentQuery, [paymentId]);
            
            if (!paymentResult.success || paymentResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pago no encontrado'
                });
            }

            const payment = paymentResult.data[0];
            
            if (payment.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para subir el comprobante de este pago'
                });
            }

            // Subir recibo a Cloudinary
            let receiptUrl;
            try {
                const cloudinaryResult = await uploadImage(
                    req.file.buffer,
                    'nannys-lm/receipts',
                    `receipt_${paymentId}_${Date.now()}`
                );
                receiptUrl = cloudinaryResult.secure_url;
                logger.info('📤 Recibo subido a Cloudinary:', receiptUrl);
            } catch (error) {
                logger.error('❌ Error subiendo recibo a Cloudinary:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al subir el comprobante de pago'
                });
            }

            // Actualizar registro de pago con URL del comprobante
            const updateQuery = `
                UPDATE payments 
                SET receipt_url = ?, payment_status = 'processing', updated_at = NOW()
                WHERE id = ?
            `;
            
            const updateResult = await executeQuery(updateQuery, [receiptUrl, paymentId]);

            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al guardar la información del comprobante'
                });
            }

            logger.success(`Comprobante subido exitosamente para pago ${paymentId}:`, receiptUrl);

            // Notificar al admin sobre el nuevo recibo de pago
            try {
                // Obtener información completa del pago para notificación
                const fullPaymentQuery = `
                    SELECT p.*, 
                           s.title as service_title,
                           c.user_id as client_user_id,
                           u_client.first_name as client_first_name,
                           u_client.last_name as client_last_name,
                           u_client.email as client_email,
                           n.user_id as nanny_user_id,
                           u_nanny.first_name as nanny_first_name,
                           u_nanny.last_name as nanny_last_name
                    FROM payments p
                    JOIN services s ON p.service_id = s.id
                    JOIN clients c ON p.client_id = c.id
                    JOIN users u_client ON c.user_id = u_client.id
                    LEFT JOIN nannys n ON s.nanny_id = n.id
                    LEFT JOIN users u_nanny ON n.user_id = u_nanny.id
                    WHERE p.id = ?
                `;
                
                const fullPaymentResult = await executeQuery(fullPaymentQuery, [paymentId]);
                
                if (fullPaymentResult.success && fullPaymentResult.data.length > 0) {
                    const paymentInfo = fullPaymentResult.data[0];
                    
                    // Buscar admin (user_type = 'admin')
                    const adminQuery = "SELECT id, first_name, email FROM users WHERE user_type = 'admin' LIMIT 1";
                    const adminResult = await executeQuery(adminQuery);
                    
                    if (adminResult.success && adminResult.data.length > 0) {
                        const admin = adminResult.data[0];
                        const clientName = `${paymentInfo.client_first_name || 'Cliente'} ${paymentInfo.client_last_name || ''}`.trim();
                        const nannyName = paymentInfo.nanny_first_name 
                            ? `${paymentInfo.nanny_first_name} ${paymentInfo.nanny_last_name}`
                            : 'N/A';
                        
                        logger.info('📧 Enviando notificación al admin sobre nuevo recibo de pago...');
                        logger.debug('Datos de pago:', {
                            adminEmail: admin.email,
                            adminId: admin.id,
                            clientName,
                            serviceTitle: paymentInfo.service_title,
                            amount: paymentInfo.amount,
                            paymentId
                        });
                        
                        await notificationSystem.notifyAdminNewPayment(
                            admin.email ?? 'admin@example.com',
                            admin.id,
                            admin.first_name ?? 'Admin',
                            clientName,
                            paymentInfo.service_title ?? 'Servicio',
                            parseFloat(paymentInfo.amount) || 0,
                            nannyName,
                            paymentId
                        );
                        logger.success(`Notificación enviada al admin (${admin.email}) sobre pago #${paymentId}`);
                    } else {
                        logger.warn('⚠️ No se encontró ningún usuario admin en la base de datos');
                    }
                }
            } catch (notifError) {
                logger.error('⚠️ Error al notificar al admin sobre nuevo pago:', notifError);
            }

            return res.json({
                success: true,
                message: 'Comprobante subido exitosamente',
                data: {
                    paymentId: paymentId,
                    receiptUrl: receiptUrl,
                    fileName: req.file.originalname,
                    uploadedAt: new Date()
                }
            });

        } catch (error) {
            logger.error('❌ Error al subir comprobante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al subir el comprobante',
                error: error.message
            });
        }
    }

    /**
     * Crear pago pendiente después de servicio completado
     */
    static async initializePayment(req, res) {
        try {
            const { serviceId } = req.body;
            const userId = req.user.id;

            if (!serviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere serviceId'
                });
            }

            // Obtener información del servicio
            const serviceQuery = `
                SELECT s.*, c.id as client_id, c.user_id, n.id as nanny_id
                FROM services s
                INNER JOIN clients c ON s.client_id = c.id
                INNER JOIN nannys n ON s.nanny_id = n.id
                WHERE s.id = ? AND s.status IN ('completed', 'finished')
            `;

            const serviceResult = await executeQuery(serviceQuery, [serviceId]);

            if (!serviceResult.success || serviceResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Servicio no encontrado o no está completado'
                });
            }

            const service = serviceResult.data[0];

            if (service.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para crear un pago para este servicio'
                });
            }

            // Verificar que no existe un pago para este servicio
            const existingPaymentQuery = `
                SELECT id FROM payments WHERE service_id = ?
            `;

            const existingPayment = await executeQuery(existingPaymentQuery, [serviceId]);

            if (existingPayment.success && existingPayment.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un pago para este servicio'
                });
            }

            // Calcular monto y comisión (10% de comisión)
            const amount = parseFloat(service.total_amount) || 0;
            const platformFee = amount * 0.10;
            const nannyAmount = amount - platformFee;

            // Crear pago
            const createPaymentQuery = `
                INSERT INTO payments (
                    service_id,
                    client_id,
                    nanny_id,
                    amount,
                    payment_status,
                    platform_fee,
                    nanny_amount,
                    created_at
                ) VALUES (?, ?, ?, ?, 'pending', ?, ?, NOW())
            `;

            const createResult = await executeQuery(createPaymentQuery, [
                serviceId,
                service.client_id,
                service.nanny_id,
                amount,
                platformFee,
                nannyAmount
            ]);

            if (createResult.success) {
                logger.success(`Pago creado para servicio ${serviceId}`);
                
                // 🔔 Crear notificación al admin sobre el nuevo pago
                try {
                    const adminQuery = `
                        SELECT id FROM users WHERE user_type = 'admin' LIMIT 1
                    `;
                    const adminResult = await executeQuery(adminQuery, []);
                    
                    if (adminResult.success && adminResult.data.length > 0) {
                        const adminId = adminResult.data[0].id;
                        const notificationTitle = '💰 Nuevo Pago para Verificar';
                        const notificationMessage = `Se ha registrado un nuevo pago por $${amount.toFixed(2)} que requiere verificación del comprobante.`;
                        
                        await PaymentController.createPaymentNotification(
                            adminId,
                            notificationTitle,
                            notificationMessage,
                            'payment_pending',
                            createResult.insertId
                        );
                        logger.success('Notificación de nuevo pago enviada al admin');
                    }
                } catch (notificationError) {
                    logger.error('⚠️ Error al crear notificación de pago:', notificationError);
                    // No interrumpimos el flujo si falla la notificación
                }
                
                res.json({
                    success: true,
                    message: 'Pago inicializado exitosamente',
                    data: {
                        paymentId: createResult.insertId,
                        serviceId: serviceId,
                        amount: amount,
                        platformFee: platformFee,
                        nannyAmount: nannyAmount,
                        status: 'pending'
                    }
                });
            } else {
                throw new Error(createResult.error);
            }

        } catch (error) {
            logger.error('Error al inicializar pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el pago',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Aprobar o rechazar pago (por admin)
     */
    static async verifyPayment(req, res) {
        try {
            const { paymentId } = req.params;
            const { action, notes } = req.body; // action: 'approve' o 'reject'

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Acción no válida. Debe ser "approve" o "reject"'
                });
            }

            // Obtener información del pago
            const paymentQuery = `
                SELECT * FROM payments WHERE id = ?
            `;

            const paymentResult = await executeQuery(paymentQuery, [paymentId]);

            if (!paymentResult.success || paymentResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pago no encontrado'
                });
            }

            const payment = paymentResult.data[0];

            logger.debug(`🔍 Verificando pago #${paymentId} - Estado actual: ${payment.payment_status}`);

            if (payment.payment_status !== 'processing') {
                return res.status(400).json({
                    success: false,
                    message: `No se puede verificar este pago. Estado actual: ${payment.payment_status}. Debe estar en estado "processing" (el cliente debe subir el comprobante primero)`
                });
            }

            const newStatus = action === 'approve' ? 'completed' : 'failed';
            const updateQuery = `
                UPDATE payments 
                SET payment_status = ?, payment_date = NOW()
                WHERE id = ?
            `;

            const updateResult = await executeQuery(updateQuery, [newStatus, paymentId]);

            if (updateResult.success) {
                // Obtener datos del pago para notificaciones
                const paymentData = await PaymentController.getPaymentDataForNotification(paymentId);
                
                if (paymentData && paymentData.client_user_id && paymentData.client_email) {
                    const clientName = `${paymentData.client_first_name} ${paymentData.client_last_name}`;
                    const nannyName = `${paymentData.nanny_first_name} ${paymentData.nanny_last_name}`;
                    const amount = parseFloat(paymentData.amount) || 0;
                    
                    if (action === 'approve') {
                        // Notificar al cliente que el pago fue aprobado (BD + correo)
                        const notifTitle = `✓ Tu Pago de $${amount.toFixed(2)} ha sido Aprobado`;
                        const notifMessage = `Tu pago para el servicio "${paymentData.service_title}" ha sido procesado exitosamente`;
                        
                        try {
                            await notificationSystem.createNotification(
                                paymentData.client_user_id,
                                notifTitle,
                                notifMessage,
                                'payment_approved',
                                paymentId,
                                'payment'
                            );
                            logger.success(`Notificación DB creada para cliente sobre pago #${paymentId} aprobado`);
                        } catch (notifError) {
                            logger.error(`⚠️ Error al crear notificación DB para cliente (pago #${paymentId}):`, notifError);
                        }

                        // Enviar email de aprobación
                        try {
                            await sendPaymentApprovedEmail(
                                paymentData.client_email,
                                clientName,
                                paymentData.service_title || 'Sin título',
                                payment.amount,
                                nannyName
                            );
                            logger.success(`Email de aprobación enviado a cliente (${paymentData.client_email}) - Pago #${paymentId}`);
                        } catch (emailError) {
                            logger.error(`⚠️ Error al enviar email de aprobación a cliente (${paymentData.client_email}):`, emailError.message);
                        }
                    } else {
                        // Notificar al cliente que el pago fue rechazado (BD + correo)
                        const notifTitle = `✗ Tu Pago de $${amount.toFixed(2)} ha sido Rechazado`;
                        const notifMessage = `Tu pago para el servicio "${paymentData.service_title}" ha sido rechazado. ${notes ? `Motivo: ${notes}` : ''}`;
                        
                        try {
                            await notificationSystem.createNotification(
                                paymentData.client_user_id,
                                notifTitle,
                                notifMessage,
                                'payment_rejected',
                                paymentId,
                                'payment'
                            );
                            logger.success(`Notificación DB creada para cliente sobre pago #${paymentId} rechazado`);
                        } catch (notifError) {
                            logger.error(`⚠️ Error al crear notificación DB para cliente (pago #${paymentId}):`, notifError);
                        }

                        // Enviar email de rechazo
                        try {
                            const amountForEmail = parseFloat(paymentData.amount) || 0;
                            await sendPaymentRejectedEmail(
                                paymentData.client_email,
                                `${paymentData.client_first_name} ${paymentData.client_last_name}`,
                                paymentData.service_title || 'Sin título',
                                amountForEmail,
                                `${paymentData.nanny_first_name} ${paymentData.nanny_last_name}`,
                                notes || ''
                            );
                            logger.success(`Email de rechazo enviado a cliente (${paymentData.client_email}) - Pago #${paymentId}`);
                        } catch (emailError) {
                            logger.error(`⚠️ Error al enviar email de rechazo a cliente (${paymentData.client_email}):`, emailError.message);
                        }
                    }
                } else {
                    logger.warn(`⚠️ No se encontraron datos del cliente para enviar notificaciones del pago #${paymentId}`);
                }

                const actionText = action === 'approve' ? 'aprobado' : 'rechazado';

                res.json({
                    success: true,
                    message: `Pago ${actionText} exitosamente`,
                    data: {
                        paymentId: paymentId,
                        status: newStatus,
                        action: action
                    }
                });
            } else {
                throw new Error(updateResult.error);
            }

        } catch (error) {
            logger.error('Error al verificar pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar el pago',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener pagos del cliente autenticado
     */
    static async getClientPayments(req, res) {
        try {
            const userId = req.user.id;

            const query = `
                SELECT 
                    p.id,
                    p.service_id,
                    p.amount,
                    p.payment_status,
                    p.platform_fee,
                    p.nanny_amount,
                    p.receipt_url,
                    p.payment_date,
                    p.created_at,
                    -- Información del servicio
                    s.start_date,
                    s.end_date,
                    s.start_time,
                    s.end_time,
                    s.total_hours,
                    s.title,
                    s.service_type,
                    -- Información de la nanny
                    un.first_name as nanny_first_name,
                    un.last_name as nanny_last_name,
                    un.email as nanny_email
                FROM payments p
                INNER JOIN services s ON p.service_id = s.id
                INNER JOIN clients c ON p.client_id = c.id
                INNER JOIN nannys n ON p.nanny_id = n.id
                INNER JOIN users un ON n.user_id = un.id
                WHERE c.user_id = ?
                ORDER BY p.created_at DESC
            `;

            const result = await executeQuery(query, [userId]);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data || []
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error obteniendo pagos del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pagos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = PaymentController;