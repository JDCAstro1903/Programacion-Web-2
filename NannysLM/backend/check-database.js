const { executeQuery, testConnection } = require('./src/config/database');

async function checkDatabase() {
    console.log('🔍 Verificando estado de la base de datos...\n');
    
    try {
        // Verificar conexión
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }
        
        // Verificar usuarios existentes
        const usersResult = await executeQuery('SELECT COUNT(*) as total FROM users WHERE user_type = "client"');
        const usersCount = usersResult.data[0].total;
        
        console.log(`👥 Usuarios tipo cliente en la base de datos: ${usersCount}`);
        
        if (usersCount === 0) {
            console.log('\n⚠️  No hay usuarios cliente en la base de datos');
            console.log('🔧 Creando usuarios de prueba...\n');
            
            // Crear usuario de prueba 1
            const insertUser1 = `
                INSERT INTO users (email, first_name, last_name, phone_number, address, user_type, is_verified, is_active, password_hash) 
                VALUES (?, ?, ?, ?, ?, 'client', true, true, 'hash_temporal')
            `;
            
            const user1Data = [
                'maria.gonzalez@email.com',
                'María',
                'González López',
                '55 1234 5678',
                'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX'
            ];
            
            const result1 = await executeQuery(insertUser1, user1Data);
            
            if (result1.success) {
                console.log('✅ Usuario María González creado exitosamente');
                
                // Crear registro en clients para usuario 1
                const insertClient1 = `
                    INSERT INTO clients (user_id, verification_status, emergency_contact_name, emergency_contact_phone, number_of_children, special_requirements)
                    VALUES (?, 'verified', ?, ?, ?, ?)
                `;
                
                const client1Data = [
                    result1.data.insertId, // user_id del usuario recién creado
                    'Carlos González',
                    '55 8765 4321',
                    2,
                    'Niña de 4 años alérgica al cacahuate, niño de 7 años con asma leve'
                ];
                
                await executeQuery(insertClient1, client1Data);
                console.log('✅ Datos de cliente para María González creados');
            }
            
            // Crear usuario de prueba 2
            const user2Data = [
                'juan.perez@email.com',
                'Juan',
                'Pérez Martín',
                '55 9876 5432',
                'Calle Reforma 567, Col. Juárez, CDMX'
            ];
            
            const result2 = await executeQuery(insertUser1, user2Data);
            
            if (result2.success) {
                console.log('✅ Usuario Juan Pérez creado exitosamente');
                
                // Crear registro en clients para usuario 2
                const client2Data = [
                    result2.data.insertId,
                    'Ana Pérez',
                    '55 5555 1234',
                    1,
                    'Bebé de 8 meses, necesita cuidados especializados'
                ];
                
                await executeQuery(insertClient1, client2Data);
                console.log('✅ Datos de cliente para Juan Pérez creados');
            }
            
        } else {
            // Mostrar usuarios existentes
            const existingUsers = await executeQuery(`
                SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, 
                       u.is_verified, c.verification_status, c.number_of_children
                FROM users u 
                LEFT JOIN clients c ON u.id = c.user_id 
                WHERE u.user_type = 'client' 
                ORDER BY u.id
            `);
            
            console.log('\n📋 Usuarios cliente existentes:');
            console.log('=====================================');
            
            existingUsers.data.forEach(user => {
                console.log(`ID: ${user.id}`);
                console.log(`Nombre: ${user.first_name} ${user.last_name}`);
                console.log(`Email: ${user.email}`);
                console.log(`Teléfono: ${user.phone_number || 'No especificado'}`);
                console.log(`Verificado: ${user.is_verified ? '✅' : '❌'}`);
                console.log(`Estado cliente: ${user.verification_status || 'Sin datos'}`);
                console.log(`Número de hijos: ${user.number_of_children || 0}`);
                console.log('-------------------------------------');
            });
        }
        
        console.log('\n🎯 Para probar el perfil, usa uno de estos IDs de usuario en la URL:');
        const testUsers = await executeQuery('SELECT id, first_name, last_name FROM users WHERE user_type = "client" ORDER BY id LIMIT 3');
        
        testUsers.data.forEach(user => {
            console.log(`   http://localhost:8000/api/v1/profile/data?userId=${user.id} (${user.first_name} ${user.last_name})`);
        });
        
        console.log('\n✅ Verificación de base de datos completada');
        
    } catch (error) {
        console.error('❌ Error al verificar la base de datos:', error);
    }
    
    process.exit(0);
}

checkDatabase();