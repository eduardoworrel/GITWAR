import { useCallback, useEffect, useRef, useState } from 'react';

export function usePictureInPicture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check if PiP is supported (disable on Safari due to canvas stream issues)
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      console.log('[PiP] Safari detected - PiP disabled due to canvas stream limitations');
      setIsPiPSupported(false);
      return;
    }

    const hasStandardPiP = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
    console.log('[PiP] Support check:', { hasStandardPiP, isSafari });
    setIsPiPSupported(hasStandardPiP);
  }, []);

  // Initialize video element with canvas stream
  useEffect(() => {
    if (!isPiPSupported) return;

    const initVideo = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        setTimeout(initVideo, 500);
        return;
      }

      if (!videoRef.current) {
        const video = document.createElement('video');
        video.style.display = 'none';
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        document.body.appendChild(video);
        videoRef.current = video;

        video.addEventListener('enterpictureinpicture', () => {
          console.log('[PiP] Entered PiP');
          setIsPiPActive(true);
        });
        video.addEventListener('leavepictureinpicture', () => {
          console.log('[PiP] Left PiP');
          setIsPiPActive(false);
        });
      }

      try {
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.play()
          .then(() => setIsReady(true))
          .catch(() => setIsReady(true));
      } catch (err) {
        console.error('[PiP] Canvas captureStream failed:', err);
      }
    };

    const timeout = setTimeout(initVideo, 1000);
    return () => clearTimeout(timeout);
  }, [isPiPSupported]);

  // Toggle PiP
  const togglePiP = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('[PiP] Error:', error);
    }
  }, [isReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        if (document.pictureInPictureElement === videoRef.current) {
          document.exitPictureInPicture().catch(() => {});
        }
        videoRef.current.remove();
      }
    };
  }, []);

  return {
    isPiPActive,
    isPiPSupported: isPiPSupported && isReady,
    togglePiP,
  };
}
