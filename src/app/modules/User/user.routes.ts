import express, { NextFunction, Request, Response } from "express";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  userControllers.getUsers,
);
router.get("/me", auth("user", "admin", "super_admin"), userControllers.getMe);
router.patch(
  "/edit-profile",
  auth("user", "admin", "super_admin"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.editProfile,
);

export const userRoutes = router;
