import React from "react";
import Link from "next/link";
import { useForm, ValidationError } from "@formspree/react";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaTelegram,
  FaMedium,
  FaYoutube,
} from "react-icons/fa";

const Footer = ({ isDarkMode }) => {
  const FORMSPREE_API_KEY = process.env.NEXT_PUBLIC_FORMSPREE_API_KEY;
  const [state, handleSubmit] = useForm(FORMSPREE_API_KEY);
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const bgColor = isDarkMode ? "bg-[#0E0B12]" : "bg-[#f3f3f7]";
  const headingColor = "bg-clip-text text-transparent text-light-gradient";

  return (
    <footer className={`${bgColor} ${textColor} py-10`}>
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Location & contact */}
        <div>
          <h2 className={`mb-4 font-semibold text-lg ${headingColor}`}>Location</h2>
          <div className="flex items-start mb-2">
            <FaMapMarkerAlt className="mr-2 mt-1" />
            <p>King Salman Bin Abdulaziz Al Saud Street, Dubai - UAE</p>
          </div>
          <div className="flex items-start mb-2">
            <FaEnvelope className="mr-2 mt-1" />
            <p>info@savitrinetwork.com</p>
          </div>
          <div className="flex items-start">
            <FaWhatsapp className="mr-2 mt-1" />
            <p>+971 50 168 4019</p>
          </div>
        </div>

        {/* Useful Links */}
        <div>
          <h2 className={`mb-4 font-semibold text-lg ${headingColor}`}>Useful Links</h2>
          <ul className="space-y-2">
            <li>
              <Link href="https://savitrinetwork.com/" className="hover:underline">
                Homepage
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/ambassador-program/" className="hover:underline">
                Ambassador program
              </Link>
            </li>
            <li>
              <Link href="https://www.iubenda.com/privacy-policy/72728663" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/faq/" className="hover:underline">
                FAQ&apos;s
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/blog/" className="hover:underline">
                Our blog
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/contact-us/" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Main Pages */}
        <div>
          <h2 className={`mb-4 font-semibold text-lg ${headingColor}`}>Main Pages</h2>
          <ul className="space-y-2">
            <li>
              <Link href="https://savitrinetwork.com/about-us-new/" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/why-savitri/" className="hover:underline">
                Why Savitri
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/pou/" className="hover:underline">
                Proof of Unity
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/ai-marketplace/" className="hover:underline">
                AI on Savitri
              </Link>
            </li>
            <li>
              <Link href="https://savitrinetwork.com/iot-data-integration/" className="hover:underline">
                IoT and Data Integration
              </Link>
            </li>
          </ul>
        </div>

        {/* Logo & social */}
        <div className="flex flex-col items-start">
          <img src="https://savitrinetwork.com/wp-content/uploads/2025/07/1Tavola-disegno-1network-.png" alt="Savitri" className="w-40 mb-4" />
          <p className="mb-4 text-sm">
            Savitri Network<br />Technology built for people, not platforms.<br />We unite blockchain, AI, and IoT to power real solutions across communities, business, and the planet.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://www.instagram.com/savitrinetwork/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/Savitri_Net"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
            <a
              href="https://www.linkedin.com/company/savitri-network"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://t.me/savitri_group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTelegram />
            </a>
            <a
              href="https://medium.com/@savitri-network"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaMedium />
            </a>
            <a
              href="https://www.youtube.com/@savitri_network"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaYoutube />
            </a>
          </div>

          {/* Newsletter subscription */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2">
              Stay updated with our newsletter
            </h4>
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                className={`flex-grow px-3 py-2 text-sm rounded-l-md focus:outline-none ${
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                } border`}
              />
              <ValidationError prefix="Email" field="email" errors={state.errors} />
              <button
                type="submit"
                disabled={state.submitting}
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-indigo-500 text-white rounded-r-md text-sm"
              >
                {state.submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {state.succeeded && (
              <p className="text-xs mt-2">Thanks for subscribing!</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs">
        Savitri Network 2025 &copy; Copyright | Powered by Savitri Labs
      </div>
    </footer>
  );
};

export default Footer;
