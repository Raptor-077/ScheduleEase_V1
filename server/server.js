import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// routes
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// health
app.get("/", (req, res) => res.send("NITC Appointments Backend is running"));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
