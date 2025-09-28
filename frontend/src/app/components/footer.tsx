// components/Footer.tsx

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Us */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold mb-4">About Us</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              We are building the most effective and efficient global online trade exchange community; 
              where individuals can trade and exchange directly with each other their products, skills 
              and services without the use of CASH.
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Useful Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="text-lg font-semibold mb-4">My Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/messages" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  My Messages
                </Link>
              </li>
              <li>
                <Link href="/my-profile" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/my-listing" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  My Swops
                </Link>
              </li>
            </ul>
          </div>

          {/* How it Works */}
          <div>
            <h4 className="text-lg font-semibold mb-4">How it Works</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/add-swap" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Add Swop
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white text-sm transition duration-200">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Copyright © 2025 SwopHere. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}