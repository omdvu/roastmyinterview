import React from 'react'
import { motion } from "motion/react";
import { FaRobot } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:mb-6 max-md:justify-center flex flex-wrap items-center justify-between gap-4 md:rounded-3xl bg-[#f9f9f9] md:bg-white p-5 md:shadow-x border-b-1 md:border border-gray-200"
        >
            <div className="flex items-center gap-3">
                <div className="bg-black text-white p-2 rounded-lg">
                    <FaRobot size={18} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold">RoastMyInterview</h1>
                </div>
            </div>
            <div className='flex flex-row gap-2'>
                <button
                    onClick={() => {
                        navigate('/')
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition hover:cursor-pointer"
                >
                    Home
                </button>
                <button
                    onClick={() => {
                        navigate('/favorites')
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition hover:cursor-pointer"
                >
                    Favorites
                </button>
                <button
                    onClick={() => {
                        localStorage.removeItem("auth_token");
                        window.location.href = "/";
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition hover:cursor-pointer"
                >
                    Logout
                </button>
            </div>
        </motion.header>
    )
}

export default Navbar
