import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Location {
  id: string;
  name: string;
  address: string;
  capacity: number;
  facilities: string[];
  contactPerson: string;
  contactEmail: string;
  isActive: boolean;
}

const ManageLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setLocations([
        {
          id: '1',
          name: 'Downtown Conference Center',
          address: '123 Business Ave, Downtown',
          capacity: 50,
          facilities: ['Projector', 'WiFi', 'Catering', 'Parking'],
          contactPerson: 'John Smith',
          contactEmail: 'john@conference.com',
          isActive: true,
        },
        {
          id: '2',
          name: 'Corporate Training Hub',
          address: '456 Corporate Blvd, Business District',
          capacity: 30,
          facilities: ['WiFi', 'Whiteboard', 'Coffee Station'],
          contactPerson: 'Sarah Johnson',
          contactEmail: 'sarah@corporate.com',
          isActive: true,
        },
        {
          id: '3',
          name: 'Community Learning Center',
          address: '789 Community St, Suburb',
          capacity: 25,
          facilities: ['Basic AV', 'WiFi'],
          contactPerson: 'Mike Davis',
          contactEmail: 'mike@community.org',
          isActive: false,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    setEditingLocation(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const toggleStatus = (id: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, isActive: !loc.isActive } : loc
    ));
  };

  return (
    <BuilderLayout
      title="Manage Locations"
      subtitle="Training venues and facilities"
      statusSlot={
        <Button onClick={handleAddNew}>
          ➕ Add Location
        </Button>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search locations by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingLocation) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Location name" />
                <Input placeholder="Contact person" />
                <Input placeholder="Full address" className="md:col-span-2" />
                <Input placeholder="Capacity" type="number" />
                <Input placeholder="Contact email" type="email" />
                <Input placeholder="Facilities (comma-separated)" className="md:col-span-2" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button>Save Location</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((location) => (
              <Card key={location.id} className={!location.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{location.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{location.address}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      location.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity:</span>
                      <span className="font-medium">{location.capacity} people</span>
                    </div>
                    
                    <div>
                      <span className="text-slate-500">Facilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {location.facilities.map((facility, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-slate-600">{location.contactPerson}</p>
                      <p className="text-slate-500 text-xs">{location.contactEmail}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(location)}>
                      Edit
                    </Button>
                    <Button 
                      variant={location.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleStatus(location.id)}
                    >
                      {location.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredLocations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No locations found</h3>
              <p className="text-slate-600 mb-4">Start by adding your first training location.</p>
              <Button onClick={handleAddNew}>Add Location</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageLocationsPage;