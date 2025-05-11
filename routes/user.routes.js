import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  updateUser,
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/logout", isLoggedIn, logout);
router.get("/me", isLoggedIn, getProfile);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.post("/change-password", isLoggedIn, changePassword);
router.post("/update", isLoggedIn, upload.single("avatar"), updateUser);

export default router;
