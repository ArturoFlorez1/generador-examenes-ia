import React from 'react';
import { BrainCircuit, Info, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SaberProQuestionGuideProps {
  difficulty: 'bajo' | 'medio' | 'alto' | 'integral';
  isOpen: boolean;
  onClose: () => void;
}

const GUIDES = {
  bajo: {
    level: 'Interpretativo',
    focus: 'Comprensión Literal e Inferencial Directa',
    cognitiveTarget: 'Mide tu capacidad de procesar la información base sin añadir supuestos propios ni juicios de valor. Es el cimiento esencial de la prueba.',
    structure: 'Un texto de contexto (caso técnico, normativa o escenario de programación) seguido de una pregunta directa sobre su significado literal, secuencia o datos explícitos.',
    distractors: [
      'Opciones con datos plausibles pero inventados o completamente ajenos al texto/caso.',
      'Conceptos teóricos que son correctos en la vida real pero que NO están descritos en la lectura dada.',
      'Palabras idénticas al texto pero acomodadas en el orden equivocado para cambiar su sentido de verdad.'
    ],
    steps: [
      'Realiza una lectura panorámica rápida y localiza con precisión el segmento donde se encuentra el concepto clave consultado.',
      'Diferencia estrictamente los hechos demostrables en el texto de tus opiniones personales o teorías externas.',
      'Evalúa las opciones buscando sinónimos: la respuesta correcta a veces parafrasea los datos explícitos del texto de manera compacta.',
      'Descarte las opciones que utilicen absolutos categóricos ("siempre", "nunca", "todos") si el texto base no los sustenta.'
    ],
    tips: 'No trates de resolver un dilema complejo aquí: la respuesta ya está inscrita en la propia información suministrada. Busca el puente exacto entre opción y texto base.'
  },
  medio: {
    level: 'Argumentativo',
    focus: 'Justificación, Relaciones Lógicas y Causalidad',
    cognitiveTarget: 'Evalúa si comprendes la lógica detrás de una decisión, las razones que soportan una conclusión y la coherencia de las premisas planteadas.',
    structure: 'Un escenario donde conviven múltiples decisiones o variables profesionales, centrándose en el porqué o fundamento metodológico o ético de la situación.',
    distractors: [
      'Explicaciones lógicamente incoherentes o falacias de causa falsa que aparentan rigor pero violan la lógica técnica.',
      'Opciones que citan una causa verdadera en general, pero que no justifica la conclusión del caso específico consultado.',
      'Argumentos circulares que se limitan a repetir parte del enunciado sin dar una razón sustancial del hecho.'
    ],
    steps: [
      'Identifica el núcleo de la controversia, hipótesis o decisión profesional que el enunciado te pide sustentar o analizar.',
      'Busca los conectores de causa y efecto en la narrativa: localiza las premisas ("dado que...", "debido a...") y asócialas a la conclusión.',
      'Pregúntate autónomamente si la opción explicativa justifica de manera directa e incontrovertible el efecto detallado.',
      'Elimina justificaciones que justifiquen malas prácticas en ingeniería de software, técnicas obsoletas o atajos pedagógicos.'
    ],
    tips: 'Aplica la prueba del "Porque": lee el enunciado de la pregunta, añade la palabra "porque" y verifica cuál opción de respuesta es la que mantiene una solidez lógica impecable.'
  },
  alto: {
    level: 'Propositivo',
    focus: 'Modelamiento, Alternativas y Planteamiento de Soluciones',
    cognitiveTarget: 'Mide la capacidad de aplicar marcos teóricos abstractos para solucionar fallos prácticos bajo restricciones fuertes, prediciendo impactos futuros.',
    structure: 'Un problema detallado de diseño de software, arquitectura o dilema ético/pedagógico con limitantes severas donde se requiere una solución de ingeniería.',
    distractors: [
      'Soluciones utópicas altamente deseables pero inviables financieramente o técnicamente bajo las restricciones del caso.',
      'Acciones paliativas que corrigen el síntoma inmediato del problema pero perpetúan el fallo estructural del sistema.',
      'Respuestas técnicamente impecables que desatienden la legislación o provocan un impacto social y ecológico adverso.'
    ],
    steps: [
      'Mapea y registra mentalmente todas las restricciones impuestas por el caso (presupuesto, tiempos, tecnología, factor humano).',
      'Simula mentalmente los efectos secundarios y ramificaciones a mediano plazo de aplicar la propuesta de cada opción de respuesta.',
      'Selecciona la alternativa sistémica: aquella que mitiga el riesgo principal, optimiza recursos y respeta los estándares profesionales.',
      'Elimina opciones que impliquen evadir responsabilidades profesionales o que trasladen el problema a un tercero indefenso.'
    ],
    tips: 'En el nivel propositivo debes actuar como un tomador de decisiones estratégico. La respuesta ganadora siempre optimiza rendimiento dentro de los límites rígidos del caso.'
  },
  integral: {
    level: 'Integral',
    focus: 'Articulación de Competencias Profesionales',
    cognitiveTarget: 'Demuestra madurez analítica combinando lectura crítica, razonamiento técnico de datos e implicaciones de ciudadanía bajo escenarios híbridos.',
    structure: 'Casos robustos integradores del ejercicio profesional del informático que entrelazan dilemas éticos, análisis estadístico de desempeño e innovación.',
    distractors: [
      'Soluciones hiper-especializadas que resuelven una dimensión del caso (por ejemplo, el rendimiento del código) pero arruinan el resto (por ejemplo, accesibilidad).',
      'Planes de acción que suenan sofisticados en jerga técnica pero que ignoran por completo los requerimientos primordiales definidos por el usuario/cliente.',
      'Generalizaciones vacías que no ofrecen un procedimiento ejecutable real ante el problema propuesto.'
    ],
    steps: [
      'Divide el caso en sus dimensiones clave: el componente ingenieril-técnico, el componente pedagógico-educativo y la capa legal/humana.',
      'Reconoce la meta suprema solicitada en el enunciado de la pregunta (¿qué balance se le pide priorizar al docente?).',
      'Evalúa si la opción elegida es sostenible y aplicable en un ecosistema real de educación superior o empresarial colombiano.',
      'Desestima alternativas que simplifiquen dilemas complejos de forma superficial o que caigan en contradicciones lógicas entre datos.'
    ],
    tips: 'Dedica los primeros segundos a perfilar los actores clave involucrados en el caso y su meta última. No te dejes abrumar por descripciones detalladas no esenciales.'
  }
};

export const SaberProQuestionGuide: React.FC<SaberProQuestionGuideProps> = ({ 
  difficulty, 
  isOpen, 
  onClose 
}) => {
  const guide = GUIDES[difficulty] || GUIDES.bajo;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
          >
            <div className="bg-brand-primary p-6 text-white relative shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      Guía de Análisis Saber Pro
                    </span>
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                    Nivel {guide.level}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Enfoque de Competencia</h4>
                <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                  <Info className="text-brand-primary shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">{guide.focus}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{guide.cognitiveTarget}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 font-mono">Arquitectura típica de la Pregunta</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{guide.structure}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 font-mono">¿Cómo analizar de forma sistemática?</h4>
                <div className="space-y-4">
                  {guide.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-2">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] font-mono">Patrón de Distractores (¡Alerta de Trampas!)</h4>
                <div className="space-y-2">
                  {guide.distractors.map((dist, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-rose-500 font-bold text-xs mt-0.5 shrink-0">•</span>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{dist}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl shrink-0">
                    <Sparkles size={16} className="text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 font-mono">Consejo Rector Universitario</h5>
                    <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                      "{guide.tips}"
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-950 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] shrink-0"
              >
                Entendido, Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
