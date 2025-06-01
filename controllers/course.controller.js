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
  try {
    const { title, description, category, createdBy, thumbnail } = req.body;

    if (!title || !description || !category || !createdBy || !thumbnail) {
      return next(new AppError("All fields are required"));
    }

    if (
      await Course.findOne({
        title: title,
        createdBy: createdBy,
      })
    ) {
      return next(
        new AppError(
          "Course with same title from same instructor already exists"
        )
      );
    }
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_id: thumbnail.public_id,
        secure_url: thumbnail.secure_url,
      },
    });

    if (!course) {
      return next(
        new AppError("Course could not created, please try again", 500)
      );
    }

    // Save the changes
    await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    return next(new AppError("Something went wrong, please try again", 500));
  }
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
// export const updateCourseByCourseId = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//      const { title, description, category, createdBy, thumbnail } = req.body;

//     if (!title || !description || !category || !createdBy || !thumbnail) {
//       return next(new AppError("All fields are required"));
//     }

//     const course = await Course.findById(id);
//     if (!course) {
//       return next(new AppError("Course not found", 404));
//     }

//     // Update fields if provided
//     if (title) course.title = title;
//     if (description) course.description = description;
//     if (category) course.category = category;

//     // Save changes
//     await course.save();

//     res.status(200).json({
//       success: true,
//       message: "Course updated successfully",
//     });
//   } catch (error) {
//     return next(new AppError(error.message, 500));
//   }
// };

export const updateCourseByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, createdBy, thumbnail } = req.body;

  
    if (!title && !description && !category && !createdBy && !thumbnail) {
      return next(new AppError("At least one field is required for update", 400));
    }

    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // Update fields only if provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (createdBy) course.createdBy = createdBy;
    
    if (thumbnail) {
      // Validate thumbnail structure if provided
      if (!thumbnail.public_id || !thumbnail.secure_url) {
        return next(new AppError("Thumbnail must have public_id and secure_url", 400));
      }
      course.thumbnail = {
        public_id: thumbnail.public_id,
        secure_url: thumbnail.secure_url
      };
    }

    // Save changes
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        createdBy: course.createdBy,
        thumbnail: course.thumbnail,
        
      }
    });
  } catch (error) {
    console.error("Update course error:", error);
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
    const { title, description, lecture } = req.body;
    const { id } = req.params;

    if (!title || !description || !lecture?.public_id || !lecture?.secure_url) {
      return next(new AppError("All lecture fields are mandatory", 400));
    }

    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("Invalid course id or course not found.", 400));
    }

    course.lectures.push({
      title,
      description,
      lecture: {
        public_id: lecture.public_id,
        secure_url: lecture.secure_url,
      },
    });

    course.numberOfLectures = course.lectures.length;
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
export const removeLectureFromCourse = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;

    // Checking if both courseId and lectureId are present
    if (!courseId) {
      return next(new AppError("Course ID is required", 400));
    }

    if (!lectureId) {
      return next(new AppError("Lecture ID is required", 400));
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Invalid ID or Course does not exist.", 404));
    }

    // Find the index of the lecture using the lectureId
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );

    // If returned index is -1 then send error as mentioned below
    if (lectureIndex === -1) {
      return next(new AppError("Lecture does not exist.", 404));
    }

    // Delete the lecture from cloudinary

    try {
    } catch (error) {
      await cloudinary.uploader.destroy(
        course.lectures[lectureIndex].lecture.public_id,
        {
          resource_type: "video",
        }
      );
      return next(new AppError(error.message, 500));
    }

    // Remove the lecture from the array
    course.lectures.splice(lectureIndex, 1);

    // update the number of lectures based on lectres array length
    course.numberOfLectures = course.lectures.length;

    // Save the course object
    await course.save();

    // Return response
    res.status(200).json({
      success: true,
      message: "Course lecture removed successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};
