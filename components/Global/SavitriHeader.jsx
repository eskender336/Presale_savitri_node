const navLinks = [
  { label: "Home", href: "https://savitrinetwork.com" },
  { label: "About", href: "https://savitrinetwork.com" },
  { label: "Ecosystem", href: "https://savitrinetwork.com" },
  { label: "Docs", href: "https://savitrinetwork.com" },
  { label: "Blog", href: "https://savitrinetwork.com" },
];

export default function SavitriHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
        <a
          href="https://savitrinetwork.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2"
        >
          <img src="/SavitriNetwork.png" alt="Savitri Network" className="h-8 w-auto" />
          <span className="font-semibold text-gray-800">Savitri Network</span>
        </a>
        <nav className="space-x-6 hidden md:block">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-teal-600"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
