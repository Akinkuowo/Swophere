
export default function PopularLocation() {
    return (
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
    )
} 
