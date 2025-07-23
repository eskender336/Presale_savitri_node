import React from "react";

import { FaDatabase, FaTimes, FaBars } from "react-icons/fa";
const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;

const MobileHeader = ({ isDarkMode, setIsSidebarOpen, isSidebarOpen }) => {
  return (
    <div
      className={`lg:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center ${
        isDarkMode ? "bg-[#12101A]" : "bg-white"
      } p-4 shadow-md`}
    >
      <a href="/">
        <div className="flex items-center gap-2">
          <img
            style={{
              width: "3rem",
            }}
            src="/CryptoKing.png"
            alt=""
            srcset=""
          />
          <span
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {TOKEN_NAME}
          </span>
        </div>{" "}
      </a>
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={isDarkMode ? "text-white" : "text-gray-900"}
      >
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>
    </div>
  );
};

export default MobileHeader;
