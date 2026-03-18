import { getAllServicesFromDb } from "../models/serviceModel.js";

export const getAllServices = async (req, res) => {
  try {
    const services = await getAllServicesFromDb();

    res.status(200).json({
      services
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};