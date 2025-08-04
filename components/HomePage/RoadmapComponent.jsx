import React from "react";

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

  const headingColor = isDarkMode ? "text-white" : "text-gray-800";
  const listItemColor = isDarkMode ? "text-gray-300" : "text-gray-600";
  const borderColor = isDarkMode ? "border-gray-800/20" : "border-gray-300/30";
  const progressLineColor = isDarkMode
    ? "text-light-gradient"
    : "text-light-gradient";
  const progressCompleted = isDarkMode
    ? "bg-gradient-to-r from-teal-400 to-teal-300"
    : "bg-gradient-to-r from-teal-400 to-teal-300";
  const progressPending = isDarkMode ? "bg-gray-700" : "bg-gray-300";
  const checkmarkColor = isDarkMode ? "text-teal-300" : "text-teal-500";

  // Define phases with completion status
  const phases = [
    {
      title: "Phase 1: Core Infrastructure & Testnet",
      completed: true,
      quarter: "Q4 2024 – Q1 2025",
      items: [
        "Design and implementation of PoU (Proof of Unity) consensus",
        "Deployment of AIVM (AI Virtual Machine) on testnet",
        "Launch of public testnet and validator onboarding",
      ],
    },
    {
      title: "Phase 2: Mainnet Launch & Node Growth",
      completed: false,
      quarter: "Q2 – Q4 2025",
      items: [
        "Mainnet release of Savitri Network",
        "Scaling to 1,500 active validator and contributor nodes",
        "Integration of on-chain governance and community tools",
      ],
    },
    {
      title: "Phase 3: Token Utility & Exchange Access",
      completed: false,
      quarter: "Q1 – Q2 2026",
      items: [
        "Launch of native Savitri SWAP DEX",
        "SAVI token swapping with major asset pairs",
        "Official listing of SAVI on external exchanges (end of Q2 2026)",
      ],
    },
  ];
  
  
  
  // Icon for completed items
  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

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

        {/* Roadmap Card */}
        <div
          className={`mx-auto max-w-5xl p-8 md:p-12 rounded-2xl ${cardBg} backdrop-blur-sm border ${borderColor} shadow-xl shadow-indigo-500/5`}
        >
          {/* Phase Titles with Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            {phases.map((phase, index) => (
              <div key={index} className="text-center">
                <div
                  className={`inline-flex items-center justify-center h-8 px-3 rounded-full ${
                    phase.completed ? "bg-teal-400/20" : "bg-gray-500/20"
                  } mb-2`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      phase.completed
                        ? "text-teal-400"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    {phase.completed ? "COMPLETED" : "IN PROGRESS"}
                  </span>
                </div>
                <h3
                  className={`text-xl font-bold bg-clip-text text-transparent text-light-gradient transition-colors duration-300 hover:${textColor}`}
                >
                  {phase.title}
                </h3>
              </div>
            ))}
          </div>

          {/* Progress Timeline */}
          <div className="relative w-full flex items-center justify-between my-12 px-6">
            {/* Background Line */}
            <div
              className={`absolute top-1/2 left-0 right-0 h-1 ${progressPending} rounded-full`}
            ></div>

            {/* Completed Progress Line */}
            <div
              className={`absolute top-1/2 left-0 w-2/3 h-1 ${progressLineColor} rounded-full`}
            ></div>

            {/* Timeline Nodes */}
            <div className="relative z-10 flex justify-between w-full">
              {phases.map((phase, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 ${
                      phase.completed
                        ? progressCompleted + " border-2 border-white"
                        : isDarkMode
                        ? "bg-gray-700 border-2 border-gray-600"
                        : "bg-gray-300 border-2 border-white"
                    }`}
                  >
                    {phase.completed ? (
                      <span className={checkmarkColor}>
                        <CheckIcon />
                      </span>
                    ) : (
                      <span className={`w-2 h-2 bg-white rounded-full`}></span>
                    )}
                  </div>
                  <div className="text-xs font-medium mt-2 text-center text-gray-500">
                    {phase.quarter}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Details with Improved Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {phases.map((phase, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl transition-all duration-300 ${
                  phase.completed
                    ? isDarkMode
                      ? "bg-teal-400/5"
                      : "bg-teal-50"
                    : isDarkMode
                    ? "bg-gray-800/20"
                    : "bg-gray-100/50"
                }`}
              >
                <ul className="space-y-4">
                  {phase.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span
                        className={`inline-flex mr-2 mt-0.5 ${
                          phase.completed ? checkmarkColor : listItemColor
                        }`}
                      >
                        {phase.completed ? (
                          <CheckIcon />
                        ) : (
                          <span className="text-xl">■</span>
                        )}
                      </span>
                      <span className={`${listItemColor} font-medium`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Button */}
        <div className="flex justify-center mt-12">
          <a
            href="#"
            className={`inline-flex items-center px-6 py-3 rounded-full text-light-gradient text-white font-medium shadow-lg shadow-indigo-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 stroke-white"
            >
              <path
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 5m0 12V5m0 0L9 7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View Full Roadmap
          </a>
        </div>
      </div>
    </div>
  );
};

export default RoadmapComponent;
