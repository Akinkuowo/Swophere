// src/app/messages/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Menu from '../components/menu';
import Footer from '../components/footer';
import { 
  MessageCircle, 
  User, 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  ArrowLeft,
  MapPin,
  Calendar,
  Plus,
  Star,
  FileText,
  Eye
} from 'lucide-react';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface MessageThread {
  id: string;
  otherUser: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  userAvatar?: string;
}

interface Message {
  id: string;
  fromUser: string;
  toUser: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface SwapOwnerInfo {
  username: string;
  firstName: string;
  lastName: string;
  userId: string;
}

interface Agreement {
  id: string;
  status: string;
  createdBy: string;
  otherParty: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUser = searchParams.get('user');
  const swapOwnerParam = selectedUser;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [swapOwnerInfo, setSwapOwnerInfo] = useState<SwapOwnerInfo | null>(null);
  const [userSwaps, setUserSwaps] = useState<any[]>([]);
  const [hasSwapsWithOtherUser, setHasSwapsWithOtherUser] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<Agreement | null>(null);
  const [checkingAgreement, setCheckingAgreement] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          await fetchMessageThreads(userData.username);
          await fetchUserSwaps(userData.userId);
        
          if (swapOwnerParam) {
            try {
              const swapOwnerData = swapOwnerParam;
              setSwapOwnerInfo(swapOwnerData);
              
              setTimeout(async () => {
                setMessageThreads(prevThreads => {
                  const existingThread = prevThreads.find(t => t.otherUser === swapOwnerData);
                  
                  if (existingThread) {
                    setSelectedThread(existingThread);
                    setIsNewConversation(false);
                    fetchMessages(swapOwnerData);
                    return prevThreads;
                  } else {
                    const swapOwnerThread: MessageThread = {
                      id: `swap-owner-${swapOwnerData}`,
                      otherUser: swapOwnerData,
                      lastMessage: 'Start conversation about swap...',
                      timestamp: new Date().toISOString(),
                      unread: false
                    };
                    
                    setSelectedThread(swapOwnerThread);
                    setIsNewConversation(true);
                    setMessages([]);
                    
                    return [swapOwnerThread, ...prevThreads];
                  }
                });
              }, 100);
            } catch (error) {
              console.error('Error parsing swap owner data:', error);
            }
          }
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
  }, [router, swapOwnerParam]);

  useEffect(() => {
    if (selectedThread && user) {
      checkUserSwapsWithOtherUser();
      checkExistingAgreement();
    }
  }, [selectedThread, user, userSwaps]);

  useEffect(() => {
    if (selectedUser && user && messageThreads.length > 0 && !swapOwnerParam) {
      handleUserSelection(selectedUser);
    }
  }, [selectedUser, user, messageThreads, swapOwnerParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserSwaps = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/swaps/user/${userId}?status=ACCEPTED`);
      const data = await response.json();

      if (data.success) {
        setUserSwaps(data.swaps);
      }
    } catch (error) {
      console.error('Error fetching user swaps:', error);
    }
  };

  const checkUserSwapsWithOtherUser = () => {
    const hasAcceptedSwaps = userSwaps.length > 0;
    setHasSwapsWithOtherUser(hasAcceptedSwaps);
  };

  const checkExistingAgreement = async () => {
    if (!user || !selectedThread) return;
    
    setCheckingAgreement(true);
    try {
      // Check for agreements where current user is either creator or other party
      const response = await fetch(
        `${API_BASE_URL}/api/agreements/check?user1=${user.username}&user2=${selectedThread.otherUser}`
      );
      const data = await response.json();

      if (data.success && data.agreement) {
        setExistingAgreement(data.agreement);
      } else {
        setExistingAgreement(null);
      }
    } catch (error) {
      console.error('Error checking existing agreement:', error);
      setExistingAgreement(null);
    } finally {
      setCheckingAgreement(false);
    }
  };

  const fetchMessageThreads = async (username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/threads/${username}`);
      const data = await response.json();

      if (data.success) {
        setMessageThreads(data.threads);
      } else {
        console.error('Failed to fetch message threads:', data.message);
      }
    } catch (error) {
      console.error('Error fetching message threads:', error);
    }
  };

  const handleUserSelection = async (username: string) => {
    const existingThread = messageThreads.find(t => t.otherUser === username);
    
    if (existingThread) {
      setSelectedThread(existingThread);
      setIsNewConversation(false);
      await fetchMessages(username);
    } else {
      const newThread: MessageThread = {
        id: `new-${username}`,
        otherUser: username,
        lastMessage: 'Start a new conversation...',
        timestamp: new Date().toISOString(),
        unread: false
      };
      setSelectedThread(newThread);
      setIsNewConversation(true);
      setMessages([]);
    }
  };

  const fetchMessages = async (otherUser: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${user.username}/${otherUser}`
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        
        if (data.messages.length > 0) {
          await markMessagesAsRead(user.username, otherUser);
        }
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (username: string, otherUser: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/messages/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          otherUser,
        }),
      });

      setMessageThreads(prev =>
        prev.map(thread =>
          thread.otherUser === otherUser ? { ...thread, unread: false } : thread
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendFirstMessage = async (message: string) => {
    if (!user || !selectedThread) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUser: user.username,
          toUser: selectedThread.otherUser,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchMessageThreads(user.username);
        await fetchMessages(selectedThread.otherUser);
        setIsNewConversation(false);
        return true;
      } else {
        console.error('Failed to send message:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !user) return;

    setSending(true);
    
    try {
      let success;
      
      if (isNewConversation) {
        success = await sendFirstMessage(newMessage);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromUser: user.username,
            toUser: selectedThread.otherUser,
            message: newMessage.trim(),
          }),
        });

        const data = await response.json();
        success = data.success;

        if (success) {
          await fetchMessages(selectedThread.otherUser);
          await fetchMessageThreads(user.username);
        }
      }

      if (success) {
        setNewMessage('');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while sending the message.');
    } finally {
      setSending(false);
    }
  };

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    setIsNewConversation(thread.id.startsWith('swap-owner-') || thread.id.startsWith('new-'));
    
    if (!thread.id.startsWith('swap-owner-') && !thread.id.startsWith('new-')) {
      fetchMessages(thread.otherUser);
    } else {
      setMessages([]);
    }
  };

  const startNewConversation = () => {
    const username = prompt('Enter the username you want to message:');
    if (username && user && username !== user.username) {
      handleUserSelection(username);
    } else if (username === user?.username) {
      alert('You cannot message yourself.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredThreads = messageThreads.filter(thread =>
    thread.otherUser?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCreateAgreement = () => {
    if (!selectedThread) return;
    router.push(`/agreement?otherUser=${selectedThread.otherUser}`);
  };

  const handleViewAgreement = () => {
    if (!existingAgreement) return;
    router.push(`/agreement/${existingAgreement.id}`);
  };

  const getAgreementStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      ACCEPTED: { color: 'bg-green-100 text-green-800', text: 'Accepted' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const isSwapOwnerThread = selectedThread && swapOwnerInfo && 
    selectedThread.otherUser === swapOwnerInfo.username;

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
              <span className="text-gray-600">Messages</span>
              {swapOwnerInfo && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-purple-600">Contact {swapOwnerInfo.firstName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex h-[600px]">
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                      <button
                        onClick={startNewConversation}
                        className="bg-purple-600 text-yellow-400 p-2 rounded-lg hover:bg-purple-700 transition duration-200 cursor-pointer"
                        title="Start new conversation"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length === 0 && !searchTerm ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No conversations yet</p>
                        <p className="text-sm mt-2">Start a conversation by contacting a swoper!</p>
                        <button
                          onClick={startNewConversation}
                          className="mt-4 bg-purple-600 text-yellow-400 px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200 cursor-pointer"
                        >
                          Start New Conversation
                        </button>
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredThreads.map((thread) => {
                          const isSwapOwner = swapOwnerInfo && thread.otherUser === swapOwnerInfo.username;
                          return (
                            <button
                              key={thread.id}
                              onClick={() => handleThreadSelect(thread)}
                              className={`w-full text-left p-3 rounded-lg transition duration-200 mb-2 ${
                                selectedThread?.otherUser === thread.otherUser
                                  ? 'bg-purple-100 border border-purple-200'
                                  : 'hover:bg-gray-50'
                              } ${isSwapOwner ? 'border-l-4 border-l-yellow-400' : ''}`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    isSwapOwner ? 'bg-yellow-100' : 'bg-purple-100'
                                  }`}>
                                    <User className={isSwapOwner ? 'text-yellow-600' : 'text-purple-600'} size={20} />
                                  </div>
                                  {thread.unread && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  )}
                                  {isSwapOwner && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                      <Star size={8} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center flex-wrap gap-1">
                                      <h5 className="font-semibold text-gray-800 truncate">
                                        {isSwapOwner ? swapOwnerInfo.firstName : `${thread.otherUser}`}
                                      </h5>
                                      {isSwapOwner && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full whitespace-nowrap">
                                          Swap Owner
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                      {formatTimestamp(thread.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 truncate">
                                    {thread.lastMessage}
                                  </p>
                                  {thread.unread && (
                                    <span className="inline-block mt-1 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                                      New messages
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  {selectedThread ? (
                    <>
                      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSwapOwnerThread ? 'bg-yellow-100' : 'bg-purple-100'
                          }`}>
                            <User className={isSwapOwnerThread ? 'text-yellow-600' : 'text-purple-600'} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-800">
                                {isSwapOwnerThread && swapOwnerInfo 
                                  ? `${swapOwnerInfo.firstName} ${swapOwnerInfo.lastName}`
                                  : `${selectedThread.otherUser}`
                                }
                              </h3>
                              {isSwapOwnerThread && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Swap Owner
                                </span>
                              )}
                              {isNewConversation && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                  New
                                </span>
                              )}
                              {existingAgreement && getAgreementStatusBadge(existingAgreement.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {isNewConversation 
                                ? (isSwapOwnerThread ? 'Contact about their swap listing' : 'Start a new conversation')
                                : 'Online'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasSwapsWithOtherUser && !isNewConversation && (
                            <>
                              {checkingAgreement ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                  <span className="text-sm">Checking...</span>
                                </div>
                              ) : existingAgreement ? (
                                <button 
                                  onClick={handleViewAgreement}
                                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium text-sm cursor-pointer flex items-center space-x-2"
                                  title="View existing agreement"
                                >
                                  <Eye size={16} />
                                  <span>View Agreement</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={handleCreateAgreement}
                                  className="bg-purple-600 text-yellow-400 px-3 py-2 rounded-lg hover:bg-purple-700 transition duration-200 font-medium text-sm cursor-pointer flex items-center space-x-2"
                                  title="Create a swap agreement with this user"
                                >
                                  <FileText size={16} />
                                  <span>Create Agreement</span>
                                </button>
                              )}
                            </>
                          )}
                          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && !isNewConversation ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No messages yet in this conversation</p>
                            <p className="text-sm mt-2">Start the conversation about potential swaps!</p>
                          </div>
                        ) : messages.length === 0 && isNewConversation ? (
                          <div className="text-center py-8 text-gray-500">
                            <Plus size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>
                              {isSwapOwnerThread && swapOwnerInfo
                                ? `Start a conversation with ${swapOwnerInfo.firstName} about their swap`
                                : `Start a new conversation with ${selectedThread.otherUser}`
                              }
                            </p>
                            <p className="text-sm mt-2">
                              {isSwapOwnerThread 
                                ? 'Send them a message to discuss their swap listing!'
                                : 'Send your first message to begin chatting about swaps!'
                              }
                            </p>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            const isCurrentUser = message.fromUser === user?.username;
                            const showDate = index === 0 || 
                              new Date(message.timestamp).toDateString() !== 
                              new Date(messages[index - 1].timestamp).toDateString();

                            return (
                              <div key={message.id}>
                                {showDate && (
                                  <div className="text-center my-4">
                                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                      {formatMessageDate(message.timestamp)}
                                    </span>
                                  </div>
                                )}
                                
                                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                      isCurrentUser
                                        ? 'bg-purple-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}
                                  >
                                    <p className="text-sm">{message.message}</p>
                                    <p
                                      className={`text-xs mt-1 ${
                                        isCurrentUser
                                          ? 'text-purple-200'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {formatMessageTime(message.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-purple-600 cursor-pointer transition duration-200"
                            title="Attach file"
                          >
                            <Paperclip size={20} />
                          </button>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder={
                                isSwapOwnerThread && isNewConversation
                                  ? `Message ${swapOwnerInfo?.firstName} about their swap...`
                                  : isNewConversation 
                                    ? `Send your first message to ${selectedThread.otherUser}...` 
                                    : "Type your message about the swap..."
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              disabled={sending}
                            />
                            {sending && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleSendMessage(e as any)}
                            disabled={!newMessage.trim() || sending}
                            className="bg-purple-600 text-yellow-400 px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition duration-200 flex items-center"
                          >
                            <Send size={18} className="mr-2" />
                            {isNewConversation ? 'Start Chat' : 'Send'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                      <div className="text-center">
                        <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Conversation Selected</h3>
                        <p className="text-gray-500 mb-4">Choose a conversation from the list or start a new one</p>
                        <button
                          onClick={startNewConversation}
                          className="bg-purple-600 text-yellow-400 px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200 font-medium cursor-pointer mr-2"
                        >
                          Start New Conversation
                        </button>
                        <button
                          onClick={() => router.push('/swaps')}
                          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200 font-medium cursor-pointer"
                        >
                          Browse Swaps
                        </button>
                      </div>
                    </div>
                  )}
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