import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken";

// Middleware to check if user is logged in
export const isLoggedIn = async (req, res, next) => {
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

// Middleware to check if user is admin or not
export const authorizeRoles =
  (...roles) =>
  async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to view this route", 403)
      );
    }

    next();
  };
