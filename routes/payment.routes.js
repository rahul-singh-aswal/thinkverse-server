import { Router } from "express";
import { authorizeRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from "../controllers/payment.controller.js";

const router = Router();

router.route("/razorpay-key").get(isLoggedIn, getRazorpayApiKey);

router.route("/subscribe").post(isLoggedIn, buySubscription);

router.route("/verify").post(isLoggedIn, verifySubscription);

router.route("/unsubscibe").post(isLoggedIn, cancelSubscription);

router.route("/").get(isLoggedIn, authorizeRoles("ADMIN"), allPayments);

export default router;
