// components/Menu.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Bell, Layers, User, List, Mail, Power } from 'lucide-react';

// Update your User interface in components/Menu.tsx and other files

export interface User {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    country?: string;
    state?: string;
    address?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  }

interface MenuProps {
  user: User | null;
}

export default function Menu({ user }: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6b21a8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user');
        localStorage.removeItem('session_token');
        localStorage.removeItem('last_login_stamp');
        router.push('/');
      }
    });
  };

  const notifications = [
    {
      id: 1,
      type: 'success',
      icon: '✓',
      message: 'Your Listing Burger House (MG Road) Has Been Approved!',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'info',
      icon: '✉️',
      message: 'You Have 7 Unread Messages',
      time: '5 hours ago'
    }
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <img src="/images/logo.png" alt="LetSwap Logo" className="h-8" />
            </Link>

            {/* Hamburger Menu for Mobile */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-purple-600 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center">
                <span className={`block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-current transition duration-300 ease-in-out mt-1 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-purple-600 font-medium border-b-2 border-purple-600 py-1">
                Home
              </Link>
              <Link href="/listing" className="text-gray-600 hover:text-purple-600 font-medium py-1 transition duration-200">
                Swops
              </Link>
              <Link href="/messages" className="text-gray-600 hover:text-purple-600 font-medium py-1 transition duration-200">
                My Messages
              </Link>
              <Link href="/add-swap" className="text-gray-600 hover:text-purple-600 font-medium py-1 transition duration-200">
                Create a Swop
              </Link>
              <Link href="/advert-booking" className="text-gray-600 hover:text-purple-600 font-medium py-1 transition duration-200">
                Advert Booking
              </Link>
            </nav>
          </div>

          {/* Right Side - User Menu and Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="cursor-pointer p-2 text-gray-600 hover:text-purple-600 relative"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  2
                </span>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">You Have 2 Notifications</h3>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 text-center border-t border-gray-200">
                    <Link href="/notifications" className="text-purple-600 hover:text-purple-700 font-medium">
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="cursor-pointer flex items-center space-x-2 p-2 text-gray-700 hover:text-purple-600"
              >
                <img 
                  src="/images/dashboard-avatar.jpg" 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block font-medium">
                  Hi, {user?.firstName || user?.username}!
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="py-1">
                    <Link href="/add-swap" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Layers size={16} className="mr-3" />
                      Add Swap
                    </Link>
                    <Link href="/my-profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User size={16} className="mr-3" />
                      My Profile
                    </Link>
                    <Link href="/my-listing" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <List size={16} className="mr-3" />
                      My Swaps
                    </Link>
                    <Link href="/messages" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Mail size={16} className="mr-3" />
                      Messages
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Power size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <nav className="py-2 space-y-1">
              <Link href="/dashboard" className="block py-2 px-4 text-purple-600 font-medium bg-purple-50">
                Home
              </Link>
              <Link href="/listing" className="block py-2 px-4 text-gray-600 hover:text-purple-600 hover:bg-gray-50">
                Swops
              </Link>
              <Link href="/messages" className="block py-2 px-4 text-gray-600 hover:text-purple-600 hover:bg-gray-50">
                My Messages
              </Link>
              <Link href="/add-swap" className="block py-2 px-4 text-gray-600 hover:text-purple-600 hover:bg-gray-50">
                Create a Swop
              </Link>
              <Link href="/advert-booking" className="block py-2 px-4 text-gray-600 hover:text-purple-600 hover:bg-gray-50">
                Advert Booking
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Overlay for closing menus when clicking outside */}
      {(isMenuOpen || isNotificationsOpen || isUserMenuOpen) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMenuOpen(false);
            setIsNotificationsOpen(false);
            setIsUserMenuOpen(false);
          }}
        ></div>
      )}
    </header>
  );
}