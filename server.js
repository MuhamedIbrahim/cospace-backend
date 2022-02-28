require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

mongoose
  .connect(process.env.DB_CONNECT, {
    autoIndex: false,
    autoCreate: false,
  })
  .then(() => console.log("DB IS CONNECTED SUCESSFULLY!!"))
  .catch((error) => {
    console.log(error);
    console.log("ERROR CONNECTING TO DB.");
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log("Server is listening...");
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
