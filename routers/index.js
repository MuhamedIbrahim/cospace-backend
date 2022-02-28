const express = require("express");
const RoomRouter = require("./room");
const AuthRouter = require("./auth");
const UserRouter = require("./user");
const ReviewRouter = require("./review");
const BookingRouter = require("./booking");
const AppError = require("../utils/appError");

const AppRouter = express.Router();

AppRouter.use("/booking", BookingRouter);
AppRouter.use("/review", ReviewRouter);
AppRouter.use("/room", RoomRouter);
AppRouter.use("/user", UserRouter);
AppRouter.use("/", AuthRouter);

AppRouter.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

module.exports = AppRouter;
