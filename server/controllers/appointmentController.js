import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import { sendEmail } from "./notificationController.js";


export const getAppointmentById = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate("user")
      .populate("slot");

    if (!appt || appt.is_deleted)
      return res.status(404).json({ message: "Not found" });

    if (
      req.user.role_name !== "admin" &&
      String(appt.user._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/appointments
export const getAppointments = async (req, res) => {
  try {
    const { role_name, _id } = req.user;

    const filter = role_name === "admin"
      ? { is_deleted: false }
      : { user: _id, is_deleted: false };

    const appts = await Appointment.find(filter)
      .populate("user")
      .populate("slot")
      .sort({ createdAt: -1 });

    res.json(appts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/appointments (Booking)
export const createAppointment = async (req, res) => {
  try {
    const { slotId, title, description } = req.body;
    const { _id, role_name, email } = req.user;

    if (!slotId || !title || !description)
      return res.status(400).json({ message: "Slot, title and description required" });

    if (role_name === "admin")
      return res.status(403).json({ message: "Admin cannot book appointments" });

    const slot = await Slot.findById(slotId);
    if (!slot || slot.is_deleted)
      return res.status(404).json({ message: "Slot not found" });

    if (slot.status !== "available")
      return res.status(400).json({ message: "Slot is not available" });

    // ✅ Auto approval rules
    let appointmentStatus;
    if (role_name === "internal user") {
      appointmentStatus = "approved";
      slot.status = "blocked";
    } else {
      appointmentStatus = "pending";
      slot.status = "requested";
    }

    const appt = await Appointment.create({
      user: _id,
      slot: slot._id,
      title,
      description,
      role_name,
      status: appointmentStatus
    });

    await slot.save();

    sendEmail({
      to: email,
      subject: `Appointment ${appointmentStatus}`,
      text: `Your appointment is now ${appointmentStatus}.`
    }).catch(() => {});

    res.status(201).json(await appt.populate("slot").populate("user"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/appointments/:id (Reschedule / Edit)
export const updateAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt || appt.is_deleted) return res.status(404).json({ message: "Not found" });

    if (req.user.role_name !== "admin" && String(appt.user) !== String(req.user._id))
      return res.status(403).json({ message: "Forbidden" });

    const { slotId, title, description } = req.body;

    // If rescheduling
    if (slotId && String(slotId) !== String(appt.slot)) {
      const oldSlot = await Slot.findById(appt.slot);
      if (oldSlot) oldSlot.status = "available";

      const newSlot = await Slot.findById(slotId);
      if (!newSlot || newSlot.status !== "available")
        return res.status(400).json({ message: "New slot not available" });

      appt.slot = newSlot._id;

      // internal vs external logic on reschedule
      newSlot.status = (appt.role_name === "internal user") ? "blocked" : "requested";

      await oldSlot?.save();
      await newSlot.save();
    }

    if (title) appt.title = title;
    if (description) appt.description = description;

    if (appt.role_name === "external user")
      appt.status = "pending";

    await appt.save();

    sendEmail({
      to: req.user.email,
      subject: `Appointment Updated`,
      text: `Your appointment details have been updated.`
    }).catch(() => {});

    res.json(await appt.populate("slot").populate("user"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE = Cancel Appointment
export const deleteAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate("slot");
    if (!appt) return res.status(404).json({ message: "Not found" });

    if (req.user.role_name !== "admin" && String(appt.user) !== String(req.user._id))
      return res.status(403).json({ message: "Forbidden" });

    if (appt.slot) {
      appt.slot.status = "available";
      await appt.slot.save();
    }

    appt.is_deleted = true;
    appt.status = "cancelled";
    await appt.save();

    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN — Approve/Reject external requests
export const updateAppointmentStatus = async (req, res) => {
  try {
    if (req.user.role_name !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const appt = await Appointment.findById(req.params.id).populate("slot user");
    if (!appt) return res.status(404).json({ message: "Not found" });

    appt.status = status;
    await appt.save();

    if (status === "approved") {
      appt.slot.status = "blocked";
    } else {
      appt.slot.status = "available";
    }
    await appt.slot.save();

    sendEmail({
      to: appt.user.email,
      subject: `Appointment ${status}`,
      text: `Your appointment request has been ${status}.`
    }).catch(() => {});

    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
