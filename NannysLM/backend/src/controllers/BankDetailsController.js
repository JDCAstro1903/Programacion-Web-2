const { executeQuery } = require('../config/database');

/**
 * Controlador para gestión de datos bancarios de las nannys
 */
class BankDetailsController {
    
    /**
     * Obtener todos los datos bancarios
     */
    static async getBankDetails(req, res) {
        try {
            const query = `
                SELECT 
                    bd.id,
                    bd.nanny_id,
                    bd.account_holder_name,
                    bd.bank_name,
                    bd.account_number,
                    bd.clabe,
                    bd.account_type,
                    bd.is_primary,
                    bd.is_active,
                    bd.created_at,
                    bd.updated_at,
                    u.first_name as nanny_first_name,
                    u.last_name as nanny_last_name,
                    u.email as nanny_email,
                    n.status as nanny_status
                FROM bank_details bd
                INNER JOIN nannys n ON bd.nanny_id = n.id
                INNER JOIN users u ON n.user_id = u.id
                ORDER BY bd.created_at DESC
            `;

            const result = await executeQuery(query);

            if (result.success) {
                const bankDetails = result.data.map(detail => ({
                    id: detail.id,
                    nannyId: detail.nanny_id,
                    accountHolderName: detail.account_holder_name,
                    bankName: detail.bank_name,
                    accountNumber: detail.account_number,
                    clabe: detail.clabe,
                    accountType: detail.account_type,
                    isPrimary: Boolean(detail.is_primary),
                    isActive: Boolean(detail.is_active),
                    createdAt: detail.created_at,
                    updatedAt: detail.updated_at,
                    nanny: {
                        id: detail.nanny_id,
                        name: `${detail.nanny_first_name} ${detail.nanny_last_name}`,
                        email: detail.nanny_email,
                        status: detail.nanny_status
                    }
                }));

                res.json({
                    success: true,
                    data: bankDetails
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error obteniendo datos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener datos bancarios por ID
     */
    static async getBankDetailById(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    bd.*,
                    u.first_name as nanny_first_name,
                    u.last_name as nanny_last_name
                FROM bank_details bd
                INNER JOIN nannys n ON bd.nanny_id = n.id
                INNER JOIN users u ON n.user_id = u.id
                WHERE bd.id = ?
            `;

            const result = await executeQuery(query, [id]);

            if (result.success && result.data.length > 0) {
                const detail = result.data[0];
                
                res.json({
                    success: true,
                    data: {
                        id: detail.id,
                        nannyId: detail.nanny_id,
                        accountHolderName: detail.account_holder_name,
                        bankName: detail.bank_name,
                        accountNumber: detail.account_number,
                        clabe: detail.clabe,
                        accountType: detail.account_type,
                        isPrimary: Boolean(detail.is_primary),
                        isActive: Boolean(detail.is_active),
                        nannyName: `${detail.nanny_first_name} ${detail.nanny_last_name}`,
                        createdAt: detail.created_at,
                        updatedAt: detail.updated_at
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Datos bancarios no encontrados'
                });
            }

        } catch (error) {
            console.error('Error obteniendo datos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Crear nuevos datos bancarios
     */
    static async createBankDetails(req, res) {
        try {
            const {
                nannyId,
                accountHolderName,
                bankName,
                accountNumber,
                clabe,
                accountType = 'checking',
                isPrimary = false,
                isActive = true
            } = req.body;

            // Validar campos requeridos
            if (!nannyId || !accountHolderName || !bankName || !accountNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos'
                });
            }

            const query = `
                INSERT INTO bank_details (
                    nanny_id, account_holder_name, bank_name, account_number,
                    clabe, account_type, is_primary, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                nannyId,
                accountHolderName,
                bankName,
                accountNumber,
                clabe,
                accountType,
                isPrimary,
                isActive
            ]);

            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Datos bancarios creados exitosamente',
                    data: { id: result.data.insertId }
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error creando datos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Actualizar datos bancarios
     */
    static async updateBankDetails(req, res) {
        try {
            const { id } = req.params;
            const {
                accountHolderName,
                bankName,
                accountNumber,
                clabe,
                accountType,
                isPrimary,
                isActive
            } = req.body;

            const query = `
                UPDATE bank_details 
                SET 
                    account_holder_name = ?,
                    bank_name = ?,
                    account_number = ?,
                    clabe = ?,
                    account_type = ?,
                    is_primary = ?,
                    is_active = ?
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                accountHolderName,
                bankName,
                accountNumber,
                clabe,
                accountType,
                isPrimary,
                isActive,
                id
            ]);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Datos bancarios actualizados exitosamente'
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error actualizando datos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Eliminar datos bancarios
     */
    static async deleteBankDetails(req, res) {
        try {
            const { id } = req.params;

            const query = 'DELETE FROM bank_details WHERE id = ?';
            const result = await executeQuery(query, [id]);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Datos bancarios eliminados exitosamente'
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error eliminando datos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Alternar estado activo/inactivo
     */
    static async toggleActiveStatus(req, res) {
        try {
            const { id } = req.params;

            const query = `
                UPDATE bank_details 
                SET is_active = NOT is_active
                WHERE id = ?
            `;

            const result = await executeQuery(query, [id]);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Estado actualizado exitosamente'
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error actualizando estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = BankDetailsController;
