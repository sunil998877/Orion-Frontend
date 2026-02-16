import React, { useState, useRef, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnimatedBackground from './AnimatedBg';
import {
  GraduationCap,
  User,
  Clock,
  BookOpen,
  Shield,
  Plus,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import ModuleGen from './Modules/ModuleGen';
import { useCourseData } from '../contextAPI/courseAPI';

export const HeroPage: React.FC = () => {
  type Course = {
    _id?: string;
    title: string;
    description?: string;
    audience?: string;
    type?: string;
    module?: number;
    level?: string;
    duration?: { value: number; unit: string };
    country?: string;
    standards?: string;
    createdAt?: string;
  };
  const [view, setView] = useState<'list' | 'details'>('list');
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState<Course>(() => ({
    title: '',
    description: '',
    audience: '',
    type: '',
    module: 0,
    level: '',
    duration: { value: 0, unit: 'hours' },
    country: '',
    standards: '',
    createdAt: ''
  }));

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchParams] = useSearchParams();
  const isSearching = Boolean(searchParams.get('q'));

  const { updateCourseData } = useCourseData();

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const q = searchParams.get('q');
        const url = q
          ? `http://localhost:3000/api/auth/courses/search?q=${encodeURIComponent(q)}`
          : 'http://localhost:3000/api/auth/courses/me';
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          console.log('Fetched courses:', data);
          setCourses(Array.isArray(data) ? data : []);
        } else {
          console.error('Fetch courses failed:', resp.status, resp.statusText);
          const text = await resp.text();
          console.error('Response text:', text);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchCourses();
  }, [searchParams]);

  // Search query is controlled by the top bar component via URL ?q= param

  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCourseClick = (course: Course) => {
    setCourseData(course);
    updateCourseData({
      title: course.title || '',
      description: course.description || '',
      audience: course.audience || '',
      type: course.type || '',
      module: Number(course.module) || 0,
      level: course.level || '',
      duration: {
        value: Number(course.duration?.value) || 0,
        unit: course.duration?.unit || 'hours'
      },
      country: course.country || '',
      standards: course.standards || '',
      courseId: course.courseId || course._id
    });
    setView('details');
  };

  const confirmDelete = async (courseId?: string) => {
    if (!courseId) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const resp = await fetch(`http://localhost:3000/api/auth/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) {
        setShowDelete(false);
        setToDelete(null);
        return;
      }
      const data = await resp.json();
      if (data?.deleted || data?.success) {
        setCourses(prev => prev.filter(c => c._id !== courseId));
        if (courseData._id === courseId) {
          setView('list');
          setCourseData({
            title: '',
            description: '',
            audience: '',
            type: '',
            module: 0,
            level: '',
            duration: { value: 0, unit: 'hours' },
            country: '',
            standards: '',
            createdAt: ''
          });
        }
      }
      setShowDelete(false);
      setToDelete(null);
    } catch { void 0; }
  };

  const openDeleteModal = (course: Course) => {
    setToDelete(course);
    setShowDelete(true);
  };

  const cancelDelete = () => {
    setShowDelete(false);
    setToDelete(null);
  };

  const handleCreateNew = () => {
    sessionStorage.setItem('resetCourseData', 'true');
    // Also explicitly clear local state if needed, but navigation should handle it via CourseCreatorForm's useEffect
    navigate('/create-course');
  };
  const openPreview = (course: Course) => {
    setPreviewCourse(course);
    setShowPreview(true);
  };
  const closePreview = () => {
    setShowPreview(false);
    setPreviewCourse(null);
  };

  return (
    <div className="relative min-h-screen overflow-auto">
      <AnimatedBackground />
      <ToastContainer />
      <main className="px-6 py-8">

        {view === 'list' ? (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Course Dashboard</h1>
              <p className="text-white/60">Manage your courses and track progress</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCourseClick(c)}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-lime-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center shadow-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70">
                          {c.level || 'Beginner'}
                        </div>
                        <button
                          type="button"
                          aria-label="Delete course"
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(c); }}
                          className="p-2 rounded-full bg-white/10 hover:bg-red-600/80 text-white border border-white/10 hover:border-red-500/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2 h-10">
                      {c.description || 'No description available.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/50 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{c.module || 0} Modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{c.duration?.value || 0} {c.duration?.unit || 'hours'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!courses.length && (
                isSearching ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center p-8 rounded-2xl text-white">
                    <p>there is no such course available</p>
                  </div>
                ) : (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-8 border border-white/10 rounded-2xl bg-white/5 text-white/70">
                    <GraduationCap className="w-8 h-8 mb-2 text-white/60" />
                    <p className="mb-4">No courses yet</p>
                  </div>
                )
              )}

              {/* Create New Course Card */}
              {!isSearching && (
                <button
                  onClick={handleCreateNew}
                  className="group relative flex flex-col items-center justify-center h-full min-h-[240px] border-2 border-dashed border-white/10 rounded-2xl hover:border-lime-500/50 hover:bg-white/5 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-lime-500/20">
                    <Plus className="w-8 h-8 text-white/40 group-hover:text-lime-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white/60 group-hover:text-white transition-colors">
                    Create New Course
                  </h3>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-fadeInUp">
              <div className="relative p-8 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0a0f1a] to-black" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center hover:-translate-y-1 hover:bg-white/20 transition">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-white/80">Basic</span>
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-semibold mb-2">
                    {courseData.title || 'Frontend development'}
                  </h2>

                  <p className="text-white/80 w-full mb-8">
                    {courseData.description}
                  </p>

                  {/* INFO CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                      { icon: User, label: 'Audience', value: courseData.audience },
                      {
                        icon: Clock,
                        label: 'Duration',
                        value: `${courseData.duration?.value} ${courseData.duration?.unit}`,
                      },
                      {
                        icon: BookOpen,
                        label: 'Modules',
                        value: `${courseData.module} Modules`,
                      },
                      {
                        icon: Shield,
                        label: 'Standards',
                        value: courseData.standards,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-white/10 p-4 rounded-lg hover:bg-white/20 hover:-translate-y-1 transition"
                      >
                        <item.icon className="w-5 h-5 opacity-80" />
                        <div>
                          <p className="text-xs uppercase text-white/70">
                            {item.label}
                          </p>
                          <p className="font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* MODULES */}
            <section className="mt-16">
              <div className="bg-black/50 border border-white/10 rounded-2xl p-6 shadow-lg ring-1 ring-lime-400/10">
                <ModuleGen />
              </div>
            </section>
          </div>
        )}
      </main>
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold">Delete Course</h3>
            </div>
            <p className="text-white/70 mb-6">
              {toDelete?.title ? `Delete "${toDelete.title}"?` : 'Delete this course?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md border border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(toDelete?._id)}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
