import React, { useState } from 'react';
import { LogIn, BrainCircuit, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { UNI_LOGO_URL } from '../constants';

export const Login: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales inválidas. Por favor intenta de nuevo.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al intentar ingresar. Por favor intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={UNI_LOGO_URL} alt="UniCordoba Logo" className="h-20 w-auto object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              EduGenius <span className="text-[#00843D]">AI</span>
            </h1>
            <p className="text-slate-500 font-medium italic text-xs">Evaluación Basada en Evidencias</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <BrainCircuit size={18} className="text-emerald-700 shrink-0" />
          <p className="text-[10px] text-emerald-600 leading-tight font-bold uppercase tracking-widest">
            {isRegistering ? 'Crea tu cuenta docente' : 'Ingreso al portal académico'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-medium"
                placeholder="docente@unicordoba.edu.co"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-medium"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
            <span className="font-black uppercase tracking-widest text-[10px]">
              {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Entrar al Sistema')}
            </span>
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-[10px] font-black text-brand-primary hover:underline uppercase tracking-widest"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate aquí'}
          </button>
        </div>

        <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest pt-4 border-t border-slate-50">
          Licenciatura en Informática © 2026
        </p>
      </div>
    </div>
  );
};
