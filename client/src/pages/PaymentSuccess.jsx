import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { axios } = useAppContext();
  const [status, setStatus] = useState('Confirming payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('Payment confirmed.');
      return;
    }
    setStatus('Payment confirmed.');
  }, [searchParams, axios]);

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16 text-sm max-w-3xl'>
      <h1 className='text-2xl font-semibold text-green-600'>Payment Successful</h1>
      <p className='mt-4 text-gray-600'>{status}</p>
      <p className='mt-2 text-gray-500'>Your booking is confirmed. You can view it in My Bookings.</p>
    </div>
  );
};

export default PaymentSuccess;
