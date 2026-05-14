import React from 'react';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  Rocket, 
  Code2, 
  GraduationCap,
  Lightbulb,
  Github,
  Globe,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';

interface AboutUsProps {
  onBack: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
  const creators = [
    {
      name: "Bastian Nicolas Berastegui Barrera",
      role: "Desarrollador & Investigador",
      icon: <Users size={48} className="text-brand-primary" />
    },
    {
      name: "Arturo José Florez Causil",
      role: "Desarrollador & Investigador",
      icon: <Code2 size={48} className="text-brand-primary" />
    },
    {
      name: "Juan Carlos Giraldo Cardozo & Glenis Alvarez Quiroz",
      role: "Docentes & Directores de Proyecto",
      icon: <GraduationCap size={48} className="text-brand-primary" />
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-4 hover:bg-slate-100 rounded-3xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Universidad de Córdoba</h2>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Acerca de nosotros</h1>
          </div>
        </div>
      </div>

      {/* Mission & Purpose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <Target size={14} /> Investigación & Innovación
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Transformando la evaluación con <span className="text-brand-primary italic">Inteligencia Artificial</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            La evaluación en la Educación Superior es un pilar fundamental para medir el aprendizaje, pero su diseño 
            tradicional suele ser subjetivo, consumiendo tiempo valioso docente y dificultando la alineación 
            con objetivos académicos. EvaluAI surge como un potente agente inteligente desarrollado en la <b>Licenciatura en Informática</b> 
            de la <b>Universidad de Córdoba</b> para transformar este paradigma.
          </p>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Utilizamos inteligencia artificial generativa aplicada a la evaluación basada en evidencias. Nuestro propósito 
            no es reemplazar al docente, sino potenciar sus capacidades metodológicas, reduciendo sesgos involuntarios 
            y permitiendo una creación de exámenes variada, equilibrada y pedagógicamente rigurosa.
          </p>
          
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 italic font-medium text-slate-600 text-sm flex items-center">
              "Buscamos la excelencia académica mediante la innovación tecnológica."
            </div>
            <div className="p-6 bg-brand-primary rounded-[32px] text-white flex flex-col items-center justify-center font-black gap-2 shadow-lg shadow-brand-primary/20">
              <span className="text-3xl">EvaluAI</span>
              <span className="text-xs uppercase tracking-widest opacity-80">@ Semillero AVI</span>
            </div>
          </div>
        </div>

        {/* Right side Image */}
        <div className="relative lg:sticky lg:top-8">
          <div className="aspect-[4/5] rounded-[60px] overflow-hidden relative group shadow-2xl bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200" 
              alt="Educación colaborativa y tecnología" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />

            <div className="absolute bottom-8 left-8 right-8 z-20">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[32px] border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-primary font-black italic shadow-lg shadow-black/20">
                    AVI
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-sm tracking-wide">Semillero AVI</h4>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Ambientes Virtuales Interactivos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <Users size={14} /> Liderazgo & Desarrollo
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mentes detrás del Proyecto</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {creators.map((creator, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm text-center space-y-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="w-24 h-24 bg-white rounded-full relative z-10 border-4 border-slate-50 shadow-sm flex items-center justify-center">
                  {creator.icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{creator.name}</h3>
                <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mt-2">{creator.role}</p>
                <p className="text-slate-400 text-xs mt-3 px-4 font-medium leading-relaxed">
                  {i === 2 ? "Liderazgo en fundamentación pedagógica y metodología investigativa." : "Desarrollo técnico, arquitectura de agentes y optimización del prompt engine."}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-brand-primary hover:text-white transition-all">
                  <Mail size={18} />
                </button>
                <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-brand-primary hover:text-white transition-all">
                  <Github size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <div className="bg-slate-900 rounded-[60px] p-12 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 bg-brand-primary/20 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-6 ring-4 ring-brand-primary/10">
            <Rocket size={32} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight italic">Universidad de Córdoba</h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto uppercase tracking-widest text-[10px]">
            Licenciatura en Informática • Facultad de Educación y Ciencias Humanas
            <br />
            Semillero de Investigación AVI • 2026
          </p>
        </div>
      </div>
    </div>
  );
};
