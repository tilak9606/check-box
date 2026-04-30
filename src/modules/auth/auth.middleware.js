import ApiError from "../../common/utils/api-error.js";
import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import { eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import {User} from "./auth.models.js";

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw ApiError.unauthorized("Not authentucated");
    }

    const decoded = verifyRefreshToken(token);
    const user = await db.query.User.findFirst({
      where: eq(User.user_id, decoded.user_id),
    });
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    req.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export { authenticate };
