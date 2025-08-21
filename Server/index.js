import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.json({ limit: "10mb" }))
app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    }),
)


// routes
app.get('/', (req, res) => {
    res.send("Hello world");
})


app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" })
})
export default app;