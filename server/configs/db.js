import mongoose from "mongoose";



const connectDB = async()=>{
        mongoose.connection.on('connected',()=>console.log('database connected'))
        mongoose.connection.on('error',(err)=>console.error('database connection error:', err?.message || err))

        // Fail fast if Mongo is misconfigured/unreachable.
        mongoose.set('bufferCommands', false);

        const uri = process.env.MONGODB_URI;
        if (!uri || uri.includes('your_mongodb_uri')) {
                throw new Error('MONGODB_URI is not set (check server/.env)');
        }

        await mongoose.connect(uri, {
                dbName: 'car-rental',
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
        })
}


export default connectDB;
