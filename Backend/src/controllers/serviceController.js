import { getBrowseServices, getServiceCategories } from "../models/serviceModel.js";

export const browseServices = async (req, res) => {
  try {
    const services = await getBrowseServices();

    res.status(200).json({
      services,
    });
  } catch (error) {
    console.error("Error fetching browse services:", error);
    res.status(500).json({
      message: "Failed to fetch services",
    });
  }
};

export const listServiceCategories = async (req, res) => {
  try {
    const categories = await getServiceCategories();

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    res.status(500).json({
      message: "Failed to fetch service categories",
    });
  }
};
