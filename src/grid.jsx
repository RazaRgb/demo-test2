import React, { useState, useEffect, useRef, useCallback } from 'react';

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });
  useEffect(() => {
    const updateMousePosition = (ev) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);
  return mousePosition;
};

const GridCanvasDisplay = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mousePosition = useMousePosition();
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [imageBounds, setImageBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Preload all images into memory
  useEffect(() => {
    const loadImages = async () => {
      try {
        const imagePaths = import.meta.glob('../public/dvmlogowrkbnch/*.{png,jpg,jpeg,svg,webp}', { 
          eager: true 
        });
        
        const imageUrls = Object.values(imagePaths).map(module => module.default);
        
        if (imageUrls.length === 0) {
          console.warn('No images found in ../public/dvmlogowrkbnch/');
          return;
        }

        const imagePromises = imageUrls.map((url, index) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              setLoadingProgress(prev => prev + (1 / imageUrls.length) * 100);
              resolve(img);
            };
            
            img.onerror = () => {
              console.error(`Failed to load image: ${url}`);
              reject(new Error(`Failed to load ${url}`));
            };
            
            img.src = url;
          });
        });

        const loadedImages = await Promise.all(imagePromises);
        setImages(loadedImages);
        setImagesLoaded(true);
        console.log(`Preloaded ${loadedImages.length} images into memory`);
        
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    loadImages();
  }, []);

  // Update current image index based on mouse position relative to image
  useEffect(() => {
    if (mousePosition.x !== null && mousePosition.y !== null && images.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Convert mouse position to canvas coordinates
      const canvasX = mousePosition.x - rect.left;
      const canvasY = mousePosition.y - rect.top;
      
      // Check if mouse is within image bounds
      if (canvasX >= imageBounds.x && 
          canvasX <= imageBounds.x + imageBounds.width &&
          canvasY >= imageBounds.y && 
          canvasY <= imageBounds.y + imageBounds.height) {
        
        // Calculate position relative to image
        const relativeX = canvasX - imageBounds.x;
        const relativeY = canvasY - imageBounds.y;
        
        // Grid configuration
        const cols = 40;
        const rows = 40;
        const colWidth = imageBounds.width / cols;
        const rowHeight = imageBounds.height / rows;
        
        const col = Math.floor(relativeX / colWidth);
        const row = Math.floor(relativeY / rowHeight);
        const imageIndex = Math.min(row * cols + col, images.length - 1);
        
        setCurrentImageIndex(imageIndex);
      } else {
        // Mouse is outside image bounds - show first image
        //setCurrentImageIndex(0);
      }
    }
  }, [mousePosition, images.length, imageBounds]);

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || images.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match display size for crisp rendering
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw current image
    const img = images[currentImageIndex];
    if (img && img.complete) {
      // Calculate scaling to fit image while maintaining aspect ratio
      const canvasAspect = rect.width / rect.height;
      const imageAspect = img.width / img.height;
      
      let drawWidth, drawHeight;
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to width
        drawWidth = Math.min(rect.width * 0.8, img.width);
        drawHeight = drawWidth / imageAspect;
      } else {
        // Image is taller - fit to height
        drawHeight = Math.min(rect.height * 0.8, img.height);
        drawWidth = drawHeight * imageAspect;
      }
      
      // Center the image
      const x = (rect.width - drawWidth) / 2;
      const y = (rect.height - drawHeight) / 2;
      
      // Update image bounds for mouse detection
      setImageBounds({ x, y, width: drawWidth, height: drawHeight });
      
      // Save context before clipping
      ctx.save();
      
      // Add smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image with rounded corners
      const radius = 10;
      ctx.beginPath();
      ctx.roundRect(x, y, drawWidth, drawHeight, radius);
      ctx.clip();
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      
      // Restore context after clipping
      ctx.restore();
      
      // Draw border and shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, drawWidth, drawHeight, radius);
      ctx.stroke();
      ctx.restore();
    }
  }, [images, currentImageIndex, imagesLoaded]);

  // Handle canvas resize and redraw
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(drawCanvas);
    };

    handleResize(); // Initial draw
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  // Redraw when current image changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [currentImageIndex, drawCanvas]);

  // Loading screen
  if (!imagesLoaded) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          fontSize: '18px',
          marginBottom: '20px',
          color: '#333'
        }}>
          Loading Images...
        </div>
        
        <div style={{
          width: '300px',
          height: '10px',
          backgroundColor: '#ddd',
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${loadingProgress}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
            borderRadius: '5px'
          }} />
        </div>
        
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: '#666'
        }}>
          {Math.round(loadingProgress)}%
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#f0f0f0' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'crosshair'
        }}
      />
      
      {/* Debug info */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        <div>Mouse: ({mousePosition.x}, {mousePosition.y})</div>
        <div>Canvas Mouse: ({Math.round(mousePosition.x - (canvasRef.current?.getBoundingClientRect().left || 0))}, {Math.round(mousePosition.y - (canvasRef.current?.getBoundingClientRect().top || 0))})</div>
        <div>Image Bounds: {Math.round(imageBounds.width)}x{Math.round(imageBounds.height)}</div>
        <div>Image: {currentImageIndex + 1} of {images.length}</div>
        <div>Status: {images.length > 0 ? '✅ Loaded' : '⏳ Loading'}</div>
      </div>

      {/* Optional: Visual grid overlay on the image */}
      {imageBounds.width > 0 && (
        <div style={{
          position: 'absolute',
          left: `${imageBounds.x}px`,
          top: `${imageBounds.y}px`,
          width: `${imageBounds.width}px`,
          height: `${imageBounds.height}px`,
          pointerEvents: 'none',
          opacity: 0.1,
          zIndex: 999
        }}>
          {/* Create grid lines */}
          {Array.from({ length: 19 }, (_, i) => (
            <div
              key={`v-${i}`}
              style={{
                position: 'absolute',
                left: `${((i + 1) / 20) * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: 'red'
              }}
            />
          ))}
          {Array.from({ length: 19 }, (_, i) => (
            <div
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: `${((i + 1) / 20) * 100}%`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: 'red'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GridCanvasDisplay;

