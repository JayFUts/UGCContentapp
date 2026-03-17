import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, LayoutTemplate, Type as TypeIcon, Smartphone, Square, RefreshCw, Upload, Sparkles, Loader2, Instagram, Video, RectangleVertical, Share2, Film, Linkedin } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

type Platform = 'instagram' | 'tiktok' | 'linkedin';
type Format = 'post-square' | 'post-portrait' | 'story' | 'linkedin-cover';
type Template = 'cta' | 'stat' | 'quote' | 'spotlight' | 'banner-pro';

type Variant = {
  headline: string;
  highlightText: string;
  subtitle: string;
  statNumber: string;
  statLabel: string;
  authorName: string;
  caption: string;
  template: Template;
  mediaUrl: string;
  imagePrompt: string;
  isLoadingImage?: boolean;
};

export default function App() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [format, setFormat] = useState<Format>('post-square');
  const [template, setTemplate] = useState<Template>('cta');
  const [isExporting, setIsExporting] = useState(false);
  
  // Content state
  const [headline, setHeadline] = useState('Kom direct in contact met ervaren');
  const [highlightText, setHighlightText] = useState('UGC creators');
  const [subtitle, setSubtitle] = useState('Ontvang beeldmateriaal voor effectieve social media advertenties op platforms zoals TikTok, Instagram en Facebook.');
  const [statNumber, setStatNumber] = useState('1,068+');
  const [statLabel, setStatLabel] = useState('Creators');
  const [authorName, setAuthorName] = useState('Sarah de Vries');
  const [caption, setCaption] = useState('🚀 Klaar om je merk te laten groeien met authentieke content? Ontdek hoe UGC creators je kunnen helpen! Link in bio. #UGC #Marketing #Groei');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [backgroundMode, setBackgroundMode] = useState<'media' | 'solid'>('media');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [primaryTextColor, setPrimaryTextColor] = useState('#ffffff');
  const [highlightColor, setHighlightColor] = useState('#40B883');
  const [subtitleColor, setSubtitleColor] = useState('#e5e7eb'); // gray-200

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key available");

      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genereer Instagram ad content voor UGC4you (een platform dat merken en UGC creators verbindt). 
        De gebruiker wil een ad over: "${prompt}".
        Schrijf in het Nederlands. Kort en krachtig.
        Kies ook een passende template ('cta', 'stat', 'quote', 'spotlight' of 'banner-pro').`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Korte, pakkende koptekst (zonder de highlight tekst)" },
              highlightText: { type: Type.STRING, description: "1 of 2 woorden om te benadrukken in het groen" },
              subtitle: { type: Type.STRING, description: "Ondersteunende tekst of call-to-action (max 2 zinnen)" },
              statNumber: { type: Type.STRING, description: "Een indrukwekkend getal (bijv. '1.000+', '50%')" },
              statLabel: { type: Type.STRING, description: "Label voor het getal (bijv. 'Creators', 'Conversie')" },
              authorName: { type: Type.STRING, description: "Een verzonnen naam van een creator of merk" },
              caption: { type: Type.STRING, description: "Een pakkende caption/beschrijving voor bij de post, inclusief relevante hashtags en emoji's" },
              suggestedTemplate: { type: Type.STRING, description: "Kies uit: cta, stat, quote, spotlight, banner-pro" }
            },
            required: ["headline", "highlightText", "subtitle", "statNumber", "statLabel", "authorName", "caption", "suggestedTemplate"]
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        setHeadline(data.headline || headline);
        setHighlightText(data.highlightText || highlightText);
        setSubtitle(data.subtitle || subtitle);
        setStatNumber(data.statNumber || statNumber);
        setStatLabel(data.statLabel || statLabel);
        setAuthorName(data.authorName || authorName);
        setCaption(data.caption || caption);
        if (['cta', 'stat', 'quote', 'spotlight'].includes(data.suggestedTemplate)) {
          setTemplate(data.suggestedTemplate as Template);
        }
      }
    } catch (error: any) {
      console.error("Error generating content:", error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        alert("Het limiet voor tekst genereren is bereikt. Zorg ervoor dat je een eigen (betaalde) Google Cloud API key hebt geselecteerd.");
      } else {
        alert("Er ging iets mis bij het genereren van de content.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const loadVariant = (v: Variant) => {
    setHeadline(v.headline);
    setHighlightText(v.highlightText);
    setSubtitle(v.subtitle);
    setStatNumber(v.statNumber);
    setStatLabel(v.statLabel);
    setAuthorName(v.authorName);
    setCaption(v.caption);
    setTemplate(v.template);
    setMediaUrl(v.mediaUrl);
    setMediaType('image');
  };

  const handleGenerate10Variants = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingVariants(true);
    setGenerationProgress('Teksten bedenken...');
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key available");

      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genereer 10 VERSCHILLENDE Instagram ad content varianten voor UGC4you over: "${prompt}".
        Schrijf in het Nederlands. Zorg voor veel variatie in de teksten, templates en invalshoeken.
        Bedenk voor elke variant ook een specifieke, visuele beschrijving voor een AI image generator (in het Engels).
        Varieer in settings (binnen, buiten, kantoor, café, etc.), belichting en compositie.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING, description: "Korte, pakkende koptekst (zonder de highlight tekst)" },
                highlightText: { type: Type.STRING, description: "1 of 2 woorden om te benadrukken in het groen" },
                subtitle: { type: Type.STRING, description: "Ondersteunende tekst of call-to-action (max 2 zinnen)" },
                statNumber: { type: Type.STRING, description: "Een indrukwekkend getal (bijv. '1.000+', '50%')" },
                statLabel: { type: Type.STRING, description: "Label voor het getal (bijv. 'Creators', 'Conversie')" },
                authorName: { type: Type.STRING, description: "Een verzonnen naam van een creator of merk" },
                caption: { type: Type.STRING, description: "Een pakkende caption/beschrijving voor bij de post, inclusief relevante hashtags en emoji's" },
                suggestedTemplate: { type: Type.STRING, description: "Kies uit: cta, stat, quote, spotlight" },
                imagePrompt: { type: Type.STRING, description: "A detailed, visual English prompt for an AI image generator. Describe the setting, person, and mood. No text in image." }
              },
              required: ["headline", "highlightText", "subtitle", "statNumber", "statLabel", "authorName", "caption", "suggestedTemplate", "imagePrompt"]
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        
        // High quality UGC-style stock images for the variants
        const stockImages = [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
        ];
        // Shuffle images
        const shuffledImages = [...stockImages].sort(() => 0.5 - Math.random());

        const newVariants: Variant[] = data.map((v: any, index: number) => ({
          headline: v.headline || headline,
          highlightText: v.highlightText || highlightText,
          subtitle: v.subtitle || subtitle,
          statNumber: v.statNumber || statNumber,
          statLabel: v.statLabel || statLabel,
          authorName: v.authorName || authorName,
          caption: v.caption || caption,
          template: ['cta', 'stat', 'quote', 'spotlight'].includes(v.suggestedTemplate) ? v.suggestedTemplate : 'cta',
          mediaUrl: shuffledImages[index % shuffledImages.length],
          imagePrompt: v.imagePrompt || `A professional Instagram UGC photo. Context: ${v.headline}`,
          isLoadingImage: true
        }));

        setVariants([...newVariants]);
        loadVariant(newVariants[0]);

        // Generate images sequentially
        for (let i = 0; i < newVariants.length; i++) {
          setGenerationProgress(`Afbeelding ${i + 1} van 10 genereren...`);
          try {
            const imagePrompt = `A professional Instagram UGC (User Generated Content) photo. High quality, aesthetic, authentic lifestyle photography. ${newVariants[i].imagePrompt}. No text or words in the image.`;
            
            const imgResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: { parts: [{ text: imagePrompt }] },
              config: {
                imageConfig: {
                  aspectRatio: format === 'story' ? "9:16" : format === 'post-portrait' ? "3:4" : "1:1"
                }
              }
            });

            if (imgResponse.candidates && imgResponse.candidates[0].content.parts) {
              for (const part of imgResponse.candidates[0].content.parts) {
                if (part.inlineData) {
                  const base64EncodeString = part.inlineData.data;
                  newVariants[i].mediaUrl = `data:image/png;base64,${base64EncodeString}`;
                  newVariants[i].isLoadingImage = false;
                  
                  setVariants([...newVariants]);
                  
                  // Update main view if it's the first one
                  if (i === 0) {
                    loadVariant(newVariants[0]);
                  }
                  break;
                }
              }
            }
          } catch (imgError: any) {
            console.error(`Error generating image ${i}:`, imgError);
            newVariants[i].isLoadingImage = false;
            setVariants([...newVariants]);
            
            if (imgError?.status === 429 || imgError?.message?.includes('429') || imgError?.message?.includes('RESOURCE_EXHAUSTED')) {
               alert("API limiet bereikt tijdens het genereren van afbeeldingen. De resterende varianten gebruiken tijdelijke stockfoto's.");
               for (let j = i; j < newVariants.length; j++) {
                 newVariants[j].isLoadingImage = false;
               }
               setVariants([...newVariants]);
               break;
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating variants:", error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        alert("Het limiet voor tekst genereren is bereikt. Zorg ervoor dat je een eigen (betaalde) Google Cloud API key hebt geselecteerd.");
      } else {
        alert("Er ging iets mis bij het genereren van de varianten.");
      }
    } finally {
      setIsGeneratingVariants(false);
      setGenerationProgress('');
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key available");

      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const imagePrompt = `A professional Instagram UGC (User Generated Content) photo. High quality, aesthetic, authentic lifestyle photography. Context: ${prompt || headline || 'A content creator'}. No text or words in the image.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: imagePrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: format === 'story' ? "9:16" : format === 'post-portrait' ? "3:4" : "1:1"
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const newImageUrl = `data:image/png;base64,${base64EncodeString}`;
            setMediaUrl(newImageUrl);
            setMediaType('image');
            break;
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        alert("Het limiet voor afbeeldingen genereren is bereikt. Zorg ervoor dat je een eigen (betaalde) Google Cloud API key hebt geselecteerd.");
      } else {
        alert("Er ging iets mis bij het genereren van de afbeelding.");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key available");
      
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const videoPrompt = `A professional Instagram UGC (User Generated Content) B-roll video. High quality, aesthetic, authentic cinematic B-roll footage. Context: ${prompt || headline || 'A content creator'}. No text or words in the video. Natural movement, slow motion, or dynamic camera work.`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: format === 'post-square' ? '16:9' : '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey as string,
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setMediaUrl(videoUrl);
        setMediaType('video');
      }
    } catch (error) {
      console.error("Error generating video:", error);
      alert("Er ging iets mis bij het genereren van de video. Let op: voor video generatie is een betaalde API key nodig via Google Cloud.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!headline && !subtitle) return;
    setIsGeneratingAudio(true);
    try {
      const textToSpeak = `${headline}. ${subtitle}`;
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSpeak,
          voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Auto play
      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      alert("Er ging iets mis bij het genereren van de voice-over. Controleer of de ELEVENLABS_API_KEY is geconfigureerd.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (previewRef.current === null) return;
    
    try {
      setIsExporting(true);
      
      const targetWidth = format === 'linkedin-cover' ? 1584 : 1080;
      const dataUrl = await toPng(previewRef.current, { 
        cacheBust: true,
        pixelRatio: targetWidth / 400, // Exact target width export
        skipFonts: false,
      });
      
      const link = document.createElement('a');
      link.download = `ugc4you-${platform}-${template}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Oops, something went wrong!', err);
    } finally {
      setIsExporting(false);
    }
  }, [previewRef, template, format]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrl(event.target.result as string);
          setMediaType(isVideo ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPreview = () => {
    const isSquare = format === 'post-square';
    const isPortrait = format === 'post-portrait';
    const isStory = format === 'story';
    const isCover = format === 'linkedin-cover';
    
    const renderMedia = (className: string) => {
      if (mediaType === 'video') {
        return <video src={mediaUrl} autoPlay loop muted playsInline className={className} crossOrigin="anonymous" />;
      }
      return <img src={mediaUrl} alt="Creator" className={className} crossOrigin="anonymous" />;
    };
    
    const width = 400;
    const height = isCover ? 100 : isSquare ? 400 : isPortrait ? 500 : 711; // 4:1, 1:1, 4:5, 9:16

    return (
      <div 
        ref={previewRef}
        className="relative overflow-hidden flex flex-col shadow-sm"
        style={{ width, height, fontFamily: "'Inter', sans-serif", backgroundColor: backgroundMode === 'solid' ? backgroundColor : '#111827' }}
      >
        {/* Background Media for ALL templates */}
        {backgroundMode === 'media' && (
          <div className="absolute inset-0 w-full h-full">
            {renderMedia("w-full h-full object-cover object-center")}
          </div>
        )}

        {template === 'cta' && (
          <>
            {backgroundMode === 'media' && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>}
            <div className={`relative z-10 flex-1 flex flex-col items-center text-center ${isCover ? 'p-3' : 'p-8'}`}>
              <div className={`${isCover ? 'text-sm px-3 py-1 mb-1' : 'text-xl px-5 py-2 mb-auto'} font-extrabold tracking-tight bg-white/95 rounded-full shadow-lg`}>
                <span className="text-[#111827]">UGC</span><span className="text-[#40B883]">4you</span>
              </div>
              
              <div className="mt-auto w-full flex flex-col items-center">
                <h1 className={`${isCover ? 'text-lg' : isSquare ? 'text-2xl' : 'text-3xl'} font-extrabold leading-tight tracking-tight ${isCover ? 'mb-1' : 'mb-3'} drop-shadow-lg`} style={{ color: primaryTextColor }}>
                  {headline} {isCover ? '' : <br />}
                  <span style={{ color: highlightColor }}>{highlightText}</span>
                </h1>
                
                <p className={`${isCover ? 'text-[10px] mb-2' : isSquare ? 'text-sm mb-6' : 'text-base mb-6'} leading-relaxed max-w-[280px] drop-shadow-md`} style={{ color: subtitleColor }}>
                  {subtitle}
                </p>
                
                {!isCover && (
                  <div className="text-white px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl" style={{ backgroundColor: highlightColor }}>
                    Registreer gratis
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {template === 'stat' && (
          <>
            {backgroundMode === 'media' && <div className="absolute inset-0 bg-black/60"></div>}
            <div className={`relative z-10 flex-1 flex flex-col ${isCover ? 'p-3 flex-row items-center gap-4' : 'p-8'}`}>
              {!isCover && (
                <div className="text-xl font-extrabold tracking-tight mb-8 opacity-90 drop-shadow-md" style={{ color: primaryTextColor }}>
                  <span>UGC</span><span style={{ color: highlightColor }}>4you</span>
                </div>
              )}
              
              <div className={`flex-1 flex ${isCover ? 'flex-row items-center text-left gap-4' : 'flex-col justify-center items-center text-center'}`}>
                <div className={`${isCover ? 'mb-0 p-3' : 'mb-6 p-6'} bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl shrink-0`}>
                  <span className={`${isCover ? 'text-2xl' : isSquare ? 'text-5xl' : 'text-7xl'} font-black tracking-tight block mb-1 drop-shadow-lg`} style={{ color: highlightColor }}>{statNumber}</span>
                  <span className={`${isCover ? 'text-[10px]' : 'text-sm'} font-bold uppercase tracking-widest opacity-90`} style={{ color: primaryTextColor }}>{statLabel}</span>
                </div>
                
                <div>
                  <h2 className={`${isCover ? 'text-base' : isSquare ? 'text-xl' : 'text-3xl'} font-bold leading-tight ${isCover ? 'mb-1' : 'mb-3'} drop-shadow-lg`} style={{ color: primaryTextColor }}>
                    {headline} <span style={{ color: highlightColor }}>{highlightText}</span>
                  </h2>
                  
                  <p className={`${isCover ? 'text-[10px]' : isSquare ? 'text-xs' : 'text-sm'} leading-relaxed max-w-[280px] drop-shadow-md`} style={{ color: subtitleColor }}>
                    {subtitle}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {template === 'quote' && (
          <>
            {backgroundMode === 'media' && <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent"></div>}
            <div className={`relative z-10 flex-1 flex flex-col ${isCover ? 'p-3' : 'p-8'}`}>
              {!isCover && (
                <div className="text-xl font-extrabold tracking-tight mb-8 opacity-90 drop-shadow-md" style={{ color: primaryTextColor }}>
                  <span>UGC</span><span style={{ color: highlightColor }}>4you</span>
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center relative">
                <svg className={`${isCover ? 'w-6 h-6 -top-2 -left-2' : isSquare ? 'w-12 h-12 -top-6 -left-4' : 'w-20 h-20 -top-6 -left-4'} opacity-50 absolute drop-shadow-lg`} fill="currentColor" viewBox="0 0 24 24" style={{ color: highlightColor }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                
                <h2 className={`${isCover ? 'text-base mb-2' : isSquare ? 'text-xl mb-8' : 'text-3xl mb-8'} font-bold leading-snug relative z-10 drop-shadow-xl`} style={{ color: primaryTextColor }}>
                  "{headline} <span style={{ color: highlightColor }}>{highlightText}</span>"
                </h2>
                
                <div className={`flex items-center ${isCover ? 'gap-2 p-1.5' : 'gap-3 p-3'} mt-auto bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-fit shadow-xl`}>
                  <div className={`${isCover ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-lg'} rounded-full flex items-center justify-center text-white font-bold shadow-inner`} style={{ backgroundColor: highlightColor }}>
                    {authorName.charAt(0)}
                  </div>
                  <div>
                    <div className={`${isCover ? 'text-[10px]' : 'text-sm'} font-bold`} style={{ color: primaryTextColor }}>{authorName}</div>
                    <div className={`${isCover ? 'text-[8px]' : 'text-xs'}`} style={{ color: subtitleColor }}>UGC Creator</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {template === 'spotlight' && (
          <>
            {backgroundMode === 'media' && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>}
            <div className={`relative z-10 flex flex-col h-full ${isCover ? 'p-4 justify-center' : 'p-8'}`}>
              {!isCover && (
                <div className="text-xl font-extrabold tracking-tight drop-shadow-md" style={{ color: primaryTextColor }}>
                  <span>UGC</span><span style={{ color: highlightColor }}>4you</span>
                </div>
              )}
              
              <div className={`${isCover ? '' : 'mt-auto'}`}>
                <div className={`inline-block text-white ${isCover ? 'text-[8px] px-2 py-1 mb-1' : 'text-xs px-3 py-1.5 mb-3'} font-bold rounded-full uppercase tracking-wider shadow-lg`} style={{ backgroundColor: highlightColor }}>
                  Creator Spotlight
                </div>
                <h2 className={`${isCover ? 'text-xl' : isSquare ? 'text-3xl' : 'text-5xl'} font-black ${isCover ? 'mb-1' : 'mb-2'} leading-tight drop-shadow-2xl`} style={{ color: primaryTextColor }}>
                  {authorName}
                </h2>
                <p className={`${isCover ? 'text-[10px]' : isSquare ? 'text-sm' : 'text-base'} font-medium drop-shadow-lg max-w-[280px]`} style={{ color: subtitleColor }}>
                  {headline} <span style={{ color: highlightColor }}>{highlightText}</span>
                </p>
              </div>
            </div>
          </>
        )}

        {template === 'banner-pro' && (
          <>
            {backgroundMode === 'media' && <div className="absolute inset-0 bg-gradient-to-l from-[#0f172a]/95 via-[#0f172a]/80 to-transparent"></div>}
            <div className={`relative z-10 flex-1 flex flex-row items-center justify-end ${isCover ? 'p-4' : 'p-8'}`}>
              <div className={`${isCover ? 'w-2/3' : 'w-full'} flex flex-col ${isCover ? 'items-end text-right' : 'items-center text-center'}`}>
                <div className={`inline-block text-white ${isCover ? 'text-[8px] px-2 py-1 mb-2' : 'text-xs px-3 py-1.5 mb-4'} font-bold rounded-full uppercase tracking-wider shadow-lg`} style={{ backgroundColor: highlightColor }}>
                  UGC4you Network
                </div>
                <h2 className={`${isCover ? 'text-lg' : isSquare ? 'text-3xl' : 'text-4xl'} font-black ${isCover ? 'mb-1' : 'mb-3'} leading-tight drop-shadow-2xl`} style={{ color: primaryTextColor }}>
                  {headline} <span style={{ color: highlightColor }}>{highlightText}</span>
                </h2>
                <p className={`${isCover ? 'text-[9px]' : 'text-base'} font-medium drop-shadow-lg max-w-[300px]`} style={{ color: subtitleColor }}>
                  {subtitle}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Controls */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="text-2xl font-extrabold tracking-tight mb-2">
            <span className="text-[#111827]">UGC</span><span className="text-[#40B883]">4you</span>
          </div>
          <p className="text-sm text-gray-500">Instagram Content Generator</p>
        </div>

        <div className="p-6 space-y-8">
          {/* AI Generator Section */}
          <section className="bg-gradient-to-br from-[#40B883]/10 to-[#40B883]/5 p-4 rounded-xl border border-[#40B883]/20">
            <h3 className="text-sm font-bold text-[#111827] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#40B883]" />
              AI Content Generator
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Beschrijf wat je wilt promoten en de AI vult de velden voor je in.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Bijv: Een ad om nieuwe beauty creators te werven..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent resize-none mb-3 bg-white"
              rows={2}
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || isGeneratingVariants || !prompt.trim()}
                className="w-full bg-[#111827] hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Genereren...' : 'Genereer 1 Ad'}
              </button>
              <button
                onClick={handleGenerate10Variants}
                disabled={isGenerating || isGeneratingVariants || !prompt.trim()}
                className="w-full bg-[#40B883] hover:bg-[#35a070] text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingVariants ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutTemplate className="w-4 h-4" />}
                {isGeneratingVariants ? (generationProgress || 'Varianten genereren...') : 'Genereer 10 Varianten'}
              </button>
            </div>
          </section>

          {/* Platform Selection */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#40B883]" />
              Platform
            </h3>
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => { setPlatform('instagram'); setFormat('post-square'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${platform === 'instagram' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </button>
              <button
                onClick={() => { setPlatform('tiktok'); setFormat('story'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${platform === 'tiktok' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Video className="w-4 h-4" />
                TikTok
              </button>
              <button
                onClick={() => { setPlatform('linkedin'); setFormat('linkedin-cover'); }}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${platform === 'linkedin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </button>
            </div>
          </section>

          {/* Format Selection */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-[#40B883]" />
              Formaat & Afmetingen
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {platform === 'instagram' && (
                <>
                  <button
                    onClick={() => setFormat('post-square')}
                    className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${
                      format === 'post-square' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Square className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Post (1:1)</span>
                    <span className="text-xs opacity-70 mt-1">1080 x 1080 px</span>
                  </button>
                  <button
                    onClick={() => setFormat('post-portrait')}
                    className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${
                      format === 'post-portrait' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <RectangleVertical className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Post (4:5)</span>
                    <span className="text-xs opacity-70 mt-1">1080 x 1350 px</span>
                  </button>
                  <button
                    onClick={() => setFormat('story')}
                    className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all col-span-2 ${
                      format === 'story' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Story / Reel</span>
                    <span className="text-xs opacity-70 mt-1">1080 x 1920 px</span>
                  </button>
                </>
              )}
              {platform === 'tiktok' && (
                <button
                  onClick={() => setFormat('story')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all col-span-2 ${
                    format === 'story' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">TikTok Video</span>
                  <span className="text-xs opacity-70 mt-1">1080 x 1920 px</span>
                </button>
              )}
              {platform === 'linkedin' && (
                <button
                  onClick={() => setFormat('linkedin-cover')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all col-span-2 ${
                    format === 'linkedin-cover' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <RectangleVertical className="w-6 h-6 mb-2 rotate-90" />
                  <span className="text-sm font-medium">Cover Photo</span>
                  <span className="text-xs opacity-70 mt-1">1584 x 396 px</span>
                </button>
              )}
            </div>
          </section>

          {/* Template Selection */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-[#40B883]" />
              Template
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cta', label: 'Call to Action' },
                { id: 'stat', label: 'Statistiek' },
                { id: 'quote', label: 'Quote' },
                { id: 'spotlight', label: 'Spotlight' },
                { id: 'banner-pro', label: 'Pro Banner' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as Template)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    template === t.id ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${t.id === 'banner-pro' ? 'col-span-2' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Style & Colors */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#40B883]" />
              Stijl & Kleuren
            </h3>
            
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => {
                  setBackgroundMode('media');
                  setPrimaryTextColor('#ffffff');
                  setSubtitleColor('#e5e7eb');
                }}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${backgroundMode === 'media' ? 'bg-white shadow-sm text-[#40B883]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Film className="w-4 h-4" />
                Media
              </button>
              <button
                onClick={() => {
                  setBackgroundMode('solid');
                  setPrimaryTextColor('#111827');
                  setSubtitleColor('#4b5563');
                }}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${backgroundMode === 'solid' ? 'bg-white shadow-sm text-[#40B883]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Square className="w-4 h-4" />
                Effen
              </button>
            </div>

            {backgroundMode === 'solid' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Achtergrondkleur</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 border-none rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hoofdtekst</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={primaryTextColor}
                    onChange={(e) => setPrimaryTextColor(e.target.value)}
                    className="w-8 h-8 border-none rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryTextColor}
                    onChange={(e) => setPrimaryTextColor(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Highlight</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-8 h-8 border-none rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtitel / Details</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={subtitleColor}
                    onChange={(e) => setSubtitleColor(e.target.value)}
                    className="w-8 h-8 border-none rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={subtitleColor}
                    onChange={(e) => setSubtitleColor(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Content Inputs */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TypeIcon className="w-4 h-4 text-[#40B883]" />
              Inhoud
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Koptekst</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Groene Highlight Tekst</label>
              <input
                type="text"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
              />
            </div>

            {(template === 'cta' || template === 'stat') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ondertitel / Tekst</label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent resize-none"
                />
              </div>
            )}

            {template === 'stat' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Getal</label>
                  <input
                    type="text"
                    value={statNumber}
                    onChange={(e) => setStatNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={statLabel}
                    onChange={(e) => setStatLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {(template === 'quote' || template === 'spotlight') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Naam Creator</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Social Media Caption (Bijschrift)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B883] focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Media (Foto / Video)</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <label className="flex-1 cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2 py-2 rounded-lg text-xs font-medium text-center transition-colors flex items-center justify-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                    </label>
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || isGeneratingVideo}
                      className="flex-1 bg-[#40B883]/10 hover:bg-[#40B883]/20 text-[#40B883] border border-[#40B883]/30 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Foto
                    </button>
                    <button 
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingImage || isGeneratingVideo}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                      AI Video
                    </button>
                    <button 
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Voice
                    </button>
                  </div>
                </div>
                {audioUrl && (
                  <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium text-purple-700">Voice-over</span>
                    </div>
                    <audio ref={audioRef} src={audioUrl} controls className="h-6 w-full max-w-[120px]" />
                  </div>
                )}
                {mediaType === 'video' && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `ugc4you-video.mp4`;
                      link.href = mediaUrl;
                      link.click();
                    }}
                    className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline mt-1"
                  >
                    <Download className="w-3 h-3" />
                    Download originele video (zonder tekst)
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-100 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-[#40B883] hover:bg-[#35a070] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporteren...' : 'Downloaden'}
          </button>
        </div>

        {/* The actual preview container that gets converted to image */}
        <div className="relative group">
          <div className="rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white">
            {renderPreview()}
          </div>
          {audioUrl && (
            <div className="absolute top-4 right-4 z-30 bg-purple-600 text-white p-2 rounded-full shadow-lg animate-bounce-slow">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <p className="mt-6 text-sm text-gray-500 text-center max-w-md">
          Tip: Download de afbeelding voor hoge kwaliteit (1080px breed). <br/>
          {mediaType === 'video' && <span className="text-indigo-600 mt-2 block">Let op: De downloadknop hierboven maakt een statische screenshot van de video. Gebruik de link in het menu om de bewegende video te downloaden.</span>}
        </p>

        {/* Variants Gallery */}
        {variants.length > 0 && (
          <div className="mt-12 w-full max-w-4xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[#40B883]" />
              Gegenereerde Varianten ({variants.length})
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {variants.map((v, i) => (
                <div
                  key={i}
                  onClick={() => loadVariant(v)}
                  className="min-w-[140px] cursor-pointer snap-start flex flex-col gap-2 group"
                >
                  <div className={`w-[140px] h-[180px] relative rounded-xl overflow-hidden border-2 transition-all ${headline === v.headline && subtitle === v.subtitle ? 'border-[#40B883] shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={v.mediaUrl} className={`w-full h-full object-cover transition-opacity ${v.isLoadingImage ? 'opacity-40' : 'opacity-100'}`} alt={`Variant ${i+1}`} />
                    {v.isLoadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#40B883]" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-gray-900 truncate px-1">{v.headline}</div>
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">{v.template}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeadline(v.headline);
                        setSubtitle(v.subtitle);
                        handleGenerateAudio();
                      }}
                      className="p-1 hover:bg-purple-100 rounded text-purple-600 transition-colors"
                      title="Genereer Voice-over voor deze variant"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
