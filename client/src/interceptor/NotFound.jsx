import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6">
      
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center bg-white p-10 rounded-3xl shadow-2xl border border-gray-200 max-w-md w-full"
      >
        
        {/* 404 Title */}
        <h1 className="text-6xl font-bold text-black mb-4">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl font-semibold mb-2">
          Page not found
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          Looks like you took a wrong turn.  
          This page doesn’t exist.
        </p>

        {/* Button */}
        <motion.button
          onClick={() => navigate("/home")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-black text-white rounded-full shadow-md"
        >
          Go back home
        </motion.button>

      </motion.div>
    </div>
  );
}

export default NotFound;