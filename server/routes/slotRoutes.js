// import express from "express";
// import {
//   getSlots,
//   createSlot,
//   updateSlot,
//   deleteSlot
// } from "../controllers/slotController.js";

// const router = express.Router();

// router.route("/")
//   .get(getSlots)
//   .post(createSlot);

// router.route("/:id")
//   .put(updateSlot)
//   .delete(deleteSlot);

// export default router;


// routes/slotRoutes.js
import express from "express";
import { createSlot, getSlots, updateSlotStatus } from "../controllers/slotController.js";
const router = express.Router();

router.post("/create", createSlot);       // POST /api/slots/create
router.get("/", getSlots);                // GET /api/slots
router.put("/:id/status", updateSlotStatus); // PUT /api/slots/:id/status

export default router;
