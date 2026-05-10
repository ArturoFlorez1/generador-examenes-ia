import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  ClipboardCheck, 
  FileEdit,
  History,
  Upload,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { runAITool } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ToolCardProps {
  toolId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  inputs: { 
    name: string; 
    label: string; 
    placeholder: string; 
    type?: string; 
    options?: string[] 
  }[];
}

const TypingResponse = ({ content }: { content: string }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedContent(content.slice(0, index));
      index++;
      if (index > content.length) clearInterval(interval);
    }, 5);
    return () => clearInterval(interval);
  }, [content]);

  return (
    <div className="markdown-body prose prose-slate max-w-none">
      <ReactMarkdown>{displayedContent}</ReactMarkdown>
    </div>
  );
};

export const AIResources: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const tools: ToolCardProps[] = [
    {
      toolId: 'bloom',
      title: 'Generador por Taxonomía de Bloom',
      description: 'Transforma contenidos en preguntas de diferentes niveles cognitivos (Recordar hasta Crear).',
      icon: <BrainCircuit size={24} />,
      color: 'bg-emerald-500',
      inputs: [
        { name: 'topic', label: 'Tema Específico', placeholder: 'Ej: Estructuras de datos lineales' },
        { name: 'course', label: 'Curso / Contexto', placeholder: 'Ej: Introducción a la Programación' },
        { 
          name: 'bloomLevel', 
          label: 'Nivel Cognitivo Deseado', 
          placeholder: 'Selecciona un nivel',
          type: 'select',
          options: ['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear']
        }
      ]
    },
    {
      toolId: 'evaluator',
      title: 'Evaluador de Exámenes',
      description: 'Analiza la validez pedagógica y técnica de tus instrumentos de evaluación.',
      icon: <ClipboardCheck size={24} />,
      color: 'bg-blue-600',
      inputs: [
        { name: 'content', label: 'Contenido del Examen', placeholder: 'Pega el texto aquí o sube un archivo PDF...', type: 'textarea' }
      ]
    },
    {
      toolId: 'rubric',
      title: 'Generador de Rúbricas',
      description: 'Crea matrices de evaluación con criterios claros y niveles de desempeño para tus actividades.',
      icon: <History size={24} />,
      color: 'bg-amber-500',
      inputs: [
        { name: 'topic', label: 'Tema de la Actividad', placeholder: 'Ej: Desarrollo de Aplicación Web' },
        { name: 'activity', label: 'Tipo de Entregable', placeholder: 'Ej: Código Fuente + Documentación' },
        { name: 'criteria', label: 'Competencias / Criterios (Opcional)', placeholder: 'Ej: Modularidad, Uso de Git, Documentación técnica', type: 'textarea' }
      ]
    },
    {
      toolId: 'improver',
      title: 'Mejorador de Preguntas',
      description: 'Optimiza la redacción técnica y reduce la ambigüedad en tus ítems de evaluación.',
      icon: <FileEdit size={24} />,
      color: 'bg-slate-900',
      inputs: [
        { name: 'question', label: 'Pregunta a Optimizar', placeholder: 'Pega aquí la pregunta original...', type: 'textarea' }
      ]
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por ahora solo soportamos archivos PDF.');
      return;
    }

    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      setFormValues(prev => ({ ...prev, content: fullText }));
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('No se pudo leer el PDF. Asegúrate de que no esté protegido.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleRunTool = async (toolId: string) => {
    const apiKey = localStorage.getItem('gemini_api_key') || undefined;
    if (!apiKey) {
      alert("Por favor, configura tu API Key de Gemini en tu perfil para utilizar las herramientas de IA.");
      setActiveTool(null);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await runAITool(toolId, formValues, apiKey);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult("Error al generar la respuesta. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const activeToolData = tools.find(t => t.toolId === activeTool);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-normal leading-tight">Caja de Herramientas</h1>
          <p className="text-slate-500 font-medium mt-2">Instrumentos inteligentes para el fortalecimiento de la práctica docente.</p>
        </div>
        <div className="bg-brand-primary text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-primary/20">
          <Sparkles size={16} /> Laboratorio de Innovación
        </div>
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {tools.map((tool) => (
            <motion.div 
              key={tool.toolId}
              whileHover={{ scale: 1.02, y: -8 }}
              className="card p-10 flex flex-col gap-10 group cursor-pointer border-b-4 border-b-slate-100 hover:border-b-brand-primary transition-all duration-300"
              onClick={() => {
                setActiveTool(tool.toolId);
                setFormValues({});
                setResult(null);
              }}
            >
              <div className={`w-12 h-12 ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                {tool.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-primary transition-colors leading-tight">{tool.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
              </div>
              <button className="mt-auto text-[10px] font-black text-brand-primary flex items-center gap-2 uppercase tracking-widest">
                Abrir Herramienta <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <button 
            onClick={() => setActiveTool(null)}
            className="mb-8 text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-2 uppercase tracking-widest"
          >
            ← Volver a Herramientas
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-8 space-y-6 bg-white shadow-xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 ${activeToolData?.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                    {activeToolData?.icon}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{activeToolData?.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {activeToolData?.inputs.map(input => (
                    <div key={input.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{input.label}</label>
                        {activeTool === 'evaluator' && input.name === 'content' && (
                          <div className="relative">
                            <input 
                              type="file" 
                              id="pdf-upload" 
                              className="hidden" 
                              accept=".pdf"
                              onChange={handleFileUpload}
                            />
                            <label 
                              htmlFor="pdf-upload"
                              className="text-[9px] font-black bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg cursor-pointer hover:bg-brand-primary hover:text-white transition-all flex items-center gap-1 uppercase tracking-tighter"
                            >
                              {isParsing ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                              Cargar PDF
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {input.type === 'textarea' ? (
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-medium min-h-[150px]"
                          placeholder={input.placeholder}
                          value={formValues[input.name] || ''}
                          onChange={e => setFormValues({...formValues, [input.name]: e.target.value})}
                        />
                      ) : input.type === 'select' ? (
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-medium appearance-none"
                          value={formValues[input.name] || ''}
                          onChange={e => setFormValues({...formValues, [input.name]: e.target.value})}
                        >
                          <option value="">{input.placeholder}</option>
                          {input.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-medium"
                          placeholder={input.placeholder}
                          value={formValues[input.name] || ''}
                          onChange={e => setFormValues({...formValues, [input.name]: e.target.value})}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3 text-slate-400">
                  <AlertCircle size={32} className="shrink-0 text-brand-primary opacity-50" />
                  <p className="text-[10px] font-medium leading-relaxed">
                    <strong>Nota:</strong> Para mejores resultados, describe el contexto completo. La IA generará una respuesta basada en criterios pedagógicos de la taxonomía de Bloom y lineamientos de calidad académica.
                  </p>
                </div>

                <button 
                  onClick={() => handleRunTool(activeTool)}
                  disabled={loading || isParsing || Object.values(formValues).some(v => !v)}
                  className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ejecutar IA
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card p-8 min-h-[400px] border-dashed border-2 flex flex-col space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-brand-primary font-black text-[10px] uppercase tracking-widest">
                    <Sparkles size={14} /> Resultados Generados
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Área de Trabajo</div>
                </div>
                
                {loading && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-slate-400 py-10">
                    <Loader2 size={48} className="animate-spin text-brand-primary" />
                    <div className="text-center">
                      <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Docente IA está analizando...</p>
                      <p className="text-xs italic mt-1">Estructurando respuesta pedagógica basada en evidencias.</p>
                    </div>
                  </div>
                )}

                {!loading && result && (
                  <div className="animate-in fade-in duration-700">
                    <div className="flex items-center gap-2 mb-6 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Análisis Completado
                    </div>
                    <div className="markdown-body prose prose-slate max-w-none">
                      <TypingResponse content={result} />
                    </div>
                  </div>
                )}

                {!loading && !result && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-100 p-6 rounded-full">
                      <BrainCircuit size={64} className="text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">Listo para Generar</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Completa los datos y presiona "Ejecutar IA" para recibir apoyo pedagógico especializado.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
