import { Router } from "express";
import {
  addLecturesByCourseId,
  createCourse,
  deleteCourseById,
  getAllCourses,
  getLecturesByCourseId,
  removeLectureFromCourse,
  updateCourseByCourseId,
} from "../controllers/course.controller.js";
import {
  authorizeRoles,
  authorizeSubscribers,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  );

router
  .route("/:id")
  .get(isLoggedIn, authorizeSubscribers, getLecturesByCourseId)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    // upload.single("lecture"),
    addLecturesByCourseId
  )
  .put(isLoggedIn, authorizeRoles("ADMIN"), updateCourseByCourseId)
  .delete(isLoggedIn, authorizeRoles("ADMIN"), deleteCourseById);

router
  .route("/:courseId/lectures/:lectureId")
  .delete(isLoggedIn, authorizeRoles("ADMIN"), removeLectureFromCourse);
export default router;
