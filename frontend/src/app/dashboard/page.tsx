// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Footer from '../components/footer';
import { User } from '../components/menu';
import TrendingSwops from '../components/treading-swops';
import HeroSection from '../components/hero-section';
import PopularLocation from '../components/popular-location';
import NewsLetter from '../components/newsletter';


interface Swap {
  id: string;
  listing_id: string;
  name: string;
  title: string;
  category: string;
  country: string;
  city: string;
  image_name: string;
  amount: number;
  currency: string;
  description: string;
  trending: string;
}

const API_BASE_URL = 'http://localhost:4000';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else if (userId) {
          // Fetch user data from API if not in localStorage
          const userResponse = await fetch(`${API_BASE_URL}/api/user/profile?userId=${userId}`);
          const userData = await userResponse.json();
          if (userData.success) {
            setUser(userData.user);
            localStorage.setItem('user', JSON.stringify(userData.user));
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load dashboard data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Menu Component */}
      <Menu user={user} />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Search Section */}
        <HeroSection />

        {/* Popular Locations */}
        <PopularLocation />

        {/* Trending Swops Section */}
        <TrendingSwops />

        {/* Newsletter Section */}
        <NewsLetter />
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}