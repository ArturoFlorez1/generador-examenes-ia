import { GoogleGenAI, Type } from "@google/genai";
import { Question, ExamParams } from "../types";

function getAI(apiKey?: string) {
  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || "" });
}

export async function runAITool(toolId: string, input: any, apiKey?: string): Promise<string> {
  let prompt = "";
  let toolName = "";

  switch (toolId) {
    case 'bloom':
      toolName = "Generador de Preguntas por Taxonomía de Bloom";
      prompt = `Genera un set de preguntas sobre el tema "${input.topic}" para el curso "${input.course}". 
      Enfócate específicamente en el nivel de complejidad: ${input.bloomLevel || 'Cualquiera'}.
      Proporciona el enunciado, las opciones (si aplica) y la justificación pedagógica de por qué pertenece a ese nivel de Bloom.`;
      break;
    case 'evaluator':
      toolName = "Evaluador Pedagógico de Instrumentos";
      prompt = `Analiza pedagógicamente el siguiente examen o contenido educativo: 
      ---
      ${input.content}
      ---
      Proporciona una revisión crítica detallada que incluya:
      1. Calidad de los enunciados.
      2. Validez técnica de las opciones/preguntas.
      3. Alineación con niveles cognitivos.
      4. Recomendaciones de mejora concretas.`;
      break;
    case 'rubric':
      toolName = "Generador de Rúbricas Basadas en Competencias";
      prompt = `Crea una rúbrica de evaluación profesional para:
      Actividad: ${input.activity}
      Tema/Contexto: ${input.topic}
      Criterios/Competencias a incluir: ${input.criteria || 'Criterios estándar de calidad académica'}.
      
      Formato solicitado: Tabla de doble entrada con niveles (Excelente, Bueno, Regular, Insuficiente) y descriptores claros para cada celda.`;
      break;
    case 'improver':
      toolName = "Optimizador de Enunciados y Opciones";
      prompt = `Actúa como un experto en redacción de ítems. Mejora pedagógicamente el siguiente contenido: "${input.question}". 
      Asegura que:
      - El enunciado sea directo e inequívoco.
      - No haya pistas gramaticales hacia la respuesta correcta.
      - Los distractores sean plausibles.
      - El lenguaje sea académico y preciso.`;
      break;
    default:
      throw new Error("Herramienta no reconocida.");
  }

  const systemInstruction = `
    Eres un experto en pedagogía universitaria y evaluación educativa de la Universidad de Córdoba.
    Tu objetivo es ayudar a los docentes a mejorar sus instrumentos evaluativos.
    Todas las respuestas deben estar en formato Markdown bien estructurado, usando negritas, listas y tablas cuando sea apropiado.
    Herramienta: ${toolName}
  `;

  const ai = getAI(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response.text;
}

export async function generateExamQuestions(params: ExamParams, apiKey?: string): Promise<Question[]> {
  const { topic, difficulty, numQuestions, course, semester, questionTypes, distribution } = params;

  let distributionText = "";
  if (distribution) {
    distributionText = `Distribución por tipo:
    - Opción Múltiple: ${distribution.multiple_choice}
    - Abierta/Respuesta Corta: ${distribution.open_question}
    - Estudio de Caso: ${distribution.case_study}
    - Taller/Ejercicio: ${distribution.workshop}
    - Verdadero o Falso: ${distribution.true_false}`;
  } else {
    distributionText = `Formatos soportados: ${questionTypes.join(', ')}.`;
  }

  const systemInstruction = `
    Eres un agente inteligente de apoyo a la evaluación educativa en Educación Superior, enfocado en la Licenciatura en Informática de la Universidad de Córdoba, Colombia.
    Tu función es asistir a docentes en la creación de instrumentos de evaluación basados en evidencias de aprendizaje (Cuestionarios, Estudios de Caso, Talleres) para Programación e Informática.
    
    Lineamientos obligatorios para CADA ítem:
    1. Alinear con un resultado de aprendizaje específico del tema.
    2. Indicar la competencia evaluada.
    3. Clasificar el nivel cognitivo según la Taxonomía de Bloom.
    4. Ajustar la dificultad al nivel solicitado: ${difficulty}.
    5. Justificar la dificultad de la pregunta.
    6. Evaluar criterios de calidad internamente: Claridad, Coherencia, Pertinencia.
    7. Incluir una "Recomendación para el docente".
    8. Toda la respuesta debe estar estrictamente en español (Español Neutro). Evita términos técnicos en inglés a menos que sea estrictamente necesario para el tema (ej. nombres de lenguajes de programación o protocolos específicos).
    
    Contexto del Curso:
    - Curso: ${course}
    - Semestre: ${semester}
    - Tema: ${topic}
    - Nivel solicitado: ${difficulty}
    
    ${distributionText}
    
    IMPORTANTE: Genera EXACTAMENTE ${numQuestions} preguntas en total, respetando la distribución si fue proporcionada. El contenido debe ser académico, claro y preciso.
  `;

  const ai = getAI(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera ${numQuestions} ítems de evaluación sobre ${topic} para el curso ${course}.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['multiple_choice', 'open_question', 'case_study', 'workshop', 'true_false'] },
            prompt: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            justification: { type: Type.STRING },
            competence: { type: Type.STRING },
            learningOutcome: { type: Type.STRING },
            bloomLevel: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['bajo', 'medio', 'alto'] },
            difficultyJustification: { type: Type.STRING },
            qualityCriteria: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.STRING },
                coherence: { type: Type.STRING },
                pertinence: { type: Type.STRING }
              }
            },
            teacherRecommendation: { type: Type.STRING }
          },
          required: [
            "id", "type", "prompt", "correctAnswer", "justification", "competence", 
            "learningOutcome", "bloomLevel", "difficulty", "difficultyJustification", 
            "qualityCriteria", "teacherRecommendation"
          ]
        }
      }
    }
  });

  try {
    const questions = JSON.parse(response.text);
    return questions;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("No se pudo generar el examen. Por favor, intenta de nuevo.");
  }
}

export async function reformulateQuestion(question: Question, instructions: string, apiKey?: string): Promise<Question> {
  const systemInstruction = `
    Eres un experto en evaluación educativa superior.
    Tu tarea es REFORMULAR una pregunta de examen basándote en las instrucciones específicas del docente.
    
    INSTRUCCIONES DEL DOCENTE:
    "${instructions}"
    
    REGLAS:
    1. Mantén la esencia del tema pero ajusta la redacción, opciones o estructura según lo solicitado.
    2. Mantén la calidad pedagógica y el rigor académico.
    3. Devuelve estrictamente un objeto JSON que siga el esquema de la pregunta original.
    4. NO cambies el ID de la pregunta.
  `;

  const ai = getAI(apiKey);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Reformula esta pregunta: ${JSON.stringify(question)} con estas instrucciones: ${instructions}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['multiple_choice', 'open_question', 'case_study', 'workshop', 'true_false'] },
          prompt: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          justification: { type: Type.STRING },
          competence: { type: Type.STRING },
          learningOutcome: { type: Type.STRING },
          bloomLevel: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ['bajo', 'medio', 'alto'] },
          difficultyJustification: { type: Type.STRING },
          qualityCriteria: {
            type: Type.OBJECT,
            properties: {
              clarity: { type: Type.STRING },
              coherence: { type: Type.STRING },
              pertinence: { type: Type.STRING }
            }
          },
          teacherRecommendation: { type: Type.STRING }
        },
        required: [
          "id", "type", "prompt", "correctAnswer", "justification", "competence", 
          "learningOutcome", "bloomLevel", "difficulty", "difficultyJustification", 
          "qualityCriteria", "teacherRecommendation"
        ]
      }
    }
  });

  return JSON.parse(response.text);
}
