import React from "react";
import Link from "next/link";
import { useForm, ValidationError } from "@formspree/react";
import {
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaMedium,
  FaGithub,
  FaPaperPlane,
  FaCheck,
} from "react-icons/fa";

const FORMSPREE_API_KEY = process.env.NEXT_PUBLIC_FORMSPREE_API_KEY;

const Footer = ({ isDarkMode }) => {
  // Formspree integration - replace FORM_ID with your actual Formspree form ID
  const [state, handleSubmit] = useForm(FORMSPREE_API_KEY);

  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#080610]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#e8e8f0]";

  const headingColor =
    "bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500";
  const linkHoverColor =
    "hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-teal-400 hover:to-indigo-500";
  const borderColor = isDarkMode ? "border-gray-800/40" : "border-gray-300/40";
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const textColorSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textColorTertiary = isDarkMode ? "text-gray-500" : "text-gray-500";

  return (
    <footer
      className={`py-20 ${bgGradient} ${textColor} transition-colors duration-300 relative overflow-hidden`}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Logo and social section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-white"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 10L7 4M7 4L13 4M7 4L7 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11 14L17 20M17 20L17 14M17 20L11 20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${headingColor}`}>
                  Crypto King
                </h3>
              </div>
            </div>

            <p
              className={`text-sm ${textColorSecondary} max-w-md mb-6 leading-relaxed`}
            >
              Revolutionizing intelligence through decentralized innovation. Our
              AI-driven blockchain ecosystem enables transparent, secure, and
              intelligent decentralized applications.
            </p>

            <div className="flex flex-wrap space-x-5 mt-6">
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 transition-all duration-300 group"
                aria-label="Twitter"
              >
                <FaTwitter
                  size={18}
                  className={`${textColorSecondary} group-hover:text-white transition-colors`}
                />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 transition-all duration-300 group"
                aria-label="Telegram"
              >
                <FaTelegram
                  size={18}
                  className={`${textColorSecondary} group-hover:text-white transition-colors`}
                />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 transition-all duration-300 group"
                aria-label="Discord"
              >
                <FaDiscord
                  size={18}
                  className={`${textColorSecondary} group-hover:text-white transition-colors`}
                />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 transition-all duration-300 group"
                aria-label="Medium"
              >
                <FaMedium
                  size={18}
                  className={`${textColorSecondary} group-hover:text-white transition-colors`}
                />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 transition-all duration-300 group"
                aria-label="Github"
              >
                <FaGithub
                  size={18}
                  className={`${textColorSecondary} group-hover:text-white transition-colors`}
                />
              </a>
            </div>

            {/* Newsletter signup (optional) */}
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-teal-400/5 to-indigo-500/5 backdrop-blur-sm">
              <h4 className="text-sm font-semibold mb-2">
                Stay updated with our newsletter
              </h4>
              <form onSubmit={handleSubmit}>
                {/* Success Message */}
                {state.succeeded && (
                  <div
                    className={`mb-4 p-3 rounded-lg  flex items-start gap-2`}
                  >
                    <FaCheck className="mt-1 flex-shrink-0" />
                    <span>
                      Your message has been sent successfully! We'll get back to
                      you soon.
                    </span>
                  </div>
                )}
                <div className="flex">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    className={`flex-grow px-4 py-2 text-sm rounded-l-lg focus:outline-none ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    } border`}
                  />
                  <ValidationError
                    prefix="Email"
                    field="email"
                    errors={state.errors}
                  />

                  <button
                    disabled={state.submitting}
                    className="px-4 py-2 bg-gradient-to-r from-teal-400 to-indigo-500 text-white rounded-r-lg text-sm whitespace-nowrap hover:from-teal-500 hover:to-indigo-600 transition-all duration-300"
                  >
                    {state.submitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Subscribing...
                      </>
                    ) : (
                      <>Subscribe</>
                    )}
                  </button>
                </div>{" "}
              </form>
            </div>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-lg font-semibold mb-5">Resources</h3>
            <ul className="space-y-3">
              {["Whitepaper", "Roadmap", "Documentation", "FAQ"].map(
                (item, index) => (
                  <li key={`resource-${index}`}>
                    <Link
                      // href={`/${item.toLowerCase()}`}
                      href={`/dashboard`}
                      className={`text-sm ${textColorSecondary} ${linkHoverColor} transition-all duration-300 flex items-center group`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Community column */}
          <div>
            <h3 className="text-lg font-semibold mb-5">Community</h3>
            <ul className="space-y-3">
              {["Blog", "Events", "Partners", "Bounty Program"].map(
                (item, index) => (
                  <li key={`community-${index}`}>
                    <Link
                      // href={`/${item.toLowerCase().replace(" ", "-")}`}
                      href={`/dashboard`}
                      className={`text-sm ${textColorSecondary} ${linkHoverColor} transition-all duration-300 flex items-center group`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h3 className="text-lg font-semibold mb-5">Contact</h3>
            <ul className="space-y-3">
              {["Support", "Contact Us", "Press Kit", "Careers"].map(
                (item, index) => (
                  <li key={`contact-${index}`}>
                    <Link
                      // href={`/${item.toLowerCase().replace(" ", "-")}`}
                      href={`/dashboard`}
                      className={`text-sm ${textColorSecondary} ${linkHoverColor} transition-all duration-300 flex items-center group`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom section with copyright and legal links */}
        <div
          className={`mt-16 pt-8 border-t ${borderColor} flex flex-col md:flex-row justify-between items-center`}
        >
          <p className={`text-sm ${textColorTertiary} mb-4 md:mb-0`}>
            &copy; {new Date().getFullYear()} Lightchain Protocol. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            {["Terms of Service", "Privacy Policy", "Cookies Policy"].map(
              (item, index) => (
                <Link
                  key={`legal-${index}`}
                  // href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                  href={`/dashboard`}
                  className={`text-sm ${textColorTertiary} ${linkHoverColor} transition-all duration-300`}
                >
                  {item}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
