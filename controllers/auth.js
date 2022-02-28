const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { catchAsync } = require("./error");
const { promisify } = require("util");
const crypto = require("crypto");
const validator = require("validator");
const AppError = require("../utils/appError");
const Email = require("../utils/sendEmail");
const dateFns = require("date-fns");

exports.protectRoute = catchAsync(async (req, res, next) => {
  let token = "";
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ") &&
    req.headers.authorization.split(" ")?.[1]
  )
    token = req.headers.authorization.split(" ")[1];
  else if (req?.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token || token === null || token === "null")
    return next(new AppError("Unauthorized", 401));

  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
    {
      maxAge: process.env.JWT_EXPIRY,
    }
  );

  //Check if user still exists
  const user = await User.findById(decodedToken._id).select(
    "+passwordChangedAt +password"
  );
  if (!user) return next(new AppError("User not found", 404));

  //Check if user changed password after issuing date
  if (user.isPasswordChangedAfter(decodedToken.iat * 1000))
    return next(new AppError("Unauthorized", 401));

  req.user = user;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    next();
  };
};

const signToken = (_id) =>
  jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });

const createSendTokenResponse = (user, statusCode, res, req) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: dateFns.add(new Date(), { days: +process.env.JWT_COOKIE_EXPIRY }),
    httpOnly: true,
  };

  if (
    process.env.NODE_ENV === "production" &&
    (req.secure || req.headers["X-Forwarded-Proto"] === "https")
  )
    cookieOptions.secure = true;

  res.cookie("token", token, cookieOptions);

  return res.status(statusCode).json({
    status: "successful",
    token,
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
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({ name, email, password, passwordConfirm });
  createSendTokenResponse(user, 201, res, req);
});

exports.login = catchAsync(async (req, res, next) => {
  const { password, email } = req.body;

  if (!password || !email || !validator.isEmail(email.toString()))
    return next(new AppError("Please provide email and password.", 400));

  const user = await User.findOne({ email }).select("+password");

  let isCorrectPassword = false;
  if (user)
    isCorrectPassword = await user.correctPassword(password, user.password);

  if (!user || !isCorrectPassword)
    return next(new AppError("Incorrect email or password.", 401));

  createSendTokenResponse(user, 200, res, req);
});

exports.logout = (req, res) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "successful" });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email || !validator.isEmail(req.body.email))
    return next(new AppError("Please enter a valid email address", 400));

  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("User not found", 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateModifiedOnly: true });

  try {
    await new Email(
      user,
      `${
        process.env[
          process.env.NODE_ENV === "development"
            ? "DEV_BASE_URL"
            : "PROD_BASE_URL"
        ]
      }/reset-password/${resetToken}`
    ).sendPasswordReset();

    return res.status(200).json({
      status: "successful",
      message: "Token is sent to your email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;

    await user.save({ validateModifiedOnly: true });

    return next(
      new AppError(
        "Error occured while sending you a reset email. Please try again",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiry: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Token is invalid or expired", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiry = undefined;

  await user.save({ validateModifiedOnly: true });

  return res.status(204).json({
    status: "successful",
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const isCorrectPassword = await req.user.correctPassword(
    req.body.password,
    req.user.password
  );

  if (!isCorrectPassword)
    return next(new AppError("Incorrect current password", 401));

  req.user.password = req.body.newPassword;
  req.user.passwordConfirm = req.body.newPasswordConfirm;

  await req.user.save({ validateModifiedOnly: true });

  createSendTokenResponse(req.user, 200, res, req);
});

exports.getMe = catchAsync(async (req, res, next) => {
  return res.status(200).json({
    status: "successful",
    data: {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        image: req.user.image,
        role: req.user.role,
      },
    },
  });
});
