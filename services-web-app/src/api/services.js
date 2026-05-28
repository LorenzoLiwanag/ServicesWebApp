const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const parseJSON = async (res) => {
  try {
    return await res.json();
  } catch {
    throw new Error(res.ok ? "Unexpected server response" : `Server error ${res.status}`);
  }
};

const normalizeService = (s) => ({
  providerServiceId: s.providerServiceId,
  serviceName: s.title,
  description: s.description,
  bio: s.description,
  pricingType: s.pricingType,
  rateAmount: s.priceAmount !== null && s.priceAmount !== undefined ? Number(s.priceAmount) : null,
  currency: s.currency || "PHP",
  serviceLocationType: s.serviceLocationType,
  categoryId: s.categoryId,
  categoryName: s.categoryName || "Uncategorized",
  providerId: s.providerId,
  providerName: s.providerName,
  providerBio: s.providerBio ?? null,
  avgRating: s.averageRating !== null && s.averageRating !== undefined ? Number(s.averageRating) : 0,
  reviewCount: s.totalReviews ?? 0,
  isProviderActive: Boolean(s.isProviderActive),
  isServiceVisible: s.isServiceVisible !== false,
});

export const fetchBrowseServices = async () => {
  const res = await fetch(`${API}/api/services/browse`);
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to fetch services");
  return (data.services || []).map(normalizeService);
};

export const fetchServiceDetail = async (serviceId) => {
  const res = await fetch(`${API}/api/services/${serviceId}`);
  const data = await parseJSON(res);
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error(data.message || "Failed to fetch service");
  return normalizeService(data.service);
};

export const fetchServiceCategories = async () => {
  const res = await fetch(`${API}/api/services/categories`);
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to fetch categories");
  return data.categories || [];
};
