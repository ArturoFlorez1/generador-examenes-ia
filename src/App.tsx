import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import { Login } from './components/Login';
import { FloatingContact } from './components/FloatingContact';
import { ConfirmModal } from './components/ConfirmModal';
import { OnboardingTutorial } from './components/Onboarding/OnboardingTutorial';

// Lazy loaded components
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const ExamCreator = lazy(() => import('./components/ExamCreator').then(m => ({ default: m.ExamCreator })));
const QuestionReview = lazy(() => import('./components/QuestionReview').then(m => ({ default: m.QuestionReview })));
const ExamPlayer = lazy(() => import('./components/ExamPlayer').then(m => ({ default: m.ExamPlayer })));
const AIResources = lazy(() => import('./components/AIResources').then(m => ({ default: m.AIResources })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const QuestionBankManager = lazy(() => import('./components/QuestionBankManager').then(m => ({ default: m.QuestionBankManager })));
const HelpCenter = lazy(() => import('./components/HelpCenter').then(m => ({ default: m.HelpCenter })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const AboutUs = lazy(() => import('./components/AboutUs').then(m => ({ default: m.AboutUs })));
const UserProfile = lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));

import { generateExamQuestions } from './services/geminiService';
import { examsService, coursesService, chatService, usersService, questionBankService } from './services/firestoreService';
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
  const [view, setView] = useState<'dashboard' | 'creator' | 'review' | 'player' | 'resources' | 'admin' | 'help' | 'about' | 'privacy' | 'profile' | 'questionBank'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [currentExam, setCurrentExam] = useState<Partial<Exam> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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
    console.time('[Performance] Examen Generado');
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || undefined;
      
      // Pull from QuestionBank first for specific course
      const approvedBankQs = await questionBankService.getApprovedQuestions(params.course);
      
      // Match by topic (rough match for topic)
      const matchingBankQs = approvedBankQs.filter(q => 
        q.topic.toLowerCase().includes(params.topic.toLowerCase())
      );

      const shuffledBank = [...matchingBankQs].sort(() => 0.5 - Math.random());
      const selectedBankQs = shuffledBank.slice(0, params.numQuestions);
      
      let finalQuestions = selectedBankQs.map((q) => ({
        id: crypto.randomUUID(),
        type: (q.type || 'multiple_choice') as any,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        justification: q.justification || '',
        competence: q.competence || '',
        learningOutcome: q.learningOutcome || '',
        bloomLevel: q.bloomLevel || '',
        difficulty: q.difficulty,
        difficultyJustification: "Proveniente del Banco de Preguntas Institucional",
        qualityCriteria: { clarity: "Alta", coherence: "Alta", pertinence: "Alta" },
        teacherRecommendation: "Validada institucionalmente.",
        inclusionGuidance: q.inclusionGuidance
      }));

      const numMissing = params.numQuestions - finalQuestions.length;
      
      if (numMissing > 0) {
        const aiParams = { ...params, numQuestions: numMissing };
        const aiQuestions = await generateExamQuestions(aiParams, apiKey);
        
        finalQuestions = [...finalQuestions, ...aiQuestions];

        // Store new AI questions into the bank as pending
        aiQuestions.forEach(aiQ => {
           questionBankService.createQuestion({
             prompt: aiQ.prompt,
             correctAnswer: aiQ.correctAnswer,
             options: aiQ.options || [],
             topic: params.topic,
             course: params.course,
             difficulty: aiQ.difficulty,
             status: 'pending',
             justification: aiQ.justification,
             competence: aiQ.competence,
             learningOutcome: aiQ.learningOutcome,
             bloomLevel: aiQ.bloomLevel,
             type: aiQ.type,
             inclusionGuidance: aiQ.inclusionGuidance || ''
           }).catch(e => console.error("Could not save to question bank", e));
        });
      }

      setCurrentExam({
        ...params,
        id: crypto.randomUUID(),
        title: `Examen: ${params.topic}`,
        questions: finalQuestions,
        createdAt: Date.now(),
        teacherName: profile?.fullName || user?.displayName || undefined
      });
      setView('review');
      setSelectedCourseForExam(null); // Clear after generation
      
      console.timeEnd('[Performance] Examen Generado');
    } catch (error) {
      console.timeEnd('[Performance] Examen Generado');
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
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Examen',
      message: '¿Estás seguro de que deseas eliminar este examen?',
      onConfirm: async () => {
        try {
          await examsService.delete(id);
        } catch (err) {
          console.error("Error deleting exam:", err);
          alert("Error al eliminar el examen");
        }
      }
    });
  };

  const handleCreateCourse = async (name: string, description: string) => {
    const creatorName = profile?.fullName || user?.displayName || 'Docente';
    await coursesService.create(name, description, creatorName);
  };

  const handleDeleteCourse = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'ADVERTENCIA: ¿Eliminar curso?',
      message: '¿Estás seguro de que deseas eliminar este curso? \n\nAún estamos desarrollando esta función para asegurar que se eliminen también las inscripciones y exámenes asociados de forma permanente. Por ahora, solo se eliminará el acceso principal al curso.',
      onConfirm: async () => {
        try {
          await coursesService.delete(id);
        } catch (err) {
          console.error("Error deleting course:", err);
          alert("Error al eliminar el curso: " + (err instanceof Error ? err.message : String(err)));
        }
      }
    });
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

          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            {role !== 'admin' && (
              <div className="flex items-center gap-4 lg:gap-8">
                <NavLink active={view === 'dashboard'} onClick={() => setView('dashboard')}>Inicio</NavLink>
                {role !== 'student' && (
                  <>
                    <NavLink active={view === 'resources'} onClick={() => setView('resources')}>Herramientas IA</NavLink>
                    <NavLink active={view === 'questionBank'} onClick={() => setView('questionBank')}>Banco de Preguntas</NavLink>
                  </>
                )}
              </div>
            )}
            {role === 'admin' && (
              <div className="relative">
                <div className="flex items-center gap-4 lg:gap-8">
                  <NavLink active={view === 'admin'} onClick={() => setView('admin')}>Administración</NavLink>
                  <NavLink active={view === 'questionBank'} onClick={() => setView('questionBank')}>Banco de Preguntas</NavLink>
                </div>
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
            
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
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
            </Suspense>
          </div>
        )}

        {view === 'admin' && role === 'admin' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <AdminPanel />
          </Suspense>
        )}

        {view === 'creator' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <ExamCreator 
              onBack={() => setView('dashboard')} 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              courses={courses}
              initialCourseId={selectedCourseForExam || undefined}
            />
          </Suspense>
        )}

        {view === 'review' && currentExam && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <QuestionReview 
              exam={currentExam as Exam} 
              onSave={handleSaveExam}
              onCancel={() => setView('dashboard')}
            />
          </Suspense>
        )}

        {view === 'player' && currentExam && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <ExamPlayer 
              exam={currentExam as Exam}
              mode={role}
              onClose={() => {
                setView('dashboard');
                setCurrentExam(null);
              }}
            />
          </Suspense>
        )}

        {view === 'resources' && role !== 'admin' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <AIResources />
          </Suspense>
        )}

        {view === 'questionBank' && (role === 'admin' || role === 'teacher') && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <QuestionBankManager isAdmin={role === 'admin'} />
          </Suspense>
        )}

        {view === 'help' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <HelpCenter onBack={() => setView('dashboard')} />
          </Suspense>
        )}

        {view === 'privacy' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <PrivacyPolicy onBack={() => setView('dashboard')} />
          </Suspense>
        )}

        {view === 'about' && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <AboutUs onBack={() => setView('dashboard')} />
          </Suspense>
        )}

        {view === 'profile' && profile && (
          <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>}>
            <UserProfile 
              profile={profile}
              examsCount={exams.length}
              coursesCount={role === 'student' ? enrolledCourses.length : courses.length}
              exams={exams}
              onUpdate={updateProfile}
              onBack={() => setView('dashboard')}
            />
          </Suspense>
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
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}

const NavLink: React.FC<{ children: React.ReactNode, active?: boolean, onClick?: () => void }> = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`text-xs xl:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
      active ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);
