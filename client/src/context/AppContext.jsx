import React,{ createContext, useContext, useState,useEffect } from "react";
import axios from "axios";
import {toast} from "react-hot-toast";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({children})=>{
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY;
    const [token,setToken] = useState(null);
    const [user,setUser] = useState(null);
    const [showLogin,setShowLogin] = useState(false);
    const [isOwner,setIsOwner] = useState(false);
    const[pickupDate,setPickupDate] = useState('')
    const[returnDate,setReturnDate] = useState('')

    const [cars,setCars] = useState([]);


    //function to check user if logged in
    const fetchUser = async()=>{
        try {
            const {data} = await axios.get('/api/user/data')
            if(data.success){
                setUser(data.user);
                setIsOwner(data.user.role === 'owner');
            }
            else{
                navigate('/')
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    //function to fetch all cars
    const fetchCars = async()=>{
        try {
           const {data} = await axios.get('/api/user/cars')
           data.success ? setCars(data.cars) : toast.error(data.message);
        } catch (error) {   
            toast.error(error.message);
        }
    }
    //fn to logout user
    const logout = ()=>{
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setIsOwner(false);
        axios.defaults.headers.common['Authorization'] = '';
        toast.success('you have been logged out')
    }
    //useEffect to retrieve token from localStorage
    useEffect(()=>{
        const token = localStorage.getItem('token');
        setToken(token);
        fetchCars()
    },[])

    //useEffect to fetch user data if token exists
    useEffect(()=>{
        if(token){
            axios.defaults.headers.common['Authorization'] = `${token}`
            fetchUser();
        }
    },[token])
    const value = {
        navigate,currency,axios,
        user,setUser,token,setToken,
        isOwner,setIsOwner,
        fetchUser,showLogin,setShowLogin,
        logout,fetchCars,cars,setCars,
        pickupDate,setPickupDate,
        returnDate,setReturnDate,toast

    }
    return (
        <AppContext.Provider value = {value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = ()=>{
    return useContext(AppContext);
}