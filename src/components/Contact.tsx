import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  MapPin, 
  Phone,
  Clock,
  User,
  AtSign,
  Loader2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

interface ContactProps {
  onBack: () => void;
}

export const Contact: React.FC<ContactProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: profile?.email?.split('@')[0] || '',
    email: profile?.email || '',
    userRole: (profile?.role as string) || 'estudiante',
    subject: 'Soporte Técnico',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      await addDoc(collection(db, 'support_messages'), {
        ...formData,
        userId: profile?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        status: 'unread'
      });
      setStatus('success');
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto text-brand-primary">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">¡Mensaje enviado con éxito!</h2>
          <p className="text-slate-500 font-medium text-lg">Hemos recibido tu solicitud. Tu mensaje ha sido enviado directamente al Panel de Administración.</p>
        </div>
        <button 
          onClick={onBack}
          className="btn-primary px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-brand-primary transition-all shadow-sm group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Ponte en <span className="text-brand-primary">contacto</span>
          </h1>
          <p className="text-slate-500 font-medium">¿Tienes alguna duda o sugerencia? Tu mensaje llegará directamente al administrador.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <h3 className="text-xl font-black text-slate-900 relative z-10">Información de contacto</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="flex gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <Mail size={24} />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Correo Directo</p>
                  <a 
                    href="mailto:aflorezcausil@correo.unicordoba.edu.co" 
                    className="font-bold text-sm text-slate-700 hover:text-brand-primary transition-colors break-all"
                  >
                    aflorezcausil@correo.unicordoba.edu.co
                  </a>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Ubicación</p>
                  <p className="font-bold text-sm text-slate-700">Universidad de Córdoba, Montería.</p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <Clock size={24} />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Horario de Atención</p>
                  <div className="space-y-0.5 text-slate-700">
                    <p className="font-bold text-sm">7:00 AM - 12:00 PM</p>
                    <p className="font-bold text-sm">2:00 PM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-4 relative z-10">
              <p className="text-xs font-medium text-slate-400 italic">"Conectando la educación superior con la tecnología de vanguardia."</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="card p-8 md:p-12 space-y-6 shadow-xl shadow-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <User size={12} /> Nombre o Usuario
                </label>
                <input 
                  required
                  type="text" 
                  placeholder="Ej. Arturo Florez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Users size={12} /> Soy...
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700 appearance-none"
                  value={formData.userRole}
                  onChange={e => setFormData({...formData, userRole: e.target.value})}
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <AtSign size={12} /> Correo Electrónico
              </label>
              <input 
                required
                type="email" 
                placeholder="usuario@correo.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <MessageSquare size={12} /> Mensaje
              </label>
              <textarea 
                required
                rows={4}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700 resize-none"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
            </div>

            {status === 'error' && (
              <p className="text-xs font-bold text-rose-500 text-center">Hubo un error al enviar el mensaje. Inténtalo de nuevo.</p>
            )}

            <button 
              type="submit"
              disabled={status === 'sending'}
              className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/30 group disabled:grayscale disabled:opacity-50"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={24} />
                  Enviar al Administrador
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
