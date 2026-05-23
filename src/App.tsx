import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  X, 
  BrainCircuit, 
  Search, 
  LogOut, 
  GraduationCap,
  Loader2,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { ExamCreator } from './components/ExamCreator';
import { QuestionReview } from './components/QuestionReview';
import { ExamPlayer } from './components/ExamPlayer';
import { AIResources } from './components/AIResources';
import { AdminPanel } from './components/AdminPanel';
import { HelpCenter } from './components/HelpCenter';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AboutUs } from './components/AboutUs';
import { UserProfile } from './components/UserProfile';
import { Login } from './components/Login';
import { FloatingContact } from './components/FloatingContact';
import { OnboardingTutorial } from './components/Onboarding/OnboardingTutorial';
import { generateExamQuestions } from './services/geminiService';
import { examsService, coursesService, chatService, usersService } from './services/firestoreService';
import { useAuth } from './lib/AuthContext';
import { Exam, ExamParams, Course } from './types';

// Helper to resolve teacher names dynamically
async function resolveExamsTeacherNames(data: Exam[]): Promise<Exam[]> {
  const resolved = [...data];
  for (let i = 0; i < resolved.length; i++) {
    const ex = resolved[i];
    if ((!ex.teacherName || ex.teacherName === 'Docente') && ex.creatorId) {
      try {
        const ud = await usersService.getUser(ex.creatorId);
        if (ud) {
          const resolvedName = ud.fullName || ud.displayName || ud.email?.split('@')[0] || 'Docente';
          if (resolvedName !== 'Docente') {
            ex.teacherName = resolvedName;
          }
        }
      } catch (e) {
        console.warn("Could not dynamically resolve teacherName:", e);
      }
    }
  }
  return resolved;
}

export default function App() {
  const { user, profile, loading: authLoading, requestDocente, updateProfile, logout } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [view, setView] = useState<'dashboard' | 'creator' | 'review' | 'player' | 'resources' | 'admin' | 'help' | 'about' | 'privacy' | 'profile'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [currentExam, setCurrentExam] = useState<Partial<Exam> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showRoleRequest, setShowRoleRequest] = useState(() => {
    const hidden = localStorage.getItem('hide_role_request');
    return !hidden;
  });
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);
  const [hasDismissedApiKeyAlert, setHasDismissedApiKeyAlert] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedCourseForExam, setSelectedCourseForExam] = useState<string | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const isAdmin = profile.role === 'admin' || profile.email === 'florezarturo1816@gmail.com';
    const unsub = chatService.subscribeToUserConversations(profile.uid, isAdmin, (convs) => {
        const myUnreadId = isAdmin ? 'admin' : profile.uid;
        const anyActive = convs.some(c => c.unreadFor?.includes(myUnreadId));
        setHasUnreadMessages(anyActive);
    });
    return () => unsub();
  }, [profile?.uid, profile?.role, profile?.email]);

  useEffect(() => {
    if (user && profile?.role === 'teacher' && !hasDismissedApiKeyAlert) {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        setShowApiKeyAlert(true);
      }
    }
  }, [user, profile, hasDismissedApiKeyAlert]);

  // Load and Sync with Firestore
  useEffect(() => {
    if (!user || !profile) {
      setExams([]);
      setCourses([]);
      setEnrolledCourses([]);
      return;
    }
    
    // Set role from profile
    setRole(profile.role || 'student');
    
    const unsubscribers: (() => void)[] = [];

    if (profile?.role === 'teacher' || profile?.role === 'admin') {
      unsubscribers.push(
        examsService.subscribeToExams(async (data) => {
          const resolved = await resolveExamsTeacherNames(data);
          setExams(resolved);
        }, profile.role === 'teacher' ? user.uid : undefined)
      );
      unsubscribers.push(
        coursesService.subscribeToTeacherCourses(user.uid, (data) => {
          setCourses(data);
          
          // Silently backfill creatorName for courses that are missing it or have placeholder 'Docente'
          const currentName = profile?.fullName || user?.displayName || 'Docente';
          data.forEach(course => {
            if ((!course.creatorName || course.creatorName === 'Docente') && course.creatorId === user.uid && currentName !== 'Docente') {
              coursesService.updateCreatorName(course.id, currentName)
                .catch(err => console.warn("Could not backfill course creatorName:", err));
            }
          });
        })
      );
    } else if (profile?.role === 'student' || !profile?.role) {
      // Student role or default
      let innerExamUnsubscribe: (() => void) | null = null;
      
      unsubscribers.push(
        coursesService.subscribeToStudentEnrollments(user.uid, (courseIds) => {
          // Wrap async logic to avoid unhandled rejections in onSnapshot callback
          const syncStudentData = async () => {
            try {
              const fullCourses = await coursesService.getCoursesByIds(courseIds);
              setEnrolledCourses(fullCourses);
              
              // Clear previous nested subscription if any
              if (innerExamUnsubscribe) {
                innerExamUnsubscribe();
                innerExamUnsubscribe = null;
              }
              
              if (courseIds.length > 0) {
                // Subscribe to exams for these courses
                innerExamUnsubscribe = examsService.subscribeToEnrolledExams(courseIds, async (data) => {
                  const resolved = await resolveExamsTeacherNames(data);
                  setExams(resolved);
                });
              } else {
                setExams([]);
              }
            } catch (err) {
              console.error("Critical error syncing student courses/exams:", err);
              setGlobalError("No pudimos cargar tus cursos o exámenes. Esto podría ser un problema de permisos o de red.");
              setExams([]);
              setEnrolledCourses([]);
            }
          };
          
          syncStudentData();
        })
      );

      // Final cleanup for the inner one
      unsubscribers.push(() => {
        if (innerExamUnsubscribe) innerExamUnsubscribe();
      });
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, profile]);

  const handleUpdateName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    if (fullName.trim()) {
      await updateProfile({ fullName: fullName.trim() });
      setView('dashboard');
    }
  };

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
      const apiKey = localStorage.getItem('gemini_api_key') || undefined;
      const questions = await generateExamQuestions(params, apiKey);
      setCurrentExam({
        ...params,
        id: crypto.randomUUID(),
        title: `Examen: ${params.topic}`,
        questions,
        createdAt: Date.now(),
        teacherName: profile?.fullName || user?.displayName || undefined
      });
      setView('review');
      setSelectedCourseForExam(null); // Clear after generation
    } catch (error) {
      if (error instanceof Error && error.message === 'API_KEY_MISSING') {
        setShowApiKeyAlert(true);
      } else {
        alert(error instanceof Error ? error.message : 'Error desconocido');
      }
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
    if (!confirm('¿Estás seguro de que deseas eliminar este examen?')) return;
    try {
      await examsService.delete(id);
    } catch (err) {
      console.error("Error deleting exam:", err);
      alert("Error al eliminar el examen");
    }
  };

  const handleCreateCourse = async (name: string, description: string) => {
    const creatorName = profile?.fullName || user?.displayName || 'Docente';
    await coursesService.create(name, description, creatorName);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso? Se perderán todas las inscripciones asociadas.')) return;
    try {
      await coursesService.delete(id);
    } catch (err) {
      console.error("Error deleting course:", err);
      alert("Error al eliminar el curso: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEnroll = async (code: string) => {
    try {
      await coursesService.enroll(code, profile?.fullName || user?.displayName || undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al inscribirse');
    }
  };

  const handleCreateNewExam = (courseId?: string) => {
    if (courseId) {
      setSelectedCourseForExam(courseId);
    }
    setView('creator');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-3 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                  Evalu<span className="text-[#00843D]">AI</span>
                </h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Gestión Académica e IA Educativa</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {role !== 'admin' && (
              <>
                <NavLink active={view === 'dashboard'} onClick={() => setView('dashboard')}>Inicio</NavLink>
                {role !== 'student' && (
                  <NavLink active={view === 'resources'} onClick={() => setView('resources')}>Herramientas IA</NavLink>
                )}
              </>
            )}
            {role === 'admin' && (
              <div className="relative">
                <NavLink active={view === 'admin'} onClick={() => setView('admin')}>Administración</NavLink>
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </div>
            )}
            
            <div className="w-px h-6 bg-slate-200" />
            
            <button 
              onClick={() => setView('profile')}
              className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all border relative ${
                view === 'profile' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'border-slate-100 hover:border-brand-primary/20 hover:bg-slate-50 text-slate-600'
              }`}
              title="Mi Perfil"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <User size={20} className="text-brand-primary" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Mi Perfil</p>
                <p className="text-[11px] font-bold truncate max-w-[120px] mt-1">{profile?.fullName || 'Configurar'}</p>
              </div>
            </button>

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
      {/* Onboarding Tutorial for new users */}
      {!authLoading && profile && profile.onboardingCompleted === false && (
        <OnboardingTutorial />
      )}

      {/* API Key Prompt for Teachers */}
        {showApiKeyAlert && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <BrainCircuit size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Configure su API Key</h2>
              <p className="text-slate-600 mb-6 font-medium">
                Para utilizar las herramientas de IA, necesitas configurar tu API Key de Gemini. 
                Puedes hacerlo en cualquier momento desde tu <span className="font-bold underline cursor-pointer" onClick={() => { setShowApiKeyAlert(false); setView('profile'); }}>Perfil</span>.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                <p className="text-xs text-slate-500 mb-2">Obtén tu API Key aquí:</p>
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-brand-primary font-bold text-sm underline"
                >
                  Google AI Studio - Obtener API Key
                </a>
              </div>

              <button 
                onClick={() => {
                  setShowApiKeyAlert(false);
                  setHasDismissedApiKeyAlert(true);
                }}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}

        {globalError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between">
            <p className="text-sm font-medium">{globalError}</p>
            <button onClick={() => setGlobalError(null)} className="p-1 hover:bg-red-100 rounded-full">
              <X size={16} />
            </button>
          </div>
        )}
        {view === 'dashboard' && role !== 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {role === 'student' && showRoleRequest && profile?.roleRequest !== 'pending' && profile?.roleRequest !== 'approved' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-brand-primary text-white p-8 rounded-3xl shadow-xl shadow-brand-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
              >
                <button 
                  onClick={() => {
                    setShowRoleRequest(false);
                    localStorage.setItem('hide_role_request', 'true');
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Ocultar permanentemente"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-5 rounded-2xl">
                    <GraduationCap size={40} />
                  </div>
                  <div className="pr-8">
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
              courses={courses}
              enrolledCourses={enrolledCourses}
              onCreateNew={handleCreateNewExam} 
              onViewExam={(exam) => {
                setCurrentExam(exam);
                setView('player');
              }}
              onDeleteExam={handleDeleteExam}
              onCreateCourse={handleCreateCourse}
              onDeleteCourse={handleDeleteCourse}
              onEnroll={handleEnroll}
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
            courses={courses}
            initialCourseId={selectedCourseForExam || undefined}
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

        {view === 'privacy' && (
          <PrivacyPolicy onBack={() => setView('dashboard')} />
        )}

        {view === 'about' && (
          <AboutUs onBack={() => setView('dashboard')} />
        )}

        {view === 'profile' && profile && (
          <UserProfile 
            profile={profile}
            examsCount={exams.length}
            coursesCount={role === 'student' ? enrolledCourses.length : courses.length}
            onUpdate={updateProfile}
            onBack={() => setView('dashboard')}
          />
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
              <span className="text-xl font-bold text-slate-900">EvaluAI</span>
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
              <li><button onClick={() => setView('help')} className="hover:text-brand-primary transition-colors text-left font-medium">Centro de Ayuda</button></li>
              <li><button onClick={() => setView('about')} className="hover:text-brand-primary transition-colors text-left font-medium">Acerca de nosotros</button></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-brand-primary transition-colors text-left font-medium">Privacidad</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400 font-medium">© 2026 Universidad de Córdoba, Colombia. Todos los derechos reservados.</p>
        </div>
      </footer>
      <FloatingContact />
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
