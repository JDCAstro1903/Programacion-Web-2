const { executeQuery, executeTransaction } = require('../config/database');

/**
 * Modelo para manejar operaciones de usuarios en la base de datos
 */
class UserModel {
    
    /**
     * Crear un nuevo usuario
     */
    static async create(userData) {
        const {
            email,
            password_hash,
            first_name,
            last_name,
            phone_number,
            address,
            user_type,
            profile_image,
            is_verified = false,
            is_active = false
        } = userData;
        
        const query = `
            INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                phone_number, 
                address, 
                user_type, 
                profile_image,
                is_verified,
                is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            email,
            password_hash,
            first_name,
            last_name,
            phone_number || null,
            address || null,
            user_type,
            profile_image || null,
            is_verified ? 1 : 0,
            is_active ? 1 : 0
        ];
        
        const result = await executeQuery(query, params);
        
        if (result.success) {
            // Obtener el usuario recién creado
            return await this.findById(result.data.insertId);
        }
        
        throw new Error(result.error);
    }
    
    /**
     * Buscar usuario por email
     */
    static async findByEmail(email) {
        const query = `
            SELECT 
                id,
                email,
                password_hash,
                first_name,
                last_name,
                phone_number,
                address,
                user_type,
                is_verified,
                is_active,
                profile_image,
                created_at,
                updated_at,
                last_login
            FROM users 
            WHERE email = ?
        `;
        
        const result = await executeQuery(query, [email]);
        
        if (result.success && result.data.length > 0) {
            return result.data[0];
        }
        
        return null;
    }

    /**
     * Buscar usuario activo por email
     */
    static async findActiveUserByEmail(email) {
        const query = `
            SELECT 
                id,
                email,
                password_hash,
                first_name,
                last_name,
                phone_number,
                address,
                user_type,
                is_verified,
                is_active,
                profile_image,
                created_at,
                updated_at,
                last_login
            FROM users 
            WHERE email = ? AND is_active = TRUE
        `;
        
        const result = await executeQuery(query, [email]);
        
        if (result.success && result.data.length > 0) {
            return result.data[0];
        }
        
        return null;
    }
    
    /**
     * Buscar usuario por ID
     */
    static async findById(id) {
        const query = `
            SELECT 
                id,
                email,
                password_hash,
                first_name,
                last_name,
                phone_number,
                address,
                user_type,
                is_verified,
                is_active,
                profile_image,
                created_at,
                updated_at,
                last_login
            FROM users 
            WHERE id = ?
        `;
        
        const result = await executeQuery(query, [id]);
        
        if (result.success && result.data.length > 0) {
            return result.data[0];
        }
        
        return null;
    }
    
    /**
     * Verificar si un email ya existe
     */
    static async emailExists(email) {
        const query = `SELECT id FROM users WHERE email = ?`;
        const result = await executeQuery(query, [email]);
        
        return result.success && result.data.length > 0;
    }
    
    /**
     * Actualizar información del usuario
     */
    static async update(id, updateData) {
        const allowedFields = [
            'first_name',
            'last_name', 
            'phone_number',
            'address',
            'profile_image',
            'is_verified',
            'is_active',
            'password_hash'
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
        
        values.push(id);
        
        const query = `
            UPDATE users 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        const result = await executeQuery(query, values);
        
        if (result.success) {
            return await this.findById(id);
        }
        
        throw new Error(result.error);
    }
    
    /**
     * Actualizar último login
     */
    static async updateLastLogin(id) {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        return await executeQuery(query, [id]);
    }
    
    /**
     * Obtener estadísticas de usuarios
     */
    static async getStats() {
        const query = `
            SELECT 
                user_type,
                COUNT(*) as count,
                SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_count,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count
            FROM users 
            GROUP BY user_type
        `;
        
        const result = await executeQuery(query);
        
        if (result.success) {
            return result.data;
        }
        
        return [];
    }
    
    /**
     * Eliminar usuario (soft delete)
     */
    static async softDelete(id) {
        const query = `
            UPDATE users 
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        return await executeQuery(query, [id]);
    }
    
    /**
     * Buscar usuarios con filtros
     */
    static async findWithFilters(filters = {}, page = 1, limit = 10) {
        const {
            user_type,
            is_verified,
            is_active,
            search
        } = filters;
        
        let conditions = ['1=1'];
        let params = [];
        
        if (user_type) {
            conditions.push('user_type = ?');
            params.push(user_type);
        }
        
        if (is_verified !== undefined) {
            conditions.push('is_verified = ?');
            params.push(is_verified);
        }
        
        if (is_active !== undefined) {
            conditions.push('is_active = ?');
            params.push(is_active);
        }
        
        if (search) {
            conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT 
                id,
                email,
                first_name,
                last_name,
                phone_number,
                user_type,
                is_verified,
                is_active,
                profile_image,
                created_at,
                last_login
            FROM users 
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        
        const result = await executeQuery(query, params);
        
        if (result.success) {
            return result.data;
        }
        
        return [];
    }
}

module.exports = UserModel;