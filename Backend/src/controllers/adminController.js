import { findPendingUsers, approveUserById } from "../models/userModel.js";
import { createNotification } from "../models/notificationModel.js";
import { sendAccountApprovedEmail } from "../services/emailService.js";
import database from "../config/Database.js";

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
    `);
    res.status(200).json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load message logs" });
  }
};

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
