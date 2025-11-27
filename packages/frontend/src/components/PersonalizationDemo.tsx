import React, { useState } from 'react';
import { PersonalizedNameType } from '@leadership-training/shared';
import { usePersonalization } from '../hooks/usePersonalization';
import { PersonalizedNamesManager } from './PersonalizedNamesManager';

/**
 * Demo component showing how to use the personalization system
 */
export const PersonalizationDemo: React.FC = () => {
  const { getPersonalizedName, getBestName, replaceText, replaceTemplate } = usePersonalization();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const demoText = "I need to tell my husband that his wife is going to be late for dinner.";
  const demoTemplate = "Hello {{husband}}, please tell {{wife}} that {{partner}} will be home late.";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Personalization Demo</h1>

      <div className="mb-6">
        <button
          onClick={() => setIsManagerOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Manage Personalized Names
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Original Text:</h2>
          <p className="p-3 bg-gray-100 rounded">{demoText}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Personalized Text:</h2>
          <p className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
            {replaceText(demoText)}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Template Example:</h2>
          <p className="p-3 bg-gray-100 rounded mb-2">{demoTemplate}</p>
          <p className="p-3 bg-green-50 rounded border-l-4 border-green-400">
            {replaceTemplate(demoTemplate)}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Individual Names:</h2>
          <div className="space-y-2">
            <p><strong>Husband:</strong> {getPersonalizedName(PersonalizedNameType.HUSBAND) || 'Not set'}</p>
            <p><strong>Wife:</strong> {getPersonalizedName(PersonalizedNameType.WIFE) || 'Not set'}</p>
            <p><strong>Best Available:</strong> {getBestName() || 'No names set'}</p>
          </div>
        </div>
      </div>

      <PersonalizedNamesManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
      />
    </div>
  );
};