const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const { catchAsync } = require("./error");
const allowedPopulation = require("../utils/allowedPopulation");

exports.setBodyCurrentUser = (req, res, next) => {
  if (req.user._id) req.body.user = req.user._id;
  next();
};

exports.getAllDocuments = (Model, resultsName, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const docsFeatures = await new APIFeatures(
      Model,
      req.query,
      populateOptions
    )
      .filter()
      .sort()
      .paginate()
      .project()
      .populate()
      .count();

    const docs = await docsFeatures.query;

    res.status(200).json({
      status: "successful",
      results: docs.length,
      currentPage: Math.max(0, +req.query.page || 1) || 1,
      lastPage:
        req.query.limit !== "all" && req.query.count !== false
          ? Math.ceil(docsFeatures.modelCount / (+req.query.limit || 10))
          : 1,
      data: {
        [resultsName]: docs,
      },
    });
  });

exports.getDocument = (Model, resultsName, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let doc = {};
    if (req.query.as === "slug") doc = Model.findOne({ slug: req.params.id });
    else doc = Model.findById(req.params.id);

    if (populateOptions && req.query.with)
      allowedPopulation(req.query.with, populateOptions).forEach((ref) => {
        doc = doc.populate(ref);
      });

    doc = await doc;

    if (!doc) {
      return next(
        new AppError(`Can't find a document with the requested id`, 404)
      );
    }

    res.status(200).json({
      status: "successful",
      data: {
        [resultsName]: doc,
      },
    });
  });

exports.createDocument = (Model, resultsName) =>
  catchAsync(async (req, res, next) => {
    if (req?.file?.filename) req.body.image = req.file.filename;
    else req.body.image = "";

    const newDoc = await Model.create({ ...req.body });

    res.status(201).json({
      status: "successful",
      data: {
        [resultsName]: newDoc,
      },
    });
  });

exports.updateDocument = (Model, resultsName) =>
  catchAsync(async (req, res, next) => {
    if (req?.file?.filename) req.body.image = req.file.filename;
    else req.body.image = "";

    const newDoc = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!newDoc) {
      return next(
        new AppError(`Can't find a document with the requested id`, 404)
      );
    }

    res.status(201).json({
      status: "successful",
      data: {
        [resultsName]: newDoc,
      },
    });
  });

exports.deleteDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(`Can't find a document with the requested id`, 404)
      );
    }

    res.status(204).json({
      status: "successful",
      data: null,
    });
  });
