import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";
import db from "./db.js";

dotenv.config();

export async function extractText(buffer) {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();

    return result.text;
}

export function parseGeminiResponse(raw) {
    try {
        const cleaned = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleaned);
    } catch (err) {
        console.log("Parsing failed:", err);
        return null;
    }
}

export async function authenticateUser(uid, email, name) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.execute(
        "SELECT * FROM users WHERE uid = ? for update",
        [uid]
    );

    let user;
    if (rows.length > 0) {
        user = rows[0];
    } else {
        await conn.execute("insert into users(name, uid, email) values(?,?,?)",[name, uid, email]);

        const [newUser] = await conn.execute(`
            select * from users where uid = ?
        `,[uid]);
        user = newUser[0];
    }

    await conn.commit();
    conn.release();

    return user;
}

export async function getCreditsForUid(uid) {
    const [rows] = await db.execute(
        "select credits from users where uid = ? for update",
        [uid]
    )
    if (rows.length) return rows[0].credits;
    else return null;
}

export async function getRankOfUidOnAvgScore(uid) {
    const [all] = await db.execute(`
        SELECT uid, (total_score / NULLIF(total_checks, 0)) AS avg_score
        FROM users
        ORDER BY avg_score DESC
    `);

    const index = all.findIndex(u => u.uid === uid);

    return {rank:index+1,outof:all.length,avgscore:Number(all[index].avg_score).toFixed(2)};
}

export async function calculatePromptExpense(uid,newscore) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
    
        const [status] = await conn.execute("update users set credits = credits-1,total_checks=total_checks+1, last_check=NOW(), total_score=total_score + ? where uid = ? and credits-1 >= 0",[newscore,uid]);
        if (status.affectedRows !== 1) throw new Error();

        await conn.commit();
        return true;
    }
    catch (err) {
        await conn.rollback();
        return false;
    }
    finally {
        conn.release();
    }
}

export async function validatePayment(payload) {
    let [status] = await db.execute("update users set credits=credits+? where email = ?", [Math.floor(payload.price), payload.email.trim()]);
    if (status.affectedRows !== 1) return false
    else return true;
}

export async function getEmailFromUid(conn=db, uid) {
    let [email] = await conn.execute("select email from users where uid = ?",[uid]);
    return email[0].email;
}

export async function favoriteResponse(resp,uid) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        const email = await getEmailFromUid(conn,uid);
        const status = await conn.execute(`
            insert into favorite_responses(uid,email,response) values(?,?,?)
        `,[uid,email,resp]);

        await conn.commit();
        return true;
    }
    catch (err) {
        console.log(err);
        await conn.rollback();
        return false;
    }
    finally {
        conn.release();
    }
}

export async function getFavoriteResponseByUid(uid) {
    let [rows] = await db.execute("select * from favorite_responses where uid = ?",[uid]);
    return rows;
}