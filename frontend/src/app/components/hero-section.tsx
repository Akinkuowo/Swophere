
export default function HeroSection() {
    return(
        <div 
          className="bg-cover bg-center py-20"
          style={{ backgroundImage: "url('/images/city_search_background.jpg')" }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Swop Your <span className="text-yellow-400">Skills</span></h2>
              <h4 className="text-xl mb-8">Find some of the best skills and swop with your own skill.</h4>
              
              <div className="bg-white rounded-lg p-4 shadow-lg max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input 
                      type="text" 
                      placeholder="What are you looking for?" 
                      className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  
                  <div>
                    <select className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:ring-purple-600">
                      <option value="">Select Location</option>
                      <option value="USA">USA</option>
                            <option value="CAN">Canada</option>
                            <option value="MEX">Mexico</option>
                            <option value="JAM">Jamaica</option>
                            <option value="AUS">Australia</option>
                            <option value="NZL">New Zealand</option>
                            <option value="NG">Nigeria</option>
                            <option value="GH">Ghana</option>
                            <option value="SAF">South Africa</option>
                            <option value="KEN">Kenya</option>
                            <option value="ETH">Ethiopia</option>
                            <option value="EGP">Egypt</option>
                            <option value="CHA">China</option>
                            <option value="IND">India</option>
                            <option value="UK">UK</option>
                            <option value="NTL">Netherlands</option>
                            <option value="ITA">Italy</option>
                            <option value="GER">Germany</option>
                            <option value="FR">France</option>
                            <option value="GRE">Greece</option>
                            <option value="POL">Poland</option>
                            <option value="FIN">Finland</option>
                            <option value="AST">Austria</option>
                            <option value="DEN">Denmark</option>
                            <option value="SWE">Sweden</option>
                            <option value="RUS">Russia</option>
                            <option value="JAP">Japan</option>
                            <option value="PHI">Philippines</option>
                            <option value="SIN">Singapore</option>
                            <option value="IND">Indonesia</option>
                            <option value="THAI">Thailand</option>
                            <option value="ISR">Israel</option>
                            <option value="Hong Kong">Hong Kong</option>
                            <option value="SAU">Saudi Arabia</option>
                            <option value="Kuwait">Kuwait</option>
                            <option value="BRA">Brazil</option>
                            <option value="ARG">Argentina</option>
                            <option value="COL">Columbia</option>
                            <option value="CHI">Chile</option>
                            <option value="Peru">Peru</option>
                            <option value="URG">Uruguay</option>
                            <option value="MOR">Morocco</option>
                            <option value="SEN">Senegal</option>
                            <option value="TUN">Tunisia</option>
                            <option value="Cameroon">Cameroon</option>
                            <option value="Zambia">Zambia</option>
                            <option value="Zimbabwe">Zimbabwe</option>
                            <option value="Benin">Benin</option>
                    </select>
                  </div>
                  
                  <div>
                    <select className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600">
                      <option value="goods">Goods & Items</option>
                      <option value="commodities">Commodities</option>
                      <option value="services">Services</option>
                      <option value="handiwork">Handiwork</option>
                      <option value="IT">Technology & IT</option>
                      <option value="business">Business</option>
                      <option value="Trainings">Trainings</option>
                    </select>
                  </div>
                </div>
                
                <button className="bg-yellow-400 text-white px-8 py-3 rounded-md hover:bg-purple-700 mt-4 font-medium">
                  Search
                </button>
              </div>

              {/* Popular Categories */}
              <div className="mt-8">
                <h3 className="text-white mb-4">Or Browse Popular Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                  {[
                    { icon: '💻', name: 'IT' },
                    { icon: '🔧', name: 'Handiwork' },
                    { icon: '💼', name: 'Business' },
                    { icon: '📦', name: 'Goods & Items' },
                    { icon: '🎓', name: 'Training' },
                    { icon: '📚', name: 'Commodities' }
                  ].map((category, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition duration-200 cursor-pointer">
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <p className="text-sm text-black">{category.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    )
}