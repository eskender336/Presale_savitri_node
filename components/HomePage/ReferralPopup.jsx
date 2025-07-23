import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaGift, FaCheck, FaCopy } from "react-icons/fa";
import { useWeb3 } from "../../context/Web3Provider";

const ReferralPopup = ({ isOpen, onClose, isDarkMode }) => {
  const { account, generateReferralLink } = useWeb3();
  const [copied, setCopied] = useState(false);
  const popupRef = useRef(null);

  // Generate referral link
  const referralLink = generateReferralLink
    ? generateReferralLink(account)
    : "";

  // Theme configuration
  const theme = {
    bg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div
        ref={popupRef}
        className={`${theme.bg} w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all`}
      >
        {/* Header with close button */}
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white hover:bg-opacity-90 transition-colors"
          >
            <FaTimes />
          </button>

          <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>
            Your referral link
          </h2>
          <p className={`${theme.textSecondary}`}>
            Share your link to your friends to receive some bonus!
          </p>
        </div>

        {/* Referral link input */}
        <div className="px-6 pb-8">
          <div
            className={`relative flex rounded-xl overflow-hidden border-2 border-[#34CCC3] p-1`}
          >
            <input
              type="text"
              value={referralLink}
              readOnly
              className={`flex-grow ${theme.inputBg} py-3 px-4 ${theme.text} focus:outline-none`}
            />
            <button
              onClick={handleCopy}
              className="bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white px-6 py-3 rounded-lg ml-2 flex items-center justify-center min-w-20"
            >
              {copied ? (
                <>
                  <FaCheck className="mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <FaCopy className="mr-2" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Additional info or social share buttons could go here */}
          <div className="mt-6 flex items-center">
            <FaGift className="text-[#34CCC3] mr-2" />
            <p className={`text-sm ${theme.textSecondary}`}>
              Earn 5% of all purchases made through your referral link!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPopup;
