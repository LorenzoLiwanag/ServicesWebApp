import { getBrowseServices, getServiceCategories, getServiceById } from "../models/serviceModel.js";

export const browseServices = async (req, res) => {
  try {
    const services = await getBrowseServices();
    res.status(200).json({ services });
  } catch (err) {
    console.error("Error fetching browse services:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

export const listServiceCategories = async (req, res) => {
  try {
    const categories = await getServiceCategories();
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching service categories:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const getServiceDetail = async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    if (!serviceId) return res.status(400).json({ message: "Invalid service id" });

    const service = await getServiceById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ service });
  } catch (err) {
    console.error("Error fetching service detail:", err);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};
