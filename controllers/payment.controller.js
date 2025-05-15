import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";

/**
 * @GET_RAZORPAY_ID
 * @ROUTE @POST {{URL}}/api/v1/payments/razorpay-key
 * @ACCESS Public
 */
export const getRazorpayApiKey = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API Key",
    key: process.env.RAZORPAY_KEY_ID,
  });
};

/**
 * @ACTIVATE_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/subscribe
 * @ACCESS Private (Logged in user only)
 */
export const buySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, please login", 400));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot buy subscription", 400));
    }

    // Creating a subscription using razorpay instance
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12, // 12 means it will charge every month for a 1-year sub.
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      subscription_id: subscription.id,
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
};

export const verifySubscription = async (req, res, next) => {};

export const cancelSubscription = async (req, res, next) => {};

export const allPayments = async (req, res, next) => {};
