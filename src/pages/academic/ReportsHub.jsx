import { useState } from 'react';
import { FileDown, Users, CheckSquare, Award, ArrowRight, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { reportingService } from '../../services/reportingService';

export default function ReportsHub() {
  const [loading, setLoading] = useState('');
  
  const handleExport = async (type) => {
    setLoading(type);
    try {
      await reportingService.exportCSV(type);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading('');
    }
  };

  const reports = [
    {
      id: 'students',
      title: 'Student Roster',
      desc: 'Complete list of students in the Young program with verification status and section assignments.',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'grades',
      title: 'Academic Results',
      desc: 'Consolidated grade sheet across all sections and courses including assessment weights.',
      icon: Award,
      color: 'bg-brand-50 text-brand-600',
    },
    {
      id: 'attendance',
      title: 'Attendance Logs',
      desc: 'Chronological list of presence records across academic and mezmur sessions.',
      icon: CheckSquare,
      color: 'bg-amber-50 text-amber-600',
    }
  ];

  return (
    <div className="space-y-8 animate-[fade-in_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Reports & Exports</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">
            Generate archival data and administrative spreadsheets
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
           <FileDown className="w-6 h-6 text-brand-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reports.map((report) => (
          <div key={report.id} className="glass-panel p-10 flex flex-col justify-between group hover:border-brand-200 transition-all">
            <div>
              <div className={`w-14 h-14 rounded-2xl ${report.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                 <report.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">{report.title}</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">{report.desc}</p>
            </div>
            
            <button
              onClick={() => handleExport(report.id)}
              disabled={loading === report.id}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                loading === report.id 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-slate-900 text-white hover:bg-brand-600 shadow-xl shadow-slate-200'
              }`}
            >
              {loading === report.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-slate-400"></div>
              ) : (
                <><Download className="w-4 h-4" /> Download CSV</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-brand-50 border border-brand-100 rounded-[2rem] p-8 flex items-start gap-4">
         <div className="p-2 bg-white rounded-xl shadow-sm border border-brand-100">
            <AlertCircle className="w-5 h-5 text-brand-600" />
         </div>
         <div>
            <h4 className="font-black text-brand-900 text-sm uppercase tracking-wide mb-1">Data Privacy Notice</h4>
            <p className="text-brand-700/80 text-sm font-medium leading-relaxed max-w-2xl">
              Reports contain sensitive student information including contact details and academic standings. 
              Always handle exported documents according to the church's data security guidelines. 
              Exports are logged in the system audit trail.
            </p>
         </div>
      </div>
    </div>
  );
}
