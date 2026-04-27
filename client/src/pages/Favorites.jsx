import React, { useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { motion } from 'motion/react'
import Navbar from '../utils/Navbar'
import axios from "axios";

function Favorites({ apiKey = '' }) {
    const [favorites, setFavorites] = useState([]);
    const [error, setError] = useState("");

    const normalizedFavorites = useMemo(() => {
        if (!Array.isArray(favorites)) return [];
        return favorites
            .map((item) => {
                const raw = item?.response ?? item;
                if (!raw) return null;

                let parsedReview = null;
                if (typeof raw === "string") {
                    try {
                        const parsed = JSON.parse(raw);
                        parsedReview = parsed?.review ?? parsed;
                    } catch {
                        return null;
                    }
                }

                if (typeof raw === "object" && !parsedReview) {
                    parsedReview = raw?.review ?? raw;
                }

                if (!parsedReview || typeof parsedReview !== "object") return null;

                return {
                    review: parsedReview,
                    savedAt: item?.created_at ?? null,
                    id: item?.id ?? null,
                };
            })
            .filter(Boolean);
    }, [favorites]);

    const formatSavedDate = (dateValue) => {
        if (!dateValue) return "Unknown date";
        const d = new Date(dateValue);
        if (Number.isNaN(d.getTime())) return "Unknown date";
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };
    const fetchUserStats = async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        try {
            const [favRes] = await Promise.all([
                axios.get(`${apiKey}/api/favorite/res`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            setFavorites(Array.isArray(favRes.data) ? favRes.data : []);
        } catch {
            setError("Unable to fetch latest user stats.");
        }
    };

    useEffect(() => {
        fetchUserStats();
    }, [apiKey]);

    return (
        <div className="w-full min-h-screen transition-all md:bg-[#f3f3f3] bg-white md:px-6 md:py-6 md:py-6 max-w-[1440px] mx-auto">
            <div className="mx-auto w-full max-w-12xl">
                <Navbar />
                {error && (
                    <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                <div className="items-start grid gap-6 md:grid-cols-1">
                    <div className="space-y-6">
                        <motion.section
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="md:rounded-3xl bg-white p-6 md:border md:border-gray-200"
                        >
                            <div className="flex flex-row justify-between gap-2 mb-2">
                                <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Favorites</h2>
                            </div>

                            {!normalizedFavorites.length ? (
                                <>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Your favorited responses appear here.
                                    </p>
                                    <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                                        No favorites found, try submitting new resumes!
                                    </div>
                                </>
                            ) : (
                                normalizedFavorites.map((favorite, idx) => (
                                    <div className="rounded-2xl mb-4 border border-gray-200 bg-white p-4 md:p-5 space-y-4" key={`favorite-${favorite.id ?? idx}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-md font-semibold text-gray-800">Favorited Response: {idx + 1}</p>
                                            <p className="text-xs text-gray-500">Favorited on {formatSavedDate(favorite.savedAt)}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="rounded-2xl bg-gray-100 p-3 text-center">
                                                <p className="text-xs text-gray-500">Overall</p>
                                                <p className="text-lg font-semibold">{favorite.review?.scores?.overall ?? "-"}/10</p>
                                            </div>
                                            <div className="rounded-2xl bg-gray-100 p-3 text-center">
                                                <p className="text-xs text-gray-500">Grammar</p>
                                                <p className="text-lg font-semibold">{favorite.review?.scores?.grammar ?? "-"}/10</p>
                                            </div>
                                            <div className="rounded-2xl bg-gray-100 p-3 text-center">
                                                <p className="text-xs text-gray-500">Coverage</p>
                                                <p className="text-lg font-semibold">{favorite.review?.scores?.coverage ?? "-"}/10</p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-gray-50 p-4">
                                            <h3 className="font-semibold mb-2">Roast</h3>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {favorite.review?.roast || "No roast provided."}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-gray-50 p-4">
                                            <h3 className="font-semibold mb-2">Improvements</h3>
                                            {Array.isArray(favorite.review?.improvements) && favorite.review.improvements.length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                                    {favorite.review.improvements.map((item, idx2) => (
                                                        <li key={`imp-${idx2}`}>{item}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-600">No improvements suggested.</p>
                                            )}
                                        </div>

                                        <div className="rounded-2xl bg-gray-50 p-4">
                                            <h3 className="font-semibold mb-2">Positives</h3>
                                            {Array.isArray(favorite.review?.positives) && favorite.review.positives.length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                                    {favorite.review.positives.map((item, idx2) => (
                                                        <li key={`pos-${idx2}`}>{item}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-600">No positives returned.</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.section>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Favorites
