"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Carousel } from "react-responsive-carousel";
import { Info } from "lucide-react";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<null | {
    totalProposals: number;
    activeProjects: number;
    communityServices: number;
    totalUsers: number;
    totalOrgUnits: number;
    totalRoles: number;
  }>(null);

  const [showDevInfo, setShowDevInfo] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  const handleButtonClick = (btn: string, path: string) => {
    setLoadingBtn(btn);
    setTimeout(() => {
      setLoadingBtn(null);
      router.push(path);
    }, 1000);
  };

  const overviewCards = stats
    ? [
        { title: "Total Proposals", value: stats.totalProposals },
        { title: "Active Runs", value: stats.activeProjects },
        { title: "Community Services", value: stats.communityServices },
        { title: "Total Users", value: stats.totalUsers },
        { title: "Total Org Units", value: stats.totalOrgUnits },
        { title: "Total Roles", value: stats.totalRoles },
      ]
    : [];

  const featureCards = [
    {
      title: "Research Projects",
      desc: "Monitor ongoing and completed research projects with detailed analytics and progress reports.",
    },
    {
      title: "Technology Transfer",
      desc: "Track technology innovations from concept to implementation and commercialization.",
    },
    {
      title: "Community Service",
      desc: "Organize and track workshops, volunteer programs, and outreach initiatives.",
    },
    {
      title: "Publications",
      desc: "Manage academic papers, articles, and reports produced by the system users.",
    },
    {
      title: "Repositories",
      desc: "Maintain repositories for projects, datasets, and technology assets.",
    },
  ];

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center overflow-hidden">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="flex flex-col-reverse md:flex-row items-center justify-between w-full px-4 sm:px-6 md:px-12 py-16 md:py-32 relative z-10">
          {/* Hero Text */}
          <div className="md:w-1/2 text-center md:text-left z-10 relative p-4 sm:p-6 md:p-12 xl:px-32 2xl:px-40">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl 2xl:text-5xl font-extrabold leading-tight mb-4 sm:mb-6 md:mb-8">
              PRTCMS
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-xl 2xl:text-xl mb-6 sm:mb-8 md:mb-10">
              Project Research, Technology Transfer & Community Service
              Management System
            </p>

            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 sm:gap-4">
              <button
                onClick={() => handleButtonClick("login", "/login")}
                className="px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 font-semibold rounded-lg shadow-lg dark:bg-black dark:text-white dark:hover:bg-gray-800 bg-white text-black hover:bg-gray-200 transition duration-300 flex items-center justify-center gap-2"
              >
                {loadingBtn === "login" ? (
                  <div className="loader2 h-5 w-5 border-2 border-t-2 border-gray-300 dark:border-gray-100 rounded-full animate-spin"></div>
                ) : (
                  "Login"
                )}
              </button>

              <button
                onClick={() => handleButtonClick("register", "/register")}
                className="px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 border font-semibold rounded-lg dark:border-white dark:bg-black dark:text-white dark:hover:bg-gray-800 border-black bg-white text-black hover:bg-gray-200 transition duration-300 flex items-center justify-center gap-2"
              >
                {loadingBtn === "register" ? (
                  <div className="loader2 h-5 w-5 border-2 border-t-2 border-gray-300 dark:border-gray-100 rounded-full animate-spin"></div>
                ) : (
                  "Register"
                )}
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="md:w-1/2 mb-12 md:mb-0 flex justify-center md:justify-end md:py-12 lg:py-16 xl:py-16 2xl:py-20 z-10 relative xl:pr-32 2xl:pr-40 hidden md:flex">
            <img
              src="/illustrate.png"
              alt="PRTCMS illustration"
              className="w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] h-auto object-contain"
            />
          </div>
        </div>

        {/* Gradient Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500"></div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-32 sm:h-40 md:h-48 lg:h-48 xl:h-48 2xl:h-56"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              className="fill-indigo-800"
              d="M0,64L48,90.7C96,117,192,171,288,192C384,213,480,203,576,176C672,149,768,107,864,106.7C960,107,1056,149,1152,181.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">
          Live System Overview
        </h2>
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {overviewCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition duration-300 cursor-pointer text-center"
              >
                <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
                <p className="text-5xl font-bold text-indigo-600">
                  {card.value}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Updated on page load
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="loader2 h-20 w-20 border-8 border-t-8 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          </div>
        )}
      </section>

      {/* Features Slider */}
      <section className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 text-center">
            System Features
          </h2>
          <Carousel
            showThumbs={false}
            infiniteLoop
            autoPlay
            interval={5000}
            showStatus={false}
            showIndicators
            centerMode
            centerSlidePercentage={80}
            className="!pb-12"
          >
            {featureCards.map((feature, idx) => (
              <div
                key={idx}
                className="relative bg-gradient-to-tr from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-900 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition duration-500 mx-4 cursor-pointer group flex flex-col justify-center"
                style={{ minHeight: "300px" }}
              >
                <div className="mb-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 group-hover:animate-bounce shadow-md">
                  🔹
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/90 group-hover:text-white transition duration-300">
                  {feature.desc}
                </p>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 rounded-2xl transition duration-300 pointer-events-none"></div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-indigo-600 text-white py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Get Started with PRTCMS</h2>
        <p className="mb-8">
          Join now to manage research, projects, and community service
          efficiently.
        </p>
        <button
          onClick={() => handleButtonClick("registerNow", "/register")}
          className="px-10 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:scale-105 transform transition duration-300 flex items-center justify-center gap-2"
        >
          {loadingBtn === "registerNow" ? (
            <div className="loader2 h-5 w-5 border-2 border-t-2 border-gray-300 dark:border-gray-100 rounded-full animate-spin"></div>
          ) : (
            "Register Now"
          )}
        </button>
      </section>

      {/* Developer Info Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowDevInfo(!showDevInfo)}
          className="text-indigo-600 dark:text-indigo-400 p-2 rounded-full shadow-lg hover:scale-110 transition transform"
          title="Developer Info"
        >
          <Info size={28} />
        </button>

        {showDevInfo && (
          <div className="absolute bottom-16 right-0 w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-xl shadow-2xl transition transform">
            <h4 className="font-bold mb-2">Developer Info</h4>
            <p>
              <strong>Name:</strong> Habitamu Asimare
            </p>
            <p>
              <strong>Email:</strong> 2gethas@gmail.com
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Professional Web Application Developer over the last 7 years
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; {new Date().getFullYear()} PRTCMS. All rights reserved.</p>
      </footer>

      {/* Loader styles */}
      <style jsx>{`
        .loader2 {
          border-top-color: #6366f1;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
