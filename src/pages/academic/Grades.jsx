import { useState } from 'react';
import { Award, Search, Save, Filter, BookOpen } from 'lucide-react';

export default function Grades() {
  const [courses, setCourses] = useState([
    { id: 1, name: "Intro to Theology", term: "Term 1 - 2024" },
    { id: 2, name: "Advanced History", term: "Term 1 - 2024" }
  ]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0].id);
  
  const [students, setStudents] = useState([
     { id: 1, name: "Abebe Kebede", student_id: "YNG/001/16", mid: 25, final: 45, assignment: 15 },
     { id: 2, name: "Helen Girma", student_id: "YNG/002/16", mid: 28, final: 48, assignment: 20 },
     { id: 3, name: "Dawit Solomon", student_id: "REG/120/15", mid: 20, final: 35, assignment: 10 },
  ]);

  const handleGradeChange = (id, field, value) => {
     const numVal = value === '' ? '' : Number(value);
     setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: numVal } : s));
  };

  const getLetterGrade = (total) => {
     if (total >= 90) return 'A+';
     if (total >= 85) return 'A';
     if (total >= 80) return 'A-';
     if (total >= 75) return 'B+';
     if (total >= 70) return 'B';
     if (total >= 65) return 'B-';
     if (total >= 60) return 'C+';
     if (total >= 50) return 'C';
     if (total >= 40) return 'D';
     return 'F';
  };

  const getGradeColor = (grade) => {
     if(grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
     if(grade.startsWith('B')) return 'text-brand-600 bg-brand-50 border-brand-200';
     if(grade.startsWith('C')) return 'text-amber-600 bg-amber-50 border-amber-200';
     return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Results</h1>
          <p className="text-slate-500 font-medium mt-1">Manage grading sheets and compute final scores</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all">
          <Save className="w-5 h-5" />
          Publish Grades
        </button>
      </div>

      <div className="glass-panel p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center border-b-[3px] border-b-brand-500">
         <div className="flex items-center gap-3 mr-auto">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Active Course</label>
               <select className="bg-transparent border-none outline-none font-black text-xl text-slate-800 p-0 cursor-pointer hover:text-brand-600 transition-colors" value={selectedCourse} onChange={(e) => setSelectedCourse(Number(e.target.value))}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
         </div>
         <div className="relative w-full sm:w-64">
           <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input type="text" placeholder="Search student..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white outline-none focus:border-brand-500" />
         </div>
         <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 bg-white">
           <Filter className="w-4 h-4" />
         </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-widest font-bold">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4 w-32">Mid Exam <span className="text-slate-400 normal-case tracking-normal ml-1">(30%)</span></th>
              <th className="px-6 py-4 w-32">Assignment <span className="text-slate-400 normal-case tracking-normal ml-1">(20%)</span></th>
              <th className="px-6 py-4 w-32">Final Exam <span className="text-slate-400 normal-case tracking-normal ml-1">(50%)</span></th>
              <th className="px-6 py-4 w-32 text-center">Total Score</th>
              <th className="px-6 py-4 w-24 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => {
               const total = (Number(s.mid)||0) + (Number(s.assignment)||0) + (Number(s.final)||0);
               const letter = getLetterGrade(total);
               return (
                 <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                       <p className="font-bold text-slate-800">{s.name}</p>
                       <p className="text-xs font-semibold text-slate-500">{s.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                       <input 
                         type="number" max="30" min="0" value={s.mid} 
                         onChange={(e) => handleGradeChange(s.id, 'mid', e.target.value)}
                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all" 
                       />
                    </td>
                    <td className="px-6 py-4">
                       <input 
                         type="number" max="20" min="0" value={s.assignment} 
                         onChange={(e) => handleGradeChange(s.id, 'assignment', e.target.value)}
                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all" 
                       />
                    </td>
                    <td className="px-6 py-4">
                       <input 
                         type="number" max="50" min="0" value={s.final} 
                         onChange={(e) => handleGradeChange(s.id, 'final', e.target.value)}
                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all" 
                       />
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-xl font-black text-slate-800">{total}</span>
                       <span className="text-xs font-bold text-slate-400">/100</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-xl font-black ${getGradeColor(letter)}`}>
                         {letter}
                       </span>
                    </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
