import {
  getProviderServicesByUserId,
  createProviderServiceForUser,
  updateProviderServiceForUser,
  deleteProviderServiceForUser,
} from "../models/providerModel.js";

export const getMyProviderServices = async (req, res) => {
  try {
    const userId = Number(req.headers["x-user-id"]);

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    const services = await getProviderServicesByUserId(userId);
    res.status(200).json({ services });
  } catch (error) {
    console.error("Error loading provider services:", error);
    res.status(500).json({ message: "Failed to load provider services" });
  }
};

export const createProviderService = async (req, res) => {
  try {
    const userId = Number(req.headers["x-user-id"]);

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    const {
      categoryId,
      serviceName,
      description,
      pricingType,
      rateAmount,
      isVisible,
      providerNotes,
    } = req.body;

    if (!categoryId || !serviceName || !pricingType) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { categoryId, serviceName, pricingType },
      });
    }

    const service = await createProviderServiceForUser(userId, {
      categoryId,
      serviceName,
      description,
      pricingType,
      rateAmount,
      isVisible,
      providerNotes,
    });

    res.status(201).json({
      message: "Service added successfully",
      service,
    });
  } catch (error) {
    console.error("Error creating provider service:", error);
    res.status(500).json({
      message: error.message || "Failed to add service",
    });
  }
};

export const updateProviderService = async (req, res) => {
  try {
    const userId = Number(req.headers["x-user-id"]);
    const providerServiceId = Number(req.params.providerServiceId);

    if (!userId || !providerServiceId) {
      return res.status(400).json({ message: "Missing required ids" });
    }

    const service = await updateProviderServiceForUser(
      userId,
      providerServiceId,
      req.body
    );

    res.status(200).json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Error updating provider service:", error);
    res.status(500).json({
      message: error.message || "Failed to update service",
    });
  }
};

export const deleteProviderService = async (req, res) => {
  try {
    const userId = Number(req.headers["x-user-id"]);
    const providerServiceId = Number(req.params.providerServiceId);

    if (!userId || !providerServiceId) {
      return res.status(400).json({ message: "Missing required ids" });
    }

    await deleteProviderServiceForUser(userId, providerServiceId);

    res.status(200).json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting provider service:", error);
    res.status(500).json({
      message: error.message || "Failed to delete service",
    });
  }
};