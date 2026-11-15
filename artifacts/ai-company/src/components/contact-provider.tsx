import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import ContactModal from '@/components/contact-modal';
import { trackEvent } from '@/lib/analytics';

type OpenContact = (location: string) => void;

const ContactContext = createContext<OpenContact>(() => {});

export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState('unknown');

  const openContact = useCallback<OpenContact>((loc) => {
    trackEvent('contact_form_opened', { location: loc });
    setLocation(loc);
    setOpen(true);
  }, []);

  return (
    <ContactContext.Provider value={openContact}>
      {children}
      <ContactModal open={open} onOpenChange={setOpen} location={location} />
    </ContactContext.Provider>
  );
}

export function useContact(): OpenContact {
  return useContext(ContactContext);
}
