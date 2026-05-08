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
      name: "Juan Carlos Giraldo Cardozo",
      role: "Docente & Director de Proyecto",
      icon: <GraduationCap size={48} className="text-brand-primary" />
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 hover:bg-slate-100 rounded-3xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Institucional</h2>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Acerca de nosotros</h1>
        </div>
      </div>

      {/* Mission & Purpose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <Target size={14} /> Nuestro Propósito
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Transformando la evaluación con <span className="text-brand-primary italic">Inteligencia Artificial</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            EduGeniusAI nace como una iniciativa de innovación educativa dentro de la <b>Universidad de Córdoba</b>. 
            Nuestro programa busca optimizar los procesos de creación de instrumentos de evaluación 
            mediante el uso de IA generativa, permitiendo a los docentes centrarse en lo que realmente importa: 
            el aprendizaje de sus estudiantes.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm mb-4">
                <Lightbulb size={24} />
              </div>
              <h4 className="font-black text-slate-900 text-sm uppercase mb-1">Innovación</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tecnología de Vanguardia</p>
            </div>
            <div className="p-6 bg-brand-primary rounded-[32px] text-white">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-sm mb-4">
                <GraduationCap size={24} />
              </div>
              <h4 className="font-black text-white text-sm uppercase mb-1">Calidad</h4>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Excelencia Académica</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-square bg-slate-100 rounded-[60px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
              alt="Team Work" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute bottom-8 left-8 right-8 z-20">
              <div className="glass p-6 rounded-[32px] border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg">
                    AVI
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-sm">Semillero AVI</h4>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Investigación & Desarrollo</p>
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
            <Users size={14} /> El Equipo
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
