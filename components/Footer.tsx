import React from 'react';

const Footer = () => (
  <footer className="bg-slate-900 text-white py-10">
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
      {/* Company Section */}
      <div>
        <h4 className="font-bold text-lg mb-4">Company</h4>
        <ul className="space-y-2">
          <li className="hover:text-gray-400 cursor-pointer">About Us</li>
          <li className="hover:text-gray-400 cursor-pointer">Careers</li>
          <li className="hover:text-gray-400 cursor-pointer">Blog</li>
        </ul>
      </div>

      {/* Support Section */}
      <div>
        <h4 className="font-bold text-lg mb-4">Support</h4>
        <ul className="space-y-2">
          <li className="hover:text-gray-400 cursor-pointer">Contact Us</li>
          <li className="hover:text-gray-400 cursor-pointer">FAQ</li>
          <li className="hover:text-gray-400 cursor-pointer">Privacy Policy</li>
        </ul>
      </div>

      {/* Follow Us Section */}
      <div>
        <h4 className="font-bold text-lg mb-4">Follow Us</h4>
        <ul className="flex space-x-6">
          <li>
            <a
              href="#"
              className="hover:text-gray-400 transition-colors"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-gray-400 transition-colors"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-gray-400 transition-colors"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-gray-700 mt-8 pt-6">
      <p className="text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} My E-commerce. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
