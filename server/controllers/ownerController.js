import Car from '../models/Car.js'
import User from "../models/User.js";
import fs from 'fs';
import imagekit from "../configs/imageKit.js";
import Booking from '../models/Booking.js';

//api to change role
export const changeRoleToOwner = async(req,res)=>{
    try {
        const {_id} = req.user;
        await User.findByIdAndUpdate(_id,{role:"owner"});
        res.json({success: true,message : "Now you can list cars"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}

//api to list car

export const addCar = async(req,res)=>{
    try {
        const {_id} = req.user;
        let car = JSON.parse(req.body.carData);
        const imageFile = req.file;

        //upload image to imageKit
        const filebuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file:filebuffer,
            fileName:imageFile.originalname,
            folder: '/cars'
        })

        //optimisation through imagekit url
        var optimizedImageURL = imagekit.url({
            path : response.filePath,
            transformation : [
                {width:'1280'},//width resizing
                {quality:'auto'},//auto comp
                {format:'webp'}//conv to moder format
            ]
        });
         
        const image = optimizedImageURL;
        await Car.create({...car,owner:_id,image})
        res.json({success:true,message : 'Car Added'})
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}

//api to list owner cars
export const getOwnerCars = async (req,res)=>{
    try {
        const {_id} = req.user;
        const cars = await Car.find({owner:_id})
        res.json({success:true,cars});
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}


// api to toggle car availaiblilty
export const toggleCarAvailability = async (req,res)=>{
    try {
        const {_id} = req.user;
        const {carId} = req.body;
        const car = await Car.findById(carId);
        //checking car belong to user
        if(car.owner.toString() !==_id.toString()){
           return res.json({success:false,message : "unauthorized"});
        }
        car.isAvailable = !car.isAvailable;
        await car.save();
        res.json({success:true,message : "Availability toggled"});
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}

// api to delete car
export const deleteCar = async (req,res)=>{
    try {
        const {_id} = req.user;
        const {carId} = req.body;
        const car = await Car.findById(carId);
        //checking car belong to user
        if(car.owner.toString() !==_id.toString()){
            return res.json({success:false,message : "unauthorized"});
        }
        car.isAvailable = !car.isAvailable;
        car.owner = null;
        car.isAvailable = false;

        await car.save();
        res.json({success:true,message : "Car Removed"});
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}
//api to get dashboard data

export const getDashboardData = async(req,res)=>{
    try {
        const {_id,role} = req.user;
        if(role !== 'owner'){
            return res.json({success:false,message : "unauthorized"});
        }
        const cars = await Car.find({owner: _id});
        const bookings = await Booking.find({owner:_id}).populate('car').
        sort({createdAt: - 1});

        const pendingBookings = await Booking.find({owner:_id,status:'pending'})
        const completedBookings = await Booking.find({owner:_id,status:'confirmed'})

        //monthly revenue
        const monthlyRevenue = bookings.slice().filter(booking => booking.status === 'confirmed')
        .reduce((acc,booking)=>acc + booking.price,0);

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: completedBookings.length,
            recentBookings: bookings.slice(0,3),
            monthlyRevenue
        }
        res.json({success:true,dashboardData});
    } catch (error) {
        console.log(error.message);
        res.json({success: false,message : error.message})
    }
}
// api to update user pic
export const updateUserImage = async (req, res) => {
  try {
        const { _id } = req.user;
        const imageFile = req.file;

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imagekit.upload({
        file: fileBuffer,
        fileName: imageFile.originalname,
        folder: '/user'
        });
        var optimizedImageUrl = imagekit.url({
        path: response.filePath,
        transformation: [
            { width: '400' },      // Width resizing
            { quality: 'auto' },   // Auto compression
            { format: 'webp' }     // Convert to modern format
        ]
        });

        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, { image });
        res.json({ success: true, message: "Image Updated" });
    } 
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}    

