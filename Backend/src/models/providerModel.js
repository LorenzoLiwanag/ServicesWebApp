import db from "../config/Database.js";

const SERVICE_SELECT = `
  SELECT
    ps.id AS providerServiceId,
    ps.title,
    ps.description,
    ps.pricing_type AS pricingType,
    ps.price_amount AS priceAmount,
    ps.currency,
    ps.service_location_type AS serviceLocationType,
    ps.is_visible AS isVisible,
    ps.is_deleted AS isDeleted,
    ps.approval_status AS approvalStatus,
    sc.id AS categoryId,
    sc.name AS categoryName
  FROM provider_service ps
  LEFT JOIN service_category sc ON ps.category_id = sc.id
`;

const mapService = (row) => ({
  ...row,
  priceAmount: row.priceAmount !== null ? Number(row.priceAmount) : null,
  isVisible: Boolean(row.isVisible),
  isDeleted: Boolean(row.isDeleted),
  approvalStatus: row.approvalStatus || "pending",
});

const ensureProviderProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT provider_id FROM provider_profile WHERE provider_id = ?`,
    [userId]
  );

  if (rows.length > 0) return;

  const [userRows] = await db.execute(
    `SELECT first_name, last_name FROM users WHERE id = ?`,
    [userId]
  );

  const displayName =
    userRows.length > 0
      ? `${userRows[0].first_name} ${userRows[0].last_name}`
      : `Provider ${userId}`;

  await db.execute(
    `INSERT INTO provider_profile (provider_id, display_name) VALUES (?, ?)`,
    [userId, displayName]
  );
};

export const getProviderProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT provider_id AS providerId, display_name AS displayName, bio,
            profile_photo_url AS profilePhotoUrl, is_provider_active AS isProviderActive,
            verification_status AS verificationStatus, average_rating AS averageRating,
            total_reviews AS totalReviews
     FROM provider_profile WHERE provider_id = ?`,
    [userId]
  );
  return rows[0] || null;
};

export const upsertProviderProfile = async (userId, { displayName, bio, isProviderActive }) => {
  const [existing] = await db.execute(
    `SELECT provider_id FROM provider_profile WHERE provider_id = ?`,
    [userId]
  );

  if (existing.length > 0) {
    await db.execute(
      `UPDATE provider_profile
       SET display_name = ?, bio = ?, is_provider_active = ?
       WHERE provider_id = ?`,
      [displayName, bio || null, isProviderActive !== false ? 1 : 0, userId]
    );
  } else {
    await db.execute(
      `INSERT INTO provider_profile (provider_id, display_name, bio, is_provider_active)
       VALUES (?, ?, ?, ?)`,
      [userId, displayName, bio || null, isProviderActive !== false ? 1 : 0]
    );
  }

  return getProviderProfile(userId);
};

export const getProviderServicesByUserId = async (userId) => {
  const [rows] = await db.execute(
    `${SERVICE_SELECT} WHERE ps.provider_id = ? AND ps.is_deleted = FALSE ORDER BY ps.id DESC`,
    [userId]
  );
  return rows.map(mapService);
};

export const createProviderServiceForUser = async (userId, data) => {
  await ensureProviderProfile(userId);

  const {
    categoryId,
    title,
    description,
    pricingType,
    priceAmount,
    currency,
    serviceLocationType,
    isVisible,
  } = data;

  const [result] = await db.execute(
    `INSERT INTO provider_service
       (provider_id, category_id, title, description, pricing_type, price_amount,
        currency, service_location_type, is_visible, approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId,
      categoryId || null,
      title,
      description || null,
      pricingType || "quote",
      pricingType === "quote" ? null : priceAmount || null,
      currency || "CAD",
      serviceLocationType || "client_home",
      isVisible !== false ? 1 : 0,
    ]
  );

  const [rows] = await db.execute(
    `${SERVICE_SELECT} WHERE ps.id = ?`,
    [result.insertId]
  );

  return mapService(rows[0]);
};

export const updateProviderServiceForUser = async (userId, providerServiceId, data) => {
  const [existing] = await db.execute(
    `SELECT id FROM provider_service WHERE id = ? AND provider_id = ? AND is_deleted = FALSE`,
    [providerServiceId, userId]
  );

  if (existing.length === 0) {
    throw new Error("Service not found");
  }

  const {
    categoryId,
    title,
    description,
    pricingType,
    priceAmount,
    currency,
    serviceLocationType,
    isVisible,
  } = data;

  await db.execute(
    `UPDATE provider_service
     SET category_id = ?, title = ?, description = ?, pricing_type = ?,
         price_amount = ?, currency = ?, service_location_type = ?, is_visible = ?,
         approval_status = 'pending', approved_at = NULL, approved_by = NULL
     WHERE id = ? AND provider_id = ?`,
    [
      categoryId || null,
      title,
      description || null,
      pricingType || "quote",
      pricingType === "quote" ? null : priceAmount || null,
      currency || "CAD",
      serviceLocationType || "client_home",
      isVisible !== false ? 1 : 0,
      providerServiceId,
      userId,
    ]
  );

  const [rows] = await db.execute(
    `${SERVICE_SELECT} WHERE ps.id = ?`,
    [providerServiceId]
  );

  return mapService(rows[0]);
};

export const toggleProviderServiceVisibility = async (userId, providerServiceId, isVisible) => {
  const [existing] = await db.execute(
    `SELECT id FROM provider_service WHERE id = ? AND provider_id = ? AND is_deleted = FALSE`,
    [providerServiceId, userId]
  );

  if (existing.length === 0) {
    throw new Error("Service not found");
  }

  await db.execute(
    `UPDATE provider_service SET is_visible = ? WHERE id = ? AND provider_id = ?`,
    [isVisible ? 1 : 0, providerServiceId, userId]
  );
};

export const deleteProviderServiceForUser = async (userId, providerServiceId) => {
  const [existing] = await db.execute(
    `SELECT id FROM provider_service WHERE id = ? AND provider_id = ?`,
    [providerServiceId, userId]
  );

  if (existing.length === 0) {
    throw new Error("Service not found");
  }

  // Soft delete so past bookings retain the reference
  await db.execute(
    `UPDATE provider_service SET is_deleted = TRUE, is_visible = FALSE WHERE id = ? AND provider_id = ?`,
    [providerServiceId, userId]
  );
};
