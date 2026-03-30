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
  const {cars,axios,pickupDate,setPickupDate,returnDate,setReturnDate} = useAppContext();
  const navigate = useNavigate();
  const [car,setCar] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const currency = import.meta.env.VITE_CURRENCY;
  
  // Convert standard JS Date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    // Adjust for local timezone offset when generating ISO string
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      const {data} = await axios.post('/api/bookings/create',{
        car: id,
        pickupDate,
        returnDate
      })
      if(data.success){
        toast.success(data.message);
        navigate('/my-bookings');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
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
          data.bookedRanges.forEach(range => {
            let current = new Date(range.start);
            const end = new Date(range.end);
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
          <form onSubmit={handleSubmit} className='shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-6 text-gray-500'>
            <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>
              {currency}{car.pricePerDay}
              <span className='text-base text-gray-400 font-normal'>per day</span>
            </p>
            <hr className='border-borderColor my-6'/>
            <div className='flex flex-col gap-2'>
              <label htmlFor="pickup-date">Pickup Date</label>
              <DatePicker
                selected={pickupDate ? new Date(pickupDate) : null}
                onChange={(date) => setPickupDate(formatDate(date))}
                excludeDates={bookedDates}
                minDate={new Date()}
                className='border border-borderColor w-full px-3 py-2 rounded-lg'
                placeholderText="Select pickup date"
                required
                id='pickup-date'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <label htmlFor="return-date">Return Date</label>
              <DatePicker
                selected={returnDate ? new Date(returnDate) : null}
                onChange={(date) => setReturnDate(formatDate(date))}
                excludeDates={bookedDates}
                minDate={pickupDate ? new Date(pickupDate) : new Date()}
                className='border border-borderColor w-full px-3 py-2 rounded-lg'
                placeholderText="Select return date"
                required
                id='return-date'
              />
            </div>
            <button className='w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl cursor-pointer'>
              Book Now
            </button>
            <p className='text-center text-sm'>No credit card required to reserve</p>
          </form>
        </div>
      </div>

      <ChatWidget />
    </>
  )
}

export default CarDetails
