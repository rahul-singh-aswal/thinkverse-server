import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import { v2 as cloudinary } from "cloudinary";
// import fs from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import { promises as fs } from "fs";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: true,
};

// User registration controller function
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return next(new AppError("All fields are required", 400));
    }
    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(new AppError("Email already exists", 400));
    }

    const user = await User.create({
      fullName,
      email,
      password,
      avatar: {
        public_id: email,
        secure_url:
          "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
      },
    });

    if (!user) {
      return next(
        new AppError("User registration failed, please try again", 400)
      );
    }

    // File upload

    // Run only if user sends a file

    /*
    if (req.file) {
      try {
        console.log("Uploading file:", req.file);
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "lms", // Save files in a folder named lms
          width: 250,
          height: 250,
          gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
          crop: "fill",
          timeout: 60000, // Add a longer timeout (in ms)
        });

        // If success
        if (result) {
          // Set the public_id and secure_url in DB
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
        }

        const filePath = path.resolve("uploads", req.file.filename);
    try {
      await fs.rm(filePath);
      console.log("File deleted successfully");
    } catch (err) {
      console.error("File deletion error:", err);
    }
      } catch (error) {
        return next(new AppError("File not uploaded, please try again", 400));
      }
    }
    */
    /*
   if (req.file) {
    const buffer = await readFile(req.file.path);

await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    },
    async (error, result) => {
      if (error) return reject(error);

      user.avatar.public_id = result.public_id;
      user.avatar.secure_url = result.secure_url;

      // Delete file
      await fs.rm(req.file.path);
      resolve(result);
    }
  );

  stream.end(buffer);
});
   }

*/

    if (req.file) {
      const filePath = path.resolve("uploads", req.file.filename);

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
          timeout: 60000,
        });

        // If upload successful, save in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        // Don't return here — move on to file delete
      }

      // File must always be deleted from server
      try {
        await fs.rm(filePath);
        console.log("File deleted from server.");
      } catch (deleteError) {
        console.error("Error deleting file:", deleteError);
      }
    }

    /*
    if (req.file) {
      console.log("Received file:", req.file); // Step 1
    
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        });
    
        console.log("Cloudinary upload result:", result); // Step 2
    
        if (result) {
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
    
          // Step 3: Delete file
          const filePath = path.resolve("uploads", req.file.filename);
          try {
            await fs.rm(filePath);
            console.log("File deleted:", filePath);
          } catch (deleteError) {
            console.error("Error while deleting file:", deleteError);
          }
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error); // Step 4
        return next(new AppError("File not uploaded, please try again", 500));
      }
    }*/

    /*

      if (req.file) {
        console.log("Got file:", req.file.filename);
        const filePath = path.resolve("uploads", req.file.filename);
        try {
          await fs.rm(filePath);
          console.log("Deleted:", filePath);
        } catch (err) {
          console.error("Delete error:", err);
        }
      }
      */

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTToken();

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// User login controller function
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.comparePassword(password)) {
      return next(new AppError("Email or password does not match ", 400));
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// User logout controller function
export const logout = (req, res) => {
  try {
    // Clear the 'token' cookie by setting it to null and expiring it immediately
    res.cookie("token", null, {
      secure: true,
      maxAge: 0,
      httpOnly: true, // Prevent access to the cookie via client-side JavaScript
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return next(new AppError("Logout failed. Please try again.", 500));
  }
};

// Get user profile details controller function
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    return next(new AppError("Failed to fetch profile details.", 500));
  }
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!email) {
    return next(new AppError("Email not registered", 400));
  }

  const resetToken = await user.generatePasswordResetToken();

  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  console.log(resetPasswordUrl);

  const subject = "Reset Password";
  const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to ${email} successfully`,
    });
  } catch (error) {
    // If some error happened we need to clear the forgotPassword* fields in our DB
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    return next(
      new AppError(
        error.message || "Something went wrong, please try again.",
        500
      )
    );
  }
};

export const resetPassword = async (req, res, next) => {
  // Extracting resetToken from req.params object
  const { resetToken } = req.params;

  // Extracting password from req.body object
  const { password } = req.body;

  // We are again hashing the resetToken using sha256 since we have stored our resetToken in DB using the same algorithm
  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Check if password is not there then send response saying password is required
  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  console.log(forgotPasswordToken);

  // Checking if token matches in DB and if it is still valid(Not expired)
  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
  });

  // If not found or expired send the response
  if (!user) {
    return next(
      new AppError("Token is invalid or expired, please try again", 400)
    );
  }

  // Update the password if token is valid and not expired
  user.password = password;

  // making forgotPassword* valus undefined in the DB
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  // Saving the updated user values
  await user.save();

  // Sending the response when everything goes good
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

export const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user.id;

  if (!oldPassword || !newPassword) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new AppError("User does not exist", 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }

  user.password = newPassword;

  await user.save();

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};
