import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react';
import { formatDate, formatCurrency, getStatusBadgeClass } from '../utils/helpers';

const EventCard = ({ event, onClick }) => {
  const {
    name,
    description,
    eventType,
    category,
    eventDate,
    location,
    maxParticipants,
    registeredCount = 0,
    registrationFee,
    status,
    bannerImage,
  } = event;

  const spotsLeft = maxParticipants - registeredCount;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = spotsLeft <= 10 && spotsLeft > 0;

  return (
    <div
      onClick={onClick}
      className="card hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Banner Image */}
      {bannerImage ? (
        <img
          src={bannerImage}
          alt={name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <span className="text-white text-4xl font-bold">
            {name.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900 flex-1">
            {name}
          </h3>
          <span className={getStatusBadgeClass(status)}>{status}</span>
        </div>

        {/* Event Type & Category */}
        <div className="flex gap-2 mb-3">
          <span className="badge badge-info">{eventType}</span>
          <span className="badge bg-purple-100 text-purple-800">{category}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-primary-600" />
            <span>{formatDate(eventDate)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-primary-600" />
            <span>{location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Users className="w-4 h-4 mr-2 text-primary-600" />
            <span>
              {registeredCount} / {maxParticipants} registered
            </span>
          </div>
          {registrationFee > 0 && (
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <IndianRupee className="w-4 h-4 mr-2 text-primary-600" />
              <span>{formatCurrency(registrationFee)}</span>
            </div>
          )}
        </div>

        {/* Availability Status */}
        {isFull ? (
          <div className="bg-red-50 text-red-700 text-sm font-medium px-3 py-2 rounded-lg text-center">
            Event Full
          </div>
        ) : isAlmostFull ? (
          <div className="bg-yellow-50 text-yellow-700 text-sm font-medium px-3 py-2 rounded-lg text-center">
            Only {spotsLeft} spots left!
          </div>
        ) : (
          <div className="bg-green-50 text-green-700 text-sm font-medium px-3 py-2 rounded-lg text-center">
            {spotsLeft} spots available
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
