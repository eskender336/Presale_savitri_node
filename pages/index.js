import { useState, useEffect } from "react";
import Head from "next/head";
import {
  HeroSection,
  Footer,
  BlockchainFeatures,
  BrandSlider,
  BlockchainFeaturesGrid,
  RoadmapComponent,
  TokenomicsComponent,
  FAQComponent,
  HeroCTAComponent,
  FooterComponent,
  VideoCardSlider,
  DecentralizedPlatform,
  TestimonialsSlider,
  ReferralPopup,
} from "../components/HomePage/index";
import SavitriHeader from "../components/Global/SavitriHeader";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReferralPopupOpen, setIsReferralPopupOpen] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side only)
    if (typeof window === "undefined") return;

    try {
      // Check for saved preference
      const savedMode = localStorage.getItem("darkMode");

      // Safely check system preference
      let systemPrefersDark = false;
      try {
        systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      } catch (e) {
        // Fallback if matchMedia isn't supported
        systemPrefersDark = false;
      }

      // Determine which mode to use - now defaulting to dark mode
      // if no saved preference exists (removed the systemPrefersDark check)
      const shouldUseDarkMode = savedMode === "false" ? false : true;

      // Update state
      setIsDarkMode(shouldUseDarkMode);

      // Apply theme
      if (shouldUseDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      // Fallback in case of any errors - default to dark mode
      console.error("Error initializing theme:", error);
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);

    // Safely store preference
    try {
      localStorage.setItem("darkMode", newMode.toString());
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const applyTheme = (dark) => {
    if (typeof document === "undefined") return;

    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-black text-white" : "bg-white text-gray-800"
      } transition-colors duration-300`}
    >
      <Head>
        <title>{TOKEN_NAME} - Bridging AI with Decentralization</title>
        <meta
          name="description"
          content="Revolutionizing intelligence through decentralized innovation."
        />
        <link rel="icon" href="/Savitri.png" />
      </Head>

      <SavitriHeader />

      <main>
        <HeroSection
          isDarkMode={isDarkMode}
          setIsReferralPopupOpen={setIsReferralPopupOpen}
        />
        <DecentralizedPlatform isDarkMode={isDarkMode} />
        <BlockchainFeatures isDarkMode={isDarkMode} />
        <BlockchainFeaturesGrid isDarkMode={isDarkMode} />
        <RoadmapComponent isDarkMode={isDarkMode} />
        <TokenomicsComponent isDarkMode={isDarkMode} />
        <FAQComponent isDarkMode={isDarkMode} />
        <HeroCTAComponent isDarkMode={isDarkMode} />
        <FooterComponent isDarkMode={isDarkMode} />
      </main>

      <Footer isDarkMode={isDarkMode} />
      <ReferralPopup
        isOpen={isReferralPopupOpen}
        onClose={() => setIsReferralPopupOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
