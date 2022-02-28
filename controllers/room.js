const Room = require("../models/room");
const handlerFactory = require("./handlerFactory");
const AppError = require("../utils/appError");
const { catchAsync } = require("./error");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const populateOptions = ["reviews", "reviews.user"];

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.includes("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Please upload a valid image with dimensions of at least 800x800 pixels.",
        400
      ),
      false
    );
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadRoomImage = upload.single("image");

exports.resizeRoomImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `room-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(1000, 1000)
    .toFormat("jpg")
    .jpeg({ quality: 90 })
    .toFile(
      path.join(__dirname, "..", "public", "images", "rooms", req.file.filename)
    );

  next();
});

exports.getAllRooms = handlerFactory.getAllDocuments(
  Room,
  "rooms",
  populateOptions
);
exports.getRoom = handlerFactory.getDocument(Room, "room", populateOptions);
exports.createRoom = handlerFactory.createDocument(Room, "room");
exports.updateRoom = handlerFactory.updateDocument(Room, "room");
exports.deleteRoom = handlerFactory.deleteDocument(Room);
