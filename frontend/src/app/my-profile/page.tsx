// src/app/my-profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Menu from '../components/menu';
import Footer from '../components/footer'; 
import { User2, Mail, Phone, Calendar, MapPin, Home, Facebook, Twitter, Linkedin, Instagram, Edit, X } from 'lucide-react';

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

interface UpdateProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  state: string;
  address: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

const API_BASE_URL = 'http://localhost:4000';

const countries = [
  'USA', 'Canada', 'Mexico', 'Jamaica', 'Australia', 'New Zealand',
  'Nigeria', 'Ghana', 'South Africa', 'Kenya', 'Ethiopia', 'Egypt',
  'China', 'India', 'UK', 'Netherlands', 'Italy', 'Germany',
  'France', 'Greece', 'Poland', 'Finland', 'Austria', 'Denmark',
  'Sweden', 'Russia', 'Japan', 'Philippines', 'Singapore', 'Indonesia',
  'Thailand', 'Israel', 'Hong Kong', 'Saudi Arabia', 'Kuwait',
  'Brazil', 'Argentina', 'Columbia', 'Chile', 'Peru', 'Uruguay',
  'Morocco', 'Senegal', 'Tunisia', 'Cameroon', 'Zambia', 'Zimbabwe', 'Benin'
];

export default function MyProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = searchParams.get('owner');
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    state: '',
    address: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: ''
  });

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
            // Initialize update form with current data
            setUpdateForm({
              firstName: profileData.user.firstName || '',
              lastName: profileData.user.lastName || '',
              phone: profileData.user.phone || '',
              dateOfBirth: profileData.user.dateOfBirth || '',
              country: profileData.user.country || '',
              state: profileData.user.state || '',
              address: profileData.user.address || '',
              facebook: profileData.user.facebook || '',
              twitter: profileData.user.twitter || '',
              linkedin: profileData.user.linkedin || '',
              instagram: profileData.user.instagram || ''
            });
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

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.userId,
          ...updateForm
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...updateForm } : null);
        // Update user in localStorage
        const updatedUser = { ...user, ...updateForm };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setShowUpdateModal(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('An error occurred while updating profile');
    } finally {
      setUpdateLoading(false);
    }
  };

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
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 cursor-pointer"
            >
              Back to Dashboard
            </button>
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
                  <li><Link href="/dashboard" className="hover:text-yellow-300 cursor-pointer">Home</Link></li>
                  <li className="before:content-['/'] before:mx-2">
                    <Link href="/dashboard" className="hover:text-yellow-300 cursor-pointer">Dashboard</Link>
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
                    <button 
                      onClick={() => setShowUpdateModal(true)}
                      className="bg-purple-600 text-yellow-400 px-8 py-3 rounded-lg hover:bg-purple-700 inline-flex items-center font-semibold cursor-pointer"
                    >
                      <Edit className="mr-2" size={20} />
                      Update Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">Update Profile</h2>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={updateForm.firstName}
                    onChange={handleUpdateFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={updateForm.lastName}
                    onChange={handleUpdateFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={updateForm.phone}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={updateForm.dateOfBirth}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    value={updateForm.country}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={updateForm.state}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Address
                </label>
                <textarea
                  name="address"
                  value={updateForm.address}
                  onChange={handleUpdateFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={updateForm.facebook}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={updateForm.twitter}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={updateForm.linkedin}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={updateForm.instagram}
                    onChange={handleUpdateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="bg-purple-600 text-yellow-400 px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                >
                  {updateLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}