import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiBook,
  FiMap,
  FiFileText,
  FiCompass,
  FiActivity,
  FiCpu,
  FiLayers,
  FiDatabase,
  FiCode,
  FiInfo,
} from "react-icons/fi";
import { RiWallet3Line } from "react-icons/ri";
import CustomConnectButton from "../Global/CustomConnectButton";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;

const Header = ({ isDarkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef(null);
  const menuRef = useRef(null);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMegaMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle mega menu hover
  const handleMenuHover = (menuId) => {
    clearTimeout(timeoutRef.current);
    setActiveMegaMenu(menuId);
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 300);
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prepare header classes
  const headerClasses = `w-full transition-all duration-500 ease-out ${
    isDarkMode
      ? "bg-[#0E0B12]/95 backdrop-blur-md"
      : "bg-white/95 backdrop-blur-md"
  } ${
    isHeaderSticky
      ? "fixed top-0 left-0 z-50 w-full shadow-lg animate-slowSlideDown border-b"
      : "relative border-b"
  } ${isDarkMode ? "border-gray-800/50" : "border-gray-200/50"}`;

  // Mega menu content
  const megaMenus = {
    ecosystem: {
      title: "Ecosystem",
      columns: [
        {
          title: "Core Technology",
          links: [
            {
              icon: <FiActivity className="text-teal-400" />,
              label: "PoI Consensus",
              href: "/dashboard",
            },
            {
              icon: <FiCpu className="text-indigo-500" />,
              label: "AIVM",
              href: "/dashboard",
            },
            {
              icon: <FiLayers className="text-teal-400" />,
              label: "Framework",
              href: "/dashboard",
            },
            {
              icon: <FiDatabase className="text-indigo-500" />,
              label: "Governance",
              href: "/dashboard",
            },
          ],
        },
        {
          title: "Applications",
          links: [
            {
              icon: <FiCode className="text-teal-400" />,
              label: "Developer Tools",
              href: "/dashboard",
            },
            {
              icon: <FiCompass className="text-indigo-500" />,
              label: "Explorer",
              href: "/dashboard",
            },
            {
              icon: <FiMap className="text-teal-400" />,
              label: "Launchpad",
              href: "/dashboard",
            },
          ],
        },
        {
          title: "Community",
          links: [
            {
              icon: <FiFileText className="text-indigo-500" />,
              label: "Documentation",
              href: "/dashboard",
            },
            {
              icon: <FiBook className="text-teal-400" />,
              label: "Blog",
              href: "/dashboard",
            },
            {
              icon: <FiCompass className="text-indigo-500" />,
              label: "Events",
              href: "/dashboard",
            },
          ],
        },
      ],
      featuredBox: {
        title: "Join Our Community",
        description:
          "Be part of the Lightchain revolution and help shape the future of AI-driven blockchain.",
        linkText: "Join Discord",
        linkUrl: "/dashboard",
        bgClass: isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100/60",
      },
    },
    resources: {
      title: "Resources",
      columns: [
        {
          title: "Learn",
          links: [
            {
              icon: <FiFileText className="text-teal-400" />,
              label: "Whitepaper",
              href: "/dashboard",
            },
            {
              icon: <FiMap className="text-indigo-500" />,
              label: "Roadmap",
              href: "/dashboard",
            },
            {
              icon: <FiBook className="text-teal-400" />,
              label: "Documentation",
              href: "/dashboard",
            },
            {
              icon: <FiCompass className="text-indigo-500" />,
              label: "Tutorials",
              href: "/dashboard",
            },
          ],
        },
        {
          title: "Tools",
          links: [
            {
              icon: <FiCompass className="text-teal-400" />,
              label: "Block Explorer",
              href: "/dashboard",
            },
            {
              icon: <FiDatabase className="text-indigo-500" />,
              label: "Analytics",
              href: "/dashboard",
            },
            {
              icon: <FiCpu className="text-teal-400" />,
              label: "API",
              href: "/dashboard",
            },
          ],
        },
      ],
      featuredBox: {
        title: "Start Building Today",
        description:
          "Access developer resources and start building on the Lightchain Protocol.",
        linkText: "Developer Portal",
        linkUrl: "/dashboard",
        bgClass: isDarkMode ? "bg-teal-500/10" : "bg-teal-100/60",
      },
    },
  };

  return (
    <>
      {/* Placeholder div when header is fixed to prevent content jump */}
      {isHeaderSticky && <div className="h-[90px] md:h-[98px]"></div>}

      {/* <header className={headerClasses} ref={menuRef}> */}
      <header
        className={`w-full  transition-all duration-500 ease-out fixed top-0 left-0 z-50 w-full shadow-lg animate-slowSlideDown border-b  ${
          isDarkMode
            ? "bg-[#0E0B12]/95 backdrop-blur-md border-gray-800/50"
            : "bg-white/95 backdrop-blur-md border-gray-200/50"
        }`}
        ref={menuRef}
      >
        {/* Announcement Banner with Scrolling Animation */}

        {/* Announcement Banner with Scrolling Animation */}
        {!isScrolled && (
          <div className="relative py-3 overflow-hidden whitespace-nowrap">
            {/* Gradient background */}
            <div className="absolute inset-0 text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white z-0"></div>

            {/* Subtle gradient pattern overlay */}
            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px, 30px 30px",
                backgroundPosition: "0 0, 15px 15px",
              }}
            ></div>

            {/* Marquee text content */}
            <div className="animate-marquee inline-block whitespace-nowrap text-white relative z-10">
              <span className="mx-4 text-sm md:text-base">
                🚀 {TOKEN_NAME} {TOKEN_SYMBOL} Presale is NOW LIVE! Be part of
                the future—claim your discounted tokens and exclusive access to
                revolutionary AI-blockchain technology.
                <span className="mx-1">🌐</span>
                Don&apos;t wait, join the innovation wave today!
                <span className="ml-1">🔥</span>
              </span>
            </div>
          </div>
        )}
        {/* Main Navigation */}
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative w-32 h-24 mr-3 overflow-hidden">
                <div className="absolute inset-0 "></div>
                <div className="absolute inset-1 flex items-center justify-center">
                  <img
                    src="/SavitriNetwork.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="https://www.savitrinetwork.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              Homepage
            </a>

            <a
              href="https://savitrinetwork.com/about-us/"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              About Us
            </a>

            {/* Savitri Blockchain Dropdown */}
            <div className="relative group">
              <button
                className={`flex items-center space-x-1 py-2 px-1 transition-colors ${
                  isDarkMode
                    ? "text-gray-300 hover:text-teal-400"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                <span>Savitri Blockchain</span>
                <FiChevronDown className="transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div
                className="absolute left-0 mt-2 w-56 rounded-md shadow-lg border dark:border-gray-800 border-gray-200 bg-white dark:bg-[#14101A] opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all"
              >
                <a
                  href="https://savitrinetwork.com/why-savitri/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Why Savitri
                </a>
                <a
                  href="https://savitrinetwork.com/ai-marketplace/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  AI-Marketplace
                </a>
                <a
                  href="https://savitrinetwork.com/pou/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Proof of Unity
                </a>
                <a
                  href="https://savitrinetwork.com/iot-data-integration/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  IoT Data Integration
                </a>
              </div>
            </div>

            <a
              href="https://savitrinetwork.com/savi-coin/"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              SAVI Coin
            </a>

            <a
              href="https://savitrinetwork.com/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              Blog list
            </a>

            <a
              href="https://savitrinetwork.com/faq/"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              FAQs
            </a>

            <a
              href="https://savitrinetwork.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-1 transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:text-teal-400"
                  : "text-gray-700 hover:text-teal-600"
              }`}
            >
              Contact Us
            </a>

            <a
              href="https://t.me/savitri_group"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-3 py-1 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              join our TG group
            </a>
          </nav>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all duration-300 ${
                isDarkMode
                  ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                  : "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
              }`}
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            <a href="/dashboard" className="group">
              <div className="w-10 h-10 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105">
                <span className="text-white">
                  {/* User placeholder icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </a>

            <CustomConnectButton active={true} />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                isDarkMode
                  ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                  : "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
              } transition-all`}
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            <button
              onClick={toggleMenu}
              className={`focus:outline-none ${
                isDarkMode ? "text-teal-400" : "text-indigo-500"
              }`}
              aria-label="Toggle menu"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdowns */}
        {Object.keys(megaMenus).map((menuKey) => {
          const menu = megaMenus[menuKey];
          return (
            <div
              key={menuKey}
              className={`absolute left-0 w-full z-40 transition-all duration-300 transform ${
                activeMegaMenu === menuKey
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              } ${
                isDarkMode
                  ? "bg-[#14101A]/95 backdrop-blur-md border-b border-gray-800/50"
                  : "bg-white/95 backdrop-blur-md border-b border-gray-200/50"
              } shadow-xl`}
              onMouseEnter={() => handleMenuHover(menuKey)}
              onMouseLeave={handleMenuLeave}
            >
              <div className="container mx-auto py-8 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {menu.columns.map((column, idx) => (
                    <div key={idx} className="space-y-4">
                      <h3
                        className={`text-sm font-bold uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {column.title}
                      </h3>
                      <ul className="space-y-2">
                        {column.links.map((link, linkIdx) => (
                          <li key={linkIdx}>
                            <Link
                              href={link.href}
                              className={`flex items-center space-x-2 py-1 transition-colors duration-200 ${
                                isDarkMode
                                  ? "text-gray-300 hover:text-teal-400"
                                  : "text-gray-700 hover:text-teal-600"
                              }`}
                              onClick={() => setActiveMegaMenu(null)}
                            >
                              <span className="text-lg">{link.icon}</span>
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Featured Box - Last column */}
                  <div className={`rounded-xl p-6 ${menu.featuredBox.bgClass}`}>
                    <h3
                      className={`text-xl font-bold mb-2 bg-clip-text text-transparent text-light-gradient`}
                    >
                      {menu.featuredBox.title}
                    </h3>
                    <p
                      className={`text-sm mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {menu.featuredBox.description}
                    </p>
                    <Link
                      href={menu.featuredBox.linkUrl}
                      className="inline-flex items-center space-x-1 font-medium bg-clip-text text-transparent text-light-gradient"
                      onClick={() => setActiveMegaMenu(null)}
                    >
                      <span>{menu.featuredBox.linkText}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Menu with Slide-in Animation */}
        <div
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } ${
            isDarkMode
              ? "bg-[#14101A] border-r border-gray-800/50"
              : "bg-white border-r border-gray-200/50"
          }`}
          style={{ height: "100vh", overflowY: "auto" }}
        >
          <div className="h-full overflow-y-auto">
            <div
              className={`p-5 border-b ${
                isDarkMode ? "border-gray-800/50" : "border-gray-200/50"
              } flex justify-between items-center`}
            >
              {/* Logo in mobile menu */}
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <div className="relative w-20 h-20 mr-3 overflow-hidden">
                  <div className="absolute inset-0 "></div>
                  <div className="absolute inset-1 flex items-center justify-center ">
                    <img
                      src="/SavitriNetwork.png"
                      alt="Logo"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                <span
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {TOKEN_NAME}
                </span>
              </Link>

              {/* Close button */}
              <button
                onClick={toggleMenu}
                className={`focus:outline-none ${
                  isDarkMode ? "text-teal-400" : "text-indigo-500"
                }`}
                aria-label="Close menu"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-5">
              <nav className="flex flex-col">
                <a
                  href="https://www.savitrinetwork.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>Homepage</span>
                </a>

                <a
                  href="https://savitrinetwork.com/about-us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>About Us</span>
                </a>

                <MobileAccordionItem
                  title="Savitri Blockchain"
                  isDarkMode={isDarkMode}
                  items={[
                    {
                      icon: <FiFileText className="text-teal-400" />,
                      label: "Why Savitri",
                      href: "https://savitrinetwork.com/why-savitri/",
                    },
                    {
                      icon: <FiCpu className="text-indigo-500" />,
                      label: "AI-Marketplace",
                      href: "https://savitrinetwork.com/ai-marketplace/",
                    },
                    {
                      icon: <FiLayers className="text-teal-400" />,
                      label: "Proof of Unity",
                      href: "https://savitrinetwork.com/pou/",
                    },
                    {
                      icon: <FiDatabase className="text-indigo-500" />,
                      label: "IoT Data Integration",
                      href: "https://savitrinetwork.com/iot-data-integration/",
                    },
                  ]}
                  toggleMenu={toggleMenu}
                />

                <a
                  href="https://savitrinetwork.com/savi-coin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>SAVI Coin</span>
                </a>

                <a
                  href="https://savitrinetwork.com/blog/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>Blog list</span>
                </a>

                <a
                  href="https://savitrinetwork.com/faq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>FAQs</span>
                </a>

                <a
                  href="https://savitrinetwork.com/contact-us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-4 border-b flex items-center space-x-2 ${
                    isDarkMode
                      ? "border-gray-800/50 text-gray-300 hover:text-teal-400"
                      : "border-gray-200/50 text-gray-700 hover:text-teal-600"
                  } transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>Contact Us</span>
                </a>

                <a
                  href="https://t.me/savitri_group"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 border-b flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <span>join our TG group</span>
                </a>

                <div className="mt-6">
                  <CustomConnectButton active={false} />
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Overlay for mobile menu */}
        {isOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleMenu}
          ></div>
        )}
      </header>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          display: inline-block;
        }
      `}</style>
    </>
  );
};

// Mobile Accordion Menu Item Component
const MobileAccordionItem = ({ title, items, isDarkMode, toggleMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-b ${
        isDarkMode ? "border-gray-800/50" : "border-gray-200/50"
      }`}
    >
      <button
        className={`flex items-center justify-between w-full py-4 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-2">
          <FiChevronDown
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <span>{title}</span>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="pl-6 pb-2 space-y-2">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center space-x-2 py-3 ${
                isDarkMode
                  ? "text-gray-400 hover:text-teal-400"
                  : "text-gray-600 hover:text-teal-600"
              } transition-colors`}
              onClick={() => {
                toggleMenu();
                setIsOpen(false);
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
