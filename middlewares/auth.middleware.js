import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken";

// Middleware to check if user is logged in
const isLoggedIn = async (req, res, next) => {
  try {
    // extracting token from the cookies
    const { token } = req.cookies;

    if (!token) {
      return next(new AppError("Unauthorized, please login to continue", 401));
    }

    // Verify token and decode user info
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    if (!userDetails) {
      return next(new AppError("Unauthorized, please login to continue", 401));
    }

    req.user = userDetails;

    next();
  } catch (error) {
    return next(new AppError("Unauthorized, please login to continue", 401));
  }
};

export { isLoggedIn };
