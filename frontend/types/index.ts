export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  instructorId: string;
  createdAt: string;
  instructor?: {
    id: string;
    name: string;
  };
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  courseId: string;
  order: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR';
}