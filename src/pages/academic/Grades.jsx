import { useEffect, useMemo, useState } from 'react';
import { Award, Search, Filter, BookOpen } from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function Grades() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [courseRes, gradeRes] = await Promise.all([
        academicService.getCourses({ per_page: 100 }),
        academicService.getGrades({ per_page: 500 }),
      ]);
      const courseRows = Array.isArray(courseRes?.data) ? courseRes.data : (Array.isArray(courseRes) ? courseRes : []);
      const gradeRows = Array.isArray(gradeRes?.data) ? gradeRes.data : (Array.isArray(gradeRes) ? gradeRes : []);
      setCourses(courseRows);
      setGrades(gradeRows);
      if (courseRows[0]) setSelectedCourse(String(courseRows[0].id));
    };
    fetchData();
  }, []);

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

  const studentRows = useMemo(() => {
    const byStudent = {};
    grades.forEach((g) => {
      if (selectedCourse && String(g.course_id) !== selectedCourse) return;
      const sid = g.student_id;
      if (!byStudent[sid]) {
        byStudent[sid] = {
          student_id: sid,
          name: g.student?.name || `Student ${sid}`,
          identifier: g.student?.student_id || sid,
          courses: [],
        };
      }
      byStudent[sid].courses.push(g);
    });

    return Object.values(byStudent).map((s) => {
      const total = s.courses.reduce((acc, c) => acc + Number(c.total_score || c.score || 0), 0);
      const avg = s.courses.length ? total / s.courses.length : 0;
      return { ...s, overallAverage: avg, grade: getLetterGrade(avg) };
    }).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [grades, selectedCourse, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Results</h1>
          <p className="text-slate-500 font-medium mt-1">View student scores per course and overall averages</p>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center border-b-[3px] border-b-brand-500">
         <div className="flex items-center gap-3 mr-auto">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Active Course</label>
               <select className="bg-transparent border-none outline-none font-black text-xl text-slate-800 p-0 cursor-pointer hover:text-brand-600 transition-colors" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
         </div>
         <div className="relative w-full sm:w-64">
           <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input type="text" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white outline-none focus:border-brand-500" />
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
              <th className="px-6 py-4 w-32 text-center">Overall Average</th>
              <th className="px-6 py-4 w-24 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentRows.map(s => {
               const letter = getLetterGrade(s.overallAverage);
               const latest = s.courses[0] || {};
               return (
                 <tr key={s.student_id} onClick={() => setSelectedStudent(s)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                       <p className="font-bold text-slate-800">{s.name}</p>
                       <p className="text-xs font-semibold text-slate-500">{s.identifier}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{latest.mid_exam ?? "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{latest.assignment ?? "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{latest.final_exam ?? "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-xl font-black text-slate-800">{s.overallAverage.toFixed(1)}</span>
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
      {selectedStudent && (
        <div className="glass-panel p-5">
          <h3 className="text-lg font-bold mb-3">Student Assessment Detail - {selectedStudent.name}</h3>
          <div className="space-y-2">
            {selectedStudent.courses.map((c) => (
              <div key={c.id} className="flex justify-between p-3 rounded-lg bg-slate-50 text-sm">
                <span>{c.course?.name || c.course?.title || `Course ${c.course_id}`}</span>
                <span className="font-semibold">{Number(c.total_score || c.score || 0).toFixed(1)}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
