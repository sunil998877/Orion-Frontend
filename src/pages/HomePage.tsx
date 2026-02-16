import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Layout, Plus } from 'lucide-react';
import avatarImg from '../assests/avtar1.png';

const HomePage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  const handleCreateNew = () => {
    // We must reset the course data before navigating to create a new course
    // The CourseCreatorForm will read this flag, but we can't easily access the context here outside the provider
    // unless HomePage is inside CourseDataProvider (it is).
    // However, resetting here might not persist if the provider unmounts (it wraps Router so it shouldn't).
    // But to be safe, we use the session storage flag which CourseCreatorForm checks.
    sessionStorage.setItem('resetCourseData', 'true');
    navigate('/create-course');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        if (payload?.username) {
          setUsername(String(payload.username));
        }
      }
    } catch { }
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative w-full rounded-[2.5rem] overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-2xl group isolate transition-all duration-700 hover:shadow-emerald-900/10">
        {/* Animated Background Gradients & Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-lime-500/10 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/4 opacity-50" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between px-8 pt-12 pb-0 md:px-16 md:pt-16 gap-8 md:gap-12 min-h-[480px]">
          {/* Left: Text Content - Centered Vertically in its space */}
          <div className="relative flex-1 space-y-8 max-w-2xl text-center md:text-left pb-12 md:pb-20 self-center">
            {/* Text Area Glow */}
            <div className="absolute -inset-10 bg-lime-500/5 blur-3xl rounded-full -z-10 pointer-events-none mix-blend-screen opacity-50" />

            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wide text-lime-400 w-fit mx-auto md:mx-0 uppercase backdrop-blur-md shadow-lg shadow-lime-900/10">
                <Sparkles className="w-3 h-3 mr-2" />
                AI-Powered Learning
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                Welcome back, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-teal-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {username || 'Creator'}
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto md:mx-0 font-normal">
                Ready to share your knowledge? Create engaging, interactive courses in just a few minutes with our advanced AI suite.
              </p>
            </div>
          </div>

          {/* Right: Interactive 3D Hologram Composition */}
          <div className="relative shrink-0 w-full md:w-auto flex justify-center md:justify-end">
            <div className="relative w-[320px] md:w-[480px] h-[400px] md:h-[500px] flex items-end justify-center perspective-[1200px] group/scene">

              {/* 1. Volumetric Light Column (Behind) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-full bg-gradient-to-t from-lime-500/10 via-emerald-500/5 to-transparent blur-3xl opacity-60 pointer-events-none mix-blend-screen" />

              {/* 2. 3D Floating Dashboard Pane (Backdrop) */}
              <div
                className="absolute top-10 left-6 right-6 bottom-16 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl -z-10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex flex-col gap-4 p-6 transition-all duration-700 ease-out transform-gpu group-hover/scene:rotate-y-[-5deg] group-hover/scene:rotate-x-[5deg] group-hover/scene:translate-x-2"
                style={{ transform: 'rotateY(-12deg) rotateX(5deg) scale(0.95)' }}
              >
                {/* Glass Glare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />

                {/* Header Dots */}
                <div className="flex gap-2 mb-2 opacity-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>

                {/* Content Skeletons */}
                <div className="flex gap-3">
                  <div className="flex-1 h-28 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-lime-500/20 to-transparent" />
                  </div>
                  <div className="flex-1 h-28 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                  </div>
                </div>
                <div className="space-y-3 mt-auto">
                  <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                  <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                </div>
              </div>

              {/* 3. Holographic Base Projector */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[280px] h-[80px] pointer-events-none" style={{ transform: 'rotateX(60deg)' }}>
                {/* Outer Ring */}
                <div className="absolute inset-0 border-[3px] border-lime-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                {/* Middle Ring (Reverse) */}
                <div className="absolute inset-2 border-[2px] border-dashed border-emerald-400/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                {/* Inner Glow Center */}
                <div className="absolute inset-8 bg-lime-400/20 blur-xl rounded-full animate-pulse" />
              </div>

              {/* 4. Floating Main Character */}
              <div className="relative z-20 w-full h-full flex items-end justify-center pointer-events-none">
                <img
                  src={avatarImg}
                  alt="AI Teacher"
                  className="w-auto h-[105%] object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] animate-[float-medium_6s_ease-in-out_infinite]"
                  style={{
                    maskImage: 'linear-gradient(to_bottom, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to_bottom, black 85%, transparent 100%)'
                  }}
                />

                {/* Interactive Rim Light Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-lime-400/0 via-white/5 to-emerald-400/0 opacity-0 group-hover/scene:opacity-100 transition-opacity duration-700 mix-blend-overlay" />
              </div>

              {/* 5. Floating Particles/Icons */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                {/* Sphere 1 */}
                <div className="absolute top-1/3 left-10 w-12 h-12 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg flex items-center justify-center animate-[float-slow_8s_ease-in-out_infinite]">
                  <Sparkles className="w-5 h-5 text-lime-400" />
                </div>
                {/* Sphere 2 */}
                <div className="absolute bottom-1/4 right-0 w-10 h-10 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg flex items-center justify-center animate-[float-slow_7s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                </div>
              </div>

              <style>{`
                @keyframes float-medium {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-15px); }
                }
                @keyframes float-slow {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group relative p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-white/5 hover:border-lime-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(132,204,22,0.1)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-7 h-7 text-lime-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">AI-Powered Creation</h3>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              Generate comprehensive course structures, detailed content, and quizzes automatically. Just provide a topic, and our AI handles the heavy lifting.
            </p>
          </div>
        </div>

        <div className="group relative p-8 rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
              <Layout className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Interactive Dashboard</h3>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              Track student progress, manage your curriculum, and view deep analytics all in one command center. Stay organized and focused on teaching.
            </p>
          </div>
        </div>
      </div>

      {/* Premium CTA Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0F0F0F] border border-white/10 p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/5 to-emerald-500/5 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Ready to build your next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">Masterpiece?</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Join thousands of creators sharing their knowledge. It only takes a few clicks to get started.
          </p>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleCreateNew}
            className="group/btn relative px-8 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-2xl text-black font-bold text-lg hover:brightness-110 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(132,204,22,0.3)] flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            <span>Start Creating</span>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover/btn:ring-white/40 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
