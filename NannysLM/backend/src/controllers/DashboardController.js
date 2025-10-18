const UserModel = require('../models/User');
const { executeQuery } = require('../config/database');

/**
 * Controlador para estadísticas del dashboard
 */
class DashboardController {
    
    /**
     * Obtener estadísticas generales del dashboard
     */
    static async getStats(req, res) {
        try {
            // Obtener estadísticas de usuarios
            const userStats = await UserModel.getStats();
            
            // Procesar estadísticas
            const stats = {
                nannys: {
                    total: 0,
                    active: 0,
                    inactive: 0,
                    verified: 0
                },
                clients: {
                    total: 0,
                    verified: 0,
                    unverified: 0
                },
                admin: {
                    total: 0
                }
            };

            userStats.forEach(stat => {
                if (stat.user_type === 'nanny') {
                    stats.nannys.total = stat.count;
                    stats.nannys.verified = stat.verified_count;
                    stats.nannys.active = stat.active_count;
                    stats.nannys.inactive = stat.count - stat.active_count;
                } else if (stat.user_type === 'client') {
                    stats.clients.total = stat.count;
                    stats.clients.verified = stat.verified_count;
                    stats.clients.unverified = stat.count - stat.verified_count;
                } else if (stat.user_type === 'admin') {
                    stats.admin.total = stat.count;
                }
            });

            res.json({
                success: true,
                data: stats
            });

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
     * Obtener todos los usuarios (nannys, clients, admins)
     */
    static async getAllUsers(req, res) {
        try {
            const { user_type, is_active, is_verified } = req.query;

            let query = `
                SELECT 
                    id, email, first_name, last_name, phone_number, address,
                    user_type, is_verified, is_active, profile_image,
                    created_at, updated_at, last_login
                FROM users 
                WHERE 1=1
            `;
            const params = [];

            if (user_type) {
                query += ' AND user_type = ?';
                params.push(user_type);
            }

            if (is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(is_active === 'true');
            }

            if (is_verified !== undefined) {
                query += ' AND is_verified = ?';
                params.push(is_verified === 'true');
            }

            query += ' ORDER BY created_at DESC';

            const result = await executeQuery(query, params);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener información específica de nannys
     */
    static async getNannys(req, res) {
        try {
            const query = `
                SELECT 
                    u.id, u.email, u.first_name, u.last_name, u.phone_number, 
                    u.address, u.is_verified, u.is_active, u.profile_image,
                    u.created_at, u.last_login,
                    n.description, n.rating_average, n.total_ratings, 
                    n.services_completed, n.status
                FROM users u
                LEFT JOIN nannys n ON u.id = n.user_id
                WHERE u.user_type = 'nanny'
                ORDER BY u.created_at DESC
            `;

            const result = await executeQuery(query);

            if (result.success) {
                const nannys = result.data.map(nanny => ({
                    id: nanny.id,
                    name: `${nanny.first_name} ${nanny.last_name}`,
                    email: nanny.email,
                    phone: nanny.phone_number,
                    address: nanny.address,
                    isVerified: nanny.is_verified,
                    isActive: nanny.is_active,
                    profileImage: nanny.profile_image,
                    description: nanny.description,
                    rating: nanny.rating_average || 0,
                    totalRatings: nanny.total_ratings || 0,
                    servicesCompleted: nanny.services_completed || 0,
                    status: nanny.status || 'active',
                    createdAt: nanny.created_at,
                    lastLogin: nanny.last_login
                }));

                res.json({
                    success: true,
                    data: nannys
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error obteniendo nannys:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener información específica de clientes
     */
    static async getClients(req, res) {
        try {
            const query = `
                SELECT 
                    u.id, u.email, u.first_name, u.last_name, u.phone_number, 
                    u.address, u.is_verified, u.is_active, u.profile_image,
                    u.created_at, u.last_login,
                    c.emergency_contact_name, c.emergency_contact_phone,
                    c.number_of_children, c.special_requirements,
                    c.verification_status, c.verification_date
                FROM users u
                LEFT JOIN clients c ON u.id = c.user_id
                WHERE u.user_type = 'client'
                ORDER BY u.created_at DESC
            `;

            const result = await executeQuery(query);

            if (result.success) {
                const clients = result.data.map(client => ({
                    id: client.id,
                    name: `${client.first_name} ${client.last_name}`,
                    email: client.email,
                    phone: client.phone_number,
                    address: client.address,
                    isVerified: client.is_verified,
                    isActive: client.is_active,
                    profileImage: client.profile_image,
                    emergencyContactName: client.emergency_contact_name,
                    emergencyContactPhone: client.emergency_contact_phone,
                    numberOfChildren: client.number_of_children || 0,
                    specialRequirements: client.special_requirements,
                    verificationStatus: client.verification_status,
                    verificationDate: client.verification_date,
                    createdAt: client.created_at,
                    lastLogin: client.last_login
                }));

                res.json({
                    success: true,
                    data: clients
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error obteniendo clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = DashboardController;