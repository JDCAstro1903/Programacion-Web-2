const { executeQuery } = require('../config/database');

/**
 * Modelo para manejar operaciones de clientes en la base de datos
 */
class ClientModel {
    /**
     * Actualizar información del cliente
     */
    static async updateByUserId(userId, updateData) {
        const allowedFields = [
            'emergency_contact_name',
            'emergency_contact_phone',
            'number_of_children',
            'special_requirements',
            'verification_status',
            'verification_date'
        ];
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        if (fields.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }
        values.push(userId);
        const query = `
            UPDATE clients 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        `;
        const result = await executeQuery(query, values);
        if (result.success) {
            return result;
        }
        throw new Error(result.error);
    }
}

module.exports = ClientModel;
