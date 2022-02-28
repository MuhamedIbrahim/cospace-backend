const express = require("express");
const authController = require("../controllers/auth");
const userController = require("../controllers/user");

const Router = express.Router();

Router.get("/me", authController.protectRoute, authController.getMe);
Router.patch(
  "/update-profile",
  authController.protectRoute,
  userController.uploadUserImage,
  userController.resizeUserImage,
  userController.updateMe
);

Router.route("/")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    userController.getAllUsers
  )
  .post(
    authController.protectRoute,
    authController.restrictTo("admin"),
    userController.createUser
  );

Router.route("/:id")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    userController.getUser
  )
  .patch(
    authController.protectRoute,
    authController.restrictTo("admin"),
    userController.updateUser
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin"),
    userController.deleteUser
  );

module.exports = Router;
