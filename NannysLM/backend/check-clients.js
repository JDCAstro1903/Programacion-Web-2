/**
 * Script rápido para verificar clientes en la base de datos
 */

const { executeQuery } = require('./src/config/database');

async function checkClients() {
    try {
        console.log('🔍 Verificando clientes en la base de datos...\n');
        
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_verified,
                c.verification_status,
                u.created_at
            FROM users u
            LEFT JOIN clients c ON u.id = c.user_id
            WHERE u.user_type = 'client'
            ORDER BY u.created_at DESC
        `;
        
        const result = await executeQuery(query);
        
        if (result.success) {
            const clients = result.data;
            console.log(`📊 Total de clientes: ${clients.length}\n`);
            
            const verified = clients.filter(c => c.is_verified === 1 || c.is_verified === true);
            const unverified = clients.filter(c => c.is_verified === 0 || c.is_verified === false);
            
            console.log(`✅ Verificados: ${verified.length}`);
            console.log(`⏳ No verificados: ${unverified.length}\n`);
            
            console.log('Lista de clientes:');
            console.log('━'.repeat(80));
            
            clients.forEach((client, index) => {
                const status = client.is_verified ? '✅' : '⏳';
                console.log(`${index + 1}. ${status} ${client.first_name} ${client.last_name}`);
                console.log(`   Email: ${client.email}`);
                console.log(`   Verificado: ${client.is_verified ? 'SÍ' : 'NO'}`);
                console.log(`   Estado: ${client.verification_status || 'N/A'}`);
                console.log('');
            });
            
        } else {
            console.error('❌ Error:', result.error);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkClients();
