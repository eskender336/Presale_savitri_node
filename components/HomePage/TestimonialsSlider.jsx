import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";

const TestimonialsSlider = ({ isDarkMode }) => {
  // Sample testimonial data
  const testimonials = [
    {
      id: 1,
      name: "Richard William",
      role: "Content Creator",
      text: "Their product exceeded his my ro expectations. The the quality and attention to moutstandin an and it has become an essential most a education the a man who can do tant clearly",
      rating: 5,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Marketing Director",
      text: "I've been impressed with the level of service and support. The platform is intuitive and has greatly improved our workflow efficiency.",
      rating: 5,
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "E-commerce Manager",
      text: "The integration was seamless and the results have been outstanding. Our conversion rates have increased by 40% since implementation.",
      rating: 4,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Manual navigation with transition
  const goToPrevious = () => {
    if (!transitioning) {
      prevSlide();
    }
  };

  const goToNext = () => {
    if (!transitioning) {
      nextSlide();
    }
  };

  const prevSlide = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
      );
      setTransitioning(false);
    }, 300);
  };

  const nextSlide = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      setTransitioning(false);
    }, 300);
  };

  // Generate star ratings
  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span
          key={i}
          className={`text-xl ${
            i < rating ? "text-yellow-400" : "text-gray-400"
          }`}
        >
          {i < rating ? "★" : "☆"}
        </span>
      ));
  };

  // Indicators
  const renderIndicators = () => {
    return testimonials.map((_, index) => (
      <button
        key={index}
        className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
          currentIndex === index
            ? "bg-gradient-to-r from-teal-400 to-indigo-500 w-6"
            : isDarkMode
            ? "bg-gray-700"
            : "bg-gray-300"
        }`}
        onClick={() => {
          if (!transitioning) {
            setTransitioning(true);
            setTimeout(() => {
              setCurrentIndex(index);
              setTransitioning(false);
            }, 300);
          }
        }}
        aria-label={`Go to testimonial ${index + 1}`}
      />
    ));
  };

  const currentTestimonial = testimonials[currentIndex];

  // Background and text colors based on dark mode
  const rightBg = isDarkMode
    ? "bg-gradient-to-b from-[#0E0B12] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-600";

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-col md:flex-row shadow-2xl rounded-2xl">
        {/* Left section with gradient background */}
        <div className="bg-gradient-to-r from-teal-400 to-indigo-500 text-white py-16 px-8 md:px-16 lg:px-24 md:w-1/2 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/4"></div>

          <div className="max-w-md ml-auto relative z-10">
            <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full inline-block mb-6 shadow-lg">
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              What Our Clients
              <br />
              Have to Say
            </h2>
            <p className="text-white/80 mb-8 max-w-sm">
              Discover how our solutions have transformed businesses and
              empowered users around the world.
            </p>
            <button className="bg-white text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500 px-8 py-3 rounded-full flex items-center font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group text-white">
              Get Support
              <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Right section with testimonial */}
        <div
          className={`py-16 px-8 md:px-16 lg:px-24 md:w-1/2 relative ${rightBg}`}
        >
          {/* Decorative quote mark */}
          <div className="absolute top-8 right-8 opacity-10">
            <FaQuoteLeft
              size={120}
              className={isDarkMode ? "text-white" : "text-gray-700"}
            />
          </div>

          <div className="max-w-md relative">
            <div
              className={`mb-6 transition-opacity duration-300 ${
                transitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex items-center mb-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {currentTestimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
                    {currentTestimonial.name}
                  </h3>
                  <p className={`leading-relaxed ${textSecondary}`}>
                    {currentTestimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {renderStars(currentTestimonial.rating)}
              </div>

              <p
                className={`leading-relaxed text-lg ${textSecondary} font-light relative z-10`}
              >
                "{currentTestimonial.text}"
              </p>
            </div>

            {/* Navigation controls */}
            <div className="flex justify-between items-center mt-10">
              <div className="flex space-x-3">
                <button
                  onClick={goToPrevious}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-500/30 bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 group"
                >
                  <FiArrowLeft
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    } group-hover:text-white`}
                  />
                </button>
                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-500/30 bg-gradient-to-r from-teal-400/10 to-indigo-500/10 hover:from-teal-400 hover:to-indigo-500 group"
                >
                  <FiArrowRight
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    } group-hover:text-white`}
                  />
                </button>
              </div>

              {/* Indicator dots */}
              <div className="flex items-center">{renderIndicators()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSlider;
