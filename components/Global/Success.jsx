import React from "react";
import { FaCheck } from "react-icons/fa";
//
const EXPLORER_TX = process.env.NEXT_PUBLIC_EXPLORER_TX;
const Success = ({ successMessage, transactionHash }) => {
  return (
    <div className="mb-6 p-4 rounded-xl bg-green-900/20 text-green-400 flex items-start gap-3">
      <FaCheck className="mt-1" />
      <div>
        <p>{successMessage}</p>
        {transactionHash && (
          <a
            href={`${EXPLORER_TX}${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 mt-2 inline-block"
          >
            View on Etherscan
          </a>
        )}
      </div>
    </div>
  );
};

export default Success;
