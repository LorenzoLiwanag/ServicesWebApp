import db from "../config/Database.js";

export const getBrowseServices = async () => {
    const query = `
    SELECT
      ps.provider_service_id AS providerServiceId,
      s.name AS serviceName,
      sc.name AS categoryName,
      pp.display_name AS providerName,
      ps.pricing_type AS pricingType,
      ps.rate_amount AS rateAmount,
      ps.rate_currency AS rateCurrency,
      pp.is_provider_active AS isProviderActive,
      ps.is_service_visible AS isServiceVisible,
      pp.bio AS bio
    FROM provider_service ps
    JOIN service s
      ON ps.service_id = s.service_id
    JOIN service_category sc
      ON s.category_id = sc.category_id
    JOIN provider_profile pp
      ON ps.provider_id = pp.provider_id
  WHERE
  s.is_active = TRUE
  AND sc.is_active = TRUE
  AND ps.is_service_visible = TRUE
  AND pp.is_provider_active = TRUE
  `;

    const [rows] = await db.execute(query);

    return rows.map((row) => ({
        ...row,
        rateAmount: row.rateAmount !== null ? Number(row.rateAmount) : null,
        isProviderActive: Boolean(row.isProviderActive),
        isServiceVisible: Boolean(row.isServiceVisible),
        avgRating: 0,
        reviewCount: 0,
    }));
};

export const getServiceCategories = async () => {
  const query = `
    SELECT
      category_id AS categoryId,
      name
    FROM service_category
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, name ASC
  `;

  const [rows] = await db.execute(query);
  return rows;
};