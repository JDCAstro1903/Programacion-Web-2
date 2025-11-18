const { executeQuery } = require('../config/database');

/**
 * Controlador para gestión de pagos
 */
class PaymentController {
    
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
                    p.transaction_id,
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
                    transaction_id: payment.transaction_id,
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

                console.log('✅ Pagos procesados:', payments.length);

                res.json({
                    success: true,
                    data: payments
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error obteniendo pagos:', error);
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
                        transactionId: payment.transaction_id,
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
            console.error('Error obteniendo pago:', error);
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
                res.status(201).json({
                    success: true,
                    message: 'Pago creado exitosamente',
                    data: { id: result.data.insertId }
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error creando pago:', error);
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
            console.error('Error actualizando pago:', error);
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
            console.error('Error obteniendo estadísticas:', error);
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
            const path = require('path');
            const fs = require('fs');
            
            console.log('📤 Intentando subir comprobante:');
            console.log('  - paymentId:', paymentId);
            console.log('  - userId:', userId);
            console.log('  - req.files:', req.files ? Object.keys(req.files) : 'undefined');
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }
            
            if (!req.files || !req.files.receipt) {
                console.log('❌ No hay archivo receipt:', {
                    hasFiles: !!req.files,
                    filesKeys: req.files ? Object.keys(req.files) : []
                });
                return res.status(400).json({
                    success: false,
                    message: 'No se seleccionó ningún archivo de comprobante'
                });
            }

            const receiptFile = req.files.receipt;
            console.log('📄 Archivo recibido:', {
                name: receiptFile.name,
                mimetype: receiptFile.mimetype,
                size: receiptFile.size
            });
            
            const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            
            if (!allowedMimes.includes(receiptFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo de archivo no permitido. Se permiten: JPG, PNG, GIF, WebP, PDF. Recibido: ${receiptFile.mimetype}`
                });
            }

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

            // Generar nombre único para el archivo
            const timestamp = Date.now();
            const ext = receiptFile.name.split('.').pop();
            const fileName = `receipt_${paymentId}_${timestamp}.${ext}`;
            const uploadPath = path.join(__dirname, '../../uploads/receipts');

            // Crear directorio si no existe
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // Guardar archivo
            const filePath = path.join(uploadPath, fileName);
            await receiptFile.mv(filePath);

            // Actualizar registro de pago con URL del comprobante
            const receiptUrl = `/uploads/receipts/${fileName}`;
            const updateQuery = `
                UPDATE payments 
                SET receipt_url = ?, payment_status = 'processing'
                WHERE id = ?
            `;

            const updateResult = await executeQuery(updateQuery, [receiptUrl, paymentId]);

            if (updateResult.success) {
                console.log(`✅ Comprobante subido para pago ${paymentId}`);
                res.json({
                    success: true,
                    message: 'Comprobante subido exitosamente',
                    data: {
                        paymentId: paymentId,
                        receiptUrl: receiptUrl,
                        status: 'processing'
                    }
                });
            } else {
                throw new Error(updateResult.error);
            }

        } catch (error) {
            console.error('Error al subir comprobante:', error);
            res.status(500).json({
                success: false,
                message: 'Error al subir el comprobante',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
                WHERE s.id = ? AND s.status = 'completed'
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
                console.log(`✅ Pago creado para servicio ${serviceId}`);
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
            console.error('Error al inicializar pago:', error);
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

            if (payment.payment_status !== 'processing') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden verificar pagos en estado "processing"'
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
                const actionText = action === 'approve' ? 'aprobado' : 'rechazado';
                console.log(`✅ Pago ${paymentId} ${actionText}`);

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
            console.error('Error al verificar pago:', error);
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
            console.error('Error obteniendo pagos del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pagos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = PaymentController;