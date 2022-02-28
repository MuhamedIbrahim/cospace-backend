const express = require("express");
const authController = require("../controllers/auth");
const roomController = require("../controllers/room");

const Router = express.Router();

Router.route("/")
  .get(roomController.getAllRooms)
  .post(
    authController.protectRoute,
    authController.restrictTo("admin"),
    roomController.uploadRoomImage,
    roomController.resizeRoomImage,
    roomController.createRoom
  );
Router.route("/:id")
  .get(roomController.getRoom)
  .patch(
    authController.protectRoute,
    authController.restrictTo("admin"),
    roomController.uploadRoomImage,
    roomController.resizeRoomImage,
    roomController.updateRoom
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin"),
    roomController.deleteRoom
  );

module.exports = Router;
