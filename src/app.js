import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import authRoutes from './routes/auth.js'


dotenv.config();

const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yourSecretKeyHere",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only secure in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",authRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timeStamp: new Date().toISOString(),
    service: "Pearl and Luxury API",
  });
});


export default app;