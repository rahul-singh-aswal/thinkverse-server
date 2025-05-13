import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

/**
 * @ALL_COURSES
 * @ROUTE @GET {{URL}}/api/v1/courses
 * @ACCESS Public
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select("-lectures");
    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * @CREATE_COURSE
 * @ROUTE @POST {{URL}}/api/v1/courses
 * @ACCESS Private (admin only)
 */
export const createCourse = async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fields are required"));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_id: "Dummy",
    },
  });

  if (!course) {
    return next(
      new AppError("Course could not created, please try again", 500)
    );
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      for (const file of await fs.readdir("uploads/")) {
        await fs.unlink(path.join("uploads/", file));
      }

      // Send the error message
      return next(
        new AppError(
          JSON.stringify(error) || "File not uploaded, please try again",
          400
        )
      );
    }
  }

  // Save the changes
  await course.save();

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};

/**
 * @GET_LECTURES_BY_COURSE_ID
 * @ROUTE @POST {{URL}}/api/v1/courses/:id
 * @ACCESS Private(ADMIN, subscribed users only)
 */
export const getLecturesByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Invalid course id or course not found.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Course lectures fetched successfully",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * @UPDATE_COURSE_BY_ID
 * @ROUTE @PUT {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */
export const updateCourseByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body; // add other fields as needed

    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // Update fields if provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;

    // Save changes
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * @DELETE_COURSE_BY_ID
 * @ROUTE @DELETE {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */
export const deleteCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return next(new AppError("Course with given id does not exist", 404));
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message || "Something went wrong", 500));
  }
};

/**
 * @ADD_LECTURE
 * @ROUTE @POST {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin Only)
 */
export const addLecturesByCourseId = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    let lectureData = {
      public_id: "dummy",
      secure_url: "dummy",
    };

    if (!title || !description) {
      return next(new AppError("Title and Description are required", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Invalid course id or course not found.", 400));
    }

    // Run only if user sends a file
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "lms", // Save files in a folder named lms
          chunk_size: 10000000, // 10 mb size
          resource_type: "video",
        });

        // If success
        if (result) {
          // Set the public_id and secure_url in array
          lectureData.public_id = result.public_id;
          lectureData.secure_url = result.secure_url;
        }

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      } catch (error) {
        // Empty the uploads directory without deleting the uploads directory
        for (const file of await fs.readdir("uploads/")) {
          await fs.unlink(path.join("uploads/", file));
        }

        // Send the error message
        return next(
          new AppError(
            JSON.stringify(error) || "File not uploaded, please try again",
            400
          )
        );
      }
    }

    course.lectures.push({
      title,
      description,
      lecture: lectureData,
    });

    course.numberOfLectures = course.lectures.length;

    // Save the course object
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course lecture added successfully",
      course,
    });
  } catch (error) {
    return next(new AppError(error.message || "Something went wrong", 500));
  }
};

/**
 * @Remove_LECTURE
 * @ROUTE @DELETE {{URL}}/api/v1/courses/:courseId/lectures/:lectureId
 * @ACCESS Private (Admin only)
 */
export const removeLectureFromCourse = async (req, res, next) => {};
