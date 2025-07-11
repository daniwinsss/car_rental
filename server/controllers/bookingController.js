import Booking from "../models/Booking.js"
import Car from "../models/Car.js";



//funct check availability of car for a given date
const checkAvailability = async(car,pickupDate,returnDate)=>{
    const bookings = await Booking.find({
        car,
        pickupDate:{$lte: returnDate},
        returnDate:{$gte: pickupDate},
    })
    return bookings.length === 0;
}


// api to check car availability
export const checkAvailabilityOfCar = async (req, res) => {
    try {
        const {location,pickupDate,returnDate} = req.body;

        //fetching all cars in the given location that are available
        const cars = await Car.find({
            location,
            isAvailable: true,
        })
        //checking availability for each car using promise
        const availableCarsPromises = cars.map(async(car)=>{
            const isAvailable = await checkAvailability(car._id,pickupDate,returnDate);
            return{...car._doc,isAvailable : isAvailable};
        })
        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true);

        res.json({success :true,availableCars});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}    

//api to book a car
export const createBooking = async(req,res)=>{
    try {
        const {_id} = req.user;
        const {car,pickupDate,returnDate} = req.body;
        const isAvailable = await checkAvailability(car,pickupDate,returnDate);
        if(!isAvailable){
            return res.json({success:false,message : "Car is not available for the selected dates"});
        }
        const carData = await Car.findById(car);
        //calculate price
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
        const price = carData.pricePerDay * noOfDays;

        await Booking.create({
            car,
            owner:carData.owner,
            user:_id,
            pickupDate,
            returnDate,
            price
        })
        res.json({success:true,message : 'Booking Created'});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
// api to list user Bookings
export const getUserBookings = async(req,res) =>{
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({user:_id}).populate('car').sort({createdAt: -1});
        res.json({success:true,bookings});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
//api to get owner bookings
export const getOwnerBookings = async(req,res) =>{
    try {
        if(req.user.role !== 'owner'){
            return res.json({success:false,message : "unauthorized"});
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car user')
        .select('-user.password').sort({createdAt:-1});
        res.json({success:true,bookings});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

//api to change booking status
export const changeBookingStatus = async(req,res) =>{
    try {
        const {_id} = req.user;
        const {bookingId,status} = req.body;

        const booking = await Booking.findById(bookingId);
        if(booking.owner.toString() !==_id.toString()){
            return res.json({success:false,message : "Unauthorized"});
        }
        booking.status = status;
        await booking.save();
        res.json({success:true,message : "Booking status updated"});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}