import React from "react";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const STABLE_PRICE = process.env.NEXT_PUBLIC_NEXT_STABLE_PRICE;

const Header = ({ theme, title }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
      <h1 className={`text-3xl font-bold mb-2 lg:mb-0 ${theme.text}`}>
        {title}
      </h1>
      <div className=" gap-6 hidden lg:flex">
        {["Roadmap", "Whitepaper", "Lightchain", "Docs"].map((item) => (
          <Link
            key={item}
            href="/lightchain-whitepaper.pdf"
            className={`${theme.textSecondary} hover:${theme.text}`}
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Header;
