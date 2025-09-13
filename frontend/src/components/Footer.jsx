import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-[#0B95D6] mb-4">Crystl</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Bringing transparency to public finances through innovative technology 
              and user-friendly interfaces.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-400 hover:text-[#0B95D6] transition-colors duration-300">
                  Home
                </a>
              </li>
              <li>
                <a href="#features" className="text-gray-400 hover:text-[#0B95D6] transition-colors duration-300">
                  Features
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-[#0B95D6] transition-colors duration-300">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-gray-400">
              <p>hello@crystl.com</p>
              <p>+1 (555) 123-4567</p>
              <p>123 Transparency St<br />Open City, OC 12345</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Crystl. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-[#0B95D6] transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-[#0B95D6] transition-colors duration-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
