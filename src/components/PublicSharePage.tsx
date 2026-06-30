/**
 * v52.6.08 / RC3.1 – Premium Share System
 * Public distribution page for /share/:slug.
 * Does not modify Mobile Studio or the public mobile renderer.
 */
import React, { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import QRCode from "qrcode";
import { Card } from "../types";
import {
  SHARE_SLOGAN_DE,
  SHARE_SLOGAN_EN,
  buildShareDescription,
  buildShareText,
  buildShareTitle,
  copyToClipboard,
  getEmailShareUrl,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getNfcUrl,
  getPublicCardUrl,
  getSharePageUrl,
  getWhatsAppShareUrl,
} from "../utils/shareUtils";

interface PublicSharePageProps {
  card: Card;
  lang: "de" | "en";
  setLang?: (lang: "de" | "en") => void;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({
  card,
  lang,
  setLang,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const publicUrl = getPublicCardUrl(card.slug);
  const shareUrl = getSharePageUrl(card.slug);
  const nfcUrl = getNfcUrl(card.slug);
  const title = buildShareTitle(card, lang);
  const description = buildShareDescription(card, lang);
  const slogan = lang === "de" ? SHARE_SLOGAN_DE : SHARE_SLOGAN_EN;
  const shareText = buildShareText(card, lang, shareUrl);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, {
      margin: 1.2,
      width: 720,
      color: { dark: "#21190F", light: "#F6E4B1" },
    })
      .then(setQrCodeUrl)
      .catch((err) => console.error("Share page QR generation failed:", err));
  }, [publicUrl]);

  const copy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const channels = [
    {
      key: "copy",
      icon: <LucideIcons.Copy size={17} />,
      label: lang === "de" ? "Link kopieren" : "Copy link",
      helper:
        lang === "de"
          ? "Share-Link für Social Preview"
          : "Share link for social previews",
      action: () => copy(shareUrl, "share"),
    },
    {
      key: "whatsapp",
      icon: <LucideIcons.MessageCircle size={17} />,
      label: "WhatsApp",
      helper: lang === "de" ? "Mit Vorschau teilen" : "Share with preview",
      action: () => openExternal(getWhatsAppShareUrl(shareText)),
    },
    {
      key: "linkedin",
      icon: <LucideIcons.Linkedin size={17} />,
      label: "LinkedIn",
      helper: lang === "de" ? "Professionell posten" : "Post professionally",
      action: () => openExternal(getLinkedInShareUrl(shareUrl)),
    },
    {
      key: "facebook",
      icon: <LucideIcons.Facebook size={17} />,
      label: "Facebook",
      helper: lang === "de" ? "Als Beitrag teilen" : "Share as post",
      action: () => openExternal(getFacebookShareUrl(shareUrl)),
    },
    {
      key: "email",
      icon: <LucideIcons.Mail size={17} />,
      label: "E-Mail",
      helper:
        lang === "de" ? "Mit sauberem Text senden" : "Send with clean text",
      action: () => {
        window.location.href = getEmailShareUrl(title, shareText);
      },
    },
    {
      key: "nfc",
      icon: <LucideIcons.RadioTower size={17} />,
      label: "NFC",
      helper:
        lang === "de" ? "Direktlink für NFC kopieren" : "Copy direct NFC link",
      action: () => copy(nfcUrl, "nfc"),
    },
  ];

  return (
    <main className="min-h-screen bg-[#060606] text-[#F5F2EA] font-sans overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 28% 18%, rgba(246,214,141,0.15), transparent 32%), radial-gradient(circle at 72% 52%, rgba(246,214,141,0.11), transparent 30%), linear-gradient(135deg, #070707 0%, #15120D 48%, #050505 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(246,214,141,0.25), transparent 58%)",
        }}
      />

      <section className="relative z-10 max-w-6xl mx-auto px-5 py-8 md:py-12 min-h-screen flex flex-col justify-center">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C56A]/25 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#EAD38D]">
            <LucideIcons.Sparkles size={13} />
            <span>{lang === "de" ? "Premium Share" : "Premium Share"}</span>
          </div>
          {setLang && (
            <button
              type="button"
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-white transition"
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] text-[#F7F0E4]">
                {slogan.split("Aktion.")[0] || slogan.replace("action.", "")}
                <span className="text-[#E8C56A]">
                  {lang === "de" ? "Aktion." : "action."}
                </span>
              </h1>
              <p className="max-w-xl text-lg md:text-2xl text-stone-300 leading-relaxed font-medium">
                {description}
              </p>
            </div>

            <div className="rounded-[30px] border border-[#E8C56A]/18 bg-black/35 backdrop-blur-xl p-4 md:p-5 shadow-2xl max-w-2xl">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <img
                  src="/brand/ureel-share-og.png"
                  alt="Share Preview"
                  className="w-full md:w-56 rounded-2xl border border-white/10 object-cover shadow-xl"
                />
                <div className="space-y-2 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#E8C56A] font-black">
                    {lang === "de" ? "Geteilte Karte" : "Shared card"}
                  </div>
                  <h2 className="text-2xl font-black text-white truncate">
                    {title}
                  </h2>
                  <p className="text-sm text-stone-400 leading-relaxed line-clamp-3">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {channels.map((channel) => (
                <button
                  key={channel.key}
                  type="button"
                  onClick={channel.action}
                  className="group rounded-2xl border border-white/10 bg-white/[0.045] hover:bg-white/[0.075] hover:border-[#E8C56A]/35 p-4 text-left transition flex items-center gap-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#E8C56A]/10 border border-[#E8C56A]/25 flex items-center justify-center text-[#E8C56A] group-hover:scale-105 transition">
                    {channel.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-white">
                      {channel.label}
                    </span>
                    <span className="block text-[11px] text-stone-400 truncate">
                      {channel.helper}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <a
                href={publicUrl}
                className="flex-1 rounded-2xl bg-[#F0D28A] text-black font-black uppercase tracking-widest text-xs py-4 px-5 text-center shadow-[0_0_28px_rgba(232,197,106,0.18)] hover:bg-[#FFE4A7] transition"
              >
                {lang === "de" ? "Öffnen & erleben" : "Open & experience"}
              </a>
              <button
                type="button"
                onClick={() => copy(publicUrl, "direct")}
                className="flex-1 rounded-2xl border border-white/12 bg-white/[0.035] text-[#F5F2EA] font-black uppercase tracking-widest text-xs py-4 px-5 hover:bg-white/[0.07] transition"
              >
                {lang === "de" ? "Direktlink kopieren" : "Copy direct link"}
              </button>
            </div>
          </div>

          <aside className="relative">
            <div className="absolute -inset-6 rounded-[48px] bg-[#E8C56A]/12 blur-3xl" />
            <div className="relative rounded-[44px] border border-[#E8C56A]/20 bg-[#0B0A08]/90 p-6 shadow-2xl overflow-hidden">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at 50% 10%, rgba(232,197,106,0.18), transparent 40%)",
                }}
              />
              <div className="relative z-10 space-y-6 text-center">
                <img
                  src="/brand/ureel-story-template.png"
                  alt="Story Template"
                  className="w-full rounded-[30px] border border-white/10 shadow-2xl object-cover max-h-[560px]"
                />
                <div className="rounded-3xl border border-[#E8C56A]/20 bg-black/40 p-5 space-y-3">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-36 h-36 mx-auto rounded-2xl bg-[#F6E4B1] p-2"
                    />
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#E8C56A] font-black">
                      QR / NFC
                    </p>
                    <p className="text-sm text-stone-300 font-semibold mt-1">
                      {lang === "de"
                        ? "Scannen & sofort öffnen."
                        : "Scan & open instantly."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {copied && (
          <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-full border border-[#E8C56A]/30 bg-black/85 px-5 py-3 text-xs font-black uppercase tracking-widest text-[#F5F2EA] shadow-2xl">
            {lang === "de" ? "Kopiert" : "Copied"}
          </div>
        )}
      </section>
    </main>
  );
};
