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
    focus: 'Comprensión y Reconocimiento',
    steps: [
      'Identifica datos explícitos (nombres, fechas, cifras) dentro del contexto.',
      'Reconoce el sentido de palabras o frases según el entorno donde se usan.',
      'Ubica la idea principal y las ideas secundarias que la apoyan.',
      'Evita sobreinterpretar: la respuesta está escrita o se deduce directamente de lo leído.'
    ],
    tips: 'Busca sinónimos en las opciones que reflejen fielmente lo que dice el texto.'
  },
  medio: {
    level: 'Argumentativo',
    focus: 'Justificación y Relación',
    steps: [
      'Identifica la tesis o posición central que el autor o el caso defiende.',
      'Busca los "porqués": ¿Qué evidencia o razonamiento sustenta la respuesta?',
      'Relaciona diferentes partes del texto para encontrar coherencia lógica.',
      'Analiza la intención: ¿Para qué se incluyó cierta información o gráfico?'
    ],
    tips: 'La opción correcta suele ser la que explica mejor el vínculo entre premisa y conclusión.'
  },
  alto: {
    level: 'Propositivo',
    focus: 'Solución y Análisis Crítico',
    steps: [
      'Plantea hipótesis: ¿Qué sucedería si cambiamos una variable del caso?',
      'Propone soluciones: Elige la alternativa que resuelva el conflicto de forma técnica y ética.',
      'Infiere consecuencias: Evalúa el impacto a largo plazo de las decisiones presentadas.',
      'Sintetiza: Integra toda la información para generar un nuevo juicio o conclusión.'
    ],
    tips: 'No busques solo lo que dice el texto; busca qué se puede hacer con esa información.'
  },
  integral: {
    level: 'Integral',
    focus: 'Visión de Conjunto',
    steps: [
      'Esta pregunta requiere que combines múltiples niveles de pensamiento.',
      'Analiza primero lo literal, luego las causas y finalmente las soluciones.',
      'Es el nivel más cercano a la realidad profesional compleja.'
    ],
    tips: 'Lee con calma, estas preguntas suelen tener distractores muy elaborados.'
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
            className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="bg-brand-primary p-6 text-white relative">
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
                      Guía Cognitiva
                    </span>
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                    Nivel {guide.level}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Enfoque Principal</h4>
                <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                  <Info className="text-brand-primary shrink-0" size={20} />
                  <p className="text-sm font-bold text-slate-700 leading-tight">{guide.focus}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">¿Cómo responder?</h4>
                <div className="space-y-3">
                  {guide.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        {i + 1}
                      </div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Sparkles size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Consejo de Experto</h5>
                    <p className="text-[10px] font-bold text-slate-500 italic leading-snug">
                      "{guide.tips}"
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
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
