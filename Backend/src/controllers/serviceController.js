import { getBrowseServices } from "../models/serviceModel.js";

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