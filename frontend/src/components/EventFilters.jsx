import { Search, X } from 'lucide-react';

const EventFilters = ({ filters, onFilterChange, onSearch, onReset }) => {
  const categories = [
    'Technical',
    'Cultural',
    'Sports',
    'Workshop',
    'Competition',
    'Other',
  ];

  const eventTypes = ['Normal', 'Merchandise'];

  const statuses = ['Draft', 'Published', 'Completed', 'Cancelled'];

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.category ||
      filters.eventType ||
      filters.status ||
      filters.startDate ||
      filters.endDate
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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

          {/* Status Filter */}
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
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
