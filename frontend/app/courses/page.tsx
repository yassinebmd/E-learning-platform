"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  BookOpen,
  User as UserIcon,
  CalendarDays,
  Search,
  Filter,
  Shield,
  Award,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  CheckCircle,
  PlayCircle,
  ExternalLink,
  AlertCircle,
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
  instructor: { name: string; email: string; id: string };
  _count?: { lessons: number; enrollments: number };
}

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  createdAt: string;
  course: Course;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

type SortKey = "latest" | "popular" | "lessons";

const API_BASE = "http://localhost:5001";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("latest");

  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(
    null
  );
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const categories = [
    "All",
    "Web Security",
    "Network Security",
    "Cryptography",
    "Reverse Engineering",
    "Forensics",
    "Mobile Security",
  ];

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/courses`, {
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(
            data?.error || `Error ${res.status}: ${res.statusText}`
          );
        }

        const data = await safeJson(res);
        setCourses(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "STUDENT") {
      setEnrollments([]);
      return;
    }

    const fetchEnrollments = async () => {
      setEnrollmentsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setEnrollments([]);
          return;
        }

        const response = await fetch(`${API_BASE}/api/enroll`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEnrollments(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch enrollments");
          setEnrollments([]);
        }
      } catch (err) {
        console.error("Error fetching enrollments:", err);
        setEnrollments([]);
      } finally {
        setEnrollmentsLoading(false);
      }
    };

    fetchEnrollments();
  }, [isAuthenticated, user]);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map((enrollment) => enrollment.courseId));
  }, [enrollments]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = courses;

    if (q) {
      result = result.filter((c) => {
        const title = (c.title || "").toLowerCase();
        const desc = (c.description || "").toLowerCase();
        const cat = (c.category || "").toLowerCase();
        const instructor = (c.instructor?.name || "").toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          instructor.includes(q)
        );
      });
    }

    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category === selectedCategory);
    }

    const sorted = [...result].sort((a, b) => {
      if (sortKey === "latest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortKey === "popular") {
        return (b._count?.enrollments || 0) - (a._count?.enrollments || 0);
      }
      return (b._count?.lessons || 0) - (a._count?.lessons || 0);
    });

    return sorted;
  }, [courses, searchQuery, selectedCategory, sortKey]);

  const totalLessons = useMemo(
    () => courses.reduce((acc, c) => acc + (c._count?.lessons || 0), 0),
    [courses]
  );
  const totalEnrollments = useMemo(
    () => courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0),
    [courses]
  );
  const totalCategories = useMemo(
    () => new Set(courses.map((c) => c.category)).size,
    [courses]
  );

  const handleEnroll = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }

    if (enrolledCourseIds.has(courseId)) {
      router.push(`/dashboard/courses/${courseId}`);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setEnrollingCourseId(courseId);
    setBanner(null);

    try {
      const response = await fetch(`${API_BASE}/api/enroll/${courseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const enrollment = await response.json();

        setEnrollments((prev) => [...prev, enrollment]);

        setBanner({
          type: "success",
          msg: "Successfully enrolled! Redirecting to course...",
        });

        setTimeout(() => {
          router.push(`/dashboard/courses/${courseId}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setBanner({
          type: "error",
          msg: `Enrollment failed: ${errorData.error || response.statusText}`,
        });
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      setBanner({
        type: "error",
        msg: "Network error during enrollment. Please try again.",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const getEnrollmentStatus = (courseId: string) => {
    if (!isAuthenticated || user?.role !== "STUDENT") {
      return {
        isEnrolled: false,
        enrollment: null,
        progress: 0,
        canContinue: false,
      };
    }

    const enrollment = enrollments.find((e) => e.courseId === courseId);
    return {
      isEnrolled: !!enrollment,
      enrollment: enrollment || null,
      progress: enrollment?.progress || 0,
      canContinue: enrollment && enrollment.progress > 0,
    };
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
          </div>
          <p className="text-slate-400 mt-6">Loading course catalog…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-200">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Learn Security
              </span>{" "}
              <span className="text-white">the Practical Way</span>
            </h1>

            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Curated offensive & defensive courses built for real-world skill:
              labs, walkthroughs, and expert-led modules.
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search courses, topics, or instructors…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-black/40 px-4 py-4 pl-12 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm mr-1">
                  <Filter size={16} />
                  <span>Filter</span>
                </div>

                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={active}
                      className={[
                        "rounded-full px-4 py-2 text-sm transition-all outline-none",
                        "focus:ring-2 focus:ring-blue-500/40",
                        active
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/15"
                          : "bg-slate-900/40 text-slate-300 hover:bg-slate-800/60",
                      ].join(" ")}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-center gap-3 text-sm">
                <span className="text-slate-400 inline-flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  Sort
                </span>
                <div className="inline-flex rounded-xl border border-slate-800 bg-black/30 p-1">
                  {[
                    { key: "latest", label: "Latest" },
                    { key: "popular", label: "Most Enrolled" },
                    { key: "lessons", label: "Most Lessons" },
                  ].map((o) => {
                    const active = sortKey === (o.key as SortKey);
                    return (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setSortKey(o.key as SortKey)}
                        className={[
                          "px-3 py-2 rounded-lg transition-all outline-none",
                          "focus:ring-2 focus:ring-blue-500/40",
                          active
                            ? "bg-slate-800/70 text-white"
                            : "text-slate-400 hover:text-slate-200",
                        ].join(" ")}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { label: "Total Courses", value: courses.length },
                { label: "Total Lessons", value: totalLessons },
                { label: "Enrollments", value: totalEnrollments },
                { label: "Categories", value: totalCategories },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-800/70 bg-slate-900/20 backdrop-blur-sm p-4 text-center"
                >
                  <div className="text-2xl font-semibold text-white mb-1">
                    {s.value}
                  </div>
                  <div className="text-slate-400 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {banner && (
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 rounded-2xl border px-6 py-4 backdrop-blur-sm ${
            banner.type === "success"
              ? "border-emerald-500/25 bg-emerald-900/10 text-emerald-100"
              : "border-red-500/25 bg-red-900/10 text-red-100"
          }`}
        >
          <div className="text-sm font-medium">{banner.msg}</div>
        </div>
      )}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {error && (
          <div className="mb-8 rounded-2xl border border-red-700/30 bg-red-900/10 px-6 py-5 text-red-200 backdrop-blur-sm">
            <div className="font-semibold">Couldn't load courses</div>
            <div className="text-sm text-red-200/80 mt-1">{error}</div>
          </div>
        )}

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Course Catalog{" "}
              <span className="text-slate-500">({filteredCourses.length})</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Pick a track and start building measurable security skill.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/15 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Shield size={16} />
            Go to Dashboard
          </Link>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800/70 rounded-2xl bg-slate-900/10">
            <BookOpen className="mx-auto mb-6 text-slate-700" size={64} />
            <p className="text-slate-300 text-lg mb-2">No courses found</p>
            <p className="text-slate-500 text-sm">
              Try a different keyword or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const { isEnrolled, progress, canContinue } = getEnrollmentStatus(
                course.id
              );

              return (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/20 to-black/30 overflow-hidden backdrop-blur-sm transition-all hover:border-blue-500/45 hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  <Link href={`/courses/${course.id}`} className="block">
                    <div className="relative h-48 overflow-hidden">
                      {course.thumbnail ? (
                        <>
                          <img
                            src={course.thumbnail}
                            alt={`${course.title} thumbnail`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                        </>
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                          <div className="text-center">
                            <Shield
                              size={46}
                              className="text-blue-500/45 mx-auto mb-2"
                            />
                            <span className="text-blue-200/70 text-sm">
                              VulnCore Course
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-4 left-4">
                        <span className="rounded-full border border-blue-500/30 bg-black/70 px-3 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-sm">
                          {course.category}
                        </span>
                      </div>

                      <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-black/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
                        <TrendingUp size={12} />
                        {course._count?.enrollments || 0}
                      </div>

                      {isEnrolled && (
                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-900/70 px-3 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-sm flex items-center gap-1">
                            <CheckCircle size={12} />
                            Enrolled
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                          <BookOpen size={14} className="text-blue-300" />
                        </span>
                        {course._count?.lessons || 0} lessons
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <CalendarDays size={12} />
                        {new Date(course.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <Link href={`/courses/${course.id}`} className="block">
                      <h3 className="text-lg font-semibold text-white tracking-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-slate-400 text-sm mt-2 line-clamp-2 min-h-[40px]">
                      {course.description}
                    </p>

                    {isEnrolled && progress > 0 && (
                      <div className="mt-4 mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <UserIcon size={14} className="text-blue-200" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-sm text-white font-medium line-clamp-1 max-w-[120px]">
                            {course.instructor?.name || "Expert Instructor"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Instructor
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex-1 inline-flex items-center justify-center rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-600/15 to-purple-600/15 px-3 py-2.5 text-sm font-medium text-blue-200 hover:from-blue-600/25 hover:to-purple-600/25 hover:border-blue-500/45 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      >
                        View Details
                      </Link>

                      {enrollmentsLoading ? (
                        <button
                          disabled
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
                        >
                          <Loader2 size={14} className="animate-spin" />
                          Checking...
                        </button>
                      ) : isEnrolled ? (
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-3 py-2.5 text-sm font-medium text-emerald-200 hover:from-emerald-600/35 hover:to-teal-600/35 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        >
                          {canContinue ? (
                            <>
                              <PlayCircle size={14} />
                              Continue
                            </>
                          ) : (
                            <>
                              <BookOpen size={14} />
                              Start Learning
                            </>
                          )}
                        </Link>
                      ) : !isAuthenticated ? (
                        <button
                          onClick={(e) => handleEnroll(course.id, e)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-3 py-2.5 text-sm font-medium text-emerald-200 hover:from-emerald-600/35 hover:to-teal-600/35 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        >
                          <CheckCircle size={14} />
                          Enroll
                        </button>
                      ) : user?.role !== "STUDENT" ? (
                        <button
                          disabled
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
                        >
                          <AlertCircle size={14} />
                          Instructor
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleEnroll(course.id, e)}
                          disabled={enrollingCourseId === course.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-3 py-2.5 text-sm font-medium text-emerald-200 hover:from-emerald-600/35 hover:to-teal-600/35 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enrollingCourseId === course.id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Enrolling
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Enroll
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
