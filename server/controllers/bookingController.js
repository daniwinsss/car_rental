import Booking from "../models/Booking.js"
import Car from "../models/Car.js";
import { successResponse } from "../utils/response.js";
import { deleteCache, getCache, setCache } from "../utils/cache.js";
import { addBookingJob } from "../queues/bookingQueue.js";
import { getIO } from "../sockets/socketHandler.js";
import Notification from "../models/Notification.js";



//funct check availability of car for a given date
const checkAvailability = async (car, pickupDate, returnDate, userId = null) => {
    const query = {
        car,
        status: { $ne: 'cancelled' },
        pickupDate: { $lte: returnDate },
        returnDate: { $gte: pickupDate },
    };

    if (userId) {
        // Ignore ONLY the user's own pending_payment bookings
        // We still want to find (other people's bookings) OR (user's own confirmed bookings)
        query.$or = [
            { user: { $ne: userId } },
            { status: { $ne: 'pending_payment' } }
        ];
    }

    const bookings = await Booking.find(query);
    return bookings.length === 0;
}

// api to perfectly get exact booked date ranges for a single car
export const getCarBookedDates = async (req, res) => {
    try {
        const { carId } = req.params;
        // Find all bookings for this car that are not cancelled
        const bookings = await Booking.find({ car: carId, status: { $ne: 'cancelled' } });
        
        // Return array of { start, end } dates
        const bookedRanges = bookings.map(b => ({
            start: b.pickupDate,
            end: b.returnDate
        }));

        return successResponse(res, { message: "Booked dates fetched", data: { bookedRanges } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}


// api to check car availability
export const checkAvailabilityOfCar = async (req, res) => {
    try {
        const { location, pickupDate, returnDate } = req.body;
        const cacheKey = `availability:${location}:${pickupDate}:${returnDate}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return successResponse(res, { message: "Availability checked", data: { availableCars: cached } });
        }

        //fetching all cars in the given location that are available
        const cars = await Car.find({
            location,
            isAvailable: true,
        })
        //checking availability for each car using promise
        const availableCarsPromises = cars.map(async (car) => {
            const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
            return { ...car._doc, isAvailable: isAvailable };
        })
        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true);

        await setCache(cacheKey, availableCars, 60);
        return successResponse(res, { message: "Availability checked", data: { availableCars } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//api to book a car
export const createBooking = async (req, res) => {
    try {
        const { _id } = req.user;
        const { car, pickupDate, returnDate } = req.body;
        const isAvailable = await checkAvailability(car, pickupDate, returnDate, _id);
        if (!isAvailable) {
            return res.status(409).json({ success: false, message: "Car is not available for the selected dates" });
        }
        const carData = await Car.findById(car);
        //calculate price
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
        const price = carData.pricePerDay * noOfDays;

        const booking = await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price,
            status: "pending_payment"
        })
        await Notification.create({
            user: carData.owner,
            message: "New booking created",
            type: "newBooking",
        });
        const io = getIO();
        if (io) {
            io.to(`owner:${carData.owner}`).emit("newBooking", { bookingId: booking._id });
        }
        await addBookingJob("expirePendingBooking", { bookingId: booking._id }, { delay: 10 * 60 * 1000 });
        await addBookingJob("analyticsUpdate", { ownerId: carData.owner });
        await deleteCache("cars");
        await deleteCache(`dashboard:${carData.owner}`);
        return successResponse(res, { message: "Booking Created", data: { bookingId: booking._id } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}
// api to list user Bookings
export const getUserBookings = async (req, res) => {
    try {
        const { _id } = req.user;
        const bookings = await Booking.find({ user: _id }).populate('car').sort({ createdAt: -1 });
        return successResponse(res, { message: "User bookings fetched", data: { bookings } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}
//api to get owner bookings
export const getOwnerBookings = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ success: false, message: "unauthorized" });
        }
        const bookings = await Booking.find({ owner: req.user._id }).populate('car user')
            .select('-user.password').sort({ createdAt: -1 });
        return successResponse(res, { message: "Owner bookings fetched", data: { bookings } });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//api to change booking status
export const changeBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, status } = req.body;

        const booking = await Booking.findById(bookingId);
        if (booking.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        booking.status = status;
        await booking.save();
        await Notification.create({
            user: booking.owner,
            message: `Booking ${status}`,
            type: "bookingStatus",
        });
        const io = getIO();
        if (io) {
            io.to(`owner:${_id}`).emit("bookingConfirmed", { bookingId: booking._id, status });
        }
        await deleteCache(`dashboard:${_id}`);
        return successResponse(res, { message: "Booking status updated" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}
