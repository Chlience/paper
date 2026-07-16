export const getCatalogExcludedVenueIds = (registry) => {
  if (!Array.isArray(registry?.catalogScope?.excludedVenueIds)) {
    throw new TypeError('catalogScope.excludedVenueIds must be an array.');
  }
  return new Set(registry.catalogScope.excludedVenueIds);
};

export const getCatalogVenues = (registry) => {
  const excludedVenueIds = getCatalogExcludedVenueIds(registry);
  return (registry?.venues ?? []).filter((venue) => !excludedVenueIds.has(venue.id));
};
