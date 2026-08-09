import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ModalContext = createContext(null);

/**
 * Provides modal open/close state + openModal() to the whole tree.
 * Replaces injectRegistrationModal / setupRegistrationHandlers from script.js.
 */
export function ModalProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    eventId: '',
    eventSlug: '',
    eventTitle: '',
    isTeam: false,
    isInterCollege: false,
    teamMin: null,
    teamMax: null,
    fee: 0,
  });

  const openModal = useCallback(
    (eventId, eventTitle, isTeam = false, isInterCollege = false, options = {}) => {
      const slug = options.eventSlug || eventId;
      setState({
        isOpen: true,
        eventId,
        eventSlug: slug,
        eventTitle,
        isTeam,
        isInterCollege,
        teamMin: options.teamMin || (isTeam ? 2 : 1),
        teamMax: options.teamMax || (isTeam ? 4 : 1),
        fee: options.fee || 0,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = state.isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [state.isOpen]);

  return (
    <ModalContext.Provider value={{ ...state, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

/** Consume modal state + actions from any component. */
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}
