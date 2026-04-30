import crypto from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, or } from "drizzle-orm";
import db from "../../common/config/db.js";
import { User } from "./auth.models.js";
import ApiError from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  const {
    password,
    accessToken,
    refreshToken,
    ...safeUser
  } = user;
  return safeUser;
};

const register = async ({ name, email, password }) => {
  const existingUser = await db.query.User.findFirst({
    where: eq(User.email, email),
  });
  if (existingUser) {
    throw ApiError.badRequest("Email already in use");
  }
  const rawToken = generateAccessToken({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  const [createdUser] = await db
    .insert(User)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning();

  return sanitizeUser(createdUser);
};

const login = async ({ email, password }) => {
  try {
    const user = await db.query.User.findFirst({
      where: eq(User.email, email),
    });
    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const accessToken = generateAccessToken({ user_id: user.user_id });
    const refreshToken = generateRefreshToken({ user_id: user.user_id });

    await db
      .update(User)
      .set({ refreshToken: refreshToken })
      .where(eq(User.user_id, user.user_id));

    return {
      user: sanitizeUser({ ...user }),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const refresh = async (token) => {
  if (!token) {
    throw ApiError.unauthorized("No refresh token provided");
  }
  const decoded = verifyRefreshToken(token);

  const user = await db.query.User.findFirst({
    where: eq(User.user_id, decoded.user_id),
  });

  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  if (!decoded) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const accessToken = generateAccessToken({ user_id: user.user_id });

  return { accessToken };
};

const logout = async (userId) => {
  await db
    .update(User)
    .set({ refreshToken: null })
    .where(eq(User.user_id, userId));
};

export {
  register,
  login,
  refresh,
  logout,
};
