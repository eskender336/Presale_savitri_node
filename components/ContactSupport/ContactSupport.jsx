import React from "react";
import { FaEnvelope, FaTelegramPlane, FaShieldAlt } from "react-icons/fa";

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@savitrinetwork.com";
const telegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || "https://t.me/Savitri_Community";

export default function ContactSupport({ isDarkMode }) {
  const theme = {
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-700",
    border: isDarkMode ? "border-gray-800/40" : "border-gray-200",
  };

  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent("Support Request")}`;

  return (
    <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-5 mt-6 shadow-lg`}>
      <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>Contact Support</h3>
      <ul className="space-y-2">
        <li>
          <a href={mailtoHref} className="inline-flex items-center gap-2 text-light-gradient hover:from-teal-500 hover:to-indigo-600">
            <FaEnvelope />
            <span>Email: {email}</span>
          </a>
        </li>
        <li>
          <a href={telegram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-light-gradient hover:from-teal-500 hover:to-indigo-600">
            <FaTelegramPlane />
          </a>
        </li>
      </ul>
      <p className={`${theme.textSecondary} mt-3 text-sm`}>We reply within 24 hours, Mon–Fri. Issues covered: purchases, wallet connection, KYC, or listing questions.</p>
      <p className={`${theme.textSecondary} mt-2 text-xs inline-flex items-center gap-2`}>
        <FaShieldAlt className="opacity-80" />
        Never share your seed phrase or private keys.
      </p>
    </div>
  );
}
