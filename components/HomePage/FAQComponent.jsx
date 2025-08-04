import React, { useState, useEffect, useMemo } from "react";

const FAQComponent = ({ isDarkMode }) => {
  const faqItems = useMemo(
    () => [
    {
      id: "savitri-network",
      question: "What is Savitri Network?",
      answer:
        "Savitri is a next-generation blockchain infrastructure that combines blockchain, IoT, and AI in a unified platform. Our mission is to create decentralized systems that are scalable, inclusive, and human-centered — enabling real-world use cases across finance, governance, supply chains, and more."
    },
    {
      id: "savi-coin-use",
      question: "What is the SAVI coin used for?",
      answer:
        "The SAVI coin powers the entire Savitri ecosystem. Key utilities include:\n- Paying for transactions (at fixed near-zero fees)\n- Accessing AI models, tools, and decentralized applications\n- Staking to earn rewards and receive VOTE tokens\n- Participating in network governance and proposal voting\n- Unlocking enterprise tools and smart contract automation",
    },
    {
      id: "why-bep20",
      question: "Why is Savi coin made in BEP20?",
      answer:
        "During the pre-sale and ICO phases, Savi Token will be released as a BEP20 token on the BNB Smart Chain. This temporary version is essential to manage the token sale efficiently and ensure broad compatibility with popular wallets and platforms. After the ICO ends, holders of the BEP20 Savi Token will be able to claim the native SAVI COIN on our own Layer 1 blockchain. This two-step approach ensures a smooth launch experience while preparing for full migration to the Savitri mainnet."
    },
    {
      id: "participate-pre-sale",
      question: "How can I participate in the pre-sale?",
      answer:
        "Joining the Savi Coin pre-sale is simple and secure. Just follow these steps:\n1. Connect your wallet (e.g., Trust Wallet, MetaMask, WalletConnect)\n2. Access the Token Sale page\n3. Select the cryptocurrency you want to use (BNB, USDT, etc.)\n4. Enter the amount of Savi Coins you want to buy\n5. Confirm the transaction via your wallet\nYour Savi Token (BEP20) will be sent directly to your wallet. These tokens will later be used to claim the native SAVI COIN after the ICO."
    },
    {
      id: "token-price-pre-sale",
      question: "What is the token price during pre-sale?",
      answer:
        "The initial price of Savi Coin during the pre-sale starts at $0.35 per token. With each new round, the price will gradually increase, rewarding early supporters with the best entry point. Secure your Savi Coins early to maximize your value before the price goes up!"
    },
    {
      id: "vesting-lockup",
      question: "Is there a vesting or lock-up period?",
      answer:
        "To ensure a fair and sustainable launch, Savi Coin follows a simple and transparent vesting model:\n- 20% of the purchased tokens will be distributed immediately at the end of the pre-sale.\n- The remaining 80% will be released in monthly installments of 20%, completing the full vesting over four months.\n🎁 Loyalty Rewards: Users who hold their tokens throughout the vesting period or actively participate in the project’s governance may become eligible for additional rewards, including early unlocks, bonus tokens, or exclusive NFTs."
    },
    {
      id: "presale-start",
      question: "When the Pre-sale will start?",
      answer:
        "The Pre-Sale begins in the 1st week of August and ends in the 4th week of October. The Public ICO is tentatively planned for November to January — but the exact timeline depends on the outcome of the Pre-Sale. If we successfully reach our fundraising milestones, we will proceed with the public launch and token distribution as scheduled. Otherwise, the roadmap may adjust to reflect resource realities and community feedback. We believe in transparency and responsible growth — and we’ll keep our community fully updated throughout each stage."
    },
    {
      id: "kyc-required",
      question: "Is KYC required to participate?",
      answer:
        "No KYC is required to participate in the pre-sale. You can purchase Savi Tokens freely by connecting your wallet. However, KYC will be mandatory at the time of claiming the native SAVI COIN after the ICO ends. This ensures compliance with regulations and helps protect the long-term integrity of the project."
    },
    {
      id: "smart-contract-audit",
      question: "Is the smart contract audited?",
      answer:
        "The audit will be provided during the pre-sale."
    },
    {
      id: "supported-wallets",
      question: "Which wallets can I use to buy SAVI?",
      answer:
        "Every wallet available in the market: MetaMask, Trust Wallet, WalletConnect, etc."
    },
    {
      id: "receive-tokens",
      question: "Where will I receive my tokens?",
      answer:
        "Your Savi Tokens (BEP20) will be automatically sent to the same wallet you used to complete the purchase. There’s no need for manual claiming during the pre-sale — tokens are delivered instantly after each transaction."
    },
    {
      id: "goals-2025-2026",
      question: "What are the main goals of Savitri in 2025–2026?",
      answer:
        "Release the main net and reach the first 1,500 nodes active in the network."
    },
    {
      id: "listing-exchanges",
      question: "When will SAVI be listed on exchanges?",
      answer:
        "The listing is planned for the end of Q2 2026, but initially a SWAP DEX will be provided where every user will be able to swap the SAVI COIN with different pairs."
    },
    {
      id: "difference-other-layer1s",
      question: "How is Savitri different from other Layer 1s or AI blockchains?",
      answer:
        "Savitri was built to fix what others haven’t:\n- 230,000 TPS (transactions per second)\n- Up to 95% lower energy consumption\n- Proof of Unity – our novel consensus designed for speed, fairness, and inclusion\n- Easy API & SDK access for developers\n- Real-world interoperability (IoT devices, AI models, enterprise systems)\nMost blockchains are technical, closed-off, or energy-intensive. We’re not just another Layer 1 — we’re the infrastructure for meaningful change."
    },
    {
      id: "run-node-stake",
      question: "Can I run a node or stake my tokens?",
      answer:
        "Yes! After the 5th round of the pre-sale, users will be able to stake their SAVI Tokens directly through the purchase platform and start earning rewards. Additionally, once the testnet and SDK (Software Development Kit) are released, anyone will be able to run a node — whether on a smartphone, personal computer, or server. Savi is designed to be open, accessible, and community-powered from the ground up.",
    },
  ],
  []
);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const index = faqItems.findIndex((item) => item.id === hash);
      if (index !== -1) {
        setOpenIndex(index);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [faqItems]);

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
    "bg-clip-text text-transparent text-light-gradient";

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
    <div className={`w-full py-20 ${bgGradient}`} id="faq">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header with animation */}
        <div className="text-center mb-16">
          <div className="inline-block p-1.5 px-3 rounded-full text-light-gradient mb-4">
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
            Everything you need to know about Savitri Network and our ecosystem
          </p>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 text-light-gradient rounded-full"></div>
          </div>
        </div>

        {/* FAQ Accordion - styled version */}
        <div className="space-y-5">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                id={item.id}
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
                        ? "text-light-gradient text-white"
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
        <div className="mt-16 p-8 rounded-xl text-light-gradient backdrop-blur-sm border border-teal-400/20 text-center">
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
              className="inline-flex items-center px-6 py-3 rounded-full font-medium shadow-lg shadow-indigo-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30 text-light-gradient"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
              >
                <defs>
                  <linearGradient id="savitri-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" /> {/* from-teal-400 */}
                    <stop offset="100%" stopColor="#6366f1" /> {/* to-indigo-500 */}
                  </linearGradient>
                </defs>
                <path
                  fill="url(#savitri-gradient)"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
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
