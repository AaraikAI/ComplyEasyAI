import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';

/**
 * Track user presence on specific pages.
 * Reports current page to the WebSocket server for presence indicators.
 */
export const usePresence = (resourceType?: string, resourceId?: string) => {
  const { emit, onlineUsers, isConnected } = useWebSocket();
  const location = useLocation();

  useEffect(() => {
    if (!isConnected) return;

    emit('presence:page', {
      page: location.pathname,
      resourceType,
      resourceId,
    });

    return () => {
      emit('presence:leave', {
        page: location.pathname,
        resourceType,
        resourceId,
      });
    };
  }, [isConnected, location.pathname, resourceType, resourceId, emit]);

  const usersOnCurrentPage = onlineUsers.filter(u => u.currentPage === location.pathname);

  return {
    onlineUsers,
    usersOnCurrentPage,
    isConnected,
  };
};

export default usePresence;
