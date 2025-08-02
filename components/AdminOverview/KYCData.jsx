import React, { useEffect, useState } from "react";

const KYCData = ({ isDarkMode }) => {
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);

  const theme = {
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    innerBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    tableBorder: isDarkMode ? "border-gray-800" : "border-gray-200",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/kyc");
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error("Error fetching kyc data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const entries = Object.entries(records);

  return (
    <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
      <h2 className={`text-lg sm:text-xl font-bold mb-4 ${theme.text}`}>KYC Records</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b ${theme.tableBorder}`}>
              <th className={`px-2 py-2 ${theme.textSecondary} text-xs sm:text-sm`}>Address</th>
              <th className={`px-2 py-2 ${theme.textSecondary} text-xs sm:text-sm`}>Name</th>
              <th className={`px-2 py-2 ${theme.textSecondary} text-xs sm:text-sm`}>Email</th>
              <th className={`px-2 py-2 ${theme.textSecondary} text-xs sm:text-sm`}>Country</th>
              <th className={`px-2 py-2 ${theme.textSecondary} text-xs sm:text-sm`}>Document</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([addr, info]) => (
              <tr key={addr} className={`border-b ${theme.tableBorder}`}>
                <td className={`px-2 py-2 break-all ${theme.textSecondary}`}>{addr}</td>
                <td className={`px-2 py-2 ${theme.text}`}>{info.fullName}</td>
                <td className={`px-2 py-2 ${theme.text}`}>{info.email}</td>
                <td className={`px-2 py-2 ${theme.text}`}>{info.country}</td>
                <td className={`px-2 py-2 ${theme.text}`}>{info.documentType}: {info.documentNumber}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan="5" className={`px-2 py-4 ${theme.textSecondary}`}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KYCData;
