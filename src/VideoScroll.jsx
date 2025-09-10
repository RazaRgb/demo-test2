import React, { useRef, useEffect, useState } from "react";

const ScrollVideoPlayer = ({ src, heightPerSecond = 200 }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState("800vh");
  const requestRef = useRef();

  useEffect(() => {
    const video = videoRef.current;
    const onVideoLoaded = () => {
      if (video) {
        setContainerHeight(`${video.duration * heightPerSecond}vh`);
      }
    };

    if (video) {
      if (video.readyState >= 1) {
        onVideoLoaded();
      } else {
        video.addEventListener("loadedmetadata", onVideoLoaded);
      }
    }

    return () => {
      if (video) video.removeEventListener("loadedmetadata", onVideoLoaded);
    };
  }, [heightPerSecond]);

  useEffect(() => {
    let lastTime = 0;

    const updateVideo = () => {
      if (!videoRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const video = videoRef.current;
      
      const rect = container.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      
      const targetTime = scrollProgress * video.duration;
      
      // Only update if change is significant enough (reduces stuttering)
      if (Math.abs(targetTime - lastTime) > 0.03) {
        video.currentTime = targetTime;
        lastTime = targetTime;
      }
    };

    const handleScroll = () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      requestRef.current = requestAnimationFrame(updateVideo);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: containerHeight, position: "relative" }}>
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -1,
        }}
        src={src}
      />
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        color: "white",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.2)"
      }}>
        <h1>Scroll to control video playback</h1>
      </div>
    </div>
  );
};

export default ScrollVideoPlayer;

