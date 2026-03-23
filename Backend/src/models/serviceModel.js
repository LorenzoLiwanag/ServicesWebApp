import database from "../config/Database.js";

export const getAllServicesFromDb = async () => {
  const sql = `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      sc.name AS categoryName,
      pp.display_name AS providerName,
      ps.pricing_type AS pricingType,
      ps.rate_amount AS rateAmount,
      ps.rate_currency AS rateCurrency,
      4.5 AS avgRating,
      10 AS reviewCount,
      pp.is_provider_active AS isProviderActive,
      ps.is_service_visible AS isServiceVisible,
      pp.bio AS bio
    FROM provider_service ps
    JOIN service s ON ps.service_id = s.service_id
    JOIN service_category sc ON s.category_id = sc.category_id
    JOIN provider_profile pp ON ps.provider_id = pp.provider_id
    WHERE ps.is_service_visible = TRUE
  `;

  const [rows] = await database.execute(sql);
  return rows;
};

export const getProviderServicesFromDb = async (providerId) => {
  const sql = `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      ps.rate_amount AS rateAmount,
      ps.rate_currency AS rateCurrency,
      ps.is_service_visible AS isServiceVisible,
      ps.pricing_type AS pricingType
    FROM provider_service ps
    JOIN service s ON ps.service_id = s.service_id
    WHERE ps.provider_id = ?
  `;

  const [rows] = await database.execute(sql, [providerId]);
  return rows;
};

export const findServiceByName = async (serviceName) => {
  const sql = `SELECT service_id FROM service WHERE name = ? LIMIT 1`;
  const [rows] = await database.execute(sql, [serviceName]);
  return rows[0] ? rows[0].service_id : null;
};

export const getOrCreateDefaultCategory = async () => {
  const categoryName = 'General';
  const selectSql = `SELECT category_id FROM service_category WHERE name = ? LIMIT 1`;
  const [rows] = await database.execute(selectSql, [categoryName]);
  if (rows[0]) return rows[0].category_id;

  const insertSql = `INSERT INTO service_category (name) VALUES (?)`;
  const [insertResult] = await database.execute(insertSql, [categoryName]);
  return insertResult.insertId;
};

export const createServiceRecord = async (serviceName) => {
  const categoryId = await getOrCreateDefaultCategory();
  const sql = `INSERT INTO service (name, category_id) VALUES (?, ?)`;
  const [result] = await database.execute(sql, [serviceName, categoryId]);
  return result.insertId;
};

export const createProviderService = async ({ providerId, serviceId, price, isVisible }) => {
  const sql = `
    INSERT INTO provider_service (provider_id, service_id, pricing_type, rate_amount, rate_currency, is_service_visible)
    VALUES (?, ?, 'hourly', ?, 'PHP', ?)
  `;
  const [result] = await database.execute(sql, [providerId, serviceId, price, isVisible]);
  return result.insertId;
};

export const updateProviderService = async (providerServiceId, providerId, { serviceId, price, isVisible }) => {
  const sql = `
    UPDATE provider_service
    SET service_id = ?, rate_amount = ?, is_service_visible = ?
    WHERE provider_service_id = ? AND provider_id = ?
  `;
  const [result] = await database.execute(sql, [serviceId, price, isVisible, providerServiceId, providerId]);
  return result.affectedRows > 0;
};

export const deleteProviderService = async (providerServiceId, providerId) => {
  const sql = `
    DELETE FROM provider_service
    WHERE provider_service_id = ? AND provider_id = ?
  `;
  const [result] = await database.execute(sql, [providerServiceId, providerId]);
  return result.affectedRows > 0;
};
