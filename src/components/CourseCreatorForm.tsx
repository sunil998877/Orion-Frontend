import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Upload,
  FileText,
  Layers,
  Target,
  Globe,
  Zap,
  RefreshCw,
  Sparkles,
  BookOpen,
  Monitor,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCourseData } from '../contextAPI/courseAPI';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';
import logo5 from '../assests/logo5.png';
import { ModuleViewer } from '../pages/Modules/ModuleViewer';
import { SlideContent } from '../pages/Modules/SlideContent';
import type { ModuleState } from '../pages/Modules/ModuleGen';

type PreviewLesson = { id: string; title: string };
type PreviewModule = { id: number; title: string; lessons: PreviewLesson[] };

const CourseCreatorForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showValidation, setShowValidation] = useState(false);
  const { courseData, updateCourseData, resetCourseData } = useCourseData();
  const [formStatus] = useState<'draft' | 'editing' | 'preview' | 'outcomes' | 'submitting' | 'success'>('editing');
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isBlueprinting, setIsBlueprinting] = useState(false);
  const [hasBlueprint, setHasBlueprint] = useState(false);
  const [previewModules, setPreviewModules] = useState<PreviewModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<ModuleState | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<ModuleState | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [prefetchedContentMap, setPrefetchedContentMap] = useState<Record<number, any>>({});
  const [prefetchedSlidesMap, setPrefetchedSlidesMap] = useState<Record<number, any>>({});

  const moduleCredits = React.useMemo(() => {
    const n = previewModules.length;
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
    if (currentSum !== 100) {
      credits[credits.length - 1] += (100 - currentSum);
    }
    
    const map: Record<number, number> = {};
    previewModules.forEach((mod, idx) => {
      map[mod.id] = credits[idx];
    });
    return map;
  }, [previewModules]);

  const navigate = useNavigate();
  const totalSteps = 5;

  useEffect(() => {
    return () => setSavedCourseId(null);
  }, []);

  useEffect(() => {
    const shouldReset = sessionStorage.getItem('resetCourseData') === 'true';
    if (shouldReset) {
      resetCourseData();
      setSavedCourseId(null);
      sessionStorage.removeItem('resetCourseData');
    }
  }, [resetCourseData]);

  useEffect(() => {
    const updates: any = {};
    if (!courseData.type) updates.type = 'Professional Development';
    if (!courseData.standards) updates.standards = 'Global (ISO/Generic)';
    if (!courseData.level) updates.level = 'Beginner';
    // Use a case-insensitive check to avoid infinite loops and unnecessary updates
    if (!courseData.duration?.unit || courseData.duration.unit.toLowerCase() === 'hours') {
      if (courseData.duration?.unit !== 'Hours') {
        updates.duration = { ...courseData.duration, unit: 'Hours' };
      }
    }
    if (Object.keys(updates).length > 0) updateCourseData(updates);
  }, [
    courseData.type,
    courseData.standards,
    courseData.level,
    courseData.duration?.unit,
    updateCourseData
  ]);

  const goToNextStep = async () => {
    const complete = isStepComplete(step);

    if (!complete) {
      setShowValidation(true);
      if (step === 1) {
        if (!courseData.title?.trim()) {
          toast.warn("Please enter a course title.");
        } else if (!courseData.audience?.trim()) {
          toast.warn("Please specify your target audience.");
        } else if (courseData.standards === 'Regional (EU/US Standards)' && !courseData.country) {
          toast.warn("Please select a specific region/country.");
        }
      } else if (step === 2) {
        const wordCount = courseData.description?.trim().split(/\s+/).filter(Boolean).length || 0;
        if (!courseData.description?.trim() || wordCount < 50) {
          toast.warn("Description must be at least 50 words.");
        } else if (!courseData.duration?.value || courseData.duration.value <= 0) {
          toast.warn("Please set a valid course duration.");
        } else if (!courseData.module || courseData.module <= 0) {
          toast.warn("Please specify at least one module to generate.");
        }
      } else if (step === 4) {
        if (previewModules.length === 0) {
          toast.warn("Please generate modules before continuing.");
        }
      }
      return;
    }

    setShowValidation(false);
    if (step < totalSteps) {
      const nextStep = step + 1;

      // When moving from step 1 to 2, auto-generate description from step 1 inputs
      if (step === 1 && nextStep === 2) {
        setIsGeneratingDescription(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }
          const resp = await fetch('http://localhost:3000/api/auth/generate-course-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              courseData: {
                title: courseData.title,
                audience: courseData.audience,
                type: courseData.type,
                standards: courseData.standards,
                country: courseData.country
              }
            })
          });
          if (resp.ok) {
            const { description } = await resp.json();
            if (description) {
              updateCourseData({ description });
              toast.success('Description generated automatically.');
            }
          } else {
            toast.error('Could not generate description. You can fill it manually.');
          }
        } catch {
          toast.error('Could not generate description. You can fill it manually.');
        } finally {
          setIsGeneratingDescription(false);
        }
      }

      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    setShowValidation(false);
    if (step > 1) {
      setStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteDraft = () => {
    const ok = window.confirm('Clear this course form?');
    if (!ok) return;
    resetCourseData();
    sessionStorage.removeItem('resetCourseData');
    setShowValidation(false);
    setStep(1);
  };

  const buildPreviewModules = (content: any): PreviewModule[] => {
    // console.log('[DEBUG] buildPreviewModules called with content:', content);
    const fallbackLessons = [
      { id: 'l1', title: 'Core Concepts & Theoretical Framework' },
      { id: 'l2', title: 'Industry Best Practices' },
      { id: 'l3', title: 'Interactive Case Study' }
    ];

    // Try to find the modules array in various possible locations
    let modules: any[] = [];
    if (Array.isArray(content)) {
      // console.log('[DEBUG] content is array');
      modules = content;
    } else if (content && Array.isArray(content.modules)) {
      // console.log('[DEBUG] content.modules is array');
      modules = content.modules;
    } else if (content && typeof content === 'object') {
      // console.log('[DEBUG] content is object, searching for array property');
      // Look for any array property if 'modules' isn't found
      const arrays = Object.values(content).filter(val => Array.isArray(val));
      if (arrays.length > 0) {
        // console.log('[DEBUG] found array in object property');
        modules = arrays[0] as any[];
      }
    }
    
    // Respect the user-requested module count even if the AI returns more
    const requestedCount = Number.isFinite(courseData.module) && courseData.module > 0
      ? courseData.module
      : (Array.isArray(modules) ? modules.length : 0);
    if (Array.isArray(modules) && modules.length > requestedCount) {
      modules = modules.slice(0, requestedCount);
    }
    
    if (modules.length === 0) {
      console.log('[DEBUG] No modules found, using fallback. count:', courseData.module);
      const count = Number.isFinite(courseData.module) && courseData.module > 0 ? courseData.module : 4;
      return Array.from({ length: count }).map((_, i) => ({
        id: i + 1,
        title: courseData.title ? `${courseData.title} Foundations` : 'Course Foundations',
        lessons: fallbackLessons
      }));
    }

    // console.log('[DEBUG] Mapping modules. count:', modules.length);
    return modules.map((mod: any, i: number) => {
      // Handle case where mod might be a string
      if (typeof mod === 'string') {
        return {
          id: i + 1,
          title: mod.replace(/^Module\s+\d+[:\-\s]*/i, ''),
          lessons: fallbackLessons
        };
      }

      // Extract title from various possible fields
      const rawTitle = mod.ModuleTitle || mod.title || mod.Title || `Module ${i + 1}`;
      
      // Remove "Module X: " prefix using regex
      const cleanTitle = String(rawTitle).replace(/^Module\s+\d+[:\-\s]*/i, '');

      const lessonsSource = mod.LessonTitles || mod.lessons || mod.Lessons;
      // console.log(`[DEBUG] mod ${i} lessons source:`, lessonsSource);

      return {
        id: i + 1,
        title: cleanTitle || `Module ${i + 1}`,
        lessons: Array.isArray(lessonsSource) && lessonsSource.length > 0
          ? lessonsSource.map((l: any, idx: number) => ({ 
              id: `l${idx + 1}`, 
              title: typeof l === 'string' ? l : (l.title || `Lesson ${idx + 1}`) 
            }))
          : fallbackLessons
      };
    });
  };

  const generateOrionPreview = async () => {
    setIsBlueprinting(true);
    setHasBlueprint(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const moduleCount = Number(courseData.module) || 0;
      // Generate in memory only (draft) — nothing saved until user clicks "Launch Course"
      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        audience: courseData.audience,
        level: courseData.level,
        standards: courseData.standards,
        country: courseData.country
      };

      toast.info('Generating content (draft, not saved yet)…');

      const contentMap: Record<number, any> = {};
      const slidesMap: Record<number, any> = {}; // ========== SLIDE GENERATION COMMENTED OUT – backend returns empty slides
      const preview: PreviewModule[] = [];

      for (let i = 1; i <= moduleCount; i++) {
        const resp = await fetch('http://localhost:3000/api/auth/generate-module-draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            courseData: coursePayload,
            moduleNumber: i
          })
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.message || `Module ${i} generation failed`);
        }

        const { content } = await resp.json();
        const id = i;
        const nc = content ? normalizeModuleContent(content, id) : null;
        if (nc) contentMap[id] = nc;
        // ========== SLIDE GENERATION COMMENTED OUT (slides not used) ==========

        const title = nc?.Title || content?.Title || content?.title || `Module ${id}`;
        const tc = nc?.TeachingContent || content?.TeachingContent || [];
        const lessons: PreviewLesson[] = Array.isArray(tc) && tc.length > 0
          ? tc.map((t: any, idx: number) => ({
              id: `l${idx + 1}`,
              title: String(t.Topics || t.title || `Lesson ${idx + 1}`).trim()
            }))
          : (Array.isArray(nc?.Objectives) ? nc.Objectives : []).slice(0, 5).map((obj: any, idx: number) => ({
              id: `l${idx + 1}`,
              title: String(obj).slice(0, 80)
            }));
        preview.push({
          id,
          title: String(title).trim() || `Module ${id}`,
          lessons: lessons.length > 0 ? lessons : [{ id: 'l1', title: 'Overview' }]
        });
      }

      setPrefetchedContentMap(prev => ({ ...prev, ...contentMap }));
      setPrefetchedSlidesMap(prev => ({ ...prev, ...slidesMap }));
      setPreviewModules(preview);
      setHasBlueprint(true);
      toast.success('Draft ready (content only; slide generation is commented out). Click "Launch Course" to save.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsBlueprinting(false);
    }
  };

  const regenerateSingleModule = async (moduleId: number) => {
    setIsPreviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        audience: courseData.audience,
        level: courseData.level,
        standards: courseData.standards,
        country: courseData.country
      };

      const resp = await fetch('http://localhost:3000/api/auth/generate-module-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseData: coursePayload,
          moduleNumber: moduleId
        })
      });

      if (!resp.ok) {
        toast.error('Failed to regenerate module');
        return;
      }

      const { content } = await resp.json();
      const nc = content ? normalizeModuleContent(content, moduleId) : null;
      if (nc) setPrefetchedContentMap(prev => ({ ...prev, [moduleId]: nc }));
      // ========== SLIDE GENERATION COMMENTED OUT ==========

      const title = nc?.Title || content?.Title || content?.title || `Module ${moduleId}`;
      const tc = nc?.TeachingContent || content?.TeachingContent || [];
      const lessons: PreviewLesson[] = Array.isArray(tc) && tc.length > 0
        ? tc.map((t: any, idx: number) => ({
            id: `l${idx + 1}`,
            title: String(t.Topics || t.title || `Lesson ${idx + 1}`).trim()
          }))
        : (Array.isArray(nc?.Objectives) ? nc.Objectives : []).slice(0, 5).map((obj: any, idx: number) => ({
            id: `l${idx + 1}`,
            title: String(obj).slice(0, 80)
          }));

      setPreviewModules(prev =>
        prev.map(m => m.id === moduleId ? { ...m, title: String(title).trim() || m.title, lessons: lessons.length > 0 ? lessons : m.lessons } : m)
      );
      toast.success(`Module ${moduleId} regenerated (content only; slide gen commented out). Save with "Launch Course".`);
    } catch (err) {
      toast.error('Regeneration failed');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const normalizeModuleContent = (input: any, moduleId: number) => {
    if (!input || typeof input !== 'object') return null;
    const Title = String(input.Title || input.title || `Module ${moduleId}`);
    const Objectives = Array.isArray(input.Objectives)
      ? input.Objectives
      : Array.isArray(input.objectives) ? input.objectives : [];
    const TeachingContent = Array.isArray(input.TeachingContent)
      ? input.TeachingContent
      : Array.isArray(input.teachingContent)
        ? input.teachingContent.map((tc: any) => ({
            Topics: tc.Topics || tc.title || '',
            StandardsReference: tc.StandardsReference || tc.standard || 'AI Generated',
            ContentPoints: Array.isArray(tc.ContentPoints)
              ? tc.ContentPoints
              : Array.isArray(tc.points)
                ? tc.points
                : (tc.description ? [tc.description] : [])
          }))
        : [];
    let CaseStudy = input.CaseStudy;
    if (!CaseStudy && input.caseStudy) {
      const cs = input.caseStudy;
      const questions = Array.isArray(cs.questions) ? cs.questions : [];
      const qTexts = questions.map((q: any) => q?.question || String(q));
      const answers = questions.map((q: any) => q?.modelAnswer || '');
      CaseStudy = {
        CaseStudyDescription: cs.description || cs.title || '',
        Questions: qTexts,
        ModelAnswers: answers
      };
    }
    let Quizzes = Array.isArray(input.Quizzes) ? input.Quizzes : null;
    if (!Quizzes && input.quizzes) {
      const qz = input.quizzes;
      const qs = Array.isArray(qz.questions) ? qz.questions : [];
      Quizzes = [{
        QuizDescription: qz.title || 'Module Quiz',
        Questions: qs.map((q: any) => q?.question || ''),
        Answers: qs.map((q: any) => q?.answer || '')
      }];
    }
    let VisualDescriptions = Array.isArray(input.VisualDescriptions) ? input.VisualDescriptions : null;
    if (!VisualDescriptions && input.visualDescriptions) {
      const vd = Array.isArray(input.visualDescriptions) ? input.visualDescriptions : [];
      VisualDescriptions = vd.map((v: any) => {
        if (typeof v === 'string') return v;
        return v?.description || v?.title || v?.link || v?.content || '';
      }).filter(Boolean);
    }
    // Handle case where visualDescriptions might be an object with items array
    if (!VisualDescriptions && input.visualDescriptions && typeof input.visualDescriptions === 'object' && !Array.isArray(input.visualDescriptions)) {
      const vdObj = input.visualDescriptions;
      if (Array.isArray(vdObj.items)) {
        VisualDescriptions = vdObj.items.map((v: any) => v?.description || v?.title || v?.link || v?.content || '').filter(Boolean);
      } else if (vdObj.description || vdObj.title || vdObj.link) {
        VisualDescriptions = [vdObj.description || vdObj.title || vdObj.link || ''];
      }
    }
    // Final fallback if still null
    if (VisualDescriptions === null) {
      VisualDescriptions = [];
    }
    let FurtherStudy = input.FurtherStudy;
    if (!FurtherStudy) {
      const ext = Array.isArray(input.externalLinks) ? input.externalLinks : [];
      const books = Array.isArray(input.bookReferences) ? input.bookReferences : [];
      FurtherStudy = {
        ExternalLinks: ext.map((e: any) => e?.url || e).filter(Boolean),
        BookReferences: books.map((b: any) => {
          if (typeof b === 'string') return b;
          const parts = [b?.title, b?.author, b?.publisher, b?.year].filter(Boolean);
          return parts.join(' - ');
        })
      };
    }
    return {
      Title,
      Objectives,
      TeachingContent,
      CaseStudy: CaseStudy || { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
      Quizzes: Quizzes || [],
      VisualDescriptions: VisualDescriptions || [],
      FurtherStudy: FurtherStudy || { ExternalLinks: [], BookReferences: [] }
    };
  };
 
//  const prefetchModulesData = async (mods: Array<{ id: number }>) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         navigate('/login');
//         return;
//       }
//       const moduleCount = Number.isFinite(courseData.module) && courseData.module > 0 ? courseData.module : 0;
//       const safeMods = Array.isArray(mods) && moduleCount > 0 ? mods.slice(0, moduleCount) : mods;
//       let courseId = savedCourseId || courseData.courseId;
//       if (!courseId) {
//         const courseResp = await fetch('http://localhost:3000/api/auth/courses', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//           body: JSON.stringify({ courseData })
//         });
//         if (courseResp.status === 401 || courseResp.status === 403) {
//           localStorage.removeItem('token');
//           toast.error('Session expired. Please login again.');
//           navigate('/login');
//           return;
//         }
//         if (!courseResp.ok) {
//           const errData = await courseResp.json().catch(() => ({}));
//           throw new Error(errData.message || 'Failed to save course');
//         }
//         const courseResult = await courseResp.json();
//         courseId = courseResult.course?.courseId;
//         if (!courseId) return;
//         setSavedCourseId(courseId);
//         updateCourseData({ courseId });
//       }
//       for (const mod of safeMods) {
//         const bodyPrompt: any = {
//           prompt1: `Create detailed content for Module [${mod.id}] of the course titled "${courseData.title}". Audience: "${courseData.audience}". Course type: "${courseData.type}". Standards: "${courseData.standards}". Description: "${courseData.description}". Include objectives, teaching content with standards references, a case study with questions and model answers, quizzes with questions and answers, visual descriptions, and relevant external links or book references for further study. Respond ONLY with a valid JSON object matching the expected module content schema.`,
//           prompt2: `Create detailed slide prompts for Module [${mod.id}] of the course titled "${courseData.title}". Audience: "${courseData.audience}". Course type: "${courseData.type}". Standards: "${courseData.standards}". Description: "${courseData.description}". After prompts, generate a friendly voiceover script for each slide. Respond ONLY with a valid JSON object matching the expected slides schema.`
//         };
//         try {
//           const chatResp = await fetch('http://localhost:3000/api/auth/chat', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//             body: JSON.stringify(bodyPrompt)
//           });
//           if (chatResp.status === 401 || chatResp.status === 403) {
//             localStorage.removeItem('token');
//             toast.error('Session expired. Please login again.');
//             navigate('/login');
//             return;
//           }
//           if (!chatResp.ok) {
//             continue;
//           }
//           const result = await chatResp.json();
//           let content = result && typeof result.reply1 === 'object' ? result.reply1 : null;
//           let slides = result && typeof result.reply2 === 'object' ? result.reply2 : null;
//           if (content && !content.Title && content.rawText) {
//             content = {
//               Title: `Module ${mod.id}`,
//               Objectives: [],
//               TeachingContent: [
//                 {
//                   Topics: "Generated Module Content",
//                   StandardsReference: "AI Generated",
//                   ContentPoints: [content.rawText]
//                 }
//               ],
//               CaseStudy: {
//                 CaseStudyDescription: "",
//                 Questions: [],
//                 ModelAnswers: []
//               },
//               Quizzes: [],
//               VisualDescriptions: [],
//               FurtherStudy: {
//                 ExternalLinks: [],
//                 BookReferences: []
//               }
//             };
//           } else if (content && !content.Title) {
//             content = normalizeModuleContent(content, mod.id);
//           }
//           if (content) {
//             content = normalizeModuleContent(content, mod.id);
//           }
//           if (content) {
//             setPrefetchedContentMap(prev => ({ ...prev, [mod.id]: content }));
//           }
//           if (slides && !slides.Slides && slides.rawText) {
//             slides = {
//               Module: `Module ${mod.id}`,
//               Slides: [
//                 {
//                   SlideNumber: 1,
//                   title: "Generated Slide Content",
//                   Subtitle: "",
//                   VisualPrompt: "",
//                   Content: slides.rawText,
//                   SpeakerNotes: ""
//                 }
//               ]
//             };
//           }
//           if (slides) {
//             setPrefetchedSlidesMap(prev => ({ ...prev, [mod.id]: slides }));
//           }
//           const payload: any = { courseId, moduleNumber: mod.id };
//           if (content) payload.content = content;
//           if (slides) payload.slides = slides;
//           if (payload.content || payload.slides) {
//             await fetch('http://localhost:3000/api/auth/module-contents', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//               body: JSON.stringify(payload)
//             });
//           }
//         } catch {}
//       }
//     } catch {}
//   };

  const openContentPreview = async (moduleId: number) => {
    // console.log('[DEBUG] openContentPreview start', { moduleId, savedCourseId, courseData });
    setIsPreviewLoading(true);
    let courseId = savedCourseId || courseData.courseId;
    const token = localStorage.getItem('token');
    if (!courseId) {
      try {
        const courseResp = await fetch('http://localhost:3000/api/auth/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseData })
        });
        if (!courseResp.ok) {
          const errData = await courseResp.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to save course');
        }
        const courseResult = await courseResp.json();
        courseId = courseResult.course?.courseId;
        if (!courseId) throw new Error('No courseId returned');
        setSavedCourseId(courseId);
        updateCourseData({ courseId });
      } catch {
        toast.warn('Could not create course. Please try launching first.');
        setIsPreviewLoading(false);
        return;
      }
    }
    try {
      const localContent = prefetchedContentMap[moduleId];
      if (localContent) {
        const ms: ModuleState = {
          id: moduleId,
          Module: `Module ${moduleId}`,
          Content: localContent,
          slide: { Module: `Module ${moduleId}`, Slides: Array.isArray(prefetchedSlidesMap[moduleId]?.Slides) ? prefetchedSlidesMap[moduleId].Slides : [] },
          isGenerating: false,
          isGenerated: true,
          error: null
        };
        setSelectedModule(ms);
        setSelectedDocId(`prefetched-${moduleId}`);
        setIsPreviewLoading(false);
        return;
      }
      // console.log('[DEBUG] Fetching module-contents (content)', { courseId, moduleId });
      const resp = await fetch(`http://localhost:3000/api/auth/module-contents?courseId=${encodeURIComponent(String(courseId))}&moduleNumber=${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        navigate('/login');
        setIsPreviewLoading(false);
        return;
      }
      if (resp.ok) {
        const docs = await resp.json();
        console.log('[DEBUG] module-contents GET result (content)', docs);
        const latest = Array.isArray(docs) && docs.length ? docs[0] : null;
        if (latest) {
          setSelectedDocId(String(latest._id || ''));
          const baseModuleNumber = Number(latest.moduleNumber);
          let nc = null as any;
          // console.log("[DEBUG] Latest data from database:", JSON.stringify(latest, null, 2));
          
          // Handle both response formats: direct module object or nested content object
          if (latest.content && typeof latest.content === 'object') {
            // console.log("[DEBUG] Database content before normalization (nested format):", JSON.stringify(latest.content, null, 2));
            nc = normalizeModuleContent(latest.content, baseModuleNumber);
          } else {
            // console.log("[DEBUG] Database latest before normalization (direct format):", JSON.stringify(latest, null, 2));
            nc = normalizeModuleContent(latest, baseModuleNumber);
          }
          if (nc) {
            // console.log("[DEBUG] Normalized content result:", JSON.stringify(nc, null, 2));
            setPrefetchedContentMap(prev => ({ ...prev, [baseModuleNumber]: nc }));
          }
          const ms: ModuleState = {
            id: baseModuleNumber,
            Module: `Module ${baseModuleNumber}`,
            Content: nc || {
              Title: '',
              Objectives: [],
              TeachingContent: [],
              CaseStudy: { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
              Quizzes: [],
              VisualDescriptions: [],
              FurtherStudy: { ExternalLinks: [], BookReferences: [] }
            },

            slide: { Module: `Module ${latest.moduleNumber}`, Slides: Array.isArray(latest.slides) ? latest.slides : [] },
            isGenerating: false,
            isGenerated: true,
            error: null
          };
          setSelectedModule(ms);
          setIsPreviewLoading(false);
          return;
        }
      }
      // console.log('[DEBUG] No saved content found; showing blueprint fallback without regenerating');
      console.warn('[DEBUG] Content generation returned empty; using blueprint fallback');
      const blueprint = previewModules.find(m => m.id === moduleId);
      if (blueprint) {
        setSelectedModule({
          id: moduleId,
          Module: `Module ${moduleId}`,
          Content: {
            Title: blueprint.title || `Module ${moduleId}`,
            Objectives: blueprint.lessons.map(l => `Objective: ${l.title}`),
            TeachingContent: blueprint.lessons.map(l => ({
              Topics: l.title,
              StandardsReference: 'AI Generated',
              ContentPoints: ['Overview', 'Key Points', 'Examples']
            })),
            CaseStudy: { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
            Quizzes: [],
            VisualDescriptions: [],
            FurtherStudy: { ExternalLinks: [], BookReferences: [] }
          },
          slide: { Module: `Module ${moduleId}`, Slides: [] },
          isGenerating: false,
          isGenerated: false,
          error: null
        });
        toast.info('Showing blueprint-only preview. Launch course to persist content.');
        setIsPreviewLoading(false);
        return;
      }
      toast.info('No content available.');
    } catch (error) {
      console.error('Failed to fetch module content:', error);
      toast.error('Failed to fetch module content.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const openSlidesPreview = async (moduleId: number) => {
    // console.log('[DEBUG] openSlidesPreview start', { moduleId, savedCourseId, courseData });
    setIsPreviewLoading(true);
    let courseId = savedCourseId || courseData.courseId;
    const token = localStorage.getItem('token');
    if (!courseId) {
      try {
        const courseResp = await fetch('http://localhost:3000/api/auth/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseData })
        });
        if (!courseResp.ok) {
          const errData = await courseResp.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to save course');
        }
        const courseResult = await courseResp.json();
        courseId = courseResult.course?.courseId;
        if (!courseId) throw new Error('No courseId returned');
        setSavedCourseId(courseId);
        updateCourseData({ courseId });
      } catch {
        toast.warn('Could not create course. Please try launching first.');
        setIsPreviewLoading(false);
        return;
      }
    }
    try {
      const localSlides = prefetchedSlidesMap[moduleId];
      if (localSlides) {
        const ms: ModuleState = {
          id: Number(moduleId),
          Module: `Module ${moduleId}`,
          Content: {
            Title: '',
            Objectives: [],
            TeachingContent: [],
            CaseStudy: { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
            Quizzes: [],
            VisualDescriptions: [],
            FurtherStudy: { ExternalLinks: [], BookReferences: [] }
          },
          slide: { Module: `Module ${moduleId}`, Slides: Array.isArray(localSlides.Slides) ? localSlides.Slides : [] },
          isGenerating: false,
          isGenerated: true,
          error: null
        };
        setSelectedSlide(ms);
        setIsPreviewLoading(false);
        return;
      }
      // console.log('[DEBUG] Fetching module-contents (slides)', { courseId, moduleId });
      const resp = await fetch(`http://localhost:3000/api/auth/module-contents?courseId=${encodeURIComponent(String(courseId))}&moduleNumber=${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        navigate('/login');
        setIsPreviewLoading(false);
        return;
      }
      if (resp.ok) {
        const docs = await resp.json();
        // console.log('[DEBUG] module-contents GET result (slides)', docs);
        const latest = Array.isArray(docs) && docs.length ? docs[0] : null;
        if (latest) {
          setSelectedDocId(String(latest._id || ''));
          
          // Handle both response formats: direct module object or nested content object
          const contentFromLatest = latest.content && typeof latest.content === 'object' ? latest.content : latest;
          
          const ms: ModuleState = {
            id: Number(latest.moduleNumber),
            Module: `Module ${latest.moduleNumber}`,
            Content: {
              Title: String(contentFromLatest.Title || contentFromLatest.title || ''),
              Objectives: Array.isArray(contentFromLatest.Objectives) ? contentFromLatest.Objectives : 
                         Array.isArray(contentFromLatest.objectives) ? contentFromLatest.objectives : [],
              TeachingContent: Array.isArray(contentFromLatest.TeachingContent) ? contentFromLatest.TeachingContent : 
                             Array.isArray(contentFromLatest.teachingContent) ? contentFromLatest.teachingContent : [],
              CaseStudy: contentFromLatest.CaseStudy || contentFromLatest.caseStudy || { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
              Quizzes: Array.isArray(contentFromLatest.Quizzes) ? contentFromLatest.Quizzes : 
                      Array.isArray(contentFromLatest.quizzes) ? contentFromLatest.quizzes : [],
              VisualDescriptions: Array.isArray(contentFromLatest.VisualDescriptions) ? contentFromLatest.VisualDescriptions : 
                                Array.isArray(contentFromLatest.visualDescriptions) ? contentFromLatest.visualDescriptions : [],
              FurtherStudy: contentFromLatest.FurtherStudy || contentFromLatest.furtherStudy || { ExternalLinks: [], BookReferences: [] }
            },
            slide: { 
  Module: `Module ${latest.moduleNumber}`, 
  Slides: Array.isArray(latest.slides?.Slides) ? latest.slides.Slides : 
          Array.isArray(latest.slides) ? latest.slides : [] 
},

            isGenerating: false,
            isGenerated: true,
            error: null
          };
          setSelectedSlide(ms);
          setIsPreviewLoading(false);
          return;
        }
      }
      // console.log('[DEBUG] No saved slides found; showing blueprint fallback without regenerating');
      console.warn('[DEBUG] Slides generation returned empty; using blueprint fallback');
      const blueprint = previewModules.find(m => m.id === moduleId);
      if (blueprint) {
        setSelectedSlide({
          id: moduleId,
          Module: `Module ${moduleId}`,
          Content: {
            Title: blueprint.title || `Module ${moduleId}`,
            Objectives: [],
            TeachingContent: [],
            CaseStudy: { CaseStudyDescription: '', Questions: [], ModelAnswers: [] },
            Quizzes: [],
            VisualDescriptions: [],
            FurtherStudy: { ExternalLinks: [], BookReferences: [] }
          },
          slide: {
            Module: `Module ${moduleId}`,
            Slides: blueprint.lessons.map((l, i) => ({
              SlideNumber: i + 1,
              title: l.title,
              VisualPrompt: '',
              Content: ''
            }))
          } as any,
          isGenerating: false,
          isGenerated: false,
          error: null
        });
        toast.info('Showing blueprint-only slides. Launch course to persist slides.');
        setIsPreviewLoading(false);
        return;
      }
      toast.info('No slides available.');
    } catch {
      toast.error('Failed to fetch module slides.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /** Launch Course: save draft modules to backend (only persistence point), then navigate. */
  const handleLaunchCourse = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const moduleCount = Number.isFinite(courseData.module) ? courseData.module : 0;
    const hasDraft = moduleCount > 0 && previewModules.length >= moduleCount &&
      previewModules.every(m => prefetchedContentMap[m.id]);

    if (hasDraft) {
      // Save course first if not yet saved
      let courseId = savedCourseId || courseData.courseId;
      if (!courseId) {
        const courseResp = await fetch('http://localhost:3000/api/auth/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseData })
        });
        if (!courseResp.ok) {
          const errData = await courseResp.json().catch(() => ({}));
          toast.error(errData.message || 'Failed to create course');
          return;
        }
        const result = await courseResp.json();
        courseId = result.course?.courseId;
        if (courseId) {
          setSavedCourseId(courseId);
          updateCourseData({ courseId });
        }
      }

      if (!courseId) {
        toast.error('Could not create course');
        return;
      }

      // Persist each module from draft (content + slides) to backend
      for (const mod of previewModules) {
        const content = prefetchedContentMap[mod.id];
        const slides = prefetchedSlidesMap[mod.id];
        if (!content && !slides?.Slides?.length) continue;
        const saveResp = await fetch('http://localhost:3000/api/auth/module-contents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            courseId,
            moduleNumber: mod.id,
            content: content || undefined,
            slides: slides || undefined
          })
        });
        if (!saveResp.ok) {
          const errData = await saveResp.json().catch(() => ({}));
          toast.error(`Failed to save module ${mod.id}: ${errData.message || 'Unknown error'}`);
          return;
        }
      }

      toast.success('Course launched and saved.');
      resetCourseData();
      setSavedCourseId(null);
      navigate('/course-dashboard', { replace: true });
      return;
    }

    // No draft: fallback to legacy flow (generate + save via /chat and module-contents)
    await handleGenerateContent('content');
  };

  /** View Slide Deck: open first module slides if we have them, else generate slides (no duplicate generation). */
  const handleViewSlideDeck = async () => {
    const firstId = previewModules.length > 0 ? previewModules[0].id : 1;
    if (prefetchedSlidesMap[firstId]?.Slides?.length) {
      openSlidesPreview(firstId);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const courseId = savedCourseId || courseData.courseId;
    if (courseId) {
      try {
        const r = await fetch(`http://localhost:3000/api/auth/module-contents?courseId=${encodeURIComponent(String(courseId))}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const mods = await r.json();
          const withSlides = Array.isArray(mods) && mods.find((m: any) => m?.status === 'completed' && (m?.slides?.Slides?.length || m?.slides?.length));
          if (withSlides) {
            openSlidesPreview(Number(withSlides.moduleNumber) || firstId);
            return;
          }
        }
      } catch {}
    }
    await handleGenerateContent('slides');
  };

  const handleGenerateContent = async (mode: 'slides' | 'content') => {
    if (mode === 'slides') setIsGeneratingSlides(true);
    else setIsGeneratingContent(true);

    const startTime = Date.now();
    const MINIMUM_LOADING_TIME = 1000;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      let courseId = savedCourseId || courseData.courseId;

      if (!courseId) {
        const courseResp = await fetch('http://localhost:3000/api/auth/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseData })
        });

        if (courseResp.status === 401 || courseResp.status === 403) {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }

        if (!courseResp.ok) {
          const errData = await courseResp.json().catch(() => ({}));
          console.error('Save course error details:', errData);
          throw new Error(errData.message || 'Failed to save course');
        }

        const courseResult = await courseResp.json();
        courseId = courseResult.course?.courseId;

        if (!courseId) {
          throw new Error('No courseId returned');
        }

        setSavedCourseId(courseId);
        updateCourseData({ courseId });
      }

      const moduleCount = Number.isFinite(courseData.module) ? courseData.module : 0;

      for (let i = 1; i <= moduleCount; i++) {
        const bodyPrompt: any = {};

        if (mode === 'content') {
          bodyPrompt.prompt1 = `Create detailed content for Module [${i}] of the course titled "${courseData.title}". Audience: "${courseData.audience}". Course type: "${courseData.type}". Standards: "${courseData.standards}". Description: "${courseData.description}". Include objectives, teaching content with standards references, a case study with questions and model answers, quizzes with questions and answers, visual descriptions, and relevant external links or book references for further study. Respond ONLY with a valid JSON object matching the expected module content schema.`;
        }
        // ========== SLIDE GENERATION COMMENTED OUT ==========
        // if (mode === 'slides') {
        //   bodyPrompt.prompt2 = `Create detailed slide prompts for Module [${i}]...`;
        // }

        try {
          const chatResp = await fetch('http://localhost:3000/api/auth/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyPrompt),
          });

          if (chatResp.status === 401 || chatResp.status === 403) {
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            navigate('/login');
            return;
          }

          if (chatResp.ok) {
            const result = await chatResp.json();
            let content = result && typeof result.reply1 === 'object' ? result.reply1 : null;
            // ========== SLIDE GENERATION COMMENTED OUT ==========
            // let slides = result?.reply2;
            console.log('content:', content);
            // console.log('slides:', slides)

            if (content && !content.Title && content.rawText) {
              content = {
                Title: `Module ${i}`,
                Objectives: [],
                TeachingContent: [
                  {
                    Topics: "Generated Module Content",
                    StandardsReference: "AI Generated",
                    ContentPoints: [content.rawText]
                  }
                ],
                CaseStudy: {
                  CaseStudyDescription: "",
                  Questions: [],
                  ModelAnswers: []
                },
                Quizzes: [],
                VisualDescriptions: [],
                FurtherStudy: {
                  ExternalLinks: [],
                  BookReferences: []
                }
              };
            } else if (content && !content.Title) {
              content = normalizeModuleContent(content, i);
            }
            if (content) {
              content = normalizeModuleContent(content, i);
            }

            // ========== SLIDE GENERATION COMMENTED OUT ==========
            // if (slides && !slides.Slides && slides.rawText) { slides = { Module: `Module ${i}`, Slides: [...] }; }

            const payload: any = {
              courseId,
              moduleNumber: i
            };

            // if (mode === 'slides' && slides) payload.slides = slides;
            if (mode === 'content') {
              if (content) payload.content = content;
              // if (slides) payload.slides = slides;
            }

            if (payload.content || payload.slides) {
              const saveResponse = await fetch('http://localhost:3000/api/auth/module-contents', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
              });
              
              if (!saveResponse.ok) {
                const errorData = await saveResponse.json().catch(() => ({}));
                console.error(`Failed to save module ${i}:`, saveResponse.status, errorData);
                throw new Error(`Failed to save module ${i}: ${errorData.message || saveResponse.statusText}`);
              }
              
              const saveResult = await saveResponse.json();
              console.log(`Module ${i} saved successfully:`, saveResult);
            }
          }
        } catch (err) {
          console.error(`Failed to generate content for module ${i}`, err);
        }
      }

      if (mode === 'content') {
        const elapsed = Date.now() - startTime;
        if (elapsed < MINIMUM_LOADING_TIME) {
          await new Promise(resolve => setTimeout(resolve, MINIMUM_LOADING_TIME - elapsed));
        }

        resetCourseData();
        setSavedCourseId(null);
        setIsGeneratingContent(false);
        setTimeout(() => {
          navigate('/course-dashboard', { replace: true });
        }, 0);
      } else {
        toast.success('Slides generated successfully!');
        setIsGeneratingSlides(false);
      }

    } catch (error) {
      console.error('Generation failed:', error);
      setIsGeneratingSlides(false);
      setIsGeneratingContent(false);
      navigate('/course-dashboard', { replace: true });
    }
  };

  const uploadedFiles = ((courseData as any).files || []) as File[];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const next = [...uploadedFiles, ...files];
    updateCourseData({ ...( { files: next } as any) });
  };

  const isStepComplete = (s: number) => {
    switch (s) {
      case 1:
        const baseComplete = !!(courseData.title?.trim() && courseData.audience?.trim());
        if (courseData.standards === 'Regional (EU/US Standards)') {
          return baseComplete && !!courseData.country;
        }
        return baseComplete;
      case 2:
        const wordCount = courseData.description?.trim().split(/\s+/).filter(Boolean).length || 0;
        return !!(wordCount >= 50 && courseData.duration?.value > 0 && courseData.module > 0);
      case 3:
        return true; // Files are optional
      case 4:
        return previewModules.length > 0;
      default:
        return true;
    }
  };

  if (formStatus === 'outcomes') {
    // deprecated
  }

  if (isGeneratingContent) {
    return <Loading />;
  }

  const StepProgress = () => (
    <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto px-4">
      {[1, 2, 3, 4, 5].map((num) => (
        <div key={num} className="flex items-center flex-1 last:flex-none">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
            step >= num ? 'bg-lime-500 border-lime-500 text-black shadow-lg shadow-lime-500/30' : 'bg-gray-900 border-gray-700 text-gray-500'
          }`}>
            {step > num ? <Check size={20} strokeWidth={3} /> : num}
          </div>
          {num < 5 && (
            <div className={`h-1 flex-1 mx-2 rounded transition-all duration-700 ${
              step > num ? 'bg-lime-500' : 'bg-gray-800'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const WarningSign = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
      <Zap size={18} fill="currentColor" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-lime-500 selection:text-black">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-lime-900/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 py-5 px-6 border-b border-gray-900 backdrop-blur-md bg-black/50 min-h-[100px]">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
          <div className="flex flex-col items-center justify-center ml-48 gap-1">
            <img src={logo5} alt="ORION Logo" className="h-28 w-auto" />
            <span className="text-lime-400 text-xs font-black uppercase tracking-[0.15em] leading-none">EVOKE AI</span>
          </div>
          <button
            onClick={() => navigate('/course-dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-all text-sm font-semibold shadow-sm"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Exit Architect
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto py-12 px-6">
        <StepProgress />
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden min-h-[550px] flex flex-col">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-2">The Foundation</h2>
              <p className="text-gray-400 mb-8">Let's define the core identity of your new course.</p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Course Title</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        className={`w-full bg-gray-800/50 border rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-lime-500 outline-none transition-all ${
                          showValidation && !courseData.title?.trim() ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-700'
                        }`}
                        placeholder="e.g. Masterclass in Quantum SEO"
                        value={courseData.title}
                        onChange={(e) => updateCourseData({ title: e.target.value })}
                      />
                      {showValidation && !courseData.title?.trim() && <WarningSign />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Target Audience</label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        className={`w-full bg-gray-800/50 border rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-lime-500 outline-none transition-all ${
                          showValidation && !courseData.audience?.trim() ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-700'
                        }`}
                        placeholder="Who is this course for?"
                        value={courseData.audience}
                        onChange={(e) => updateCourseData({ audience: e.target.value })}
                      />
                      {showValidation && !courseData.audience?.trim() && <WarningSign />}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Course Type</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <select
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-lime-500 outline-none appearance-none cursor-pointer"
                        value={courseData.type}
                        onChange={(e) => updateCourseData({ type: e.target.value })}
                      >
                        <option>Professional Development</option>
                        <option>Academic Certification</option>
                        <option>Hobbyist/Lifestyle</option>
                        <option>Executive Training</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Educational Standards</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <select
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-lime-500 outline-none appearance-none cursor-pointer"
                        value={courseData.standards}
                        onChange={(e) => {
                          updateCourseData({ standards: e.target.value });
                          if (e.target.value !== 'Regional (EU/US Standards)') {
                            updateCourseData({ country: '' });
                          }
                        }}
                      >
                        <option>Global (ISO/Generic)</option>
                        <option>Regional (EU/US Standards)</option>
                        <option>Industry Specific</option>
                      </select>
                    </div>
                  </div>

                  {courseData.standards === 'Regional (EU/US Standards)' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Specific Region/Country</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <select
                          className={`w-full bg-gray-800/50 border rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-lime-500 outline-none appearance-none cursor-pointer transition-all ${
                            showValidation && !courseData.country ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-700'
                          }`}
                          value={courseData.country}
                          onChange={(e) => updateCourseData({ country: e.target.value })}
                        >
                          <option value="">Select a region...</option>
                          <option>Australia</option>
                          <option>Canada</option>
                          <option>India</option>
                          <option>United States</option>
                          <option>London (UK)</option>
                          <option>Other</option>
                        </select>
                        {showValidation && !courseData.country && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                            <Zap size={18} fill="currentColor" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-2">Course Architecture</h2>
              <p className="text-gray-400 mb-8">Define the difficulty, depth, and duration of the curriculum.</p>
              <div className="space-y-8">
                <div>
                  <div className="mb-2 flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider">High-Level Description</label>
                    {showValidation && (courseData.description?.trim().split(/\s+/).filter(Boolean).length || 0) >= 5000 && (
                      <span className="text-xs font-bold text-amber-500 animate-pulse uppercase tracking-widest flex items-center gap-1">
                        <Zap size={12} fill="currentColor" /> Maximum limit reached
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      className={`w-full bg-gray-800/50 border rounded-2xl p-4 min-h-[160px] focus:ring-2 focus:ring-lime-500 outline-none transition-all resize-none ${
                        showValidation && (courseData.description?.trim().split(/\s+/).filter(Boolean).length || 0) >= 5000 
                          ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                          : showValidation && (!courseData.description?.trim() || courseData.description.trim().split(/\s+/).filter(Boolean).length < 50) 
                            ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                            : 'border-gray-700'
                      }`}
                      placeholder="Describe the primary learning outcomes... (Minimum 50 words required)"
                      value={courseData.description}
                      onChange={(e) => {
                        const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                        if (words.length <= 5000) {
                          updateCourseData({ description: e.target.value });
                        } else {
                          // Allow removing text even if over limit (safety)
                          if (e.target.value.length < (courseData.description?.length || 0)) {
                            updateCourseData({ description: e.target.value });
                          }
                        }
                      }}
                    />
                    {showValidation && ((!courseData.description?.trim() || courseData.description.trim().split(/\s+/).filter(Boolean).length < 50) || 
                      (courseData.description?.trim().split(/\s+/).filter(Boolean).length || 0) >= 5000) && (
                      <div className="absolute right-4 top-4 text-amber-500 animate-pulse">
                        <Zap size={18} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Provide a detailed overview of the course goals and curriculum structure.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Experience Level</label>
                    <div className="flex bg-gray-800/50 p-1.5 rounded-2xl border border-gray-700">
                      {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => updateCourseData({ level: lvl })}
                          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                            courseData.level === lvl ? 'bg-lime-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                          type="button"
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Duration</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          className={`w-full bg-gray-800/50 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-lime-500 outline-none transition-all ${
                            showValidation && (!courseData.duration?.value || courseData.duration.value <= 0) ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-700'
                          }`}
                          placeholder="Val"
                          value={courseData.duration.value === 0 ? '' : courseData.duration.value}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value || 0));
                            updateCourseData({ duration: { ...courseData.duration, value: val } });
                          }}
                        />
                        {showValidation && (!courseData.duration?.value || courseData.duration.value <= 0) && <WarningSign />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-transparent mb-2 uppercase tracking-wider">Unit</label>
                      <select
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-lime-500 outline-none appearance-none"
                        value={courseData.duration.unit}
                        onChange={(e) => updateCourseData({ duration: { ...courseData.duration, unit: e.target.value } })}
                      >
                        <option>Hours</option>
                        <option>Days</option>
                        <option>Weeks</option>
                        <option>Months</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Modules to Generate</label>
                  <div className="relative max-w-[200px]">
                    <input
                      type="number"
                      min="0"
                      className={`w-full bg-gray-800/50 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-lime-500 outline-none transition-all ${
                        showValidation && (courseData.module === undefined || courseData.module === null || courseData.module <= 0) ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-gray-700'
                      }`}
                      placeholder="e.g. 4"
                      value={courseData.module === 0 ? '' : courseData.module}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                        updateCourseData({ module: val });
                      }}
                    />
                    {showValidation && (courseData.module === undefined || courseData.module === null || courseData.module <= 0) && <WarningSign />}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: 4-8 modules for optimal learning depth.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
              <div className="bg-lime-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="text-lime-500 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Knowledge Injection</h2>
              <div className="text-gray-400 mb-10 max-w-md mx-auto space-y-2">
                <p>Upload your existing documents (PDFs, presentations, notes) to personalize and enrich your course.</p>
                <p>This step is optional — the course already provides complete structured content.</p>
                <p>Add your own materials only if you&apos;d like the content aligned with your specific resources.</p>
              </div>

              <div className="max-w-xl mx-auto border-2 border-dashed border-gray-800 rounded-3xl p-12 hover:border-lime-500/50 transition-all cursor-pointer bg-gray-800/20 group">
                <input type="file" multiple className="hidden" id="file-upload" onChange={handleFileChange} />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-gray-300 font-medium group-hover:text-lime-400 transition-colors">Click to browse or drag & drop files here</p>
                  <p className="text-gray-500 text-sm mt-2">Support for PDF, DOCX, TXT (Optional)</p>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-8 max-w-xl mx-auto text-left">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Uploaded Assets ({uploadedFiles.length})</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                        <FileText size={16} className="text-lime-500" />
                        <span className="text-sm truncate flex-1">{f.name}</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
              {!hasBlueprint && !isBlueprinting ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="bg-gray-800/50 p-8 rounded-full mb-6 border border-gray-700">
                      <Sparkles className="w-16 h-16 text-lime-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Module Blueprinting</h2>
                    <p className="text-gray-400 max-w-lg mb-10 leading-relaxed">
                      Based on your inputs, ORION is ready to architect {courseData.module} specialized modules for <span className="text-lime-400">"{courseData.title || 'Your Course'}"</span>.
                    </p>
                    <button
                      onClick={generateOrionPreview}
                      className="flex items-center gap-3 bg-lime-500 hover:bg-lime-400 text-black px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-lime-500/20"
                      type="button"
                    >
                      <Zap size={24} /> Generate Modules
                    </button>
                  </div>
                  <div className="mt-auto pt-8 flex justify-start">
                    <button
                      onClick={goToPrevStep}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                      type="button"
                    >
                      <ChevronLeft size={20} /> Back
                    </button>
                  </div>
                </div>
              ) : isBlueprinting ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-lime-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-lime-500 rounded-full border-t-transparent animate-spin" />
                    <Zap className="absolute inset-0 m-auto text-lime-400 w-12 h-12 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Architecting Modules</h2>
                  <p className="text-gray-400 animate-pulse font-mono uppercase text-xs tracking-widest">Compiling datasets & structuring learning paths...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold">Generated Draft</h2>
                      <p className="text-gray-500 text-sm">Review and refine the generated modules below.</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                    {previewModules.map((mod) => (
                      <div key={mod.id} className="bg-gray-800/40 p-5 rounded-2xl border border-gray-700/50 flex flex-col">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-lime-500/10 text-lime-500 flex items-center justify-center text-[10px] font-black">{mod.id}</div>
                          {mod.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="px-2 py-0.5 rounded-md bg-lime-500/10 border border-lime-500/20 text-[9px] font-black text-lime-400 uppercase tracking-wider flex items-center gap-1">
                            <Zap size={10} className="fill-lime-400" /> {moduleCredits[mod.id] || 0} Credits
                          </div>
                        </div>
                        <div className="space-y-1 mb-6 flex-1">
                          {mod.lessons.map((lesson, idx) => (
                            <p key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="w-1 h-1 bg-gray-600 rounded-full" /> {lesson.title}
                            </p>
                          ))}
                        </div>
                        {(() => {
                          const rawObjectives = prefetchedContentMap[mod.id]?.Objectives ?? prefetchedContentMap[mod.id]?.objectives;
                          const objectives = Array.isArray(rawObjectives) && rawObjectives.length > 0
                            ? rawObjectives
                            : mod.lessons.map(l => l.title);
                          return (
                            <div className="mb-4">
                              <div className="text-xs font-bold text-white mb-1">
                                {mod.title}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                Objectives
                              </div>
                              <div className="space-y-1">
                                {objectives.slice(0, 3).map((obj: any, idx: number) => (
                                  <p key={idx} className="text-[11px] text-gray-300 leading-snug flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 bg-lime-500 rounded-full shrink-0" />
                                    <span className="flex-1">{String(obj)}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex gap-2">
                          <button onClick={() => openContentPreview(mod.id)} disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold bg-gray-900 hover:bg-black rounded-lg border border-gray-700 text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                            <BookOpen size={12} className="text-lime-500" /> View Content
                          </button>
                          <button onClick={() => openSlidesPreview(mod.id)} disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold bg-gray-900 hover:bg-black rounded-lg border border-gray-700 text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                            <Monitor size={12} className="text-lime-500" /> View Slides
                          </button>
                          <button 
                            onClick={() => regenerateSingleModule(mod.id)} 
                            disabled={isPreviewLoading} 
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold bg-gray-900 hover:bg-black rounded-lg border border-gray-700 text-lime-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                            type="button"
                          >
                            <RefreshCw size={12} /> Regenerate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-8 flex justify-between">
                    <button
                      onClick={() => { setHasBlueprint(false); setStep(3); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-white transition-all"
                      type="button"
                    >
                      <ChevronLeft size={20} /> Back
                    </button>
                    <button
                      onClick={goToNextStep}
                      className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-black px-8 py-3 rounded-xl font-black shadow-lg shadow-lime-500/20 transition-all"
                      type="button"
                    >
                      Looks Good, Continue <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
              <div className="flex justify-between items-start mb-10 border-b border-gray-800 pb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Final Review</h2>
                  <p className="text-gray-400">Your curriculum is complete and ready for deployment.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleViewSlideDeck}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-700 transition-all"
                    type="button"
                    disabled={isGeneratingSlides || isGeneratingContent}
                  >
                    {isGeneratingSlides ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor size={18} />}
                    View Slide Deck
                  </button>
                  <button
                    onClick={handleLaunchCourse}
                    className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-black px-6 py-2 rounded-xl text-sm font-black transition-all shadow-xl shadow-lime-500/30"
                    type="button"
                    disabled={isGeneratingSlides || isGeneratingContent}
                  >
                    {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Launch Course
                  </button>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8 mb-10 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gray-800/40 p-6 rounded-3xl border border-gray-800">
                    <h4 className="text-xs font-black text-lime-500 uppercase tracking-widest mb-4">Specs Snapshot</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500">TITLE</p>
                        <p className="font-bold text-white leading-tight">{courseData.title || 'Untitled Course'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">LEVEL</p>
                          <p className="font-bold text-white">{courseData.level}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">DURATION</p>
                          <p className="font-bold text-white">{courseData.duration.value} {courseData.duration.unit}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">AUDIENCE</p>
                        <p className="text-sm text-gray-300 italic">"{courseData.audience}"</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {previewModules.map((mod) => (
                    <div key={mod.id} className="group bg-gray-800/30 hover:bg-gray-800/60 p-6 rounded-3xl border border-gray-800 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-lg text-white group-hover:text-lime-400 transition-colors">{mod.title}</h5>
                        <span className="text-[10px] font-black bg-gray-700 px-2 py-1 rounded text-gray-400 tracking-tighter">CERTIFIED</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="px-2 py-0.5 rounded-md bg-lime-500/10 border border-lime-500/20 text-[9px] font-black text-lime-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap size={10} className="fill-lime-400" /> {moduleCredits[mod.id] || 0} Credits
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openContentPreview(mod.id)} disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-gray-900 hover:bg-black rounded-xl border border-gray-700 text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                          <Eye size={14} /> View Course
                        </button>
                        <button onClick={() => openSlidesPreview(mod.id)} disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-gray-900 hover:bg-black rounded-xl border border-gray-700 text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                          <Monitor size={14} /> View Slides
                        </button>
                        <button 
                          onClick={() => regenerateSingleModule(mod.id)} 
                          disabled={isPreviewLoading} 
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-gray-900 hover:bg-black rounded-xl border border-gray-700 text-lime-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          type="button"
                        >
                          <RefreshCw size={14} /> Regenerate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-6 border-t border-gray-800 flex justify-start">
                <button
                  onClick={goToPrevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  type="button"
                >
                  <ChevronLeft size={20} /> Back to Blueprint
                </button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="mt-auto pt-10 flex justify-between items-center">
              <button
                onClick={goToPrevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                type="button"
              >
                <ChevronLeft size={20} /> Back
              </button>

              <button
                onClick={goToNextStep}
                disabled={step === 1 && isGeneratingDescription}
                className="flex items-center gap-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-black px-8 py-3 rounded-xl font-black shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-wait disabled:transform-none"
                type="button"
              >
                {step === 1 && isGeneratingDescription ? (
                  <>
                    <Loader2 size={20} className="animate-spin" strokeWidth={3} /> Generating description...
                  </>
                ) : (
                  <>Continue <ChevronRight size={20} strokeWidth={3} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4d7c0f; }
      `}</style>

      {selectedModule && (
        <ModuleViewer
          moduleData={selectedModule}
          onClose={() => setSelectedModule(null)}
          credit={moduleCredits[selectedModule.id]}
          duration={`${courseData.duration.value} ${courseData.duration.unit}`}
        />
      )}
      {selectedSlide && (
        <SlideContent
          moduleData={selectedSlide}
          onClose={() => setSelectedSlide(null)}
        />
      )}

      <footer className="relative z-10 py-8 px-6 text-center text-gray-600 text-xs border-t border-gray-900 mt-20">
      </footer>
    </div>
  );
};

export default CourseCreatorForm;
