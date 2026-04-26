import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import ImageGenerator from './components/ImageGenerator';
import { callFreeAISingle, getAvailableFreeAIService } from '@/hooks/useFreeAI';
import { generateOfflineResponse } from '@/hooks/useOfflineLLM';
import { getEffectiveSystemPrompt } from '@/hooks/useAISettings';

const tools = [
  { id: 'image-gen', name: 'Image Generator', desc: 'AI 이미지 생성 (Anime/3D/Realistic + img2img + LoRA)', icon: 'ri-image-2-line', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'summarize', name: 'Page Summarizer', desc: 'Summarize any webpage instantly', icon: 'ri-file-reduce-line', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { id: 'translate', name: 'Translator', desc: 'Translate content to any language', icon: 'ri-translate-2', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 'qa', name: 'Q&A Assistant', desc: 'Ask questions about any page', icon: 'ri-question-answer-line', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'rewrite', name: 'Content Rewriter', desc: 'Rewrite content in different styles', icon: 'ri-edit-2-line', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'extract', name: 'Data Extractor', desc: 'Extract structured data from pages', icon: 'ri-database-2-line', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'code', name: 'Code Assistant', desc: 'Analyze and explain code snippets', icon: 'ri-code-s-slash-line', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'sentiment', name: 'Sentiment Analysis', desc: 'Analyze tone and sentiment of text', icon: 'ri-emotion-line', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'keywords', name: 'Keyword Extractor', desc: 'Extract key topics and keywords', icon: 'ri-price-tag-3-line', color: 'text-teal-400', bg: 'bg-teal-400/10' },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>('image-gen');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('Korean');

  const selectedTool = tools.find((t) => t.id === activeTool);

  const handleProcess = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setOutput('');

    const systemPrompt = getEffectiveSystemPrompt();
    const freeServiceId = getAvailableFreeAIService();

    // 툴별 system prompt
    const toolSystemPrompts: Record<string, string> = {
      summarize: `${systemPrompt}\n\n당신은 텍스트 요약 전문가입니다. 핵심 내용을 불릿 포인트로 간결하게 요약하세요.`,
      translate: `${systemPrompt}\n\n당신은 번역 전문가입니다. 요청한 언어로 자연스럽게 번역하세요. 대상 언어: ${targetLang}`,
      qa: `${systemPrompt}\n\n당신은 Q&A 어시스턴트입니다. 제공된 텍스트를 기반으로 질문에 답변하세요.`,
      rewrite: `${systemPrompt}\n\n당신은 콘텐츠 리라이터입니다. 내용을 유지하면서 더 명확하고 전문적으로 재작성하세요.`,
      extract: `${systemPrompt}\n\n당신은 데이터 추출 전문가입니다. 텍스트에서 주제, 개체명, 날짜, URL, 키워드를 JSON으로 추출하세요.`,
      code: `${systemPrompt}\n\n당신은 코드 분석 전문가입니다. 코드의 복잡도, 개선사항, 버그, 베스트 프랙티스를 분석하세요.`,
      sentiment: `${systemPrompt}\n\n당신은 감성 분석 전문가입니다. 텍스트의 전반적 감성(긍정/부정/중립), 톤, 감정을 분석하세요.`,
      keywords: `${systemPrompt}\n\n당신은 키워드 추출 전문가입니다. 텍스트에서 가장 중요한 키워드와 주제를 관련도 순으로 추출하세요.`,
    };

    const toolId = activeTool ?? 'summarize';
    const toolSysPrompt = toolSystemPrompts[toolId] || systemPrompt;

    try {
      if (freeServiceId) {
        // 실제 Free AI API 호출
        const result = await callFreeAISingle(freeServiceId, toolSysPrompt, input);
        setOutput(result);
      } else {
        // 오프라인 LLM fallback
        const localResult = generateOfflineResponse(input, [], {
          modelName: 'Local AI',
          systemPrompt: toolSysPrompt,
        });
        setOutput(localResult);
      }
    } catch (error) {
      setOutput(`❌ 처리 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\nSettings > AI Assistant > Free AI Services에서 API 키를 설정하면 실제 AI를 사용할 수 있습니다.`);
    }

    setIsProcessing(false);
  };

  return (
    <Layout>
      <div className="p-5 max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-puma-text text-xl font-bold">Stealth AI Tools</h2>
          <p className="text-puma-muted text-sm">Powered by local AI - all processing on your device</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tools Grid */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool.id); setOutput(''); setInput(''); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                    activeTool === tool.id
                      ? 'bg-puma-card border-puma-accent puma-glow-sm'
                      : 'bg-puma-surface border-puma-border/30 hover:border-puma-border'
                  }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${tool.bg}`}>
                    <i className={`${tool.icon} ${tool.color} text-lg`}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-puma-text text-sm font-medium leading-tight">{tool.name}</p>
                    <p className="text-puma-muted text-xs leading-tight mt-0.5 hidden lg:block">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tool Interface */}
          <div className="lg:col-span-2">
            {!activeTool ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center bg-puma-surface rounded-xl border border-puma-border/30">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-puma-accent/10 mb-4">
                  <i className="ri-tools-line text-puma-accent text-3xl"></i>
                </div>
                <h3 className="text-puma-text text-base font-semibold mb-2">Select a Tool</h3>
                <p className="text-puma-muted text-sm max-w-xs">Choose an AI tool from the left to get started</p>
              </div>
            ) : activeTool === 'image-gen' ? (
              <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-puma-border/30">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-pink-400/10">
                    <i className="ri-image-2-line text-pink-400 text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-puma-text text-sm font-bold">AI Image Generator</h3>
                    <p className="text-puma-muted text-xs">Prompt + Negative + img2img + LoRA · Anime · 3D · 고해상도</p>
                  </div>
                </div>
                <div className="p-4">
                  <ImageGenerator />
                </div>
              </div>
            ) : (
              <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
                {/* Tool Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-puma-border/30">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${selectedTool?.bg}`}>
                    <i className={`${selectedTool?.icon} ${selectedTool?.color} text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="text-puma-text text-sm font-bold">{selectedTool?.name}</h3>
                    <p className="text-puma-muted text-xs">{selectedTool?.desc}</p>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Extra options for translate */}
                  {activeTool === 'translate' && (
                    <div>
                      <label className="text-puma-muted text-xs mb-1 block">Target Language</label>
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
                      >
                        {['Korean', 'English', 'Japanese', 'Chinese', 'Spanish', 'French', 'German'].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Input */}
                  <div>
                    <label className="text-puma-muted text-xs mb-1 block">Input Text</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Paste text or URL here..."
                      rows={5}
                      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent resize-none"
                    />
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={!input.trim() || isProcessing}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      input.trim() && !isProcessing
                        ? 'bg-puma-accent/20 border border-puma-accent/50 text-puma-accent hover:bg-puma-accent/30'
                        : 'bg-puma-border/20 border border-puma-border/30 text-puma-muted cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin text-base"></i>
                        Processing...
                      </span>
                    ) : (
                      `Run ${selectedTool?.name}`
                    )}
                  </button>

                  {/* Output */}
                  {output && (
                    <div>
                      <label className="text-puma-muted text-xs mb-1 block">Output</label>
                      <div className="bg-puma-bg border border-puma-border/30 rounded-lg p-3">
                        <pre className="text-puma-text text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(output)}
                        className="mt-2 flex items-center gap-1.5 text-puma-muted text-xs hover:text-puma-accent transition-colors cursor-pointer"
                      >
                        <i className="ri-file-copy-line text-sm"></i>
                        Copy output
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}