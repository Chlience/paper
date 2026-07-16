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

export const getCatalogDatasets = (datasets, registry) => {
  const catalogVenueIds = new Set(getCatalogVenues(registry).map((venue) => venue.id));
  return datasets.filter((dataset) => catalogVenueIds.has(dataset.venueId));
};
