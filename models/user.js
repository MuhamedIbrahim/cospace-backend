const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
    },
    email: {
      type: String,
      required: [true, "A user must have an email address"],
      lowercase: true,
      validate: {
        validator: (email) => validator.isEmail(email),
        message: "Please enter a valid email address",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    image: String,
    password: {
      type: String,
      required: [true, "A user must have a password"],
      minlength: [8, "Password length should be a minimum of 8 characters"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm the password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

userSchema.virtual("bookings", {
  ref: "Booking",
  foreignField: "user",
  localField: "_id",
});

userSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "user",
  localField: "_id",
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (this.isModified("password") && !this.isNew) {
    this.passwordChangedAt = Date.now() - 10000;
  }
  next();
});

userSchema.methods.correctPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

userSchema.methods.isPasswordChangedAfter = function (timestamp) {
  if (this.passwordChangedAt && this.passwordChangedAt.getTime() > timestamp)
    return true;
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenExpiry = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
