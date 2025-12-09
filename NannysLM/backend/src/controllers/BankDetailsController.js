const { executeQuery } = require('../config/database');
const logger = require('./logger');

/**
 * Controlador para gestión de datos bancarios de las nannys
 */
class BankDetailsController {
    
    /**
     * Obtener todos los datos bancarios
     */
    static async getBankDetails(req, res) {
        try {
            logger.info('📋 Obteniendo todos los datos bancarios...');
            
            const query = `
                SELECT 
                    id,
                    account_holder_name,
                    bank_name,
                    account_number,
                    clabe,
                    account_type,
                    is_primary,
                    is_active,
                    created_at,
                    updated_at
                FROM bank_details
                ORDER BY created_at DESC
            `;

            const result = await executeQuery(query);

            if (result.success) {
                logger.success('Se encontraron ${result.data.length} registros de datos bancarios`);
                
                const bankDetails = result.data.map(detail => ({
                    id: detail.id,
                    accountHolderName: detail.account_holder_name,
                    bankName: detail.bank_name,
                    accountNumber: detail.account_number,
                    clabe: detail.clabe,
                    accountType: detail.account_type,
                    isPrimary: Boolean(detail.is_primary),
                    isActive: Boolean(detail.is_active),
                    createdAt: detail.created_at,
                    updatedAt: detail.updated_at
                }));

                res.json({
                    success: true,
                    data: bankDetails
                });
            } else {
                logger.error('❌ Error en la query:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('❌ Error obteniendo datos bancarios:', error.message);
            logger.error('Stack:', error.stack);
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
                    id,
                    account_holder_name,
                    bank_name,
                    account_number,
                    clabe,
                    account_type,
                    is_primary,
                    is_active,
                    created_at,
                    updated_at
                FROM bank_details
                WHERE id = ?
            `;

            const result = await executeQuery(query, [id]);

            if (result.success && result.data.length > 0) {
                const detail = result.data[0];
                
                res.json({
                    success: true,
                    data: {
                        id: detail.id,
                        accountHolderName: detail.account_holder_name,
                        bankName: detail.bank_name,
                        accountNumber: detail.account_number,
                        clabe: detail.clabe,
                        accountType: detail.account_type,
                        isPrimary: Boolean(detail.is_primary),
                        isActive: Boolean(detail.is_active),
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
            logger.error('Error obteniendo datos bancarios:', error);
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
                accountHolderName,
                bankName,
                accountNumber,
                clabe,
                accountType = 'checking',
                isPrimary = false,
                isActive = true
            } = req.body;

            logger.debug('📝 Creando nuevos datos bancarios');
            logger.info('Datos recibidos:', { accountHolderName, bankName, accountNumber, clabe, accountType, isPrimary, isActive });

            // Validar campos requeridos
            if (!accountHolderName || !bankName || !accountNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: nombre titular, banco y número de cuenta'
                });
            }

            // Convertir booleanos correctamente
            const isPrimaryValue = (isPrimary === true || isPrimary === 1 || isPrimary === '1') ? 1 : 0;
            const isActiveValue = (isActive === true || isActive === 1 || isActive === '1') ? 1 : 0;

            const query = `
                INSERT INTO bank_details (
                    account_holder_name, bank_name, account_number,
                    clabe, account_type, is_primary, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                accountHolderName.trim(),
                bankName.trim(),
                accountNumber.trim(),
                clabe ? clabe.trim() : null,
                accountType && ['checking', 'savings'].includes(accountType) ? accountType : 'checking',
                isPrimaryValue,
                isActiveValue
            ];

            logger.info('Parámetros de query:', params);

            const result = await executeQuery(query, params);

            if (result.success) {
                logger.success('Datos bancarios creados exitosamente');
                res.status(201).json({
                    success: true,
                    message: 'Datos bancarios creados exitosamente',
                    data: { id: result.data.insertId }
                });
            } else {
                logger.error('❌ Error en la creación:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('❌ Error creando datos bancarios:', error.message);
            logger.error('Stack:', error.stack);
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

            logger.debug('📝 Actualizando datos bancarios ID:', id);
            logger.info('Datos recibidos:', { accountHolderName, bankName, accountNumber, clabe, accountType, isPrimary, isActive });

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Validar campos requeridos
            if (!accountHolderName || !bankName || !accountNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: nombre titular, banco y número de cuenta'
                });
            }

            // Convertir booleanos correctamente
            let isPrimaryValue = 0;
            let isActiveValue = 1;

            if (isPrimary !== undefined && isPrimary !== null) {
                isPrimaryValue = (isPrimary === true || isPrimary === 1 || isPrimary === '1') ? 1 : 0;
            }

            if (isActive !== undefined && isActive !== null) {
                isActiveValue = (isActive === true || isActive === 1 || isActive === '1') ? 1 : 0;
            }

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

            const params = [
                accountHolderName.trim(),
                bankName.trim(),
                accountNumber.trim(),
                clabe ? clabe.trim() : null,
                accountType && ['checking', 'savings'].includes(accountType) ? accountType : 'checking',
                isPrimaryValue,
                isActiveValue,
                parseInt(id)
            ];

            logger.info('Parámetros de query:', params);

            const result = await executeQuery(query, params);

            if (result.success) {
                logger.success('Datos bancarios actualizados exitosamente');
                res.json({
                    success: true,
                    message: 'Datos bancarios actualizados exitosamente'
                });
            } else {
                logger.error('❌ Error en la actualización:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('❌ Error actualizando datos bancarios:', error.message);
            logger.error('Stack:', error.stack);
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
            logger.error('Error eliminando datos bancarios:', error);
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

            logger.info('🔄 Alternando estado del registro ID:', id);

            const query = `
                UPDATE bank_details 
                SET is_active = NOT is_active
                WHERE id = ?
            `;

            const result = await executeQuery(query, [id]);

            if (result.success) {
                logger.success('Estado alternado exitosamente');
                res.json({
                    success: true,
                    message: 'Estado actualizado exitosamente'
                });
            } else {
                logger.error('❌ Error en la alternancia:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            logger.error('Error actualizando estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = BankDetailsController;
