import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  FileText, 
  BookOpen, 
  Save, 
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile as UserProfileType } from '../types';

interface UserProfileProps {
  profile: UserProfileType;
  examsCount: number;
  coursesCount: number;
  onUpdate: (data: Partial<UserProfileType>) => Promise<void>;
  onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  profile, 
  examsCount, 
  coursesCount, 
  onUpdate, 
  onBack 
}) => {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdate({ fullName });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 hover:bg-slate-100 rounded-3xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Mi Cuenta</h2>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Perfil de Usuario</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar / Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-brand-primary/5 rounded-full" />
              <div className="w-24 h-24 bg-brand-primary/10 rounded-full relative z-10 border-4 border-white shadow-sm flex items-center justify-center mx-auto mt-4">
                <User size={48} className="text-brand-primary" />
              </div>
              <button className="absolute bottom-0 right-4 p-2 bg-slate-900 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                <Camera size={14} />
              </button>
            </div>
            
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{profile.fullName || 'Usuario'}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{profile.role}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900">{examsCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exámenes</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900">{coursesCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cursos</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado de Cuenta</p>
              <p className="text-sm font-black uppercase tracking-tight">Verificada</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <User className="text-brand-primary" size={24} /> Información Personal
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Arturo José Florez Causil"
                    className="w-full bg-slate-50 border-2 border-slate-50 p-5 pl-14 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-brand-primary/20 transition-all outline-none"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="email"
                    disabled
                    className="w-full bg-slate-100 border-2 border-slate-100 p-5 pl-14 rounded-3xl text-sm font-bold text-slate-400 cursor-not-allowed italic"
                    value={profile.email}
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium ml-4 mt-2 italic flex items-center gap-1">
                  <AlertCircle size={10} /> El correo electrónico no puede ser modificado por seguridad.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rol en la Plataforma</label>
                <div className="relative">
                  <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text"
                    disabled
                    className="w-full bg-slate-100 border-2 border-slate-100 p-5 pl-14 rounded-3xl text-sm font-bold text-slate-400 cursor-not-allowed uppercase tracking-wider"
                    value={profile.role}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
              {showSuccess && (
                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
                  <CheckCircle2 size={18} />
                  ¡Perfil Actualizado!
                </div>
              )}
              <div className="flex-1" />
              <button 
                type="submit"
                disabled={isUpdating || fullName === profile.fullName}
                className="w-full md:w-auto bg-brand-primary text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tips Card */}
          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex items-start gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm flex-shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-tight">Privacidad y Seguridad</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                Tu información se utiliza exclusivamente para la generación de instrumentos 
                de evaluación y certificados dentro del semillero AVI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
