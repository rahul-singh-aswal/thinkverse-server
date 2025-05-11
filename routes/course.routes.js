import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getLecturesByCourseId,
} from "../controllers/course.controller.js";
import { authorizeRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
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

router.get("/:id", isLoggedIn, getLecturesByCourseId);

export default router;
