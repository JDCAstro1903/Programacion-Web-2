/**
 * Script para reemplazar todos los console.log por logger
 * Ejecutar con: node replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directorios a procesar
const directories = [
    './src/controllers',
    './src/models',
    './src/routes',
    './src/utils'
];

// Archivos a excluir
const excludeFiles = ['logger.js'];

// Patrones de reemplazo
const replacements = [
    // console.log simple
    {
        pattern: /console\.log\((.*?)\);/g,
        replacement: (match, content) => {
            // Si tiene emoji o es muy detallado, usar debug
            if (content.includes('🔍') || content.includes('📊') || content.includes('📝')) {
                return `logger.debug(${content});`;
            }
            // Si es éxito, usar success
            if (content.includes('✅')) {
                const clean = content.replace(/['"`]✅\s*/g, "'");
                return `logger.success(${clean});`;
            }
            // Si es info general
            return `logger.info(${content});`;
        }
    },
    // console.error
    {
        pattern: /console\.error\((.*?)\);/g,
        replacement: (match, content) => `logger.error(${content});`
    },
    // console.warn
    {
        pattern: /console\.warn\((.*?)\);/g,
        replacement: (match, content) => `logger.warn(${content});`
    }
];

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Verificar si ya tiene logger importado
        const hasLogger = content.includes("require('./logger')") || 
                         content.includes("require('../utils/logger')") ||
                         content.includes("require('./utils/logger')");

        // Contar console.log antes
        const consoleMatches = content.match(/console\.(log|error|warn)/g);
        if (!consoleMatches || consoleMatches.length === 0) {
            return { processed: false, count: 0 };
        }

        console.log(`\n📄 Procesando: ${filePath}`);
        console.log(`   Console.logs encontrados: ${consoleMatches.length}`);

        // Agregar import de logger si no existe
        if (!hasLogger) {
            // Detectar otros requires
            const requireMatch = content.match(/const .+ = require\(.+\);/);
            if (requireMatch) {
                const lastRequire = requireMatch[0];
                const depth = (filePath.match(/\//g) || []).length - 1;
                let loggerPath = './logger';
                if (filePath.includes('/controllers/') || filePath.includes('/models/') || filePath.includes('/routes/')) {
                    loggerPath = '../utils/logger';
                }
                content = content.replace(
                    lastRequire,
                    `${lastRequire}\nconst logger = require('${loggerPath}');`
                );
                modified = true;
            }
        }

        // Aplicar reemplazos
        replacements.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        });

        // Guardar archivo si fue modificado
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   ✅ Actualizado!`);
            return { processed: true, count: consoleMatches.length };
        }

        return { processed: false, count: 0 };

    } catch (error) {
        console.error(`   ❌ Error procesando ${filePath}:`, error.message);
        return { processed: false, count: 0 };
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let stats = { filesProcessed: 0, logsReplaced: 0 };

    files.forEach(file => {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
            const subStats = processDirectory(filePath);
            stats.filesProcessed += subStats.filesProcessed;
            stats.logsReplaced += subStats.logsReplaced;
        } else if (file.name.endsWith('.js') && !excludeFiles.includes(file.name)) {
            const result = processFile(filePath);
            if (result.processed) {
                stats.filesProcessed++;
                stats.logsReplaced += result.count;
            }
        }
    });

    return stats;
}

// Ejecutar
console.log('🔧 Iniciando reemplazo de console.log por logger...\n');
console.log('📁 Directorios a procesar:', directories);

let totalStats = { filesProcessed: 0, logsReplaced: 0 };

directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`\n📂 Procesando directorio: ${dir}`);
        const stats = processDirectory(dir);
        totalStats.filesProcessed += stats.filesProcessed;
        totalStats.logsReplaced += stats.logsReplaced;
    } else {
        console.log(`⚠️  Directorio no encontrado: ${dir}`);
    }
});

console.log('\n' + '='.repeat(60));
console.log('✨ RESUMEN:');
console.log(`   Archivos modificados: ${totalStats.filesProcessed}`);
console.log(`   Console.logs reemplazados: ${totalStats.logsReplaced}`);
console.log('='.repeat(60));
console.log('\n✅ Proceso completado!\n');
