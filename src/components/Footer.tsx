import { useState, useEffect } from 'react';
import { Twitter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // Show footer when user is within 100px of the bottom
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setIsVisible(isAtBottom);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Check initial position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer 
      className={`fixed bottom-0 left-4 right-4 z-20 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-t-2xl px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors duration-200">
          <span className="text-white font-bold"><em>RL.TCG</em></span>
          </Link>

          {/* Links Section */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              href="/terms" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <a 
              href="https://twitter.com/axenieady" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-1 group"
              title="Follow Twitter and message me your in-game username for free 4,000 credits"
            >
              <Twitter className="w-4 h-4" />
              <span>@axenieady</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex bg-black text-white text-xs rounded px-2 py-1 shadow-lg z-30 whitespace-nowrap">
                Follow Twitter and message me your in-game username for free 4,000 credits
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;