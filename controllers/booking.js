const Booking = require("../models/booking");
const Room = require("../models/room");
const { catchAsync } = require("./error");
const handlerFactory = require("./handlerFactory");
const dateFns = require("date-fns");
const AppError = require("../utils/appError");
const {
  Types: { ObjectId },
} = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const populateOptions = ["room", "room.reviews", "user"];

exports.getAllBookings = handlerFactory.getAllDocuments(
  Booking,
  "bookings",
  populateOptions
);
exports.getBooking = handlerFactory.getDocument(
  Booking,
  "booking",
  populateOptions
);
exports.createBooking = handlerFactory.createDocument(Booking, "booking");
exports.updateBooking = handlerFactory.updateDocument(Booking, "booking");
exports.deleteBooking = handlerFactory.deleteDocument(Booking);

exports.getCurrentUserBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({
    user: ObjectId(req.user._id),
  }).populate("room");

  res.status(200).json({
    message: "successful",
    data: {
      bookings,
    },
  });
});

exports.getRoomDayBooking = catchAsync(async (req, res, next) => {
  if (!req.body.day || !dateFns.isMatch(req.body.day, "yyyy-MM-dd"))
    return next(
      new AppError(
        "Please provide the required booking date in format of yyyy-mm-dd as following 2022-01-20",
        400
      )
    );

  const bookings = await Booking.find({
    room: ObjectId(req.params.roomID),
    day: new Date(req.body.day),
  });

  res.status(200).json({
    message: "successful",
    data: {
      bookings: bookings.map((booking) => ({
        day: booking.day,
        from: booking.from,
        to: booking.to,
      })),
    },
  });
});

exports.createPaymentLink = catchAsync(async (req, res, next) => {
  const { from, to, day } = req.body;

  if (!from || !to || !day)
    return next(
      new AppError("Please provide a correct day and timings formats", 400)
    );

  const room = await Room.findById(req.params.roomID);
  if (!room) return next(new AppError("Room is not found", 400));

  const websiteURL =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE_URL
      : process.env.PROD_BASE_URL;

  const booking_user_id = req.user._id.toString();
  const booking_room_id = req.params.roomID;

  const session = await stripe.checkout.sessions.create({
    cancel_url: `${websiteURL}/rooms/${room.slug}`,
    success_url: `${websiteURL}/profile/bookings`,
    mode: "payment",
    client_reference_id: booking_room_id,
    customer_email: req.user.email,
    payment_method_types: ["card"],
    line_items: [
      {
        name: room.name,
        description: room.description || room.title,
        images: [`${websiteURL}/images/rooms/${room.image}`],
        amount: (to - from) * room.pricePerHour * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
    metadata: {
      booking_room_id,
      booking_user_id,
      price_per_hour: room.pricePerHour,
      day: day,
      from_time: (from < 10 ? "0" : "") + from + ":00",
      to_time: (to < 10 ? "0" : "") + to + ":00",
    },
  });

  res.status(200).json({
    status: "successful",
    data: {
      session,
    },
  });
});

const createSuccessfulBooking = async (session) => {
  await Booking.create({
    room: session.metadata.booking_room_id,
    user: session.metadata.booking_user_id,
    pricePerHour: session.metadata.price_per_hour,
    day: session.metadata.day,
    from: session.metadata.from_time,
    to: session.metadata.to_time,
  });
};

exports.bookingCheckoutHook = (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_BOOKING_HOOK_SIGN_KEY
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      createSuccessfulBooking(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.status(200).json({ received: true });
};
