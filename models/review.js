const mongoose = require("mongoose");
const Booking = require("./booking");
const Room = require("./room");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review must contain text"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      max: [5, "Max average is 5"],
      min: [1, "Min average is 1"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must have a user"],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "A review must have a room"],
    },
  },
  {
    id: false,
    timestamps: true,
  }
);

reviewSchema.statics.calculateRoomAverage = async function (roomID) {
  const stats = await this.aggregate([
    {
      $match: { room: roomID },
    },
    {
      $group: {
        _id: "$room",
        nRatings: { $sum: 1 },
        avgRatings: { $avg: "$rating" },
      },
    },
  ]);

  await Room.findByIdAndUpdate(roomID, {
    rating: stats?.[0]?.avgRatings || 5,
    ratingsQuantity: stats?.[0]?.nRatings || 0,
  });
};

reviewSchema.post("save", async function () {
  this.constructor.calculateRoomAverage(this.room);
  await Booking.findOneAndUpdate(
    {
      room: mongoose.Types.ObjectId(this.room),
      user: this.user,
    },
    {
      isReviewed: true,
    }
  );
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.reviewDoc = await this.findOne().clone();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.reviewDoc.constructor.calculateRoomAverage(this.reviewDoc.room);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
