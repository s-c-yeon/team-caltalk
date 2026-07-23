import { useCallback, useEffect, useState } from 'react';
import * as chatMessagesApi from '../api/chatMessages.api';

export function useChatMessages(teamId, date) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(() => {
    if (!teamId || !date) {
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    return chatMessagesApi
      .getChatMessages(teamId, date)
      .then((data) => setMessages(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [teamId, date]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}
