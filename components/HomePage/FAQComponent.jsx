import React, { useState } from "react";

const FAQComponent = ({ isDarkMode }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqItems = [
    {
      question: "What is Lightchain AI and its core mission?",
      answer:
        "Lightchain AI is a cutting-edge blockchain ecosystem powered by artificial intelligence. Our mission is to revolutionize decentralized applications and governance through innovations like PoI Consensus, the Artificial Intelligence Virtual Machine (AIVM), and a Transparent AI Framework. We aim to create a smarter, more secure, and equitable blockchain ecosystem for all.",
    },
    {
      question: "What makes Lightchain AI's PoI Consensus unique?",
      answer:
        "PoI Consensus stands for Proof of Intelligence, which is Lightchain's innovative consensus mechanism. Unlike traditional mechanisms like Proof of Work or Proof of Stake, PoI leverages AI algorithms to validate transactions, significantly reducing energy consumption while increasing throughput. It rewards nodes that contribute computational resources to AI tasks, creating a symbiotic relationship between the blockchain's security and AI advancement.",
    },
    {
      question:
        "How does the Artificial Intelligence Virtual Machine (AIVM) work?",
      answer:
        "The AIVM is a specialized computational layer that integrates AI capabilities directly into the blockchain architecture. It provides a runtime environment for executing AI models, facilitating on-chain AI operations without requiring external oracles. Developers can deploy, train, and execute AI models directly on the blockchain, maintaining decentralization while enabling complex AI-driven applications.",
    },
    {
      question: "What are the details of the Lightchain AI presale?",
      answer:
        "The Lightchain AI presale offers early supporters the opportunity to acquire LCAI tokens at a discounted rate before public listing. The presale is structured in multiple stages with increasing prices at each stage. Participants can contribute using ETH, USDT, or USDC. Tokens purchased during presale will be vested according to our tokenomics plan, with initial releases at TGE (Token Generation Event) followed by a gradual unlocking schedule.",
    },
    {
      question: "How does Lightchain AI ensure transparency in its ecosystem?",
      answer:
        "Transparency is core to our philosophy. We implement a Transparent AI Framework where all AI models and decision-making processes are auditable on-chain. Our development is open-source, allowing community verification of our code. We maintain regular communications through detailed technical documentation, progress reports, and community AMAs. Additionally, all protocol changes require community governance approval, ensuring collective decision-making.",
    },
    {
      question:
        "What role does decentralized governance play in Lightchain AI?",
      answer:
        "Decentralized governance is fundamental to Lightchain AI. Token holders can propose and vote on protocol changes, funding allocations, and strategic decisions. Our governance model implements a quadratic voting system that balances influence between large and small token holders. We also utilize prediction markets and AI-powered governance tools to improve decision quality and prevent governance attacks, ensuring the protocol evolves according to community consensus.",
    },
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0F0B13] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const cardBg = isDarkMode ? "bg-[#14101A]/80" : "bg-white/70";

  const questionBg = isDarkMode ? "bg-[#181320]" : "bg-white";

  const answerBg = isDarkMode ? "bg-[#14101A]" : "bg-gray-50";

  const borderColor = isDarkMode ? "border-gray-800/20" : "border-gray-200/50";

  const textGradient =
    "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500";

  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-600";

  // Icons for open and close states
  const ChevronDown = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 transition-transform duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );

  return (
    <div className={`w-full py-20 ${bgGradient}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header with animation */}
        <div className="text-center mb-16">
          <div className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-4">
            <p className={`text-sm font-medium ${textGradient}`}>FAQ</p>
          </div>
          <h2 className={`text-4xl md:text-5xl font-bold ${textGradient} mb-6`}>
            Frequently Asked Questions
          </h2>
          <p
            className={`max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Everything you need to know about Lightchain AI and our ecosystem
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"></div>
          </div>
        </div>

        {/* FAQ Accordion - styled version */}
        <div className="space-y-5">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`rounded-xl overflow-hidden transition-all duration-500 ${cardBg} backdrop-blur-sm border ${borderColor} shadow-lg ${
                  isOpen ? "shadow-indigo-500/10" : ""
                }`}
              >
                <button
                  className={`w-full px-6 py-5 text-left flex justify-between items-center ${questionBg} transition-all duration-300 ${
                    isOpen ? "border-b border-gray-800/10" : ""
                  }`}
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-lg font-semibold ${
                      isOpen
                        ? textGradient
                        : isDarkMode
                        ? "text-white"
                        : "text-gray-800"
                    } pr-4`}
                  >
                    {item.question}
                  </span>

                  <div
                    className={`flex-shrink-0 rounded-full p-2 ${
                      isOpen
                        ? "bg-gradient-to-r from-teal-400 to-indigo-500 text-white"
                        : isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-500"
                    } transition-all duration-300 transform ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <ChevronDown />
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`p-6 ${answerBg} ${textSecondary} leading-relaxed`}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Help Section */}
        <div className="mt-16 p-8 rounded-xl bg-gradient-to-r from-teal-400/10 to-indigo-500/10 backdrop-blur-sm border border-teal-400/20 text-center">
          <h3 className={`text-xl font-bold ${textGradient} mb-4`}>
            Still have questions?
          </h3>
          <p
            className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            If you couldn't find the answer to your question, feel free to reach
            out to our support team.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQComponent;
