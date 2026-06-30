/**
 * Premium Share System helpers (RC3.1)
 * Centralized URL and platform-share generation. Keep Mobile Studio untouched.
 */
import { Card } from "../types";

export const SHARE_SLOGAN_DE = "Aus Video wird Aktion.";
export const SHARE_SLOGAN_EN = "Turn video into action.";

export const PUBLIC_SHARE_ORIGIN = "https://www.ureel.me";

const getOrigin = (): string => {
  if (typeof window === "undefined" || !window.location?.origin) {
    return PUBLIC_SHARE_ORIGIN;
  }

  const { origin, hostname } = window.location;

  // Local development should keep working on localhost. Public shares should always
  // use the stable production domain, not temporary Vercel preview domains.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }

  return PUBLIC_SHARE_ORIGIN;
};

const cleanSlug = (slug?: string): string => (slug || "").toString().trim();

export const getPublicCardUrl = (slug?: string): string => {
  const clean = cleanSlug(slug);
  if (!clean || clean === "undefined" || clean === "null") return "";
  return `${getOrigin()}/u/${encodeURIComponent(clean)}`;
};

export const getSharePageUrl = (slug?: string): string => {
  const clean = cleanSlug(slug);
  if (!clean || clean === "undefined" || clean === "null") return "";
  return `${getOrigin()}/share/${encodeURIComponent(clean)}`;
};

export const getNfcUrl = getPublicCardUrl;

export const buildShareTitle = (
  card: Card,
  lang: "de" | "en" = "de",
): string => {
  return (
    card.ogTitle ||
    card.metaTitle ||
    card.heroTitle ||
    card.title ||
    (lang === "de" ? SHARE_SLOGAN_DE : SHARE_SLOGAN_EN)
  );
};

export const buildShareDescription = (
  card: Card,
  lang: "de" | "en" = "de",
): string => {
  return (
    card.ogDescription ||
    card.metaDescription ||
    card.heroSubtitle ||
    card.subtitle ||
    card.description ||
    (lang === "de"
      ? "Interaktive Karten. Ein Link. Unendliche Möglichkeiten."
      : "Interactive cards. One link. Endless possibilities.")
  );
};

export const buildShareText = (
  card: Card,
  lang: "de" | "en" = "de",
  url?: string,
): string => {
  const targetUrl =
    url || getSharePageUrl(card.slug) || getPublicCardUrl(card.slug);
  const title = buildShareTitle(card, lang);
  const slogan = lang === "de" ? SHARE_SLOGAN_DE : SHARE_SLOGAN_EN;
  return `${title}\n${slogan}\n${targetUrl}`;
};

export const getWhatsAppShareUrl = (text: string): string =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
export const getLinkedInShareUrl = (url: string): string =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
export const getFacebookShareUrl = (url: string): string =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
export const getEmailShareUrl = (subject: string, body: string): string =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const copyToClipboard = async (text: string): Promise<void> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};
