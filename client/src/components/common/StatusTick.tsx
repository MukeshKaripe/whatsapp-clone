import { Check, CheckCheck } from 'lucide-react';
import { MessageStatus } from '../../types/chat';

interface StatusTickProps {
  status: MessageStatus;
  className?: string;
}

export const StatusTick = ({ status, className = 'w-4 h-4' }: StatusTickProps) => {
  if (status === 'READ') {
    return <CheckCheck className={`${className} text-wa-tick-blue`} aria-label="Read" />;
  }
  if (status === 'DELIVERED') {
    return <CheckCheck className={`${className} text-wa-tick-grey`} aria-label="Delivered" />;
  }
  return <Check className={`${className} text-wa-tick-grey`} aria-label="Sent" />;
};
