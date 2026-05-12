import React, { useState, useEffect, useRef } from 'react';
import { Clock, ClipboardList, BookOpen } from 'lucide-react';
import { useCourseData } from '../contextAPI/courseAPI';
import { API_BASE } from '../utils/api';



const DURATION_UNITS = [
  { id: "hours", label: "Hours" },
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" }
];

const LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const CourseDetails: React.FC = () => {
  const { courseData, updateCourseData } = useCourseData();
  const durationInputRef = useRef<HTMLInputElement>(null);
  const moduleInputRef = useRef<HTMLInputElement>(null);
  const capitalizeFirst = (s: string) => s.replace(/^\s*([a-z])/i, (m) => m.toUpperCase());

  const handleModuleChange = async (value: number) => {
    updateCourseData({ module: value });
    try {
      await fetch(`${API_BASE}/module`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: value }),
      });
    } catch (error) {
      console.error('Failed to sync module with backend', error);
    }
  };

  useEffect(() => {
    const el = durationInputRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const isDown = e.deltaY > 0;
      const next = isDown ? Math.max(0, courseData.duration.value - 1) : courseData.duration.value + 1;
      updateCourseData({
        duration: {
          ...courseData.duration,
          value: next
        }
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => {
      el.removeEventListener('wheel', handler);
    };
  }, [courseData.duration.value, courseData.duration.unit]);

  useEffect(() => {
    const el = moduleInputRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const isDown = e.deltaY > 0;
      const next = isDown ? Math.max(0, courseData.module - 1) : courseData.module + 1;
      handleModuleChange(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => {
      el.removeEventListener('wheel', handler);
    };
  }, [courseData.module]);


  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            <div className='flex items-center'>
              <ClipboardList className='w-5 h-5 text-lime-500 mr-2' />
              Course Description <span className="text-red-500">*</span>
            </div>
          </label>
          <span className="text-xs text-gray-500">
            {courseData.description.length}/5000
            {courseData.description.length < 50 && (
              <span className="text-amber-600 ml-2">Min 50 characters</span>
            )}
          </span>
        </div>
        <textarea
          id="description"
          value={courseData.description}
          onChange={(e) => updateCourseData({ description: capitalizeFirst(e.target.value) })}
          rows={5}
          maxLength={5000}
          placeholder="Describe what your course is about, what students will learn, and how they will benefit from it."
          className="w-full px-3 py-2 rounded-md bg-black/60 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-colors min-h-32"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Course Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LEVELS.map((level) => (
            <div
              key={level.id}
              onClick={() => updateCourseData({ level: level.id })}
              className={`
                cursor-pointer border rounded-lg p-4 text-center transition-all duration-200
                ${courseData.level === level.id
                  ? 'border-lime-500 bg-lime-50 text-lime-600 shadow-sm'
                  : 'border-gray-300 bg-gray-50 hover:border-lime-500 hover:bg-lime-50/50'
                }
              `}
            >
              <BookOpen className={`w-5 h-5 mx-auto mb-2 ${courseData.level === level.id ? 'text-lime-500' : 'text-gray-600'}`} />
              <span className="text-sm font-medium">{level.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-lime-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Course Duration</h3>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-1/3">
            <label htmlFor="duration-value" className="block text-sm font-medium text-gray-700 mb-1">
              Length <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="duration-value"
              ref={durationInputRef}
              value={courseData.duration.value === 0 ? '' : courseData.duration.value}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  updateCourseData({
                    duration: {
                      ...courseData.duration,
                      value: 0
                    }
                  });
                  return;
                }
                const parsed = parseInt(raw, 10);
                const safeValue = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
                updateCourseData({
                  duration: {
                    ...courseData.duration,
                    value: safeValue
                  }
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-colors"
              required
            />
          </div>

          <div className="w-2/3">
            <label htmlFor="duration-unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_UNITS.map(unit => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => updateCourseData({
                    duration: {
                      ...courseData.duration,
                      unit: unit.id
                    }
                  })}
                  className={`
                    px-3 py-2 border rounded-md text-sm font-medium transition-colors
                    ${courseData.duration.unit === unit.id
                      ? 'border-lime-500 bg-lime-50 text-lime-600 shadow-sm'
                      : 'border-gray-200 hover:border-lime-500 hover:bg-lime-50/50'
                    }
                  `}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Estimated time to complete the entire course
          </p>
        </div>
      </div>

      <div className='w-full'>
        <label htmlFor="duration-value" className="block text-sm font-medium text-gray-700 mb-1">
          Module <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="duration-value"
          ref={moduleInputRef}
          value={courseData.module === 0 ? '' : courseData.module}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              handleModuleChange(0);
              return;
            }
            const parsed = parseInt(raw, 10);
            const safeValue = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
            handleModuleChange(safeValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-colors"
          required
        />
      </div>
    </div>
  );
};

export default CourseDetails;
