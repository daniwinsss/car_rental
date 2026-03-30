import React, { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CarCard from '../components/CarCard'
import { useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import ChatWidget from '../components/ChatWidget'

const Cars = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get('pickupLocation');
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');

  const { cars, axios, toast } = useAppContext();
  const [input, setInput] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);

  // Advanced filters
  const [category, setCategory] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [seats, setSeats] = useState('');
  const [maxPrice, setMaxPrice] = useState(2000);

  // Sort
  const [sortBy, setSortBy] = useState('newest');

  const isSearchData = pickupLocation && pickupDate && returnDate;

  // Unique option lists from car data
  const categories = [...new Set(cars.map(c => c.category))].filter(Boolean);
  const transmissions = [...new Set(cars.map(c => c.transmission))].filter(Boolean);
  const fuelTypes = [...new Set(cars.map(c => c.fuel_type))].filter(Boolean);
  const seatOptions = [...new Set(cars.map(c => c.seating_capacity))].filter(Boolean).sort((a, b) => a - b);

  useEffect(() => {
    if (cars.length > 0) {
      const highest = Math.max(...cars.map(c => c.pricePerDay));
      if (highest > maxPrice) setMaxPrice(Math.ceil(highest / 100) * 100);
    }
  }, [cars]);

  const applyFiltersAndSort = (sourceCars) => {
    let result = sourceCars.slice();
    if (input) {
      const q = input.toLowerCase();
      result = result.filter(car =>
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.category.toLowerCase().includes(q) ||
        car.transmission.toLowerCase().includes(q)
      );
    }
    if (category) result = result.filter(car => car.category === category);
    if (transmission) result = result.filter(car => car.transmission === transmission);
    if (fuelType) result = result.filter(car => car.fuel_type === fuelType);
    if (seats) result = result.filter(car => car.seating_capacity === Number(seats));
    result = result.filter(car => car.pricePerDay <= maxPrice);

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredCars(result);
  };

  const searchCarAvailability = async () => {
    try {
      const { data } = await axios.post('/api/bookings/check-availability', {
        location: pickupLocation, pickupDate, returnDate
      });
      if (data.success) {
        applyFiltersAndSort(data.availableCars);
        if (data.availableCars.length === 0) toast.error("No cars available for these dates");
      }
    } catch (error) {
      toast.error('Error finding available cars');
    }
  };

  useEffect(() => {
    if (isSearchData) {
      searchCarAvailability();
    } else if (cars.length > 0) {
      applyFiltersAndSort(cars);
    }
  }, [input, category, transmission, fuelType, seats, maxPrice, sortBy, cars]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='flex flex-col items-center py-10 bg-white border-b border-gray-100 px-4'>
        <Title
          title='Available Cars'
          subTitle='Find your perfect ride by filtering through our collection'
        />
        <div className='flex items-center bg-white border border-gray-200 px-4 mt-4 max-w-2xl w-full h-12 rounded-full shadow-sm hover:shadow-md transition-shadow'>
          <img src={assets.search_icon} alt="search" className='w-4 h-4 mr-3 opacity-50' />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder='Search by make, model or features...'
            className='w-full h-full outline-none text-gray-700 bg-transparent text-sm'
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-6 md:px-16 lg:px-24 xl:px-32 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
          <select className="border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" value={transmission} onChange={e => setTransmission(e.target.value)}>
            <option value="">All Transmissions</option>
            {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" value={fuelType} onChange={e => setFuelType(e.target.value)}>
            <option value="">All Fuel Types</option>
            {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" value={seats} onChange={e => setSeats(e.target.value)}>
            <option value="">All Seats</option>
            {seatOptions.map(s => <option key={s} value={s}>{s} Seats</option>)}
          </select>

          <div className="flex items-center gap-3 ml-2 flex-1 min-w-[200px]">
            <span className="text-xs text-gray-500 whitespace-nowrap font-medium">Max ${maxPrice}/day</span>
            <input
              type="range" min="0" max="2000" step="50"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="flex-1 h-1.5 accent-primary"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {(category || transmission || fuelType || seats) && (
              <button onClick={() => { setCategory(''); setTransmission(''); setFuelType(''); setSeats(''); }} className="text-xs text-red-400 hover:text-red-600 font-medium underline px-2">
                Reset
              </button>
            )}
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none bg-white shadow-sm"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Car Grid */}
      <div className='px-6 md:px-16 lg:px-24 xl:px-32 py-10'>
        <p className='text-sm text-gray-500 xl:px-0 max-w-7xl mx-auto mb-6 font-medium'>
          {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'} found
        </p>
        {filteredCars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-gray-300 max-w-7xl mx-auto">
            <p className="text-gray-500 font-medium mb-1">No cars match your filters.</p>
            <p className="text-gray-400 text-sm mb-4">Try widening your search.</p>
            <button
              onClick={() => { setCategory(''); setTransmission(''); setFuelType(''); setSeats(''); setInput(''); setMaxPrice(2000); }}
              className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-lg hover:bg-primary/20"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:px-0 max-w-7xl mx-auto'>
            {filteredCars.map((car, index) => (
              <CarCard key={car._id || index} car={car} />
            ))}
          </div>
        )}
      </div>
      <ChatWidget />
    </div>
  )
}

export default Cars
