// app/verify/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          setMessage(data.message);
          
          // Show success alert
          Swal.fire({
            icon: 'success',
            title: 'Email Verified!',
            text: data.message,
            confirmButtonColor: '#6b21a8',
            timer: 3000,
            timerProgressBar: true,
          }).then(() => {
            // Redirect to login page after successful verification
            router.push('/');
          });
        } else {
          setVerificationStatus('error');
          setMessage(data.message);
          
          Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: data.message,
            confirmButtonColor: '#d33',
          });
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        
        Swal.fire({
          icon: 'error',
          title: 'Verification Error',
          text: 'An error occurred during verification. Please try again.',
          confirmButtonColor: '#d33',
        });
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendVerification = async () => {
    // You can implement resend verification logic here if needed
    Swal.fire({
      icon: 'info',
      title: 'Resend Verification',
      text: 'Please contact support or try signing up again if you need a new verification link.',
      confirmButtonColor: '#6b21a8',
    });
  };

  const handleGoToLogin = () => {
    router.push('/');
  };

  const handleGoToSignup = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" 
         style={{ backgroundImage: "url('/images/page-title.jpg')" }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/logo.png" 
              alt="LetSwap Logo" 
              className="w-1/2"
            />
          </div>

          <div className="mb-6">
            {verificationStatus === 'loading' && (
              <Loader className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            )}
            {verificationStatus === 'error' && (
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            )}
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {verificationStatus === 'loading' && 'Verifying Email...'}
              {verificationStatus === 'success' && 'Email Verified!'}
              {verificationStatus === 'error' && 'Verification Failed'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {verificationStatus === 'loading' && 'Please wait while we verify your email address...'}
              {verificationStatus === 'success' && message}
              {verificationStatus === 'error' && message}
            </p>
          </div>

          {verificationStatus === 'loading' && (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <button
                onClick={handleGoToLogin}
                className="w-full bg-purple-600 text-yellow-400 py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Go to Login
              </button>
              <p className="text-sm text-gray-500">
                You will be automatically redirected to the login page in a few seconds...
              </p>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Resend Verification Email
              </button>
              
              <button
                onClick={handleGoToSignup}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Create New Account
              </button>
              
              <button
                onClick={handleGoToLogin}
                className="w-full border border-purple-600 text-purple-600 py-3 px-4 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Support information */}
          {verificationStatus === 'error' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@letswap.com" className="text-purple-600 hover:underline">
                  support@letswap.com
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}