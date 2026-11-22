import express from "express";
import { detailControllers } from "./detail.controller";

const router = express.Router();

router.get("/", detailControllers.getAllDetails);
router.post("/", detailControllers.createDetail);

export const DetailRoutes = router;
