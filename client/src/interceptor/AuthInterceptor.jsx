import { Navigate } from "react-router-dom"
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { motion } from "motion/react";

function AuthInterceptor({children}) {
    const token = localStorage.getItem("auth_token");
    const [loading, setLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        axios.get(`/api/verify?token=${token}`)
            .then(() => setIsValid(true))
            .catch(() => {
                localStorage.removeItem("auth_token")
                setIsValid(false);
            })
            .finally(() => {
                setLoading(false);
            })
    }, [token]);

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: -18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-gray-200 bg-white px-8 py-6 shadow-xl text-center"
                >
                    <p className="text-lg font-semibold">Authenticating...</p>
                    <p className="text-sm text-gray-500 mt-2">Verifying your session token.</p>
                </motion.div>
            </div>
        );
    }
    if (!token || !isValid) return <Navigate to="/" state={{message:"Please login or register first!"}} replace />;

    return children;
}

export default AuthInterceptor
