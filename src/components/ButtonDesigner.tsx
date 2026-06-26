/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton, ButtonGridLayout } from '../types';
import { ButtonRenderer } from './ButtonRenderer';
import { useFirebase } from '../context/FirebaseContext';
import { compressAndSquareImage, compressImageBeforeUpload, formatImageOptimizationToast } from '../utils/image';
import { LIBRARY_ICONS } from '../data';
import { UpgradeModal } from './UpgradeModal';
import { canUseFeature, isFeatureLocked, getUserPlan } from '../config/plans';
import {
  normalizeButton,
  validateButton,
  buildButtonActionUrl,
} from '../utils/buttonUtils';
import { deriveCanonicalButtonGridLayout } from '../utils/mobileLayoutPersistence';

// Modular tab component imports
import { ButtonFaceTab } from './button-designer/ButtonFaceTab';
import { ButtonAppearanceTab } from './button-designer/ButtonAppearanceTab';
import { ButtonTextTab } from './button-designer/ButtonTextTab';
import { ButtonActionTab } from './button-designer/ButtonActionTab';
import { ErrorBoundary } from './ErrorBoundary';

interface ButtonDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: Card;
  editingButton: CardButton | null;
  onSave: (button: CardButton, cleanFields: { passwordHash?: string; rawPassword?: string; imageMeta?: any }) => Promise<void>;
  onDelete?: (buttonId: string) => Promise<void>;
  onDuplicate?: (button: CardButton) => Promise<void>;
  lang?: 'de' | 'en';
  onSaveAllButtons?: (buttons: CardButton[], extraCardFields?: Partial<Card>) => Promise<void>;
}

export const ButtonDesigner: React.FC<ButtonDesignerProps> = ({
  isOpen,
  onClose,
  activeCard,
  editingButton,
  onSave,
  onDelete,
  onDuplicate,
  lang = 'de',
  onSaveAllButtons,
}) => {
  const { uploadFile, profile, effectivePlanId, user } = useFirebase();
  const currentPlan = effectivePlanId || getUserPlan(profile);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<any>('');
  const [localGridLayout, setLocalGridLayout] = useState<Required<ButtonGridLayout>>(() =>
    deriveCanonicalButtonGridLayout(activeCard, { preferLiveFields: true })
  );

  useEffect(() => {
    setLocalGridLayout(deriveCanonicalButtonGridLayout(activeCard, { preferLiveFields: true }));
  }, [activeCard?.id, activeCard?.buttonGridLayout, activeCard?.buttonSizePx, activeCard?.buttonGapPx, activeCard?.buttonGridCols]);

  // Active section to manage: 'face' | 'styling' | 'text' | 'function' | null
  const [activeTab, setActiveTab] = useState<'face' | 'styling' | 'text' | 'function' | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

  const [btnSize, setBtnSize] = useState<{
    preset: 'compact' | 'standard' | 'large' | 'custom';
    width?: number | string;
    height?: number;
    minHeight?: number;
    paddingX?: number;
    paddingY?: number;
    gap?: number;
    scale?: number;
  }>({ preset: 'standard' });

  const [transferShape, setTransferShape] = useState(true);
  const [transferSize, setTransferSize] = useState(true);
  const [transferFaceColor, setTransferFaceColor] = useState(true);
  const [transferBorder, setTransferBorder] = useState(true);
  const [transferIconStyle, setTransferIconStyle] = useState(true);
  const [transferTextStyle, setTransferTextStyle] = useState(true);
  const [transferButtonImage, setTransferButtonImage] = useState(false);
  const [transferRaster, setTransferRaster] = useState(false);
  const [transferTargetMode, setTransferTargetMode] = useState<'all' | 'custom'>('all');

  // Draft button states
  const [btnId, setBtnId] = useState('');
  const [btnTitle, setBtnTitle] = useState('');
  const [btnActionType, setBtnActionType] = useState('website');
  const [btnActionValue, setBtnActionValue] = useState('');

  // Typography details
  const [btnTextColor, setBtnTextColor] = useState('#1E1E1E');
  const [btnFontFamily, setBtnFontFamily] = useState('Inter');
  const [btnFontSize, setBtnFontSize] = useState(13);
  const [btnFontWeight, setBtnFontWeight] = useState('medium');
  const [btnLetterSpacing, setBtnLetterSpacing] = useState(0);
  const [btnTextAlign, setBtnTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [btnTextPosition, setBtnTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [btnTextPadding, setBtnTextPadding] = useState(8);
  const [btnTextShadow, setBtnTextShadow] = useState<'none' | 'soft' | 'strong'>('none');
  const [btnTextWrap, setBtnTextWrap] = useState<'single' | 'multi' | 'ellipsis'>('single');

  // Surface details
  const [btnBgColor, setBtnBgColor] = useState('#A855F7');
  const [btnGradient, setBtnGradient] = useState('');
  const [btnOpacity, setBtnOpacity] = useState(100);
  const [btnStyleVariant, setBtnStyleVariant] = useState<'filled' | 'outline' | 'minimal' | 'soft' | 'gradient'>('filled');

  // Icon & graphic details
  const [btnIcon, setBtnIcon] = useState('Link');
  const [btnIconColor, setBtnIconColor] = useState('#1E1E1E');
  const [btnIconSize, setBtnIconSize] = useState(18);
  const [btnIconPosition, setBtnIconPosition] = useState<'left' | 'right' | 'top' | 'bottom' | 'center' | 'background'>('left');

  const [btnImageUrl, setBtnImageUrl] = useState('');
  const [btnImageStyle, setBtnImageStyle] = useState<'icon' | 'background'>('icon');
  const [btnImageMode, setBtnImageMode] = useState<'cover' | 'contain'>('cover');
  const [btnImagePosition, setBtnImagePosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  const [btnImageOverlay, setBtnImageOverlay] = useState<number>(0);
  const [btnImageSaturation, setBtnImageSaturation] = useState<number>(100);
  const [btnButtonImageUrl, setBtnButtonImageUrl] = useState('');
  const [btnButtonImageFit, setBtnButtonImageFit] = useState<'cover' | 'contain'>('cover');
  const [btnButtonImageOverlay, setBtnButtonImageOverlay] = useState(false);

  // Border & shape details
  const [btnBorderEnabled, setBtnBorderEnabled] = useState(false);
  const [btnBorderColor, setBtnBorderColor] = useState('#A855F7');
  const [btnBorderWidth, setBtnBorderWidth] = useState<'none' | 'thin' | 'medium' | 'thick' | number>('none');
  const [btnBorderStyle, setBtnBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [btnRadius, setBtnRadius] = useState<'square' | 'rounded' | 'pill'>('rounded');

  // Shadows, motions & glows
  const [btnShadow, setBtnShadow] = useState<'none' | 'soft' | 'medium' | 'strong'>('none');
  const [btnShadowColor, setBtnShadowColor] = useState('rgba(0,0,0,0.15)');
  const [btnGlow, setBtnGlow] = useState<'none' | 'gold' | 'light'>('none');
  const [btnAnimation, setBtnAnimation] = useState<'none' | 'scale' | 'pulse' | 'wiggle'>('none');
  const [btnButtonShape, setBtnButtonShape] = useState<string>('classic');

  // Passcodes lock states
  const [btnProtected, setBtnProtected] = useState(false);
  const [btnPassword, setBtnPassword] = useState('');
  const [btnRepeatPassword, setBtnRepeatPassword] = useState('');
  const [btnPasswordHint, setBtnPasswordHint] = useState('');

  // New Button surface & offsets
  const [btnBgMode, setBtnBgMode] = useState<'solid' | 'gradient'>('solid');
  const [btnGradientColor, setBtnGradientColor] = useState('#A855F7');
  const [btnGradientDirection, setBtnGradientDirection] = useState<'to-bottom' | 'to-right' | 'to-br' | 'to-bl'>('to-bottom');
  const [btnTextOffsetX, setBtnTextOffsetX] = useState(0);
  const [btnTextOffsetY, setBtnTextOffsetY] = useState(0);

  // Upload logs
  const [isBtnImageUploading, setIsBtnImageUploading] = useState(false);
  const [isBtnFileUploading, setIsBtnFileUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  // Custom metadata fields
  const [btnDownloadItems, setBtnDownloadItems] = useState<any[]>([]);
  const [btnUploadedFile, setBtnUploadedFile] = useState<any>(undefined);
  const [btnGalleryImages, setBtnGalleryImages] = useState<any[]>([]);
  const [btnSocialCollection, setBtnSocialCollection] = useState<any>(null);
  const [btnOpeningHours, setBtnOpeningHours] = useState<any>(null);
  const [btnAvailabilityStatus, setBtnAvailabilityStatus] = useState<string>('available');
  const [btnAvailabilityFrom, setBtnAvailabilityFrom] = useState('');
  const [btnAvailabilityTo, setBtnAvailabilityTo] = useState('');
  const [btnAvailabilityNote, setBtnAvailabilityNote] = useState('');
  const [btnAvailabilityBackupContact, setBtnAvailabilityBackupContact] = useState('');
  const [btnLocationRouteProvider, setBtnLocationRouteProvider] = useState<'google' | 'apple' | 'both'>('both');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [btnImageMeta, setBtnImageMeta] = useState<any>(null);
  const [designerToast, setDesignerToast] = useState<string | null>(null);
  
  const [selectedBtnIds, setSelectedBtnIds] = useState<string[]>([]);
  const [designSuccessBanner, setDesignSuccessBanner] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (designerToast) {
      const t = setTimeout(() => setDesignerToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [designerToast]);

  // Populate data on load
  useEffect(() => {
    if (isOpen) {
      const b = normalizeButton(editingButton || null);
      setBtnId(b.id);
      setBtnTitle(b.title || '');
      setBtnActionType(b.actionType || 'website');
      setBtnActionValue(b.actionType === 'vcard' ? '[CONTACT_CARD]' : (b.actionValue || ''));

      setBtnTextColor(b.textColor || '#1E1E1E');
      setBtnFontFamily(b.fontFamily || 'Inter');
      setBtnFontSize(b.fontSize ?? 13);
      setBtnFontWeight(b.fontWeight || 'medium');
      setBtnLetterSpacing(b.letterSpacing ?? 0);
      setBtnTextAlign(b.textAlign || 'center');
      setBtnTextPosition(b.textPosition || 'center');
      setBtnTextPadding(b.textPadding ?? 8);
      setBtnTextShadow(b.textShadow || 'none');
      setBtnTextWrap(b.textWrap || 'single');

      setBtnBgColor(b.bgColor || b.backgroundColor || '#A855F7');
      setBtnGradient(b.gradient || '');
      setBtnOpacity(b.opacity ?? 100);
      setBtnStyleVariant(b.styleVariant || 'filled');

      setBtnIcon(b.icon || b.iconId || 'Link');
      setBtnIconColor(b.iconColor || '#1E1E1E');
      setBtnIconSize(b.iconSize ?? 18);
      setBtnIconPosition(b.iconPosition || 'left');

      setBtnImageUrl(b.imageUrl || '');
      setBtnImageStyle(b.imageStyle || 'icon');
      setBtnImageMode(b.imageMode || 'cover');
      setBtnImagePosition(b.imagePosition || 'center');
      setBtnImageOverlay(typeof b.imageOverlay === 'number' ? b.imageOverlay : b.imageOverlay === 'dark' ? 50 : b.imageOverlay === 'light' ? 20 : 0);
      setBtnImageSaturation(b.imageSaturation ?? 100);
      setBtnButtonImageUrl(b.buttonImageUrl || '');
      setBtnButtonImageFit(b.buttonImageFit || 'cover');
      setBtnButtonImageOverlay(!!b.buttonImageOverlay);

      setBtnBorderEnabled(b.borderEnabled ?? (b.borderWidth !== 'none' && !!b.borderWidth));
      setBtnBorderColor(b.borderColor || '#A855F7');
      setBtnBorderWidth(b.borderWidth || 'none');
      setBtnBorderStyle(b.borderStyle || 'solid');
      setBtnRadius(b.radius || 'rounded');
      setBtnButtonShape(b.buttonShape || (b.radius === 'pill' ? 'round' : b.radius === 'square' ? 'square' : 'classic'));

      setBtnShadow(b.shadow || 'none');
      setBtnShadowColor(b.shadowColor || 'rgba(0,0,0,0.15)');
      setBtnGlow(b.glow || 'none');
      setBtnAnimation(b.animation || 'none');

      setBtnProtected(!!b.passwordProtected || !!b.isProtected);
      setBtnPassword(b.buttonPassword || (b.isProtected || b.passwordProtected ? '••••••••' : ''));
      setBtnRepeatPassword(b.buttonPassword || (b.isProtected || b.passwordProtected ? '••••••••' : ''));
      setBtnPasswordHint(b.passwordHint || '');

      setBtnBgMode(b.bgMode || 'solid');
      setBtnGradientColor(b.gradientColor || '#A855F7');
      setBtnGradientDirection(b.gradientDirection || 'to-bottom');
      setBtnTextOffsetX(b.textOffsetX ?? 0);
      setBtnTextOffsetY(b.textOffsetY ?? 0);

      // Custom metadata initializers
      setBtnDownloadItems(b.downloadItems || []);
      setBtnUploadedFile(b.uploadedFile || undefined);
      setBtnGalleryImages(b.galleryImages || []);
      setBtnSocialCollection(b.socialCollection || null);
      setBtnOpeningHours(b.openingHours || null);
      setBtnAvailabilityStatus(b.availabilityStatus || 'available');
      setBtnAvailabilityFrom(b.availabilityFrom || '');
      setBtnAvailabilityTo(b.availabilityTo || '');
      setBtnAvailabilityNote(b.availabilityNote || '');
      setBtnAvailabilityBackupContact(b.availabilityBackupContact || '');
      setBtnLocationRouteProvider(b.locationRouteProvider || 'both');

      setBtnSize(b.buttonSize || { preset: 'standard' });

      setIsDraftDirty(false);
    }
  }, [isOpen, editingButton]);

  if (!isOpen) return null;

  // Local object mapping live visual rendering state
  const localButton: CardButton = {
    id: btnId || 'temp_btn',
    title: btnTitle,
    actionType: btnActionType,
    actionValue: btnActionValue,

    textColor: btnTextColor,
    fontFamily: btnFontFamily,
    fontSize: btnFontSize,
    fontWeight: btnFontWeight,
    letterSpacing: btnLetterSpacing,
    textAlign: btnTextAlign,
    textPosition: btnTextPosition,
    textPadding: btnTextPadding,
    textShadow: btnTextShadow,
    textWrap: btnTextWrap,

    bgColor: btnBgColor,
    gradient: btnGradient,
    opacity: btnOpacity,
    styleVariant: btnStyleVariant,

    bgMode: btnBgMode,
    gradientColor: btnGradientColor,
    gradientDirection: btnGradientDirection,
    textOffsetX: btnTextOffsetX,
    textOffsetY: btnTextOffsetY,

    icon: btnIcon,
    iconColor: btnIconColor,
    iconSize: btnIconSize,
    iconPosition: btnIconPosition,

    imageUrl: btnImageUrl,
    imageStyle: btnImageStyle,
    imageMode: btnImageMode,
    imagePosition: btnImagePosition,
    imageOverlay: btnImageOverlay,
    imageDarken: btnImageOverlay,
    imageSaturation: btnImageSaturation,
    buttonImageUrl: btnButtonImageUrl,
    buttonImageFit: btnButtonImageFit,
    buttonImageOverlay: btnButtonImageOverlay,

    borderEnabled: btnBorderEnabled,
    borderColor: btnBorderColor,
    borderWidth: btnBorderWidth,
    borderStyle: btnBorderStyle,
    radius: btnRadius,

    shadow: btnShadow,
    shadowColor: btnShadowColor,
    glow: btnGlow,
    animation: btnAnimation,

    isProtected: btnProtected,
    passwordProtected: btnProtected,
    buttonPassword: btnPassword,
    passwordHint: btnPasswordHint,
    position: editingButton ? editingButton.position : 99,
    isActive: true,

    downloadItems: btnDownloadItems,
    uploadedFile: btnUploadedFile,
    galleryImages: btnGalleryImages,
    socialCollection: btnSocialCollection,
    openingHours: btnOpeningHours,
    availabilityStatus: btnAvailabilityStatus as any,
    availabilityFrom: btnAvailabilityFrom,
    availabilityTo: btnAvailabilityTo,
    availabilityNote: btnAvailabilityNote,
    availabilityBackupContact: btnAvailabilityBackupContact,
    locationRouteProvider: btnLocationRouteProvider as any,
    buttonSize: btnSize,
    buttonShape: btnButtonShape,
  };

  const getGridSizeFromButtonSize = (size: any): number => {
    if (!size) return 90;
    if (size.preset === 'compact') return 60;
    if (size.preset === 'large') return 110;
    if (size.preset === 'standard') return 90;
    const scale = Number(size.scale || 100);
    if (scale <= 90) return 60;
    if (scale >= 115) return 110;
    return 90;
  };

  const previewRadiusClass = localButton.radius === 'square' ? 'rounded-none' : localButton.radius === 'pill' ? 'rounded-full' : 'rounded-[22px]';
  const previewDesktopRadiusClass = localButton.radius === 'square' ? 'rounded-none' : localButton.radius === 'pill' ? 'rounded-full' : 'rounded-[26px]';

  const updateButtonState = (updates: Partial<CardButton>) => {
    setIsDraftDirty(true);
    setErrorMessage(null);
    if (updates.id !== undefined) setBtnId(updates.id);
    if (updates.title !== undefined) setBtnTitle(updates.title);
    if (updates.actionType !== undefined) {
      setBtnActionType(updates.actionType);
      if (updates.actionType === 'vcard' && !updates.actionValue) {
        setBtnActionValue('[CONTACT_CARD]');
      } else if (updates.actionType === 'gallery' && !updates.actionValue) {
        setBtnActionValue('[GALLERY_COLLECTION]');
      }
    }
    if (updates.actionValue !== undefined) setBtnActionValue(updates.actionValue);

    if (updates.textColor !== undefined) setBtnTextColor(updates.textColor);
    if (updates.fontFamily !== undefined) setBtnFontFamily(updates.fontFamily);
    if (updates.fontSize !== undefined) setBtnFontSize(updates.fontSize);
    if (updates.fontWeight !== undefined) setBtnFontWeight(updates.fontWeight);
    if (updates.letterSpacing !== undefined) setBtnLetterSpacing(updates.letterSpacing);
    if (updates.textAlign !== undefined) setBtnTextAlign(updates.textAlign);
    if (updates.textPosition !== undefined) setBtnTextPosition(updates.textPosition);
    if (updates.textPadding !== undefined) setBtnTextPadding(updates.textPadding);
    if (updates.textShadow !== undefined) setBtnTextShadow(updates.textShadow);
    if (updates.textWrap !== undefined) setBtnTextWrap(updates.textWrap);

    if (updates.bgColor !== undefined) setBtnBgColor(updates.bgColor);
    if (updates.gradient !== undefined) setBtnGradient(updates.gradient);
    if (updates.opacity !== undefined) setBtnOpacity(updates.opacity);
    if (updates.styleVariant !== undefined) setBtnStyleVariant(updates.styleVariant);

    if (updates.bgMode !== undefined) setBtnBgMode(updates.bgMode);
    if (updates.gradientColor !== undefined) setBtnGradientColor(updates.gradientColor);
    if (updates.gradientDirection !== undefined) setBtnGradientDirection(updates.gradientDirection as any);
    if (updates.textOffsetX !== undefined) setBtnTextOffsetX(updates.textOffsetX);
    if (updates.textOffsetY !== undefined) setBtnTextOffsetY(updates.textOffsetY);

    if (updates.icon !== undefined) setBtnIcon(updates.icon);
    if (updates.iconColor !== undefined) setBtnIconColor(updates.iconColor);
    if (updates.iconSize !== undefined) setBtnIconSize(updates.iconSize);
    if (updates.iconPosition !== undefined) setBtnIconPosition(updates.iconPosition);

    if (updates.imageUrl !== undefined) {
      setBtnImageUrl(updates.imageUrl);
      if (updates.imageUrl) {
        setBtnImageStyle('background');
      } else {
        setBtnImageStyle('icon');
      }
    }
    if (updates.imageMode !== undefined) setBtnImageMode(updates.imageMode);
    if (updates.imagePosition !== undefined) setBtnImagePosition(updates.imagePosition);
    if (updates.imageOverlay !== undefined) {
      setBtnImageOverlay(typeof updates.imageOverlay === 'number' ? updates.imageOverlay : (Number(updates.imageOverlay) || 0));
    }
    if (updates.buttonImageUrl !== undefined) setBtnButtonImageUrl(updates.buttonImageUrl);
    if (updates.buttonImageFit !== undefined) setBtnButtonImageFit(updates.buttonImageFit);
    if (updates.buttonImageOverlay !== undefined) setBtnButtonImageOverlay(updates.buttonImageOverlay);
    if (updates.imageDarken !== undefined) {
      setBtnImageOverlay(typeof updates.imageDarken === 'number' ? updates.imageDarken : (Number(updates.imageDarken) || 0));
    }
    if (updates.imageSaturation !== undefined) {
      setBtnImageSaturation(updates.imageSaturation);
    }
    if (updates.borderEnabled !== undefined) setBtnBorderEnabled(updates.borderEnabled);
    if (updates.borderColor !== undefined) setBtnBorderColor(updates.borderColor);
    if (updates.borderWidth !== undefined) setBtnBorderWidth(updates.borderWidth);
    if (updates.borderStyle !== undefined) setBtnBorderStyle(updates.borderStyle);
    if (updates.radius !== undefined) setBtnRadius(updates.radius);
    if (updates.buttonShape !== undefined) setBtnButtonShape(updates.buttonShape);

    if (updates.shadow !== undefined) setBtnShadow(updates.shadow);
    if (updates.shadowColor !== undefined) setBtnShadowColor(updates.shadowColor);
    if (updates.glow !== undefined) setBtnGlow(updates.glow);
    if (updates.animation !== undefined) setBtnAnimation(updates.animation);

    if (updates.downloadItems !== undefined) setBtnDownloadItems(updates.downloadItems);
    if (updates.uploadedFile !== undefined) setBtnUploadedFile(updates.uploadedFile);
    if (updates.galleryImages !== undefined) setBtnGalleryImages(updates.galleryImages);
    if (updates.socialCollection !== undefined) setBtnSocialCollection(updates.socialCollection);
    if (updates.openingHours !== undefined) setBtnOpeningHours(updates.openingHours);
    if (updates.availabilityStatus !== undefined) setBtnAvailabilityStatus(updates.availabilityStatus);
    if (updates.availabilityFrom !== undefined) setBtnAvailabilityFrom(updates.availabilityFrom);
    if (updates.availabilityTo !== undefined) setBtnAvailabilityTo(updates.availabilityTo);
    if (updates.availabilityNote !== undefined) setBtnAvailabilityNote(updates.availabilityNote);
    if (updates.availabilityBackupContact !== undefined) setBtnAvailabilityBackupContact(updates.availabilityBackupContact);
    if (updates.locationRouteProvider !== undefined) setBtnLocationRouteProvider(updates.locationRouteProvider as any);
    if (updates.buttonSize !== undefined) setBtnSize(updates.buttonSize);
  };

  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Live graphic custom compress & upload
  const handleButtonImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsBtnImageUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const file = e.target.files[0];

      if (file.size > 1.5 * 1024 * 1024) {
        setErrorMessage(lang === 'de' 
          ? 'Das Bild ist sehr groß. Wir optimieren es automatisch für deine ureel-Seite.' 
          : 'The image is very large. We will automatically optimize it for your ureel page.'
        );
        await new Promise((r) => setTimeout(r, 1200));
        setErrorMessage(null);
      }

      const optimizedBlob = await compressImageBeforeUpload(file, 'gallery');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'button-images');
      setBtnImageUrl(url);
      setIsDraftDirty(true);

      const meta = (optimizedBlob as any).imageMeta;
      if (meta) {
        setBtnImageMeta(meta);
        setSuccessMessage(formatImageOptimizationToast(meta, lang));
      } else {
        setSuccessMessage(lang === 'de' ? 'Bild hochgeladen' : 'Image uploaded');
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
    } finally {
      setIsBtnImageUploading(false);
    }
  };

  // Upload attachment file (Brochures / Documents / PDFs)
  const handleFileActionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsBtnFileUploading(true);
    setErrorMessage(null);
    try {
      const file = e.target.files[0];
      const url = await uploadFile(activeCard.cardId, file, 'documents');
      
      const fileMetadata = {
        name: file.name,
        url: url,
        storagePath: `users/${user?.uid || 'unknown'}/documents/${file.name}`,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      setBtnActionValue(url);
      setBtnUploadedFile(fileMetadata);
      setIsDraftDirty(true);
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
    } finally {
      setIsBtnFileUploading(false);
    }
  };

  const handleTestLink = () => {
    if (localButton.actionType === 'none') {
      setErrorMessage(lang === 'de' ? 'Für diesen Button wurde noch keine Funktion hinterlegt.' : 'No action has been set for this button yet.');
      return;
    }
    const url = buildButtonActionUrl(localButton, activeCard);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setErrorMessage(lang === 'de' ? 'Bitte gib zuerst eine gültige Ziel-Adresse ein.' : 'Please enter a valid target URL first.');
    }
  };

  const handleSaveChangesBlock = async () => {
    console.log("ButtonDesigner save clicked", localButton);
    setErrorMessage(null);

    const validation = validateButton(localButton, lang === 'de' ? 'de' : 'en');
    if (!validation.valid) {
      setErrorMessage(validation.errors.join('\n'));
      return;
    }

    if (btnProtected) {
      const hasExistingHash = !!((editingButton?.isProtected || editingButton?.passwordProtected) && (editingButton?.passwordHash || editingButton?.buttonPassword));
      const isNewPasswordEntered = btnPassword !== '' && btnPassword !== '••••••••';

      if (!hasExistingHash && !isNewPasswordEntered) {
        setErrorMessage(lang === 'de' ? 'Bitte gib ein Passwort ein.' : 'Please enter a password.');
        return;
      }

      if (isNewPasswordEntered) {
        if (btnPassword.length < 4) {
          setErrorMessage(lang === 'de' ? 'Das Passwort muss mindestens 4 Zeichen lang sein.' : 'The password must be at least 4 characters long.');
          return;
        }
        if (btnPassword.length > 64) {
          setErrorMessage(lang === 'de' ? 'Das Passwort darf maximal 64 Zeichen lang sein.' : 'The password must be at most 64 characters long.');
          return;
        }
        if (btnPassword !== btnRepeatPassword) {
          setErrorMessage(lang === 'de' ? 'Die Passwörter stimmen nicht überein.' : 'The passwords do not match.');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      let pwdHash = editingButton?.passwordHash || '';
      let rawPwd = editingButton?.buttonPassword || '';

      if (btnProtected) {
        if (btnPassword !== '••••••••' && btnPassword !== '') {
          pwdHash = await sha256(btnPassword);
          rawPwd = btnPassword;
        }
      } else {
        pwdHash = '';
        rawPwd = '';
      }

      const enrichedButtonObj = {
        ...localButton,
        passwordHash: pwdHash,
        passwordProtected: btnProtected,
        isProtected: btnProtected,
        buttonPassword: rawPwd || undefined,
      };

      await onSave(enrichedButtonObj, {
        passwordHash: pwdHash || undefined,
        rawPassword: rawPwd || undefined,
        imageMeta: btnImageMeta || undefined,
      });

      // Keep the public/preview 9:16 grid in sync with the visible button-size control.
      // The public renderer reads card-level grid fields, not only the single-button draft.
      if (onSaveAllButtons) {
        const nextPx = getGridSizeFromButtonSize(enrichedButtonObj.buttonSize);
        const nextGap = nextPx >= 108 ? 6 : 9;
        const updatedButtons = (activeCard.buttons || []).map((b) => b.id === enrichedButtonObj.id ? enrichedButtonObj : b);
        await onSaveAllButtons(updatedButtons, {
          buttonGridCols: 3 as any,
          buttonSizePx: nextPx as any,
          buttonGapPx: nextGap as any,
          buttonGridLayout: {
            ...(activeCard.buttonGridLayout || {}),
            mode: 'grid',
            cols: 3,
            square: true,
            buttonSizePx: nextPx,
            tileSizePx: nextPx,
            gapPx: nextGap,
            gap: nextGap,
            align: 'center',
          } as any,
        });
      }

      setIsDraftDirty(false);
      onClose();
    } catch (err: any) {
      console.error("ButtonDesigner protected save failed", err);
      setErrorMessage((lang === 'de' ? 'Button konnte nicht gespeichert werden: ' : 'Button could not be saved: ') + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrigger = () => {
    console.log("ButtonDesigner delete clicked", localButton.id);
    if (!editingButton) {
      // If it is a brand new button, we just close the designer immediately
      onClose();
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleCancelTrigger = () => {
    console.log("ButtonDesigner cancel clicked", { dirty: isDraftDirty });
    if (isDraftDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    console.log("ButtonDesigner close clicked", { dirty: isDraftDirty });
    if (isDraftDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSectionTabChange = (section: 'face' | 'styling' | 'text' | 'function') => {
    console.log("ButtonDesigner section changed", section);
    setErrorMessage(null); // Clear errors dynamically on view transitions
    setActiveTab(section);
    setActiveSubSection(null);
  };

  const renderRealisticMockupPreview = (isMobileView = false) => {
    // If no text is set, show placeholder as requested in Bugfix 1
    const displayTitle = btnTitle.trim() || (lang === 'de' ? 'Beispiel Button' : 'Example Button');
    const displayIcon = btnIcon;
    
    const previewBtn = {
      ...localButton,
      title: displayTitle,
      icon: displayIcon,
    };

    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-stone-800/80 bg-[#0B0B0F] shadow-2xl relative min-h-[180px] overflow-hidden ${isMobileView ? 'w-full mb-4' : 'w-full mb-1 h-full'}`}>
        <div className="absolute top-2 right-3 font-mono text-[8.5px] font-black uppercase text-[#A855F7] tracking-widest bg-[#A855F7]/10 px-2.5 py-0.5 rounded-md border border-[#A855F7]/20 select-none z-10">
          {lang === 'de' ? 'Button Vorschau' : 'Button Preview'}
        </div>

        {/* Exakt horizontal und vertikal zentrierte Vorschau des einzelnen echten Buttons */}
        <div className="w-full flex items-center justify-center py-4 px-2 select-none">
          <div className="w-full max-w-[280px]">
            <ButtonRenderer
              button={previewBtn}
              mode="designer"
              previewScale={1}
              lang={lang}
            />
          </div>
        </div>
      </div>
    );
  };
  const renderDesignTransferSection = () => {
    const otherButtons = (activeCard?.buttons || []).filter(b => b.id !== btnId);

    if (otherButtons.length === 0) {
      return (
        <div className="border-t border-stone-800/60 pt-5 mt-4 space-y-3">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Copy className="text-[#A855F7]" size={14} />
            {lang === 'de' ? 'Design übertragen' : 'Apply design'}
          </h4>
          <div className="bg-stone-950/40 border border-[#A855F7]/25 p-3.5 rounded-xl text-center">
            <p className="text-[10px] text-stone-500 font-medium font-sans">
              {lang === 'de' 
                ? 'Es gibt momentan keine anderen Buttons auf dieser Karte, auf die das Design übertragen werden könnte.' 
                : 'There are currently no other buttons on this card to transfer the design to.'}
            </p>
          </div>
        </div>
      );
    }

    const confirmApplyDesign = async () => {
      if (!activeCard || !onSaveAllButtons) return;

      const targetIds = transferTargetMode === 'all' ? otherButtons.map(b => b.id) : selectedBtnIds;

      if (transferTargetMode === 'custom' && targetIds.length === 0) {
        setErrorMessage(lang === 'de' ? 'Bitte wähle mindestens einen Ziel-Button aus.' : 'Please select at least one target button.');
        return;
      }

      // Build target fields dynamically based on selected checkboxes
      const visualFields: Array<keyof CardButton> = [];
      if (transferShape) {
        visualFields.push('buttonShape', 'radius', 'styleVariant', 'shadow', 'shadowColor', 'glow', 'animation');
      }
      if (transferSize) {
        visualFields.push('buttonSize');
      }
      if (transferFaceColor) {
        visualFields.push('bgColor', 'backgroundColor', 'gradient', 'opacity', 'bgMode', 'gradientColor', 'gradientDirection');
      }
      if (transferBorder) {
        visualFields.push('borderEnabled', 'borderColor', 'borderWidth', 'borderStyle');
      }
      if (transferIconStyle) {
        visualFields.push('iconColor', 'iconSize', 'iconPosition');
      }
      if (transferTextStyle) {
        visualFields.push('textColor', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'textAlign', 'textPosition', 'textPadding', 'textShadow', 'textWrap', 'textOffsetX', 'textOffsetY');
      }
      if (transferButtonImage) {
        visualFields.push('imageUrl', 'imageStyle', 'imageMode', 'imagePosition', 'imageOverlay', 'imageDarken', 'imageSaturation', 'buttonImageUrl', 'buttonImageFit', 'buttonImageOverlay');
      }

      // Merge current draft button (localButton) and updated targets
      const updatedButtons = (activeCard.buttons || []).map((b) => {
        // Save currently edited button's draft settings
        if (b.id === btnId) {
          return { ...localButton };
        }
        // Save visual settings onto targets
        if (targetIds.includes(b.id)) {
          const newBtn = { ...b };
          visualFields.forEach((field) => {
            if (localButton[field] !== undefined) {
              (newBtn as any)[field] = localButton[field];
            }
          });
          return newBtn;
        }
        return b;
      });

      const extraCardFields: Partial<Card> = {};
      if (transferRaster) {
        extraCardFields.buttonGridCols = activeCard.buttonGridCols;
        extraCardFields.buttonGridLayout = activeCard.buttonGridLayout;
      }

      try {
        await onSaveAllButtons(updatedButtons, extraCardFields);
        setDesignSuccessBanner(lang === 'de' ? 'Design wurde übertragen.' : 'Design has been transferred.');
        setErrorMessage(null);
        setTimeout(() => setDesignSuccessBanner(null), 3500);
      } catch (err) {
        console.error("Apply design failed", err);
      }
    };

    return (
      <div className="border-t border-stone-800/60 pt-5 mt-4 space-y-4">
        <div className="space-y-1">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Copy className="text-[#A855F7]" size={14} />
            {lang === 'de' ? 'Design übertragen' : 'Apply design'}
          </h4>
          <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
            {lang === 'de' 
              ? 'Übertrage das visuelle Design dieses Buttons auf andere Buttons. Funktionen, Links und Passwortschutz bleiben unverändert.' 
              : 'Transfer the visual design of this button to other buttons. Functions, links, and password-protection remain unchanged.'}
          </p>
        </div>

        <div className="space-y-4 bg-stone-950/60 p-4 rounded-xl border border-stone-850 text-left">
          {designSuccessBanner && (
            <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-[10px] font-bold flex items-center gap-2 mb-2 animate-fadeIn">
              <LucideIcons.CheckCircle size={13} className="text-emerald-400 shrink-0" />
              <span>{designSuccessBanner}</span>
            </div>
          )}

          {/* Target Selection Mode Toggle */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-stone-450 font-black uppercase tracking-wider block">
              {lang === 'de' ? 'Empfänger-Buttons:' : 'Target Buttons:'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-stone-900/50 p-1 rounded-xl border border-stone-850">
              <button
                type="button"
                onClick={() => setTransferTargetMode('all')}
                className={`py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition ${
                  transferTargetMode === 'all'
                    ? 'bg-[#A855F7] text-stone-950'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                {lang === 'de' ? 'Auf alle anderen Buttons' : 'Apply to all other'}
              </button>
              <button
                type="button"
                onClick={() => setTransferTargetMode('custom')}
                className={`py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition ${
                  transferTargetMode === 'custom'
                    ? 'bg-[#A855F7] text-stone-950'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                {lang === 'de' ? 'Einzelne auswählen' : 'Pick individual'}
              </button>
            </div>
          </div>

          {/* Checkboxes List */}
          <div className="space-y-2 p-3 bg-stone-900/30 rounded-xl border border-stone-850 text-xs">
            <span className="text-[9px] text-stone-450 font-black uppercase tracking-wider block mb-1.5 border-b border-stone-800/65 pb-1">
              {lang === 'de' ? 'Folgende Styles übertragen:' : 'Select styles to copy:'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-stone-300">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferShape}
                  onChange={(e) => setTransferShape(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Form übertragen' : 'Form'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferSize}
                  onChange={(e) => setTransferSize(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Größe übertragen' : 'Größe'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferFaceColor}
                  onChange={(e) => setTransferFaceColor(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Fläche/Farbe übertragen' : 'Fläche/Farbe'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferBorder}
                  onChange={(e) => setTransferBorder(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Rahmen übertragen' : 'Rahmen'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferIconStyle}
                  onChange={(e) => setTransferIconStyle(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Iconstil übertragen' : 'Iconstil'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferTextStyle}
                  onChange={(e) => setTransferTextStyle(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Textstil übertragen' : 'Textstil'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-300 hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferButtonImage}
                  onChange={(e) => setTransferButtonImage(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Buttonbild übertragen' : 'Buttonbild'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-300 hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={transferRaster}
                  onChange={(e) => setTransferRaster(e.target.checked)}
                  className="accent-[#A855F7] cursor-pointer"
                />
                <span className="text-[11px] font-medium">{lang === 'de' ? 'Raster übertragen' : 'Raster'}</span>
              </label>
            </div>
          </div>

          {/* Individual Target List - shown only if transferTargetMode === 'custom' */}
          {transferTargetMode === 'custom' && (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1 mt-2 animate-fadeIn">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                  {lang === 'de' ? 'Ziel-Buttons wählen:' : 'Select Target Buttons:'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBtnIds(otherButtons.map(b => b.id))}
                    className="text-[9px] text-[#A855F7] hover:underline uppercase font-bold text-left cursor-pointer"
                  >
                    {lang === 'de' ? 'Alle' : 'All'}
                  </button>
                  <span className="text-stone-700 text-[9px] font-bold">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBtnIds([])}
                    className="text-[9px] text-stone-400 hover:underline uppercase font-bold text-left cursor-pointer"
                  >
                    {lang === 'de' ? 'Keine' : 'None'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {otherButtons.map((btn) => {
                  const isSelected = selectedBtnIds.includes(btn.id);
                  return (
                    <label
                      key={btn.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                        isSelected 
                          ? 'bg-[#A855F7]/10 border-[#A855F7]/40 text-stone-200' 
                          : 'bg-stone-900/40 border-stone-850 text-stone-400 hover:text-stone-300 shadow-sm'
                      }`}
                    >
                      <span className="font-semibold truncate max-w-[180px]">
                        {btn.title || btn.id}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedBtnIds(selectedBtnIds.filter(id => id !== btn.id));
                          } else {
                            setSelectedBtnIds([...selectedBtnIds, btn.id]);
                          }
                        }}
                        className="accent-[#A855F7] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={confirmApplyDesign}
            className="w-full bg-[#A855F7] hover:bg-[#A855F7]/90 text-stone-950 font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow"
          >
            <LucideIcons.Copy size={13} />
            {lang === 'de' ? 'Design übertragen' : 'Apply design'}
          </button>
        </div>
      </div>
    );
  };

  const renderButtonSizeMenu = () => {
    const size = btnSize || { preset: 'standard' };

    // Map current preset or scale to slider value
    let sliderValue = 100;
    if (size.scale !== undefined) {
      sliderValue = size.scale;
    } else if (size.preset === 'compact') {
      sliderValue = 85;
    } else if (size.preset === 'large') {
      sliderValue = 125;
    } else {
      sliderValue = 100;
    }

    const handleSliderChange = (val: number) => {
      let preset: 'compact' | 'standard' | 'large' | 'custom' = 'custom';
      if (val === 85) preset = 'compact';
      else if (val === 100) preset = 'standard';
      else if (val === 125) preset = 'large';
      setBtnSize({ preset, scale: val });
      setIsDraftDirty(true);
    };

    const isSmall = sliderValue <= 90;
    const isStandard = sliderValue > 90 && sliderValue < 115;
    const isLarge = sliderValue >= 115;

    return (
      <div className="border-t border-stone-800/60 pt-4 mt-4 space-y-4 text-left">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.Maximize2 size={14} className="text-[#A855F7]" />
          {lang === 'de' ? 'Buttongröße' : 'Button Size'}
        </h4>

        <div className="space-y-4 bg-stone-950/60 p-4 rounded-xl border border-stone-850">
          <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
            {lang === 'de'
              ? 'Wähle die passende Buttongröße mit dem einfachen Schieberegler.'
              : 'Choose the matching button size using the simple slider.'}
          </p>

          <div className="space-y-4 px-3 py-4 bg-stone-950 rounded-xl border border-stone-900">
            <div className="flex justify-between items-center text-xs font-bold text-stone-400 select-none pb-1">
              <span className={isSmall ? 'text-[#A855F7]' : 'text-stone-600'}>
                {lang === 'de' ? 'Klein' : 'Small'} (85%)
              </span>
              <span className={isStandard ? 'text-[#A855F7]' : 'text-stone-600'}>
                {lang === 'de' ? 'Standard' : 'Standard'} (100%)
              </span>
              <span className={isLarge ? 'text-[#A855F7]' : 'text-stone-600'}>
                {lang === 'de' ? 'Groß' : 'Large'} (125%)
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="85"
                max="125"
                step="1"
                value={sliderValue}
                onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-stone-850 rounded-xl appearance-none cursor-pointer accent-[#A855F7]"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-stone-400 font-medium font-mono pt-1">
              <span>{lang === 'de' ? 'Echte Skalierung:' : 'Scale:'} <strong className="text-[#A855F7]">{sliderValue}%</strong></span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-stone-900 border border-[#A855F7]/20 bg-[#A855F7]/5 font-bold uppercase text-stone-350">
                {isSmall ? (lang === 'de' ? 'Kompakt' : 'Compact') : isLarge ? (lang === 'de' ? 'Hervorgehoben' : 'Enhanced') : (lang === 'de' ? 'Standard' : 'Standard')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderButtonRasterMenu = () => {
    const defaultIsUreel = !!(activeCard.ureelTimeline || activeCard.ureelEndCard || activeCard.ureelScene);
    const gl = localGridLayout || deriveCanonicalButtonGridLayout(activeCard, { preferLiveFields: true });
    const currentMode = gl.mode || (defaultIsUreel ? 'grid' : 'list');
    const isSquare = gl.square !== undefined ? !!gl.square : defaultIsUreel;
    const currentCols = gl.cols !== undefined ? gl.cols : (activeCard.buttonGridCols || 3);
    const currentGapVal = gl.gapPx !== undefined ? gl.gapPx : (activeCard.buttonGapPx || 18);
    const currentSizeVal = gl.buttonSizePx !== undefined ? gl.buttonSizePx : (activeCard.buttonSizePx || 80);

    const saveGridLayout = async (updates: Partial<ButtonGridLayout>) => {
      if (!onSaveAllButtons) return;
      const newGridLayout = deriveCanonicalButtonGridLayout({
        ...activeCard,
        buttonGridLayout: {
          ...gl,
          ...updates,
        },
        buttonGridCols: (updates.cols ?? gl.cols) as any,
        buttonGapPx: updates.gapPx ?? updates.gap ?? gl.gapPx,
        buttonSizePx: updates.buttonSizePx ?? (updates as any).tileSizePx ?? gl.buttonSizePx,
      }, { preferLiveFields: true });
      setLocalGridLayout(newGridLayout);
      
      try {
        await onSaveAllButtons(activeCard.buttons || [], {
          buttonGridLayout: newGridLayout,
          buttonGridCols: newGridLayout.cols as any,
          buttonGapPx: newGridLayout.gapPx,
          buttonSizePx: newGridLayout.buttonSizePx,
        });
        setDesignSuccessBanner(lang === 'de' ? 'Layout erfolgreich aktualisiert!' : 'Layout updated successfully!');
        setTimeout(() => setDesignSuccessBanner(null), 3000);
      } catch (err) {
        console.error("Layout grid update failed", err);
      }
    };

    return (
      <div className="border-t border-stone-800/60 pt-4 mt-4 space-y-4 text-left">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.LayoutGrid size={14} className="text-[#A855F7]" />
          {lang === 'de' ? 'Button-Raster & Layout' : 'Button Grid & Layout'}
        </h4>

        <div className="space-y-4 bg-stone-950/60 p-4 rounded-xl border border-stone-850">
          <p className="text-[10px] text-stone-400 font-medium leading-relaxed">
            {lang === 'de'
              ? 'Passe das Layout, die Spaltenanzahl und Proportionen deiner Kacheln flexibel an.'
              : 'Customize the overall layout structure, columns, and tile size smoothly.'}
          </p>

          {/* Mode Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-450 tracking-wider">
              {lang === 'de' ? 'Layout-Modus' : 'Layout Mode'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => saveGridLayout({ mode: 'list' })}
                className={`p-2 rounded-xl border text-center text-xs transition cursor-pointer font-bold ${
                  currentMode === 'list'
                    ? 'border-[#A855F7] bg-[#A855F7]/10 text-white'
                    : 'border-stone-800 bg-stone-900/20 text-stone-400 hover:text-stone-200'
                }`}
              >
                {lang === 'de' ? 'Klassische Liste' : 'Classic List'}
              </button>
              <button
                type="button"
                onClick={() => saveGridLayout({ mode: 'grid' })}
                className={`p-2 rounded-xl border text-center text-xs transition cursor-pointer font-bold ${
                  currentMode === 'grid'
                    ? 'border-[#A855F7] bg-[#A855F7]/10 text-white'
                    : 'border-stone-800 bg-stone-900/20 text-stone-400 hover:text-stone-200'
                }`}
              >
                {lang === 'de' ? 'Aktionsraster (Grid)' : 'Action Grid'}
              </button>
            </div>
          </div>

          {/* Columns Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-450 tracking-wider">
              {lang === 'de' ? 'Spaltenanzahl' : 'Columns'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => saveGridLayout({ cols: cols as any })}
                  className={`p-1.5 rounded-xl border text-center text-xs transition cursor-pointer font-bold ${
                    currentCols === cols
                      ? 'border-[#A855F7] bg-[#A855F7]/10 text-white'
                      : 'border-stone-800 bg-stone-900/20 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cols} {cols === 1 ? (lang === 'de' ? 'Spalte' : 'Col') : (lang === 'de' ? 'Spalten' : 'Cols')}
                </button>
              ))}
            </div>
          </div>

          {/* Face shape option toggle */}
          <div className="flex items-center justify-between py-1 bg-stone-950/45 p-2.5 rounded-lg border border-stone-900/40">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-stone-300">{lang === 'de' ? 'Quadratische Form erzwingen' : 'Force Square Shapes'}</span>
              <span className="text-[9px] text-stone-500">{lang === 'de' ? 'Übersteuert individuelle Höhen des Buttons im Raster' : 'Overrides individual height presets in grid'}</span>
            </div>
            <input
              type="checkbox"
              checked={isSquare}
              onChange={(e) => saveGridLayout({ square: e.target.checked })}
              className="accent-[#A855F7] h-4 w-4 rounded-lg cursor-pointer animate-none"
            />
          </div>

          {/* Size Slider (60px - 110px, max 110px = Groß) */}
          <div className="space-y-1 bg-stone-950 p-3 rounded-xl border border-stone-900/50">
            <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 select-none">
              <span>{lang === 'de' ? 'Button-Größe' : 'Button Size'}</span>
              <span className="text-[#A855F7] font-mono">{currentSizeVal}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="110"
              step="2"
              value={currentSizeVal}
              onChange={(e) => saveGridLayout({ buttonSizePx: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-stone-850 rounded-xl appearance-none cursor-pointer accent-[#A855F7]"
            />
            <div className="flex justify-between text-[8px] text-stone-500 font-medium">
              <span>60px ({lang === 'de' ? 'Klein' : 'Small'})</span>
              <span>90px ({lang === 'de' ? 'Normal' : 'Default'})</span>
              <span>110px ({lang === 'de' ? 'Groß' : 'Large'})</span>
            </div>
          </div>

          {/* Spacing / Gap Slider (8px - 36px, default 18px) */}
          <div className="space-y-1 bg-stone-950 p-3 rounded-xl border border-stone-900/50">
            <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 select-none">
              <span>{lang === 'de' ? 'Button-Abstand' : 'Button Spacing (Gap)'}</span>
              <span className="text-[#A855F7] font-mono">{currentGapVal}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="36"
              step="1"
              value={currentGapVal}
              onChange={(e) => saveGridLayout({ gapPx: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-stone-850 rounded-xl appearance-none cursor-pointer accent-[#A855F7]"
            />
            <div className="flex justify-between text-[8px] text-stone-500 font-medium">
              <span>8px</span>
              <span>18px ({lang === 'de' ? 'Standard' : 'Default'})</span>
              <span>36px</span>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const sections = [
    { id: 'styling', label: lang === 'de' ? 'Darstellung' : 'Style', icon: LucideIcons.Sparkles, desc: lang === 'de' ? 'Rahmen, Schatten, Effekte' : 'Borders, shadow, icons' },
    { id: 'face', label: lang === 'de' ? 'Fläche' : 'Face', icon: LucideIcons.Palette, desc: lang === 'de' ? 'Hintergrund, Bild, Verlauf' : 'Bg image, overlays & colors' },
    { id: 'text', label: 'Text', icon: LucideIcons.Type, desc: lang === 'de' ? 'Schriftart, Größe, Farben' : 'Fonts, labels & styling' },
    { id: 'function', label: lang === 'de' ? 'Funktion' : 'Action', icon: LucideIcons.Zap, desc: lang === 'de' ? 'Link, PDF, WhatsApp, PIN' : 'Links, uploads & passcodes' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0E0E0E] md:bg-stone-950/95 md:backdrop-blur-md flex items-center justify-center p-0 md:p-6 font-sans overflow-hidden">
      <div className="bg-[#0E0E0E] md:bg-stone-900 md:border md:border-stone-850 w-full h-full md:max-w-6xl md:h-[90vh] flex flex-col md:rounded-[28px] overflow-hidden shadow-2xl relative">
        
        {/* Top Header */}
        <div className="px-4 md:px-5 py-2.5 md:py-4 border-b border-stone-850 shrink-0 bg-stone-950 flex items-center justify-between h-14 md:h-16">
          <button 
            type="button"
            onClick={handleClose} 
            className="md:hidden text-stone-400 hover:text-white transition p-1.5 rounded-full hover:bg-stone-800 cursor-pointer animate-pop"
          >
            <LucideIcons.X size={20} />
          </button>
          
          <div className="flex items-center gap-2 md:gap-2.5 flex-grow md:flex-grow-0 justify-center md:justify-start">
            <div className="w-7 h-7 rounded-full bg-[#A855F7]/10 hidden md:flex items-center justify-center border border-[#A855F7]/30">
              <LucideIcons.Sparkles className="text-[#A855F7]" size={14} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-extrabold text-white text-xs md:text-sm tracking-tight uppercase">
                {editingButton ? (lang === 'de' ? 'Button bearbeiten' : 'Edit button') : (lang === 'de' ? 'Neuer Button' : 'New button')}
              </h3>
              <p className="hidden md:block text-[10px] text-stone-400 font-medium">
                {lang === 'de' ? 'Gestalte deine ureel-Aktion als klickbaren Button' : 'Design your custom card action as an intuitive button'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleClose} 
            className="hidden md:block text-stone-400 hover:text-white transition p-1.5 rounded-full hover:bg-stone-800 cursor-pointer"
          >
            <LucideIcons.X size={18} />
          </button>
          
          {/* Mobile Right Spacer for alignment */}
          <div className="w-8 h-8 md:hidden flex items-center justify-center shrink-0" />
        </div>

        {/* Core Layout Split */}
        <div className="flex-1 flex flex-col md:flex-row-reverse overflow-hidden bg-[#0E0E0E] md:bg-[#121212]">
          
          {/* DESKTOP-ONLY VISUAL PREVIEW & SELECTION SIDEBAR */}
          <div className="hidden md:flex w-full md:w-[360px] lg:w-[380px] shrink-0 border-b md:border-b-0 md:border-l border-stone-850 bg-[radial-gradient(circle_at_center,_#1F1F1F_0%,_#0B0B0B_100%)] flex-col justify-start p-4 md:p-6 lg:p-7 overflow-y-auto gap-4 md:gap-5 shrink-0">
            {/* Beautiful real-time smartphone simulator */}
            {renderRealisticMockupPreview(false)}

            {/* Status Information Panel */}
            <div className="bg-stone-950/70 p-3.5 rounded-2xl border border-stone-850 text-center text-[9px] leading-relaxed">
              {isDraftDirty ? (
                <span className="text-[#A855F7] font-bold uppercase tracking-wider animate-pulse flex items-center justify-center gap-1">
                  ⚠️ {lang === 'de' ? 'Ungespeicherte Änderungen' : 'Unsaved changes'}
                </span>
              ) : (
                <span className="text-stone-400 font-medium">
                  {lang === 'de' ? '💡 Änderungen werden sofort visualisiert.' : '💡 Changes are visualized instantly in real-time.'}
                </span>
              )}
            </div>
          </div>

          {/* ACTIVE EDITING FORM PANEL (Left on desktop) */}
          <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 scrollbar-thin">
            
            {/* Real-time smartphone mockup on mobile at the very top! (Requirement 6) */}
            <div className="md:hidden w-full">
              {renderRealisticMockupPreview(true)}
            </div>

            {/* Exclusive Category Selection Wrapper */}
            <div className="space-y-4 text-left">
              {activeTab === null ? (
                <div className="space-y-5 animate-fadeIn">
                  <div className="space-y-1 text-center md:text-left mb-2">
                    <h4 className="text-white text-xs md:text-sm font-extrabold uppercase tracking-wide">
                      {lang === 'de' ? 'Wähle einen Bereich zum Bearbeiten:' : 'Choose a section to display:'}
                    </h4>
                    <p className="text-[10px] md:text-xs text-stone-400 font-medium leading-relaxed">
                      {lang === 'de'
                        ? 'Nimm zielgerichtete Anpassungen an Form, Farbe, Text und Funktion vor'
                        : 'Configure target style, colors, fonts and action behaviors'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'styling', label: lang === 'de' ? 'Darstellung' : 'Style', icon: LucideIcons.Sparkles, desc: lang === 'de' ? 'Buttonform, Symbole, Rahmen, Akzentrahmen' : 'Corners, icons, borders, accent styling presets', color: 'from-amber-650/10 to-orange-950/5 border-amber-900/20' },
                      { id: 'face', label: lang === 'de' ? 'Fläche' : 'Face', icon: LucideIcons.Palette, desc: lang === 'de' ? 'Hintergrundfarbe, Bild-Effekt, Buttongröße' : 'Filled backdrops, custom textures, heights', color: 'from-blue-650/10 to-indigo-950/5 border-blue-900/20' },
                      { id: 'text', label: 'Text', icon: LucideIcons.Type, desc: lang === 'de' ? 'Fonts, Schriftgröße, Ausrichtung, Farben' : 'Typography, margins, labels & alignment', color: 'from-emerald-650/10 to-teal-950/5 border-emerald-900/20' },
                      { id: 'function', label: lang === 'de' ? 'Funktion' : 'Action', icon: LucideIcons.Zap, desc: lang === 'de' ? 'Triggertyp, Downloads, PIN, Spalten-Raster' : 'Tap actions, downloads, password, grids', color: 'from-purple-650/10 to-pink-950/5 border-purple-900/20' }
                    ].map((sec) => {
                      const IconComponent = sec.icon;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => handleSectionTabChange(sec.id as any)}
                          className={`flex items-start gap-4 p-5 rounded-2xl border bg-gradient-to-br ${sec.color} hover:border-[#A855F7]/50 hover:scale-[1.01] transition duration-200 cursor-pointer select-none group min-h-[92px]`}
                          style={{ minHeight: '48px' }}
                        >
                          <div className="p-3.5 rounded-xl bg-stone-950/90 text-[#A855F7] border border-stone-850 group-hover:text-white transition duration-250 shrink-0">
                            <IconComponent size={18} />
                          </div>
                          <div className="space-y-1 min-w-0 flex-grow text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-xs md:text-sm uppercase tracking-wider group-hover:text-[#A855F7] transition duration-150 block truncate">
                                {sec.label}
                              </span>
                              <LucideIcons.ChevronRight size={13} className="text-stone-500 group-hover:text-[#A855F7] group-hover:translate-x-1 transition-all hidden sm:block shrink-0" />
                            </div>
                            <span className="text-[10px] md:text-[11px] text-stone-400 font-medium leading-normal block">
                              {sec.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-scaleIn text-left">
                  {activeSubSection === null ? (
                    <div className="space-y-4 animate-scaleIn text-left">
                      {/* Navigation header for Level 2 */}
                      <div className="flex items-center justify-between border-b border-stone-850/80 pb-4 mb-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-[#A855F7] text-xs font-black uppercase tracking-wider transition cursor-pointer select-none shrink-0"
                        >
                          <LucideIcons.ArrowLeft size={13} />
                          <span>{lang === 'de' ? 'Zurück zur Übersicht' : 'Back to overview'}</span>
                        </button>

                        <span className="text-[9px] font-black tracking-widest text-[#A855F7] px-2.5 py-1 rounded-md border border-[#A855F7]/20 bg-[#A855F7]/5 uppercase">
                          {activeTab === 'styling' && (lang === 'de' ? 'Ebene 2: Darstellung' : 'Level 2: Style')}
                          {activeTab === 'face' && (lang === 'de' ? 'Ebene 2: Fläche' : 'Level 2: Face')}
                          {activeTab === 'text' && (lang === 'de' ? 'Ebene 2: Text' : 'Level 2: Text')}
                          {activeTab === 'function' && (lang === 'de' ? 'Ebene 2: Funktion' : 'Level 2: Action')}
                        </span>
                      </div>

                      {/* Big buttons/tiles for Subsections */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {(() => {
                          // Resolve sub-sections based on activeTab
                          let subsectionsList: { id: string; label: string; icon: any; desc: string; color: string }[] = [];
                          if (activeTab === 'styling') {
                            subsectionsList = [
                              { id: 'styling_shape', label: lang === 'de' ? 'Buttonform' : 'Button Form', icon: LucideIcons.Sparkles, desc: lang === 'de' ? 'Rundung, Stilvarianten & Ecken' : 'Corners and style presets', color: 'from-amber-650/10 to-orange-950/5 border-amber-900/20' },
                              { id: 'styling_size', label: lang === 'de' ? 'Buttongröße' : 'Button Size', icon: LucideIcons.Maximize2, desc: lang === 'de' ? 'Abmessungen, Höhe & Breite' : 'Width, height, and custom sizes', color: 'from-blue-650/10 to-indigo-950/5 border-blue-900/20' },
                              { id: 'styling_icon', label: lang === 'de' ? 'Symbol (Icon)' : 'Icon', icon: LucideIcons.Smile, desc: lang === 'de' ? 'Icon aussuchen, Größe & Farbe' : 'Select, color, and size icons', color: 'from-emerald-650/10 to-teal-950/5 border-emerald-900/20' },
                              { id: 'styling_border', label: lang === 'de' ? 'Rahmen' : 'Border', icon: LucideIcons.Square, desc: lang === 'de' ? 'Aktivieren, Rahmenbreite & Akzentrahmen' : 'Enable borders, width, and accent frame', color: 'from-purple-650/10 to-pink-950/5 border-purple-900/20' },
                              { id: 'styling_transfer', label: lang === 'de' ? 'Design übertragen' : 'Apply Design', icon: LucideIcons.Copy, desc: lang === 'de' ? 'Erscheinungsbild kopieren' : 'Sync designs instantly', color: 'from-stone-650/10 to-stone-950/5 border-stone-900/20' },
                            ];
                          } else if (activeTab === 'face') {
                            subsectionsList = [
                              { id: 'face_image', label: lang === 'de' ? 'Buttonbild' : 'Button Image', icon: LucideIcons.Image, desc: lang === 'de' ? 'Bild hochladen & Effekte' : 'Background overlays & compression', color: 'from-amber-650/10 to-orange-950/5 border-amber-900/20' },
                              { id: 'face_color', label: lang === 'de' ? 'Farbmodus' : 'Color Mode', icon: LucideIcons.Palette, desc: lang === 'de' ? 'Vollfarbe, Verläufe oder Outline' : 'Solid colors & presets', color: 'from-blue-650/10 to-indigo-950/5 border-blue-900/20' },
                              { id: 'face_glass', label: lang === 'de' ? 'Transparenz / Glas' : 'Transparency / Glass', icon: LucideIcons.Layers, desc: lang === 'de' ? 'Glas-Effekt, Deckkraft & Padding' : 'Gloss overlays and padding text', color: 'from-emerald-650/10 to-teal-950/5 border-emerald-900/20' },
                              { id: 'face_transfer', label: lang === 'de' ? 'Design übertragen' : 'Apply Design', icon: LucideIcons.Copy, desc: lang === 'de' ? 'Hintergrundfarbe/Stil kopieren' : 'Sync layouts seamlessly', color: 'from-stone-650/10 to-stone-950/5 border-stone-900/20' },
                            ];
                          } else if (activeTab === 'text') {
                            subsectionsList = [
                              { id: 'text_content', label: lang === 'de' ? 'Textinhalt' : 'Text Content', icon: LucideIcons.PenTool, desc: lang === 'de' ? 'Mitteilungstext / Beschriftung' : 'Button label & wording', color: 'from-amber-650/10 to-orange-950/5 border-amber-900/20' },
                              { id: 'text_font', label: lang === 'de' ? 'Schriftart & -größe' : 'Font Family & Size', icon: LucideIcons.Type, desc: lang === 'de' ? 'Vibe, Schriftgrad & Gewicht' : 'Select typography and weight', color: 'from-blue-650/10 to-indigo-950/5 border-blue-900/20' },
                              { id: 'text_color', label: lang === 'de' ? 'Textfarbe' : 'Text Color', icon: LucideIcons.Palette, desc: lang === 'de' ? 'Schriftfarbe festlegen' : 'Font color palette & swatches', color: 'from-[#A855F7]/10 to-stone-950/5 border-[#A855F7]/20' },
                              { id: 'text_align', label: lang === 'de' ? 'Ausrichtung & Position' : 'Alignment & Position', icon: LucideIcons.AlignLeft, desc: lang === 'de' ? 'Feinjustierung (X/Y) & Orientierung' : 'Text padding offsets', color: 'from-emerald-650/10 to-teal-950/5 border-emerald-900/20' },
                              { id: 'text_transfer', label: lang === 'de' ? 'Design übertragen' : 'Apply Design', icon: LucideIcons.Copy, desc: lang === 'de' ? 'Texteinstellungen kopieren' : 'Sync text settings', color: 'from-stone-650/10 to-stone-950/5 border-stone-900/20' },
                            ];
                          } else if (activeTab === 'function') {
                            subsectionsList = [
                              { id: 'function_action', label: lang === 'de' ? 'Aktion / Ziel' : 'Action / Target', icon: LucideIcons.Zap, desc: lang === 'de' ? 'Links, Telefon, Downloads' : 'Configure button target actions', color: 'from-amber-650/10 to-orange-950/5 border-amber-900/20' },
                              { id: 'function_password', label: lang === 'de' ? 'Passwortschutz' : 'Password Protection', icon: LucideIcons.Lock, desc: lang === 'de' ? 'Button mit Passwort schützen' : 'visitors must insert PIN passcode', color: 'from-blue-650/10 to-indigo-950/5 border-blue-900/20' },
                              { id: 'function_raster', label: lang === 'de' ? 'Spalten-Raster' : 'Grid Columns', icon: LucideIcons.LayoutGrid, desc: lang === 'de' ? 'Buttons-Anordnung für dieses Kärtchen' : 'Grid layout columns and gap', color: 'from-[#A855F7]/10 to-stone-950/5 border-[#A855F7]/20' },
                              { id: 'function_transfer', label: lang === 'de' ? 'Design übertragen' : 'Apply Design', icon: LucideIcons.Copy, desc: lang === 'de' ? 'Funktionsdesign übertragen' : 'Sync target action templates', color: 'from-stone-650/10 to-stone-950/5 border-stone-900/20' },
                            ];
                          }

                          return subsectionsList.map((sub) => {
                            const IconComponent = sub.icon;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => setActiveSubSection(sub.id)}
                                className={`flex items-start gap-4 p-4 rounded-2xl border bg-gradient-to-br ${sub.color} hover:border-[#A855F7]/50 hover:scale-[1.01] transition duration-200 cursor-pointer select-none group min-h-[80px]`}
                              >
                                <div className="p-3 rounded-xl bg-stone-950/90 text-[#A855F7] border border-stone-850 group-hover:text-white transition duration-250 shrink-0">
                                  <IconComponent size={16} />
                                </div>
                                <div className="space-y-1 min-w-0 flex-grow text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-white text-xs md:text-sm tracking-wider group-hover:text-[#A855F7] transition duration-150 block truncate">
                                      {sub.label}
                                    </span>
                                    <LucideIcons.ChevronRight size={12} className="text-stone-500 group-hover:text-[#A855F7] group-hover:translate-x-1 transition-all shrink-0" />
                                  </div>
                                  <span className="text-[10px] md:text-[11px] text-stone-400 font-medium leading-tight block">
                                    {sub.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-scaleIn text-left">
                      {/* Navigation header for Level 3 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850/80 pb-4 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActiveSubSection(null)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-[#A855F7] text-[10px] font-black uppercase tracking-wider transition cursor-pointer select-none shrink-0"
                          >
                            <LucideIcons.ChevronLeft size={12} />
                            <span>{lang === 'de' ? 'Zurück zu Bereichen' : 'Back to options'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setActiveTab(null); setActiveSubSection(null); }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 text-[10px] font-black uppercase tracking-wider transition cursor-pointer select-none shrink-0"
                          >
                            <LucideIcons.Home size={11} />
                            <span>{lang === 'de' ? 'Übersicht' : 'Overview'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[8.5px] font-black tracking-widest text-[#A855F7] px-2 py-0.5 rounded border border-[#A855F7]/20 bg-[#A855F7]/5 shrink-0 uppercase">
                            {(() => {
                              if (activeSubSection === 'styling_shape') return lang === 'de' ? 'Buttonform' : 'Button Form';
                              if (activeSubSection === 'styling_size') return lang === 'de' ? 'Buttongröße' : 'Button Size';
                              if (activeSubSection === 'styling_icon') return lang === 'de' ? 'Symbol (Icon)' : 'Icon';
                              if (activeSubSection === 'styling_border') return lang === 'de' ? 'Rahmenschnitt' : 'Border';
                              if (activeSubSection === 'styling_transfer') return lang === 'de' ? 'Design übertragen' : 'Apply Design';
                              
                              if (activeSubSection === 'face_image') return lang === 'de' ? 'Buttonbild' : 'Button Image';
                              if (activeSubSection === 'face_color') return lang === 'de' ? 'Farbmodus' : 'Color Mode';
                              if (activeSubSection === 'face_glass') return lang === 'de' ? 'Transparenz' : 'Transparency';
                              if (activeSubSection === 'face_transfer') return lang === 'de' ? 'Design übertragen' : 'Apply Design';

                              if (activeSubSection === 'text_content') return lang === 'de' ? 'Textinhalt' : 'Text Content';
                              if (activeSubSection === 'text_font') return lang === 'de' ? 'Schriftart' : 'Font Family';
                              if (activeSubSection === 'text_color') return lang === 'de' ? 'Textfarbe' : 'Text Color';
                              if (activeSubSection === 'text_align') return lang === 'de' ? 'Ausrichtung & Offset' : 'Alignment';
                              if (activeSubSection === 'text_transfer') return lang === 'de' ? 'Design übertragen' : 'Apply Design';

                              if (activeSubSection === 'function_action') return lang === 'de' ? 'Aktion' : 'Action';
                              if (activeSubSection === 'function_password') return lang === 'de' ? 'Passwortschutz' : 'Password';
                              if (activeSubSection === 'function_raster') return lang === 'de' ? 'Anordnung / Raster' : 'Raster Grid';
                              if (activeSubSection === 'function_transfer') return lang === 'de' ? 'Design übertragen' : 'Apply Design';
                              return activeSubSection;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Rendering specific form on Level 3 */}
                      {activeTab === 'styling' && (
                        <div className="space-y-4 pt-1 text-left">
                          {(activeSubSection === 'styling_shape' || activeSubSection === 'styling_icon' || activeSubSection === 'styling_border') && (
                            <ButtonAppearanceTab
                              localButton={localButton}
                              updateButton={updateButtonState}
                              lang={lang}
                              activeCard={activeCard}
                              onSaveAllButtons={onSaveAllButtons}
                              subSection={activeSubSection}
                            />
                          )}
                          {activeSubSection === 'styling_size' && renderButtonSizeMenu()}
                          {activeSubSection === 'styling_transfer' && renderDesignTransferSection()}
                        </div>
                      )}

                      {activeTab === 'face' && (
                        <div className="space-y-4 pt-1 text-left">
                          {(activeSubSection === 'face_image' || activeSubSection === 'face_color' || activeSubSection === 'face_glass') && (
                            <ButtonFaceTab
                              localButton={localButton}
                              updateButton={updateButtonState}
                              lang={lang}
                              isBtnImageUploading={isBtnImageUploading}
                              handleButtonImageUpload={handleButtonImageUpload}
                              isImageLocked={!canUseFeature(currentPlan, 'buttonBackgroundImage')}
                              onImageLockClick={() => setUpgradeModalFeature('buttonBackgroundImage')}
                              subSection={activeSubSection}
                            />
                          )}
                          {activeSubSection === 'face_transfer' && renderDesignTransferSection()}
                        </div>
                      )}

                      {activeTab === 'text' && (
                        <div className="space-y-4 pt-1 text-left">
                          {(activeSubSection === 'text_content' || activeSubSection === 'text_font' || activeSubSection === 'text_color' || activeSubSection === 'text_align') && (
                            <ButtonTextTab
                              localButton={localButton}
                              updateButton={updateButtonState}
                              lang={lang}
                              subSection={activeSubSection}
                            />
                          )}
                          {activeSubSection === 'text_transfer' && renderDesignTransferSection()}
                        </div>
                      )}

                      {activeTab === 'function' && (
                        <div className="space-y-4 pt-1 text-left">
                          {(activeSubSection === 'function_action' || activeSubSection === 'function_password') && (
                            <ButtonActionTab
                              localButton={localButton}
                              updateButton={updateButtonState}
                              lang={lang}
                              isBtnFileUploading={isBtnFileUploading}
                              handleFileActionUpload={handleFileActionUpload}
                              btnProtected={btnProtected}
                              setBtnProtected={setBtnProtected}
                              btnPassword={btnPassword}
                              setBtnPassword={setBtnPassword}
                              btnRepeatPassword={btnRepeatPassword}
                              setBtnRepeatPassword={setBtnRepeatPassword}
                              btnPasswordHint={btnPasswordHint}
                              setBtnPasswordHint={setBtnPasswordHint}
                              handleTestLink={handleTestLink}
                              card={activeCard}
                              subSection={activeSubSection}
                            />
                          )}
                          {activeSubSection === 'function_raster' && renderButtonRasterMenu()}
                          {activeSubSection === 'function_transfer' && renderDesignTransferSection()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Height Spacer */}
            <div className="h-12 md:h-0" />
          </div>

        </div>

        {/* Fixed Save / Cancel Bar */}
        <div className="px-4 md:px-5 py-3.5 border-t border-stone-850 shrink-0 bg-stone-950 flex flex-row items-center justify-between gap-3 h-16 md:h-20 pb-[calc(14px+env(safe-area-inset-bottom))] md:pb-3.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {editingButton && onDelete && (
              <button
                type="button"
                disabled={isDeleting || isSaving}
                onClick={handleDeleteTrigger}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black text-[10px] tracking-wider uppercase py-2.5 px-3 md:px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Trash2 size={13} />
                <span className="hidden sm:inline">
                  {isDeleting 
                    ? (lang === 'de' ? 'Löschen...' : 'Deleting...') 
                    : (lang === 'de' ? 'Löschen' : 'Delete')}
                </span>
              </button>
            )}

            {editingButton && onDuplicate && (
              <button
                type="button"
                disabled={isSaving || isDeleting}
                onClick={async () => {
                  await onDuplicate(localButton);
                }}
                className="bg-[#A855F7]/10 hover:bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/20 font-black text-[10px] tracking-wider uppercase py-2.5 px-3 md:px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Copy size={13} />
                <span className="hidden sm:inline">
                  {lang === 'de' ? 'Kopieren' : 'Duplicate'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelTrigger}
              className="bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 font-bold text-xs py-2 px-3 md:px-4.5 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              {lang === 'de' ? 'Abbrechen' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSaving || isDeleting}
              onClick={handleSaveChangesBlock}
              className="bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black tracking-tight text-xs py-2 px-4 md:px-5.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer justify-center whitespace-nowrap animate-pulseOnHover"
            >
              {isSaving ? <span className="animate-spin text-stone-950 border-2 border-stone-950 border-t-transparent rounded-full w-3 h-3 block" /> : <LucideIcons.Save size={13} />}
              <span>
                {isSaving 
                  ? (lang === 'de' ? 'Speichern...' : 'Saving...') 
                  : (lang === 'de' ? 'Speichern' : 'Save')}
              </span>
            </button>
          </div>
        </div>

        {/* Error Banner Container */}
        {errorMessage && (
          <div className="px-4 py-3 bg-red-950/90 border-t border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2.5 select-text shrink-0 animate-slideUp">
            <LucideIcons.AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span className="whitespace-pre-line flex-1 leading-relaxed">{errorMessage}</span>
            <button 
              type="button" 
              onClick={() => setErrorMessage(null)} 
              className="ml-auto text-red-400 hover:text-white transition p-1 cursor-pointer bg-transparent"
            >
              <LucideIcons.X size={15} />
            </button>
          </div>
        )}

        {/* Success Banner Container (Goal 5) */}
        {successMessage && (
          <div className="px-4 py-2.5 bg-emerald-950/80 border-t border-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-2 select-text shrink-0">
            <LucideIcons.CheckCircle size={13} className="text-emerald-400 shrink-0" />
            <span className="whitespace-pre-line flex-1 leading-relaxed">{successMessage}</span>
            <button 
              type="button" 
              onClick={() => setSuccessMessage(null)} 
              className="ml-auto text-emerald-400 hover:text-white transition p-1 cursor-pointer bg-transparent"
            >
              <LucideIcons.X size={13} />
            </button>
          </div>
        )}

      </div>

      {/* 1. DISCARD CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <LucideIcons.AlertTriangle size={24} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white text-base font-black uppercase tracking-wide">
                {lang === 'de' ? 'Änderungen verwerfen?' : 'Discard changes?'}
              </h4>
              <p className="text-stone-400 text-xs font-semibold leading-relaxed">
                {lang === 'de' 
                  ? 'Du hast ungespeicherte Änderungen an diesem Button. Möchtest du diese wirklich verwerfen?' 
                  : 'You have unsaved changes on this button. Do you really want to discard them?'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setIsDraftDirty(false);
                  onClose();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                {lang === 'de' ? 'Verwerfen' : 'Discard'}
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                {lang === 'de' ? 'Weiter bearbeiten' : 'Keep editing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <LucideIcons.Trash2 size={24} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white text-base font-black uppercase tracking-wide">
                {lang === 'de' ? 'Button löschen?' : 'Delete button?'}
              </h4>
              <p className="text-stone-400 text-xs font-semibold leading-relaxed">
                {lang === 'de' 
                  ? 'Möchtest du diesen Button wirklich komplett löschen? Diese Aktion kann nicht rückgängig gemacht werden.' 
                  : 'Do you really want to permanently delete this button? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDelete?.(localButton.id);
                    setIsDraftDirty(false);
                    setShowDeleteConfirm(false);
                    onClose();
                  } catch (err: any) {
                    setErrorMessage(lang === 'de' ? 'Löschen fehlgeschlagen.' : 'Deletion failed.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting && <span className="animate-spin text-white border-2 border-white border-t-transparent rounded-full w-3 h-3 block" />}
                <span>{lang === 'de' ? 'Ja, löschen' : 'Yes, delete'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                {lang === 'de' ? 'Nein, abbrechen' : 'No, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeModalFeature && (
        <UpgradeModal
          isOpen={!!upgradeModalFeature}
          onClose={() => setUpgradeModalFeature('')}
          lang={lang as 'de' | 'en'}
          featureKey={upgradeModalFeature}
        />
      )}

    </div>
  );
};
