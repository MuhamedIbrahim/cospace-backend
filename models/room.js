const mongoose = require("mongoose");
const dateFns = require("date-fns");
const slugify = require("slugify");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A room must have a name"],
      unique: true,
    },
    area: {
      type: Number,
      required: [true, "A room must have an area"],
    },
    maxSize: {
      type: Number,
      required: [true, "A room must have maximum number of people"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "A room must have price per hour"],
    },
    floor: Number,
    title: String,
    description: String,
    image: String,
    slug: String,
    rating: {
      type: Number,
      default: 5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    ammenities: [String],
    availability: {
      ...[
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ].reduce(
        (acc, cur) =>
          Object.assign(acc, {
            [cur]: {
              from: {
                type: String,
                required: [
                  true,
                  `Availability on ${cur.toUpperCase()} from time is required`,
                ],
                validate: {
                  validator: (time) => dateFns.isMatch(time, "HH:mm"),
                  message: `Time availability from on ${cur.toUpperCase()} is invalid must be of format HH:mm as following 09:00`,
                },
              },
              to: {
                type: String,
                required: [
                  true,
                  `Availability on ${cur.toUpperCase()} to time is required`,
                ],
                validate: {
                  validator: (time) => dateFns.isMatch(time, "HH:mm"),
                  message: `Time availability to on ${cur.toUpperCase()} is invalid must be of format HH:mm as following 09:00`,
                },
              },
              on: {
                type: Boolean,
                default: false,
              },
            },
          }),
        {}
      ),
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    id: false,
  }
);

roomSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "room",
  localField: "_id",
});

roomSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
