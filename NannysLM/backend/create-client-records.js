const { executeQuery, testConnection } = require('./src/config/database');

async function createClientRecords() {
    console.log('🔧 Creando registros faltantes en tabla clients...\n');
    
    try {
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }
        
        // Obtener usuarios que no tienen registro en clients
        const usersWithoutClients = await executeQuery(`
            SELECT u.id, u.first_name, u.last_name, u.email 
            FROM users u 
            LEFT JOIN clients c ON u.id = c.user_id 
            WHERE u.user_type = 'client' AND c.user_id IS NULL
        `);
        
        if (usersWithoutClients.data.length === 0) {
            console.log('✅ Todos los usuarios ya tienen registros en la tabla clients');
            return;
        }
        
        console.log(`📝 Creando registros para ${usersWithoutClients.data.length} usuarios...\n`);
        
        for (const user of usersWithoutClients.data) {
            const insertClientQuery = `
                INSERT INTO clients (user_id, verification_status, emergency_contact_name, 
                                   emergency_contact_phone, number_of_children, special_requirements)
                VALUES (?, 'pending', '', '', 0, '')
            `;
            
            const result = await executeQuery(insertClientQuery, [user.id]);
            
            if (result.success) {
                console.log(`✅ Registro creado para ${user.first_name} ${user.last_name} (ID: ${user.id})`);
            } else {
                console.log(`❌ Error al crear registro para ${user.first_name} ${user.last_name}`);
            }
        }
        
        console.log('\n🎯 URLs para probar con usuarios reales:');
        const allUsers = await executeQuery(`
            SELECT u.id, u.first_name, u.last_name, u.email
            FROM users u 
            WHERE u.user_type = 'client' 
            ORDER BY u.id
        `);
        
        allUsers.data.forEach(user => {
            console.log(`   http://localhost:8000/api/v1/profile/data?userId=${user.id} (${user.first_name} ${user.last_name})`);
        });
        
        console.log('\n✅ Creación de registros completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

createClientRecords();