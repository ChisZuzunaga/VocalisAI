import React from 'react'
import Loaderr from '../assets/loader.svg'
import JumpLoader from '../components/JumpLoader'

const Loader = () => (
  <div className='flex flex-col items-center justify-center h-screen gap-4'>
    <div className="flex justify-center">
        <img
            src={Loaderr}
            alt='Loading'
            className="w-30 h-30"
        />
    </div>
    <div>
        <JumpLoader />
    </div>
  </div>
)

export default Loader