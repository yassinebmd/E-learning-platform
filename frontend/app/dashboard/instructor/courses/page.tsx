"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  LayoutDashboard,
  Edit2,
  AlertCircle,
  Image as ImageIcon,
  Users,
  BarChart3,
  CalendarDays,
  Shield,
  Zap,
  TrendingUp,
  MoreVertical,
  Eye,
  ExternalLink,
  FolderKanban,
  Sparkles,
  FileText,
  GraduationCap,
  ChevronRight,
  Clock,
  Award,
  CheckCircle,
  LogOut,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string | null;
  instructorId: string;
  createdAt: string;
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

interface DashboardStats {
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  activeStudents: number;
}

const API_BASE = "http://localhost:5001";

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalLessons: 0,
    totalEnrollments: 0,
    activeStudents: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Web Security",
    thumbnail: "",
  });
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = [
    "Web Security",
    "Network Security",
    "Penetration Testing",
    "Cryptography",
    "Reverse Engineering",
    "Digital Forensics",
    "Secure Coding",
    "Mobile Security",
  ];

  const checkAuthAndFetch = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "INSTRUCTOR") {
      router.push("/dashboard");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      await fetchCourses(token);
      await fetchStats(token);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    checkAuthAndFetch();
  }, [checkAuthAndFetch]);

  const fetchCourses = async (token: string) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        await logout();
        router.push("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const coursesWithCount = data.map((course: any) => ({
          ...course,
          _count: course._count || { lessons: 0, enrollments: 0 },
        }));
        setCourses(coursesWithCount);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
      throw err;
    }
  };

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const totalCourses = data.length || 0;
        const totalLessons = data.reduce(
          (sum: number, course: any) => sum + (course._count?.lessons || 0),
          0
        );
        const totalEnrollments = data.reduce(
          (sum: number, course: any) => sum + (course._count?.enrollments || 0),
          0
        );

        const activeStudents = totalEnrollments;

        setStats({
          totalCourses,
          totalLessons,
          totalEnrollments,
          activeStudents,
        });
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const url = editCourse
        ? `${API_BASE}/api/courses/${editCourse.id}`
        : `${API_BASE}/api/courses`;

      const method = editCourse ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCourses(token);
        await fetchStats(token);
        setSuccessMessage(
          editCourse
            ? "Course updated successfully!"
            : "Course created successfully!"
        );
        setShowForm(false);
        setEditCourse(null);
        setFormData({
          title: "",
          description: "",
          category: "Web Security",
          thumbnail: "",
        });

        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Submit course error:", err);
      setError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCourses(courses.filter((course) => course.id !== courseId));
        await fetchStats(token!);
        setDeleteConfirm(null);
        setSuccessMessage("Course deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Error ${response.status}`);
      }
    } catch (err) {
      console.error("Delete course error:", err);
      setError("Network error occurred. Please try again.");
    }
  };

  const startEditCourse = (course: Course) => {
    setEditCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
          </div>
          <p className="text-slate-400 mt-6">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "INSTRUCTOR") {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <AlertCircle className="mx-auto mb-6 text-red-500" size={64} />
          <h1 className="text-2xl font-semibold text-red-200 mb-3">
            Access Restricted
          </h1>
          <p className="text-slate-300 mb-6">
            This area is for instructors only. Please log in with an instructor
            account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <LogOut size={16} />
              Switch Account
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-6 py-3 text-slate-200 font-medium hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              Go to Student Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-200">
      <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <Navbar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 mb-4">
                <Shield size={16} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">
                  Instructor Console
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {user?.name}
                </span>
              </h1>
              <p className="text-slate-400">
                Create and manage courses, track student progress, and grow your
                impact.
              </p>
            </div>

            <button
              onClick={() => {
                setEditCourse(null);
                setFormData({
                  title: "",
                  description: "",
                  category: "Web Security",
                  thumbnail: "",
                });
                setShowForm(!showForm);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all whitespace-nowrap"
            >
              <Plus size={18} />
              {showForm ? "Close" : "New Course"}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              {
                icon: <FolderKanban size={20} className="text-blue-200" />,
                label: "Total Courses",
                value: stats.totalCourses,
                color: "bg-blue-500/10",
                bg: "from-blue-900/10 to-transparent",
              },
              {
                icon: <FileText size={20} className="text-emerald-200" />,
                label: "Total Lessons",
                value: stats.totalLessons,
                color: "bg-emerald-500/10",
                bg: "from-emerald-900/10 to-transparent",
              },
              {
                icon: <GraduationCap size={20} className="text-purple-200" />,
                label: "Enrollments",
                value: stats.totalEnrollments,
                color: "bg-purple-500/10",
                bg: "from-purple-900/10 to-transparent",
              },
              {
                icon: <Users size={20} className="text-cyan-200" />,
                label: "Active Learners",
                value: stats.activeStudents,
                color: "bg-cyan-500/10",
                bg: "from-cyan-900/10 to-transparent",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border border-slate-800/70 bg-gradient-to-b ${stat.bg} backdrop-blur-sm p-5 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/20`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-900/10 px-6 py-4 text-emerald-100 backdrop-blur-sm animate-in fade-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <CheckCircle
                size={20}
                className="text-emerald-400 flex-shrink-0"
              />
              <div className="text-sm font-medium">{successMessage}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-700/30 bg-red-900/10 px-6 py-5 text-red-200 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm text-red-200/80 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-10 rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/30 to-black/30 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800/70 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-transparent">
              <h2 className="text-xl font-semibold text-white mb-2">
                {editCourse ? "Edit Course" : "Create New Course"}
              </h2>
              <p className="text-slate-400 text-sm">
                {editCourse
                  ? "Update course details and content."
                  : "Create a new course and start teaching security professionals."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Course Title *
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                    placeholder="e.g., Advanced Penetration Testing"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Category *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={submitting}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Description *
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent resize-none transition-all"
                  placeholder="Describe what students will learn in this course..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Thumbnail URL (Optional)
                </label>
                <input
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.value })
                  }
                  disabled={submitting}
                />
                <p className="text-xs text-slate-500">
                  Recommended size: 1280x720px. Leave empty for default.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {editCourse ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {editCourse ? "Update Course" : "Create Course"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditCourse(null);
                    setFormData({
                      title: "",
                      description: "",
                      category: "Web Security",
                      thumbnail: "",
                    });
                  }}
                  disabled={submitting}
                  className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-6 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Your Courses
              <span className="text-slate-500 ml-2">({courses.length})</span>
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Manage content, track enrollment, and update materials
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800/70 rounded-2xl bg-slate-900/10">
            <BookOpen className="mx-auto mb-6 text-slate-700" size={64} />
            <h3 className="text-xl font-semibold text-white mb-3">
              No courses yet
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Create your first course to start teaching. Share your expertise
              with security professionals worldwide.
            </p>
            <button
              onClick={() => {
                setEditCourse(null);
                setFormData({
                  title: "",
                  description: "",
                  category: "Web Security",
                  thumbnail: "",
                });
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <Plus size={18} />
              Create First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const lessonCount = course._count?.lessons || 0;
              const enrollmentCount = course._count?.enrollments || 0;

              return (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/30 to-black/30 backdrop-blur-sm overflow-hidden transition-all hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  {course.thumbnail ? (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/70 text-blue-300 border border-blue-500/30 backdrop-blur-sm">
                          {course.category}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-black/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
                        <Users size={12} />
                        {enrollmentCount}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                      <div className="text-center">
                        <BookOpen
                          size={48}
                          className="text-blue-500/30 mx-auto mb-2"
                        />
                        <span className="text-blue-200/70 text-sm">
                          VulnCore Course
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-200 transition-colors mb-2">
                      {course.title}
                    </h3>

                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-5 pb-4 border-b border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 bg-slate-800/30 px-2 py-1 rounded-lg">
                          <FileText size={12} />
                          {lessonCount}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-800/30 px-2 py-1 rounded-lg">
                          <GraduationCap size={12} />
                          {enrollmentCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Link
                        href={`/dashboard/instructor/courses/${course.id}/lessons`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-3 py-2.5 text-xs sm:text-sm font-medium text-blue-200 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      >
                        <BookOpen size={14} />
                        <span className="hidden sm:inline">Manage</span>
                      </Link>

                      <button
                        onClick={() => startEditCourse(course)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setDeleteConfirm(
                              deleteConfirm === course.id ? null : course.id
                            )
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-gradient-to-r from-red-600/20 to-pink-600/20 px-3 py-2.5 text-sm font-medium text-red-200 hover:from-red-600/30 hover:to-pink-600/30 hover:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                          aria-label="Delete course"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {deleteConfirm === course.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                        <div
                          className="relative w-full max-w-md rounded-2xl border border-red-700/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-red-900/30 animate-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                              <AlertCircle className="text-red-400" size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Delete Course
                              </h3>
                              <p className="text-sm text-slate-400">
                                {course.title}
                              </p>
                            </div>
                          </div>

                          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-sm text-red-200 mb-2">
                              This will permanently delete:
                            </p>
                            <ul className="space-y-1 text-xs text-red-200/70">
                              <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                All lessons and content
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                Student enrollment data
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                Progress tracking
                              </li>
                            </ul>
                            <p className="mt-3 text-sm font-medium text-red-300">
                              This action cannot be undone.
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 text-sm font-medium text-white hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/15 transition-all"
                            >
                              Delete Course
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/courses/${course.id}`}
                      className="block w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 rounded-lg bg-black/20 transition-colors"
                    >
                      View Public Course
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-14 rounded-2xl border border-slate-800/70 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-cyan-900/10 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
              <Sparkles size={24} className="text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Instructor Tips
              </h3>
              <p className="text-slate-400 text-sm">
                Best practices for course success
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "🎯 Engaging Content",
                desc: "Use hands-on labs and real-world examples to keep students engaged.",
              },
              {
                title: "🔄 Keep Updated",
                desc: "Update content regularly with latest security trends and techniques.",
              },
              {
                title: "💬 Student Support",
                desc: "Respond to questions and provide clear learning paths.",
              },
            ].map((tip, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800/50 bg-black/20 p-4 hover:border-slate-700/70 transition-all"
              >
                <div className="text-sm font-medium text-white mb-2">
                  {tip.title}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {tip.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
