          )}

          {/* AI Content Enhancement Section */}
          <div>
            <AIContentSection
              sessionData={formData}
              isExpanded={isAIContentExpanded}
              onToggle={handleToggleAIContent}
              onContentGenerated={handleAIContentGenerated}
            />
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">