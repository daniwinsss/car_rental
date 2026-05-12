import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import Car from "../models/Car.js";
import { successResponse } from "../utils/response.js";
import { getCache, setCache } from "../utils/cache.js";

//jwt token
const generateToken = (userId)=>{
    const payload = userId;
    return jwt.sign(payload,process.env.JWT_SECRET)
}

export const registerUser = async(req,res) =>{
    try {
        const {name,email,password} = req.body;
        if(!name || !email || !password || password.length < 8){
            return res.status(400).json({success : false,message : 'fill all the fields'})
        }
        const userExists = await User.findOne({email})
        if(userExists){
            return res.status(409).json({success : false,message : 'User already exists'})
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password: hashedPassword});
        const token =  generateToken(user._id.toString());
        return successResponse(res, { message: "Registration successful", data: { token } });

    } catch (error) {
        return res.status(500).json({success : false,message : error.message})
    }
} 


//login userr
export const loginUser = async(req,res) =>{
    try {
        const {email,password} = req.body
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({success : false,message : "User not found"})
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({success : false,message : "Invalid credentials"})
        }
        const token =  generateToken(user._id.toString());
        return successResponse(res, { message: "Login successful", data: { token } });
    } catch (error) {
        return res.status(500).json({success : false,message : error.message})
    }
}


//get user data using jwt

export const getUserData = async(req,res)=>{
    try {
        const {user} = req;
        return successResponse(res, { message: "User data fetched", data: { user } });
    } catch (error) {
        return res.status(500).json({success : false,message : error.message})
    }
}

//get all cars for frontend
export const getCars = async(req,res)=>{
    try {
        const cacheKey = "cars";
        const cached = await getCache(cacheKey);
        if (cached) {
            return successResponse(res, { message: "Cars fetched", data: { cars: cached } });
        }
        const cars = await Car.find({isAvailable:true});
        await setCache(cacheKey, cars, 60);
        return successResponse(res, { message: "Cars fetched", data: { cars } });
    } catch (error) {
        return res.status(500).json({success : false,message : error.message})
    }
}
