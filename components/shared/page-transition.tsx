'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [visible, setVisible] = useState(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Fade out current page
      setVisible(false);
      const timer = setTimeout(() => {
        // Swap content and fade in new page
        setDisplayChildren(children);
        setVisible(true);
        prevPathname.current = pathname;
      }, 180);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col min-h-0 transition-opacity duration-[180ms] ease-[var(--ease-ui,cubic-bezier(0.23,1,0.32,1))]",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {displayChildren}
    </div>
  );
}
