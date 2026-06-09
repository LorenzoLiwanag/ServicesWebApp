import { findPendingUsers, approveUserById, rejectUserById } from "../models/userModel.js";
import { createNotification } from "../models/notificationModel.js";
import { sendAccountApprovedEmail } from "../services/emailService.js";
import database from "../config/Database.js";
import {
  listCategoriesWithCounts,
  getCategoryById,
  findByName,
  getServiceCount,
  insertCategory,
  updateCategoryById,
  setActiveStatus,
  deleteCategoryById,
  getUncategorizedServices,
  assignCategoryToService,
} from "../models/categoryModel.js";

export const getPendingUsers = async (req, res) => {
  try {
    const users = await findPendingUsers();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to load pending users" });
  }
};

export const approveUser = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!targetId) return res.status(400).json({ message: "Invalid user ID" });

    const [rows] = await database.execute(
      `SELECT id, first_name, email, approval_status FROM users WHERE id = ?`,
      [targetId]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.approval_status === "approved") {
      return res.status(400).json({ message: "User is already approved" });
    }

    await approveUserById(targetId, req.userId);

    createNotification({
      userId: targetId,
      type: "account_approved",
      title: "Account approved",
      message: "Your account has been approved. You can now log in and use Subic Bay Home Services.",
    }).catch((err) => {
      console.error("[NOTIFICATION ERROR] Failed to create account approved notification:", err.message);
    });

    sendAccountApprovedEmail({ to: target.email, firstName: target.first_name }).catch((err) => {
      console.error("[EMAIL ERROR] Failed to send account approved email:", err.message);
    });

    res.status(200).json({
      message: "User approved successfully",
      user: { id: targetId, approval_status: "approved" },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve user" });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!targetId) return res.status(400).json({ message: "Invalid user ID" });

    const [rows] = await database.execute(
      `SELECT id, first_name, approval_status FROM users WHERE id = ?`,
      [targetId]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.approval_status !== "pending") {
      return res.status(400).json({ message: "Only pending users can be rejected" });
    }

    const { reason } = req.body;
    await rejectUserById(targetId, req.userId, reason || null);

    createNotification({
      userId: targetId,
      type: "account_rejected",
      title: "Account not approved",
      message: "Your Subic Bay Home Services account registration was not approved." +
        (reason ? ` Reason: ${reason}` : ""),
    }).catch((err) => {
      console.error("[NOTIFICATION ERROR] Failed to create account rejected notification:", err.message);
    });

    res.status(200).json({
      message: "User rejected successfully",
      user: { id: targetId, approval_status: "rejected" },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject user" });
  }
};

export const getPendingServices = async (req, res) => {
  try {
    const [rows] = await database.execute(`
      SELECT
        ps.id AS serviceId,
        ps.title,
        ps.description,
        ps.pricing_type AS pricingType,
        ps.price_amount AS priceAmount,
        ps.currency,
        ps.service_location_type AS serviceLocationType,
        ps.approval_status AS approvalStatus,
        ps.created_at AS createdAt,
        ps.updated_at AS updatedAt,
        u.id AS providerId,
        u.first_name AS providerFirstName,
        u.last_name AS providerLastName,
        u.email AS providerEmail,
        sc.name AS categoryName
      FROM provider_service ps
      JOIN users u ON ps.provider_id = u.id
      LEFT JOIN service_category sc ON ps.category_id = sc.id
      WHERE ps.approval_status = 'pending' AND ps.is_deleted = FALSE
      ORDER BY ps.updated_at ASC
    `);

    const services = rows.map((r) => ({
      ...r,
      priceAmount: r.priceAmount !== null ? Number(r.priceAmount) : null,
    }));

    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ message: "Failed to load pending services" });
  }
};

export const getMessageLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const [[{ total }]] = await database.execute(
      `SELECT COUNT(*) AS total FROM message`
    );

    // NOTE: LIMIT/OFFSET are inlined (not bound) because mysql2's db.execute
    // (prepared statements) rejects placeholders in LIMIT/OFFSET on many MySQL
    // versions, which previously caused a 500. `limit` and `offset` are derived
    // from validated, clamped integers above, so inlining them is injection-safe.
    const [rows] = await database.execute(`
      SELECT
        m.id                                                                        AS messageId,
        c.id                                                                        AS conversationId,
        m.sender_id                                                                 AS senderId,
        CONCAT(sender.first_name, ' ', sender.last_name)                           AS senderName,
        sender.email                                                                AS senderEmail,
        IF(m.sender_id = c.client_id, c.provider_id, c.client_id)                 AS receiverId,
        CONCAT(receiver.first_name, ' ', receiver.last_name)                       AS receiverName,
        receiver.email                                                              AS receiverEmail,
        c.provider_service_id                                                       AS providerServiceId,
        ps.title                                                                    AS serviceTitle,
        m.body                                                                      AS messageBody,
        m.created_at                                                                AS sentAt
      FROM message m
      JOIN conversation c ON c.id = m.conversation_id
      JOIN users sender ON sender.id = m.sender_id
      JOIN users receiver ON receiver.id = IF(m.sender_id = c.client_id, c.provider_id, c.client_id)
      LEFT JOIN provider_service ps ON ps.id = c.provider_service_id
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.status(200).json({
      messages: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load message logs" });
  }
};

// ── Category management ──────────────────────────────────────────────────────

export const getCategories = async (req, res) => {
  try {
    const categories = await listCategoriesWithCounts();
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to load categories" });
  }
};

export const createCategoryHandler = async (req, res) => {
  try {
    const { name, description, parentCategoryId, sortOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (name.trim().length > 150) return res.status(400).json({ message: "Name must be 150 characters or fewer" });

    const existing = await findByName(name.trim());
    if (existing) return res.status(409).json({ message: "A category with this name already exists" });

    const newId = await insertCategory({ name: name.trim(), description, parentCategoryId, sortOrder });
    res.status(201).json({ id: newId, message: "Category created" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategoryHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category ID" });

    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const { name, description, parentCategoryId, sortOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (name.trim().length > 150) return res.status(400).json({ message: "Name must be 150 characters or fewer" });

    const conflict = await findByName(name.trim(), id);
    if (conflict) return res.status(409).json({ message: "A category with this name already exists" });

    await updateCategoryById(id, { name: name.trim(), description, parentCategoryId, sortOrder });
    res.status(200).json({ message: "Category updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deactivateCategoryHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category ID" });

    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await setActiveStatus(id, false);
    res.status(200).json({ message: "Category deactivated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate category" });
  }
};

export const reactivateCategoryHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category ID" });

    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await setActiveStatus(id, true);
    res.status(200).json({ message: "Category reactivated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reactivate category" });
  }
};

export const deleteCategoryHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid category ID" });

    const category = await getCategoryById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const count = await getServiceCount(id);
    if (count > 0) {
      return res.status(409).json({ message: `Cannot delete — ${count} service${count === 1 ? "" : "s"} reference this category. Deactivate it instead.` });
    }

    await deleteCategoryById(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export const getUncategorizedServicesHandler = async (req, res) => {
  try {
    const services = await getUncategorizedServices();
    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ message: "Failed to load uncategorized services" });
  }
};

export const assignServiceCategoryHandler = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const { categoryId } = req.body;
    if (!serviceId) return res.status(400).json({ message: "Invalid service ID" });
    if (!categoryId) return res.status(400).json({ message: "categoryId is required" });

    const category = await getCategoryById(Number(categoryId));
    if (!category) return res.status(404).json({ message: "Category not found" });

    await assignCategoryToService(serviceId, Number(categoryId));
    res.status(200).json({ message: "Category assigned" });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign category" });
  }
};

// ── Service approval ─────────────────────────────────────────────────────────

export const approveProviderService = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    if (!serviceId) return res.status(400).json({ message: "Invalid service ID" });

    const [rows] = await database.execute(
      `SELECT id, provider_id, title, approval_status FROM provider_service WHERE id = ? AND is_deleted = FALSE`,
      [serviceId]
    );
    const service = rows[0];
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (service.approval_status === "approved") {
      return res.status(400).json({ message: "Service is already approved" });
    }

    await database.execute(
      `UPDATE provider_service
       SET approval_status = 'approved', approved_at = NOW(), approved_by = ?
       WHERE id = ?`,
      [req.userId, serviceId]
    );

    await createNotification({
      userId: service.provider_id,
      type: "service_approved",
      title: "Service approved",
      message: `Your service "${service.title}" has been approved and is now visible to users.`,
    });

    res.status(200).json({
      message: "Service approved successfully",
      service: { id: serviceId, approval_status: "approved" },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve service" });
  }
};

export const rejectProviderService = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    if (!serviceId) return res.status(400).json({ message: "Invalid service ID" });

    const [rows] = await database.execute(
      `SELECT id, provider_id, title, approval_status FROM provider_service WHERE id = ? AND is_deleted = FALSE`,
      [serviceId]
    );
    const service = rows[0];
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (service.approval_status !== "pending") {
      return res.status(400).json({ message: "Only pending services can be rejected" });
    }

    const { reason } = req.body;
    await database.execute(
      `UPDATE provider_service
       SET approval_status = 'rejected', approved_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [req.userId, reason ?? null, serviceId]
    );

    createNotification({
      userId: service.provider_id,
      type: "service_rejected",
      title: "Service not approved",
      message: `Your service "${service.title}" was not approved.` +
        (reason ? ` Reason: ${reason}` : " Please review your listing and contact support if you have questions."),
    }).catch((err) => {
      console.error("[NOTIFICATION ERROR] Failed to create service rejected notification:", err.message);
    });

    res.status(200).json({
      message: "Service rejected successfully",
      service: { id: serviceId, approval_status: "rejected" },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject service" });
  }
};
