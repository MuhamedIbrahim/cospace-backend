const express = require("express");
const authController = require("../controllers/auth");

const Router = express.Router();

Router.post("/signup", authController.signup);
Router.post("/login", authController.login);
Router.post("/forgot-password", authController.forgotPassword);
Router.patch("/reset-password/:token", authController.resetPassword);
Router.post("/logout", authController.logout);
Router.patch(
  "/change-password",
  authController.protectRoute,
  authController.changePassword
);

module.exports = Router;
