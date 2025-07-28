import React from "react";

const BlockchainFeatures = ({ isDarkMode }) => {
  // Theme variables
  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#090710]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const textGradient =
    "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div className={`py-20 relative overflow-hidden ${bgGradient}`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Top decorative border with glow */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <div className="relative w-full h-full">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
        </div>
      </div>

      {/* Gradient curve at top */}
      <div className="absolute top-0 left-0 right-0 h-16">
        <svg
          viewBox="0 0 1440 100"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <path
            fill="none"
            stroke={
              isDarkMode ? "rgba(45, 212, 191, 0.4)" : "rgba(56, 189, 248, 0.4)"
            }
            strokeWidth="2"
            d="M0,50 C360,110 720,0 1440,50"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-4">
            <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
              Core Technology
            </p>
          </div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textGradient}`}>
            Redefining Blockchain for the Intelligent, Connected World
          </h2>

          <p className={`max-w-3xl mx-auto ${textSecondary} leading-relaxed`}>
          Explore the foundational innovations powering the Savitri Network—from collaborative consensus to native AI and IoT integration.
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"></div>
          </div>
        </div>

        {/* PoI Section - Enhanced with card */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-12 md:py-16 gap-12">
          <div className="w-full lg:w-1/2 order-2 lg:order-1">
            <div
              className={`p-8 rounded-2xl ${
                isDarkMode ? "bg-[#14101A]/60" : "bg-white/60"
              } backdrop-blur-sm border ${
                isDarkMode ? "border-gray-800/30" : "border-gray-200/60"
              } shadow-xl`}
            >
              <div className="inline-flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-3xl md:text-4xl font-bold ${textGradient}`}
                >
                  Proof of Unity (PoU)
                </h2>
              </div>
              <h3 className={`text-2xl md:text-3xl font-bold ${textGradient}`}>
              Decentralization without trade-offs
              </h3>
              <p className={`leading-relaxed ${textSecondary} mb-6`}>
                Lightchain AI introduces Proof of Intelligence (PoI), a
                revolutionary consensus mechanism designed to reward nodes for
                performing valuable AI computations, such as model training,
                inference, and optimization tasks. Unlike traditional consensus
                mechanisms such as Proof of Work (PoW) or Proof of Stake (PoS),
                PoI incentivizes meaningful contributions to AI development
                while maintaining network security.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-teal-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-teal-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Consensus through cooperation: Nodes work in randomly selected groups to validate transactions, not compete.

                  </span>
                </div>

                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Sub-second confirmations: ZKPs enable trust without re-execution, achieving ultra-fast finality.
                  </span>
                </div>

                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-teal-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-teal-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Run anywhere: PoU turns laptops, phones, and even IoT sensors into active nodes—no staking or mining needed.
                  </span>
                </div>

                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    95% lower energy: Validation uses a fraction of the power required by traditional systems.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 order-1 lg:order-2 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 hologram-container">
              {/* Holographic base/platform */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-4 hologram-base rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-teal-500/60 rounded-full blur-sm"></div>

              {/* Floating cube hologram */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-40 h-40 hologram-glow">
                {/* Layer 1 (bottom) */}
                <div
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-36 h-10 glass-effect border ${
                    isDarkMode ? "border-teal-500" : "border-teal-400"
                  } shadow-lg shadow-teal-500/50 rounded-sm`}
                ></div>

                {/* Layer 2 (middle) */}
                <div
                  className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 w-40 h-14 glass-effect border ${
                    isDarkMode ? "border-indigo-600" : "border-indigo-500"
                  } shadow-lg shadow-indigo-500/50 rounded-sm`}
                ></div>

                {/* Layer 3 (top) */}
                <div
                  className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 w-36 h-10 glass-effect border ${
                    isDarkMode ? "border-teal-500" : "border-teal-400"
                  } shadow-lg shadow-teal-500/50 rounded-sm`}
                ></div>

                {/* Core energy sphere */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full glass-effect flex items-center justify-center border border-white/20">
                  <div className="w-12 h-12 rounded-full energy-core flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/90 animate-pulse"></div>
                  </div>
                </div>

                {/* Scan line effect */}
                <div className="scan-line"></div>

                {/* Decorative glowing dots around */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 glowing-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.8 + 0.2,
                      animation: `pulse-glow ${
                        2 + Math.random() * 3
                      }s ease-in-out infinite`,
                    }}
                  ></div>
                ))}
              </div>

              {/* Small floating particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-teal-500/80 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    bottom: `${10 + Math.random() * 60}%`,
                    boxShadow: "0 0 6px 2px rgba(20, 184, 166, 0.6)",
                    animation: `float ${
                      3 + Math.random() * 4
                    }s ease-in-out infinite ${Math.random() * 2}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider with gradient line */}
        <div className="py-8 flex justify-center">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        </div>

        {/* AIVM Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-12 md:py-16 gap-12">
          <div className="w-full lg:w-1/2 order-2">
            <div
              className={`p-8 rounded-2xl ${
                isDarkMode ? "bg-[#14101A]/60" : "bg-white/60"
              } backdrop-blur-sm border ${
                isDarkMode ? "border-gray-800/30" : "border-gray-200/60"
              } shadow-xl`}
            >
              <div className="inline-flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-3xl md:text-4xl font-bold ${textGradient}`}
                >
                  AITL: Decentralized AI Training, Built for Privacy and Collaboration
                </h2>
              </div>

              <p className={`leading-relaxed ${textSecondary} mb-6`}>
                The Artificial Intelligent Virtual Training (AITL) engine is the
                foundation of Savitri’s decentralized AI infrastructure. It empowers
                developers, enterprises, and communities to train, deploy, and
                monetize AI models securely — without compromising data privacy.
                Unlike centralized platforms that lock user data and extract
                value, AITL leverages federated learning and the Proof of Unity
                consensus to ensure that models evolve collaboratively across the
                network, while sensitive information stays local and protected.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-teal-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-teal-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Privacy-Preserving by Design: Data never leaves the local device; only model updates are shared.
                  </span>
                </div>
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Federated Learning Infrastructure: Train AI models across distributed nodes without centralizing datasets.
                  </span>
                </div>
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-purple-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Proof of Unity Consensus: Secure, energy-efficient aggregation and verification of model updates.
                  </span>
                </div>
                <div
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Built-in Monetization Tools: Tokenized marketplace to license and monetize AI models.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 order-1 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 hologram-container">
              {/* Holographic base */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-4 hologram-base rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-indigo-500/60 rounded-full blur-sm"></div>

              {/* Floating platform with circuit patterns */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-48 hologram-glow flex items-center justify-center">
                {/* Main processor chip */}
                <div
                  className={`absolute w-36 h-36 hexagon border-2 ${
                    isDarkMode ? "border-indigo-600/80" : "border-indigo-500/80"
                  } glass-effect flex items-center justify-center shadow-lg shadow-indigo-500/50 rotating-element`}
                  style={{ animationDuration: "40s" }}
                >
                  {/* Inner circuit patterns */}
                  <div
                    className={`absolute w-28 h-28 hexagon border ${
                      isDarkMode ? "border-teal-400/60" : "border-teal-500/60"
                    }`}
                  ></div>

                  {/* Inner energy core */}
                  <div
                    className="w-20 h-20 hexagon glass-effect flex items-center justify-center border border-white/30 rotating-element"
                    style={{
                      animationDuration: "20s",
                      animationDirection: "reverse",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full energy-core flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/80 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Circuit patterns */}
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {/* Horizontal lines */}
                    <div className="absolute top-1/4 left-0 w-full h-px circuit-line"></div>
                    <div className="absolute top-3/4 left-0 w-full h-px circuit-line"></div>
                    {/* Vertical lines */}
                    <div className="absolute top-0 left-1/4 w-px h-full circuit-line"></div>
                    <div className="absolute top-0 left-3/4 w-px h-full circuit-line"></div>
                  </div>
                </div>

                {/* Scan line effect */}
                <div className="scan-line"></div>

                {/* Connection lines radiating out */}
                <div className="absolute w-full h-full">
                  {/* Diagonal lines */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    {[...Array(8)].map((_, i) => {
                      const angle = i * 45 * (Math.PI / 180);
                      const length = 32;

                      return (
                        <div
                          key={`line-${i}`}
                          className={`absolute top-1/2 left-1/2 w-px h-8 ${
                            isDarkMode ? "bg-indigo-500/60" : "bg-indigo-400/60"
                          }`}
                          style={{
                            transform: `translate(-50%, -50%) rotate(${
                              i * 45
                            }deg) translateY(${length}px)`,
                            transformOrigin: "bottom center",
                            boxShadow: isDarkMode
                              ? "0 0 4px rgba(99, 102, 241, 0.6)"
                              : "0 0 4px rgba(129, 140, 248, 0.6)",
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Energy dots */}
                {[...Array(16)].map((_, i) => (
                  <div
                    key={`energy-${i}`}
                    className="absolute w-1 h-1 glowing-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.8 + 0.2,
                      animation: `pulse-glow ${
                        2 + Math.random() * 3
                      }s ease-in-out infinite`,
                    }}
                  ></div>
                ))}
              </div>

              {/* Small floating particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`particle-aivm-${i}`}
                  className="absolute w-1 h-1 bg-teal-400/80 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    bottom: `${10 + Math.random() * 60}%`,
                    boxShadow: "0 0 6px 2px rgba(45, 212, 191, 0.6)",
                    animation: `float ${
                      3 + Math.random() * 4
                    }s ease-in-out infinite ${Math.random() * 2}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div
            className={`max-w-3xl mx-auto p-8 rounded-2xl ${
              isDarkMode
                ? "bg-gradient-to-br from-teal-400/10 to-indigo-500/10"
                : "bg-gradient-to-br from-teal-100/50 to-indigo-100/50"
            } backdrop-blur-sm`}
          >
            <h3 className={`text-2xl font-bold mb-4 ${textGradient}`}>
            Ready to Build What Comes Next?
            </h3>
            <p className={`${textSecondary} mb-6`}>
            Explore how Savitri’s next-gen blockchain transforms AI, IoT, and data coordination—designed for the real world, built for what’s next.

            </p>
            <a
              href="#"
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              Discover Savitri
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* CSS for holographic effects */}
      <style jsx>{`
        /* Hologram base styles */
        .hologram-base {
          background: ${isDarkMode
            ? "radial-gradient(ellipse at center, rgba(45, 212, 191, 0.7) 0%, rgba(45, 212, 191, 0.4) 30%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(45, 212, 191, 0.5) 0%, rgba(45, 212, 191, 0.3) 30%, transparent 70%)"};
          filter: blur(3px);
        }

        /* Energy core styles */
        .energy-core {
          background: ${isDarkMode
            ? "radial-gradient(circle at center, rgba(99, 102, 241, 0.8), rgba(45, 212, 191, 0.6))"
            : "radial-gradient(circle at center, rgba(99, 102, 241, 0.6), rgba(45, 212, 191, 0.4))"};
          box-shadow: 0 0 15px 5px rgba(99, 102, 241, 0.5);
          animation: pulse-core 3s ease-in-out infinite;
        }

        /* Hologram glow effect */
        .hologram-glow {
          position: relative;
          animation: float-gentle 6s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        /* Glass effect */
        .glass-effect {
          background: ${isDarkMode
            ? "rgba(15, 23, 42, 0.3)"
            : "rgba(255, 255, 255, 0.15)"};
          backdrop-filter: blur(4px);
          border-radius: 4px;
          box-shadow: ${isDarkMode
            ? "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)"
            : "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2)"};
        }

        /* Circuit line effect */
        .circuit-line {
          background: ${isDarkMode
            ? "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6), transparent)"
            : "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent)"};
          animation: pulse-circuit 4s linear infinite;
        }

        /* Scan line effect */
        .scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: ${isDarkMode
            ? "linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.8), transparent)"
            : "linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.6), transparent)"};
          animation: scan 4s linear infinite;
          opacity: 0.7;
          z-index: 5;
        }

        /* Glowing particle styles */
        .glowing-particle {
          border-radius: 50%;
          background: ${isDarkMode
            ? "rgba(45, 212, 191, 0.8)"
            : "rgba(56, 189, 248, 0.6)"};
          box-shadow: 0 0 4px 2px
            ${isDarkMode
              ? "rgba(45, 212, 191, 0.4)"
              : "rgba(56, 189, 248, 0.3)"};
        }

        /* Hexagon shape */
        .hexagon {
          clip-path: polygon(
            50% 0%,
            100% 25%,
            100% 75%,
            50% 100%,
            0% 75%,
            0% 25%
          );
        }

        /* Rotating element */
        .rotating-element {
          animation: rotate 30s linear infinite;
        }

        /* Animation for the scan line */
        @keyframes scan {
          0% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }

        /* Animation for circuit pulse */
        @keyframes pulse-circuit {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Animation for energy core pulse */
        @keyframes pulse-core {
          0%,
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 15px 5px rgba(99, 102, 241, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 8px rgba(99, 102, 241, 0.6);
          }
        }

        /* Animation for glowing particles */
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
        }

        /* Animation for floating effect */
        @keyframes float-gentle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Animation for small particles */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-10px) translateX(5px);
          }
          66% {
            transform: translateY(5px) translateX(-8px);
          }
        }

        /* Animation for rotating elements */
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default BlockchainFeatures;
