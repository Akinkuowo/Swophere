import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function TrendingSwops (){
    const [trendingSwaps, setTrendingSwaps] = useState<Swap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTreadingSwop = async () => {
            try{
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
                    })
                };
            }catch (error){
                console.error('Error fetching data:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load dashboard data',
                });
            }finally{
                setLoading(false)
            }
        }

        fetchTreadingSwop();
    }, [])

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

    return(
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
                      {/* <span className="text-purple-600 font-bold">
                        {swap.currency === 'NG' ? '₦' : 
                         swap.currency === 'dollar' ? '$' : 
                         swap.currency === 'euro' ? '€' : 
                         swap.currency === 'yen' ? '¥' : '$'}
                        {swap.amount}
                      </span> */}
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
                      className="cursor-pointer w-full bg-purple-600 text-yellow-400 py-2 rounded-md hover:bg-purple-700 transition duration-200 font-medium"
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
    )
}