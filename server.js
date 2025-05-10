import app from "./app.js";
import connectionToDB from "./config/dbConnection.js";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectionToDB();
  console.log(`App is running at http:localhost:${PORT}`);
});
