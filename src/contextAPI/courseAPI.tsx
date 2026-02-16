import React, { createContext, useContext, useState } from 'react';

const CourseDataContext = createContext<CourseDataContextType | undefined>(undefined);

export interface CourseData {
  title: string;
  type: string;
  description: string;
  audience: string;
  module: number;
  level: string;
  duration: {
    value: number;
    unit: string;
  };
  country: string;
  standards: string;
  file: File | null;
  courseId?: string;
}

const initialValues: CourseData = {
  title: '',
  description: '',
  audience: '',
  type: '',
  module: 0,
  level: '',
  duration: { value: 0, unit: 'hours' },
  country: '',
  standards: '',
  file: null,
  courseId: '',
};

interface CourseDataContextType {
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  updateCourseData: (data: Partial<CourseData>) => void;
  resetCourseData: () => void;
}



export const CourseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courseData, setCourseData] = useState<CourseData>(initialValues);

  const updateCourseData = (data: Partial<CourseData>) => {
    console.log('Updating course data:', data);
    setCourseData((prev: CourseData) => ({
      ...prev,
      ...data,
      duration: data.duration
        ? { ...prev.duration, ...data.duration }
        : prev.duration,
      file: 'file' in data ? data.file : prev.file,
    }));
  };
  const resetCourseData = () => {
    setCourseData(initialValues);
  };

  return (
    <CourseDataContext.Provider value={{ courseData, setCourseData, updateCourseData, resetCourseData }}>
      {children}
    </CourseDataContext.Provider>
  );
};

export const useCourseData = () => {
  const context = useContext(CourseDataContext);
  if (!context) {
    throw new Error('useCourseData must be used within a CourseDataProvider');
  }
  return context;
};
