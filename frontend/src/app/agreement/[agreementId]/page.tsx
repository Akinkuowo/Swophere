// src/app/agreement/[agreementId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2'
import Menu from '../../components/menu';
import Footer from '../../components/footer';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Clock,
  Calendar,
  MapPin,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  Users,
  MessageCircle,
  Shield
} from 'lucide-react';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface SkillItem {
  id: string;
  skillName: string;
  skillDescription: string;
  deliverables: string[];
  duration: string;
  timeCommitment: string;
  startDate: string;
  completionCriteria: string;
}

interface Agreement {
  id: string;
  swop_id: string;
  from_user: string;
  to_user: string;
  agreement_status: string;
  agreement_title: string;
  agreement_type: string;
  terms: string;
  timeline_days: number;
  meeting_location: string;
  communication_method: string;
  dispute_resolution: string;
  confidentiality: boolean;
  termination_clause: string;
  special_conditions: string;
  skills: SkillItem[];
  from_user_accepted: boolean;
  to_user_accepted: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ViewAgreementPage() {
  const router = useRouter();
  const params = useParams();
  const agreementId = params.agreementId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isRecipient, setIsRecipient] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          await fetchAgreement(agreementId, userData.username);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (agreementId) {
      fetchData();
    }
  }, [agreementId, router]);

  const fetchAgreement = async (swopId: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agreements/${swopId}`);
      const data = await response.json();

      if (data.success) {
        const agreementData = data.agreement;
        setAgreement(agreementData);
        
        // Check if current user is creator or recipient
        setIsCreator(agreementData.from_user === username);
        setIsRecipient(agreementData.to_user === username);
      } else {
        console.error('Failed to fetch agreement:', data.message);
        router.push('/agreement');
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      router.push('/agreement');
    }
  };

  const handleAcceptAgreement = async () => {
    if (!user || !agreement) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agreements/${agreement.swop_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
            icon: "success",
            title: "Success",
            text: "Agreement accepted successfully!"
        })
        setShowAcceptModal(false);
        // Refresh agreement data
        await fetchAgreement(agreementId, user.username);
      } else {
        Swal.fire({
            icon: "error",
            title: "Oops!",
            text: `Failed to accept agreement: ${data.message}`
        })
      }
    } catch (error) {
      console.error('Error accepting agreement:', error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: 'An error occurred while accepting the agreement.'
    })
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineAgreement = async (reason: string) => {
    if (!user || !agreement) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agreements/${agreement.swop_id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          reason: reason
        }),
      });

      const data = await response.json();

      if (data.success) {

        Swal.fire({
            icon: "success",
            title: "Success",
            text: "Agreement declined successfully!"
        })
        setShowDeclineModal(false);
        // Refresh agreement data
        await fetchAgreement(agreementId, user.username);
      } else {
        Swal.fire({
            icon: "error",
            title: "Oops!",
            text: `Failed to decline agreement: ${data.message}`
        })
        
      }
    } catch (error) {
      console.error('Error declining agreement:', error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: 'An error occurred while declining the agreement.'
    })
   
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'active':
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
      case 'declined':
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canAcceptOrDecline = () => {
    return isRecipient && 
           agreement?.agreement_status === 'pending' && 
           !agreement.to_user_accepted;
  };

  const isAgreementActive = () => {
    return agreement?.agreement_status === 'accepted' || 
           agreement?.agreement_status === 'active';
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

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={user} />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agreement Not Found</h2>
            <p className="text-gray-600 mb-4">The requested agreement could not be found.</p>
            <button 
              onClick={() => router.push('/agreement')}
              className="bg-purple-600 text-yellow-400 px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200 cursor-pointer"
            >
              Back to Agreements
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
              <button 
                onClick={() => router.push('/agreement')}
                className="text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Agreements
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">View Agreement</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{agreement.agreement_title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-purple-100">
                  <div className="flex items-center">
                    <User size={16} className="mr-1" />
                    <span>Between {agreement.from_user} and {agreement.to_user}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span>Created {formatDate(agreement.created_at)}</span>
                  </div>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="mt-4 md:mt-0 flex flex-col items-end space-y-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.agreement_status)}`}>
                  {getStatusIcon(agreement.agreement_status)}
                  <span className="ml-1 capitalize">{agreement.agreement_status}</span>
                </div>
                
                {canAcceptOrDecline() && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAcceptModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center cursor-pointer"
                    >
                      <Check size={16} className="mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center cursor-pointer"
                    >
                      <X size={16} className="mr-2" />
                      Decline
                    </button>
                  </div>
                )}

                {isAgreementActive() && (
                  <button
                    onClick={() => router.push(`/messages?user=${isCreator ? agreement.to_user : agreement.from_user}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center cursor-pointer"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Message Partner
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Skills Section */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <Target size={20} className="mr-2 text-purple-600" />
                    Skills to be Exchanged
                  </h2>

                  <div className="space-y-6">
                    {agreement.skills.map((skill, index) => (
                      <div key={skill.id} className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Skill Exchange {index + 1}: {skill.skillName}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <p className="text-gray-600">{skill.skillDescription}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <p className="text-gray-600">{skill.duration}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Time Commitment
                            </label>
                            <p className="text-gray-600">{skill.timeCommitment}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <p className="text-gray-600">
                              {skill.startDate ? formatDate(skill.startDate) : 'To be determined'}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Completion Criteria
                            </label>
                            <p className="text-gray-600">{skill.completionCriteria}</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specific Deliverables
                          </label>
                          <ul className="space-y-2">
                            {skill.deliverables.map((deliverable, deliverableIndex) => (
                              <li key={deliverableIndex} className="flex items-start">
                                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <FileText size={20} className="mr-2 text-purple-600" />
                    Terms & Conditions
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        General Terms
                      </label>
                      <p className="text-gray-600 whitespace-pre-line">{agreement.terms}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MapPin size={16} className="mr-1" />
                          Meeting Location
                        </label>
                        <p className="text-gray-600">{agreement.meeting_location}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MessageCircle size={16} className="mr-1" />
                          Communication Method
                        </label>
                        <p className="text-gray-600">{agreement.communication_method}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Shield size={16} className="mr-1" />
                        Dispute Resolution
                      </label>
                      <p className="text-gray-600">{agreement.dispute_resolution}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Termination Clause
                      </label>
                      <p className="text-gray-600">{agreement.termination_clause}</p>
                    </div>

                    {agreement.special_conditions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Conditions
                        </label>
                        <p className="text-gray-600 whitespace-pre-line">{agreement.special_conditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Agreement Details */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FileText size={18} className="mr-2 text-purple-600" />
                    Agreement Details
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agreement ID
                      </label>
                      <p className="text-sm text-gray-600 font-mono">{agreement.swop_id}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <p className="text-sm text-gray-600 capitalize">
                        {agreement.agreement_type.replace('_', ' ')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <p className="text-sm text-gray-600">{formatDate(agreement.created_at)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-600">{formatDate(agreement.updated_at)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeline
                      </label>
                      <p className="text-sm text-gray-600">{agreement.timeline_days} days</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confidentiality
                      </label>
                      <p className="text-sm text-gray-600">
                        {agreement.confidentiality ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Users size={18} className="mr-2 text-purple-600" />
                    Parties Involved
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agreement Creator
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="text-purple-600" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{agreement.from_user}</p>
                          <p className="text-sm text-gray-500">Creator</p>
                        </div>
                        {agreement.from_user_accepted && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agreement Recipient
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="text-blue-600" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{agreement.to_user}</p>
                          <p className="text-sm text-gray-500">Recipient</p>
                        </div>
                        {agreement.to_user_accepted && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                {agreement.agreement_status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-2">Pending Acceptance</h4>
                        <p className="text-yellow-700 text-sm">
                          {isCreator 
                            ? `Waiting for ${agreement.to_user} to accept this agreement`
                            : 'Please review and accept or decline this agreement'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isAgreementActive() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800 mb-2">Agreement Active</h4>
                        <p className="text-green-700 text-sm">
                          This agreement is now active. You can start the skill exchange process.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-600" />
              Accept Agreement
            </h3>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to accept this skill swap agreement? 
              Once accepted, both parties are expected to fulfill their commitments.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptAgreement}
                disabled={actionLoading}
                className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition duration-200 flex items-center"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Accept Agreement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <DeclineModal
          onClose={() => setShowDeclineModal(false)}
          onDecline={handleDeclineAgreement}
          loading={actionLoading}
        />
      )}

      <Footer />
    </div>
  );
}

// Decline Modal Component
function DeclineModal({ onClose, onDecline, loading }: { 
  onClose: () => void; 
  onDecline: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onDecline(reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <XCircle size={20} className="mr-2 text-red-600" />
          Decline Agreement
        </h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for declining (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for declining this agreement..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition duration-200 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Declining...
              </>
            ) : (
              <>
                <X size={16} className="mr-2" />
                Decline Agreement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}