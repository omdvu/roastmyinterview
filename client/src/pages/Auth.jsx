import { FaRobot } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/Firebase';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from "react";

function Auth({ apiKey = '' }) {
    const navigate = useNavigate();
    const location = useLocation();

    let message = location.state?.message;

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth, provider);
            const token = await response.user.getIdToken();

            const res = await axios.post(`${apiKey}/api/auth/google`, { token });
            localStorage.setItem("auth_token", res.data.token);
            navigate("/home");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <div className='w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20'>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.05 }}
                className='w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200'>
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <div className='bg-black text-white p-2 rounded-lg'>
                        <FaRobot size={18} />
                    </div>
                    <h2 className='font-semibold text-lg'>RoastMyInterview</h2>
                </div>
                <h1 className='text-2xl md:text-3xl font-semibold text-center leading-snug mb-4'>
                    Continue with<span className='bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex
                items-center gap-2'>
                        <IoSparkles size={16} />
                        AI smart Interview
                    </span>
                </h1>
                <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
                    Sign in to start AI-powered mock interviews,
                    track your progress, and unlock detailed performance insights.
                </p>
                {message && (
                    <div className="mb-4 text-sm text-red-600 bg-red-100 px-4 py-2 rounded-lg text-center">
                        {message}
                    </div>
                )}
                <motion.button
                    onClick={handleGoogleAuth}
                    whileHover={{ opacity: 0.8, scale: 1.03 }}
                    whileTap={{ opacity: 1, scale: 0.98 }}
                    className='w-full flex items-center justify-center gap-3 py-3 bg-black text-white
            rounded-full shadow-md hover:cursor-pointer'>
                    <FcGoogle size={20} />Continue with Google
                </motion.button>
            </motion.div>
        </div>
    )
}

export default Auth
