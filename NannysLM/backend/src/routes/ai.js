const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Polyfills para Node.js < 18
const fetch = require('node-fetch');
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = fetch.Headers;
  globalThis.Request = fetch.Request;
  globalThis.Response = fetch.Response;
}

// Importar directamente la función
const getNannyTips = async (req, res) => {
  try {
    console.log('🤖 Generando consejos de IA para nanny...');
    
    // Inicializar Gemini AI
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Eres un asistente experto en cuidado infantil y desarrollo profesional de niñeras. 
    Proporciona 3 consejos profesionales, prácticos y útiles para niñeras que trabajan con familias y niños.
    Los consejos deben ser concisos, profesionales y enfocados en:
    - Seguridad y bienestar de los niños
    - Comunicación efectiva con los padres
    - Desarrollo infantil y actividades educativas
    - Gestión del tiempo y organización
    - Primeros auxilios o emergencias básicas
    
    Formato de respuesta (JSON):
    {
      "tips": [
        {
          "title": "Título corto del consejo",
          "description": "Descripción breve y práctica del consejo (máximo 100 palabras)",
          "icon": "emoji relevante"
        }
      ]
    }
    
    Responde SOLO con el JSON válido, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Respuesta de IA recibida');
    
    let tips;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      tips = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta de IA:', parseError);
      tips = {
        tips: [
          {
            title: 'Establece rutinas claras',
            description: 'Las rutinas diarias ayudan a los niños a sentirse seguros. Mantén horarios consistentes para comidas, siestas y actividades.',
            icon: '⏰'
          },
          {
            title: 'Comunicación con los padres',
            description: 'Mantén una comunicación abierta y regular con los padres. Informa sobre las actividades del día y cualquier situación importante.',
            icon: '💬'
          },
          {
            title: 'Actividades educativas',
            description: 'Incorpora juegos educativos que estimulen el desarrollo cognitivo y motor de los niños según su edad.',
            icon: '🎨'
          }
        ]
      };
    }
    
    return res.status(200).json({
      success: true,
      message: 'Consejos generados exitosamente',
      data: tips
    });
    
  } catch (error) {
    console.error('❌ Error al generar consejos de IA:', error);
    
    return res.status(200).json({
      success: true,
      message: 'Consejos predeterminados (servicio IA no disponible)',
      data: {
        tips: [
          {
            title: 'Seguridad primero',
            description: 'Siempre mantén un ambiente seguro. Revisa que no haya objetos peligrosos al alcance de los niños y conoce los números de emergencia.',
            icon: '🛡️'
          },
          {
            title: 'Juego y aprendizaje',
            description: 'Combina diversión con aprendizaje. Usa juegos educativos apropiados para la edad que desarrollen habilidades cognitivas y sociales.',
            icon: '🎯'
          },
          {
            title: 'Paciencia y empatía',
            description: 'Cada niño es único. Practica la paciencia y adapta tu enfoque según las necesidades individuales de cada pequeño.',
            icon: '💖'
          }
        ]
      }
    });
  }
};

/**
 * @route   GET /api/v1/ai/nanny-tips
 * @desc    Obtener consejos de IA para nannys
 * @access  Private (Nannys)
 */
router.get('/nanny-tips', verifyToken, getNannyTips);

module.exports = router;
