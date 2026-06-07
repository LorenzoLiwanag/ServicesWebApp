import db from "../config/Database.js";

export const listCategoriesWithCounts = async () => {
  const [rows] = await db.execute(`
    SELECT
      sc.id,
      sc.name,
      sc.description,
      sc.parent_category_id  AS parentCategoryId,
      sc.sort_order          AS sortOrder,
      sc.is_active           AS isActive,
      sc.created_at          AS createdAt,
      sc.updated_at          AS updatedAt,
      COUNT(ps.id)           AS serviceCount
    FROM service_category sc
    LEFT JOIN provider_service ps ON ps.category_id = sc.id AND ps.is_deleted = FALSE
    GROUP BY sc.id
    ORDER BY sc.sort_order ASC, sc.name ASC
  `);
  return rows.map((r) => ({ ...r, isActive: Boolean(r.isActive), serviceCount: Number(r.serviceCount) }));
};

export const getCategoryById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, name, is_active AS isActive FROM service_category WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], isActive: Boolean(rows[0].isActive) };
};

export const findByName = async (name, excludeId = null) => {
  if (excludeId) {
    const [rows] = await db.execute(
      `SELECT id FROM service_category WHERE name = ? AND id != ?`,
      [name, excludeId]
    );
    return rows[0] || null;
  }
  const [rows] = await db.execute(`SELECT id FROM service_category WHERE name = ?`, [name]);
  return rows[0] || null;
};

export const getServiceCount = async (id) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS cnt FROM provider_service WHERE category_id = ? AND is_deleted = FALSE`,
    [id]
  );
  return Number(rows[0].cnt);
};

export const insertCategory = async ({ name, description, parentCategoryId, sortOrder }) => {
  const [result] = await db.execute(
    `INSERT INTO service_category (name, description, parent_category_id, sort_order, is_active)
     VALUES (?, ?, ?, ?, TRUE)`,
    [name, description || null, parentCategoryId || null, sortOrder ?? 0]
  );
  return result.insertId;
};

export const updateCategoryById = async (id, { name, description, parentCategoryId, sortOrder }) => {
  await db.execute(
    `UPDATE service_category SET name = ?, description = ?, parent_category_id = ?, sort_order = ? WHERE id = ?`,
    [name, description ?? null, parentCategoryId ?? null, sortOrder ?? 0, id]
  );
};

export const setActiveStatus = async (id, isActive) => {
  await db.execute(`UPDATE service_category SET is_active = ? WHERE id = ?`, [isActive, id]);
};

export const deleteCategoryById = async (id) => {
  await db.execute(`DELETE FROM service_category WHERE id = ?`, [id]);
};

export const getUncategorizedServices = async () => {
  const [rows] = await db.execute(`
    SELECT
      ps.id           AS serviceId,
      ps.title,
      ps.approval_status AS approvalStatus,
      ps.created_at   AS createdAt,
      u.first_name    AS providerFirstName,
      u.last_name     AS providerLastName
    FROM provider_service ps
    JOIN users u ON ps.provider_id = u.id
    WHERE ps.category_id IS NULL AND ps.is_deleted = FALSE
    ORDER BY ps.created_at DESC
  `);
  return rows;
};

export const assignCategoryToService = async (serviceId, categoryId) => {
  await db.execute(
    `UPDATE provider_service SET category_id = ? WHERE id = ? AND is_deleted = FALSE`,
    [categoryId, serviceId]
  );
};
