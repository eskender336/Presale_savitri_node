import React from "react";
import { FaInfoCircle } from "react-icons/fa";

const Error = ({ errorMessage }) => {
  return (
    <div className="mb-6 p-4 rounded-xl bg-red-900/20 text-red-400 flex items-start gap-3">
      <FaInfoCircle className="mt-1" />
      <span>{errorMessage}</span>
    </div>
  );
};

export default Error;
