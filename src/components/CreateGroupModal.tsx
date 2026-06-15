import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Upload, Copy, Share2 } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';

export const BANNER_PRESETS = [
  { name: 'Timber Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chess Castle', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Neon Space', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' }
];

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createGroup } = useGroups();

  const [createStep, setCreateStep] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(BANNER_PRESETS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setNewGroupName('');
      setSelectedPresetUrl(BANNER_PRESETS[0].url);
      setCustomImageUrl('');
      setUploadedImageUrl('');
      setUploadedFileName('');
      setCreateStep(1);
      setCreatedGroup(null);
      setCopiedCode(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
        setSelectedPresetUrl('');
        setCustomImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await triggerHapticClick();

    const imageUrlToUse = uploadedImageUrl || customImageUrl.trim() || selectedPresetUrl;
    const res = await createGroup(newGroupName, imageUrlToUse);
    if (res.success && res.group) {
      await triggerHapticSuccess();
      setCreatedGroup(res.group);
      setCreateStep(3);
    } else {
      await triggerHapticError();
      alert(res.error || "Failed to create league");
    }
  };

  return (
    <div className="fixed inset-0 bg-sky-50 text-slate-800 z-50 flex flex-col pt-safe pb-safe animate-fade-in overflow-y-auto">
      
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-900 bg-white sticky top-0 z-10 shadow-[0_2px_0px_rgba(15,23,42,0.05)]">
        {createStep === 2 ? (
          <button
            onClick={async () => {
              await triggerHapticClick();
              setCreateStep(1);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title={t('dashboard.createModal.backBtn')}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}

        <span className="font-outfit font-black text-sm uppercase tracking-wider text-slate-900">
          {t('dashboard.createModal.title')}
        </span>

        <button
          onClick={async () => {
            await triggerHapticClick();
            onClose();
          }}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
          title="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </header>

      {/* Main body content */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-8 flex flex-col justify-between space-y-8">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          
          {/* STEP 1: League Name */}
          {createStep === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="font-outfit font-black text-2xl text-slate-900 uppercase tracking-tight">
                  {t('dashboard.createModal.step1Title')}
                </h3>
                <p className="text-sm font-outfit text-slate-500 leading-snug">
                  {t('dashboard.createModal.step1Subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={t('dashboard.createModal.namePlaceholder')}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-900 rounded-xl text-center text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={async () => {
                    await triggerHapticClick();
                    setCreateStep(2);
                  }}
                  disabled={!newGroupName.trim()}
                  className="w-full py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-900 font-outfit font-black border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0f172a] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all text-xs tracking-wider uppercase disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0"
                >
                  {t('dashboard.createModal.nextBtn')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Banner Selection */}
          {createStep === 2 && (
            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="font-outfit font-black text-2xl text-slate-900 uppercase tracking-tight">
                  {t('dashboard.createModal.step2Title')}
                </h3>
                <p className="text-sm font-outfit text-slate-500 leading-snug">
                  {t('dashboard.createModal.step2Subtitle')}
                </p>
              </div>

              {/* Selected Banner Preview */}
              <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-white border-2 border-slate-900 shadow-inner flex items-center justify-center">
                {uploadedImageUrl || selectedPresetUrl ? (
                  <img
                    src={uploadedImageUrl || selectedPresetUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Image Selected</span>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[8px] text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Preview
                </div>
              </div>

              {/* Preset Selection Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-outfit font-black uppercase tracking-wider text-slate-500">Choose Preset Banner</label>
                <div className="grid grid-cols-4 gap-2 bg-white border-2 border-slate-900 p-3 rounded-2xl shadow-sm">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={async () => {
                        await triggerHapticClick();
                        setSelectedPresetUrl(preset.url);
                        setUploadedImageUrl('');
                        setUploadedFileName('');
                        setCustomImageUrl('');
                      }}
                      className={`relative h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPresetUrl === preset.url ? 'border-slate-900 scale-95 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider my-2">— or —</div>

              {/* File Upload Area */}
              <div className="space-y-1.5">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900 bg-white hover:bg-sky-50/30 rounded-2xl p-4 cursor-pointer transition-all shadow-sm">
                  <Upload className="w-6 h-6 text-slate-500" />
                  <span className="text-xs text-slate-600 font-bold mt-2 text-center">
                    {uploadedFileName ? t('dashboard.createModal.fileSelected', { name: uploadedFileName }) : "Choose image file (PNG, JPG)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-900 font-outfit font-black border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0f172a] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all text-xs tracking-wider uppercase"
                >
                  {t('dashboard.createModal.createBtn')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Invite Code Success view */}
          {createStep === 3 && createdGroup && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h3 className="font-outfit font-black text-2xl text-slate-900 uppercase tracking-tight">
                  {t('dashboard.createModal.step3Title')}
                </h3>
                <p className="text-sm font-outfit text-slate-500 leading-snug">
                  {t('dashboard.createModal.step3Subtitle')}
                </p>
              </div>

              {/* Code Display */}
              <div className="py-4 text-center space-y-4">
                <div className="text-5xl font-black text-slate-900 tracking-[0.2em] pl-[0.2em] select-all font-space-mono bg-white border-2 border-slate-900 py-4 rounded-2xl shadow-[4px_4px_0px_#0f172a]">
                  {createdGroup.invite_code}
                </div>
                <button
                  onClick={async () => {
                    await triggerHapticClick();
                    navigator.clipboard.writeText(createdGroup.invite_code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 mx-auto active:scale-95 transition-transform"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode ? t('dashboard.createModal.codeCopied') : t('dashboard.createModal.copyCodeBtn')}
                </button>
              </div>

              {/* Share actions */}
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await triggerHapticClick();
                      navigator.clipboard.writeText(`${window.location.origin}?join=${createdGroup.invite_code}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex-1 py-3.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#0f172a] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                    {copiedLink ? "Link Copied!" : t('dashboard.createModal.copyLinkBtn')}
                  </button>

                  <button
                    onClick={async () => {
                      await triggerHapticClick();
                      const inviteLink = `${window.location.origin}?join=${createdGroup.invite_code}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: createdGroup.name,
                            text: `Join my league on Puzzlr!`,
                            url: inviteLink,
                          });
                        } catch (err) {
                          // ignore
                        }
                      } else {
                        navigator.clipboard.writeText(inviteLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="flex-1 py-3.5 bg-sky-100 hover:bg-sky-200 border-2 border-slate-900 text-sky-950 font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#0f172a] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <Share2 className="w-4 h-4 text-sky-600" />
                    {t('dashboard.createModal.shareLinkBtn')}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-semibold italic">
                {t('dashboard.createModal.expiresHint')}
              </p>

              <button
                onClick={async () => {
                  await triggerHapticClick();
                  onClose();
                }}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-outfit font-black border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_#cbd5e1] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all text-xs uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Step Indicator Dots */}
        <div className="flex justify-center items-center gap-2.5 py-4">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${createStep === 1 ? 'bg-slate-800 scale-125 border border-slate-900' : 'bg-slate-300 hover:bg-slate-400'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${createStep === 2 ? 'bg-slate-800 scale-125 border border-slate-900' : 'bg-slate-300 hover:bg-slate-400'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${createStep === 3 ? 'bg-slate-800 scale-125 border border-slate-900' : 'bg-slate-300 hover:bg-slate-400'}`} />
        </div>
      </main>
    </div>
  );
};
