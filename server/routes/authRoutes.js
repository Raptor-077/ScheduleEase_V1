import express from "express";
import { oauthLogin, logoutUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ OAuth login route
router.post("/google-login", oauthLogin);

// ✅ Logout route
router.post("/logout", protect, logoutUser);

export default router;
