import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { landingControllers } from "./landing.controller";

const router = express.Router();

/** Public — landing page reads this */
router.get("/", landingControllers.getLanding);

/** Platform admin CMS */
router.patch(
  "/",
  auth("admin", "super_admin"),
  landingControllers.updateLanding,
);

router.post(
  "/upload",
  auth("admin", "super_admin"),
  upload.single("file"),
  landingControllers.uploadImage,
);

export const LandingRoutes = router;
