import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  BookOpen,
  Calendar,
  XCircle,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../types';

interface EnrollmentManagerProps {
  enrolledCourses: Course[];
  onEnroll: (code: string) => Promise<void>;
  onSelectCourse: (id: string) => void;
}

export const EnrollmentManager: React.FC<EnrollmentManagerProps> = ({ enrolledCourses, onEnroll, onSelectCourse }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 4) return;
    
    setStatus('loading');
    setErrorMsg('');
    try {
      await onEnroll(code);
      setStatus('success');
      setCode('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Error al inscribirse');
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Inscribirse en una <span className="text-brand-primary">clase</span></h2>
              <p className="text-slate-500 font-medium">Ingresa el código proporcionado por tu docente para acceder a los exámenes.</p>
            </div>
            <div className="w-20 h-20 bg-brand-primary/10 rounded-[32px] flex items-center justify-center text-brand-primary shrink-0">
              <Hash size={40} />
            </div>
          </div>

          <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 pointer-events-none">
                <Hash size={20} />
              </div>
              <input 
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC-123"
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-6 pl-14 pr-8 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-xl font-black tracking-widest text-slate-700 uppercase"
              />
            </div>
            <button 
              type="submit"
              disabled={status === 'loading' || code.length < 4}
              className="bg-brand-primary text-white px-10 py-6 rounded-3xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Inscribirse ahora
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold"
              >
                <CheckCircle2 size={24} />
                ¡Inscripción exitosa! Ahora puedes ver los exámenes de este curso.
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold"
              >
                <XCircle size={24} />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="text-brand-primary" size={24} /> Mis Cursos Inscritos
          </h3>
          <p className="text-slate-400 text-sm font-medium">Clases en las que participas actualmente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <motion.div 
              layout
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-lg shadow-slate-200/20 space-y-4 hover:border-brand-primary/20 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
                <BookOpen size={28} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xl leading-tight uppercase tracking-tight">{course.name}</h4>
                <p className="text-slate-400 text-sm font-medium mt-1 line-clamp-2">{course.description}</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <div className="text-center bg-slate-50 px-3 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Código</p>
                  <p className="text-xs font-bold text-slate-700 font-mono tracking-tighter">{course.code}</p>
                </div>
                <div className="text-center bg-slate-50 px-3 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Inscrito el</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {enrolledCourses.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[40px] text-center">
              <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-semibold italic">Aún no te has inscrito en ningún curso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
