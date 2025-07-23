import React, { useState, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const VideoCardSlider = ({ isDarkMode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Sample video data that matches the image exactly
  const videoCards = [
    {
      id: 1,
      thumbnailUrl: "/thumbnail/pro-blockchain.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/pro-blockchain.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 2,
      thumbnailUrl: "/thumbnail/1.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/1.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 3,
      thumbnailUrl: "/thumbnail/2.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/2.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 4,
      thumbnailUrl: "/thumbnail/3.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/3.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 5,
      thumbnailUrl: "/thumbnail/4.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/4.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 6,
      thumbnailUrl: "/thumbnail/5.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/5.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 7,
      thumbnailUrl: "/thumbnail/6.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/6.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      id: 8,
      thumbnailUrl: "/thumbnail/7.jpg",
      videoUrl: "https://www.youtube.com/embed/6Dyiizlcsd8",
      title: "",
      hasPlayButton: true,
      customContent: (
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/thumbnail/7.jpg"
            alt="Futuristic Character"
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
  ];

  // Function for continuous right-to-left auto-scrolling with CSS animation
  useEffect(() => {
    // Set up the animation CSS
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes slideLeftAnimation {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      
      .auto-slide {
        animation: slideLeftAnimation 30s linear infinite;
      }
    `;
    document.head.appendChild(styleSheet);

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Stop animation during dragging and modal view
  useEffect(() => {
    if (!sliderRef.current) return;

    if (isDragging || showModal) {
      sliderRef.current.style.animationPlayState = "paused";
    } else {
      sliderRef.current.style.animationPlayState = "running";
    }
  }, [isDragging, showModal]);

  // Mouse down event handler
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  // Touch start event handler
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  // Mouse move event handler
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch move event handler
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // End drag event handler
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Open video modal
  const openVideoModal = (video, e) => {
    e.preventDefault();
    // Only open if not dragging
    if (!isDragging) {
      setCurrentVideo(video);
      setShowModal(true);
    }
  };

  // Close video modal
  const closeVideoModal = () => {
    setShowModal(false);
    setCurrentVideo(null);

    // Reset video playback when closing modal
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Color styling based on dark/light mode
  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  return (
    <div className={`w-full py-16 ${bgGradient} relative overflow-hidden`}>
      {/* Section Header */}
      <div className="container mx-auto px-4 md:px-6 mb-12 text-center">
        <div className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-4">
          <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
            Our Video Gallery
          </p>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500 mb-4">
          Latest Updates & Insights
        </h2>
        <p
          className={`max-w-2xl mx-auto ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Explore our collection of educational videos about blockchain
          technology and AI integration
        </p>
      </div>

      {/* Left and right shadow overlays */}
      <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-inherit to-transparent z-10"></div>
      <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-inherit to-transparent z-10"></div>

      {/* Control indicators */}
      <div className="container mx-auto px-4 md:px-6 mb-6">
        <div className="flex items-center">
          <div
            className={`h-1 w-16 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500`}
          ></div>
          <div className="ml-2 text-sm text-gray-500">Drag to explore</div>
        </div>
      </div>

      {/* Full width container for slider */}
      <div ref={containerRef} className="w-full relative z-0 overflow-hidden">
        {/* Video Card Slider with auto-animation */}
        <div
          ref={sliderRef}
          className="flex auto-slide hide-scrollbar cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          style={{
            width: "200%",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* First set of cards */}
          {videoCards.map((video, index) => (
            <div
              key={`card-1-${index}`}
              className="flex-shrink-0 px-3"
              style={{
                width: "calc(12.5% - 16px)",
                minWidth: "280px",
                maxWidth: "350px",
              }}
            >
              <div
                className={`h-full transform transition-all duration-500 hover:scale-105 ${
                  isDragging ? "cursor-grabbing" : "cursor-pointer"
                }`}
              >
                {/* Card with gradient border */}
                <div className="p-1 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20">
                  <div className="relative rounded-lg overflow-hidden aspect-video h-full bg-black">
                    {/* Video Thumbnail/Content */}
                    <div
                      className="relative w-full h-full overflow-hidden"
                      onClick={(e) => openVideoModal(video, e)}
                    >
                      {video.customContent ? (
                        video.customContent
                      ) : (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title || "Video thumbnail"}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>

                      {/* Title and description if available */}
                      {video.title && (
                        <div className="absolute bottom-4 left-4 text-white text-xl font-bold">
                          {video.title}
                        </div>
                      )}
                    </div>

                    {/* Play button with pulse effect */}
                    {video.hasPlayButton && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="relative">
                          {/* Pulse animation ring */}
                          <div className="absolute -inset-4 rounded-full bg-white/10 animate-ping opacity-75"></div>

                          {/* Play button */}
                          <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 shadow-lg shadow-indigo-500/30 relative z-20 transition-transform duration-300 hover:scale-110">
                            <FaPlay className="text-white w-5 h-5 md:w-6 md:h-6 ml-1" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Duplicate cards to create seamless loop */}
          {videoCards.map((video, index) => (
            <div
              key={`card-2-${index}`}
              className="flex-shrink-0 px-3"
              style={{
                width: "calc(12.5% - 16px)",
                minWidth: "280px",
                maxWidth: "350px",
              }}
            >
              <div
                className={`h-full transform transition-all duration-500 hover:scale-105 ${
                  isDragging ? "cursor-grabbing" : "cursor-pointer"
                }`}
              >
                {/* Card with gradient border */}
                <div className="p-1 rounded-xl bg-gradient-to-r from-teal-400 to-indigo-500 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20">
                  <div className="relative rounded-lg overflow-hidden aspect-video h-full bg-black">
                    {/* Video Thumbnail/Content */}
                    <div
                      className="relative w-full h-full overflow-hidden"
                      onClick={(e) => openVideoModal(video, e)}
                    >
                      {video.customContent ? (
                        video.customContent
                      ) : (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title || "Video thumbnail"}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>

                      {/* Title and description if available */}
                      {video.title && (
                        <div className="absolute bottom-4 left-4 text-white text-xl font-bold">
                          {video.title}
                        </div>
                      )}
                    </div>

                    {/* Play button with pulse effect */}
                    {video.hasPlayButton && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="relative">
                          {/* Pulse animation ring */}
                          <div className="absolute -inset-4 rounded-full bg-white/10 animate-ping opacity-75"></div>

                          {/* Play button */}
                          <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 shadow-lg shadow-indigo-500/30 relative z-20 transition-transform duration-300 hover:scale-110">
                            <FaPlay className="text-white w-5 h-5 md:w-6 md:h-6 ml-1" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View More Button */}
      <div className="container mx-auto px-4 flex justify-center mt-12">
        <a
          href="#"
          className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            <path d="M14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
          </svg>
          View All Videos
        </a>
      </div>

      {/* Enhanced Video Modal */}
      {showModal && currentVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeVideoModal}
        >
          <div
            className="relative max-w-5xl w-full mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button with gradient background */}
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 text-white hover:from-teal-500 hover:to-indigo-600 transition-all duration-300 transform hover:scale-110"
              onClick={closeVideoModal}
              aria-label="Close modal"
            >
              <IoMdClose size={20} />
            </button>

            {/* Video Container with responsive aspect ratio */}
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
              <iframe
                src={currentVideo.videoUrl}
                className="absolute top-0 left-0 w-full h-full"
                title={currentVideo.title || "Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Optional video title in modal */}
            {currentVideo.title && (
              <div className="p-4 bg-gradient-to-r from-teal-400/10 to-indigo-500/10">
                <h3 className="text-xl font-bold text-white">
                  {currentVideo.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for hiding scrollbar and from-inherit */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .from-inherit {
          --tw-gradient-from: inherit;
          --tw-gradient-to: rgb(255 255 255 / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
      `}</style>
    </div>
  );
};

export default VideoCardSlider;
