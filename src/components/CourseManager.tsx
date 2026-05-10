import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  BookOpen, 
  Hash, 
  Calendar,
  Users,
  Copy,
  CheckCircle2,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, Enrollment, Exam } from '../types';
import { PREDEFINED_COURSES } from '../constants';
import { coursesService } from '../services/firestoreService';

interface CourseCardProps {
  course: Course;
  exams: Exam[];
  onDelete: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, exams, onDelete, onSelect, copiedId, onCopy }) => {
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showStudents, setShowStudents] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const studentData = await coursesService.getStudentsForCourse(course.id);
      setStudents(studentData);
      setStudentCount(studentData.length);
      
      const courseExamIds = exams.filter(e => e.courseId === course.id).map(e => e.id);
      if (courseExamIds.length > 0) {
        const subSnap = await getDocs(query(collection(db, 'submissions'), where('examId', 'in', courseExamIds)));
        setSubmissions(subSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
      setLoading(false);
    };
    fetchData();
  }, [course.id, exams]);

  return (
    <motion.div 
      layout
      className="group bg-white border border-slate-100 rounded-[32px] hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col relative overflow-hidden cursor-pointer"
      onClick={() => onSelect(course.id)}
    >
      <div className="p-6 space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl translate-x-12 -translate-y-12" />
        
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            <BookOpen size={24} />
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowStudents(!showStudents)}
              className={`p-2 rounded-lg transition-all ${showStudents ? 'bg-brand-primary text-white' : 'text-slate-300 hover:text-brand-primary hover:bg-brand-primary/5'}`}
              title="Ver Estudiantes"
            >
              <Users size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Eliminar Curso"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900 text-lg group-hover:text-brand-primary transition-colors">{course.name}</h3>
          <p className="text-slate-400 text-xs font-medium line-clamp-2 mt-1">{course.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Inscripción</p>
            <button 
              onClick={() => onCopy(course.code, course.id)}
              className="flex items-center justify-between w-full font-mono text-sm font-bold text-brand-primary"
            >
              <span className="truncate">{course.code}</span>
              {copiedId === course.id ? <CheckCircle2 size={12} className="shrink-0" /> : <Copy size={12} className="opacity-40 shrink-0" />}
            </button>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Inscritos</p>
            <p className="text-sm font-black text-slate-700 flex items-center gap-1">
              <Users size={12} /> 
              {studentCount}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showStudents && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-slate-50 bg-slate-50/50 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={12} /> Lista de Estudiantes
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {students.map((enrollment) => {
                  const studentSubmission = submissions.find(s => s.studentId === enrollment.studentId);
                  return (
                    <div key={enrollment.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{enrollment.studentName || 'Sin nombre'}</span>
                      {studentSubmission && (
                        <span className="text-xs font-black text-brand-primary">
                          {studentSubmission.score} / 5.0
                        </span>
                      )}
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-[10px] font-medium text-slate-400 text-center py-2">No hay estudiantes inscritos aún.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface CourseManagerProps {
  courses: Course[];
  exams: Exam[];
  onCreateCourse: (name: string, description: string) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onSelectCourse: (id: string) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ 
  courses, 
  exams,
  onCreateCourse, 
  onDeleteCourse,
  onSelectCourse
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(PREDEFINED_COURSES[0]);
  const [courseDescription, setCourseDescription] = useState('Curso oficial asignado');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ... rest of the file stays same

  // Filter out courses already assigned to this teacher to avoid duplicates if desired, 
  // though teacher might have multiple sections of same course name.
  // The user says "asignación de cursos", typically implying they just pick one.

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setLoading(true);
    try {
      await onCreateCourse(selectedCourse, courseDescription);
      setIsCreating(false);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-brand-primary" /> Mis Cursos
          </h2>
          <p className="text-slate-500 font-medium text-sm">Gestiona tus aulas virtuales y códigos de inscripción.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Asignar Curso
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-2 border-brand-primary/20 p-8 rounded-[40px] shadow-2xl shadow-brand-primary/5"
          >
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Curso</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700 appearance-none pr-12"
                    >
                      {PREDEFINED_COURSES.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ) )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Observación</label>
                  <input 
                    type="text"
                    value={courseDescription}
                    onChange={e => setCourseDescription(e.target.value)}
                    placeholder="Ej: Grupo 01, Semestre 2026-1..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:border-brand-primary transition-all font-bold text-slate-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-brand-primary text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <Plus className="animate-spin" size={14} />}
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course}
            exams={exams}
            onDelete={onDeleteCourse} 
            onSelect={onSelectCourse}
            copiedId={copiedId} 
            onCopy={copyCode} 
          />
        ))}

        {courses.length === 0 && !isCreating && (
          <div className="md:col-span-2 lg:col-span-3 py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[40px] text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
              <BookOpen className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-medium">Aún no tienes cursos creados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
