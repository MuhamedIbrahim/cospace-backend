const express = require("express");
const authController = require("../controllers/auth");
const { setBodyCurrentUser } = require("../controllers/handlerFactory");
const reviewController = require("../controllers/review");

const Router = express.Router();

Router.route("/")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    reviewController.getAllReviews
  )
  .post(
    authController.protectRoute,
    authController.restrictTo("user"),
    setBodyCurrentUser,
    reviewController.createReview
  );

Router.route("/:id")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    reviewController.getReview
  )
  .patch(
    authController.protectRoute,
    authController.restrictTo("admin"),
    reviewController.updateReview
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin"),
    reviewController.deleteReview
  );

module.exports = Router;
