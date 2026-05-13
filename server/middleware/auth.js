import jwt from 'jsonwebtoken'
import User from '../models/User.js';

export const protect = async(req,res,next) =>{
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({success:false,message: "not authorized"});
    }
    try {
        const tokenString = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
        const userId = jwt.verify(tokenString, process.env.JWT_SECRET);
        if(!userId){
            return res.status(401).json({success:false,message:"not authorized"})
        }
        req.user = await User.findById(userId).select("-password");
        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({success:false,message: "not authorized"});
    }
}
