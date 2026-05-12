import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getSocket } from '../../socket';

const NavbarOwner = () => {
    const {user,axios} = useAppContext();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/api/notifications');
            if (data.success) {
                setNotifications(data.data.notifications || []);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        const handler = () => fetchNotifications();
        socket.on('newBooking', handler);
        socket.on('bookingConfirmed', handler);
        socket.on('bookingCancelled', handler);
        socket.on('paymentSuccessful', handler);
        socket.on('availabilityUpdated', handler);
        return () => {
            socket.off('newBooking', handler);
            socket.off('bookingConfirmed', handler);
            socket.off('bookingCancelled', handler);
            socket.off('paymentSuccessful', handler);
            socket.off('availabilityUpdated', handler);
        };
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = async () => {
        try {
            await axios.post('/api/notifications/read');
            fetchNotifications();
        } catch (error) {
            console.log(error.message);
        }
    };

  return (
    <div className='flex items-center justify-between px-6 md:px-10 py-4 text-gray-500 border-b border-borderColor relative transition-all'>
        <Link to ='/'>
        <img src={assets.logo} alt="" className='h-7'/>
        </Link>
        <div className='flex items-center gap-4'>
            <div className='relative'>
                <button onClick={() => setIsOpen((prev) => !prev)} className='relative'>
                    <img src={assets.bell_icon} alt="" className='h-6 w-6'/>
                    {unreadCount > 0 && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5'>
                            {unreadCount}
                        </span>
                    )}
                </button>
                {isOpen && (
                    <div className='absolute right-0 mt-2 w-72 bg-white border border-borderColor rounded-md shadow-lg z-20'>
                        <div className='flex items-center justify-between px-3 py-2 border-b border-borderColor'>
                            <p className='text-sm font-medium'>Notifications</p>
                            <button onClick={markAllRead} className='text-xs text-primary'>Mark all read</button>
                        </div>
                        <div className='max-h-64 overflow-auto'>
                            {notifications.length === 0 ? (
                                <p className='px-3 py-3 text-xs text-gray-500'>No notifications yet</p>
                            ) : (
                                notifications.map((notification) => (
                                    <div key={notification._id} className='px-3 py-2 border-b border-borderColor text-xs'>
                                        <p className={notification.read ? 'text-gray-500' : 'text-gray-800'}>
                                            {notification.message}
                                        </p>
                                        <p className='text-[10px] text-gray-400'>
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link to='/owner/dashboard' className='block text-center text-xs text-primary py-2'>
                            View dashboard
                        </Link>
                    </div>
                )}
            </div>
            <p>Welcome,{user?.name || "Owner"}</p>
        </div>
    </div>
  )
}

export default NavbarOwner
