import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { UserModel } from "../modules/User/user.model";
import AppError from "../erros/AppError";
import { JwtPayload, TUserRole } from "../interface/global";
import { verifyToken } from "../utils/jwt/jwt";

/**
 * Extract JWT from:
 * 1) Authorization: Bearer <token>
 * 2) accessToken cookie (httpOnly, set on login)
 */
const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookieToken = req.cookies?.accessToken;
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
};

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "No token provided or bad format",
      );
    }

    const decoded = verifyToken(
      token,
      config.JWT_SECRET_KEY as string,
    ) as JwtPayload | null;

    if (!decoded?.email || !decoded?.role) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
    }

    const { role, email, iat } = decoded;

    const user = await UserModel.isUserExistByEmail(email);
    if (!user) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "User does not exist");
    }
    if (user.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
    }

    if (
      requiredRoles.length &&
      !requiredRoles.includes(role) &&
      role !== "super_admin"
    ) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "You are not authorized to access this resource",
      );
    }

    if (
      user.passwordChangedAt &&
      iat &&
      !(await UserModel.isOldTokenValid(user.passwordChangedAt, iat))
    ) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "Token expired due to password change",
      );
    }

    req.user = decoded;
    next();
  });
};

export default auth;
