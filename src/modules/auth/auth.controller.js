import * as authService from "./auth.services.js";
import ApiResponse from "../../common/utils/api-response.js";

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    ApiResponse.created(
      res,
      "User registered successfully, Verify your Email",
      user,
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    });


    ApiResponse.ok(res, "Login successful", { user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { accessToken } = await authService.refresh(token);
    ApiResponse.ok(res, "Token refreshed successfully", { accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.user_id);
    res.clearCookie("refreshToken");
    ApiResponse.ok(res, "Logout successful");
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  refreshToken,
  logout,
};
