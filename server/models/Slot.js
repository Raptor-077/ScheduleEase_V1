import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "13:00"
  endTime: { type: String, required: true },   // "14:00"

  // Slot status logic:
  status: {
    type: String,
    enum: ["available", "requested", "blocked", "unavailable"],
    default: "available",
  },

  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Slot", slotSchema);
