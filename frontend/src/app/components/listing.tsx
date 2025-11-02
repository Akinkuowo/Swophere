'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2'

interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface Swap {
  id: number;
  listing_id: string;
  title: string;
  name: string;
  category: string;
  country: string;
  city: string;
  image_name: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  interested_swaps: any[];
  userId: string;
  user: {
    firstName: string;
    username: string;
    country: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SwapsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } else {
            // If no user in localStorage, redirect to login
            router.push('/login');
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchSwaps();
    }
  }, [user, selectedCategory, pagination.page, searchQuery]);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: 'ACCEPTED'
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_BASE_URL}/api/swaps?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSwaps(data.swaps);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching swaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSwaps();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleExpressInterest = async (swapId: string, swapUserId: string) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "Please log in to express interest"
      }).then(() => {
        router.push('/login');
        return;
      })
     
    }

    // Check if user is trying to express interest in their own swap
    if (user.userId === swapUserId) {
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "You cannot express interest in your own swap"
      })
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/swaps/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swapId: swapId,
          userId: user.userId,
          message: 'I am interested in this swap!'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "Success",
          title: "Successful",
          text: "Interest expressed successfully!"
        }).then(() =>{
           // Refresh the swaps to update interest status
          fetchSwaps();
        }) 
       
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: 'Error expressing interest: ' + data.message
        })
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: 'Error expressing interest'
      })
      console.error('Error expressing interest:', error);
      
    }
  };

  const hasUserExpressedInterest = (swap: Swap) => {
    return swap.interested_swaps?.some(
      (interest: any) => interest.userId === user?.userId
    );
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...';
    }
    return description;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && swaps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-8/12">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex-1 w-full lg:max-w-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search swaps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Category Filter */}
                <div className="flex items-center gap-4">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
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
            </div>

            {/* Swaps List */}
            <div className="space-y-6">
              {swaps.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No swaps found</h3>
                  <p className="text-gray-500">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'No swaps available at the moment'
                    }
                  </p>
                </div>
              ) : (
                swaps.map((swap) => {
                  const isOwner = user?.userId === swap.userId;
                  const hasExpressedInterest = hasUserExpressedInterest(swap);
                  
                  return (
                    <div key={swap.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="md:w-1/3 relative">
                          <img
                            src={`/swap_images/${swap.image_name}`}
                            alt={swap.title}
                            width={400}
                            height={300}
                            className="w-full h-48 md:h-full object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm capitalize">
                              {swap.category.toLowerCase()}
                            </span>
                          </div>
                          {isOwner && (
                          <div className="absolute top-4 right-4">
                            <span className={`px-1 py-1 rounded text-sm font-xs ${
                              swap.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                              swap.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Owner
                            </span>
                          </div>
                          )}
                        </div>
                        

                        {/* Content */}
                        <div className="md:w-2/3 p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition duration-200">
                              <Link href={`/swap/${swap.listing_id}`}>
                                {swap.title}
                              </Link>
                            </h3>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                              {swap.interested_swaps?.length || 0} interests
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600">
                              <i className="fa fa-map-marker mr-2 text-blue-500"></i>
                              <span>{swap.city}, {swap.country}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <i className="fa fa-user mr-2 text-green-500"></i>
                              <span>{swap.user.firstName} (@{swap.user.username})</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <i className="fa fa-calendar mr-2 text-purple-500"></i>
                              <span>Posted {formatDate(swap.createdAt)}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {truncateDescription(swap.description)}
                          </p>

                          <div className="flex flex-wrap gap-3">
                            <Link 
                              href={`/swap/${swap.listing_id}`}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                            >
                              View Details
                            </Link>
                            
                            {!isOwner && (
                              <button
                                onClick={() => handleExpressInterest(swap.listing_id, swap.userId)}
                                disabled={hasExpressedInterest || !user}
                                className={`px-6 py-2 rounded-lg transition duration-200 font-medium cursor-pointer ${
                                  hasExpressedInterest
                                    ? 'bg-green-500 text-white cursor-default'
                                    : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                                }`}
                              >
                                {hasExpressedInterest ? (
                                  <span className="flex items-center">
                                    <i className="fa fa-check mr-2"></i>
                                    Interested
                                  </span>
                                ) : (
                                  'Express Interest'
                                )}
                              </button>
                            )}
{/*                             
                            {isOwner && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                                Owner
                              </span>
                            )} */}
                            
                            <button className="text-gray-600 hover:text-red-500 transition duration-200 p-2">
                              <i className="fa fa-heart"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg border transition duration-200 ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-4/12">
            {/* Categories Widget */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <i className="fa fa-folder mr-2 text-blue-500"></i>
                Categories
              </h3>
              <ul className="space-y-2">
                {[
                  { name: 'All Categories', value: 'all' },
                  { name: 'Goods & Items', value: 'goods' },
                  { name: 'Commodities', value: 'commodities' },
                  { name: 'Services', value: 'services' },
                  { name: 'Handiwork', value: 'handiwork' },
                  { name: 'Technology & IT', value: 'IT' },
                  { name: 'Business', value: 'business' },
                  { name: 'Trainings', value: 'Trainings' }
                ].map((category) => (
                  <li key={category.value}>
                    <button
                      onClick={() => handleCategoryChange(category.value)}
                      className={`flex items-center w-full text-left p-2 rounded transition duration-200 ${
                        selectedCategory === category.value
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className="fa fa-angle-double-right mr-2 text-sm"></i>
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <i className="fa fa-chart-bar mr-2 text-green-500"></i>
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Swaps</span>
                  <span className="font-semibold text-blue-600">{pagination.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Page</span>
                  <span className="font-semibold text-green-600">{pagination.page} of {pagination.pages}</span>
                </div>
                {user && (
                  <div className="pt-3 border-t border-gray-200">
                    <Link
                      href="add-swap"
                      className="w-full bg-purple-600 text-white text-center py-2 rounded-lg hover:bg-purple-700 transition duration-200 font-medium block"
                    >
                      Create New Swap
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}