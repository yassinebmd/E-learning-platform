"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Loader2,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  BarChart3,
  Target,
  Shield,
  Sparkles,
  Bookmark,
  Share2,
  Download,
  Zap,
  Eye,
  Lock,
  Unlock,
  Award,
  EyeOff,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
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
  instructor: {
    name: string;
  };
}

const API_BASE = "http://localhost:5001";

const isValidObjectId = (
  id: string | string[] | undefined | null
): id is string => {
  if (typeof id !== "string") {
    console.warn(
      "isValidObjectId (Lesson Viewer): Received non-string ID:",
      id
    );
    return false;
  }
  const trimmedId = id.trim();
  const isValid = /^[0-9a-fA-F]{24}$/.test(trimmedId);
  if (!isValid) {
    console.warn("isValidObjectId (Lesson Viewer): Failed for:", trimmedId);
  }
  return isValid;
};

export default function StudentLessonViewerPage() {
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isParamsReady, setIsParamsReady] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (params) {
      console.log("Params received:", params);
      const rawCourseId = params.id;
      const extractedCourseId = Array.isArray(rawCourseId)
        ? rawCourseId[0]
        : rawCourseId || null;
      setCourseId(extractedCourseId);
      setIsParamsReady(true);
      console.log("Extracted courseId:", extractedCourseId);
    }
  }, [params]);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState("");
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"default" | "fullscreen">("default");
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!isParamsReady) {
      console.log("Waiting for params to be ready...");
      return;
    }

    if (authLoading) {
      console.log("Auth still loading...");
      return;
    }

    if (!isAuthenticated || user?.role !== "STUDENT") {
      console.log(
        "User not authenticated or not a student, redirecting to login"
      );
      router.push("/login");
      return;
    }

    console.log("Lesson Viewer Page: Processed courseId:", courseId);

    if (!courseId) {
      console.log("No courseId found, showing error");
      setError("Course ID not found in URL parameters.");
      setLoadingContent(false);
      return;
    }

    if (!isValidObjectId(courseId)) {
      console.log("Invalid courseId format:", courseId);
      setError("Invalid Course ID format. Please check the URL.");
      setLoadingContent(false);
      return;
    }

    const fetchData = async () => {
      setLoadingContent(true);
      setError("");
      const token = localStorage.getItem("token");

      try {
        console.log("Fetching course data for ID:", courseId);

        const courseRes = await fetch(`${API_BASE}/api/courses/${courseId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!courseRes.ok) {
          const errData = await courseRes.json();
          throw new Error(
            `Failed to load course: ${errData.error || courseRes.statusText}`
          );
        }

        const courseData = await courseRes.json();
        console.log("Course data received:", courseData);
        setCourse(courseData);

        const lessonsRes = await fetch(`${API_BASE}/api/lessons/${courseId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!lessonsRes.ok) {
          const errData = await lessonsRes.json();
          throw new Error(
            `Failed to load lessons: ${errData.error || lessonsRes.statusText}`
          );
        }

        const fetchedLessons = await lessonsRes.json();
        console.log("Lessons received:", fetchedLessons);
        setLessons(
          fetchedLessons.sort((a: Lesson, b: Lesson) => a.order - b.order)
        );

        if (!selectedLesson && fetchedLessons.length > 0) {
          setSelectedLesson(fetchedLessons[0]);
        }

        if (token) {
          console.log("Fetching completions with token");
          const completionsRes = await fetch(
            `${API_BASE}/api/lesson-completion/${courseId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (completionsRes.ok) {
            const completedIds = await completionsRes.json();
            console.log("Completed lesson IDs:", completedIds);
            setCompletedLessonIds(new Set(completedIds));
          } else if (completionsRes.status !== 404) {
            const errData = await completionsRes.json();
            console.warn("Failed to load completions:", errData);
          } else {
            console.log(
              "No completions found (404) - this is normal for new courses"
            );
          }
        } else {
          console.warn("No token found for fetching completions");
        }
      } catch (err: any) {
        console.error("Fetch data error:", err);
        setError(err.message || "Network error occurred. Is backend running?");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchData();
  }, [courseId, isParamsReady, authLoading, isAuthenticated, user, router]);

  const markComplete = useCallback(
    async (lessonId: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setIsCompleting(lessonId);
      setBanner(null);
      try {
        console.log("Marking lesson complete:", lessonId);
        const response = await fetch(
          `${API_BASE}/api/lesson-completion/${lessonId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          console.log("Lesson marked complete successfully");
          setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
          setBanner({
            type: "success",
            msg: "Lesson marked as complete! Well done!",
          });
        } else {
          const errorData = await response.json();
          setBanner({
            type: "error",
            msg: `Failed to mark complete: ${
              errorData.error || response.statusText
            }`,
          });
        }
      } catch (err) {
        console.error("Mark complete network error:", err);
        setBanner({
          type: "error",
          msg: "Network error marking lesson complete.",
        });
      } finally {
        setIsCompleting(null);
      }
    },
    [router]
  );

  const progress =
    lessons.length > 0
      ? Math.round((completedLessonIds.size / lessons.length) * 100)
      : 0;
  const completedCount = completedLessonIds.size;
  const currentLessonIndex = selectedLesson
    ? lessons.findIndex((l) => l.id === selectedLesson.id)
    : -1;
  const hasNextLesson = currentLessonIndex < lessons.length - 1;
  const hasPreviousLesson = currentLessonIndex > 0;

  if (!isParamsReady || authLoading || (loadingContent && !error && courseId)) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
          </div>
          <p className="text-slate-400 mt-6">
            {!isParamsReady
              ? "Loading course parameters..."
              : "Loading course content..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <AlertCircle className="mx-auto mb-6 text-red-500" size={64} />
          <h1 className="text-2xl font-semibold text-red-200 mb-3">
            Error Loading Course
          </h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <p className="text-sm text-slate-500 mb-4">
            Course ID attempted: {courseId}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#07070a] text-slate-200 ${
        viewMode === "fullscreen"
          ? "fixed inset-0 z-50 bg-black overflow-hidden"
          : ""
      }`}
    >
      {viewMode !== "fullscreen" && <Navbar />}

      <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <div
        className={`relative ${
          viewMode === "fullscreen" ? "h-full overflow-auto flex flex-col" : ""
        }`}
      >
        {viewMode !== "fullscreen" && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-blue-200 hover:text-blue-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-lg px-2 py-1"
                >
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setViewMode(
                        viewMode === "default" ? "fullscreen" : "default"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  >
                    {viewMode === "default" ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {viewMode === "default" ? "Fullscreen" : "Exit"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 mb-4">
                  <Shield size={16} className="text-blue-300" />
                  <span className="text-blue-200 text-sm font-medium">
                    {course?.category || "Course"}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                  {course?.title || "Course"}
                </h1>

                <p className="text-slate-400 text-sm">
                  {completedCount} of {lessons.length} lessons completed
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/20 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 size={20} className="text-blue-200" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-2xl font-semibold text-white">
                        {progress}%
                      </div>
                      <div className="text-slate-400 text-xs">Progress</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/20 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle size={20} className="text-emerald-200" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-2xl font-semibold text-white">
                        {completedCount}
                      </div>
                      <div className="text-slate-400 text-xs">Completed</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/20 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Clock size={20} className="text-purple-200" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-2xl font-semibold text-white">
                        {lessons.length * 30}
                      </div>
                      <div className="text-slate-400 text-xs">Minutes</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/20 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Award size={20} className="text-cyan-200" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-2xl font-semibold text-white text-sm line-clamp-1">
                        {lessons.length > 0 && completedCount === lessons.length
                          ? "✓ Done"
                          : "Learning"}
                      </div>
                      <div className="text-slate-400 text-xs">Status</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="h-2 w-full rounded-full bg-slate-800/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`${
            viewMode === "fullscreen"
              ? "flex-1 overflow-auto"
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
          }`}
        >
          <div
            className={`grid gap-6 ${
              viewMode === "fullscreen"
                ? "grid-cols-1 h-full"
                : "lg:grid-cols-4"
            }`}
          >
            <div
              className={`${
                viewMode === "fullscreen" ? "hidden" : "lg:col-span-1"
              }`}
            >
              <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/30 to-black/30 backdrop-blur-sm overflow-hidden sticky top-24 max-h-[calc(100vh-300px)]">
                <div className="p-5 border-b border-slate-800/70 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen size={18} />
                    Lessons
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {completedCount}/{lessons.length} completed
                  </p>
                </div>

                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: "calc(100vh - 400px)" }}
                >
                  <div className="p-3 space-y-1">
                    {lessons.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <BookOpen className="mx-auto mb-3" size={32} />
                        <p className="text-sm">No lessons available</p>
                      </div>
                    ) : (
                      lessons.map((lesson) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const isSelected = selectedLesson?.id === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setSidebarOpen(false);
                            }}
                            className={`
                              w-full text-left p-3 rounded-xl transition-all duration-200
                              focus:outline-none focus:ring-2 focus:ring-blue-500/40
                              ${
                                isSelected
                                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                                  : "hover:bg-slate-800/30 border border-transparent"
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`
                                h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium
                                ${
                                  isCompleted
                                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                                    : isSelected
                                    ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                                    : "bg-slate-800/50 border border-slate-700/50 text-slate-400"
                                }
                              `}
                              >
                                {isCompleted ? (
                                  <CheckCircle size={14} />
                                ) : (
                                  lesson.order
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div
                                  className={`
                                  text-xs font-medium line-clamp-1
                                  ${
                                    isSelected ? "text-white" : "text-slate-300"
                                  }
                                  ${isCompleted ? "text-emerald-300" : ""}
                                `}
                                >
                                  {lesson.title}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Clock size={10} />
                                  30m
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`${
                viewMode === "fullscreen"
                  ? "col-span-1 h-full flex flex-col"
                  : "lg:col-span-3"
              }`}
            >
              <div
                className={`rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/20 to-black/30 backdrop-blur-sm overflow-hidden flex flex-col ${
                  viewMode === "fullscreen" ? "h-full" : ""
                }`}
              >
                {selectedLesson ? (
                  <>
                    {banner && (
                      <div
                        className={`px-6 py-3 border-b ${
                          banner.type === "success"
                            ? "border-emerald-500/20 bg-emerald-900/10 text-emerald-100"
                            : "border-red-500/20 bg-red-900/10 text-red-100"
                        }`}
                      >
                        <div className="text-sm font-medium flex items-center gap-2">
                          {banner.type === "success" ? (
                            <CheckCircle size={16} />
                          ) : (
                            <AlertCircle size={16} />
                          )}
                          {banner.msg}
                        </div>
                      </div>
                    )}

                    <div className="p-6 border-b border-slate-800/70 bg-gradient-to-r from-blue-900/5 via-purple-900/5 to-transparent">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1">
                              <Target size={14} className="text-blue-300" />
                              <span className="text-blue-200 text-sm font-medium">
                                Lesson {selectedLesson.order}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/30 px-3 py-1">
                              <Clock size={14} className="text-slate-400" />
                              <span className="text-slate-400 text-sm">
                                30 min
                              </span>
                            </div>
                            {completedLessonIds.has(selectedLesson.id) && (
                              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-900/20 px-3 py-1">
                                <CheckCircle
                                  size={14}
                                  className="text-emerald-300"
                                />
                                <span className="text-emerald-300 text-sm">
                                  Completed
                                </span>
                              </div>
                            )}
                          </div>
                          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                            {selectedLesson.title}
                          </h2>
                        </div>

                        {!completedLessonIds.has(selectedLesson.id) && (
                          <button
                            onClick={() => markComplete(selectedLesson.id)}
                            disabled={isCompleting === selectedLesson.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                          >
                            {isCompleting === selectedLesson.id ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Marking...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} />
                                Mark Complete
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-6 md:p-8 overflow-y-auto ${
                        viewMode === "fullscreen" ? "flex-1" : ""
                      }`}
                    >
                      <div
                        className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6"
                        dangerouslySetInnerHTML={{
                          __html: selectedLesson.content,
                        }}
                      />

                      {completedLessonIds.has(selectedLesson.id) && (
                        <div className="mt-10 p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900/10 to-teal-900/10 backdrop-blur-sm">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                              <Sparkles
                                size={24}
                                className="text-emerald-300"
                              />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-emerald-200 mb-1">
                                Great work!
                              </h4>
                              <p className="text-emerald-100/70 text-sm">
                                Lesson completed. Ready for the next challenge?
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800/70 p-6 bg-slate-900/10 backdrop-blur-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (currentLessonIndex > 0) {
                                setSelectedLesson(
                                  lessons[currentLessonIndex - 1]
                                );
                              }
                            }}
                            disabled={!hasPreviousLesson}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight size={16} className="rotate-180" />
                            <span className="hidden sm:inline">Previous</span>
                          </button>

                          <button
                            onClick={() => {
                              if (hasNextLesson) {
                                setSelectedLesson(
                                  lessons[currentLessonIndex + 1]
                                );
                              }
                            }}
                            disabled={!hasNextLesson}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2.5 text-sm font-medium text-blue-200 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {currentLessonIndex + 1} of {lessons.length}
                        </div>
                      </div>
                    </div>
                  </>
                ) : lessons.length > 0 ? (
                  <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                    <BookOpen className="mb-6 text-slate-600" size={56} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Select a Lesson
                    </h3>
                    <p className="text-slate-400 mb-6 max-w-sm">
                      Choose a lesson from the sidebar to start learning.
                    </p>
                    <button
                      onClick={() => setSelectedLesson(lessons[0])}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/15 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <PlayCircle size={18} />
                      Start Learning
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                    <BookOpen className="mb-6 text-slate-600" size={56} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Lessons Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      This course doesn't have any lessons yet. Check back soon!
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/15 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <ArrowLeft size={18} />
                      Back to Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {selectedLesson &&
                lessons.length > 0 &&
                viewMode !== "fullscreen" && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-slate-400 text-sm">
                      <span className="text-white font-medium">
                        {course?.title}
                      </span>{" "}
                      • Lesson {currentLessonIndex + 1} of {lessons.length}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      >
                        <ArrowLeft size={16} />
                        Dashboard
                      </Link>

                      <Link
                        href={`/courses/${courseId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2.5 text-sm font-medium text-blue-200 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      >
                        <BookOpen size={16} />
                        Course
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {viewMode !== "fullscreen" && <Footer />}
    </div>
  );
}
