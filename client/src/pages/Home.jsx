import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { IoSparkles } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";
import { FaShoppingCart } from 'react-icons/fa';
import { FaRegHeart } from "react-icons/fa";

import { useEffect } from "react";
import Navbar from "../utils/Navbar";

function Home({ apiKey = "" }) {
  const [resumeText, setResumeText] = useState("");
  const [pdf, setPdf] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState("");

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favResp, setFavResp] = useState('');

  const [credits, setCredits] = useState(0);
  const [rank, setRank] = useState({});

  const [email, setEmail] = useState("");
  const [holderName, setHolderName] = useState("");
  const [price, setPrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");

  const [collapse, setCollapse] = useState(true);

  const reviewRef = useRef(null);
  const shouldScrollToReviewRef = useRef(false);

  const toggleCollapse = () => {
    setCollapse((prev) => !prev);
  };

  const selectedInputLabel = useMemo(() => {
    if (pdf) return `PDF selected: ${pdf.name}`;
    if (resumeText.trim()) return "Using pasted resume text";
    return "Add resume text or upload a PDF to begin";
  }, [pdf, resumeText]);

  const fetchUserStats = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const [creditsRes, rankRes] = await Promise.all([
        axios.get(`${apiKey}/api/get/credits`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiKey}/api/ranking`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCredits(creditsRes.data);
      setRank(rankRes.data);
    } catch {
      setError("Unable to fetch latest user stats.");
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [apiKey]);

  useEffect(() => {
    if (!review || !shouldScrollToReviewRef.current) return;
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    shouldScrollToReviewRef.current = false;
  }, [review]);

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    setReview(null);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    if (!pdf && !resumeText.trim()) {
      setError("Please paste resume text or upload a PDF.");
      return;
    }

    setLoading(true);
    try {
      if (pdf) {
        const formData = new FormData();
        formData.append("resume", pdf);
        const res = await axios.post(`${apiKey}/api/roast/pdf`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        shouldScrollToReviewRef.current = true;
        setReview(res.data);
        await fetchUserStats();
        return;
      }

      const res = await axios.post(
        `${apiKey}/api/roast/text`,
        { text: resumeText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      shouldScrollToReviewRef.current = true;
      setReview(res.data);
      await fetchUserStats();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Unable to review resume right now. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const buyCredits = async (e) => {
    e.preventDefault();

    setBuyError("");
    setBuySuccess("");

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setBuyError("Session expired. Please login again.");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedHolder = holderName.trim();
    const cleanCardNumber = cardNumber.replace(/\s+/g, "");
    const cleanCvv = cvv.trim();
    const cleanExpiry = expiry.trim();
    const numericPrice = Number(price);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setBuyError("Please enter a valid email address.");
      return;
    }
    if (trimmedHolder.length < 3) {
      setBuyError("Card holder name must be at least 3 characters.");
      return;
    }
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      setBuyError("Card number must be exactly 16 digits.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cleanExpiry)) {
      setBuyError("Expiry must be in MM/YY format.");
      return;
    }
    if (!/^\d{3}$/.test(cleanCvv)) {
      setBuyError("CVV must be exactly 3 digits.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setBuyError("Price must be a number greater than 0.");
      return;
    }

    setBuyLoading(true);
    try {
      await axios.post(
        `${apiKey}/api/buy/credits`,
        {
          email: trimmedEmail,
          holderName: trimmedHolder,
          cardNumber: cleanCardNumber,
          expiry: cleanExpiry,
          cvv: cleanCvv,
          price: numericPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBuySuccess(`Payment successful. ${Math.floor(numericPrice)} credits added.`);
      setCardNumber("");
      setCvv("");
      setExpiry("");
      setPrice("");
      await fetchUserStats();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Payment failed right now. Please try again.";
      setBuyError(message);
    } finally {
      setBuyLoading(false);
    }
  };

  const doFavorite = async () => {
    setFavoriteLoading(true);
    if (!isFavorite) {
      const token = localStorage.getItem("auth_token");
      await axios.post(`${apiKey}/api/favorite/res`, { review },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setFavoriteLoading(false);
          setIsFavorite(true);
          setFavResp("");
          fetchUserStats();
        })
        .catch((res) => {
          setFavoriteLoading(false);
          setIsFavorite(false);
          setFavResp("Unable to favorite, please try again later!");
        })
    }

    setFavoriteLoading(false);
  }

  return (
    <div className="w-full min-h-screen transition-all md:bg-[#f3f3f3] bg-white md:px-6 md:py-6 md:py-6 max-w-[1440px] mx-auto">
      <div className="mx-auto w-full max-w-12xl">
        <Navbar />
        <div className="items-start grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="md:rounded-3xl min-h bg-white p-6 md:p-7 md:border border-gray-200"
            >
              <h2 className="text-xl md:text-2xl font-semibold mb-3">
                Submit Your Resume
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Paste raw resume text or upload a PDF. We will review clarity,
                grammar, and coverage.
              </p>

              <form onSubmit={submitForm} className="space-y-4">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  disabled={loading}
                  placeholder="Paste your resume text here..."
                  rows={8}
                  className="w-full max-h-60 rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                />

                <div className="text-center text-sm font-medium text-gray-500">OR</div>

                <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:bg-gray-50 transition">
                  <span className="block mb-2 font-medium">Upload PDF Resume</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={loading}
                    onChange={(e) => setPdf(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-white hover:file:opacity-90"
                  />
                </label>

                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  <IoSparkles size={14} />
                  {selectedInputLabel}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {
                  !credits ? (
                    <motion.button
                      whileHover={{ opacity: 0.5, scale: 1 }}
                      whileTap={{ opacity: 1, scale: 0.99 }}
                      disabled={true}
                      type="disabled"
                      className="w-full rounded-full bg-black py-3 text-white font-medium shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      No credits left!
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ opacity: 0.9, scale: 1.01 }}
                      whileTap={{ opacity: 1, scale: 0.99 }}
                      disabled={loading}
                      type="submit"
                      className="w-full rounded-full bg-black py-3 text-white font-medium shadow-md hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Reviewing..." : "Review Resume"}
                    </motion.button>
                  )
                }
              </form>
            </motion.section>

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="rounded-3xl min-h bg-white mx-6 md:m-0 mb:mx p-6 border border-gray-200"
            >
              <button
                type="button"
                onClick={toggleCollapse}
                className="flex w-full flex-row items-center justify-between hover:cursor-pointer"
              >
                <h2 className="text-left text-xl md:text-2xl font-semibold">Get more credits</h2>
                <FaChevronDown className={`${collapse ? "rotate-0 transition-all duration-300" : "rotate-180 transition-all duration-300"}`} />
              </button>
              <div className={`${collapse ? "max-h-0 opacity-0 overflow-hidden" : "opacity-100 overflow-visible"}`}>
                <p className="text-sm text-gray-500 mb-6 mt-3">Please provide below your card details to get credits.</p>
                <form onSubmit={buyCredits} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={buyLoading}
                    placeholder="Email"
                    className="w-full mb-2 rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                  />
                  {
                    email && (
                      <p className="text-xs mt-0 mb-2 ml-4 text-gray-500">
                        Credits will be reflected to the above mail
                      </p>
                    )
                  }
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    disabled={buyLoading}
                    placeholder="Card Holder Name"
                    className="w-full rounded-2xl border mt-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                  />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))
                    }
                    disabled={buyLoading}
                    maxLength={19}
                    placeholder="Card Number (16 digits)"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      disabled={buyLoading}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      disabled={buyLoading}
                      maxLength={3}
                      placeholder="CVV"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                    />
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={buyLoading}
                      min={1}
                      step={1}
                      placeholder="Price $"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Dummy payment: 1 credit gets added for each 1 unit in price.
                  </p>

                  {buyError && (
                    <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                      {buyError}
                    </div>
                  )}
                  {buySuccess && (
                    <div className="rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
                      {buySuccess}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ opacity: 0.9, scale: 1.01 }}
                    whileTap={{ opacity: 1, scale: 0.99 }}
                    disabled={buyLoading}
                    type="submit"
                    className="w-full hover:cursor-pointer rounded-full bg-black py-3 text-white font-medium shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {buyLoading ? "Processing payment..." : "Buy Credits"}
                  </motion.button>
                </form>

              </div>

            </motion.section>

          </div>

          <div className="space-y-6">
            <motion.header
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="md:rounded-3xl bg-white p-5 md:border md:border-gray-200"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Your Progress</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                  <IoSparkles size={12} />
                  Live stats
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500">Credits Left</p>
                  <p className="text-lg font-semibold">{credits ?? "-"}</p>
                </div>
                <div className="rounded-2xl bg-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500">Average Score</p>
                  <p className="text-lg font-semibold">{rank.avgscore ?? "-"}/10</p>
                </div>
                <div className="rounded-2xl bg-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-500">Average Score Rank</p>
                  <p className="text-lg font-semibold">{rank.rank ?? "-"}/{rank.outof ?? "-"}</p>
                </div>
              </div>
            </motion.header>

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="md:rounded-3xl bg-white p-6 md:border md:border-gray-200"
              ref={reviewRef}
            >
              <div className="flex flex-row justify-between gap-2 mb-2">
                <h2 className="text-xl md:text-2xl font-semibold mb-2">Review Result</h2>
                {review && (<motion.button disabled={isFavorite || favoriteLoading} onClick={() => { doFavorite() }} className="h-min disabled:pointer-events-none hover:cursor-pointer duration-200 hover:bg-gray-100 hover:border-gray-100 px-4 py-2 flex flex-row items-center gap-2 text-xs rounded-xl border border-gray-300 text-gray-500]"><span className="max-[950px]:hidden max-md:block">{isFavorite ? "Favorited!" : "Favorite this response"}</span><FaRegHeart className={isFavorite ? 'text-red-500' : ''} /></motion.button>)}
              </div>

              {favResp && (
                <div className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 mb-4">
                  {favResp}
                </div>
              )}

              {!review ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    Scores, roast, and improvement tips appear here after submission.
                  </p>
                  <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                    No review yet. Submit a resume to see AI feedback.
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-gray-100 p-3 text-center">
                      <p className="text-xs text-gray-500">Overall</p>
                      <p className="text-lg font-semibold">{review?.scores?.overall ?? "-"}/10</p>
                    </div>
                    <div className="rounded-2xl bg-gray-100 p-3 text-center">
                      <p className="text-xs text-gray-500">Grammar</p>
                      <p className="text-lg font-semibold">{review?.scores?.grammar ?? "-"}/10</p>
                    </div>
                    <div className="rounded-2xl bg-gray-100 p-3 text-center">
                      <p className="text-xs text-gray-500">Coverage</p>
                      <p className="text-lg font-semibold">{review?.scores?.coverage ?? "-"}/10</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-semibold mb-2">Roast</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {review?.roast || "No roast provided."}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-semibold mb-2">Improvements</h3>
                    {Array.isArray(review?.improvements) && review.improvements.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {review.improvements.map((item, idx) => (
                          <li key={`imp-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">No improvements suggested.</p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-semibold mb-2">Positives</h3>
                    {Array.isArray(review?.positives) && review.positives.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {review.positives.map((item, idx) => (
                          <li key={`pos-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">No positives returned.</p>
                    )}
                  </div>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;