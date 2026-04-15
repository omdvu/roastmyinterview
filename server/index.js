import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/connectdb.js";

dotenv.config();

const app=express()
const PORT=process.env.PORT ||6000


app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
    connectDB();
})

