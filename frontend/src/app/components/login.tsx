// components/LoginForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('session_token', data.session.token);
        localStorage.setItem('session_expires', data.session.expiresAt);
        localStorage.setItem('last_login_stamp', Date.now().toString());
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome back!',
          confirmButtonColor: '#6b21a8',
        }).then(() => {
          // Redirect to dashboard
          router.push(`/dashboard?userId=${data.user.userId}`);
        });
      } else {
        setError(data.message);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message,
          confirmButtonColor: '#d33',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message || 'An error occurred during login',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" 
         style={{ backgroundImage: "url('/images/page-title.jpg')" }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center mb-6">
              <img 
                src="/images/logo.png" 
                alt="LetSwap Logo" 
                className="w-1/2"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email Address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Your Password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-purple-600 text-yellow-400 py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging In...
                </span>
              ) : (
                'Log In'
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="text-yellow-600 hover:underline font-medium">
                  Sign Up Here!
                </a>
              </p>
            </div>

            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600">
                Forgot your password?{' '}
                <a href="/forgot-password" className="text-yellow-600 hover:underline">
                  Reset It Here!
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}