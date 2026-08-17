import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnquiryModal } from '../components/EnquiryModal';

interface EnquiryModalContextType {
  openEnquiryModal: (defaultRequirement?: string) => void;
  closeEnquiryModal: () => void;
  isOpen: boolean;
}

const EnquiryModalContext = createContext<EnquiryModalContextType | undefined>(undefined);

export function EnquiryModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requirement, setRequirement] = useState<string | undefined>(undefined);

  const openEnquiryModal = (req?: string) => {
    setRequirement(req);
    setIsOpen(true);
  };

  const closeEnquiryModal = () => {
    setIsOpen(false);
    setRequirement(undefined);
  };

  return (
    <EnquiryModalContext.Provider value={{ openEnquiryModal, closeEnquiryModal, isOpen }}>
      {children}
      <EnquiryModal
        isOpen={isOpen}
        onClose={closeEnquiryModal}
        defaultRequirement={requirement}
      />
    </EnquiryModalContext.Provider>
  );
}

export function useEnquiryModal() {
  const context = useContext(EnquiryModalContext);
  if (!context) {
    throw new Error('useEnquiryModal must be used within an EnquiryModalProvider');
  }
  return context;
}
