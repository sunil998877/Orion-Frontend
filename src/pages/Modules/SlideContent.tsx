import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Clock, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { ModuleState } from './ModuleGen';

const getStringArray = (obj: unknown, key: string): string[] => {
    const v = (obj as Record<string, unknown>)[key];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
};

interface SlideContentProps {
    moduleData: ModuleState
    onClose: () => void;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}
export const SlideContent: React.FC<SlideContentProps> = ({ moduleData, onClose, onRegenerate, isRegenerating }) => {
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
                                    View Slides
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

                {/* Slides */}
                <div className="flex-1 overflow-y-auto p-6 bg-black">
                    {!(moduleData &&
                        Array.isArray(moduleData.slide?.Slides) &&
                        moduleData.slide?.Slides.length > 0) ? (

                        <div className="flex flex-col items-center Array.isArray(moduleData.slide?.[0]?.Slides)
                            justify-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: theme.accent }} />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Generating Slides...</h3>
                            <p className="text-gray-500 text-center">
                                Our AI is creating the slide sequence for this module. This may take a few moments.
                            </p>
                        </div>
                    ) : (
                        <div className="prose-invert max-w-none">
                            <div className="mb-6 p-4 rounded-lg" style={{ background: theme.accentSoft, border: `1px solid ${theme.accentSoft}` }}>
                                <div className="flex items-center" style={{ color: theme.accent }}>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Slides Generated Successfully</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* code--------------> */}


                                <h2 className="text-xl font-semibold">Slides</h2>
                                <ul className="list-disc list-inside">
                                    {Array.isArray(moduleData.slide?.Slides) && moduleData.slide?.Slides.length ? (
                                        moduleData.slide?.Slides?.map((slide, i) => {
                                            const slideNum = ('SlideNumber' in slide && (slide as any).SlideNumber) ? (slide as any).SlideNumber : (i + 1);
                                            const slideTitle = (slide as any).title || (slide as any).Title || '';
                                            const bullets = Array.isArray((slide as any).Bullets)
                                                ? (slide as any).Bullets
                                                : Array.isArray((slide as any).BulletPoints)
                                                    ? (slide as any).BulletPoints
                                                    : [];
                                            const contentText = (slide as any).Content || (slide as any).content || '';
                                            const contentLines = typeof contentText === 'string'
                                                ? contentText.split(/\n+|\. +/).filter(Boolean).map(l => l.trim())
                                                : [];
                                            const visualPrompt = (slide as any).VisualPrompt || (slide as any).visualPrompt || '';
                                            return (
                                                <li key={i} className="mb-8 p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/70">
                                                            Slide {slideNum}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-white mb-3">
                                                                {slideTitle || 'Untitled Slide'}
                                                            </h3>
                                                            <ul className="space-y-2">
                                                                {bullets.map((b: string, j: number) => (
                                                                    <li key={j} className="flex items-start">
                                                                        <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.accent }}></span>
                                                                        <span className="text-gray-300 leading-relaxed">{b}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {contentLines.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">Content</h4>
                                                                <div className="space-y-3">
                                                                    {contentLines.map((line: string, j: number) => (
                                                                        <p key={j} className="text-gray-400 leading-relaxed italic">
                                                                            {line}{line.endsWith('.') ? '' : '.'}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-2">Visual Prompt</h4>
                                                            <p className="text-sm text-gray-500 bg-black/30 p-3 rounded-xl border border-white/5 italic">
                                                                {visualPrompt || 'No visual prompt provided.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li>No slides available.</li>
                                    )}
                                </ul>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
