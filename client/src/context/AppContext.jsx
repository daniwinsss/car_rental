import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { initSocket } from "../socket";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY;

    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [pickupDate, setPickupDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [cars, setCars] = useState([]);

    const fetchUser = async () => {
        try {
            const { data } = await axios.get("/api/user/data");
            if (data.success) {
                setUser(data.data.user);
                setIsOwner(data.data.user.role === "owner");
            } else {
                navigate("/");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchCars = async () => {
        try {
            const { data } = await axios.get("/api/user/cars");
            if (data.success) {
                setCars(data.data.cars);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setIsOwner(false);
        delete axios.defaults.headers.common["Authorization"];
        toast.success("You have been logged out");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        fetchCars();
    }, []);

    useEffect(() => {
        if (token && token !== "null" && token !== "undefined") {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            fetchUser();

            if (!import.meta.env.PROD) {
                initSocket(token);
            }
        }
    }, [token]);

    const value = {
        navigate,
        currency,
        axios,
        user,
        setUser,
        token,
        setToken,
        isOwner,
        setIsOwner,
        fetchUser,
        showLogin,
        setShowLogin,
        logout,
        fetchCars,
        cars,
        setCars,
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
        toast,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
