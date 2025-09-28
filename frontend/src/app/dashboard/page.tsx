// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Footer from '../components/footer';
import { User } from '../components/menu';


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
  const [trendingSwaps, setTrendingSwaps] = useState<Swap[]>([]);
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

        // Fetch trending swaps
        const response = await fetch(`${API_BASE_URL}/api/swaps/trending`);
        const data = await response.json();

        if (data.success) {
          setTrendingSwaps(data.swaps);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load trending swaps',
          });
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

  const handleViewSwap = async (swapId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/swaps/${swapId}`);
      const data = await response.json();

      if (data.success) {
        // Redirect to swap details page
        window.location.href = `/swap/${swapId}`;
      } else {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error',
        //   text: 'Failed to load swap details',
        // });
      }
    } catch (error) {
      console.error('Error viewing swap:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load swap details',
      });
    }
  };

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
        <div 
          className="bg-cover bg-center py-20"
          style={{ backgroundImage: "url('/images/city_search_background.jpg')" }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Swop Your <span className="text-yellow-400">Skills</span></h2>
              <h4 className="text-xl mb-8">Find some of the best skills and swop with your own skill.</h4>
              
              <div className="bg-white rounded-lg p-4 shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input 
                      type="text" 
                      placeholder="What are you looking for?" 
                      className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  
                  <div>
                    <select className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:ring-purple-600">
                      <option value="">Select Location</option>
                      <option value="USA">USA</option>
                            <option value="CAN">Canada</option>
                            <option value="MEX">Mexico</option>
                            <option value="JAM">Jamaica</option>
                            <option value="AUS">Australia</option>
                            <option value="NZL">New Zealand</option>
                            <option value="NG">Nigeria</option>
                            <option value="GH">Ghana</option>
                            <option value="SAF">South Africa</option>
                            <option value="KEN">Kenya</option>
                            <option value="ETH">Ethiopia</option>
                            <option value="EGP">Egypt</option>
                            <option value="CHA">China</option>
                            <option value="IND">India</option>
                            <option value="UK">UK</option>
                            <option value="NTL">Netherlands</option>
                            <option value="ITA">Italy</option>
                            <option value="GER">Germany</option>
                            <option value="FR">France</option>
                            <option value="GRE">Greece</option>
                            <option value="POL">Poland</option>
                            <option value="FIN">Finland</option>
                            <option value="AST">Austria</option>
                            <option value="DEN">Denmark</option>
                            <option value="SWE">Sweden</option>
                            <option value="RUS">Russia</option>
                            <option value="JAP">Japan</option>
                            <option value="PHI">Philippines</option>
                            <option value="SIN">Singapore</option>
                            <option value="IND">Indonesia</option>
                            <option value="THAI">Thailand</option>
                            <option value="ISR">Israel</option>
                            <option value="Hong Kong">Hong Kong</option>
                            <option value="SAU">Saudi Arabia</option>
                            <option value="Kuwait">Kuwait</option>
                            <option value="BRA">Brazil</option>
                            <option value="ARG">Argentina</option>
                            <option value="COL">Columbia</option>
                            <option value="CHI">Chile</option>
                            <option value="Peru">Peru</option>
                            <option value="URG">Uruguay</option>
                            <option value="MOR">Morocco</option>
                            <option value="SEN">Senegal</option>
                            <option value="TUN">Tunisia</option>
                            <option value="Cameroon">Cameroon</option>
                            <option value="Zambia">Zambia</option>
                            <option value="Zimbabwe">Zimbabwe</option>
                            <option value="Benin">Benin</option>
                    </select>
                  </div>
                  
                  <div>
                    <select className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600">
                      <option value="goods">Goods & Items</option>
                      <option value="commodities">Commodities</option>
                      <option value="services">Services</option>
                      <option value="handiwork">Handiwork</option>
                      <option value="IT">Technology & IT</option>
                      <option value="business">Business</option>
                      <option value="Trainings">Trainings</option>
                    </select>
                  </div>
                </div>
                
                <button className="bg-yellow-400 text-white px-8 py-3 rounded-md hover:bg-purple-700 mt-4 font-medium">
                  Search
                </button>
              </div>

              {/* Popular Categories */}
              <div className="mt-8">
                <h3 className="text-white mb-4">Or Browse Popular Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                  {[
                    { icon: '💻', name: 'IT' },
                    { icon: '🔧', name: 'Handiwork' },
                    { icon: '💼', name: 'Business' },
                    { icon: '📦', name: 'Goods & Items' },
                    { icon: '🎓', name: 'Training' },
                    { icon: '📚', name: 'Commodities' }
                  ].map((category, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition duration-200 cursor-pointer">
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <p className="text-sm text-black">{category.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Locations */}
        <div className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center mb-12 text-black">
            Popular Search Categories
            <span className="block text-lg text-gray-600 font-normal mt-2">
              Discover best skills offers in your state/city
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Nigeria', image: '/images/ng.jpeg' },
              { name: 'USA', image: '/images/us.jpeg' },
              { name: 'UK', image: '/images/popular-location-03.jpg' },
              { name: 'Ghana', image: '/images/ghana.jpeg' },
              { name: 'South Africa', image: '/images/sa.jpeg' },
              { name: 'France', image: '/images/fr.jpeg' }
            ].map((location, index) => (
              <div key={index} className="relative group cursor-pointer">
                <div 
                  className="h-64 bg-cover bg-center rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${location.image}')` }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-80 rounded-lg flex items-center justify-center" style={{ opacity: 0.6 }}>
                    <h4 className="text-white text-2xl font-bold">{location.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Swops Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12 text-black">Trending Swops</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingSwaps.map((swap) => (
                <div key={swap.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    <img 
                      src={`/swap_images/${swap.image_name}`} 
                      alt={swap.title}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-sm">
                      {swap.category}
                    </span>
                    <span className="absolute top-2 right-2 bg-yellow-400 text-purple-600 px-2 py-1 rounded text-sm font-medium">
                      Trending
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple-600 font-bold">
                        {swap.currency === 'NG' ? '₦' : 
                         swap.currency === 'dollar' ? '$' : 
                         swap.currency === 'euro' ? '€' : 
                         swap.currency === 'yen' ? '¥' : '$'}
                        {swap.amount}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2">{swap.title}</h3>
                    <div className="text-gray-600 text-sm mb-3">
                      <span className="flex items-center mb-1">
                        📍 {swap.city}, {swap.country}
                      </span>
                      <span className="flex items-center">
                        👤 {swap.name}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4">
                      {swap.description.length > 100 
                        ? `${swap.description.substring(0, 100)}...` 
                        : swap.description}
                    </p>
                    
                    <button
                      onClick={() => handleViewSwap(swap.listing_id)}
                      className="w-full bg-purple-600 text-yellow-400 py-2 rounded-md hover:bg-purple-700 transition duration-200 font-medium"
                    >
                      View Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {trendingSwaps.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No trending swaps available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-purple-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Subscribe to Newsletter!</h2>
              <p className="text-purple-200 mb-6">
                Subscribe to get latest updates and information.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="border border-white flex-1 px-4 py-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button className="bg-yellow-400 text-purple-600 px-6 py-3 rounded-md hover:bg-yellow-300 font-medium cursor-pointer">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}