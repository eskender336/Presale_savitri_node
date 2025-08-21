import React, { useState, useEffect } from "react";
import { useEthersSigner } from "../../provider/hooks";

const KYCForm = ({ isDarkMode }) => {
  const [submitted, setSubmitted] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    documentType: "passport",
    documentNumber: "",
  });

  const fieldLabels = {
    fullName: "Full Name",
    email: "Email",
    country: "Country",
    documentType: "Document Type",
    documentNumber: "Document Number",
  };

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

  const signer = useEthersSigner();

  const submitForm = async (data) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }
    const message = JSON.stringify(data);
    const signature = await signer.signMessage(message);
    const publicKey = await signer.getAddress();

    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: data, publicKey, signature }),
    });
    if (!res.ok) throw new Error("KYC submission failed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitForm(formData);
      setSubmitted(true);
      setError(null);
    } catch (err) {
      console.error("KYC submission error", err);
      setError("KYC submission failed. Please try again.");
    }
  };

  const handleFieldSave = async () => {
    try {
      await submitForm(formData);
      setError(null);
    } catch (err) {
      console.error("KYC update error", err);
      setError("Failed to update field.");
    }
    setEditingField(null);
  };

  useEffect(() => {
    const fetchExisting = async () => {
      if (!signer) return;
      try {
        const publicKey = await signer.getAddress();
        const res = await fetch(`/api/kyc?publicKey=${publicKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.formData) {
            setFormData(data.formData);
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error("KYC fetch error", err);
      }
    };
    fetchExisting();
  }, [signer]);

  return (
    <div className={`${theme.mainBg} min-h-screen pb-8`}>
      <div className="max-w-xl mx-auto pt-6">
        <h1 className={`text-2xl font-bold mb-4 ${theme.text}`}>
          KYC Verification
        </h1>
        <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${theme.text}`}>KYC Form</h2>

          {submitted ? (
            <div>
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-green-900/20" : "bg-green-100"
                } ${theme.text}`}
              >
                Thank you! Your information has been submitted.
              </div>
              <div className="mt-4 space-y-4">
                {Object.keys(fieldLabels).map((field) => (
                  <div key={field}>
                    <label className={`${theme.textSecondary} block mb-1`}>
                      {fieldLabels[field]}
                    </label>
                    {editingField === field ? (
                      <div className="flex items-center space-x-2">
                        {field === "documentType" ? (
                          <select
                            name="documentType"
                            value={formData.documentType}
                            onChange={handleChange}
                            className={`flex-1 p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                          >
                            <option value="passport">Passport</option>
                            <option value="driver_license">
                              Driver&apos;s License
                            </option>
                            <option value="id_card">National ID</option>
                          </select>
                        ) : (
                          <input
                            type={field === "email" ? "email" : "text"}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className={`flex-1 p-2 rounded-lg ${theme.inputBg} ${theme.text}`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleFieldSave}
                          className="text-sm text-green-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className={theme.text}>{formData[field]}</p>
                        <button
                          type="button"
                          onClick={() => setEditingField(field)}
                          className="text-sm text-blue-500"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    isDarkMode ? "bg-red-900/20" : "bg-red-100"
                  } ${theme.text}`}
                >
                  {error}
                </div>
              )}

              {/* Form fields */}
              <div>
                <label
                  htmlFor="fullName"
                  className={`${theme.textSecondary} block mb-1`}
                >
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
                <label
                  htmlFor="email"
                  className={`${theme.textSecondary} block mb-1`}
                >
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
                <label
                  htmlFor="country"
                  className={`${theme.textSecondary} block mb-1`}
                >
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
                <label
                  htmlFor="documentType"
                  className={`${theme.textSecondary} block mb-1`}
                >
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
                <label
                  htmlFor="documentNumber"
                  className={`${theme.textSecondary} block mb-1`}
                >
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
                className="w-full py-3 rounded-lg text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white font-medium"
              >
                Submit KYC
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCForm;
