import React from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  BrainCircuit, 
  CheckCircle2, 
  HelpCircle,
  Settings,
  ShieldCheck,
  Zap,
  BarChartHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';

interface HelpCenterProps {
  onBack: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onBack }) => {
  const sections = [
    {
      title: 'Guía de Inicio',
      icon: Zap,
      items: [
        { q: '¿Cómo generar un examen?', a: 'Para generar un examen, haz clic en "Nuevo Instrumento" en tu dashboard. Elige el tema, el curso, el semestre y el nivel de dificultad. Luego, define la distribución de preguntas y haz clic en "Generar Instrumento".' },
        { q: '¿Cómo seleccionar la dificultad?', a: 'Ofrecemos tres niveles: Bajo (preguntas de conocimiento y comprensión), Medio (aplicación y análisis) y Alto (síntesis y evaluación), basados en la Taxonomía de Bloom.' },
        { q: '¿Cómo elegir la cantidad de preguntas?', a: 'Puedes generar desde 1 hasta 50 preguntas. Te recomendamos un rango de 10-20 para exámenes parciales y 5-10 para talleres rápidos.' }
      ]
    },
    {
      title: 'Sobre la Inteligencia Artificial',
      icon: BrainCircuit,
      items: [
        { q: '¿Qué modelo de IA se utiliza?', a: 'Utilizamos Google Gemini Pro, un modelo de lenguaje avanzado optimizado para el contexto educativo de la Universidad de Córdoba.' },
        { q: '¿Las preguntas son siempre las mismas?', a: 'No, cada generación es única. La IA analiza el contexto del curso y el tema para crear ítems originales adaptados a tus necesidades.' }
      ]
    },
    {
      title: 'Formatos de Evaluación',
      icon: BarChartHorizontal,
      items: [
        { q: 'Opción Múltiple', a: 'Ítems clásicos con una respuesta correcta y tres distractores plausibles.' },
        { q: 'Estudio de Caso', a: 'Situaciones de la vida real en el ámbito de la informática para análisis profundo.' },
        { q: 'Falso o Verdadero', a: 'Ideal para verificar conceptos rápidos y fundamentales.' }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-brand-primary transition-all shadow-sm group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Centro de <span className="text-brand-primary">ayuda</span>
          </h1>
          <p className="text-slate-500 font-medium">Todo lo que necesitas saber para dominar EvaluAI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-brand-primary text-white p-8 rounded-[32px] shadow-xl shadow-brand-primary/20 space-y-4">
            <HelpCircle size={40} className="opacity-50" />
            <h3 className="text-xl font-bold leading-tight">¿No encuentras lo que buscas?</h3>
            <p className="text-white/80 text-sm">Nuestro equipo de soporte está listo para ayudarte con cualquier duda técnica.</p>
          </div>
          
          <div className="bg-slate-900 text-white p-8 rounded-[32px] space-y-4">
            <ShieldCheck size={32} className="text-emerald-400" />
            <h4 className="font-bold text-sm uppercase tracking-widest">Seguridad</h4>
            <p className="text-white/60 text-xs leading-relaxed">Tus datos y exámenes están protegidos bajo protocolos de encriptación de grado académico.</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-brand-primary">
                  <section.icon size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900">{section.title}</h3>
              </div>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <details key={i} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-bold text-slate-700 pr-4">{item.q}</span>
                      <div className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 group-open:rotate-180 transition-transform">
                        <ArrowLeft size={12} className="-rotate-90" />
                      </div>
                    </summary>
                    <div className="px-5 pb-5 pt-2">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
