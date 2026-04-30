import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import RegisterDto from "./dto/register.dto.js";
import LoginDto from "./dto/login.dto.js";
const authRouter = Router();

authRouter.post("/register", validate(RegisterDto), controller.register);
authRouter.post("/login", validate(LoginDto), controller.login);
authRouter.post("/refresh-token", controller.refreshToken);
authRouter.post("/logout", authenticate, controller.logout);

export default authRouter;
