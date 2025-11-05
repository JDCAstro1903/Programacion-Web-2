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
                    -- Información del cliente
                    uc.id as client_user_id,
                    uc.first_name as client_first_name,
                    uc.last_name as client_last_name,
                    uc.email as client_email,
                    -- Información de la nanny
                    un.id as nanny_user_id,
                    un.first_name as nanny_first_name,
                    un.last_name as nanny_last_name,
                    un.email as nanny_email,
                    -- Información del servicio
                    s.start_date,
                    s.end_date,
                    s.start_time,
                    s.end_time,
                    s.total_hours,
                    s.status as service_status
                FROM payments p
                INNER JOIN services s ON p.service_id = s.id
                INNER JOIN clients c ON p.client_id = c.id
                INNER JOIN users uc ON c.user_id = uc.id
                INNER JOIN nannys n ON p.nanny_id = n.id
                INNER JOIN users un ON n.user_id = un.id
                ORDER BY p.created_at DESC
            `;

            const result = await executeQuery(query);

            if (result.success) {
                const payments = result.data.map(payment => ({
                    id: payment.id,
                    serviceId: payment.service_id,
                    amount: parseFloat(payment.amount),
                    paymentStatus: payment.payment_status,
                    transactionId: payment.transaction_id,
                    platformFee: parseFloat(payment.platform_fee || 0),
                    nannyAmount: parseFloat(payment.nanny_amount || 0),
                    paymentDate: payment.payment_date,
                    receiptUrl: payment.receipt_url,
                    createdAt: payment.created_at,
                    updatedAt: payment.updated_at,
                    // Cliente
                    client: {
                        id: payment.client_user_id,
                        name: `${payment.client_first_name} ${payment.client_last_name}`,
                        email: payment.client_email
                    },
                    // Nanny
                    nanny: {
                        id: payment.nanny_user_id,
                        name: `${payment.nanny_first_name} ${payment.nanny_last_name}`,
                        email: payment.nanny_email
                    },
                    // Servicio
                    service: {
                        startDate: payment.start_date,
                        endDate: payment.end_date,
                        startTime: payment.start_time,
                        endTime: payment.end_time,
                        totalHours: parseFloat(payment.total_hours || 0),
                        status: payment.service_status
                    }
                }));

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
}

module.exports = PaymentController;
