import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, LayoutTemplate, Type as TypeIcon, Smartphone, Square, RefreshCw, Upload, Sparkles, Loader2, Instagram, Video, RectangleVertical, Share2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

type Platform = 'instagram' | 'tiktok';
type Format = 'post-square' | 'post-portrait' | 'story';
type Template = 'cta' | 'stat' | 'quote' | 'spotlight';

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
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80');

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Genereer Instagram ad content voor UGC4you (een platform dat merken en UGC creators verbindt). 
        De gebruiker wil een ad over: "${prompt}".
        Schrijf in het Nederlands. Kort en krachtig.
        Kies ook een passende template ('cta', 'stat', 'quote', of 'spotlight').`,
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
              suggestedTemplate: { type: Type.STRING, description: "Kies uit: cta, stat, quote, spotlight" }
            },
            required: ["headline", "highlightText", "subtitle", "statNumber", "statLabel", "authorName", "suggestedTemplate"]
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
        if (['cta', 'stat', 'quote', 'spotlight'].includes(data.suggestedTemplate)) {
          setTemplate(data.suggestedTemplate as Template);
        }
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Er ging iets mis bij het genereren van de content.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const imagePrompt = `A professional Instagram UGC (User Generated Content) photo. High quality, aesthetic, authentic lifestyle photography. Context: ${prompt || headline || 'A content creator'}. No text or words in the image.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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
            setImageUrl(newImageUrl);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Er ging iets mis bij het genereren van de afbeelding.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (previewRef.current === null) return;
    
    try {
      setIsExporting(true);
      
      const dataUrl = await toPng(previewRef.current, { 
        cacheBust: true,
        pixelRatio: 1080 / 400, // Exact 1080px width export
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPreview = () => {
    const isSquare = format === 'post-square';
    const isPortrait = format === 'post-portrait';
    const isStory = format === 'story';
    
    const width = 400;
    const height = isSquare ? 400 : isPortrait ? 500 : 711; // 1:1, 4:5, 9:16

    return (
      <div 
        ref={previewRef}
        className="bg-white relative overflow-hidden flex flex-col shadow-sm"
        style={{ width, height, fontFamily: "'Inter', sans-serif" }}
      >
        {template === 'cta' && (
          <div className="flex-1 flex flex-col items-center text-center px-8 pt-10 pb-0">
            <div className="text-2xl font-extrabold tracking-tight mb-6">
              <span className="text-[#111827]">UGC</span><span className="text-[#40B883]">4you</span>
            </div>
            
            <h1 className={`${isSquare ? 'text-3xl' : 'text-4xl mt-10'} font-extrabold leading-tight tracking-tight text-[#111827] mb-4`}>
              {headline} <br />
              <span className="text-[#40B883] block">{highlightText}</span>
            </h1>
            
            <p className={`${isSquare ? 'text-sm' : 'text-base'} text-[#6B7280] leading-relaxed mb-6 max-w-[280px]`}>
              {subtitle}
            </p>
            
            <div className="bg-[#40B883] text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Registreer gratis
            </div>
            
            <div className={`mt-auto w-full max-w-[280px] ${isSquare ? 'h-[120px]' : isPortrait ? 'h-[180px]' : 'h-[250px]'} bg-gray-200 rounded-t-3xl overflow-hidden relative`}>
              <img src={imageUrl} alt="Creator" className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
          </div>
        )}

        {template === 'stat' && (
          <div className="flex-1 flex flex-col p-8">
            <div className="text-2xl font-extrabold tracking-tight mb-8">
              <span className="text-[#111827]">UGC</span><span className="text-[#40B883]">4you</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8">
                <span className={`${isSquare ? 'text-6xl' : 'text-8xl'} font-bold text-[#40B883] tracking-tight block mb-2`}>{statNumber}</span>
                <span className="text-lg font-semibold text-[#6B7280] uppercase tracking-wider">{statLabel}</span>
              </div>
              
              <h2 className={`${isSquare ? 'text-2xl' : 'text-4xl'} font-extrabold leading-tight text-[#111827] mb-4`}>
                {headline} <span className="text-[#40B883]">{highlightText}</span>
              </h2>
              
              <p className={`${isSquare ? 'text-sm' : 'text-lg'} text-[#6B7280] leading-relaxed`}>
                {subtitle}
              </p>
            </div>
            
            {!isSquare && (
              <div className={`mt-auto w-full ${isPortrait ? 'h-[150px]' : 'h-[200px]'} rounded-2xl overflow-hidden`}>
                <img src={imageUrl} alt="Creator" className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        )}

        {template === 'quote' && (
          <div className="flex-1 flex flex-col p-8 bg-[#111827] text-white">
            <div className="text-2xl font-extrabold tracking-tight mb-8">
              <span className="text-white">UGC</span><span className="text-[#40B883]">4you</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center relative">
              <svg className={`${isSquare ? 'w-16 h-16' : 'w-24 h-24'} text-[#40B883] opacity-20 absolute -top-4 -left-2`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              
              <h2 className={`${isSquare ? 'text-2xl' : 'text-4xl'} font-bold leading-snug mb-8 relative z-10`}>
                "{headline} <span className="text-[#40B883]">{highlightText}</span>"
              </h2>
              
              <div className="flex items-center gap-4 mt-auto">
                <img src={imageUrl} alt={authorName} className={`${isSquare ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover border-2 border-[#40B883]`} crossOrigin="anonymous" />
                <div>
                  <div className={`${isSquare ? 'text-sm' : 'text-lg'} font-bold`}>{authorName}</div>
                  <div className={`${isSquare ? 'text-xs' : 'text-sm'} text-gray-400`}>UGC Creator</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {template === 'spotlight' && (
          <div className="flex-1 relative flex flex-col">
            <img src={imageUrl} alt="Creator" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            
            <div className="relative z-10 p-8 flex flex-col h-full">
              <div className="text-2xl font-extrabold tracking-tight drop-shadow-md">
                <span className="text-white">UGC</span><span className="text-[#40B883]">4you</span>
              </div>
              
              <div className="mt-auto">
                <div className={`inline-block bg-[#40B883] text-white ${isSquare ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'} font-bold rounded-full mb-4 uppercase tracking-wider`}>
                  Creator Spotlight
                </div>
                <h2 className={`${isSquare ? 'text-4xl' : 'text-6xl'} font-extrabold text-white mb-3 leading-tight drop-shadow-lg`}>
                  {authorName}
                </h2>
                <p className={`${isSquare ? 'text-sm' : 'text-lg'} text-gray-200 font-medium drop-shadow-md max-w-[300px]`}>
                  {headline} <span className="text-[#40B883]">{highlightText}</span>
                </p>
              </div>
            </div>
          </div>
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
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-[#111827] hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Genereren...' : 'Genereer met AI'}
            </button>
          </section>

          {/* Platform Selection */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#40B883]" />
              Platform
            </h3>
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => { setPlatform('instagram'); }}
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
                </>
              )}
              <button
                onClick={() => setFormat('story')}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${
                  format === 'story' ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                } ${platform === 'tiktok' ? 'col-span-2' : ''}`}
              >
                <Smartphone className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{platform === 'tiktok' ? 'TikTok Video' : 'Story / Reel'}</span>
                <span className="text-xs opacity-70 mt-1">1080 x 1920 px</span>
              </button>
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
                { id: 'spotlight', label: 'Spotlight' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as Template)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    template === t.id ? 'border-[#40B883] bg-[#40B883]/5 text-[#40B883]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Afbeelding</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <label className="flex-1 cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="flex-1 bg-[#40B883]/10 hover:bg-[#40B883]/20 text-[#40B883] border border-[#40B883]/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      AI Foto
                    </button>
                  </div>
                </div>
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
        <div className="rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white">
          {renderPreview()}
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          Tip: Download de afbeelding voor hoge kwaliteit (1080px breed).
        </p>
      </div>
    </div>
  );
}
