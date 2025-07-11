import React, { useEffect } from 'react'
import Sidebar from '../../components/owner/Sidebar'
import NavbarOwner from '../../components/owner/NavbarOwner'
import { Outlet } from 'react-router-dom'
import Dashboard from './Dashboard'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const {isOwner,navigate} = useAppContext(); 
  useEffect(()=>{
    if(!isOwner){
      navigate('/');
    }
  },[isOwner])
  return (
    <div className='flex flex-col'>
        <NavbarOwner/>
        <div className='flex'>
            <Sidebar/>
            <Outlet/>
        </div>
    </div>
  )
}

export default Layout
