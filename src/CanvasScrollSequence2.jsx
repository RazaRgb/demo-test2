import React, { useRef, useEffect, useState } from "react";

const CanvasScrollSequence = ({ 
  frameCount = 100,
  frameBaseName = "", 
  frameExtension = ".png",
  frameDigits = 4,
  heightPerFrame = 50,
  imagePath = "/frames/"
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const imagesRef = useRef([]); // Store preloaded images
  const [currentFrame, setCurrentFrame] = useState(1);
  const [loadedImages, setLoadedImages] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Generate image source
  const getImageSrc = (frame) => {
    const frameNumber = frame.toString().padStart(frameDigits, '0');
    return `${imagePath}${frameBaseName}${frameNumber}${frameExtension}`;
  };

  // Preload all images into memory
  useEffect(() => {
    const preloadImages = async () => {
      const images = [];
      let loadCount = 0;

      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const src = getImageSrc(i);
        
        img.onload = () => {
          loadCount++;
          setLoadedImages(loadCount);
          
          if (loadCount === frameCount) {
            setIsReady(true);
            // Draw first frame once all images are loaded
            drawFrame(1);
          }
        };
        
        img.onerror = () => {
          console.error(`Failed to load frame: ${src}`);
          loadCount++;
          setLoadedImages(loadCount);
        };
        
        img.src = src;
        images[i - 1] = img; // Store in array (0-indexed)
      }
      
      imagesRef.current = images;
    };

    preloadImages();
  }, [frameCount, frameBaseName, frameExtension, frameDigits, imagePath]);

  // Draw specific frame to canvas
  const drawFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imagesRef.current[frameIndex - 1]; // Convert to 0-indexed
    
    if (canvas && ctx && img && img.complete) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image to fill canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  // Handle canvas resize
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Redraw current frame after resize
      if (isReady) {
        drawFrame(currentFrame);
      }
    }
  };

  // Set up canvas dimensions
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentFrame, isReady]);

  // Scroll handler with optimized frame calculation
  useEffect(() => {
    const updateFrame = () => {
      if (!containerRef.current || !isReady) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      
      const targetFrame = Math.min(Math.max(Math.round(scrollProgress * frameCount) + 1, 1), frameCount);
      
      if (targetFrame !== currentFrame) {
        setCurrentFrame(targetFrame);
        drawFrame(targetFrame);
      }
    };

    const handleScroll = () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      requestRef.current = requestAnimationFrame(updateFrame);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial calculation
    updateFrame();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [frameCount, currentFrame, isReady]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: `${frameCount * heightPerFrame}vh`, 
        position: "relative" 
      }}
    >
      <canvas
        ref={canvasRef}
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
      
      {/* Loading indicator */}
      {!isReady && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 1000,
        }}>
          <div>Loading frames: {loadedImages}/{frameCount}</div>
          <div>{Math.round((loadedImages / frameCount) * 100)}%</div>
        </div>
      )}

      {/* Debug info */}
      <div style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        zIndex: 999,
      }}>
        Frame: {currentFrame}/{frameCount} | Ready: {isReady ? 'Yes' : 'No'}
      </div>

      {/* Content overlay */}
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        color: "white",
        padding: "2rem",
        display: "flex",
      }}>
        <h3>Scroll to control canvas animation</h3>
      </div>
    </div>
  );
};

export default CanvasScrollSequence;
