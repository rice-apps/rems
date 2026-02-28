import { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';

interface SessionContextValue {
  session: Session | null;
}

export const SessionContext = createContext<SessionContextValue>({ session: null });

export function useSession() {
  return useContext(SessionContext);
}
