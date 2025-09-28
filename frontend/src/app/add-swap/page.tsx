// app/add-swap/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Footer from '../components/footer';
import { Upload, MapPin, Tag, List, DollarSign } from 'lucide-react';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface SwapFormData {
  listing_title: string;
  category: string;
  country: string;
  city: string;
  description: string;
  amount: string;
  currency: string;
  image: File | null;
}

interface FormErrors {
    listing_title?: string;
    category?: string;
    country?: string;
    city?: string;
    description?: string;
    amount?: string;
    currency?: string;
    image?: string;
  }

const API_BASE_URL = 'http://localhost:4000';

const categories = [
  'Goods & Items',
  'Commodities',
  'Services',
  'Handiwork',
  'Technology & IT',
  'Business',
  'Trainings'
];

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

const currencies = [
  { value: 'NG', symbol: '₦', name: 'Naira' },
  { value: 'dollar', symbol: '$', name: 'US Dollar' },
  { value: 'euro', symbol: '€', name: 'Euro' },
  { value: 'yen', symbol: '¥', name: 'Yen' }
];

export default function CreateSwap() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SwapFormData>({
    listing_title: '',
    category: '',
    country: '',
    city: '',
    description: '',
    amount: '',
    currency: 'NG',
    image: null
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof SwapFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Please select an image file',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image smaller than 5MB',
        });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.listing_title.trim()) newErrors.listing_title = 'Swap title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount.trim()) newErrors.amount = 'Interested swop details are required';
    if (!formData.image) newErrors.image = 'Image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSwapId = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `SH_${randomPart}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('listing_title', formData.listing_title.toUpperCase());
      submitData.append('category', formData.category);
      submitData.append('country', formData.country);
      submitData.append('city', formData.city);
      submitData.append('description', formData.description);
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency);
      submitData.append('username', user?.username || '');
      submitData.append('user_id', user?.userId || '');
      submitData.append('listing_id', generateSwapId());
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await fetch(`${API_BASE_URL}/api/swaps/create`, {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create swap');
      }

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Swap Created Successfully!',
          text: 'Congrats! Your swap has been created and is pending approval.',
          confirmButtonColor: '#6b21a8',
        }).then(() => {
          router.push('/dashboard');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message,
          confirmButtonColor: '#d33',
        });
      }
    } catch (error: any) {
      console.error('Create swap error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while creating the swap',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
              <h1 className="text-3xl font-bold mb-4 md:mb-0">Add Swap</h1>
              <nav className="text-sm">
                <ol className="flex items-center space-x-2">
                  <li><a href="/dashboard" className="hover:text-yellow-300">Home</a></li>
                  <li className="before:content-['/'] before:mx-2">Add Swap</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Categories Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Tag className="text-purple-600 mr-2" size={24} />
                    <h3 className="text-xl font-semibold">Categories</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Swap Title *
                      </label>
                      <input
                        type="text"
                        name="listing_title"
                        value={formData.listing_title}
                        onChange={handleInputChange}
                        placeholder="Enter swap title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      {errors.listing_title && (
                        <p className="text-red-500 text-sm mt-1">{errors.listing_title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Swap Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <MapPin className="text-purple-600 mr-2" size={24} />
                    <h3 className="text-xl font-semibold">Location</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City/State *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city or state"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Upload className="text-purple-600 mr-2" size={24} />
                    <h3 className="text-xl font-semibold">Image</h3>
                  </div>
                  
                  <div className="text-center">
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-600 transition duration-200 block"
                    >
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                          <p className="text-green-600">Image selected. Click to change.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Upload className="text-gray-400" size={32} />
                          </div>
                          <p className="text-gray-600">Click to upload swap image</p>
                          <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {errors.image && (
                      <p className="text-red-500 text-sm mt-2">{errors.image}</p>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <List className="text-purple-600 mr-2" size={24} />
                    <h3 className="text-xl font-semibold">Swap Description</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe your swap in detail..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Interested Swops Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <DollarSign className="text-purple-600 mr-2" size={24} />
                    <h3 className="text-xl font-semibold">Interested Swops</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What are you looking to swap for? *
                    </label>
                    <textarea
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Enter details of what you're interested in swapping for..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer bg-purple-600 text-yellow-400 px-8 py-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400 mr-2"></div>
                        Creating Swap...
                      </span>
                    ) : (
                      'Create Swap'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}