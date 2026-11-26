import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/auth/AuthContext';
import { useHousehold } from '@/auth/HouseholdContext';
import { supabase } from '@/lib/supabase';

export interface HouseholdMember {
  userId: string;
  displayName: string;
}

interface HouseholdMemberRow {
  user_id: string;
  display_name: string | null;
  owner_user_id: string | null;
}

export function getHouseholdMemberLabel(
  members: HouseholdMember[],
  userId: string | null | undefined,
): string | null {
  if (!userId) return null;

  return (
    members.find((member) => member.userId === userId)?.displayName ??
    'Domownik'
  );
}

export function useHouseholdMembers() {
  const { householdId } = useHousehold();
  const { user } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    if (!householdId) {
      setMembers([]);
      setOwnerId(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: resultError } = await supabase.rpc(
        'list_household_members',
        { p_household_id: householdId },
      );

      if (resultError) throw resultError;
      if (!Array.isArray(data)) {
        throw new Error('Nieprawidłowa odpowiedź listy domowników.');
      }

      if (currentRequestId !== requestId.current) return;

      const rows = data as HouseholdMemberRow[];

      setMembers(
        rows.map((row) => ({
          userId: row.user_id,
          displayName: row.display_name?.trim() || 'Domownik',
        })),
      );
      setOwnerId(rows[0]?.owner_user_id ?? null);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;

      console.error('Nie udało się pobrać listy domowników:', requestError);
      setMembers([]);
      setOwnerId(null);
      setError('Nie udało się pobrać domowników. Spróbuj ponownie.');
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [householdId]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) return refresh();
    });

    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [refresh]);

  return {
    members,
    ownerId,
    isOwner: Boolean(user && ownerId === user.id),
    currentUserId: user?.id ?? null,
    loading,
    error,
    refresh,
  };
}
