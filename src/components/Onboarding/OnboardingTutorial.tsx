import React, { useState } from 'react';
import { 
  Rocket, 
  User, 
  GraduationCap, 
  Briefcase, 
  Key, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';

export const OnboardingTutorial: React.FC = () => {
  const { profile, updateProfile, requestDocente } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [wantsToBeTeacher, setWantsToBeTeacher] = useState(false);
  const [apiKey, setApiKey] = useState('');

  if (!profile || profile.onboardingCompleted !== false) return null;

  const totalSteps = wantsToBeTeacher ? 5 : 3;

  const nextStep = () => setStep(s => s + 1);

  const handleFinish = async () => {
    const updates: any = {
      onboardingCompleted: true,
      fullName: fullName || profile.fullName || 'Usuario EvaluAI'
    };
    
    if (wantsToBeTeacher && apiKey) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }
    
    await updateProfile(updates);
    if (wantsToBeTeacher) {
      await requestDocente();
    }
  };

  const steps = [
    {
      id: 1,
      title: '¡Bienvenido a EvaluAI!',
      icon: <Rocket className="text-brand-primary" size={48} />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 font-medium leading-relaxed">
            EvaluAI es la plataforma líder de la Universidad de Córdoba para la gestión académica impulsada por Inteligencia Artificial.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Sparkles className="text-amber-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Generación Inteligente</p>
                <p className="text-[10px] text-slate-500 font-bold">Crea exámenes complejos en segundos usando los modelos Gemini Pro.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Evaluación Segura</p>
                <p className="text-[10px] text-slate-500 font-bold">Registro detallado de intentos y resultados para docentes y estudiantes.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Identifícate en el Sistema',
      icon: <User className="text-brand-primary" size={48} />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 font-medium leading-relaxed text-sm">
            Para que tus registros académicos sean válidos, necesitamos conocer tu nombre completo.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input 
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Perez"
              className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all font-bold text-slate-700 outline-none"
            />
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Elige tu Perfil Académico',
      icon: <GraduationCap className="text-brand-primary" size={48} />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 font-medium leading-relaxed text-sm">
            Dependiendo de tu rol, tendrás acceso a diferentes herramientas.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setWantsToBeTeacher(false)}
              className={`p-6 rounded-[32px] border transition-all text-left flex items-start gap-5 ${
                !wantsToBeTeacher ? 'bg-brand-primary/5 border-brand-primary shadow-xl shadow-brand-primary/10' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`p-4 rounded-2xl ${!wantsToBeTeacher ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <GraduationCap size={24} />
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-tight ${!wantsToBeTeacher ? 'text-brand-primary' : 'text-slate-900'}`}>Estudiante</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Inscríbete en cursos, presenta exámenes y revisa tus calificaciones.</p>
              </div>
            </button>
            <button
              onClick={() => setWantsToBeTeacher(true)}
              className={`p-6 rounded-[32px] border transition-all text-left flex items-start gap-5 ${
                wantsToBeTeacher ? 'bg-brand-primary/5 border-brand-primary shadow-xl shadow-brand-primary/10' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`p-4 rounded-2xl ${wantsToBeTeacher ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Briefcase size={24} />
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-tight ${wantsToBeTeacher ? 'text-brand-primary' : 'text-slate-900'}`}>Docente</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Crea cursos, genera exámenes con IA y supervisa el progreso de tus grupos.</p>
              </div>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Acceso para Docentes',
      icon: <ShieldCheck className="text-brand-primary" size={48} />,
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-[32px] space-y-3">
             <p className="text-slate-700 text-sm font-medium leading-relaxed">
              El rol de docente requiere una verificación manual. Al finalizar este tutorial, se enviará una solicitud al administrador.
            </p>
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
              El proceso suele tardar menos de 24 horas.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <CheckCircle2 className="text-amber-600 shrink-0" size={18} />
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Mientras esperas, puedes explorar el sistema como estudiante.</p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Tu Propia Inteligencia Artificial',
      icon: <Key className="text-brand-primary" size={48} />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 font-medium leading-relaxed text-sm">
            Como docente, EvaluAI utiliza tu propia llave de Google AI Studio para generar contenido, dándote control total.
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gemini API Key (Opcional por ahora)</label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API Key here..."
                className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all font-mono text-xs outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold text-center italic">Puedes configurar esto luego en tu perfil.</p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps.find(s => s.id === step);
  const isLast = step === totalSteps;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-slate-50 w-full flex">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i}
              className={`flex-1 transition-all duration-500 ${i + 1 <= step ? 'bg-brand-primary' : 'bg-slate-100'}`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-brand-primary/5 rounded-[28px] flex items-center justify-center mb-2">
                  {currentStepData?.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Paso {step} de {totalSteps}</span>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    {currentStepData?.title}
                  </h2>
                </div>
              </div>

              <div className="pt-2">
                {currentStepData?.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            Anterior
          </button>

          <button
            onClick={isLast ? handleFinish : nextStep}
            disabled={step === 2 && !fullName}
            className="group btn-primary px-8 py-5 flex items-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
          >
            <span className="font-black text-[10px] uppercase tracking-widest">
              {isLast ? 'Comenzar Ahora' : 'Continuar'}
            </span>
            {isLast ? (
              <CheckCircle2 size={18} />
            ) : (
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
