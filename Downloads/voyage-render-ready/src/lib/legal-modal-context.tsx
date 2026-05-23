import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LegalModal } from '@/components/LegalModal';

export type LegalSection = 'rules' | 'terms' | 'privacy' | 'disclaimer';

interface LegalModalContextValue {
  openLegal: (section?: LegalSection) => void;
  closeLegal: () => void;
}

const LegalModalContext = createContext<LegalModalContextValue>({
  openLegal: () => {},
  closeLegal: () => {},
});

export function LegalModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<LegalSection>('rules');

  const openLegal = useCallback((s: LegalSection = 'rules') => {
    setSection(s);
    setOpen(true);
  }, []);

  const closeLegal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <LegalModalContext.Provider value={{ openLegal, closeLegal }}>
      {children}
      <LegalModal open={open} section={section} onSectionChange={setSection} onClose={closeLegal} />
    </LegalModalContext.Provider>
  );
}

export function useLegalModal(): LegalModalContextValue {
  return useContext(LegalModalContext);
}
