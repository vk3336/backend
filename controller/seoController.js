const Seo = require("../model/Seo");
const Product = require("../model/Product");
const mongoose = require("mongoose");

// Create SEO
const createSeo = async (req, res) => {
  try {
    let { product, ...seoData } = req.body;

    // Parse openGraph.images if sent as a comma-separated string
    if (seoData.openGraph && typeof seoData.openGraph.images === "string") {
      seoData.openGraph.images = seoData.openGraph.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse twitter.player_width and player_height as numbers if sent as strings
    if (seoData.twitter) {
      if (typeof seoData.twitter.player_width === "string")
        seoData.twitter.player_width = Number(seoData.twitter.player_width);
      if (typeof seoData.twitter.player_height === "string")
        seoData.twitter.player_height = Number(seoData.twitter.player_height);
    }

    // Check if product exists
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }
    }

    // Check if SEO already exists for this product
    if (product) {
      const existingSeo = await Seo.findOne({ product });
      if (existingSeo) {
        return res.status(400).json({
          success: false,
          message: "SEO data already exists for this product",
        });
      }
    }

    const seo = new Seo({
      product,
      ...seoData,
    });

    const savedSeo = await seo.save();
    const populatedSeo = await Seo.findById(savedSeo._id).populate("product");

    res.status(201).json({
      success: true,
      message: "SEO created successfully",
      data: populatedSeo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating SEO",
      error: error.message,
    });
  }
};

// Get all SEO - ULTRA FAST
const getAllSeo = async (req, res) => {
  try {
    // 🚀 PERFORMANCE OPTIMIZATIONS - NO LIMITS, ALL DATA

    // 🚀 GET ALL SEO DATA - NO PAGINATION LIMITS
    const seoList = await Seo.find();

    res.status(200).json({
      success: true,
      message: "SEO data retrieved successfully",
      data: seoList,
      total: seoList.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SEO data",
      error: error.message,
    });
  }
};

// Get SEO by ID
const getSeoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SEO ID",
      });
    }

    const seo = await Seo.findById(id).populate("product");

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "SEO retrieved successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SEO data",
      error: error.message,
    });
  }
};

// Get SEO by Product ID
const getSeoByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const seo = await Seo.findOne({ product: productId }).populate("product");

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found for this product",
      });
    }

    res.status(200).json({
      success: true,
      message: "SEO retrieved successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SEO data",
      error: error.message,
    });
  }
};

// Update SEO
const updateSeo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SEO ID",
      });
    }

    let { product, ...updateData } = req.body;

    // Parse openGraph.images if sent as a comma-separated string
    if (
      updateData.openGraph &&
      typeof updateData.openGraph.images === "string"
    ) {
      updateData.openGraph.images = updateData.openGraph.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse twitter.player_width and player_height as numbers if sent as strings
    if (updateData.twitter) {
      if (typeof updateData.twitter.player_width === "string")
        updateData.twitter.player_width = Number(
          updateData.twitter.player_width
        );
      if (typeof updateData.twitter.player_height === "string")
        updateData.twitter.player_height = Number(
          updateData.twitter.player_height
        );
    }

    // Check if product exists if it's being updated
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if SEO already exists for this product (excluding current record)
      const existingSeo = await Seo.findOne({ product, _id: { $ne: id } });
      if (existingSeo) {
        return res.status(400).json({
          success: false,
          message: "SEO data already exists for this product",
        });
      }
    }

    const updatedSeo = await Seo.findByIdAndUpdate(
      id,
      { product, ...updateData },
      { new: true, runValidators: true }
    ).populate("product");

    if (!updatedSeo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "SEO updated successfully",
      data: updatedSeo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating SEO",
      error: error.message,
    });
  }
};

// Delete SEO
const deleteSeo = async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent deletion if referenced by any Product
    const productUsing = await Product.findOne({ seo: id });
    if (productUsing) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: SEO is in use by one or more products.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SEO ID",
      });
    }
    const deletedSeo = await Seo.findByIdAndDelete(id);
    if (!deletedSeo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "SEO deleted successfully",
      data: deletedSeo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting SEO",
      error: error.message,
    });
  }
};

// Get popular products
const getPopularProducts = async (req, res) => {
  try {
    const popularProducts = await Seo.find({ popularproduct: true }).populate(
      "product"
    );
    res.status(200).json({
      success: true,
      message: "Popular products retrieved successfully",
      data: popularProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting popular products",
      error: error.message,
    });
  }
};

// Get top rated products
const getTopRatedProducts = async (req, res) => {
  try {
    const topRatedProducts = await Seo.find({ topratedproduct: true }).populate(
      "product"
    );
    res.status(200).json({
      success: true,
      message: "Top rated products retrieved successfully",
      data: topRatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting top rated products",
      error: error.message,
    });
  }
};

// Get SEO by slug
const getSeoBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const seo = await Seo.findOne({ slug }).populate("product");

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found for this slug",
      });
    }

    res.status(200).json({
      success: true,
      message: "SEO retrieved successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SEO data",
      error: error.message,
    });
  }
};

// Get SEO by productIdentifier
const getSeoByProductIdentifier = async (req, res, next) => {
  try {
    const seo = await Seo.findOne({
      productIdentifier: req.params.identifier,
    }).populate("product");
    if (!seo)
      return res.status(404).json({
        success: false,
        message: "No SEO found with this product identifier",
      });
    res.status(200).json({ success: true, data: seo });
  } catch (error) {
    next(error);
  }
};

// Get SEO by salesPrice range (±15%)
const getSeoBySalesPriceValue = async (req, res, next) => {
  const value = Number(req.params.value);
  try {
    if (isNaN(value))
      return res
        .status(400)
        .json({ success: false, message: "Invalid sales price value" });
    const range = value * 0.15;
    const min = value - range;
    const max = value + range;
    const matched = await Seo.find({
      salesPrice: { $gte: min, $lte: max },
    }).populate("product");
    if (!matched.length)
      return res
        .status(404)
        .json({ success: false, message: "No SEO found in sales price range" });
    res.status(200).json({ success: true, data: matched });
  } catch (error) {
    next(error);
  }
};

// Get SEO by purchasePrice range (±15%)
const getSeoByPurchasePriceValue = async (req, res, next) => {
  const value = Number(req.params.value);
  try {
    if (isNaN(value))
      return res
        .status(400)
        .json({ success: false, message: "Invalid purchase price value" });
    const range = value * 0.15;
    const min = value - range;
    const max = value + range;
    const matched = await Seo.find({
      purchasePrice: { $gte: min, $lte: max },
    }).populate("product");
    if (!matched.length)
      return res.status(404).json({
        success: false,
        message: "No SEO found in purchase price range",
      });
    res.status(200).json({ success: true, data: matched });
  } catch (error) {
    next(error);
  }
};

// Get SEO by ID without populating product
const getSeoByIdNoPopulate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SEO ID",
      });
    }

    // Find the SEO document with the product field (as ID, not populated)
    const seo = await Seo.findById(id);

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "SEO details retrieved successfully",
      data: seo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SEO details",
      error: error.message,
    });
  }
};

module.exports = {
  createSeo,
  getAllSeo,
  getSeoById,
  getSeoByProduct,
  updateSeo,
  deleteSeo,
  getPopularProducts,
  getTopRatedProducts,
  getSeoBySlug,
  getSeoByProductIdentifier,
  getSeoBySalesPriceValue,
  getSeoByPurchasePriceValue,
  getSeoByIdNoPopulate,
};
