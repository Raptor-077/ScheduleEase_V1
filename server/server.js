import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import cors from "cors"; // ✅ Add this import
import { connectDB } from "./config/db.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";


import MongoStore from "connect-mongo";




dotenv.config();
await connectDB();

import "./config/passport.js"; // 👈 load passport config

const app = express();

// ✅ CORS middleware must come BEFORE session + routes
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ your React frontend
    credentials: true,               // ✅ allow cookies / sessions
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // same DB you use for your app
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    },
  })
);

app.use(express.json());

// ✅ Setup session middleware (required for passport)
app.use(
  session({
    name: "connect.sid", // must match clearCookie name
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true only in production HTTPS
      sameSite: "lax",
      path: "/", // must match clearCookie path
    },
  })
);

// ✅ Initialize Passport (AFTER session)
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes (AFTER passport + CORS)
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// ✅ Health check
app.get("/", (req, res) => res.send("NITC Appointments Backend is running"));

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
