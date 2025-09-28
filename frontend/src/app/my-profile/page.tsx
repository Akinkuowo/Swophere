// src/app/my-profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Menu from '../components/menu';
import Footer from '../components/footer'; 
import { User } from '../components/menu';
import { User2, Mail, Phone, Calendar, MapPin, Home, Facebook, Twitter, Linkedin, Instagram, Edit } from 'lucide-react';

interface UserProfile {
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

const API_BASE_URL = 'http://localhost:4000';

export default function MyProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = searchParams.get('owner');
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Determine if we're viewing own profile or someone else's
          const profileUsername = owner || userData.username;
          setIsOwner(!owner || owner === userData.username);

          // Fetch profile data
          const response = await fetch(`${API_BASE_URL}/api/user/profile/${profileUsername}`);
          const profileData = await response.json();

          if (profileData.success) {
            setProfile(profileData.user);
          } else {
            console.error('Failed to fetch profile:', profileData.message);
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router, owner]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={user} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={user} />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">The requested profile could not be loaded.</p>
            <Link href="/dashboard" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Menu user={user} />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <h1 className="text-3xl font-bold mb-4 md:mb-0">
                {isOwner ? 'My Profile' : `${profile.firstName}'s Profile`}
              </h1>
              <nav className="text-sm">
                <ol className="flex items-center space-x-2">
                  <li><Link href="/dashboard" className="hover:text-yellow-300">Home</Link></li>
                  <li className="before:content-['/'] before:mx-2">
                    <Link href="/dashboard" className="hover:text-yellow-300">Dashboard</Link>
                  </li>
                  <li className="before:content-['/'] before:mx-2">Profile</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Profile Header */}
              <div className="bg-purple-600 text-white px-6 py-4">
                <h4 className="text-xl font-semibold flex items-center">
                  <User2 className="mr-2" size={24} />
                  Profile Details
                </h4>
              </div>

              {/* Profile Content */}
              <div className="p-6">
                {/* Profile Photo Section - Uncomment if you want to add photo upload */}
                {/* <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <img 
                      src="/images/user-avatar.jpg" 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {isOwner && (
                      <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700">
                        <Edit size={16} />
                        <input type="file" className="hidden" />
                      </label>
                    )}
                  </div>
                </div> */}

                {/* Profile Information */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <User2 className="mr-2 text-purple-600" size={18} />
                        First Name
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.firstName}
                      </p>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <User2 className="mr-2 text-purple-600" size={18} />
                        Last Name
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.lastName}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <Mail className="mr-2 text-purple-600" size={18} />
                        Email
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Phone */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <Phone className="mr-2 text-purple-600" size={18} />
                        Phone
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.phone || 'Not provided'}
                      </p>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <Calendar className="mr-2 text-purple-600" size={18} />
                        Date of Birth
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.dateOfBirth || 'Not provided'}
                      </p>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <MapPin className="mr-2 text-purple-600" size={18} />
                        Country
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.country || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* State */}
                    <div className="space-y-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <MapPin className="mr-2 text-purple-600" size={18} />
                        State
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.state || 'Not provided'}
                      </p>
                    </div>

                    {/* Address */}
                    <div className="space-y-2 md:col-span-2">
                      <h4 className="text-gray-600 font-medium flex items-center">
                        <Home className="mr-2 text-purple-600" size={18} />
                        Home Address
                      </h4>
                      <p className="text-gray-800 text-lg font-medium pl-6">
                        {profile.address || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-gray-800 font-semibold mb-4">Social Media</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Facebook */}
                      <div className="space-y-2">
                        <h4 className="text-gray-600 font-medium flex items-center">
                          <Facebook className="mr-2 text-blue-600" size={18} />
                          Facebook
                        </h4>
                        <p className="text-gray-800 text-lg font-medium pl-6 truncate">
                          {profile.facebook || 'Not provided'}
                        </p>
                      </div>

                      {/* Twitter */}
                      <div className="space-y-2">
                        <h4 className="text-gray-600 font-medium flex items-center">
                          <Twitter className="mr-2 text-blue-400" size={18} />
                          Twitter
                        </h4>
                        <p className="text-gray-800 text-lg font-medium pl-6 truncate">
                          {profile.twitter || 'Not provided'}
                        </p>
                      </div>

                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <h4 className="text-gray-600 font-medium flex items-center">
                          <Linkedin className="mr-2 text-blue-700" size={18} />
                          LinkedIn
                        </h4>
                        <p className="text-gray-800 text-lg font-medium pl-6 truncate">
                          {profile.linkedin || 'Not provided'}
                        </p>
                      </div>

                      {/* Instagram */}
                      <div className="space-y-2">
                        <h4 className="text-gray-600 font-medium flex items-center">
                          <Instagram className="mr-2 text-pink-600" size={18} />
                          Instagram
                        </h4>
                        <p className="text-gray-800 text-lg font-medium pl-6 truncate">
                          {profile.instagram || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update Profile Button (only show for own profile) */}
                {isOwner && (
                  <div className="text-center mt-8">
                    <Link 
                      href="/update-profile"
                      className="bg-purple-600 text-yellow-400 px-8 py-3 rounded-lg hover:bg-purple-700 inline-flex items-center font-semibold"
                    >
                      <Edit className="mr-2" size={20} />
                      Update Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}