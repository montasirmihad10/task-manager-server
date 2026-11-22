import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import catchAsync from "../utils/catchAsync";

const validateRequest = (schema: z.ZodType) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
      query: req.query,
      params: req.params,
    });
    next();
  });
};

export default validateRequest;
