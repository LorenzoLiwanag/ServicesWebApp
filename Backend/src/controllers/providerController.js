import {
  getProviderProfile,
  upsertProviderProfile,
  getProviderServicesByUserId,
  createProviderServiceForUser,
  updateProviderServiceForUser,
  toggleProviderServiceVisibility,
  deleteProviderServiceForUser,
} from "../models/providerModel.js";
import { createNotification } from "../models/notificationModel.js";
import { findAllAdminIds } from "../models/userModel.js";

const getUserId = (req) => Number(req.userId || req.headers["x-user-id"]);

export const getMyProviderProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const profile = await getProviderProfile(userId);
    res.status(200).json({ profile });
  } catch (err) {
    console.error("Error loading provider profile:", err);
    res.status(500).json({ message: "Failed to load provider profile" });
  }
};

export const updateMyProviderProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { displayName, bio, isProviderActive } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: "Display name is required" });
    }

    const profile = await upsertProviderProfile(userId, { displayName, bio, isProviderActive });
    res.status(200).json({ message: "Provider profile saved", profile });
  } catch (err) {
    console.error("Error saving provider profile:", err);
    res.status(500).json({ message: "Failed to save provider profile" });
  }
};

export const getMyProviderServices = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const services = await getProviderServicesByUserId(userId);
    res.status(200).json({ services });
  } catch (err) {
    console.error("Error loading provider services:", err);
    res.status(500).json({ message: "Failed to load provider services" });
  }
};

export const createProviderService = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { title, categoryId, description, pricingType, priceAmount, currency, serviceLocationType, isVisible } = req.body;

    if (!title || !pricingType) {
      return res.status(400).json({ message: "Title and pricing type are required" });
    }

    const service = await createProviderServiceForUser(userId, {
      categoryId,
      title,
      description,
      pricingType,
      priceAmount,
      currency,
      serviceLocationType,
      isVisible,
    });

    const adminIds = await findAllAdminIds();
    await Promise.all(adminIds.map((adminId) =>
      createNotification({
        userId: adminId,
        type: "service_pending_approval",
        title: "New service pending approval",
        message: `A new service "${service.title}" has been submitted and is awaiting your review.`,
      })
    ));

    res.status(201).json({ message: "Service submitted successfully. It is now pending admin approval.", service });
  } catch (err) {
    console.error("Error creating provider service:", err);
    res.status(500).json({ message: err.message || "Failed to create service" });
  }
};

export const updateProviderService = async (req, res) => {
  try {
    const userId = getUserId(req);
    const providerServiceId = Number(req.params.providerServiceId);

    if (!userId || !providerServiceId) {
      return res.status(400).json({ message: "Missing required ids" });
    }

    const service = await updateProviderServiceForUser(userId, providerServiceId, req.body);

    const adminIds = await findAllAdminIds();
    await Promise.all(adminIds.map((adminId) =>
      createNotification({
        userId: adminId,
        type: "service_pending_approval",
        title: "Updated service pending approval",
        message: `Service "${service.title}" was updated and is awaiting re-approval.`,
      })
    ));

    res.status(200).json({ message: "Service updated successfully. Changes are pending admin approval.", service });
  } catch (err) {
    if (err.message === "Service not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error("Error updating provider service:", err);
    res.status(500).json({ message: err.message || "Failed to update service" });
  }
};

export const patchProviderServiceVisibility = async (req, res) => {
  try {
    const userId = getUserId(req);
    const providerServiceId = Number(req.params.providerServiceId);
    const { isVisible } = req.body;

    if (!userId || !providerServiceId) {
      return res.status(400).json({ message: "Missing required ids" });
    }

    await toggleProviderServiceVisibility(userId, providerServiceId, isVisible);
    res.status(200).json({ message: `Service ${isVisible ? "shown" : "hidden"} successfully` });
  } catch (err) {
    if (err.message === "Service not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error("Error toggling service visibility:", err);
    res.status(500).json({ message: "Failed to update service visibility" });
  }
};

export const deleteProviderService = async (req, res) => {
  try {
    const userId = getUserId(req);
    const providerServiceId = Number(req.params.providerServiceId);

    if (!userId || !providerServiceId) {
      return res.status(400).json({ message: "Missing required ids" });
    }

    await deleteProviderServiceForUser(userId, providerServiceId);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    if (err.message === "Service not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error("Error deleting provider service:", err);
    res.status(500).json({ message: err.message || "Failed to delete service" });
  }
};
