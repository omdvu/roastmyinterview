import express from "express"
import dotenv from "dotenv"
import admin from 'firebase-admin';
import multer from 'multer';
import cors from 'cors';
import jwt from "jsonwebtoken";
import path from "path";

import * as helpers from './helpers.js';
import * as prompts from './prompts.js';
import * as auth from './authmiddleware.js';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINIAPI);
const model = genAi.getGenerativeModel({model:"gemini-2.5-flash-lite"});

dotenv.config();

const app=express();
app.use(express.json());
app.use(cors({}));

const upload = multer({
    storage: multer.memoryStorage()
});

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});

//to validate the token
app.get("/api/verify", auth.authenticateToken, async (req,res) => {
    res.status(200).json({message: "Success"});
});

//to login or registering, both works
app.post("/api/auth/google", async (req, res) => {
    const {token} = req.body;
    if (!token) {
        return res.status(400).json({ error: "Token missing" });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);

        const uid = decoded.uid;
        const email = decoded.email;
        const name = decoded.name;

        let user = await helpers.authenticateUser(uid,email,name);

        const myToken = jwt.sign(
            { uid: uid },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        console.log(myToken);
        return res.json({ message: "Auth success",token:myToken, user });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: "Invalid token" });
    }
});

// to get pdf roasted
app.post("/api/roast/pdf", auth.authenticate, auth.hasCredits, upload.single('resume'), async (req,res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ error: "Only PDF allowed" });
        }
        const text = await helpers.extractText(req.file.buffer);
        const prompt = prompts.buildResumeReviewPrompt(text);
        const result = await model.generateContent(prompt);

        const raw = result.response.text();
        const parsed = helpers.parseGeminiResponse(raw);

        try {
            await helpers.calculatePromptExpense(req.uid, parsed.scores.overall);
        } catch (err) {
            console.error("Credit deduction failed:", err);
        }
        return res.json(parsed);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later." });
    }
});

// to get text roasted
app.post("/api/roast/text",auth.authenticate, auth.hasCredits, async (req,res) => {
    try {
        const {text} = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: "Please provide your resume text!" });
        }

        const prompt = prompts.buildResumeReviewPrompt(text);
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        const parsed = helpers.parseGeminiResponse(raw);

        try {
            await helpers.calculatePromptExpense(req.uid, parsed.scores.overall);
        } catch (err) {
            console.error("Credit deduction failed:", err);
        }

        return res.json(parsed);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later." });
    }
});

// to buy credits, with fake creds, always works
app.post("/api/buy/credits", auth.authenticate, async (req,res) => {
    try {
        const payload = req.body;
        const { email, price, cardNumber, holderName, expiry, cvv } = payload;

        if (!email || email.trim() === "") {
            return res.status(400).json({ error: "Please provide your email!" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format!" });
        }

        if (!price || isNaN(price) || Number(price) <= 0) {
            return res.status(400).json({ error: "Invalid price!" });
        }

        if (!cardNumber || !/^\d{16}$/.test(cardNumber)) {
            return res.status(400).json({ error: "Card number must be 16 digits!" });
        }

        if (!holderName || holderName.trim().length < 3) {
            return res.status(400).json({ error: "Invalid card holder name!" });
        }

        if (!expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
            return res.status(400).json({ error: "Invalid expiry format! Use MM/YY" });
        }

        if (!cvv || !/^\d{3}$/.test(cvv)) {
            return res.status(400).json({ error: "Invalid CVV!" });
        }

        const status = await helpers.validatePayment(payload);
        if (status) return res.json({ message: "Payment successful, credits added!" })
        else throw new Error("Failed to add credits!");
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "We are currently facing server issues, please try again later!" });
    }
});

// to get credits count
app.get("/api/get/credits", auth.authenticate, async (req,res) => {
    const credits = await helpers.getCreditsForUid(req.uid);
    res.status(200).json(credits ?? 0);
});

app.get("/api/ranking", auth.authenticate, async (req,res) => {
    const rank = await helpers.getRankOfUidOnAvgScore(req.uid);
    res.status(200).json(rank);
});

app.post("/api/favorite/res", auth.authenticate, async (req,res) => {
    try {
        const resp = req.body;
        let status = await helpers.favoriteResponse(resp,req.uid);
        if (status) return res.json({ message: "Response favorited!" })
        else throw new Error("Failed to add favorite!");
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "We are currently facing server issues, please try again later!" });
    }
});

app.get("/api/favorite/res", auth.authenticate ,async (req,res) => {
    let resp = await helpers.getFavoriteResponseByUid(req.uid);

    res.json(resp);
});

app.use(express.static("/home/omp/websites/roastmyinterview/dist"));
app.get("*",(req,res)=>{
    res.sendFile("/home/omp/websites/roastmyinterview/dist/index.html");
});

app.listen(3100,()=>{
    console.log(`Server running on port 3100`);
})

