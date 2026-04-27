import jwt from "jsonwebtoken";
import * as helpers from './helpers.js';

export function authenticate (req,res,next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")){
        return res.status(401).json({ error: "Missing token" });
    }

    const token = auth.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.uid = decoded.uid;
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export async function authenticateToken (req,res,next) {
    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export async function hasCredits (req,res,next) {
    let uid = req.uid;

    let count = await helpers.getCreditsForUid(uid);
    if (!count || count === 0) return res.status(400).json({error: "You have used up all your credits, you cannot test more unless you buy credits."})
    else next()
}
