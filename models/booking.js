const mongoose = require("mongoose");
const dateFns = require("date-fns");

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Types.ObjectId,
      ref: "Room",
      required: [true, "A booking must have a room"],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "A booking must have a user"],
    },
    day: {
      type: Date,
      required: [true, "A booking must be on a specific day"],
      set: (value) => dateFns.startOfDay(new Date(value)),
    },
    from: {
      type: String,
      required: [true, `A booking must have starting time`],
      validate: {
        validator: (time) =>
          time.toString().length === 5 &&
          time.toString()[2] === ":" &&
          time.toString() >= "00:00" &&
          time.toString() < "24:00",
        message: `Starting time is invalid must be of format HH:mm as following 09:00`,
      },
    },
    to: {
      type: String,
      required: [true, `A booking must have ending time`],
      validate: {
        validator: (time) =>
          time.toString().length === 5 &&
          time.toString()[2] === ":" &&
          time.toString() >= "00:00" &&
          time.toString() < "24:00",
        message: `Ending time is invalid must be of format HH:mm as following 09:00`,
      },
    },
    pricePerHour: {
      type: Number,
      required: [true, "A booking must have a price per hour for the room"],
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    id: false,
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
