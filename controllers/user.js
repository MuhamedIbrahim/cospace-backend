const User = require("../models/user.js");
const handlerFactory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const { catchAsync } = require("./error.js");

const populateOptions = [
  "bookings",
  "bookings.room",
  "reviews",
  "reviews.room",
];

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.includes("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload a valid image.", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserImage = upload.single("image");

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}.jpg`;

  await sharp(req.file.buffer)
    .resize(300, 300)
    .toFormat("jpg")
    .jpeg({ quality: 90 })
    .toFile(
      path.join(__dirname, "..", "public", "images", "users", req.file.filename)
    );

  next();
});

exports.getAllUsers = handlerFactory.getAllDocuments(
  User,
  "users",
  populateOptions
);
exports.getUser = handlerFactory.getDocument(User, "user", populateOptions);
exports.createUser = handlerFactory.createDocument(User, "user");
exports.updateUser = handlerFactory.updateDocument(User, "user");
exports.deleteUser = handlerFactory.deleteDocument(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates.", 400));
  }

  const { name, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, ...(req.file ? { image: req.file.filename } : {}) },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    },
  });
});
