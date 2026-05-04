import { GoogleGenAI, Type } from "@google/genai";
import { Question, ExamParams } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function runAITool(toolId: string, input: any): Promise<string> {
  let prompt = "";
  let toolName = "";

  switch (toolId) {
    case 'bloom':
      toolName = "Generador de Preguntas por Taxonomía de Bloom";
      prompt = `Genera 3 variantes de preguntas sobre el tema "${input.topic}" para el curso "${input.course}", cada una correspondiente a un nivel diferente de la Taxonomía de Bloom (Especificar nivel).`;
      break;
    case 'evaluator':
      toolName = "Evaluador Pedagógico de Instrumentos";
      prompt = `Analiza pedagógicamente el siguiente examen o ítem: "${input.content}". Proporciona una revisión crítica basada en criterios de claridad, validez técnica y alineación con evidencias de aprendizaje.`;
      break;
    case 'rubric':
      toolName = "Generador de Rúbricas Basadas en Evidencias";
      prompt = `Crea una rúbrica detallada en formato tabla para evaluar un(a) "${input.activity}" sobre "${input.topic}". Incluye criterios (Excelente, Bueno, Regular, Insuficiente) y puntajes sugeridos.`;
      break;
    case 'improver':
      toolName = "Optimizador de Enunciados y Opciones";
      prompt = `Mejora y optimiza pedagógicamente el siguiente ítem de evaluación: "${input.question}". Asegura que sea claro, sin ambigüedades y que las opciones (si las hay) sean distractores válidos.`;
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response.text;
}

export async function generateExamQuestions(params: ExamParams): Promise<Question[]> {
  const { topic, difficulty, numQuestions, course, semester, questionTypes } = params;

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

    Contexto del Curso:
    - Asignatura: ${course}
    - Semestre: ${semester}
    - Tema: ${topic}
    - Nivel solicitado: ${difficulty}

    Formatos soportados: ${questionTypes.join(', ')}.
  `;

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
