import React from "react";
import Image from "next/image";

const RoadmapComponent = ({ isDarkMode }) => {
  // Color styling based on dark/light mode
  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const cardBg = isDarkMode
    ? "bg-gradient-to-br from-[#14101A] to-[#191320]"
    : "bg-white/60";

  const textColor = isDarkMode
    ? "bg-clip-text text-transparent text-light-gradient"
    : "bg-clip-text text-transparent text-light-gradient";

  const subtitleColor = isDarkMode
    ? "bg-clip-text text-transparent text-light-gradient"
    : "bg-clip-text text-transparent text-light-gradient";

  return (
    <div className={`w-full py-24 ${bgGradient}`}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Header with animated underline */}
        <div className="text-center mb-16 relative">
          <div className="inline-block p-1.5 px-3 rounded-full text-light-gradient mb-4">
            <p className={`text-sm font-medium ${subtitleColor}`}>
              Savitri Network Protocol
            </p>
          </div>
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold ${textColor} mb-6`}
          >
            Savitri Network Roadmap
          </h2>
          <p
            className={`max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Our strategic path to building the future of blockchain and AI
            integration
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 text-light-gradient rounded-full"></div>
          </div>
        </div>

        {/* Roadmap Image */}
        <div
          className={`mx-auto max-w-5xl p-4 md:p-8 rounded-2xl ${cardBg} backdrop-blur-sm shadow-xl shadow-indigo-500/5`}
        >
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/RoadMap.png"
              alt="Savitri Network roadmap"
              width={1600}
              height={900}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapComponent;
