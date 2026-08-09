import { createContext, useCallback, useContext, useState } from 'react';

const SpotlightContext = createContext(null);

export function SpotlightProvider({ children }) {
  const [spotlightColor, setSpotlightColor] = useState('var(--cyan)');

  const setColor = useCallback((color) => setSpotlightColor(color), []);
  const resetColor = useCallback(() => setSpotlightColor('var(--cyan)'), []);

  return (
    <SpotlightContext.Provider value={{ spotlightColor, setColor, resetColor }}>
      {children}
    </SpotlightContext.Provider>
  );
}

export function useSpotlight() {
  return useContext(SpotlightContext);
}
