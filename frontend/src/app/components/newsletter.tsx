
export default function NewsLetter() {
    return(
        <section className="bg-purple-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Subscribe to Newsletter!</h2>
              <p className="text-purple-200 mb-6">
                Subscribe to get latest updates and information.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="border border-white flex-1 px-4 py-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button className="bg-yellow-400 text-purple-600 px-6 py-3 rounded-md hover:bg-yellow-300 font-medium cursor-pointer">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
    )
}