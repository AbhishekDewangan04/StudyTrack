/**
 * Frontend Google Maps URL Generator Helper
 * Safely constructs a Google Maps search URL from location name, address, or coordinates.
 * Prefers latitude/longitude coordinates if provided.
 */

const isValidNumber = (val) =>
  val !== null && val !== undefined && val !== '' && !isNaN(Number(val));

export const buildGoogleMapsUrl = (locationObj = {}) => {
  if (!locationObj) return '';
  const { locationName, locationAddress, locationLatitude, locationLongitude, googleMapsUrl } = locationObj;

  if (googleMapsUrl && typeof googleMapsUrl === 'string' && googleMapsUrl.trim()) {
    return googleMapsUrl.trim();
  }

  const hasLat = isValidNumber(locationLatitude);
  const hasLng = isValidNumber(locationLongitude);

  // Prefer coordinates if both latitude and longitude are valid numbers
  if (hasLat && hasLng) {
    const lat = Number(locationLatitude);
    const lng = Number(locationLongitude);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  // Otherwise, fallback to locationName + locationAddress query string
  const name = (locationName || '').trim();
  const address = (locationAddress || '').trim();
  const queryParts = [name, address].filter(Boolean);

  if (queryParts.length > 0) {
    const query = queryParts.join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return '';
};
