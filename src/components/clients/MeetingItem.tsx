import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User } from 'lucide-react';

interface MeetingItemProps {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string;
  attendees?: string[];
  location?: string;
  type?: 'in-person' | 'video' | 'call';
  status?: 'scheduled' | 'completed' | 'cancelled';
  onClick?: () => void;
}

const typeConfig = {
  'in-person': { bg: 'bg-blue-900/40', border: 'border-blue-700/60', text: 'text-blue-300', label: 'Presencial' },
  video: { bg: 'bg-purple-900/40', border: 'border-purple-700/60', text: 'text-purple-300', label: 'Vídeo' },
  call: { bg: 'bg-cyan-900/40', border: 'border-cyan-700/60', text: 'text-cyan-300', label: 'Chamada' },
};

const statusConfig = {
  scheduled: { bg: 'bg-emerald-900/40', border: 'border-emerald-700/60', text: 'text-emerald-300', label: 'Agendada' },
  completed: { bg: 'bg-slate-700/40', border: 'border-slate-600/60', text: 'text-slate-300', label: 'Concluída' },
  cancelled: { bg: 'bg-red-900/40', border: 'border-red-700/60', text: 'text-red-300', label: 'Cancelada' },
};

export function MeetingItem({
  id,
  title,
  date,
  time,
  duration,
  attendees = [],
  location,
  type = 'video',
  status = 'scheduled',
  onClick,
}: MeetingItemProps) {
  const typeInfo = typeConfig[type];
  const statusInfo = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className="group border border-slate-700/50 bg-gradient-to-br from-slate-900/40 to-slate-950/40 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 hover:border-slate-600/80 hover:bg-slate-900/50 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-300 transition-colors flex-1 truncate">
          {title}
        </h3>
      </div>

      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <span>{date} • {time}</span>
          {duration && <span className="text-slate-400">({duration})</span>}
        </div>

        {location && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span>{location}</span>
          </div>
        )}

        {attendees.length > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <User className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span>{attendees.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Badge variant="outline" className={`${typeInfo.bg} border ${typeInfo.border} ${typeInfo.text} text-xs font-semibold`}>
          {typeInfo.label}
        </Badge>
        <Badge variant="outline" className={`${statusInfo.bg} border ${statusInfo.border} ${statusInfo.text} text-xs font-semibold`}>
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  );
}
