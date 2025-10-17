import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const breakpoints = {
  mobile: 768,
  tablet: 1024,
};

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < breakpoints.mobile) {
        setBreakpoint('mobile');
      } else if (width < breakpoints.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Initial check
    checkBreakpoint();

    // Add event listener
    window.addEventListener('resize', checkBreakpoint);

    // Cleanup
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};