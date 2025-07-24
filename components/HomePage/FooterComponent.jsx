import React from "react";
const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const FooterComponent = ({ isDarkMode }) => {
  return (
    <footer
      className={`w-full ${
        isDarkMode ? "bg-[#0E0B12]" : "bg-[#f3f3f7]"
      } relative py-16`}
    >
      {/* Top border with gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <div className="w-full h-full">
          <svg
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,2 C250,0 350,4 500,4 C650,4 750,0 1000,2"
              stroke="url(#header-gradient)"
              strokeWidth="1"
              fill="none"
            />
            <defs>
              <linearGradient
                id="header-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={isDarkMode ? "#0F0F1B" : "#f9fafb"}
                />
                <stop offset="25%" stopColor="#9761F4" /> {/* Teal color */}
                <stop offset="50%" stopColor="#4F46E5" /> {/* Indigo color */}
                <stop offset="75%" stopColor="#9761F4" /> {/* Teal color */}
                <stop
                  offset="100%"
                  stopColor={isDarkMode ? "#0F0F1B" : "#f9fafb"}
                />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div
              className={`${
                isDarkMode
                  ? "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500"
                  : "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500"
              } text-2xl md:text-3xl font-bold`}
            >
              {TOKEN_NAME}
            </div>
            {/* Purple logo circle with inner effects */}
            <div className="relative w-10 h-10 ml-2">
              <div className="absolute inset-0 rounded-full "></div>
              <div
                className={`absolute inset-1 rounded-full ${
                  isDarkMode ? "bg-[#0E0B12]" : "bg-gray-50"
                }`}
              >
                <img src="/CryptoKing.png" alt="" />
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p
          className={`${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          } text-center text-sm md:text-base max-w-3xl mb-8`}
        >
          Empowering a new era by revolutionizing decentralized AI with
          blockchain synergy.
        </p>

        {/* Horizontal Line (optional) */}
        <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 rounded-full mb-8"></div>
      </div>
    </footer>
  );
};

export default FooterComponent;
