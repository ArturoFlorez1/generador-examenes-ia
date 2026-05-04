import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  X, 
  BrainCircuit, 
  Search, 
  LogOut, 
  GraduationCap
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ExamCreator } from './components/ExamCreator';
import { QuestionReview } from './components/QuestionReview';
import { ExamPlayer } from './components/ExamPlayer';
import { AIResources } from './components/AIResources';
import { generateExamQuestions } from './services/geminiService';
import { Exam, ExamParams } from './types';
import { UNI_LOGO_URL } from './constants';

export default function App() {
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [view, setView] = useState<'dashboard' | 'creator' | 'review' | 'player' | 'resources'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Partial<Exam> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Load from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('edugenius_exams');
    if (saved) {
      try {
        setExams(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading exams", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (exams.length > 0) {
      localStorage.setItem('edugenius_exams', JSON.stringify(exams));
    }
  }, [exams.length]);

  const handleGenerate = async (params: ExamParams) => {
    setIsGenerating(true);
    try {
      const questions = await generateExamQuestions(params);
      setCurrentExam({
        ...params,
        id: crypto.randomUUID(),
        title: `Examen: ${params.topic}`,
        questions,
        createdAt: new Date().toISOString()
      });
      setView('review');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExam = (exam: Exam) => {
    setExams(prev => [exam, ...prev]);
    setView('dashboard');
    setCurrentExam(null);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este examen?')) {
      setExams(prev => prev.filter(e => e.id !== id));
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
            
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => {setRole('teacher'); setView('dashboard')}}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'teacher' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`}
              >
                MODO DOCENTE
              </button>
              <button 
                onClick={() => {setRole('student'); setView('dashboard')}}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'student' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`}
              >
                MODO ESTUDIANTE
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <NavLink active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavLink>
            <NavLink active={view === 'resources'} onClick={() => setView('resources')}>Recursos AI</NavLink>
            <div className="w-px h-6 bg-slate-200" />
            <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-red-50">
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
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {role === 'student' && (
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
              exams={role === 'student' ? exams : exams} // In a real app filtering would happen here
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

        {view === 'resources' && (
          <AIResources />
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
              <li><a href="#" className="hover:text-brand-primary transition-colors">Facultad de Educación</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Portal Docente</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Normativa Académica</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Privacidad</a></li>
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
