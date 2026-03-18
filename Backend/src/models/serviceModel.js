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