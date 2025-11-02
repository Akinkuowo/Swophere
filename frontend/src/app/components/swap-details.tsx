// src/app/swap/[swapId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Menu from './menu';
import Swal from 'sweetalert2'
import Footer from './footer';
import { 
  MapPin, 
  User, 
  Tag, 
  Calendar, 
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  DollarSign
} from 'lucide-react';

interface InterestedSwap {
  id: string;
  title: string;
  description: string;
}

interface Swap {
  id: string;
  listing_id: string;
  name: string;
  title: string;
  category: string;
  country: string;
  city: string;
  image_name: string;
  description: string;
  interested_swaps: InterestedSwap[];
  trending: boolean;
  status: string;
  userId: string;
  createdAt: string;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface CurrentUser {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

const API_BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

export default function SwapDetails() {
  const params = useParams();
  const router = useRouter();
  const swapId = params.swapId as string;
  
  const [swap, setSwap] = useState<Swap | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // Fetch swap details
        const response = await fetch(`${API_BASE_URL}/api/swaps/${swapId}`);
        const data = await response.json();

        if (data.success) {
          setSwap(data.swap);
        } else {
          setError(data.message || 'Swap not found');
        }
      } catch (error) {
        console.error('Error fetching swap details:', error);
        setError('Failed to load swap details');
      } finally {
        setLoading(false);
      }
    };

    if (swapId) {
      fetchData();
    }
  }, [swapId]);

  const handleContactSwoper = () => {
    if (!currentUser) {
      
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "Please log in to contact the swoper"
      }).then(() => {
        router.push('/login');
        return;
     })
      
    }

    if (!swap?.user) {
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "Unable to contact swoper: user information not available"
      })
      return;
    }

    // Check if user is trying to contact themselves
    if (currentUser.userId === swap.userId) {
     
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "You cannot contact yourself"
      })
      return;
    }

    // Navigate to messages page with the swoper's username
    router.push(`/messages?user=${swap.user.username}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: swap?.title,
        text: swap?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      Swal.fire({
        icon: "success",
        title: "copied",
        text: "Link copied to clipboard!"
      })
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={currentUser} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !swap) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={currentUser} />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Swap Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested swap could not be found.'}</p>
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
      <Menu user={currentUser} />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={() => router.back()}
                className="flex items-center text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </button>
              <span className="text-gray-400">/</span>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Dashboard
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Swap Details</span>
            </div>
          </div>
        </div>

        {/* Swap Details */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Swap Header */}
              <div className="relative">
                <img 
                  src={`/swap_images/${swap.image_name}`} 
                  alt={swap.title}
                  className="w-full h-64 md:h-96 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-image.jpg';
                  }}
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {swap.category}
                  </span>
                </div>
                {swap.trending && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-yellow-400 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                      Trending
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h1 className="text-3xl font-bold text-gray-800">{swap.title}</h1>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleShare}
                          className="p-2 text-gray-400 hover:text-purple-600 cursor-pointer"
                          title="Share"
                        >
                          <Share2 size={20} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Add to favorites"
                        >
                          <Heart size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-6 text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        <span>{swap.city}, {swap.country}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        <span>Posted {formatDate(swap.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag size={16} className="mr-1" />
                        <span>{swap.category}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {swap.description}
                      </p>
                    </div>

                    {/* Interested In Swaps */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <DollarSign className="mr-2 text-purple-600" size={20} />
                        Interested In Swapping For
                      </h3>
                      
                      {swap.interested_swaps && swap.interested_swaps.length > 0 ? (
                        <div className="space-y-4">
                          {swap.interested_swaps.map((item, index) => (
                            <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold text-gray-800 text-lg mb-2">
                                {item.title}
                              </h4>
                              <p className="text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <DollarSign size={32} className="mx-auto mb-2 text-gray-400" />
                          <p>No specific swap items requested.</p>
                          <p className="text-sm">The swoper is open to various offers.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="lg:w-80">
                    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                      {/* Swoper Info */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <User size={18} className="mr-2" />
                          Swoper Information
                        </h3>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {swap.user ? `${swap.user.firstName} ${swap.user.lastName}` : swap.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              @{swap.user?.username || 'user'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button 
                          onClick={handleContactSwoper}
                          className="w-full bg-purple-600 text-yellow-400 py-3 rounded-lg hover:bg-purple-700 font-semibold cursor-pointer flex items-center justify-center transition duration-200"
                        >
                          <MessageCircle size={18} className="mr-2" />
                          Contact Swoper
                        </button>
                        
                        {/* <button className="w-full border border-purple-600 text-purple-600 py-3 rounded-lg hover:bg-purple-50 font-semibold cursor-pointer transition duration-200">
                          Make an Offer
                        </button> */}
                      </div>

                      {/* Swap Status */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Swap Status</h4>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(swap.status)}`}>
                          {getStatusText(swap.status)}
                        </div>
                      </div>

                      {/* Swap ID */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Swap ID</h4>
                        <p className="text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border">
                          {swap.listing_id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Swap Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Category</h4>
                      <p className="text-gray-600">{swap.category}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Location</h4>
                      <p className="text-gray-600">{swap.city}, {swap.country}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Listed</h4>
                      <p className="text-gray-600">{formatDate(swap.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Items Interested In</h4>
                      <p className="text-gray-600">{swap.interested_swaps?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}