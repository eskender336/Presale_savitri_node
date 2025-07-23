import React, { useState, useRef, useEffect } from "react";

const BrandSlider = ({ isDarkMode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef(null);
  const autoScrollRef = useRef(null);
  const dragSpeedRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  const brands = [
    {
      name: "Aave",
      logo: "/brands/aave.png",
      width: 140,
    },
    {
      name: "Alphabot",
      logo: "/brands/alphabot.png",
      width: 120,
    },
    {
      name: "Apecoin",
      logo: "/brands/apecoin.png",
      width: 130,
    },
    {
      name: "Zora",
      logo: "/brands/Zora.png",
      width: 150,
    },
    {
      name: "Arweave",
      logo: "/brands/arweave.png",
      width: 140,
    },
    {
      name: "OpenSea",
      logo: "/brands/OpenSea.png",
      width: 150,
    },
    {
      name: "Authy",
      logo: "/brands/authy.png",
      width: 130,
    },
  ];

  // Double the brands array to ensure smooth infinite scrolling
  const duplicatedBrands = [...brands, ...brands, ...brands];

  // Start auto-scrolling
  useEffect(() => {
    const startAutoScroll = () => {
      if (sliderRef.current) {
        // Stop auto-scrolling when user is dragging
        if (isDragging) {
          if (autoScrollRef.current) {
            cancelAnimationFrame(autoScrollRef.current);
            autoScrollRef.current = null;
          }
          return;
        }

        // Reset to start when reaching the end
        if (sliderRef.current.scrollLeft >= sliderRef.current.scrollWidth / 3) {
          sliderRef.current.scrollLeft = 0;
        } else {
          sliderRef.current.scrollLeft += 1; // Adjust speed as needed
        }

        autoScrollRef.current = requestAnimationFrame(startAutoScroll);
      }
    };

    autoScrollRef.current = requestAnimationFrame(startAutoScroll);

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [isDragging]);

  // Mouse down event handler
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    lastDragTimeRef.current = Date.now();
    document.body.style.cursor = "grabbing";
  };

  // Touch start event handler
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    lastDragTimeRef.current = Date.now();
  };

  // Mouse move event handler
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const distance = (x - startX) * 2; // Multiply by 2 for faster scrolling
    sliderRef.current.scrollLeft = scrollLeft - distance;

    // Calculate drag speed
    const now = Date.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) {
      dragSpeedRef.current = distance / dt;
      lastDragTimeRef.current = now;
    }
  };

  // Touch move event handler
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX - sliderRef.current.offsetLeft;
    const distance = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - distance;

    // Calculate drag speed
    const now = Date.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) {
      dragSpeedRef.current = distance / dt;
      lastDragTimeRef.current = now;
    }
  };

  // Mouse up event handler
  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = "default";

    // Apply momentum scrolling
    if (Math.abs(dragSpeedRef.current) > 0.5) {
      applyMomentum();
    }
  };

  // Touch end event handler
  const handleTouchEnd = () => {
    setIsDragging(false);

    // Apply momentum scrolling
    if (Math.abs(dragSpeedRef.current) > 0.5) {
      applyMomentum();
    }
  };

  // Apply momentum scrolling effect
  const applyMomentum = () => {
    let speed = dragSpeedRef.current * 15; // Adjust multiplier for momentum strength
    let prevTime = Date.now();

    const animateMomentum = () => {
      const now = Date.now();
      const dt = now - prevTime;
      prevTime = now;

      if (Math.abs(speed) < 0.5 || isDragging) return;

      sliderRef.current.scrollLeft -= speed * dt;
      speed *= 0.95; // Friction factor, adjust as needed

      requestAnimationFrame(animateMomentum);
    };

    requestAnimationFrame(animateMomentum);
  };

  // Mouse leave event handler
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = "default";
    }
  };

  return (
    <div
      className={`relative w-full py-12 overflow-hidden ${
        isDarkMode ? "bg-[#0E0B12]" : "bg-[#f3f3f7]"
      }`}
    >
      {/* Left and right gradients for fade effect */}
      <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-inherit to-transparent z-10"></div>
      <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-inherit to-transparent z-10"></div>

      {/* Section title */}
      <div className="container mx-auto px-6 mb-8">
        <h3
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Our Partners
        </h3>
      </div>

      <div
        ref={sliderRef}
        className={`flex overflow-x-scroll scrollbar-hide ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex whitespace-nowrap pl-16 pr-16">
          {duplicatedBrands.map((brand, index) => (
            <div
              key={`brand-${index}`}
              className={`flex items-center justify-center mx-8 rounded-xl p-4 transition-all duration-300 ${
                isDarkMode
                  ? "hover:bg-gray-800/30"
                  : "hover:bg-white/60 hover:shadow-lg"
              }`}
              style={{ minWidth: `${brand.width}px` }}
            >
              <div className="w-16 h-16 flex items-center justify-center mr-4 rounded-full bg-gradient-to-br from-gray-100/10 to-gray-100/5 backdrop-blur-sm">
                <img
                  className="w-10 h-10 object-contain"
                  src={brand.logo}
                  alt={brand.name}
                />
              </div>
              <div
                className={`h-10 flex items-center justify-center font-medium ${
                  isDarkMode
                    ? "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500"
                    : "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500"
                }`}
              >
                {brand.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator that shows the content is scrollable */}
      <div className="flex justify-center mt-6 space-x-1">
        <div
          className={`h-1 w-8 rounded-full ${
            isDarkMode ? "bg-indigo-500" : "bg-teal-400"
          }`}
        ></div>
        <div
          className={`h-1 w-3 rounded-full ${
            isDarkMode ? "bg-gray-700" : "bg-gray-300"
          }`}
        ></div>
        <div
          className={`h-1 w-3 rounded-full ${
            isDarkMode ? "bg-gray-700" : "bg-gray-300"
          }`}
        ></div>
      </div>

      {/* Custom styling for hiding scrollbar */}
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for Firefox */
        .scrollbar-hide {
          scrollbar-width: none;
        }

        /* Hide scrollbar for IE and Edge */
        .scrollbar-hide {
          -ms-overflow-style: none;
        }

        /* Inherit background color for gradient elements */
        .from-inherit {
          --tw-gradient-from: inherit;
          --tw-gradient-to: rgb(255 255 255 / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
      `}</style>
    </div>
  );
};

export default BrandSlider;
