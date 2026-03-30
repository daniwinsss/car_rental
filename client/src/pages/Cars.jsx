import React, { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CarCard from '../components/CarCard'
import MapComponent from '../components/MapComponent'
import { useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Cars = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get('pickupLocation');
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');

  const { cars, axios, toast } = useAppContext();
  const [input, setInput] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  
  // Advanced filters state
  const [category, setCategory] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [seats, setSeats] = useState('');
  const [maxPrice, setMaxPrice] = useState(2000);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('newest');

  const isSearchData = pickupLocation && pickupDate && returnDate;

  // Filter options derived from data
  const categories = [...new Set(cars.map(c => c.category))].filter(Boolean);
  const transmissions = [...new Set(cars.map(c => c.transmission))].filter(Boolean);
  const fuelTypes = [...new Set(cars.map(c => c.fuel_type))].filter(Boolean);
  const seatOptions = [...new Set(cars.map(c => c.seating_capacity))].filter(Boolean).sort((a,b) => a-b);
  
  // Auto-adjust max price based on data
  useEffect(() => {
    if (cars.length > 0) {
      const highest = Math.max(...cars.map(c => c.pricePerDay));
      if (highest > maxPrice) setMaxPrice(Math.ceil(highest / 100) * 100);
    }
  }, [cars, maxPrice]);

  // Main Filter and Sort Function
  const applyFiltersAndSort = (sourceCars) => {
    let result = sourceCars.slice();

    // 1. Text Search
    if (input) {
      const q = input.toLowerCase();
      result = result.filter(car => 
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.category.toLowerCase().includes(q) ||
        car.transmission.toLowerCase().includes(q)
      );
    }

    // 2. Advanced Filters
    if (category) result = result.filter(car => car.category === category);
    if (transmission) result = result.filter(car => car.transmission === transmission);
    if (fuelType) result = result.filter(car => car.fuel_type === fuelType);
    if (seats) result = result.filter(car => car.seating_capacity === Number(seats));
    result = result.filter(car => car.pricePerDay <= maxPrice);

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      // default "newest"
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredCars(result);
  };

  const searchCarAvailability = async () => {
    try {
      const { data } = await axios.post('/api/bookings/check-availability', {
        location: pickupLocation,
        pickupDate,
        returnDate
      });
      if (data.success) {
        applyFiltersAndSort(data.availableCars);
        if (data.availableCars.length === 0) {
          toast.error("No cars available for these dates");
        }
      }
    } catch (error) {
      toast.error('Error finding available cars');
    }
  };

  useEffect(() => {
    if (isSearchData) {
      searchCarAvailability();
    } else {
      if (cars.length > 0) {
        applyFiltersAndSort(cars);
      }
    }
  }, [input, category, transmission, fuelType, seats, maxPrice, sortBy, cars]);

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen">
      <div className='flex flex-col items-center py-6 bg-white border-b border-gray-100 max-md:px-4'>
        <Title
          title='Available Cars'
          subTitle='Find your perfect ride by filtering through our collection'
        />
        <div className='flex items-center bg-white border border-gray-200 px-4 mt-4 max-w-3xl w-full h-12 rounded-full shadow-sm hover:shadow-md transition-shadow'>
          <img src={assets.search_icon} alt="search" className='w-4 h-4 mr-3 text-gray-400'/>
          <input 
            onChange={(e) => setInput(e.target.value)} 
            value={input} 
            type="text" 
            placeholder='Search by make, model or features...'
            className='w-full h-full outline-none text-gray-700 bg-transparent text-sm pb-0.5'
          />
        </div>
      </div>
      
      {/* Main Split Screen Container */}
      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: "calc(100vh - 180px)" }}>
        
        {/* Left Side: Filters and Listings */}
        <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col h-full bg-white border-r border-gray-200 shadow-sm z-10 relative">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
            <div className="flex flex-wrap gap-2 items-center text-xs sm:text-sm mb-3">
              <select className="border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none hover:bg-gray-50 transition-colors" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              
              <select className="border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none hover:bg-gray-50 transition-colors" value={transmission} onChange={e => setTransmission(e.target.value)}>
                <option value="">Transmissions</option>
                {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select className="border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none hover:bg-gray-50 transition-colors" value={fuelType} onChange={e => setFuelType(e.target.value)}>
                <option value="">Fuel types</option>
                {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              <select className="border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none hover:bg-gray-50 transition-colors" value={seats} onChange={e => setSeats(e.target.value)}>
                <option value="">Seats</option>
                {seatOptions.map(s => <option key={s} value={s}>{s} Seats</option>)}
              </select>
              
              {(category || transmission || fuelType || seats) && (
                <button 
                  onClick={() => { setCategory(''); setTransmission(''); setFuelType(''); setSeats(''); }}
                  className="text-gray-400 hover:text-red-500 underline ml-auto text-xs font-medium"
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              <div className="flex flex-col flex-1 w-full sm:w-auto">
                <div className="flex justify-between w-full">
                  <label className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wider">Max Price</label>
                  <span className="text-xs font-bold text-primary">${maxPrice}/day</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2000" 
                  step="50" 
                  value={maxPrice} 
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">Sort by:</label>
                <select 
                  className="font-medium bg-white border border-gray-200 rounded-lg p-1.5 px-3 focus:ring-2 focus:ring-primary/20 outline-none text-sm text-gray-700 shadow-sm w-full sm:w-auto" 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30 w-full scroll-smooth custom-scrollbar">
            <h3 className='text-sm text-gray-800 mb-4 font-bold tracking-tight'>
              {filteredCars.length} {filteredCars.length === 1 ? 'CAR' : 'CARS'} FOUND
            </h3>
            {filteredCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium mb-1">No cars found matching your filters.</p>
                <p className="text-gray-400 text-sm mb-4">Try widening your search criteria.</p>
                <button 
                  onClick={() => {
                    setCategory(''); setTransmission(''); setFuelType(''); 
                    setSeats(''); setInput(''); setMaxPrice(2000);
                  }}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 xl:gap-6 pb-20'>
                {filteredCars.map((car, index) => (
                   <CarCard key={car._id || index} car={car} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="w-full lg:w-[45%] xl:w-[40%]" style={{ height: '600px', minHeight: '400px', position: 'sticky', top: 0 }}>
          <MapComponent cars={filteredCars} />
        </div>
      </div>
    </div>
  )
}

export default Cars
