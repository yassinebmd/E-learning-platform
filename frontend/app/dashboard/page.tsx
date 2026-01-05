"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  BookOpen,
  AlertCircle,
  User as UserIcon,
  CalendarDays,
  BookText,
  GraduationCap,
  Shield,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/layout/Footer";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string | null;
  instructorId: string;
  createdAt: string;
  instructor: {
    name: string;
    email: string;
    id: string;
  };
  _count?: {
    lessons: number;
    enrollments: number;
  };
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

const API_BASE = "http://localhost:5001";

export default function StudentDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(
    null
  );
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!authLoading && isAuthenticated && user?.role === "INSTRUCTOR") {
      router.push("/dashboard/instructor/courses");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingContent(true);
      setError("");
      if (!isAuthenticated || user?.role !== "STUDENT") return;

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing.");
        setLoadingContent(false);
        return;
      }

      try {
        const allCoursesRes = await fetch(`${API_BASE}/api/courses`, {
          headers: { "Content-Type": "application/json" },
        });
        if (allCoursesRes.ok) {
          setAllCourses(await allCoursesRes.json());
        } else {
          const errData = await allCoursesRes.json();
          setError(
            `Failed to fetch all courses: ${
              errData.error || allCoursesRes.statusText
            }`
          );
        }

        const enrolledCoursesRes = await fetch(`${API_BASE}/api/enroll`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (enrolledCoursesRes.ok) {
          setEnrolledCourses(await enrolledCoursesRes.json());
        } else {
          const errData = await enrolledCoursesRes.json();
          setError((prev) =>
            prev
              ? `${prev} | Failed to fetch enrollments: ${
                  errData.error || enrolledCoursesRes.statusText
                }`
              : `Failed to fetch enrollments: ${
                  errData.error || enrolledCoursesRes.statusText
                }`
          );
        }
      } catch (err) {
        console.error("Fetch data network error:", err);
        setError(
          "Network error occurred while fetching data. Is backend running?"
        );
      } finally {
        setLoadingContent(false);
      }
    };

    if (!authLoading && isAuthenticated && user?.role === "STUDENT") {
      router.refresh();
      fetchData();
    }
  }, [authLoading, isAuthenticated, user]);

  const handleEnroll = async (courseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setEnrollingCourseId(courseId);

    try {
      const response = await fetch(`${API_BASE}/api/enroll/${courseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setSuccessBanner(
          "Successfully enrolled! Starting your learning journey..."
        );
        setTimeout(() => setSuccessBanner(null), 3000);

        const allCoursesRes = await fetch(`${API_BASE}/api/courses`, {
          headers: { "Content-Type": "application/json" },
        });
        if (allCoursesRes.ok) setAllCourses(await allCoursesRes.json());

        const enrolledCoursesRes = await fetch(`${API_BASE}/api/enroll`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (enrolledCoursesRes.ok)
          setEnrolledCourses(await enrolledCoursesRes.json());
      } else {
        const errorData = await response.json();
        setError(
          `Enrollment failed: ${errorData.error || response.statusText}`
        );
      }
    } catch (err) {
      console.error("Enrollment network error:", err);
      setError("Network error occurred during enrollment. Please try again.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (authLoading || loadingContent) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-400 mt-6">
            {authLoading
              ? "Authenticating session..."
              : "Loading your dashboard..."}
          </p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "STUDENT") {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <AlertCircle className="mx-auto mb-6 text-red-500" size={64} />
          <h1 className="text-2xl font-semibold text-red-200 mb-3">
            Access Denied
          </h1>
          <p className="text-slate-300 mb-6">
            You must be logged in as a student to view this dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Shield size={16} />
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const coursesNotEnrolledIn = allCourses.filter(
    (course) =>
      !enrolledCourses.some((enrollment) => enrollment.course.id === course.id)
  );

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-200">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-700/30 bg-red-900/10 px-6 py-4 text-red-200 backdrop-blur-sm">
            <div className="font-semibold flex items-center gap-2">
              <AlertCircle size={18} />
              Error
            </div>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {successBanner && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-900/10 px-6 py-4 text-emerald-200 backdrop-blur-sm animate-in">
            <div className="font-semibold flex items-center gap-2">
              <CheckCircle size={18} />
              Success!
            </div>
            <p className="text-sm mt-1">{successBanner}</p>
          </div>
        )}

        <section className="mb-14">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-3xl font-semibold text-white tracking-tight inline-flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <GraduationCap size={20} className="text-blue-200" />
                  </div>
                  My Learning Path
                </h2>
                <p className="text-slate-400 text-sm mt-2">
                  {enrolledCourses.length} course
                  {enrolledCourses.length !== 1 ? "s" : ""} in progress
                </p>
              </div>
              {enrolledCourses.length > 0 && (
                <div className="rounded-lg border border-slate-800/50 bg-slate-900/30 px-4 py-2">
                  <span className="text-sm text-slate-300">
                    <span className="font-semibold text-white">
                      {Math.round(
                        (enrolledCourses.reduce(
                          (acc, e) => acc + e.completedLessons,
                          0
                        ) /
                          enrolledCourses.reduce(
                            (acc, e) => acc + e.totalLessons,
                            1
                          )) *
                          100
                      )}
                      %
                    </span>{" "}
                    Overall Progress
                  </span>
                </div>
              )}
            </div>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800/50 bg-slate-900/10 py-16 text-center">
              <BookOpen className="mx-auto mb-4 text-slate-600" size={56} />
              <p className="text-slate-400 text-lg mb-3">No enrollments yet</p>
              <p className="text-slate-500 text-sm mb-6">
                Explore the available courses below to start your learning
                journey!
              </p>
              <Link
                href="#discover"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Explore Courses
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => {
                const progressPercent = Math.round(
                  (enrollment.completedLessons / enrollment.totalLessons) * 100
                );
                return (
                  <Link
                    key={enrollment.id}
                    href={`/dashboard/courses/${enrollment.course.id}`}
                    className="group rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/20 to-black/30 overflow-hidden backdrop-blur-sm transition-all hover:border-blue-500/45 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="relative h-40 overflow-hidden bg-slate-900/50">
                      {enrollment.course.thumbnail ? (
                        <img
                          src={enrollment.course.thumbnail}
                          alt={`${enrollment.course.title} thumbnail`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                          <Shield size={48} className="text-blue-500/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-4 left-4">
                        <span className="rounded-full border border-blue-500/30 bg-black/70 px-3 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-sm">
                          {enrollment.course.category}
                        </span>
                      </div>

                      <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-black/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
                        <TrendingUp size={12} />
                        {progressPercent}%
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-200 transition-colors">
                        {enrollment.course.title}
                      </h3>

                      <p className="text-slate-400 text-sm mt-2 line-clamp-1">
                        {enrollment.course.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 mb-4">
                        <span className="inline-flex items-center gap-1">
                          <BookText size={12} />
                          {enrollment.course._count?.lessons || 0} lessons
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserIcon size={12} />
                          {enrollment.course.instructor?.name || "Expert"}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {enrollment.completedLessons} of{" "}
                          {enrollment.totalLessons} lessons completed
                        </p>
                      </div>

                      <button className="w-full rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 text-sm font-medium text-blue-200 hover:from-blue-600/35 hover:to-purple-600/35 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all inline-flex items-center justify-center gap-2 group">
                        Continue Learning
                        <ArrowRight
                          size={14}
                          className="opacity-70 group-hover:translate-x-0.5 transition-transform"
                        />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {coursesNotEnrolledIn.length > 0 && enrolledCourses.length > 0 && (
          <div className="my-12 border-t border-slate-800/50" />
        )}

        <section id="discover">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-3xl font-semibold text-white tracking-tight inline-flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Zap size={20} className="text-emerald-200" />
                  </div>
                  Discover New Courses
                </h2>
                <p className="text-slate-400 text-sm mt-2">
                  {coursesNotEnrolledIn.length} course
                  {coursesNotEnrolledIn.length !== 1 ? "s" : ""} available
                </p>
              </div>
              {coursesNotEnrolledIn.length > 0 && (
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  View All
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {coursesNotEnrolledIn.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800/50 bg-slate-900/10 py-16 text-center">
              <Award className="mx-auto mb-4 text-slate-600" size={56} />
              <p className="text-slate-400 text-lg mb-2">
                All courses enrolled!
              </p>
              <p className="text-slate-500 text-sm">
                You're enrolled in all available courses. Great dedication to
                learning!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesNotEnrolledIn.map((course) => (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/20 to-black/30 overflow-hidden backdrop-blur-sm transition-all hover:border-blue-500/45 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-900/50">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={`${course.title} thumbnail`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                        <Shield size={48} className="text-blue-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute top-4 left-4">
                      <span className="rounded-full border border-blue-500/30 bg-black/70 px-3 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-sm">
                        {course.category}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-black/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
                      <TrendingUp size={12} />
                      {course._count?.enrollments || 0}
                    </div>
                  </div>

                  <div className="p-5">
                    <Link href={`/courses/${course.id}`} className="block">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-200 transition-colors">
                        {course.title}
                      </h3>
                    </Link>

                    <p className="text-slate-400 text-sm mt-2 line-clamp-2 h-10">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 mb-4">
                      <span className="inline-flex items-center gap-1">
                        <BookText size={12} />
                        {course._count?.lessons || 0} lessons
                      </span>
                      <span className="inline-flex items-center gap-1 ml-auto">
                        <Clock size={12} />~{(course._count?.lessons || 0) * 30}
                        m
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <UserIcon size={10} className="text-blue-200" />
                      </div>
                      <span className="text-slate-300">
                        {course.instructor?.name || "Expert Instructor"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingCourseId === course.id}
                        className="flex-1 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-3 py-3 text-sm font-medium text-emerald-200 hover:from-emerald-600/35 hover:to-teal-600/35 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {enrollingCourseId === course.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Enroll Now
                          </>
                        )}
                      </button>

                      <Link
                        href={`/courses/${course.id}`}
                        className="flex-1 rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <BookOpen size={14} />
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {enrolledCourses.length === 0 && coursesNotEnrolledIn.length > 0 && (
          <section className="mt-14 text-center">
            <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-cyan-900/10 p-8 md:p-12 backdrop-blur-sm">
              <Shield size={44} className="text-blue-200 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">
                Start Your Security Journey
              </h3>
              <p className="text-slate-400 max-w-2xl mx-auto mb-6">
                Learn hands-on cybersecurity skills with real-world labs and
                expert instructors. Pick your first course and begin today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleEnroll(coursesNotEnrolledIn[0]?.id)}
                  disabled={enrollingCourseId === coursesNotEnrolledIn[0]?.id}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/15 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {enrollingCourseId === coursesNotEnrolledIn[0]?.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Enroll in First Course
                    </>
                  )}
                </button>
                <Link
                  href="/courses"
                  className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-8 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  Browse All Courses
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
