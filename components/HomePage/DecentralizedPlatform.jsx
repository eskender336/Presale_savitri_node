import React, { useState, useMemo } from "react";
import { FaPlay } from "react-icons/fa";
import { useWeb3 } from "../../context/Web3Provider";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const STABLE_PRICE = process.env.NEXT_PUBLIC_NEXT_STABLE_PRICE;

const VideoThumbnail = ({ thumbnailSrc, videoSrc, videoTitle, isDarkMode }) => {
  const { contractInfo } = useWeb3();
  const currentPrice = useMemo(() => {
    const p = parseFloat(contractInfo?.tokenPriceUSDT || "0");
    return isFinite(p) ? p.toFixed(2) : "0.00";
  }, [contractInfo?.tokenPriceUSDT]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto"; // Re-enable scrolling
  };

  const bgColor = isDarkMode ? "bg-[#0E0B12]" : "bg-[#f3f3f7]";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const secondaryTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const primaryGradient = "from-teal-400 to-indigo-500";
  const hoverGradient = "from-teal-500 to-indigo-600";

  return (
    <div
      className={`w-full py-20 lg:py-24 px-4 md:px-8 ${bgColor} relative overflow-hidden`}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section header with badge */}
        <div className="text-center mb-12">
          <div className="inline-block p-1.5 px-3 rounded-full text-light-gradient mb-4">
            <p className="text-sm font-medium bg-clip-text text-transparent text-light-gradient">
              Watch Our Video
            </p>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent text-light-gradient">
          See What Makes Savitri Different
          </h2>

          {/* Description Text */}
          <p
            className={`leading-relaxed ${secondaryTextColor} max-w-3xl mx-auto`}
          >
            Savitri puts utility, integrity, and inclusion first. We are building lasting infrastructure where people own their data, devices become network citizens, and AI serves the public good. Watch the vision come alive.
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8 mb-10">
            <div className="w-16 h-1 text-light-gradient rounded-full"></div>
          </div>
        </div>

        {/* Enhanced Thumbnail Container */}
        <div className="max-w-5xl mx-auto relative group">
          {/* Main gradient border with glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 via-indigo-500 to-teal-400 rounded-xl blur opacity-80 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-gradient-x"></div>

          {/* Thumbnail Card */}
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-500 group-hover:scale-[1.01] bg-gradient-to-r from-teal-400/20 via-indigo-500/20 to-teal-400/20"
            onClick={openModal}
          >
            {/* Inner container with rounded corners */}
            <div className="relative rounded-xl overflow-hidden">
              {/* Your Thumbnail Image with zoom effect */}
              <img
                src={thumbnailSrc || "/thumbnail/1.jpg"}
                alt={videoTitle || "Video thumbnail"}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ aspectRatio: "16/9" }}
              />

              {/* Gradient overlay with depth effect */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition duration-300"></div>

              {/* Play Button Overlay with pulse effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  {/* Pulse animation rings */}
                  <div className="absolute -inset-4 rounded-full bg-white/10 animate-ping opacity-75 group-hover:opacity-100"></div>
                  <div
                    className="absolute -inset-8 rounded-full bg-white/5 animate-ping opacity-0 group-hover:opacity-75"
                    style={{ animationDuration: "2s", animationDelay: "0.3s" }}
                  ></div>

                  {/* Play button */}
                  <div className="w-20 h-20 md:w-24 md:h-24 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-20 transition-transform duration-300 group-hover:scale-110">
                    <FaPlay className="text-white text-2xl md:text-3xl ml-2" />
                  </div>
                </div>
              </div>

              {/* Optional video title overlay */}
              {videoTitle && (
                <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white text-shadow">
                    {videoTitle}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional information badges */}
        <div className="flex flex-wrap justify-center mt-12 gap-4">
          <div
            className={`px-4 py-2 rounded-full ${
              isDarkMode ? "bg-teal-500/10" : "bg-teal-100"
            } flex items-center space-x-2`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? "bg-teal-400" : "bg-teal-500"
              }`}
            ></span>
            <span className={isDarkMode ? "text-teal-300" :  "text-white"}>
              Learn about {TOKEN_NAME}
            </span>
          </div>
          <div
            className={`px-4 py-2 rounded-full ${
              isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100"
            } flex items-center space-x-2`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? "bg-indigo-400" : "bg-indigo-500"
              }`}
            ></span>
            <span className={isDarkMode ? "text-indigo-300" : "text-white"}>
              Current Price: $ {currentPrice}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-5xl mx-4 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button with gradient */}
            <button
              className="absolute -top-12 right-0 p-2 rounded-full text-light-gradient text-white hover:from-teal-500 hover:to-indigo-600 transition-all duration-300 transform hover:scale-110 z-10"
              onClick={closeModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Border glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 via-indigo-500 to-teal-400 rounded-xl blur opacity-75 animate-gradient-x"></div>

            {/* Video iframe with 16:9 aspect ratio */}
            <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                src={
                  videoSrc || "https://www.youtube.com/embed/tVPhUs6oqh0"
                }
                title="Savitri Network Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoThumbnail;
