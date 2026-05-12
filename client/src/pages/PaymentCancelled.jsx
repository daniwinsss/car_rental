import React from 'react';

const PaymentCancelled = () => {
  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16 text-sm max-w-3xl'>
      <h1 className='text-2xl font-semibold text-red-500'>Payment Cancelled</h1>
      <p className='mt-4 text-gray-600'>Your payment was cancelled or failed.</p>
      <p className='mt-2 text-gray-500'>You can retry the payment from your bookings.</p>
    </div>
  );
};

export default PaymentCancelled;
