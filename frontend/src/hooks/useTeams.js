import { useContext } from 'react';
import { CurrentTeamContext } from '../context/CurrentTeamContext';

export function useTeams() {
  return useContext(CurrentTeamContext);
}
