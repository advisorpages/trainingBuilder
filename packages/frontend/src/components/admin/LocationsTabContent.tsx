import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { locationService } from '../../services/location.service';
import { EditLocationModal } from './EditLocationModal';
import type { Location, LocationType, MeetingPlatform } from '@leadership-training/shared';

export const LocationsTabContent: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await locationService.getLocations({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });
      setLocations(response.locations);
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [searchTerm]);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClick = () => {
    setEditingLocation(null);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (data: Partial<Location>) => {
    try {
      console.log('=== SAVING LOCATION ===');
      console.log('Is editing?:', !!editingLocation);
      console.log('Raw data (before filtering):', JSON.stringify(data, null, 2));

      // Filter out empty strings and convert them to undefined
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key] = undefined;
        } else if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      console.log('Cleaned data (after filtering):', JSON.stringify(cleanedData, null, 2));

      if (editingLocation) {
        // Update existing location
        console.log('Calling updateLocation with ID:', editingLocation.id);
        await locationService.updateLocation(editingLocation.id, cleanedData);
      } else {
        // Create new location
        console.log('Calling createLocation');
        await locationService.createLocation(cleanedData as any);
      }
      await loadLocations();
      setIsEditModalOpen(false);
      setEditingLocation(null);
    } catch (err: any) {
      console.error('=== ERROR SAVING LOCATION ===');
      console.error('Full error:', err);
      console.error('Error response data:', err?.response?.data);
      console.error('Error response status:', err?.response?.status);
      console.error('Error message:', err?.message);
      setError(editingLocation ? 'Failed to update location' : 'Failed to create location');
    }
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await locationService.deleteLocation(locationToDelete.id);
      await loadLocations();
      setLocationToDelete(null);
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location');
      setLocationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setLocationToDelete(null);
  };

  const getLocationTypeBadge = (locationType: LocationType) => {
    const badges = {
      physical: { label: 'Physical', color: 'bg-blue-100 text-blue-700' },
      virtual: { label: 'Virtual', color: 'bg-purple-100 text-purple-700' },
      hybrid: { label: 'Hybrid', color: 'bg-green-100 text-green-700' },
    };
    const badge = badges[locationType] || badges.physical;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getPlatformLabel = (platform?: MeetingPlatform) => {
    if (!platform) return '';
    const labels = {
      zoom: 'Zoom',
      microsoft_teams: 'Teams',
      google_meet: 'Meet',
      other: 'Other',
    };
    return labels[platform] || platform;
  };

  return (
    <>
      <EditLocationModal
        location={editingLocation}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      {locationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Location
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete "{locationToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    <div className="space-y-6 max-w-6xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
        <Button onClick={handleAddClick}>
          Add Location
        </Button>
      </div>

      {error && !loading ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <Button variant="outline" onClick={loadLocations}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Details</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-slate-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-slate-200 rounded w-32 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">📍</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No locations found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? 'Try a different search term.' : 'Start by creating your first location.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddClick}>Add Location</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{location.name}</div>
                      {location.notes && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span>📝</span>
                          <span>Has notes</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getLocationTypeBadge(location.locationType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {location.locationType === 'physical' && (
                        <div>
                          {location.city && location.state ? `${location.city}, ${location.state}` : location.city || location.address || '-'}
                          {location.capacity && <div className="text-xs text-slate-500">Capacity: {location.capacity}</div>}
                        </div>
                      )}
                      {location.locationType === 'virtual' && (
                        <div>
                          {location.meetingPlatform ? getPlatformLabel(location.meetingPlatform) : '-'}
                          {location.meetingId && <div className="text-xs text-slate-500">ID: {location.meetingId}</div>}
                        </div>
                      )}
                      {location.locationType === 'hybrid' && (
                        <div>
                          <div>{location.city || location.meetingPlatform ? getPlatformLabel(location.meetingPlatform) : '-'}</div>
                          <div className="text-xs text-slate-500">In-person + Virtual</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        location.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(location.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEditClick(location)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDeleteClick(location)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};
