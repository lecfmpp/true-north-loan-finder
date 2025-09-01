import React from "react";

interface VideoEmbedProps {
  url?: string;
  embedCode?: string;
  title?: string;
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      // watch?v=, embed/, shorts/
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const paths = u.pathname.split("/").filter(Boolean);
      if (paths[0] === "embed" && paths[1]) return `https://www.youtube.com/embed/${paths[1]}`;
      if (paths[0] === "shorts" && paths[1]) return `https://www.youtube.com/embed/${paths[1]}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}
  return null;
}

function toVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return null;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, embedCode, title = "Video" }) => {
  if (embedCode) {
    return (
      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: embedCode }} />
    );
  }

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Video unavailable
      </div>
    );
  }

  const yt = toYouTubeEmbed(url);
  const vm = toVimeoEmbed(url);
  const src = yt || vm || url;

  return (
    <div className="w-full h-full">
      <iframe
        src={src}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

export default VideoEmbed;
