import Slot from "../models/Slot.js";

// GET /api/slots
export const getSlots = async (req, res) => {
  try {
    const filter = { is_deleted: false };

    if (req.query.date) {
      // parse ?date=YYYY-MM-DD
      filter.date = new Date(req.query.date);
    }

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/slots/create (Admin only)
export const createSlot = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const { date, startTime, endTime, status } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slot = await Slot.create({
      date: new Date(date),
      startTime,
      endTime,
      status: status || "available",
      created_by: req.user._id,
    });

    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/slots/:id/status (Admin only)
export const updateSlotStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const { status } = req.body;
    const allowed = ["available", "requested", "blocked", "unavailable"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!slot) return res.status(404).json({ message: "Slot not found" });

    res.json(slot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/slots/:id (Soft delete, Admin)
export const deleteSlot = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const slot = await Slot.findByIdAndUpdate(req.params.id, { is_deleted: true }, { new: true });

    if (!slot) return res.status(404).json({ message: "Slot not found" });

    res.json({ message: "Slot deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
