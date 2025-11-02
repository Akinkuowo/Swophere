// src/app/agreement/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Menu from '../components/menu';
import Footer from '../components/footer';
import { FileText, User, Clock, CheckCircle, XCircle, MoreVertical, ArrowLeft } from 'lucide-react';


interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface Agreement {
  id: string;
  swop_id: string;
  from_user: string;
  to_user: string;
  agreement_status: string;
  created_at: string;
  item_title?: string;
  item_description?: string;
  terms?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherUser = searchParams.get('otherUser');
  
  const [user, setUser] = useState<User | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAgreement, setActiveAgreement] = useState<Agreement | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          await fetchAgreements(userData.username);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchAgreements = async (username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agreements?username=${username}`);
      const data = await response.json();

      if (data.success) {
        setAgreements(data.agreements);
      } else {
        console.error('Failed to fetch agreements:', data.message);
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
      // For demo purposes, create mock data
      setAgreements([
        {
          id: '1',
          swop_id: 'SWOP_001',
          from_user: 'john_doe',
          to_user: 'jane_smith',
          agreement_status: 'pending',
          created_at: new Date().toISOString(),
          item_title: 'Vintage Camera',
          item_description: 'Classic film camera in excellent condition'
        },
        {
          id: '2',
          swop_id: 'SWOP_002',
          from_user: 'mike_jones',
          to_user: 'john_doe',
          agreement_status: 'accepted',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          item_title: 'Guitar',
          item_description: 'Acoustic guitar with case'
        }
      ]);
    }
  };

  const handleCreateAgreement = () => {
    if (otherUser) {
      router.push(`/agreement/create?otherUser=${otherUser}`);
    } else {
      router.push('/agreement/create');
    }
  };

  const handleAgreementSelect = (agreement: Agreement) => {
    setActiveAgreement(agreement);
    // Navigate to agreement details
    router.push(`/agreement/${agreement.swop_id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherParty = (agreement: Agreement) => {
    if (!user) return '';
    return agreement.from_user === user.username ? agreement.to_user : agreement.from_user;
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Menu user={user} />
      
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
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 cursor-pointer">
                Dashboard
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Swap Agreements</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Swap Agreements</h1>
                <p className="text-purple-100">Manage your swap agreements and negotiations</p>
              </div>
              <button
                onClick={handleCreateAgreement}
                className="mt-4 md:mt-0 bg-yellow-400 text-purple-900 px-6 py-3 rounded-lg hover:bg-yellow-300 transition duration-200 font-semibold cursor-pointer flex items-center"
              >
                <FileText size={20} className="mr-2" />
                Create New Agreement
              </button>
            </div>
          </div>
        </div>

        {/* Agreements Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FileText size={20} className="mr-2 text-purple-600" />
                  Active Agreements
                </h2>
              </div>

              {/* Agreements List */}
              <div className="p-6">
                {agreements.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Agreements Yet</h3>
                    <p className="text-gray-500 mb-6">
                      {otherUser 
                        ? `Start a swap agreement with ${otherUser}`
                        : 'Create your first swap agreement to get started'
                      }
                    </p>
                    <button
                      onClick={handleCreateAgreement}
                      className="bg-purple-600 text-yellow-400 px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-semibold cursor-pointer"
                    >
                      Create Your First Agreement
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agreements.map((agreement) => (
                      <div
                        key={agreement.id}
                        onClick={() => handleAgreementSelect(agreement)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition duration-200 cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="text-purple-600" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-800 truncate">
                                  Agreement with @{getOtherParty(agreement)}
                                </h3>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agreement.agreement_status)}`}>
                                  {getStatusIcon(agreement.agreement_status)}
                                  <span className="ml-1 capitalize">{agreement.agreement_status}</span>
                                </div>
                              </div>
                              
                              {agreement.item_title && (
                                <p className="text-gray-600 font-medium mb-1">
                                  {agreement.item_title}
                                </p>
                              )}
                              
                              {agreement.item_description && (
                                <p className="text-gray-500 text-sm truncate">
                                  {agreement.item_description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  {formatDate(agreement.created_at)}
                                </span>
                                <span>Swap ID: {agreement.swop_id}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                              <MoreVertical size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {agreements.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{agreements.length}</div>
                      <div className="text-sm text-gray-600">Total Agreements</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {agreements.filter(a => a.agreement_status === 'accepted').length}
                      </div>
                      <div className="text-sm text-gray-600">Accepted</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {agreements.filter(a => a.agreement_status === 'pending').length}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {agreements.filter(a => a.agreement_status === 'open').length}
                      </div>
                      <div className="text-sm text-gray-600">Open</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <CheckCircle size={20} className="mr-2 text-green-600" />
                  How Agreements Work
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Create agreements to formalize swap terms
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Both parties must accept the agreement
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Track swap progress and completion
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Secure and transparent process
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText size={20} className="mr-2 text-blue-600" />
                  Agreement Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Open</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">New</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Waiting</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accepted</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Confirmed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Finished</span>
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
