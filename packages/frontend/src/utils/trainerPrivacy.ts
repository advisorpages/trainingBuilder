/**
 * Privacy utilities for trainer names
 * Transforms full trainer names to show only first name and last initial
 */

/**
 * Truncates a trainer name to show first name and last initial
 * Examples: "John Smith" -> "John S.", "Sarah Johnson" -> "Sarah J."
 * @param fullName The full name of the trainer
 * @returns The privacy-masked name
 */
export const maskTrainerName = (fullName?: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return 'Unknown';
  }

  // Trim and clean the name
  const cleanName = fullName.trim();

  // Split by spaces and filter out empty parts
  const nameParts = cleanName.split(/\s+/).filter(part => part.length > 0);

  if (nameParts.length === 0) {
    return 'Unknown';
  }

  if (nameParts.length === 1) {
    // If only one name part, return it as-is or add a period for consistency
    const singleName = nameParts[0];
    return singleName.length > 1 ? `${singleName.charAt(0)}.` : singleName;
  }

  // Take first name as-is, and last initial with period
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
};

/**
 * Processes an array of trainer names and returns masked versions
 * @param trainerNames Array of trainer names
 * @returns Array of privacy-masked trainer names
 */
export const maskTrainerNames = (trainerNames?: string[]): string[] => {
  if (!Array.isArray(trainerNames)) {
    return [];
  }

  return trainerNames.map(name => maskTrainerName(name));
};

/**
 * Processes trainer objects with name property and returns masked versions
 * @param trainers Array of trainer objects with id and name properties
 * @returns Array of trainer objects with masked names
 */
export const maskTrainers = (trainers?: Array<{ id: number | string; name?: string }>): Array<{ id: number | string; name: string }> => {
  if (!Array.isArray(trainers)) {
    return [];
  }

  return trainers
    .filter(trainer => trainer && trainer.id !== undefined && trainer.id !== null)
    .map(trainer => ({
      id: trainer.id,
      name: maskTrainerName(trainer.name)
    }));
};

/**
 * Gets a display string for trainers, joining multiple trainers with commas
 * @param trainers Array of trainer objects or names
 * @returns Formatted string of masked trainer names
 */
export const getTrainerDisplayString = (trainers?: Array<{ id: number | string; name?: string }> | string[]): string => {
  if (!Array.isArray(trainers) || trainers.length === 0) {
    return 'No trainer assigned';
  }

  // Check if this is an array of objects or strings
  const hasObjects = trainers.some(trainer => typeof trainer === 'object' && trainer !== null);

  if (hasObjects) {
    const maskedTrainers = maskTrainers(trainers as Array<{ id: number | string; name?: string }>);
    return maskedTrainers.map(trainer => trainer.name).join(', ');
  } else {
    const maskedNames = maskTrainerNames(trainers as string[]);
    return maskedNames.join(', ');
  }
};

// Default export for convenience
export default {
  maskTrainerName,
  maskTrainerNames,
  maskTrainers,
  getTrainerDisplayString
};