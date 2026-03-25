import db from "../config/Database.js";

export const getProviderServicesByUserId = async (userId) => {
  const query = `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      s.description AS description,
      sc.name AS categoryName,
      ps.pricing_type AS pricingType,
      ps.rate_amount AS rateAmount,
      ps.is_service_visible AS isServiceVisible,
      ps.provider_notes AS providerNotes
    FROM provider_service ps
    JOIN service s
      ON ps.service_id = s.service_id
    JOIN service_category sc
      ON s.category_id = sc.category_id
    WHERE ps.provider_id = ?
    ORDER BY ps.provider_service_id DESC
  `;

  const [rows] = await db.execute(query, [userId]);
  return rows;
};

export const createProviderServiceForUser = async (userId, data) => {
  const {
    categoryId,
    serviceName,
    description,
    pricingType,
    rateAmount,
    isVisible,
    providerNotes,
  } = data;

  const [providerRows] = await db.execute(
    `SELECT provider_id FROM provider_profile WHERE provider_id = ?`,
    [userId]
  );

  if (providerRows.length === 0) {
    await db.execute(
      `
      INSERT INTO provider_profile (
        provider_id,
        is_provider_active,
        display_name,
        bio
      )
      VALUES (?, TRUE, ?, ?)
      `,
      [userId, `Provider ${userId}`, "New provider"]
    );
  }

  const [serviceRows] = await db.execute(
    `
    SELECT service_id
    FROM service
    WHERE name = ? AND category_id = ?
    LIMIT 1
    `,
    [serviceName, categoryId]
  );

  let serviceId;

  if (serviceRows.length > 0) {
    serviceId = serviceRows[0].service_id;
  } else {
    const [insertServiceResult] = await db.execute(
      `
      INSERT INTO service (
        category_id,
        name,
        description,
        is_active
      )
      VALUES (?, ?, ?, TRUE)
      `,
      [categoryId, serviceName, description || null]
    );

    serviceId = insertServiceResult.insertId;
  }

  const [insertProviderServiceResult] = await db.execute(
    `
    INSERT INTO provider_service (
      provider_id,
      service_id,
      pricing_type,
      rate_amount,
      rate_currency,
      is_service_visible,
      provider_notes,
      approval_status
    )
    VALUES (?, ?, ?, ?, 'PHP', ?, ?, 'approved')
    `,
    [
      userId,
      serviceId,
      pricingType,
      pricingType === "quote" ? null : rateAmount,
      isVisible ? 1 : 0,
      providerNotes || null,
    ]
  );

  const providerServiceId = insertProviderServiceResult.insertId;

  const [rows] = await db.execute(
    `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      s.description AS description,
      sc.name AS categoryName,
      ps.pricing_type AS pricingType,
      ps.rate_amount AS rateAmount,
      ps.is_service_visible AS isServiceVisible,
      ps.provider_notes AS providerNotes
    FROM provider_service ps
    JOIN service s
      ON ps.service_id = s.service_id
    JOIN service_category sc
      ON s.category_id = sc.category_id
    WHERE ps.provider_service_id = ?
    `,
    [providerServiceId]
  );

  return rows[0];
};

export const updateProviderServiceForUser = async (
  userId,
  providerServiceId,
  data
) => {
  const {
    serviceName,
    pricingType,
    rateAmount,
    isVisible,
    providerNotes,
  } = data;

  const [existingRows] = await db.execute(
    `
    SELECT ps.service_id
    FROM provider_service ps
    WHERE ps.provider_service_id = ? AND ps.provider_id = ?
    `,
    [providerServiceId, userId]
  );

  if (existingRows.length === 0) {
    throw new Error("Service not found");
  }

  const serviceId = existingRows[0].service_id;

  if (serviceName) {
    await db.execute(
      `UPDATE service SET name = ? WHERE service_id = ?`,
      [serviceName, serviceId]
    );
  }

  await db.execute(
    `
    UPDATE provider_service
    SET pricing_type = ?,
        rate_amount = ?,
        is_service_visible = ?,
        provider_notes = ?
    WHERE provider_service_id = ? AND provider_id = ?
    `,
    [
      pricingType,
      pricingType === "quote" ? null : rateAmount,
      isVisible ? 1 : 0,
      providerNotes || null,
      providerServiceId,
      userId,
    ]
  );

  const [rows] = await db.execute(
    `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      s.description AS description,
      sc.name AS categoryName,
      ps.pricing_type AS pricingType,
      ps.rate_amount AS rateAmount,
      ps.is_service_visible AS isServiceVisible,
      ps.provider_notes AS providerNotes
    FROM provider_service ps
    JOIN service s
      ON ps.service_id = s.service_id
    JOIN service_category sc
      ON s.category_id = sc.category_id
    WHERE ps.provider_service_id = ?
    `,
    [providerServiceId]
  );

  return rows[0];
};

export const deleteProviderServiceForUser = async (userId, providerServiceId) => {
  await db.execute(
    `
    DELETE FROM provider_service
    WHERE provider_service_id = ? AND provider_id = ?
    `,
    [providerServiceId, userId]
  );
};