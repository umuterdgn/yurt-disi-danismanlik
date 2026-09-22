"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Loader2 } from "lucide-react";
import { StudentReportTemplate } from "./student-report-template";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReportGenerationDialogProps {
  studentName: string;
  studentId: string;
  targetUniversity?: string | null;
  targetMajor?: string | null;
  currentScore: number | null;
  targetScore: number | null;
  exams: any[];
  completedTasks: any[];
  subjectAnalysis: any[];
}

export function ReportGenerationDialog({
  studentName,
  studentId,
  targetUniversity,
  targetMajor,
  currentScore,
  targetScore,
  exams,
  completedTasks,
  subjectAnalysis
}: ReportGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (reportType === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Filter data by date range
      const filteredExams = exams.filter((exam: any) => {
        const examDate = new Date(exam.date);
        return examDate >= startDate && examDate <= endDate;
      });

      const filteredTasks = completedTasks.filter((task: any) => {
        const taskDate = new Date(task.taskDate);
        return taskDate >= startDate && taskDate <= endDate && task.isCompleted;
      });

      // Calculate pomodoro data
      const totalMinutes = filteredTasks.reduce((sum, task) => {
        return sum + (task.estimatedPomodoros || 0) * 25;
      }, 0);

      const subjectMinutes: Record<string, number> = {};
      filteredTasks.forEach((task) => {
        const subject = task.subject || 'Diğer';
        subjectMinutes[subject] = (subjectMinutes[subject] || 0) + (task.estimatedPomodoros || 0) * 25;
      });

      const topSubjects = Object.entries(subjectMinutes)
        .map(([subject, minutes]) => ({ subject, minutes }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);

      const pomodoroData = {
        totalMinutes,
        totalSessions: Math.round(totalMinutes / 25),
        topSubjects
      };

      // Identify weak and strong subjects
      const subjectProficiency: Record<string, number> = {};
      subjectAnalysis.forEach((analysis) => {
        subjectProficiency[analysis.subject] = (subjectProficiency[analysis.subject] || 0) + analysis.progressPercent;
      });

      const weakSubjects = Object.entries(subjectProficiency)
        .filter(([_, percent]) => percent < 50)
        .map(([subject]) => subject);

      const strongSubjects = Object.entries(subjectProficiency)
        .filter(([_, percent]) => percent >= 70)
        .map(([subject]) => subject);

      // Get AI summary
      const summaryResponse = await fetch('/api/ai/report-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          reportType,
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          exams: filteredExams,
          completedTasks: filteredTasks,
          pomodoroData,
          currentScore: currentScore || 0,
          targetScore: targetScore || 0,
          weakSubjects,
          strongSubjects
        })
      });

      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        setAiSummary(summaryData.summary);
        setShowTemplate(true);
        toast.success('Rapor özeti oluşturuldu!');
      } else {
        toast.error(summaryData.error || 'Rapor özeti oluşturulamadı');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Rapor oluşturulurken hata oluştu');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const templateElement = document.getElementById('report-template');
      if (!templateElement) {
        toast.error('Rapor şablonu bulunamadı');
        return;
      }

      toast.loading('PDF oluşturuluyor...');

      const canvas = await html2canvas(templateElement, {
        scale: 2, // Yüksek kalite için
        useCORS: true, // Logoların ve dış görsellerin yüklenmesi için ZORUNLU
        logging: true // Hatayı görebilmemiz için
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const reportDate = new Date().toLocaleDateString('tr-TR').replace(/\//g, '-');
      const fileName = `${studentName}_${reportType === 'weekly' ? 'Haftalik' : 'Aylik'}Rapor_${reportDate}.pdf`;
      
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success('PDF başarıyla indirildi!');
      setOpen(false);
      setShowTemplate(false);
      setAiSummary('');
    } catch (error) {
      console.error("PDF_EXPORT_ERROR:", error);
      toast.dismiss();
      toast.error('PDF oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.');
    }
  };

  const calculateReportData = () => {
    const endDate = new Date();
    const startDate = new Date();
    if (reportType === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const filteredExams = exams.filter((exam: any) => {
      const examDate = new Date(exam.date);
      return examDate >= startDate && examDate <= endDate;
    });

    const filteredTasks = completedTasks.filter((task: any) => {
      const taskDate = new Date(task.taskDate);
      return taskDate >= startDate && taskDate <= endDate && task.isCompleted;
    });

    const totalMinutes = filteredTasks.reduce((sum, task) => {
      return sum + (task.estimatedPomodoros || 0) * 25;
    }, 0);

    const subjectMinutes: Record<string, number> = {};
    filteredTasks.forEach((task) => {
      const subject = task.subject || 'Diğer';
      subjectMinutes[subject] = (subjectMinutes[subject] || 0) + (task.estimatedPomodoros || 0) * 25;
    });

    const topSubjects = Object.entries(subjectMinutes)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    return {
      filteredExams,
      filteredTasks,
      pomodoroData: {
        totalMinutes,
        totalSessions: Math.round(totalMinutes / 25),
        topSubjects
      }
    };
  };

  const { filteredExams, filteredTasks, pomodoroData } = calculateReportData();
  const reportDate = new Date().toLocaleDateString('tr-TR');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <FileText className="w-4 h-4 mr-2" />
          📄 Rapor Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gelişim Raporu Oluştur
          </DialogTitle>
          <DialogDescription>
            {studentName} için {reportType === 'weekly' ? 'haftalık' : 'aylık'} gelişim raporu oluşturun.
          </DialogDescription>
        </DialogHeader>

        {!showTemplate ? (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Rapor Türü</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Haftalık Rapor (Son 7 Gün)</SelectItem>
                  <SelectItem value="monthly">Aylık Rapor (Son 30 Gün)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Rapor İçeriği Önizleme</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Deneme Sınavı:</span>
                  <span className="ml-2 font-medium">{filteredExams.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tamamlanan Görev:</span>
                  <span className="ml-2 font-medium">{filteredTasks.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Çalışma Süresi:</span>
                  <span className="ml-2 font-medium">{Math.round(pomodoroData.totalMinutes / 25)} Pomodoro</span>
                </div>
                <div>
                  <span className="text-gray-600">Toplam Dakika:</span>
                  <span className="ml-2 font-medium">{pomodoroData.totalMinutes} dk</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateReport} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rapor Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Rapor Oluştur
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Rapor önizlemesi:</p>
              <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                PDF İndir
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <StudentReportTemplate
                studentName={studentName}
                targetUniversity={targetUniversity}
                targetMajor={targetMajor}
                reportType={reportType}
                reportDate={reportDate}
                aiSummary={aiSummary}
                currentScore={currentScore}
                targetScore={targetScore}
                exams={filteredExams}
                completedTasks={filteredTasks}
                pomodoroData={pomodoroData}
                subjectAnalysis={subjectAnalysis}
              />
            </div>

            <Button 
              onClick={() => {
                setShowTemplate(false);
                setAiSummary('');
              }}
              variant="outline"
              className="w-full"
            >
              Vazgeç
            </Button>
          </div>
        )}
        
        {/* Hidden template for PDF generation - always rendered but positioned off-screen */}
        {showTemplate && (
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
            <StudentReportTemplate
              studentName={studentName}
              targetUniversity={targetUniversity}
              targetMajor={targetMajor}
              reportType={reportType}
              reportDate={reportDate}
              aiSummary={aiSummary}
              currentScore={currentScore}
              targetScore={targetScore}
              exams={filteredExams}
              completedTasks={filteredTasks}
              pomodoroData={pomodoroData}
              subjectAnalysis={subjectAnalysis}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}