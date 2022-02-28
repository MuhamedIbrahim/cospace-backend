const express = require("express");
const authController = require("../controllers/auth");
const bookingController = require("../controllers/booking");

const Router = express.Router();

Router.post("/room-day-bookings/:roomID", bookingController.getRoomDayBooking);

Router.post(
  "/checkout-session/:roomID",
  authController.protectRoute,
  bookingController.createPaymentLink
);

Router.get(
  "/my-bookings",
  authController.protectRoute,
  bookingController.getCurrentUserBookings
);

Router.route("/")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    bookingController.getAllBookings
  )
  .post(
    authController.protectRoute,
    authController.restrictTo("admin"),
    bookingController.createBooking
  );
Router.route("/:id")
  .get(
    authController.protectRoute,
    authController.restrictTo("admin"),
    bookingController.getBooking
  )
  .patch(
    authController.protectRoute,
    authController.restrictTo("admin"),
    bookingController.updateBooking
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin"),
    bookingController.deleteBooking
  );
module.exports = Router;
