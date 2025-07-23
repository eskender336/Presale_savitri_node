import React from "react";

const BlurOverlay = ({ isLoading, isDarkMode }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blurred background */}
      <div
        className={`absolute inset-0 ${
          isDarkMode
            ? "bg-gray-900/70 backdrop-blur-md"
            : "bg-white/70 backdrop-blur-md"
        }`}
      ></div>

      {/* Loading spinner */}
      <div className="relative z-10">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="h-12 w-12 relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-purple-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlurOverlay;
