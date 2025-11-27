import { PersonalizedNameType } from '@leadership-training/shared';

/**
 * Replaces generic terms like "husband" or "wife" with personalized names
 * @param text - The text to personalize
 * @param getNameByType - Function to get personalized name by type
 * @returns Personalized text
 */
export function personalizeText(
  text: string,
  getNameByType: (type: PersonalizedNameType) => string | null
): string {
  if (!text) return text;

  return text
    .replace(/\bhusband\b/gi, () => getNameByType(PersonalizedNameType.HUSBAND) || 'husband')
    .replace(/\bwife\b/gi, () => getNameByType(PersonalizedNameType.WIFE) || 'wife')
    .replace(/\bpartner\b/gi, (match) => {
      // Try husband first, then wife, then fallback to partner
      const husbandName = getNameByType(PersonalizedNameType.HUSBAND);
      const wifeName = getNameByType(PersonalizedNameType.WIFE);
      return husbandName || wifeName || 'partner';
    });
}

/**
 * Gets the best available personalized name for generic references
 * @param getNameByType - Function to get personalized name by type
 * @returns The most appropriate personalized name or null
 */
export function getBestPersonalizedName(
  getNameByType: (type: PersonalizedNameType) => string | null
): string | null {
  // Priority: husband, wife, partner, then any other name
  const husbandName = getNameByType(PersonalizedNameType.HUSBAND);
  if (husbandName) return husbandName;

  const wifeName = getNameByType(PersonalizedNameType.WIFE);
  if (wifeName) return wifeName;

  const partnerName = getNameByType(PersonalizedNameType.PARTNER);
  if (partnerName) return partnerName;

  return null;
}

/**
 * Creates a personalized version of a template string
 * @param template - Template string with placeholders like {{husband}} or {{wife}}
 * @param getNameByType - Function to get personalized name by type
 * @returns Personalized string
 */
export function personalizeTemplate(
  template: string,
  getNameByType: (type: PersonalizedNameType) => string | null
): string {
  if (!template) return template;

  return template
    .replace(/\{\{husband\}\}/gi, getNameByType(PersonalizedNameType.HUSBAND) || 'husband')
    .replace(/\{\{wife\}\}/gi, getNameByType(PersonalizedNameType.WIFE) || 'wife')
    .replace(/\{\{partner\}\}/gi, () => {
      const husbandName = getNameByType(PersonalizedNameType.HUSBAND);
      const wifeName = getNameByType(PersonalizedNameType.WIFE);
      return husbandName || wifeName || 'partner';
    });
}