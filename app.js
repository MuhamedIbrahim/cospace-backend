const express = require("express");
const AppRouter = require("./routers");
const { errorHandler } = require("./controllers/error");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bookingController = require("./controllers/booking");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
var xss = require("xss-clean");
var hpp = require("hpp");

const app = express();

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message:
    "Too many accounts created from this IP, please try again after an hour",
});
app.use("/api", helmet(), limiter, xss(), mongoSanitize(), hpp());

app.set("trust proxy", 1);

app.use(express.static(path.join(__dirname, "public")));

const corsOptions = {
  origin: process.env.DEV_BASE_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.post(
  "/booking-checkout-hook",
  express.raw({ type: "application/json" }),
  bookingController.bookingCheckoutHook
);

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(cookieParser());

// Routes
app.use("/api/v1", AppRouter);
app.use("/*", (req, res, next) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// Error handler
app.use(errorHandler);

module.exports = app;
