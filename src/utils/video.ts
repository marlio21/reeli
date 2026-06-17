/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ParsedVideo {
  type: 'direct' | 'youtube' | 'vimeo' | 'unsupported';
  url: string;
}

export const parseVideoUrl = (url: string | undefined): ParsedVideo => {
  if (!url) return { type: 'unsupported', url: '' };
  
  const trimmed = url.trim();
  
  // Direct file extensions
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) {
    return { type: 'direct', url: trimmed };
  }
  
  // YouTube RegExp patterns (including /shorts/, m.youtube.com, etc.)
  const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch) {
    const videoId = ytMatch[1];
    // Create an embed URL with autoplay, mute, and loop parameters
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&controls=0&modestbranding=1`;
    return { type: 'youtube', url: embedUrl };
  }
  
  // Vimeo RegExp patterns
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.|player\.|vimeo\.)?(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1&playsinline=1`;
    return { type: 'vimeo', url: embedUrl };
  }
  
  // If it's already an embed URL
  if (trimmed.includes('youtube.com/embed/')) {
    return { type: 'youtube', url: trimmed };
  }
  if (trimmed.includes('player.vimeo.com/video/')) {
    return { type: 'vimeo', url: trimmed };
  }

  // Fallback: If it's an HTTP link, treat it as a direct stream link
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: 'direct', url: trimmed };
  }
  
  return { type: 'unsupported', url: trimmed };
};

export const isValidVideoUrl = (url: string): boolean => {
  const parsed = parseVideoUrl(url);
  return parsed.type !== 'unsupported';
};

export interface ResolvedUreelVideo {
  type: 'youtube' | 'youtube_shorts' | 'direct_mp4' | 'direct_webm' | 'none';
  url: string;
  embedUrl: string;
  videoSrc: string;
  displayMode: 'cover' | 'contain';
  placement: 'background' | 'hero';
  heroSize?: 'wide' | 'compact';
  duration: number;
  startAt: number;
}

export const resolveUreelVideo = (videoConfig: any): ResolvedUreelVideo => {
  const defaultResolved: ResolvedUreelVideo = {
    type: 'none',
    url: '',
    embedUrl: '',
    videoSrc: '',
    displayMode: 'cover',
    placement: 'background',
    heroSize: 'wide',
    duration: 12,
    startAt: 0,
  };

  if (!videoConfig) return defaultResolved;

  const url = (videoConfig.url || '').trim();
  const rawType = videoConfig.type || 'none';
  const displayMode = videoConfig.displayMode || 'cover';
  const placement = videoConfig.placement || 'background';
  const heroSize = videoConfig.heroSize || 'wide';
  const duration = typeof videoConfig.duration === 'number' ? videoConfig.duration : 12;
  const startAt = typeof videoConfig.startAt === 'number' ? videoConfig.startAt : 0;

  if (!url) return { ...defaultResolved, displayMode, placement, heroSize, duration, startAt };

  // Detect YouTube vs YouTube Shorts vs Direct Stream
  let type: ResolvedUreelVideo['type'] = rawType;
  let embedUrl = '';
  let videoSrc = '';

  const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);

  if (ytMatch) {
    const videoId = ytMatch[1];
    const isShorts = url.includes('/shorts/');
    type = isShorts ? 'youtube_shorts' : 'youtube';

    const startParam = startAt > 0 ? `&start=${startAt}` : '';
    const endParam = duration > 0 ? `&end=${Math.max(1, Math.round(startAt + duration))}` : '';
    // Build secure parameters: muted play, no controls, no YouTube loop. The ureel
    // timeline overlays the endcard exactly after the configured scene duration.
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=0&playsinline=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3${startParam}${endParam}`;
  } else if (/\.(mp4|m4v)(\?.*)?$/i.test(url)) {
    type = 'direct_mp4';
    videoSrc = url;
  } else if (/\.(webm)(\?.*)?$/i.test(url)) {
    type = 'direct_webm';
    videoSrc = url;
  } else if (/^https?:\/\//i.test(url)) {
    // Fallback detection based on url string
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      type = 'youtube';
      embedUrl = url;
    } else {
      type = 'direct_mp4';
      videoSrc = url;
    }
  } else {
    type = 'none';
  }

  return {
    type,
    url,
    embedUrl,
    videoSrc,
    displayMode,
    placement,
    heroSize,
    duration,
    startAt,
  };
};

