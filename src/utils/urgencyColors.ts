export type UrgencyLevel = 'Low' | 'Medium' | 'High';

export const getUrgencyColors = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case 'High':
      return {
        strip: 'bg-red-500',
        badge: 'bg-red-100 text-red-800',
        text: 'text-red-700',
        pin: '#EF4444',
      };
    case 'Medium':
      return {
        strip: 'bg-yellow-400',
        badge: 'bg-yellow-100 text-yellow-800',
        text: 'text-yellow-700',
        pin: '#FACC15',
      };
    case 'Low':
      return {
        strip: 'bg-green-500',
        badge: 'bg-green-100 text-green-800',
        text: 'text-green-700',
        pin: '#22C55E',
      };
    default:
      return {
        strip: 'bg-gray-500',
        badge: 'bg-gray-100 text-gray-800',
        text: 'text-gray-700',
        pin: '#6B7280',
      };
  }
};
