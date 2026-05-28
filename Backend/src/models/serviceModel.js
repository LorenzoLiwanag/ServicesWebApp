import db from "../config/Database.js";

export const getBrowseServices = async () => {
  const query = `
    SELECT
      ps.id AS providerServiceId,
      ps.title,
      ps.description,
      ps.pricing_type AS pricingType,
      ps.price_amount AS priceAmount,
      ps.currency,
      ps.service_location_type AS serviceLocationType,
      sc.id AS categoryId,
      sc.name AS categoryName,
      pp.provider_id AS providerId,
      pp.display_name AS providerName,
      pp.average_rating AS averageRating,
      pp.total_reviews AS totalReviews,
      pp.is_provider_active AS isProviderActive
    FROM provider_service ps
    JOIN users u ON ps.provider_id = u.id
    JOIN provider_profile pp ON ps.provider_id = pp.provider_id
    LEFT JOIN service_category sc ON ps.category_id = sc.id
    WHERE
      ps.is_visible = TRUE
      AND ps.is_deleted = FALSE
      AND pp.is_provider_active = TRUE
      AND u.is_active = TRUE
      AND (sc.is_active = TRUE OR ps.category_id IS NULL)
  `;

  const [rows] = await db.execute(query);

  return rows.map((row) => ({
    ...row,
    priceAmount: row.priceAmount !== null ? Number(row.priceAmount) : null,
    isProviderActive: Boolean(row.isProviderActive),
    averageRating: row.averageRating !== null ? Number(row.averageRating) : 0,
  }));
};

export const getServiceCategories = async () => {
  const query = `
    SELECT id AS categoryId, name
    FROM service_category
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, name ASC
  `;
  const [rows] = await db.execute(query);
  return rows;
};

export const getServiceById = async (serviceId) => {
  const query = `
    SELECT
      ps.id AS providerServiceId,
      ps.title,
      ps.description,
      ps.pricing_type AS pricingType,
      ps.price_amount AS priceAmount,
      ps.currency,
      ps.service_location_type AS serviceLocationType,
      sc.id AS categoryId,
      sc.name AS categoryName,
      pp.provider_id AS providerId,
      pp.display_name AS providerName,
      pp.bio AS providerBio,
      pp.average_rating AS averageRating,
      pp.total_reviews AS totalReviews,
      pp.is_provider_active AS isProviderActive
    FROM provider_service ps
    JOIN users u ON ps.provider_id = u.id
    JOIN provider_profile pp ON ps.provider_id = pp.provider_id
    LEFT JOIN service_category sc ON ps.category_id = sc.id
    WHERE ps.id = ?
      AND ps.is_visible = TRUE
      AND ps.is_deleted = FALSE
      AND pp.is_provider_active = TRUE
      AND u.is_active = TRUE
  `;

  const [rows] = await db.execute(query, [serviceId]);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    priceAmount: row.priceAmount !== null ? Number(row.priceAmount) : null,
    isProviderActive: Boolean(row.isProviderActive),
    averageRating: row.averageRating !== null ? Number(row.averageRating) : 0,
  };
};
