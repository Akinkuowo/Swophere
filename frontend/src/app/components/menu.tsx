// components/Menu.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Bell, Layers, User, List, Mail, Power, MessageCircle, Package, CheckCircle, XCircle } from 'lucide-react';

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

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedUsername?: string;
  metadata?: {
    senderName?: string;
    messagePreview?: string;
    swapTitle?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface MenuProps {
  user: User | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Menu({ user }: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (user?.username) {
      fetchNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.username]);

  const fetchNotifications = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${user.username}?limit=10&unreadOnly=false`
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.username) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${user.username}/unread-count`
      );
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user?.username
          })
        });

        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.type === 'MESSAGE' && notification.relatedUsername) {
      router.push(`/messages?user=${notification.relatedUsername}`);
    } else if (notification.type === 'SWAP_INTEREST' && notification.relatedId) {
      router.push(`/swaps/${notification.relatedId}`);
    } else if (notification.type === 'SWAP_APPROVED' && notification.relatedId) {
      router.push(`/swaps/${notification.relatedId}`);
    } else if (notification.type === 'SWAP_REJECTED' && notification.relatedId) {
      router.push(`/my-listing`);
    }

    setIsNotificationsOpen(false);
  };

  const markAllAsRead = async () => {
    if (!user?.username) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${user.username}/mark-all-read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.username) return;

    const result = await Swal.fire({
      title: 'Clear All Notifications?',
      text: 'This will delete all your notifications permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6b21a8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear all!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/notifications/${user.username}/clear-all`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        const data = await response.json();

        if (data.success) {
          setNotifications([]);
          setUnreadCount(0);
          Swal.fire('Cleared!', 'All notifications have been deleted.', 'success');
        }
      } catch (error) {
        console.error('Error clearing notifications:', error);
        Swal.fire('Error', 'Failed to clear notifications.', 'error');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle size={18} className="text-blue-600" />;
      case 'SWAP_INTEREST':
        return <Package size={18} className="text-purple-600" />;
      case 'SWAP_APPROVED':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'SWAP_REJECTED':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return 'bg-blue-100';
      case 'SWAP_INTEREST':
        return 'bg-purple-100';
      case 'SWAP_APPROVED':
        return 'bg-green-100';
      case 'SWAP_REJECTED':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) {
                    fetchNotifications();
                  }
                }}
                className="cursor-pointer p-2 text-gray-600 hover:text-purple-600 relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                    {notifications.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Mark all read
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No notifications yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          You'll be notified about messages and swap updates here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition duration-200 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.metadata?.messagePreview && (
                                <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                                  "{notification.metadata.messagePreview}"
                                </p>
                              )}
                              <span className="text-xs text-gray-500 mt-1 block">
                                {formatTimestamp(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-4 text-center border-t border-gray-200">
                      <Link 
                        href="/notifications" 
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  )}
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