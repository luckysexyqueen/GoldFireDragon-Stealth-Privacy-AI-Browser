import { useState, useRef, useCallback, useEffect } from 'react';

export interface ScreenFrame {
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  mediaType?: 'video' | 'image' | 'webpage' | 'unknown';
  detectedSite?: string;
  dominantColors?: string[];
}

export interface MediaDetection {
  hasVideo: boolean;
  hasImages: boolean;
  videoCount: number;
  imageCount: number;
  siteType: 'video-streaming' | 'image-gallery' | 'social-media' | 'news' | 'general' | 'unknown';
  siteName: string;
  isPlaying: boolean;
  videoProgress?: number;
  videoDuration?: number;
}

export interface UseScreenCaptureReturn {
  isCapturing: boolean;
  currentFrame: ScreenFrame | null;
  stream: MediaStream | null;
  error: string | null;
  mediaDetection: MediaDetection | null;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  captureSnapshot: () => ScreenFrame | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Detect site type from URL/title patterns in the captured frame
function detectSiteFromFrame(canvas: HTMLCanvasElement): { siteType: MediaDetection['siteType']; siteName: string } {
  // We analyze pixel patterns to detect media-heavy pages
  const ctx = canvas.getContext('2d');
  if (!ctx) return { siteType: 'unknown', siteName: 'Unknown' };

  // Sample pixels to detect video/image content
  const w = canvas.width;
  const h = canvas.height;
  const sampleData = ctx.getImageData(0, 0, Math.min(w, 100), Math.min(h, 100));
  const pixels = sampleData.data;

  // Calculate color variance (high variance = likely media content)
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < pixels.length; i += 16) {
    rSum += pixels[i];
    gSum += pixels[i + 1];
    bSum += pixels[i + 2];
    count++;
  }
  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;

  // Dark frame = likely video player
  const isDark = rAvg < 50 && gAvg < 50 && bAvg < 50;
  // Colorful = likely image gallery or social media
  const isColorful = Math.abs(rAvg - gAvg) > 30 || Math.abs(gAvg - bAvg) > 30;

  if (isDark) return { siteType: 'video-streaming', siteName: '동영상 스트리밍' };
  if (isColorful) return { siteType: 'image-gallery', siteName: '이미지/미디어 사이트' };
  return { siteType: 'general', siteName: '웹페이지' };
}

function detectDominantColors(canvas: HTMLCanvasElement): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const data = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50)).data;
  const colorMap: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 20) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `rgb(${r},${g},${b})`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }
  return Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
}

function detectMediaType(canvas: HTMLCanvasElement, prevFrame: ScreenFrame | null): ScreenFrame['mediaType'] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unknown';

  // Compare with previous frame to detect motion (video)
  if (prevFrame) {
    const prevCanvas = document.createElement('canvas');
    prevCanvas.width = 20;
    prevCanvas.height = 20;
    const prevCtx = prevCanvas.getContext('2d');
    if (prevCtx) {
      const img = new Image();
      img.src = prevFrame.dataUrl;
      // Quick pixel diff check
      const curr = ctx.getImageData(0, 0, 20, 20).data;
      let diff = 0;
      for (let i = 0; i < curr.length; i += 4) {
        diff += Math.abs(curr[i] - (curr[i] || 0));
      }
      if (diff > 5000) return 'video';
    }
  }

  // Check for image-like content (high saturation, uniform regions)
  const sample = ctx.getImageData(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100).data;
  let satSum = 0;
  for (let i = 0; i < sample.length; i += 4) {
    const r = sample[i] / 255, g = sample[i + 1] / 255, b = sample[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
  }
  const avgSat = satSum / (sample.length / 4);
  if (avgSat > 0.3) return 'image';

  return 'webpage';
}

export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<ScreenFrame | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaDetection, setMediaDetection] = useState<MediaDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevFrameRef = useRef<ScreenFrame | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const captureSnapshot = useCallback((): ScreenFrame | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCapturing) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const mediaType = detectMediaType(canvas, prevFrameRef.current);
    const { siteType, siteName } = detectSiteFromFrame(canvas);
    const dominantColors = detectDominantColors(canvas);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    const frame: ScreenFrame = {
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height,
      mediaType,
      detectedSite: siteName,
      dominantColors,
    };

    prevFrameRef.current = frame;
    setCurrentFrame(frame);
    frameCountRef.current += 1;

    // Update media detection every 5 frames
    if (frameCountRef.current % 5 === 0) {
      setMediaDetection({
        hasVideo: mediaType === 'video',
        hasImages: mediaType === 'image',
        videoCount: mediaType === 'video' ? 1 : 0,
        imageCount: mediaType === 'image' ? 1 : 0,
        siteType,
        siteName,
        isPlaying: mediaType === 'video',
      });
    }

    return frame;
  }, [isCapturing]);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 10, max: 15 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCapturing(true);
      frameCountRef.current = 0;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Capture every 1.5 seconds for better media detection
      intervalRef.current = setInterval(() => {
        captureSnapshot();
      }, 1500);

      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsCapturing(false);
        setStream(null);
        setCurrentFrame(null);
        setMediaDetection(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Screen capture failed';
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setError('화면 공유 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
      } else if (msg.includes('NotSupportedError')) {
        setError('이 브라우저는 화면 공유를 지원하지 않습니다.');
      } else {
        setError(`화면 공유 오류: ${msg}`);
      }
      setIsCapturing(false);
    }
  }, [captureSnapshot]);

  const stopCapture = useCallback(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
    setStream(null);
    setCurrentFrame(null);
    setMediaDetection(null);
    setError(null);
    prevFrameRef.current = null;
    frameCountRef.current = 0;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stream]);

  return { isCapturing, currentFrame, stream, error, mediaDetection, startCapture, stopCapture, captureSnapshot, videoRef };
}