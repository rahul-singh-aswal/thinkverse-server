import path from "path";

import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 mb in size max limit
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req, file, cb) => {
    let ext = path.extname(file.originalname);

    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".webp" &&
      ext !== ".png" &&
      ext !== ".mp4"
    ) {
      cb(new Error(`Unsupported file type! ${ext}`), false);
      return;
    }

    cb(null, true);
  },
});

export default upload;