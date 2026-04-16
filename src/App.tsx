import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  History, 
  Download, 
  ChevronRight, 
  Loader2, 
  User,
  Calendar,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { analyzeMedicalReport } from './lib/gemini';
import { generateReportPDF } from './lib/pdf';
import { ReportSummary, AbnormalFlag, Severity } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
  const [view, setView] = useState<'dashboard' | 'analysis' | 'history'>('dashboard');
  const [patientInfo, setPatientInfo] = useState({ age: '', gender: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reports from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('medisummarize_reports');
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved reports", e);
      }
    }
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('medisummarize_reports', JSON.stringify(reports));
  }, [reports]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const summary = await analyzeMedicalReport(
          base64, 
          file.type, 
          { 
            age: patientInfo.age ? parseInt(patientInfo.age) : undefined, 
            gender: patientInfo.gender 
          }
        );
        
        setReports(prev => [summary, ...prev]);
        setSelectedReport(summary);
        setView('analysis');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze report. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'High': return 'text-accent-red bg-accent-red/20 border-accent-red/30';
      case 'Medium': return 'text-accent-amber bg-accent-amber/20 border-accent-amber/30';
      case 'Low': return 'text-accent-green bg-accent-green/20 border-accent-green/30';
      default: return 'text-ink-secondary bg-bg-elevated border-border-subtle';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <section className="bg-bg-surface rounded-2xl p-8 shadow-xl border border-border-subtle">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-blue/10 text-accent-blue mb-2">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-normal text-accent-blue">Upload New Report</h2>
          <p className="text-ink-secondary">Upload your blood test, radiology report, or any medical document for instant AI analysis.</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Age (Optional)</label>
              <input 
                type="number" 
                value={patientInfo.age}
                onChange={e => setPatientInfo(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-bg-deep border border-border-subtle text-ink-primary focus:ring-1 focus:ring-accent-blue focus:border-transparent outline-none transition-all"
                placeholder="e.g. 35"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Gender (Optional)</label>
              <select 
                value={patientInfo.gender}
                onChange={e => setPatientInfo(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-bg-deep border border-border-subtle text-ink-primary focus:ring-1 focus:ring-accent-blue focus:border-transparent outline-none transition-all"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full max-w-sm py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-accent-blue/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Report...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Select File (PDF/Image)
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
        </div>
      </section>

      {reports.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-normal text-accent-blue">Recent Reports</h3>
            <button 
              onClick={() => setView('history')}
              className="text-accent-blue hover:text-blue-400 font-bold text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.slice(0, 3).map(report => (
              <button 
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  setView('analysis');
                }}
                className="bg-bg-surface p-6 rounded-xl border border-border-subtle hover:border-accent-blue/50 hover:shadow-2xl hover:shadow-accent-blue/5 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-bg-elevated rounded-lg group-hover:bg-accent-blue/10 transition-colors">
                    <FileText className="w-6 h-6 text-ink-secondary group-hover:text-accent-blue" />
                  </div>
                  <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
                    {new Date(report.date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-serif text-lg text-ink-primary mb-2">{report.report_type}</h4>
                <p className="text-sm text-ink-secondary line-clamp-2 leading-relaxed">{report.plain_summary}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderAnalysis = () => {
    if (!selectedReport) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => generateReportPDF(selectedReport)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-border-subtle rounded-2xl overflow-hidden border border-border-subtle shadow-2xl">
          {/* Sidebar */}
          <div className="lg:col-span-4 bg-bg-surface p-8 space-y-8 border-r border-border-subtle">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-normal text-accent-blue leading-tight">{selectedReport.report_type}</h2>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> {new Date(selectedReport.date).toLocaleDateString()}
                  </div>
                  {selectedReport.patient_age && (
                    <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Age: {selectedReport.patient_age}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink-primary uppercase tracking-widest border-b border-border-subtle pb-2">Plain Summary</h3>
              <p className="text-sm text-ink-secondary leading-relaxed italic font-serif">
                "{selectedReport.plain_summary}"
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink-primary uppercase tracking-widest border-b border-border-subtle pb-2">Key Insights</h3>
              <ul className="space-y-3">
                {selectedReport.key_findings.map((finding, i) => (
                  <li key={i} className="p-3 rounded-lg bg-bg-elevated border-l-2 border-accent-blue text-xs text-ink-secondary leading-relaxed">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-8 bg-bg-deep p-8 space-y-8">
            {selectedReport.abnormal_flags.length > 0 && (
              <div className="bg-bg-surface rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-lg font-normal text-accent-blue">Clinical Abnormalities</h3>
                  <AlertCircle className="w-5 h-5 text-accent-red" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest border-b border-border-subtle">
                        <th className="px-6 py-4">Parameter</th>
                        <th className="px-6 py-4">Result</th>
                        <th className="px-6 py-4">Range</th>
                        <th className="px-6 py-4">Severity</th>
                        <th className="px-6 py-4">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedReport.abnormal_flags.map((flag, i) => (
                        <tr key={i} className="text-sm hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-ink-primary">{flag.parameter}</td>
                          <td className="px-6 py-4 text-ink-secondary">{flag.value}</td>
                          <td className="px-6 py-4 text-ink-secondary">{flag.normal_range || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
                              getSeverityColor(flag.severity)
                            )}>
                              {flag.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-ink-secondary leading-relaxed">{flag.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-surface rounded-xl border border-border-subtle p-6 space-y-6">
                <h3 className="text-lg font-normal text-accent-blue">Recommendations</h3>
                <ul className="space-y-3">
                  {selectedReport.recommendations.map((rec, i) => (
                    <li key={i} className="p-3 rounded-lg bg-bg-elevated border-l-2 border-accent-amber text-xs text-ink-secondary leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg-elevated rounded-xl p-6 space-y-4 border border-border-subtle">
                <div className="flex items-center gap-2 text-accent-amber">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Medical Disclaimer</span>
                </div>
                <p className="text-[10px] text-ink-secondary leading-relaxed">
                  {selectedReport.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const trendData: any[] = [];
    const parameters = new Set<string>();
    
    reports.forEach(r => {
      r.abnormal_flags.forEach(f => parameters.add(f.parameter));
    });

    const sortedReports = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedReports.forEach(r => {
      const dataPoint: any = { date: new Date(r.date).toLocaleDateString() };
      r.abnormal_flags.forEach(f => {
        const val = parseFloat(f.value.replace(/[^0-9.]/g, ''));
        if (!isNaN(val)) {
          dataPoint[f.parameter] = val;
        }
      });
      trendData.push(dataPoint);
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-normal text-accent-blue">Health History & Trends</h2>
        </div>

        {trendData.length > 1 && (
          <section className="bg-bg-surface rounded-2xl p-8 shadow-xl border border-border-subtle space-y-6">
            <h3 className="text-lg font-normal text-accent-blue flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Parameter Trends
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e222a', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  {Array.from(parameters).slice(0, 5).map((param, i) => (
                    <Line 
                      key={param}
                      type="monotone" 
                      dataKey={param} 
                      stroke={colors[i % colors.length]} 
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2, fill: '#15181d' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="bg-bg-surface rounded-2xl shadow-xl border border-border-subtle overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-border-subtle">
                <th className="px-6 py-4 text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Report Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Findings</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-secondary uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-ink-secondary">{new Date(report.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-serif text-ink-primary">{report.report_type}</td>
                  <td className="px-6 py-4 text-sm text-ink-secondary">{report.key_findings.length} key findings</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedReport(report);
                        setView('analysis');
                      }}
                      className="text-accent-blue hover:text-blue-400 font-bold text-xs uppercase tracking-widest"
                    >
                      View Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-deep font-sans text-ink-primary">
      <header className="bg-bg-surface border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-serif italic text-accent-blue tracking-tight">Tensor MedAI</h1>
          </div>
          <nav className="flex items-center gap-8">
            <button 
              onClick={() => setView('dashboard')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                view === 'dashboard' ? "text-accent-blue" : "text-ink-secondary hover:text-ink-primary"
              )}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                view === 'history' ? "text-accent-blue" : "text-ink-secondary hover:text-ink-primary"
              )}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && renderDashboard()}
            {view === 'analysis' && renderAnalysis()}
            {view === 'history' && renderHistory()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-border-subtle mt-12 bg-bg-surface/50 rounded-t-3xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Activity className="w-5 h-5 text-accent-blue" />
            <span className="text-sm font-serif italic text-accent-blue">Tensor MedAI</span>
          </div>
          <div className="max-w-xl">
            <p className="text-[10px] text-ink-secondary text-center md:text-right leading-relaxed">
              <b className="text-accent-amber uppercase tracking-widest mr-1">Medical Disclaimer:</b> 
              This AI-generated summary is for informational purposes only and does not constitute medical advice. Always consult with a licensed physician or healthcare professional before making decisions based on these results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
