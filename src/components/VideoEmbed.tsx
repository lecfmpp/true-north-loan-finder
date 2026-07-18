import React from "react";
import DOMPurify from 'dompurify';

interface VideoEmbedProps {
  url?: string;
  embedCode?: string;
  title?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId = null;
    
    // Handle different YouTube URL formats
    if (u.hostname.includes("youtube.com")) {
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      videoId = u.searchParams.get("v");
      
      // Already embed URL: https://www.youtube.com/embed/VIDEO_ID
      if (!videoId && u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.split("/embed/")[1]?.split("?")[0];
      }
      
      // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
      if (!videoId && u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split("?")[0];
      }
    }
    
    // Short URL: https://youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.replace("/", "").split("?")[0];
    }
    
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
    }
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const videoId = u.pathname.split("/").filter(Boolean)[0];
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch (error) {
    console.error("Error parsing Vimeo URL:", error);
  }
  return null;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, embedCode, title = "Video" }) => {
  // If embed code is provided, sanitize and use it
  if (embedCode?.trim()) {
    return (
      <div 
        className="w-full h-full" 
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(embedCode) }} 
      />
    );
  }

  // If no URL provided, show placeholder
  if (!url?.trim()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
          <div className="w-0 h-0 border-l-8 border-l-primary-foreground border-t-6 border-t-transparent border-b-6 border-b-transparent ml-1"></div>
        </div>
        <p>Video will appear here once configured</p>
      </div>
    );
  }

  // Try to get embed URL for supported platforms
  const youtubeEmbed = getYouTubeEmbedUrl(url);
  const vimeoEmbed = getVimeoEmbedUrl(url);
  const embedUrl = youtubeEmbed || vimeoEmbed;

  if (embedUrl) {
    return (
      <div className="w-full h-full">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  // Fallback for unsupported URLs
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded p-4">
      <p className="text-center">
        Unsupported video URL format. Please use a YouTube or Vimeo URL, or paste the embed code directly.
      </p>
      <p className="text-xs text-center mt-2">
        URL: {url}
      </p>
    </div>
  );
};

export default VideoEmbed;
