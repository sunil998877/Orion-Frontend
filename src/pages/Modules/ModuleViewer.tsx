import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Clock, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { ModuleState } from './ModuleGen';

interface ModuleViewerProps {
  moduleData: ModuleState
  onClose: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  credit?: number;
  duration?: string;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ moduleData, onClose, onRegenerate, isRegenerating, credit, duration }) => {
  const theme = useMemo(() => {
    const t = (localStorage.getItem('theme') || 'blue').toLowerCase();
    const palettes: Record<string, { from: string; via: string; to: string; accent: string; accentSoft: string; textSoft: string }> = {
      blue: { from: '#2563eb', via: '#3b82f6', to: '#4f46e5', accent: '#3b82f6', accentSoft: 'rgba(59,130,246,0.1)', textSoft: '#c7d2fe' },
      emerald: { from: '#10b981', via: '#34d399', to: '#22c55e', accent: '#10b981', accentSoft: 'rgba(16,185,129,0.1)', textSoft: '#bbf7d0' },
      purple: { from: '#9333ea', via: '#a855f7', to: '#7c3aed', accent: '#a855f7', accentSoft: 'rgba(168,85,247,0.1)', textSoft: '#e9d5ff' },
      rose: { from: '#f43f5e', via: '#fb7185', to: '#e11d48', accent: '#f43f5e', accentSoft: 'rgba(244,63,94,0.1)', textSoft: '#fecdd3' },
      indigo: { from: '#4f46e5', via: '#6366f1', to: '#4338ca', accent: '#6366f1', accentSoft: 'rgba(99,102,241,0.1)', textSoft: '#c7d2fe' },
      lime: { from: '#84cc16', via: '#a3e635', to: '#65a30d', accent: '#84cc16', accentSoft: 'rgba(132,204,22,0.1)', textSoft: '#ecfccb' },
    };
    return palettes[t] || palettes.blue;
  }, []);
  const headerGradient = `linear-gradient(to right, #a3e635, #84cc16, #10b981, #22c55e)`;
  const formatContent = (content: string) => {
    console.log(content)
    // Convert markdown-like content to HTML for better display
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-gray-800 mb-4 mt-6">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-gray-700 mb-3 mt-5">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium text-gray-600 mb-2 mt-4">{line.substring(4)}</h3>;
        }
        if (line.startsWith('- **') && line.includes('**:')) {
          const [, boldPart, normalPart] = line.match(/- \*\*(.*?)\*\*: (.*)/) || [];
          return (
            <li key={index} className="mb-2">
              <span className="font-semibold text-gray-700">{boldPart}:</span>
              <span className="text-gray-600 ml-1">{normalPart}</span>
            </li>
          );
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-gray-600 mb-1">{line.substring(2)}</li>;
        }
        if (line.match(/^\d+\./)) {
          return <li key={index} className="text-gray-600 mb-2 list-decimal ml-4">{line}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-gray-600 mb-2 leading-relaxed">{line}</p>;
      });
  };
  console.log("ModuleData:", moduleData.Content)

  // Use Portal to render at body level to avoid stacking context issues
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4 py-4 animate-fadeIn bg-black/60 backdrop-blur-sm">
      <div
        className="fixed inset-0 z-0 bg-transparent"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-white z-10">
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-20 h-20 rounded-br-3xl" style={{ backgroundImage: `linear-gradient(to bottom right, ${theme.accentSoft}, transparent)` }}></div>
        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-3xl" style={{ backgroundImage: `linear-gradient(to bottom left, ${theme.accentSoft}, transparent)` }}></div>

        {/* Enhanced Header with Motion */}
        <div className="relative text-white p-8 overflow-hidden shrink-0" style={{ backgroundImage: headerGradient }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative p-4 rounded-2xl backdrop-blur-sm animate-pulse-subtle border" style={{ background: theme.accentSoft, borderColor: theme.accentSoft }}>
                <BookOpen className="w-10 h-10 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: theme.accent }}></div>
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-2 animate-slideInLeft text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  Course Content
                </h2>
                <p className="flex items-center text-lg animate-slideInLeft animation-delay-100 text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin-slow" style={{ color: '#ffffff' }} />
                  Interactive Learning Experience
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center px-4 py-2 rounded-xl transition-all duration-200 font-medium border disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: theme.accentSoft,
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="group relative p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 border"
                style={{ borderColor: theme.accentSoft }}
              >
                <svg className="w-7 h-7 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div className="absolute inset-0 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-300" style={{ background: theme.accentSoft }}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black">
          {!moduleData || !moduleData.Content ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: theme.accent }} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Generating Content...</h3>
              <p className="text-gray-500 text-center">
                Our AI is creating comprehensive course content for this module. This may take a few moments.
              </p>
            </div>
          ) : (
            <div className="prose-invert max-w-none">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Content Generated Successfully</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-6 space-y-6">
                  <div className="space-y-1 mb-8 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold text-white flex gap-3">
                      <span className="text-gray-500 uppercase tracking-widest text-sm self-center">Module</span>
                      {moduleData.Content?.Title?.replace(/^Module\s+\d+[:\-\s]*/i, '').trim() || 'Untitled Module'}
                    </h1>
                    <div className="flex gap-6 mt-2 text-sm font-mono">
                      <div className="flex gap-2">
                        <span className="text-gray-500">Credit</span>
                        <span className="text-lime-400 font-bold">{credit || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-blue-400 font-bold">{duration || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <section >
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-blue-500 pl-4">Primary Learning Objectives</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      {moduleData.Content.Objectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-gray-500 pl-4">Micro Learning Objectives (Bloom mapped)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {moduleData.Content.TeachingContent?.map((item, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h3 className="font-semibold text-gray-200 mb-2">{item.Topics}</h3>
                          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            {item.ContentPoints?.slice(0, 2).map((pt, j) => <li key={j}>{pt}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-rose-500 pl-4">Real-World Object / Case Context</h2>
                    <div className="bg-rose-500/5 p-6 rounded-2xl border border-rose-500/20">
                      <p className="text-gray-300 leading-relaxed italic">
                        {moduleData.Content?.CaseStudy?.CaseStudyDescription || "Connecting theoretical concepts to practical industry scenarios."}
                      </p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-lime-500 pl-4">ISO/IEC Standards Mapping</h2>
                    <p className="text-sm text-gray-400 mb-4">Learning topics aligned to ISO/IEC reference standards.</p>
                    <div className="space-y-3">
                      {moduleData.Content.TeachingContent?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                          <span className="text-gray-300">{item.Topics}</span>
                          <span className="text-[10px] font-bold bg-lime-500/10 text-lime-400 px-2 py-1 rounded border border-lime-500/20 tracking-widest uppercase">
                            {item.StandardsReference || 'ISO/IEC (AI-Generated)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

 

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-blue-400 pl-4">Mid-Module MCQs</h2>
                    {moduleData.Content.Quizzes?.slice(0, 1).map((quiz, i) => (
                      <div key={i} className="space-y-4">
                        {quiz.Questions?.slice(0, 2).map((q, j) => (
                          <div key={j} className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-gray-300 font-medium mb-2"><span className="text-blue-400 mr-2">Q:</span>{q}</p>
                            <p className="text-gray-500 text-sm"><span className="text-gray-600 mr-2 italic">A:</span>{quiz.Answers?.[j]}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-blue-600 pl-4">End-Module MCQs</h2>
                    {moduleData.Content.Quizzes?.slice(-1).map((quiz, i) => (
                      <div key={i} className="space-y-4">
                        {quiz.Questions?.slice(0, 2).map((q, j) => (
                          <div key={j} className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-gray-300 font-medium mb-2"><span className="text-blue-500 mr-2">Q:</span>{q}</p>
                            <p className="text-gray-500 text-sm"><span className="text-gray-600 mr-2 italic">A:</span>{quiz.Answers?.[j]}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 border-l-4 border-gray-300 pl-4">Practical Task</h2>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                      <p className="text-gray-300 leading-relaxed">
                        {moduleData.Content?.CaseStudy?.Questions?.[0] || "Develop a comprehensive implementation plan based on the module's core principles."}
                      </p>
                    </div>
                  </section>

 
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
