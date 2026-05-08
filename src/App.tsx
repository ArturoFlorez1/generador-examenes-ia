import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  X, 
  BrainCircuit, 
  Search, 
  LogOut, 
  GraduationCap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { ExamCreator } from './components/ExamCreator';
import { QuestionReview } from './components/QuestionReview';
import { ExamPlayer } from './components/ExamPlayer';
import { AIResources } from './components/AIResources';
import { AdminPanel } from './components/AdminPanel';
import { HelpCenter } from './components/HelpCenter';
import { Contact } from './components/Contact';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Login } from './components/Login';
import { generateExamQuestions } from './services/geminiService';
import { examsService } from './services/firestoreService';
import { useAuth } from './lib/AuthContext';
import { Exam, ExamParams } from './types';
import { UNI_LOGO_URL } from './constants';

export default function App() {
  const { user, profile, loading: authLoading, requestDocente, logout } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [view, setView] = useState<'dashboard' | 'creator' | 'review' | 'player' | 'resources' | 'admin' | 'help' | 'contact' | 'privacy'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Partial<Exam> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Load and Sync with Firestore
  useEffect(() => {
    if (!user) return;
    
    // Set initial role from profile
    if (profile?.role) {
      setRole(profile.role);
      // If admin, default to admin panel
      if (profile.role === 'admin') {
        setView('admin');
      }
    }

    const unsubscribe = examsService.subscribeToUserExams(user.uid, (data) => {
      setExams(data);
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={48} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleGenerate = async (params: ExamParams) => {
    setIsGenerating(true);
    try {
      const questions = await generateExamQuestions(params);
      setCurrentExam({
        ...params,
        id: crypto.randomUUID(),
        title: `Examen: ${params.topic}`,
        questions,
        createdAt: Date.now()
      });
      setView('review');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExam = async (exam: Exam) => {
    await examsService.save(exam);
    setView('dashboard');
    setCurrentExam(null);
  };

  const handleDeleteExam = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este examen?')) {
      await examsService.delete(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-3 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img 
                  src={UNI_LOGO_URL} 
                  alt="UniCordoba Logo" 
                  className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                  Universidad de <span className="text-[#00843D]">Córdoba</span>
                </h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Comprometidos con el desarrollo regional</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {role !== 'admin' && (
              <>
                <NavLink active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavLink>
                {role !== 'student' && (
                  <NavLink active={view === 'resources'} onClick={() => setView('resources')}>Recursos AI</NavLink>
                )}
              </>
            )}
            {role === 'admin' && (
              <NavLink active={view === 'admin'} onClick={() => setView('admin')}>Panel Admin</NavLink>
            )}
            <div className="w-px h-6 bg-slate-200" />
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsNavOpen(!isNavOpen)}>
            {isNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {view === 'dashboard' && role !== 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {role === 'student' && profile?.roleRequest !== 'pending' && profile?.roleRequest !== 'approved' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-primary text-white p-8 rounded-3xl shadow-xl shadow-brand-primary/20 flex flex-col md:flex-row items-center justify-between gap-8"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-5 rounded-2xl">
                    <GraduationCap size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">¿Eres docente de la facultad?</h3>
                    <p className="text-sm font-medium text-white/80">Solicita tu cambio de rol para empezar a diseñar instrumentos de evaluación con IA.</p>
                  </div>
                </div>
                <button 
                  onClick={() => requestDocente()}
                  className="bg-white text-brand-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shrink-0 shadow-lg"
                >
                  Solicitar Rol Docente
                </button>
              </motion.div>
            )}

            {profile?.roleRequest === 'pending' && role === 'student' && (
              <div className="bg-white border-2 border-amber-100 p-8 rounded-3xl flex items-center justify-between text-amber-800 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="bg-amber-100 p-4 rounded-2xl">
                    <Loader2 className="animate-spin text-amber-600" size={28} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-xs mb-1">Solicitud en Proceso</h3>
                    <p className="text-sm font-medium">Tu solicitud para el rol de <span className="font-black">DOCENTE</span> está siendo revisada por la coordinación.</p>
                  </div>
                </div>
              </div>
            )}

            {role === 'student' && profile?.roleRequest !== 'pending' && (
              <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-primary text-white p-3 rounded-2xl ring-4 ring-brand-primary/10">
                    <Search size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Bienvenido al Portal de Estudiantes</h2>
                    <p className="text-slate-600 text-sm font-medium">Explora los exámenes activos y pon a prueba tus conocimientos.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-primary bg-white px-3 py-1.5 rounded-full border border-brand-primary/20 shadow-sm uppercase tracking-widest">
                  <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                  Sincronizado con Docente
                </div>
              </div>
            )}
            
            <Dashboard 
              exams={exams}
              role={role}
              onCreateNew={() => setView('creator')} 
              onViewExam={(exam) => {
                setCurrentExam(exam);
                setView('player');
              }}
              onDeleteExam={handleDeleteExam}
            />
          </div>
        )}

        {view === 'admin' && role === 'admin' && (
          <AdminPanel />
        )}

        {view === 'creator' && (
          <ExamCreator 
            onBack={() => setView('dashboard')} 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {view === 'review' && currentExam && (
          <QuestionReview 
            exam={currentExam as Exam} 
            onSave={handleSaveExam}
            onCancel={() => setView('dashboard')}
          />
        )}

        {view === 'player' && currentExam && (
          <ExamPlayer 
            exam={currentExam as Exam}
            mode={role}
            onClose={() => {
              setView('dashboard');
              setCurrentExam(null);
            }}
          />
        )}

        {view === 'resources' && role !== 'admin' && (
          <AIResources />
        )}

        {view === 'help' && (
          <HelpCenter onBack={() => setView('dashboard')} />
        )}

        {view === 'contact' && (
          <Contact onBack={() => setView('dashboard')} />
        )}

        {view === 'privacy' && (
          <PrivacyPolicy onBack={() => setView('dashboard')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4 col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                <BrainCircuit size={18} />
              </div>
              <span className="text-xl font-bold text-slate-900">EduGenius AI</span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              Potenciando la educación superior con inteligencia artificial basada en evidencias. 
              Desarrollado para la Licenciatura en Informática, Universidad de Córdoba.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Universidad</h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li><a href="https://unicordoba.edu.co/facultad-de-educacion-y-ciencias-humanas/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">Facultad de Educación</a></li>
              <li><a href="https://unicordoba.edu.co/reglamentos/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">Normatividad</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li><button onClick={() => setView('help')} className="hover:text-brand-primary transition-colors text-left">Centro de Ayuda</button></li>
              <li><button onClick={() => setView('contact')} className="hover:text-brand-primary transition-colors text-left">Contacto</button></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-brand-primary transition-colors text-left">Privacidad</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400 font-medium">© 2026 Universidad de Córdoba, Colombia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

const NavLink: React.FC<{ children: React.ReactNode, active?: boolean, onClick?: () => void }> = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`text-sm font-bold uppercase tracking-widest transition-all ${
      active ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);
