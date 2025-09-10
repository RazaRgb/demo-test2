
import React, { useRef, useEffect, useState } from "react";

const ScrollBackgroundVideo = ({ 
  frameCount = 100,
  frameBaseName = "frame_", 
  frameExtension = ".png",
  frameDigits = 4,
  heightPerFrame = 50,
  imagePath = "/frames/"
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const requestRef = useRef();
  const [currentFrame, setCurrentFrame] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  // Preload images for smoother playback
  useEffect(() => {
    const preloadImages = () => {
      let loadedCount = 0;
      
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const frameNumber = i.toString().padStart(frameDigits, '0');
        img.src = `${imagePath}${frameBaseName}${frameNumber}${frameExtension}`;
        
        img.onload = () => {
          loadedCount++;
          setImagesLoaded(loadedCount);
        };
        
        img.onerror = () => {
          console.warn(`Failed to load frame: ${img.src}`);
          loadedCount++;
          setImagesLoaded(loadedCount);
        };
      }
    };

    preloadImages();
  }, [frameCount, frameBaseName, frameExtension, frameDigits, imagePath]);

  useEffect(() => {
    const updateFrame = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      
      const targetFrame = Math.min(Math.max(Math.round(scrollProgress * frameCount) + 1, 1), frameCount);
      
      if (targetFrame !== currentFrame) {
        setCurrentFrame(targetFrame);
      }
    };

    const handleScroll = () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      requestRef.current = requestAnimationFrame(updateFrame);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial frame calculation
    updateFrame();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [frameCount, currentFrame]);

  // Generate current image source
  const currentImageSrc = `${imagePath}${frameBaseName}${currentFrame.toString().padStart(frameDigits, '0')}${frameExtension}`;

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: `${frameCount * heightPerFrame}vh`, 
        position: "relative" 
      }}
    >
      <img
        ref={imageRef}
        src={currentImageSrc}
        alt={`Frame ${currentFrame}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
      
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        color: "white",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
      }}>
        <div>
          <h3>Scroll to control image sequence</h3>
          <p>Frame {currentFrame} of {frameCount}</p>
          <p>{imagesLoaded}/{frameCount} images loaded</p>
        </div>
      </div>
    </div>
  );
};

export default ScrollBackgroundVideo;

