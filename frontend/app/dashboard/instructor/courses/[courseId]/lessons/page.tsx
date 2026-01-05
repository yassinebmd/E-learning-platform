"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Plus,
  BookOpenCheck,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Shield,
  ChevronRight,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  courseId: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string | null;
  _count?: {
    lessons: number;
  };
}

const API_BASE = "http://localhost:5001";

export default function CourseLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (courseId) {
      fetchCourse();
      fetchLessons();
    }
  }, [courseId, router]);

  const fetchCourse = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          /* ignored */
        }
        setError(`Failed to load course: ${errorMessage}`);
        setCourse(null);
      }
    } catch (err) {
      console.error("Fetch course error:", err);
      setError("Network error while fetching course.");
      setCourse(null);
    }
  };

  const fetchLessons = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/lessons/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(
          Array.isArray(data)
            ? data.sort((a: Lesson, b: Lesson) => a.order - b.order)
            : []
        );
      } else {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        setError(`Failed to fetch lessons: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Fetch lessons error:", err);
      setError("Network error while fetching lessons.");
    } finally {
      setLoading(false);
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

      const url = editingLesson
        ? `${API_BASE}/api/lessons/${editingLesson.id}`
        : `${API_BASE}/api/lessons`;

      const method = editingLesson ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          courseId,
        }),
      });

      if (response.ok) {
        setSuccessMessage(
          editingLesson
            ? "Lesson updated successfully!"
            : "Lesson created successfully!"
        );
        setShowForm(false);
        setEditingLesson(null);
        setFormData({ title: "", content: "" });
        await fetchLessons();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Submit lesson error:", err);
      setError("Network error during lesson submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage("Lesson deleted successfully!");
        await fetchLessons();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          /* ignored */
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Delete lesson error:", err);
      setError("Network error during lesson deletion.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({ title: lesson.title, content: lesson.content });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
          </div>
          <p className="text-slate-400 mt-6">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
            <div className="flex items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
              <Link
                href="/dashboard/instructor/courses"
                className="inline-flex items-center gap-2 text-blue-200 hover:text-blue-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-lg px-2 py-1"
              >
                <ArrowLeft
                  size={18}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Courses
              </Link>

              <button
                onClick={() => {
                  setEditingLesson(null);
                  setFormData({ title: "", content: "" });
                  setShowForm(!showForm);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all whitespace-nowrap"
              >
                {showForm ? (
                  <>
                    <X size={18} />
                    Close Form
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Lesson
                  </>
                )}
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 mb-4">
                <Shield size={16} className="text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">
                  {course?.category || "Course"}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                {course?.title || `Loading...`}
              </h1>

              <div className="flex items-center gap-4 text-slate-400 mt-3">
                <div className="inline-flex items-center gap-2 text-sm">
                  <FileText size={16} />
                  {lessons.length} lessons
                </div>
                <div className="text-slate-600">•</div>
                <div className="text-sm">
                  {course?.description && course.description.substring(0, 100)}
                  ...
                </div>
              </div>
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
                  {editingLesson ? "Edit Lesson" : "Create New Lesson"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {editingLesson
                    ? "Update lesson details and content."
                    : "Create a new lesson for your course."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Lesson Title *
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                    placeholder="e.g., Introduction to SQL Injection"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Content * (Markdown supported)
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 h-56 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent resize-none transition-all"
                    placeholder="Write your lesson content here. Use markdown for formatting..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    disabled={submitting}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    You can use markdown syntax including **bold**, *italic*,
                    `code`, and more.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {editingLesson ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        {editingLesson ? "Update Lesson" : "Create Lesson"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingLesson(null);
                      setFormData({ title: "", content: "" });
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

          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Course Lessons
                <span className="text-slate-500 ml-2">({lessons.length})</span>
              </h2>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800/70 rounded-2xl bg-slate-900/10">
                <BookOpenCheck
                  className="mx-auto mb-6 text-slate-700"
                  size={64}
                />
                <h3 className="text-xl font-semibold text-white mb-3">
                  No lessons yet
                </h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Create your first lesson to start teaching. Click the "Add
                  Lesson" button to begin.
                </p>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setFormData({ title: "", content: "" });
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <Plus size={18} />
                  Create First Lesson
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="group rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/20 to-black/30 backdrop-blur-sm p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <span className="text-blue-300 text-sm font-semibold">
                              #{lesson.order}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Clock size={12} />
                              {lesson.createdAt
                                ? new Date(
                                    lesson.createdAt
                                  ).toLocaleDateString()
                                : "Date not set"}
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-400 text-sm line-clamp-2">
                          {lesson.content.substring(0, 200)}...
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditLesson(lesson)}
                          className="inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-2.5 text-blue-200 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                          title="Edit lesson"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm(lesson.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-gradient-to-r from-red-600/20 to-pink-600/20 p-2.5 text-red-200 hover:from-red-600/30 hover:to-pink-600/30 hover:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                          title="Delete lesson"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setDeleteConfirm(null)}
              />

              <div className="relative w-full max-w-md rounded-2xl border border-red-700/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-red-900/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="text-red-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Delete Lesson
                    </h3>
                    <p className="text-sm text-slate-400">
                      {lessons.find((l) => l.id === deleteConfirm)?.title}
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
                      Lesson content and materials
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Student progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Any quiz or assignment data
                    </li>
                  </ul>
                  <p className="mt-3 text-sm font-medium text-red-300">
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(deleteConfirm)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 text-sm font-medium text-white hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/15 transition-all"
                  >
                    Delete Lesson
                  </button>
                </div>
              </div>
            </div>
          )}

          {lessons.length > 0 && (
            <div className="mt-12 rounded-2xl border border-slate-800/70 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-cyan-900/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles size={24} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Content Tips
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Improve your lesson quality
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: "📝 Use Markdown",
                    desc: "Format code with backticks, use bold for emphasis, and create lists.",
                  },
                  {
                    title: "🎯 Be Clear",
                    desc: "Write concise explanations with practical examples and real-world applications.",
                  },
                  {
                    title: "📚 Organize",
                    desc: "Structure lessons logically with headers, sections, and step-by-step instructions.",
                  },
                ].map((tip, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800/50 bg-black/20 p-4"
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
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
