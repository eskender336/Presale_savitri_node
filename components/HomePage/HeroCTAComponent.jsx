import React from "react";

const HeroCTAComponent = ({ isDarkMode }) => {
  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#080610]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf2]";

  const innerBgColor = isDarkMode ? "bg-[#0A080D]" : "bg-white";
  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-600";
  const cardBg = isDarkMode ? "bg-[#14101A]/40" : "bg-white/40";

  return (
    <div
      className={`w-full ${bgGradient} py-20 md:py-32 overflow-hidden relative`}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`rounded-3xl ${cardBg} backdrop-blur-md border ${
            isDarkMode ? "border-gray-800/20" : "border-gray-200/60"
          } shadow-xl overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-12 md:gap-16">
            {/* Logo Section */}
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 transform transition-all duration-700 hover:scale-105">
                {/* Outer ring with gradient and glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 animate-pulse-slow shadow-lg shadow-indigo-500/30"></div>

                {/* Inner space */}
                <div
                  className={`absolute inset-2 rounded-full ${innerBgColor}`}
                ></div>

                {/* Particle effects */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="particle particle-1"></div>
                  <div className="particle particle-2"></div>
                  <div className="particle particle-3"></div>
                </div>

                {/* Blue/purple orbital lines */}
                <div className="absolute inset-8 rounded-full animate-spin-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <ellipse
                      cx="50"
                      cy="50"
                      rx="40"
                      ry="20"
                      fill="none"
                      stroke="url(#orbital-gradient)"
                      strokeWidth="1.5"
                      transform="rotate(30 50 50)"
                      className="animate-pulse"
                    />
                    <ellipse
                      cx="50"
                      cy="50"
                      rx="40"
                      ry="20"
                      fill="none"
                      stroke="url(#orbital-gradient)"
                      strokeWidth="1.5"
                      transform="rotate(150 50 50)"
                      className="animate-pulse"
                    />
                    <ellipse
                      cx="50"
                      cy="50"
                      rx="40"
                      ry="20"
                      fill="none"
                      stroke="url(#orbital-gradient)"
                      strokeWidth="1.5"
                      transform="rotate(270 50 50)"
                      className="animate-pulse"
                    />

                    {/* Center lightning bolt with animation */}
                    <path
                      d="M55 40 L45 50 L55 50 L45 70"
                      stroke="url(#bolt-gradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="animate-pulse"
                    />

                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient
                        id="orbital-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#C026D3" />
                      </linearGradient>
                      <linearGradient
                        id="bolt-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#C026D3" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="w-full md:w-2/3 text-center md:text-left">
              <div className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-6">
                <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
                  Presale Now Live
                </p>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500 mb-6 leading-tight">
                Secure the Future, Join
                <br />
                Lightchain Protocol AI
              </h2>

              <p
                className={`${textSecondary} text-base md:text-lg mb-8 max-w-2xl leading-relaxed`}
              >
                Be at the forefront of technological evolution with Lightchain
                AI's presale. Secure exclusive access to discounted tokens and
                groundbreaking features like PoI Consensus and AIVM. Join a
                community driving intelligent, decentralized solutions and
                redefining blockchain innovation. Your journey into the future
                of AI and blockchain begins today—step into the Lightchain
                ecosystem now!
              </p>

              {/* Feature highlights */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div
                  className={`px-4 py-2 rounded-full ${
                    isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100"
                  } ${
                    isDarkMode ? "text-indigo-300" : "text-indigo-700"
                  } text-sm font-medium flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  PoI Consensus
                </div>
                <div
                  className={`px-4 py-2 rounded-full ${
                    isDarkMode ? "bg-teal-500/10" : "bg-teal-100"
                  } ${
                    isDarkMode ? "text-teal-300" : "text-teal-700"
                  } text-sm font-medium flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  AIVM Integration
                </div>
                <div
                  className={`px-4 py-2 rounded-full ${
                    isDarkMode ? "bg-purple-500/10" : "bg-purple-100"
                  } ${
                    isDarkMode ? "text-purple-300" : "text-purple-700"
                  } text-sm font-medium flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Transparent Governance
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button className="bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white px-8 py-4 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300 font-medium transform hover:scale-105 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Join Presale
                </button>
                <button
                  className={`border-2 ${
                    isDarkMode
                      ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                      : "border-indigo-500/50 text-indigo-700 hover:bg-indigo-100/80"
                  } px-8 py-4 rounded-full transition-all duration-300 font-medium flex items-center backdrop-blur-sm`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  Learn More
                </button>
              </div>

              {/* Token sale progress indicator */}
              <div className="mt-8 pt-6 border-t border-gray-800/10">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${textSecondary}`}>
                    Presale Progress
                  </span>
                  <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
                    64% Complete
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-700/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"
                    style={{ width: "64%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(to right, #34ccc3, #6366f1);
          pointer-events: none;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          animation: float1 7s infinite ease-in-out;
        }

        .particle-2 {
          top: 60%;
          left: 80%;
          animation: float2 9s infinite ease-in-out;
        }

        .particle-3 {
          top: 40%;
          left: 50%;
          animation: float3 8s infinite ease-in-out;
        }

        @keyframes float1 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, 20px);
          }
          50% {
            transform: translate(20px, 30px);
          }
          75% {
            transform: translate(-10px, 10px);
          }
        }

        @keyframes float2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-20px, -15px);
          }
          50% {
            transform: translate(-30px, 5px);
          }
          75% {
            transform: translate(10px, -20px);
          }
        }

        @keyframes float3 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(15px, -20px);
          }
          50% {
            transform: translate(-10px, -25px);
          }
          75% {
            transform: translate(-20px, 10px);
          }
        }
      `}</style>
    </div>
  );
};

export default HeroCTAComponent;
