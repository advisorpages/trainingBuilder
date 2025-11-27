import { useCallback } from 'react';
import { PersonalizedNameType } from '@leadership-training/shared';
import { usePersonalizedNames } from '../contexts/PersonalizedNamesContext';
import { personalizeText, personalizeTemplate, getBestPersonalizedName } from '../utils/personalization.utils';

/**
 * Hook for easy access to personalization features
 */
export const usePersonalization = () => {
  const { getNameByType } = usePersonalizedNames();

  const getPersonalizedName = useCallback((type: PersonalizedNameType): string | null => {
    return getNameByType(type);
  }, [getNameByType]);

  const getBestName = useCallback((): string | null => {
    return getBestPersonalizedName(getNameByType);
  }, [getNameByType]);

  const replaceText = useCallback((text: string): string => {
    return personalizeText(text, getNameByType);
  }, [getNameByType]);

  const replaceTemplate = useCallback((template: string): string => {
    return personalizeTemplate(template, getNameByType);
  }, [getNameByType]);

  return {
    getPersonalizedName,
    getBestName,
    replaceText,
    replaceTemplate,
  };
};