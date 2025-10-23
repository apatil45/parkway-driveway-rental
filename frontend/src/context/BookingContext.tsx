import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Driveway {
  id: string;
  address: string;
  description: string;
  pricePerHour: number;
  images: string[];
  rating: number;
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  amenities?: string[];
  features?: string[];
  owner?: {
    name: string;
    rating: number;
  };
  availability?: {
    startTime: string;
    endTime: string;
  };
}

interface SelectedSlot {
  driveway: Driveway;
  clickPosition?: { x: number; y: number };
  selectedAt: Date;
}

interface BookingContextType {
  // Modal state
  isBookingModalOpen: boolean;
  selectedSlots: SelectedSlot[];
  
  // Actions
  openBookingModal: (driveway: Driveway, clickPosition?: { x: number; y: number }) => void;
  closeBookingModal: () => void;
  addSlotToSelection: (driveway: Driveway, clickPosition?: { x: number; y: number }) => void;
  removeSlotFromSelection: (drivewayId: string) => void;
  clearSlotSelection: () => void;
  
  // Computed values
  totalSelectedSlots: number;
  canAddMoreSlots: boolean;
  maxSlotsPerBooking: number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
  maxSlotsPerBooking?: number;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ 
  children, 
  maxSlotsPerBooking = 5 
}) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  const openBookingModal = useCallback((driveway: Driveway, clickPosition?: { x: number; y: number }) => {
    console.log('🎯 Opening booking modal for:', driveway.address);
    
    // If modal is already open, add to selection
    if (isBookingModalOpen) {
      addSlotToSelection(driveway, clickPosition);
      return;
    }
    
    // Open modal with first slot
    setSelectedSlots([{
      driveway,
      clickPosition,
      selectedAt: new Date()
    }]);
    setIsBookingModalOpen(true);
  }, [isBookingModalOpen]);

  const closeBookingModal = useCallback(() => {
    console.log('🎯 Closing booking modal');
    setIsBookingModalOpen(false);
    setSelectedSlots([]);
  }, []);

  const addSlotToSelection = useCallback((driveway: Driveway, clickPosition?: { x: number; y: number }) => {
    console.log('🎯 Adding slot to selection:', driveway.address);
    
    // Check if slot is already selected
    const isAlreadySelected = selectedSlots.some(slot => slot.driveway.id === driveway.id);
    if (isAlreadySelected) {
      console.log('⚠️ Slot already selected, removing instead');
      removeSlotFromSelection(driveway.id);
      return;
    }
    
    // Check if we can add more slots
    if (selectedSlots.length >= maxSlotsPerBooking) {
      console.log('⚠️ Maximum slots reached');
      return;
    }
    
    setSelectedSlots(prev => [...prev, {
      driveway,
      clickPosition,
      selectedAt: new Date()
    }]);
  }, [selectedSlots, maxSlotsPerBooking]);

  const removeSlotFromSelection = useCallback((drivewayId: string) => {
    console.log('🎯 Removing slot from selection:', drivewayId);
    setSelectedSlots(prev => prev.filter(slot => slot.driveway.id !== drivewayId));
  }, []);

  const clearSlotSelection = useCallback(() => {
    console.log('🎯 Clearing slot selection');
    setSelectedSlots([]);
  }, []);

  const totalSelectedSlots = selectedSlots.length;
  const canAddMoreSlots = totalSelectedSlots < maxSlotsPerBooking;

  const value: BookingContextType = {
    isBookingModalOpen,
    selectedSlots,
    openBookingModal,
    closeBookingModal,
    addSlotToSelection,
    removeSlotFromSelection,
    clearSlotSelection,
    totalSelectedSlots,
    canAddMoreSlots,
    maxSlotsPerBooking
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
