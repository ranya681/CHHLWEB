import React, { useState, useRef, useLayoutEffect } from 'react';

interface ScaleWrapperProps {
  children: React.ReactNode;
  designWidth?: number;
}

/**
 * ScaleWrapper implements a "Canvas-style" scaling logic.
 * It locks the content width to a design width (default 2550px)
 * and scales it using CSS transform to fit the viewport width.
 * It also dynamically adjusts the parent container's height to ensure
 * native browser scrollbars work correctly.
 */
export default function ScaleWrapper({ children, designWidth = 2550 }: ScaleWrapperProps) {
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const updateScale = () => {
    const newScale = window.innerWidth / designWidth;
    setScale(newScale);
    if (contentRef.current) {
      // Use scrollHeight to get the full height of the content even if it's not fully visible
      setContentHeight(contentRef.current.scrollHeight);
    }
  };

  useLayoutEffect(() => {
    updateScale();
    
    const handleResize = () => {
      updateScale();
    };

    window.addEventListener('resize', handleResize);
    
    // ResizeObserver to detect content height changes (e.g. dynamic content loading)
    const observer = new ResizeObserver(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    });
    
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [designWidth]);

  return (
    <div 
      className="scale-wrapper-container w-full overflow-x-hidden relative"
      style={{ 
        height: contentHeight * scale,
        // Ensure no internal scrollbars as requested
        overflowY: 'hidden' 
      }}
    >
      <div
        ref={contentRef}
        className="scale-wrapper-content origin-top-left absolute top-0 left-0"
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          // Ensure no internal scrollbars
          overflow: 'visible',
        }}
      >
        {children}
      </div>
    </div>
  );
}
