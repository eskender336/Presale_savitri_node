import React from "react";

// SVG Icons as components
const PulseIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <path
      d="M4 18H10L12 10L18 26L22 14L24 18H32"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AIVMIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <path
      d="M16 6H26C28.2091 6 30 7.79086 30 10V20"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="6"
      y="12"
      width="20"
      height="18"
      rx="2"
      stroke="#9761F4"
      strokeWidth="2"
    />
    <path
      d="M13 22C14.6569 22 16 20.6569 16 19C16 17.3431 14.6569 16 13 16C11.3431 16 10 17.3431 10 19C10 20.6569 11.3431 22 13 22Z"
      stroke="#9761F4"
      strokeWidth="2"
    />
    <path
      d="M16 16L22 22"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 22L22 16"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const FrameworkIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <path
      d="M8 6L18 10L28 6"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 10V30"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 6V22L18 30"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M28 6V22L18 30"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GovernanceIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <path d="M18 4V8" stroke="#9761F4" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M18 28V32"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8.34 8.34L11.17 11.17"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M24.83 24.83L27.66 27.66"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M4 18H8" stroke="#9761F4" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M28 18H32"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8.34 27.66L11.17 24.83"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M24.83 11.17L27.66 8.34"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MemecoinIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <rect
      x="8"
      y="4"
      width="20"
      height="28"
      rx="2"
      stroke="#9761F4"
      strokeWidth="2"
    />
    <circle cx="18" cy="24" r="4" stroke="#9761F4" strokeWidth="2" />
    <path
      d="M14 10H22"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M14 14H22"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const DecentralizedIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:animate-pulse"
  >
    <path
      d="M4 18L10 12L16 18L10 24L4 18Z"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 18L22 12L28 18L22 24L16 18Z"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M28 18L32 14"
      stroke="#9761F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BlockchainFeaturesGrid = ({ isDarkMode }) => {
  const features = [
    {
      icon: <PulseIcon />,
      title: "Proof of Unity (PoU) Consensus",
      description:
        "A collaborative validation mechanism that replaces mining and staking with group-based consensus. Achieves 230,000+ TPS, sub-860 ms finality, and cuts energy use by 95%+ compared to traditional protocols.",
    },
    {
      icon: <AIVMIcon />,
      title: "Interoperable by Design",
      description:
        "Seamlessly connects legacy systems, IoT devices, and modern applications through plug-and-play middleware. Supports standard protocols like MQTT, Modbus, and REST APIs out of the box.",
    },
    {
      icon: <FrameworkIcon />,
      title: "Privacy-First Data Layer",
      description:
        "Zero-Knowledge Proofs and local-first architecture ensure data sovereignty, GDPR compliance, and enterprise-grade security—even at the edge.",
    },
    {
      icon: <GovernanceIcon />,
      title: "AITL: Distributed AI Infrastructure",
      description:
        "Privacy-preserving federated learning built into the protocol—not bolted on. Devices can train models without exposing raw data, with smart contracts handling governance, royalties, and version control.",
    },
    {
      icon: <MemecoinIcon />,
      title: "Monolith & Guardian Architecture",
      description:
        "Instant onboarding through lightweight Monolith Blocks (~1MB daily snapshots). Full historical data is permanently preserved by Guardian Nodes for regulatory-grade auditability.",
    },
    {
      icon: <DecentralizedIcon />,
      title: "Predictable, Ultra-Low Costs",
      description:
        "Stable transaction fees at $0.0035 make large-scale deployments—like 1M IoT sensors or supply chain events—economically viable.",
    }
  ];

  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const cardBg = isDarkMode
    ? "bg-gradient-to-br from-[#14101A] to-[#191320] hover:from-[#191320] hover:to-[#14101A]"
    : "bg-white/60 hover:bg-white/80";

  const titleColor = isDarkMode ? "text-white" : "text-gray-800";

  const subtitleColor = isDarkMode ? "text-gray-400" : "text-gray-600";

  const headerTextColor = isDarkMode
    ? "bg-clip-text text-transparent text-light-gradient"
    : "bg-clip-text text-transparent text-light-gradient";

  const accentTextColor = isDarkMode
    ? "bg-clip-text text-transparent text-light-gradient"
    : "bg-clip-text text-transparent text-light-gradient";

  return (
    <div className={`w-full py-20 ${bgGradient}`}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Header with animation */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-bold ${headerTextColor} mb-6`}
          >
              Savitri Network
        </h2>
          <p
            className={`text-lg ${subtitleColor} max-w-2xl mx-auto leading-relaxed`}
          >
           Next-Gen Blockchain for Data, Devices, and Decentralized Intelligence
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 text-light-gradient rounded-full"></div>
          </div>
        </div>

        {/* Features Grid with improved layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group ${cardBg} backdrop-blur-sm border border-gray-800/10 rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1`}
            >
              {/* Icon with circular background */}
              <div className="mb-6 p-4 rounded-full bg-gradient-to-br from-teal-400/10 to-indigo-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </div>

              {/* Title with gradient animation on hover */}
              <h3
                className={`text-xl font-bold bg-clip-text text-transparent text-light-gradient mb-4 group-hover:${headerTextColor} transition-colors duration-300`}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p className={`${subtitleColor} leading-relaxed`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <a
            href="#"
            className={`inline-block py-3 px-8 rounded-full text-light-gradient text-white font-medium transition-transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20`}
          >
            Explore All Features
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockchainFeaturesGrid;
