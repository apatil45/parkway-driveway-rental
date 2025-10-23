import { useEffect, useCallback, useRef } from 'react';
import { createRealtimeService, getRealtimeService } from '../services/realtimeService';
import { useAuth } from '../context/AuthContext';

interface UseRealtimeUpdatesProps {
  onDrivewayUpdate?: (driveway: any) => void;
  onDrivewayAvailabilityChange?: (drivewayId: string, isAvailable: boolean) => void;
  onBookingUpdate?: (booking: any) => void;
  onError?: (error: any) => void;
}

export const useRealtimeUpdates = ({
  onDrivewayUpdate,
  onDrivewayAvailabilityChange,
  onBookingUpdate,
  onError
}: UseRealtimeUpdatesProps = {}) => {
  const { user } = useAuth();
  const serviceRef = useRef<any>(null);

  const initializeService = useCallback(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    
    const service = createRealtimeService({
      serverUrl,
      onDrivewayUpdate: (driveway) => {
        console.log('🔄 Real-time driveway update received:', driveway);
        onDrivewayUpdate?.(driveway);
      },
      onDrivewayAvailabilityChange: (drivewayId, isAvailable) => {
        console.log('🔄 Real-time availability change:', { drivewayId, isAvailable });
        onDrivewayAvailabilityChange?.(drivewayId, isAvailable);
      },
      onBookingUpdate: (booking) => {
        console.log('📅 Real-time booking update received:', booking);
        onBookingUpdate?.(booking);
      },
      onError: (error) => {
        console.error('❌ Real-time service error:', error);
        onError?.(error);
      }
    });

    serviceRef.current = service;
    return service;
  }, [onDrivewayUpdate, onDrivewayAvailabilityChange, onBookingUpdate, onError]);

  const connect = useCallback(() => {
    const service = serviceRef.current || initializeService();
    service.connect();
  }, [initializeService]);

  const disconnect = useCallback(() => {
    const service = serviceRef.current;
    if (service) {
      service.disconnect();
    }
  }, []);

  const subscribeToDriveway = useCallback((drivewayId: string) => {
    const service = serviceRef.current;
    if (service) {
      service.subscribeToDriveway(drivewayId);
    }
  }, []);

  const unsubscribeFromDriveway = useCallback((drivewayId: string) => {
    const service = serviceRef.current;
    if (service) {
      service.unsubscribeFromDriveway(drivewayId);
    }
  }, []);

  const subscribeToUserBookings = useCallback((userId: string) => {
    const service = serviceRef.current;
    if (service) {
      service.subscribeToUserBookings(userId);
    }
  }, []);

  const unsubscribeFromUserBookings = useCallback((userId: string) => {
    const service = serviceRef.current;
    if (service) {
      service.unsubscribeFromUserBookings(userId);
    }
  }, []);

  const isConnected = useCallback(() => {
    const service = serviceRef.current;
    return service ? service.isConnected() : false;
  }, []);

  // Connect when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('🔌 User authenticated, connecting to real-time service...');
      connect();
      
      // Subscribe to user's bookings
      subscribeToUserBookings(user.id);
    } else {
      console.log('🔌 User not authenticated, disconnecting from real-time service...');
      disconnect();
    }

    return () => {
      if (user) {
        unsubscribeFromUserBookings(user.id);
      }
      disconnect();
    };
  }, [user, connect, disconnect, subscribeToUserBookings, unsubscribeFromUserBookings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    subscribeToDriveway,
    unsubscribeFromDriveway,
    subscribeToUserBookings,
    unsubscribeFromUserBookings,
    isConnected,
    service: serviceRef.current
  };
};

export default useRealtimeUpdates;
