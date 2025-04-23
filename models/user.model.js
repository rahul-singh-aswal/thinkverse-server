import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: {
      type: "String",
      required: [true, "Full name is required"],
      minLength: [
        5,
        "Please ensure your full name must be at least of 5 characters",
      ],
      maxLength: [
        50,
        "Please ensure your full name does not exceed 50 characters",
      ],
      lowercase: true,
      trim: true,
    },
    email: {
      type: "String",
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email address",
      ], // Matches email against regex
    },
    password: {
      type: "String",
      required: [true, "Password is required"],
      minLength: [
        8,
        "Please ensure your password must be at least of 8 characters",
      ],
      // maxLength: [
      //   72,
      //   "Please ensure your password does not exceed 30 characters",
      // ],
      select: false, // Will not select password upon looking up a document
    },

    avatar: {
      public_id: {
        type: "String",
      },
      secure_url: {
        type: "String",
      },
    },
    role: {
      type: "String",
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// Hashes password before saving to the database
userSchema.pre("save", async function (next) {
  // If password is not modified then do not hash it
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  // method which will help us compare plain password with hashed password and returns true or false
  comparePassword: async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  },

  // Will generate a JWT token with user id as payload
  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id_,
        email: this.email,
        subscription: this.subscription,
        role: this.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY,
      }
    );
  },
};

const User = model("User", userSchema);

export default User;
