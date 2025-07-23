import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import {
  FaEnvelope,
  FaPhone,
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaGithub,
  FaPaperPlane,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";
import { Header } from "../index";

const FORMSPREE_API_KEY = process.env.NEXT_PUBLIC_FORMSPREE_API_KEY;

const ContactUs = ({ isDarkMode }) => {
  /// Theme configuration
  const theme = {
    mainBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    innerBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textSocial: isDarkMode ? "text-gray-300" : "text-gray-700",
    errorBg: isDarkMode ? "bg-red-900/20" : "bg-red-100",
    errorText: isDarkMode ? "text-red-400" : "text-red-600",
    successBg: isDarkMode ? "bg-green-900/20" : "bg-green-100",
    successText: isDarkMode ? "text-green-400" : "text-green-600",
    iconBg: isDarkMode ? "bg-purple-900/30" : "bg-purple-100",
    socialBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    hoverTwitter: isDarkMode ? "hover:bg-blue-900/20" : "hover:bg-blue-100",
    hoverTelegram: isDarkMode ? "hover:bg-blue-900/20" : "hover:bg-blue-100",
    hoverDiscord: isDarkMode ? "hover:bg-purple-900/20" : "hover:bg-purple-100",
    hoverGithub: isDarkMode ? "hover:bg-gray-700/20" : "hover:bg-gray-200",
    faqBtn: isDarkMode
      ? "bg-purple-600 hover:bg-purple-700"
      : "bg-purple-500 hover:bg-purple-600",
  };

  // Formspree integration - replace FORM_ID with your actual Formspree form ID
  const [state, handleSubmit] = useForm(FORMSPREE_API_KEY);

  return (
    <>
      <Header theme={theme} title="Contact" />
      <div className={`${theme.mainBg} min-h-screen `}>
        <div className=" mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className={`text-3xl sm:text-4xl font-bold ${theme.text} mb-4`}>
              Contact Us
            </h1>
            <p className={`${theme.textSecondary} max-w-3xl mx-auto`}>
              Have questions about our platform? Need technical support? Or just
              want to provide feedback? Get in touch with our team and we'll get
              back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div
                className={`${theme.cardBg} rounded-xl overflow-hidden p-6 shadow-lg`}
              >
                <h2 className={`text-xl font-bold ${theme.text} mb-6`}>
                  Send Us a Message
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className={`block ${theme.textSecondary} mb-2`}
                      >
                        Name <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Your name"
                        className={`w-full ${theme.innerBg} ${theme.text} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-600`}
                        required
                      />
                      <ValidationError
                        prefix="Name"
                        field="name"
                        errors={state.errors}
                        className={theme.errorText}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className={`block ${theme.textSecondary} mb-2`}
                      >
                        Email <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="your@email.com"
                        className={`w-full ${theme.innerBg} ${theme.text} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-600`}
                        required
                      />
                      <ValidationError
                        prefix="Email"
                        field="email"
                        errors={state.errors}
                        className={theme.errorText}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-4">
                    <label
                      htmlFor="subject"
                      className={`block ${theme.textSecondary} mb-2`}
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="What's this regarding?"
                      className={`w-full ${theme.innerBg} ${theme.text} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    />
                    <ValidationError
                      prefix="Subject"
                      field="subject"
                      errors={state.errors}
                      className={theme.errorText}
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className={`block ${theme.textSecondary} mb-2`}
                    >
                      Message <span className="text-purple-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      placeholder="Your message here..."
                      className={`w-full ${theme.innerBg} ${theme.text} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-600`}
                      required
                    ></textarea>
                    <ValidationError
                      prefix="Message"
                      field="message"
                      errors={state.errors}
                      className={theme.errorText}
                    />
                  </div>

                  {/* Error Message */}
                  <ValidationError
                    errors={state.errors}
                    className={`mb-4 p-3 rounded-lg ${theme.errorBg} ${theme.errorText} flex items-start gap-2`}
                  />

                  {/* Success Message */}
                  {state.succeeded && (
                    <div
                      className={`mb-4 p-3 rounded-lg ${theme.successBg} ${theme.successText} flex items-start gap-2`}
                    >
                      <FaCheck className="mt-1 flex-shrink-0" />
                      <span>
                        Your message has been sent successfully! We'll get back
                        to you soon.
                      </span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={state.submitting}
                    className="w-full bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {state.submitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information and Social Media */}
            <div className="lg:col-span-1">
              <div className={`${theme.cardBg} rounded-xl p-6 mb-6 shadow-lg`}>
                <h2 className={`text-xl font-bold ${theme.text} mb-6`}>
                  Contact Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`${theme.iconBg} p-3 rounded-lg`}>
                      <FaEnvelope className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className={theme.text + " font-medium"}>Email</h3>
                      <a
                        href="mailto:support@lightchain.com"
                        className={`${theme.textSecondary} hover:text-purple-400 transition-colors`}
                      >
                        support@lightchain.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`${theme.iconBg} p-3 rounded-lg`}>
                      <FaPhone className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className={theme.text + " font-medium"}>Phone</h3>
                      <a
                        href="tel:+18001234567"
                        className={`${theme.textSecondary} hover:text-purple-400 transition-colors`}
                      >
                        +1 (800) 123-4567
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg`}>
                <h2 className={`text-xl font-bold ${theme.text} mb-6`}>
                  Connect With Us
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="https://twitter.com/lightchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 ${theme.socialBg} rounded-lg ${theme.hoverTwitter} transition-colors`}
                  >
                    <FaTwitter className="text-blue-400" />
                    <span className={theme.textSocial}>Twitter</span>
                  </a>

                  <a
                    href="https://t.me/lightchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 ${theme.socialBg} rounded-lg ${theme.hoverTelegram} transition-colors`}
                  >
                    <FaTelegram className="text-blue-500" />
                    <span className={theme.textSocial}>Telegram</span>
                  </a>

                  <a
                    href="https://discord.gg/lightchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 ${theme.socialBg} rounded-lg ${theme.hoverDiscord} transition-colors`}
                  >
                    <FaDiscord className="text-purple-400" />
                    <span className={theme.textSocial}>Discord</span>
                  </a>

                  <a
                    href="https://github.com/lightchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 ${theme.socialBg} rounded-lg ${theme.hoverGithub} transition-colors`}
                  >
                    <FaGithub
                      className={isDarkMode ? "text-white" : "text-gray-800"}
                    />
                    <span className={theme.textSocial}>GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Teaser */}
          <div
            className={`mt-12 ${theme.cardBg} rounded-xl p-6 text-center shadow-lg`}
          >
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>
              Frequently Asked Questions
            </h2>
            <p className={`${theme.textSecondary} mb-6`}>
              Find answers to common questions about our platform, token, and
              services.
            </p>
            <a
              href="/"
              className={`${theme.faqBtn} bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-3 px-8 rounded-lg transition-colors`}
            >
              Visit FAQ Page
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
