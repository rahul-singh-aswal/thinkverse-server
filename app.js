import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "dotenv";
import userRoutes from "./routes/user.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import courseRoutes from "./routes/course.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  next();
});

app.use(express.json());

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("pong");
});

//  user routes
app.use("/api/v1/user", userRoutes);

// course routes
app.use("/api/v1/courses", courseRoutes);

// payment routes
app.use("/api/v1/payments", paymentRoutes);

app.all("*", (req, res) => {
  res.status(404).send("OOPS!! 404 page not found");
});

app.use(errorMiddleware);

export default app;
