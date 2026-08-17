import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnquiryModal } from '../components/EnquiryModal';
import { RequestQuoteModal } from '../components/RequestQuoteModal';

interface EnquiryModalContextType {
  openEnquiryModal: (defaultRequirement?: string) => void;
  closeEnquiryModal: () => void;
  isEnquiryOpen: boolean;
  openQuoteModal: (defaultPartName?: string) => void;
  closeQuoteModal: () => void;
  isQuoteOpen: boolean;
}

const EnquiryModalContext = createContext<EnquiryModalContextType | undefined>(undefined);

export function EnquiryModalProvider({ children }: { children: ReactNode }) {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryRequirement, setEnquiryRequirement] = useState<string | undefined>(undefined);

  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quotePartName, setQuotePartName] = useState<string | undefined>(undefined);

  const openEnquiryModal = (req?: string) => {
    setEnquiryRequirement(req);
    setIsEnquiryOpen(true);
  };

  const closeEnquiryModal = () => {
    setIsEnquiryOpen(false);
    setEnquiryRequirement(undefined);
  };

  const openQuoteModal = (partName?: string) => {
    setQuotePartName(partName);
    setIsQuoteOpen(true);
  };

  const closeQuoteModal = () => {
    setIsQuoteOpen(false);
    setQuotePartName(undefined);
  };

  return (
    <EnquiryModalContext.Provider
      value={{
        openEnquiryModal,
        closeEnquiryModal,
        isEnquiryOpen,
        openQuoteModal,
        closeQuoteModal,
        isQuoteOpen,
      }}
    >
      {children}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={closeEnquiryModal}
        defaultRequirement={enquiryRequirement}
      />
      <RequestQuoteModal
        isOpen={isQuoteOpen}
        onClose={closeQuoteModal}
        defaultPartName={quotePartName}
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
