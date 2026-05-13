import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets';
import Loader from '../components/Loader';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import MapComponent from '../components/MapComponent';
import ChatWidget from '../components/ChatWidget';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CarDetails = () => {
  const {id} = useParams();
  const {cars,axios,pickupDate,setPickupDate,returnDate,setReturnDate,token,setShowLogin} = useAppContext();
  const navigate = useNavigate();
  const [car,setCar] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const currency = import.meta.env.VITE_CURRENCY;
  
  const toInputDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromInputDate = (value) => {
    if (!value) return null;
    return new Date(`${value}T00:00:00`);
  };

  const getTotalDays = (start, end) => {
    const startDate = fromInputDate(start);
    const endDate = fromInputDate(end);
    if (!startDate || !endDate) return 0;
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Number.isFinite(days) && days > 0 ? days : 0;
  };

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      if (!token || token === 'null' || token === 'undefined') {
        setShowLogin(true);
        return toast.error('Please login to book');
      }
      const totalDays = getTotalDays(pickupDate, returnDate);
      if (!pickupDate) return toast.error('Select a pickup date');
      if (!returnDate) return toast.error('Select a return date');
      if (totalDays === 0) return toast.error('Return date must be after pickup date');

      setSubmitting(true);
      const {data} = await axios.post('/api/bookings/create',{
        car: id,
        pickupDate,
        returnDate
      })
      if(!data.success){
        return toast.error(data.message);
      }
      const bookingId = data?.data?.bookingId;
      if (!bookingId) {
        return toast.error('Booking created, but no payment session available');
      }
      const sessionRes = await axios.post('/api/payments/create-checkout-session', { bookingId });
      if (sessionRes.data?.success) {
        window.location.href = sessionRes.data.data.url;
      } else {
        toast.error(sessionRes.data?.message || 'Payment session failed');
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setShowLogin(true);
        toast.error('Please login to book');
      } else {
        toast.error(error?.response?.data?.message || error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(()=>{
    setCar(cars.find(car => car._id === id))
  },[cars,id])

  // Fetch booked date ranges for calendar
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await axios.get(`/api/bookings/car/${id}/dates`);
        if (data.success) {
          const disabledDates = [];
          data.data.bookedRanges.forEach(range => {
            let current = new Date(range.start);
            current.setHours(0, 0, 0, 0);
            const end = new Date(range.end);
            end.setHours(0, 0, 0, 0);
            while (current <= end) {
              disabledDates.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          });
          setBookedDates(disabledDates);
        }
      } catch (error) {
        console.error("Failed to fetch blocked dates", error);
      }
    };
    if (id) fetchBookings();
  }, [id, axios]);

  if (!car) return <Loader/>;

  const totalDays = getTotalDays(pickupDate, returnDate);
  const totalPrice = totalDays > 0 ? totalDays * car.pricePerDay : 0;
  const tokenValid = Boolean(token && token !== 'null' && token !== 'undefined');
  const bookingIssue = !tokenValid
    ? 'Please login to book'
    : !pickupDate
      ? 'Select a pickup date'
      : !returnDate
        ? 'Select a return date'
        : totalDays === 0
          ? 'Return date must be after pickup date'
          : null;

  return (
    <>
      <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16 pb-20'>
        <button onClick={()=>navigate(-1)} className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer">
          <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65'/>
          Back to all cars
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Car image and details */}
          <div className='lg:col-span-2'>
            <img src={car.image} alt="" className='w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md'/>
            <div className='space-y-6'>
              <div>
                <h1 className='text-3xl font-bold'>{car.brand} {car.model}</h1>
                <p className='text-gray-500 text-lg'>{car.category} · {car.year}</p>
                <hr className='border-borderColor my-6'/>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                  {[
                    {icon:assets.users_icon, text:`${car.seating_capacity} Seats`},
                    {icon:assets.fuel_icon,  text:car.fuel_type},
                    {icon:assets.car_icon,   text:car.transmission},
                    {icon:assets.location_icon, text:car.location}
                  ].map(({icon,text}) => (
                    <div key={text} className='flex flex-col items-center bg-light p-4 rounded-lg'>
                      <img src={icon} alt="" className='h-5 mb-2'/>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className='text-xl font-medium mb-3'>Description</h2>
                <p className='text-gray-500'>{car.description}</p>
              </div>

              {/* Pickup Location Map */}
              <div>
                <h2 className='text-xl font-medium mb-3'>Pickup Location</h2>
                <MapComponent location={car.location} label={`${car.brand} ${car.model} — ${car.location}`} />
              </div>

              {/* Features */}
              <div>
                <h2 className='text-xl font-medium mb-3'>Features</h2>
                <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {["360 Camera","Bluetooth","GPS","Heated Seats","Rear View Mirror"].map((item) => (
                    <li key={item} className='flex items-center text-gray-500'>
                      <img src={assets.check_icon} className='h-4 mr-2' alt=""/>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Booking form */}
          <form onSubmit={handleSubmit} className='shadow-lg h-max rounded-xl p-6 space-y-6 text-gray-500'>
            <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>
              {currency}{car.pricePerDay}
              <span className='text-base text-gray-400 font-normal'>per day</span>
            </p>
            <hr className='border-borderColor my-6'/>
            <div className='flex flex-col gap-2'>
              <label htmlFor="pickup-date">Pickup Date</label>
              <DatePicker
                selected={fromInputDate(pickupDate)}
                onChange={(date) => {
                  const value = toInputDate(date);
                  setPickupDate(value);
                  if (returnDate && getTotalDays(value, returnDate) === 0) {
                    setReturnDate('');
                  }
                }}
                excludeDates={bookedDates}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className='border border-borderColor w-full px-3 py-2 rounded-lg'
                placeholderText="Select pickup date"
                id='pickup-date'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <label htmlFor="return-date">Return Date</label>
              <DatePicker
                selected={fromInputDate(returnDate)}
                onChange={(date) => setReturnDate(toInputDate(date))}
                excludeDates={bookedDates}
                minDate={pickupDate ? addDays(fromInputDate(pickupDate), 1) : new Date()}
                dateFormat="yyyy-MM-dd"
                className='border border-borderColor w-full px-3 py-2 rounded-lg'
                placeholderText="Select return date"
                id='return-date'
              />
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span>Total ({totalDays || 0} {totalDays === 1 ? 'day' : 'days'})</span>
              <span className='font-semibold text-gray-800'>
                {currency}{totalPrice || 0}
              </span>
            </div>
            <button
              type="submit"
              className={`w-full transition-all py-3 font-medium text-white rounded-xl ${submitting ? 'bg-primary-dull cursor-wait' : bookingIssue ? 'bg-gray-400 hover:bg-gray-400 cursor-pointer' : 'bg-primary hover:bg-primary-dull cursor-pointer'}`}
            >
              {submitting ? 'Booking...' : 'Book Now'}
            </button>
            {bookingIssue && (
              <p className='text-center text-xs text-gray-500'>{bookingIssue}</p>
            )}
            <p className='text-center text-sm'>Secure payment required to confirm booking</p>
          </form>
        </div>
      </div>

      <ChatWidget />
    </>
  )
}

export default CarDetails
