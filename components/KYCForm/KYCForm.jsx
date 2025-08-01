import React, { useState } from "react";
import { useWeb3 } from "../../context/Web3Provider";

const KYCForm = ({ isDarkMode }) => {
  const { account } = useWeb3();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    documentType: "passport",
    documentNumber: "",
  });

  const theme = {
    mainBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return;
    setSubmitting(true);
    try {
      await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, ...formData }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting KYC', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${theme.mainBg} min-h-screen pb-8`}>
      <div className="max-w-xl mx-auto pt-6">
        <h1 className={`text-2xl font-bold mb-4 ${theme.text}`}>KYC Verification</h1>
        <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${theme.text}`}>KYC Form</h2>
          {submitted ? (
            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-green-900/20" : "bg-green-100"
              } ${theme.text}`}
            >
              Thank you! Your information has been submitted.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className={`${theme.textSecondary} block mb-1`}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                />
              </div>
              <div>
                <label htmlFor="email" className={`${theme.textSecondary} block mb-1`}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                />
              </div>
              <div>
                <label htmlFor="country" className={`${theme.textSecondary} block mb-1`}>
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                />
              </div>
              <div>
                <label htmlFor="documentType" className={`${theme.textSecondary} block mb-1`}>
                  Document Type
                </label>
                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                >
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver&apos;s License</option>
                  <option value="id_card">National ID</option>
                </select>
              </div>
              <div>
                <label htmlFor="documentNumber" className={`${theme.textSecondary} block mb-1`}>
                  Document Number
                </label>
                <input
                  id="documentNumber"
                  name="documentNumber"
                  type="text"
                  required
                  value={formData.documentNumber}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !account}
                className="w-full py-3 rounded-lg text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit KYC"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCForm;
