import { jsPDF } from 'jspdf';
import { Exam, ExamAttempt } from '../types';

export const pdfService = {
  async generateExamPdf(exam: Exam, includeAnswers = false) {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    const addHeader = (pdf: jsPDF, pageNum: number) => {
      let currentY = 15;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 132, 61);
      pdf.text("UNIVERSIDAD DE CÓRDOBA", margin, currentY);
      
      currentY += 6;
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text("FACULTAD DE EDUCACIÓN Y CIENCIAS HUMANAS", margin, currentY);
      
      return currentY + 12;
    };

    let y = addHeader(doc, 1);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(exam.title.toUpperCase(), margin, y);
    
    y += 8;
    
    // Cuadro de Información del Examen
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 28, 3, 3, "FD");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("CURSO:", margin + 5, y + 8);
    doc.text("TEMA:", margin + 5, y + 16);
    doc.text("SEMESTRE:", margin + 5, y + 24);
    
    if (exam.showTeacherInPdf !== false) {
      doc.text("DOCENTE:", (pageWidth / 2) + 5, y + 8);
    }
    doc.text("DIFICULTAD:", (pageWidth / 2) + 5, y + 16);
    doc.text("FECHA:", (pageWidth / 2) + 5, y + 24);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    
    const maxMetaWidth = (pageWidth / 2) - margin - 30;
    doc.text(doc.splitTextToSize(exam.course.toUpperCase(), maxMetaWidth), margin + 25, y + 8);
    doc.text(doc.splitTextToSize(exam.topic.toUpperCase(), maxMetaWidth), margin + 25, y + 16);
    doc.text(doc.splitTextToSize(exam.semester.toUpperCase(), maxMetaWidth), margin + 25, y + 24);
    
    if (exam.showTeacherInPdf !== false) {
      doc.text((exam.teacherName || "DOCENTE ASIGNADO").toUpperCase(), (pageWidth / 2) + 30, y + 8);
    }
    doc.text(exam.difficulty.toUpperCase(), (pageWidth / 2) + 30, y + 16);
    doc.text(new Date(exam.createdAt).toLocaleDateString(), (pageWidth / 2) + 30, y + 24);

    y += 42;

    if (!includeAnswers) {
      doc.setDrawColor(200);
      doc.setFont("helvetica", "bold");
      doc.text("NOMBRE COMPLETO: __________________________________________________", margin, y);
      y += 8;
      doc.text("CÓDIGO / ID: ________________________", margin, y);
      y += 15;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("HOJA DE RESPUESTAS Y JUSTIFICACIONES (SOLO PARA USO DOCENTE)", margin, y);
      y += 15;
    }

    // Preguntas
    exam.questions.forEach((q, i) => {
      if (y > 250) {
        doc.addPage();
        y = addHeader(doc, doc.internal.pages.length - 1);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      
      const promptText = `${i + 1}. ${q.prompt}`;
      const promptLines = doc.splitTextToSize(promptText, pageWidth - (margin * 2));
      doc.text(promptLines, margin, y);
      y += (promptLines.length * 5) + 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIndex) => {
          if (y > 275) {
            doc.addPage();
            y = addHeader(doc, doc.internal.pages.length - 1);
          }
          const char = String.fromCharCode(65 + optIndex);
          const optionText = `${char}) ${opt}`;
          const isCorrect = includeAnswers && (String(q.correctAnswer).toLowerCase() === opt.toLowerCase() || String(q.correctAnswer).includes(opt));
          
          if (isCorrect) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 132, 61);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
          }

          const optLines = doc.splitTextToSize(optionText, pageWidth - (margin * 2) - 10);
          doc.text(optLines, margin + 10, y);
          
          if (isCorrect) {
            doc.setFontSize(7);
            doc.text(" [CORRECTA]", margin + 10 + doc.getTextWidth(optLines[optLines.length - 1]) + 2, y + ((optLines.length - 1) * 5));
            doc.setFontSize(10);
          }
          y += (optLines.length * 5) + 2;
        });

        if (includeAnswers && q.justification) {
          y += 3;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100);
          const justifLines = doc.splitTextToSize(`Justificación: ${q.justification}`, pageWidth - (margin * 2) - 15);
          doc.text(justifLines, margin + 10, y);
          y += (justifLines.length * 4) + 5;
        }
      } else {
        doc.setDrawColor(241, 245, 249);
        doc.line(margin + 5, y + 5, pageWidth - margin, y + 5);
        y += 8;
        doc.line(margin + 5, y + 5, pageWidth - margin, y + 5);
        y += 12;
      }
      y += 8;
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${i} de ${pageCount} | Generado por EvaluAI UniCordoba - Calidad Educativa en la Era Digital`, pageWidth / 2, 285, { align: "center" });
    }

    const fileName = `${includeAnswers ? 'Clave_' : 'Examen_'}${exam.topic.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  },

  async generateResultPdf(exam: Exam, attempt: Partial<ExamAttempt>, studentName: string) {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    const addHeader = (pdf: jsPDF) => {
      let currentY = 15;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 132, 61);
      pdf.text("UNIVERSIDAD DE CÓRDOBA", margin, currentY);
      
      currentY += 6;
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text("RESULTADOS DE EVALUACIÓN - EVALUAI", margin, currentY);
      
      return currentY + 12;
    };

    let y = addHeader(doc);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("REPORTE DE CALIFICACIÓN", margin, y);
    
    y += 10;
    
    // Cuadro de Resultados
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 40, 3, 3, "FD");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("ESTUDIANTE:", margin + 5, y + 10);
    doc.text("EXAMEN:", margin + 5, y + 20);
    doc.text("CURSO:", margin + 5, y + 30);
    
    doc.text("PUNTAJE:", (pageWidth / 2) + 5, y + 15);
    doc.text("PORCENTAJE:", (pageWidth / 2) + 5, y + 30);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(studentName.toUpperCase(), margin + 35, y + 10);
    doc.text(exam.title.toUpperCase(), margin + 35, y + 20);
    doc.text(exam.course.toUpperCase(), margin + 35, y + 30);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 132, 61);
    doc.text(`${attempt.score}/5.0`, (pageWidth / 2) + 30, y + 15);
    doc.text(`${attempt.percentageScore}%`, (pageWidth / 2) + 30, y + 30);

    y += 55;

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("DESGLOSE DE RESPUESTAS", margin, y);
    y += 10;

    exam.questions.forEach((q, i) => {
      if (y > 240) {
        doc.addPage();
        y = addHeader(doc);
        y += 10;
      }

      const userAnswer = attempt.answers ? attempt.answers[q.id] : undefined;
      const isCorrect = String(userAnswer).toLowerCase() === String(q.correctAnswer).toLowerCase();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(isCorrect ? 0 : 200, isCorrect ? 132 : 0, isCorrect ? 61 : 0);
      doc.text(`${i + 1}. ${q.prompt}`, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Tu respuesta: ${userAnswer || '(No respondida)'}`, margin + 5, y);
      y += 5;
      
      if (!isCorrect) {
        doc.setTextColor(0, 132, 61);
        doc.text(`Respuesta correcta: ${q.correctAnswer}`, margin + 5, y);
        y += 5;
      }

      y += 10;
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${i} de ${pageCount} | Universidad de Córdoba - Generado por EvaluAI`, pageWidth / 2, 285, { align: "center" });
    }

    doc.save(`Resultado_${studentName.replace(/\s+/g, '_')}_${exam.topic.replace(/\s+/g, '_')}.pdf`);
  }
};
