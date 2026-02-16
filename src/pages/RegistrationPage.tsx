import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AvatarCropModal from '../components/AvatarCropModal';
import HeroImage from '../assests/avatar.png';
import AnimatedBackground from './AnimatedBg';

function RegistrationPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    organisation: '',
    password: '',
  });

  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    organisation?: string;
    password?: string;
    general?: string;
  }>({});

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const handleCropped = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem('avatar', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const opacity = Math.max(0.3, 1 - scrollY * 0.001);
      setScrollOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.organisation) {
      newErrors.organisation = 'Organisation name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('username', formData.username);
      form.append('organisation', formData.organisation);
      form.append('email', formData.email);
      form.append('password', formData.password);
      if (avatarFile) form.append('avatar', avatarFile);

      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('resetCourseData', 'true');
        if (!avatarFile) {
          localStorage.removeItem('avatar');
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Registration successful!');
        navigate('/login', { replace: true });
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.log('Error during registration:', error);
      toast.error('An error occurred. Please try again later.');
      setErrors({
        general: 'An error occurred. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-auto animate-fade-in">
      <AnimatedBackground />
      <ToastContainer />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8" style={{ opacity: scrollOpacity, transition: 'opacity 0.3s ease' }}>
        <div className="w-full max-w-3xl">
          <div className="flex flex-col gap-8 items-center">
            <div className="w-full">
              <div className="mt-3 rounded-2xl bg-black shadow-2xl ring-1 ring-white/5 transition-transform duration-300 hover:shadow-2xl border border-white/5 flex flex-col md:flex-row">

                {/* Image Section */}
                <div className="flex md:w-2/5 w-full items-center justify-center p-6">
                  <img src={HeroImage} alt="Character" className="max-w-[300px] max-h-[300px] w-auto h-auto rounded-xl object-contain" />
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-5 p-6 md:w-3/5 w-full">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-white">Create Account</h2>
                    <p className="text-sm text-white/70">Start sharing your knowledge with the world.</p>
                  </div>

                  {errors.general && (
                    <div className="rounded-md bg-red-500/20 p-4 border border-red-500/50">
                      <div className="flex">
                        <div className="text-sm text-red-200">{errors.general}</div>
                      </div>
                    </div>
                  )}

                  {/* Avatar Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Profile picture</label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setCropOpen(true)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition-colors"
                      >
                        Upload avatar
                      </button>
                      {avatarFile && (
                        <span className="text-sm text-white/50 truncate max-w-[150px]">Selected: {avatarFile.name}</span>
                      )}
                    </div>
                  </div>

                  <AvatarCropModal open={cropOpen} onClose={() => setCropOpen(false)} onCropped={handleCropped} />

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-white">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className={`
                          block w-full rounded-lg border bg-black px-3 py-2.5 pl-10 shadow-sm text-white placeholder:text-gray-700
                          transition-all duration-200
                          focus:border-white/10 focus:outline-none focus:ring-1 focus:ring-white/5
                          ${errors.username ? 'border-red-500' : 'border-white/10'}
                        `}
                        placeholder="johndoe"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1.5 text-sm text-red-300">{errors.username}</p>
                    )}
                  </div>

                  {/* Organisation */}
                  <div>
                    <label htmlFor="organisation" className="mb-1.5 block text-sm font-medium text-white">
                      Organisation Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building2 size={18} />
                      </div>
                      <input
                        id="organisation"
                        name="organisation"
                        type="text"
                        autoComplete="organization"
                        required
                        value={formData.organisation}
                        onChange={(e) => setFormData(prev => ({ ...prev, organisation: e.target.value }))}
                        className={`
                          block w-full rounded-lg border bg-black px-3 py-2.5 pl-10 shadow-sm text-white placeholder:text-gray-700
                          transition-all duration-200
                          focus:border-white/10 focus:outline-none focus:ring-1 focus:ring-white/5
                          ${errors.organisation ? 'border-red-500' : 'border-white/10'}
                        `}
                        placeholder="Your organisation"
                      />
                    </div>
                    {errors.organisation && (
                      <p className="mt-1.5 text-sm text-red-300">{errors.organisation}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`
                          block w-full rounded-lg border bg-black px-3 py-2.5 pl-10 shadow-sm text-white placeholder:text-gray-700
                          transition-all duration-200
                          focus:border-white/10 focus:outline-none focus:ring-1 focus:ring-white/5
                          ${errors.email ? 'border-red-500' : 'border-white/10'}
                        `}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-300">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={`
                          block w-full rounded-lg border bg-black px-3 py-2.5 pl-10 pr-10 shadow-sm text-white placeholder:text-gray-700
                          transition-all duration-200
                          focus:border-white/10 focus:outline-none focus:ring-1 focus:ring-white/5
                          ${errors.password ? 'border-red-500' : 'border-white/10'}
                        `}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-300">{errors.password}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="w-full mt-6 flex items-center justify-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`
                        relative w-full rounded-lg
                        bg-gradient-to-r from-lime-400 to-emerald-500
                        px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200
                        hover:from-lime-300 hover:to-emerald-400
                        focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50
                      `}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                          Creating account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>

                  {/* Footer Links */}
                  <div className="text-center text-sm text-white/50 mt-6">
                    <span>Already have an account?</span>
                  </div>
                  <div className="text-center">
                    <a href="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                      Sign in to your account
                    </a>
                  </div>
                </form>
              </div>

              <div className="mt-4 text-center text-xs text-white/50">
                By creating an account, you agree to our{' '}
                <a href="#" className="font-medium text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationPage;
