const Review = require("../models/review");
const handlerFactory = require("./handlerFactory");

const populateOptions = ["room", "user"];

exports.getAllReviews = handlerFactory.getAllDocuments(
  Review,
  "reviews",
  populateOptions
);
exports.getReview = handlerFactory.getDocument(
  Review,
  "review",
  populateOptions
);
exports.createReview = handlerFactory.createDocument(Review, "review");
exports.updateReview = handlerFactory.updateDocument(Review, "review");
exports.deleteReview = handlerFactory.deleteDocument(Review);
