import { Search, X } from 'lucide-react';

const EventFilters = ({ filters, onFilterChange, onSearch, onReset }) => {
  const eventTypes = ['Normal', 'Merchandise'];

  const eligibilityOptions = ['IIIT Only', 'Open to All'];

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.eventType ||
      filters.eligibility ||
      filters.startDate ||
      filters.endDate ||
      filters.followedOnly
    );
  };

  return (
    <div className="card mb-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by name, description, or organizer..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="input-field pl-10 pr-4"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="label">Event Type</label>
            <select
              value={filters.eventType || ''}
              onChange={(e) => handleChange('eventType', e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility Filter */}
          <div>
            <label className="label">Eligibility</label>
            <select
              value={filters.eligibility || ''}
              onChange={(e) => handleChange('eligibility', e.target.value)}
              className="input-field"
            >
              <option value="">All</option>
              {eligibilityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - Start */}
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Date Range - End */}
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Followed Clubs Only */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={filters.followedOnly || false}
                onChange={(e) => handleChange('followedOnly', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Followed Clubs Only</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onSearch} className="btn-primary">
            <Search className="w-4 h-4 mr-2 inline" />
            Apply Filters
          </button>
          {hasActiveFilters() && (
            <button onClick={onReset} className="btn-secondary">
              <X className="w-4 h-4 mr-2 inline" />
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
