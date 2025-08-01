const { body, validationResult } = require("express-validator");
const Subfinish = require("../model/Subfinish");
const Finish = require("../model/Finish");
const Product = require("../model/Product");

exports.validate = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .notEmpty()
    .withMessage("Name is required"),
  body("finish")
    .notEmpty()
    .withMessage("Finish reference is required")
    .isMongoId()
    .withMessage("Finish must be a valid Mongo ID")
    .custom(async (value) => {
      const exists = await Finish.exists({ _id: value });
      if (!exists) throw new Error("Referenced finish does not exist");
      return true;
    }),
];

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { name, finish } = req.body;
    const item = new Subfinish({ name, finish });
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.viewAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const page = parseInt(req.query.page) || 1;
    const fields = req.query.fields
      ? req.query.fields.split(",").join(" ")
      : "";
    const skip = (page - 1) * limit;
    const items = await Subfinish.find({}, fields)
      .skip(skip)
      .limit(limit)
      .lean()
      .populate("finish", "name");
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.viewById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Subfinish.findById(id).populate("finish", "name");
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const { name, finish } = req.body;
    const updateData = { name, finish };
    const updated = await Subfinish.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent deletion if referenced by any product
    const productUsing = await Product.findOne({ subfinish: id });
    if (productUsing) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: Subfinish is in use by one or more products.",
      });
    }
    const deleted = await Subfinish.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  create: exports.create,
  viewAll: exports.viewAll,
  viewById: exports.viewById,
  update: exports.update,
  deleteById: exports.deleteById,
  validate: exports.validate,
};
