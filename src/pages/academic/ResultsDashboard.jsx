import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, FileText, Search, Filter, Download, X, Printer, BookOpen } from 'lucide-react';
import { resultsService } from '../../services/resultsService';
import { sectionService } from '../../services/sectionService';

export default function ResultsDashboard() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Report Card State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await sectionService.getSections(1, "", "");
        // Only show sections belonging to Young track
        setSections(data.data?.filter(s => s.program_type?.name === 'Young') || []);
        if (data.data?.length > 0) setSelectedSection(data.data[0].id);
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    };
    fetchSections();
  }, []);

  const fetchRankings = async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const data = await resultsService.getSectionRankings(selectedSection);
      setRankings(data || []);
    } catch (err) {
      console.error("Failed to load rankings", err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedSection]);

  const handleViewReport = async (studentId) => {
    setReportModalOpen(true);
    setReportLoading(true);
    try {
      const data = await resultsService.getStudentReport(studentId);
      setSelectedStudentReport(data);
    } catch (err) {
      alert("Failed to load student report");
    } finally {
      setReportLoading(false);
    }
  };

  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3, 10);

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             <Trophy className="w-8 h-8 text-amber-500" />
             Section Rankings
          </h1>
          <p className="text-slate-500 font-medium mt-1">Performance leaderboard for the Young Program sections</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
           <Filter className="w-4 h-4 text-slate-400 ml-2" />
           <select 
             value={selectedSection}
             onChange={(e) => setSelectedSection(e.target.value)}
             className="bg-transparent border-none outline-none font-bold text-slate-700 min-w-[180px] cursor-pointer"
           >
             <option value="">Select Section</option>
             {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {rankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-10">
           {/* 2nd Place */}
           {top3[1] && (
             <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleViewReport(top3[1].id)}>
                <div className="relative mb-4">
                   <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-xl border-4 border-white transition-transform group-hover:scale-110">
                      <Medal className="w-12 h-12" />
                   </div>
                   <div className="absolute -top-2 -right-2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg">2</div>
                </div>
                <div className="text-center">
                   <p className="font-black text-slate-800 text-lg leading-tight">{top3[1].name}</p>
                   <p className="text-brand-600 font-black text-xl">{top3[1].overall_average}%</p>
                </div>
                <div className="w-full h-32 bg-slate-100 mt-6 rounded-t-3xl border-x border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center">
                   <span className="text-slate-300 font-black text-4xl">II</span>
                </div>
             </div>
           )}

           {/* 1st Place */}
           {top3[0] && (
             <div className="flex flex-col items-center order-first md:order-none group cursor-pointer" onClick={() => handleViewReport(top3[0].id)}>
                <div className="relative mb-6">
                   <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-2xl border-4 border-white transition-transform group-hover:scale-110">
                      <Trophy className="w-16 h-16" />
                   </div>
                   <div className="absolute -top-3 -right-3 bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-xl text-lg">1</div>
                   <Star className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-400 w-8 h-8 animate-pulse" />
                </div>
                <div className="text-center mb-4">
                   <p className="font-black text-slate-900 text-2xl leading-tight">{top3[0].name}</p>
                   <p className="text-amber-600 font-extrabold text-3xl">{top3[0].overall_average}%</p>
                </div>
                <div className="w-full h-48 bg-gradient-to-b from-amber-500 to-amber-600 rounded-t-3xl shadow-2xl flex items-center justify-center">
                   <span className="text-amber-200/50 font-black text-6xl">I</span>
                </div>
             </div>
           )}

           {/* 3rd Place */}
           {top3[2] && (
             <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleViewReport(top3[2].id)}>
                <div className="relative mb-4">
                   <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 shadow-xl border-4 border-white transition-transform group-hover:scale-110">
                      <Medal className="w-10 h-10" />
                   </div>
                   <div className="absolute -top-1 -right-1 bg-orange-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg text-sm">3</div>
                </div>
                <div className="text-center">
                   <p className="font-black text-slate-800 text-base leading-tight">{top3[2].name}</p>
                   <p className="text-orange-600 font-black text-lg">{top3[2].overall_average}%</p>
                </div>
                <div className="w-full h-24 bg-orange-50 mt-6 rounded-t-3xl border-x border-t border-orange-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center">
                   <span className="text-orange-200 font-black text-3xl">III</span>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Rankings List (Top 4 to 10) */}
      <div className="max-w-4xl mx-auto glass-panel overflow-hidden border-slate-200">
         <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
               <Layers className="w-4 h-4 text-brand-600" />
               Complete Leaderboard
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Top 10 Performers</span>
         </div>
         <div className="divide-y divide-slate-100">
            {loading ? (
               <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Calculating Ranks...</div>
            ) : rankings.length === 0 ? (
               <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No records for this section</div>
            ) : (
               others.map((s, idx) => (
                  <div key={s.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-6">
                        <span className="w-8 font-black text-slate-300 text-xl italic">{idx + 4}</span>
                        <div>
                           <p className="font-black text-slate-800">{s.name}</p>
                           <p className="text-[10px] font-bold text-slate-400">{s.student_id}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <p className="text-lg font-black text-slate-700 tracking-tight">{s.overall_average}%</p>
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="bg-brand-500 h-full rounded-full" style={{width: `${s.overall_average}%`}}></div>
                           </div>
                        </div>
                        <button 
                           onClick={() => handleViewReport(s.id)}
                           className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-200 shadow-sm transition-all hover:-translate-y-0.5"
                        >
                           <FileText className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Report Card Modal */}
      {reportModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl transform animate-[slide-up_0.3s_ease-out] flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-start shrink-0">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                        <FileText className="w-8 h-8" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-slate-800 leading-none mb-2">Student Report Card</h2>
                        <p className="text-sm font-bold text-brand-600 uppercase tracking-widest">{selectedStudentReport?.student?.name || "Loading..."}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all">
                        <Printer className="w-4 h-4" /> Print
                     </button>
                     <button onClick={() => setReportModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
               </div>

               {/* Modal Body */}
               <div className="p-10 overflow-y-auto custom-scrollbar">
                  {reportLoading ? (
                     <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">Generating transcript...</div>
                  ) : (
                     <div className="space-y-10">
                        {/* Overall Average Panel */}
                        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-xl">
                           <div className="mb-6 md:mb-0">
                              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Cumulative Performance</p>
                              <h4 className="text-4xl font-black tracking-tighter">Academic Year 2024</h4>
                           </div>
                           <div className="flex items-center gap-8 px-10 py-6 bg-white/10 rounded-2xl border border-white/10">
                              <div className="text-center">
                                 <p className="text-[10px] font-black uppercase text-brand-400 mb-1">Overall Avg</p>
                                 <p className="text-4xl font-black">{selectedStudentReport?.overall_average}%</p>
                              </div>
                              <div className="w-px h-12 bg-white/20"></div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black uppercase text-amber-400 mb-1">Decision</p>
                                 <p className="text-2xl font-black uppercase tracking-widest text-green-400">Promoted</p>
                              </div>
                           </div>
                        </div>

                        {/* Subject Breakdowns */}
                        <div>
                           <h5 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-brand-600" />
                              Course Performance Details
                           </h5>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedStudentReport?.courses?.map(course => (
                                 <div key={course.course_id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg hover:border-brand-200 transition-all">
                                    <div className="flex-1">
                                       <p className="font-black text-slate-800 text-lg group-hover:text-brand-700 transition-colors">{course.course_name}</p>
                                       <div className="flex items-center gap-3 mt-2">
                                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                             <div className="bg-brand-500 h-full rounded-full" style={{width: `${course.course_percentage}%`}}></div>
                                          </div>
                                          <span className="text-xs font-black text-slate-500">{course.course_percentage}%</span>
                                       </div>
                                    </div>
                                    <div className="ml-8 text-right">
                                       <span className="inline-flex px-3 py-1 bg-white rounded-lg border border-slate-200 text-lg font-black text-slate-800">
                                          {course.course_percentage >= 50 ? 'P' : 'F'}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Report Generation ID: {Date.now()} • MGT Systems Young Program</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
