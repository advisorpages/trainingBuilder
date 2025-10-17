/**
 * Privacy utilities for location names
 * Transforms specific location names to general, privacy-safe versions
 */

// Common location patterns and their transformations
const LOCATION_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  // Street addresses - replace with generic street name
  {
    pattern: /\d+\s+[^,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)/gi,
    replacement: 'Main Street'
  },
  // Specific building names/addresses
  {
    pattern: /\d+\s+[^,]+(?:Building|Bldg|Tower|Center|Ctr|Plaza|Complex)/gi,
    replacement: 'Main Building'
  },
  // Suite/Unit numbers
  {
    pattern: /(Suite|Unit|Apt|Apartment)\s*\d+/gi,
    replacement: 'Main Office'
  },
  // ZIP codes
  {
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    replacement: ''
  },
  // State abbreviations after commas
  {
    pattern: /,\s*[A-Z]{2}\s*\d*$/gi,
    replacement: ''
  },
  // City, State format - keep city only
  {
    pattern: /,\s*[A-Z]{2}.*$/gi,
    replacement: ''
  },
  // Common office/building indicators
  {
    pattern: /(Office|HQ|Headquarters|Corporate|Branch)\s*[^,\s]*/gi,
    replacement: 'Office'
  }
];

// Common location types and their general replacements
const LOCATION_TYPE_MAPPING: Record<string, string> = {
  'office': 'Office',
  'headquarters': 'Main Office',
  'branch': 'Branch Office',
  'center': 'Center',
  'facility': 'Facility',
  'campus': 'Campus',
  'building': 'Building',
  'complex': 'Complex'
};

/**
 * Transforms a location name to be privacy-safe
 * Removes specific addresses, building numbers, and other identifying information
 * @param locationName The original location name
 * @returns A privacy-safe, generalized location name
 */
export const transformLocationName = (locationName?: string): string => {
  if (!locationName || typeof locationName !== 'string') {
    return 'Unknown Location';
  }

  // Clean up the input
  let cleanLocation = locationName.trim();

  // Apply transformation patterns
  LOCATION_PATTERNS.forEach(({ pattern, replacement }) => {
    cleanLocation = cleanLocation.replace(pattern, replacement);
  });

  // Remove extra whitespace and commas
  cleanLocation = cleanLocation.replace(/\s+/g, ' ').replace(/,+/g, ',').replace(/,\s*$/, '').trim();

  // If the result is empty or too generic, provide a default
  if (!cleanLocation || cleanLocation.length < 3) {
    return 'Office Location';
  }

  // Add generic office/center suffix if it seems too specific
  const lowerLocation = cleanLocation.toLowerCase();
  const hasLocationType = Object.keys(LOCATION_TYPE_MAPPING).some(keyword =>
    lowerLocation.includes(keyword)
  );

  if (!hasLocationType && !lowerLocation.includes('office') && !lowerLocation.includes('center')) {
    cleanLocation += ' Office';
  }

  return cleanLocation;
};

/**
 * Extracts a location type from the location name
 * @param locationName The location name
 * @returns The detected location type or 'Office' as default
 */
export const getLocationType = (locationName?: string): string => {
  if (!locationName) {
    return 'Office';
  }

  const lowerLocation = locationName.toLowerCase();

  for (const [keyword, type] of Object.entries(LOCATION_TYPE_MAPPING)) {
    if (lowerLocation.includes(keyword)) {
      return type;
    }
  }

  return 'Office';
};

/**
 * Creates a short display version of a location (max 25 characters)
 * @param locationName The location name
 * @returns A shortened, privacy-safe location name
 */
export const getShortLocationDisplay = (locationName?: string): string => {
  const transformedLocation = transformLocationName(locationName);

  if (transformedLocation.length <= 25) {
    return transformedLocation;
  }

  // Try to truncate at a word boundary
  const truncated = transformedLocation.substring(0, 22);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 15) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
};

/**
 * Processes an array of location names and returns transformed versions
 * @param locationNames Array of location names
 * @returns Array of privacy-safe location names
 */
export const transformLocationNames = (locationNames?: string[]): string[] => {
  if (!Array.isArray(locationNames)) {
    return [];
  }

  return locationNames
    .filter(name => name && typeof name === 'string')
    .map(name => transformLocationName(name))
    .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
};

// Default export for convenience
export default {
  transformLocationName,
  getLocationType,
  getShortLocationDisplay,
  transformLocationNames
};