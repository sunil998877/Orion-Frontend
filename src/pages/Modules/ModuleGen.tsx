import { useEffect, useState, useMemo } from 'react';
import { useCourseData } from '../../contextAPI/courseAPI';
import { ModuleViewer } from './ModuleViewer';
import { SlideContent } from './SlideContent';
import { Brain, Eye, Loader2, CheckCircle, PanelRightClose, Sparkles, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type ModuleState = {
    id: number;
    Module: string;
    Content: any;
    slide: any;
    isGenerating: boolean;
    isGenerated: boolean;
    error?: string | null;
};

const ModuleGen = ({ enableGenerationActions = false }: { enableGenerationActions?: boolean }) => {
    const { courseData, updateCourseData } = useCourseData();
    const navigate = useNavigate();

    const [selectedModule, setSelectedModule] = useState<ModuleState | null>(null);
    const [modules, setModules] = useState<ModuleState[]>([]);
    const [selectedSlide, setSelectedSlide] = useState<ModuleState | null>(null);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const moduleCredits = useMemo(() => {
        const n = modules.length;
        if (n === 0) return {};

        let credits: number[] = [];
        if (n <= 2) {
            const base = Math.floor(100 / n);
            credits = Array(n).fill(base);
        } else {
            const d = 2; // increment
            const a = (100 - (n * (n - 1) * d) / 2) / n;

            if (a < 5) {
                const base = Math.floor(100 / n);
                credits = Array(n).fill(base);
            } else {
                credits = Array.from({ length: n }, (_, i) => Math.round(a + i * d));
            }
        }

        // Adjust last one to ensure 100%
        const currentSum = credits.reduce((sum, c) => sum + c, 0);
        if (currentSum !== 100 && credits.length > 0) {
            credits[credits.length - 1] += (100 - currentSum);
        }

        const map: Record<number, number> = {};
        modules.forEach((mod, idx) => {
            map[mod.id] = credits[idx];
        });
        return map;
    }, [modules]);

    useEffect(() => {
        const moduleCount = Number.isFinite(courseData.module) && courseData.module > 0 ? courseData.module : 0;
        const initialModules = Array.from({ length: moduleCount }, (_, index) => ({
            id: index + 1,
            Module: `Module ${index + 1}`,
            Content: { Title: '', Objectives: [], TeachingContent: [], CaseStudy: {}, Quizzes: [], VisualDescriptions: [], FurtherStudy: {} },
            slide: { Module: '', Slides: [] },
            isGenerating: false,
            isGenerated: false,
            error: null
        }));
        setModules(initialModules);
    }, [courseData.module]);

    // Poll backend for generated content/slides and update dashboard cards
    useEffect(() => {
        const token = localStorage.getItem('token');
        const courseId = courseData.courseId;
        if (!courseId || modules.length === 0 || !token) return;
        let stopped = false;
        const checkOnce = async () => {
            for (const mod of modules) {
                try {
                    const resp = await fetch(
                        `http://localhost:3000/api/auth/module-contents?courseId=${encodeURIComponent(String(courseId))}&moduleNumber=${mod.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (!resp.ok) continue;
                    const docs = await resp.json();
                    const latest = Array.isArray(docs) && docs.length ? docs[0] : docs;
                    if (latest) {
                        const content = latest?.content && typeof latest.content === 'object' ? latest.content : null;
                        const slidesRaw = latest?.slides;
                        let slides: any = { Module: `Module ${mod.id}`, Slides: [] };
                        if (slidesRaw && Array.isArray(slidesRaw?.Slides)) {
                            slides = { Module: `Module ${mod.id}`, Slides: slidesRaw.Slides };
                        } else if (Array.isArray(slidesRaw)) {
                            slides = { Module: `Module ${mod.id}`, Slides: slidesRaw };
                        } else if (slidesRaw && typeof slidesRaw === 'object') {
                            slides = slidesRaw;
                        }
                        if (content || (Array.isArray(slides.Slides) && slides.Slides.length > 0)) {
                            setModules(prev =>
                                prev.map(m => m.id === mod.id
                                    ? {
                                        ...m,
                                        Content: content || m.Content,
                                        slide: slides || m.slide,
                                        isGenerated: true,
                                        isGenerating: false
                                      }
                                    : m
                                )
                            );
                        }
                    }
                } catch {}
            }
        };
        const interval = setInterval(() => {
            if (!stopped) checkOnce();
        }, 3000);
        // initial run
        checkOnce();
        return () => {
            stopped = true;
            clearInterval(interval);
        };
    }, [courseData.courseId, modules.length]);

    const openContentPreview = async (mod: ModuleState) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(
                `http://localhost:3000/api/auth/module-contents?courseId=${courseData.courseId}&moduleNumber=${mod.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.ok) {
                const docs = await resp.json();
                console.log('[ModuleGen] Fetched module contents:', docs);

                // Handle both response formats: array of modules or single module object
                const latestModule = Array.isArray(docs) && docs.length ? docs[0] : docs;

                // Check if content is nested or direct
                const content = latestModule?.content && typeof latestModule.content === 'object'
                    ? latestModule.content
                    : latestModule;

                if (content) {
                    setSelectedModule({ ...mod, Content: content });
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to fetch module content:", e);
        }

        // 👇 Fallback if nothing in DB yet
        setSelectedModule({
            ...mod,
            Content: {
                Title: `Module ${mod.id}`,
                Objectives: [],
                TeachingContent: [],
                CaseStudy: { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
                Quizzes: [],
                VisualDescriptions: [],
                FurtherStudy: { ExternalLinks: [], BookReferences: [] }
            }
        });
    };

    const openSlidesPreview = async (mod: ModuleState) => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(
                `http://localhost:3000/api/auth/module-contents?courseId=${courseData.courseId}&moduleNumber=${mod.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resp.ok) {
                const docs = await resp.json();
                const latestModule = Array.isArray(docs) && docs.length ? docs[0] : docs;
                const rawSlides = latestModule?.slides ?? latestModule;
                let slides: any = { Module: `Module ${mod.id}`, Slides: [] };
                if (rawSlides && Array.isArray((rawSlides as any).Slides)) {
                    slides = { Module: `Module ${mod.id}`, Slides: (rawSlides as any).Slides };
                } else if (Array.isArray(rawSlides)) {
                    slides = { Module: `Module ${mod.id}`, Slides: rawSlides as any[] };
                } else if (rawSlides && typeof rawSlides === 'object') {
                    slides = rawSlides;
                }
                setSelectedSlide({ ...mod, slide: slides });
                return;
            }
        } catch (e) {
            console.error("Failed to fetch slides:", e);
        }
        setSelectedSlide({
            ...mod,
            slide: { Module: `Module ${mod.id}`, Slides: [] }
        });
    };


    return (
        <div className="space-y-6 mt-8 ">
            <div className="text-left mb-8">
                <div className='flex items-center gap-2'>
                    <Book className="w-12 h-12 text-lime-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Course Modules</h2>
                </div>
                <p className="text-white/70">Generate comprehensive content for each module using Course Creator</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-1">
                {modules.map(mod => (
                    <div key={mod.id} className="rounded-2xl shadow-xl transition-all duration-300 border border-white/10 overflow-hidden bg-slate-900/70 backdrop-blur-sm ring-1 ring-emerald-500/10">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-lime-400 to-emerald-500">
                                        <span className="text-black font-bold text-lg">{mod.id}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            {mod.isGenerated ? mod.Content.Title || `Module ${mod.id}` : `Module ${mod.id}`}
                                        </h3>
                                        <p className="text-sm mt-1 text-white/60">
                                            {mod.isGenerating ? 'Generating...' : mod.isGenerated ? 'Content generated successfully' : 'Ready for content generation'}
                                        </p>
                                    </div>
                                </div>
                                {mod.isGenerated && <CheckCircle className="w-6 h-6 text-green-500" />}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => openContentPreview(mod)} className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl border border-white/10">
                                    <Eye size={16} className="mr-2" /> View Content
                                </button>
                                <button onClick={() => openSlidesPreview(mod)} className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl border border-white/10">
                                    <PanelRightClose size={16} className="mr-2" /> View Slides
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedModule && (
                <ModuleViewer
                    moduleData={selectedModule}
                    onClose={() => setSelectedModule(null)}
                    isRegenerating={selectedModule.isGenerating}
                    credit={moduleCredits[selectedModule.id]}
                    duration={`${courseData.duration.value} ${courseData.duration.unit}`}
                />
            )}

            {selectedSlide && (
                <SlideContent
                    moduleData={selectedSlide}
                    onClose={() => setSelectedSlide(null)}
                    isRegenerating={selectedSlide.isGenerating}
                />
            )}
        </div>
    )
}

export default ModuleGen;
