import React from 'react';

/**
 * Lightweight markdown renderer — replaces react-markdown to avoid Rollup
 * getLiteralValueAtPath issues with complex component maps.
 */

interface Token {
  type: 'code_block' | 'heading' | 'blockquote' | 'ul' | 'ol' | 'hr' | 'paragraph' | 'blank';
  raw: string;
  level?: number;
  lang?: string;
}

function tokenize(md: string): Token[] {
  const lines = md.split('\n');
  const tokens: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'code_block', raw: codeLines.join('\n'), lang });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      tokens.push({ type: 'heading', raw: headingMatch[2], level: headingMatch[1].length });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const bqLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({ type: 'blockquote', raw: bqLines.join('\n') });
      continue;
    }

    // HR
    if (/^[-*_]{3,}$/.test(line.trim())) {
      tokens.push({ type: 'hr', raw: line });
      i++;
      continue;
    }

    // Unordered list
    if (/^[\-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-*+]\s/, ''));
        i++;
      }
      tokens.push({ type: 'ul', raw: items.join('\n') });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      tokens.push({ type: 'ol', raw: items.join('\n') });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      tokens.push({ type: 'blank', raw: '' });
      i++;
      continue;
    }

    // Paragraph — collect until blank or block-level element
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|>\s|[-*+]\s|\d+\.\s|[-*_]{3,}$)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: 'paragraph', raw: paraLines.join(' ') });
    }
  }

  return tokens.filter(t => t.type !== 'blank');
}

function renderInline(text: string): React.ReactNode[] {
  // Process inline: bold, italic, inline code, links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);
    // Bold **text**
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)/s);
    // Italic *text*
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)/s);
    // Link [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/s);

    // Find earliest match
    const matches = [
      codeMatch ? { idx: (codeMatch[1] || '').length, type: 'code', m: codeMatch } : null,
      boldMatch ? { idx: (boldMatch[1] || '').length, type: 'bold', m: boldMatch } : null,
      italicMatch ? { idx: (italicMatch[1] || '').length, type: 'italic', m: italicMatch } : null,
      linkMatch ? { idx: (linkMatch[1] || '').length, type: 'link', m: linkMatch } : null,
    ].filter(Boolean) as Array<{ idx: number; type: string; m: RegExpMatchArray }>;

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    matches.sort((a, b) => a.idx - b.idx);
    const best = matches[0];
    const before = best.m[1];

    if (before) parts.push(<span key={key++}>{before}</span>);

    if (best.type === 'code') {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-[rgba(0,212,170,0.12)] text-[#00d4aa] text-xs terminal-text">
          {best.m[2]}
        </code>
      );
      remaining = best.m[3];
    } else if (best.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-gray-100">{best.m[2]}</strong>);
      remaining = best.m[3];
    } else if (best.type === 'italic') {
      parts.push(<em key={key++} className="italic text-gray-300">{best.m[2]}</em>);
      remaining = best.m[3];
    } else if (best.type === 'link') {
      parts.push(
        <a key={key++} href={best.m[3]} target="_blank" rel="noopener noreferrer"
          className="text-[#00d4aa] hover:underline">
          {best.m[2]}
        </a>
      );
      remaining = best.m[4];
    }
  }

  return parts;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const tokens = tokenize(content);

  return (
    <div className="space-y-1.5">
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'code_block':
            return (
              <div key={idx} className="my-2 rounded-lg overflow-hidden">
                {token.lang && (
                  <div className="px-3 py-1 bg-[rgba(0,212,170,0.08)] border-b border-[rgba(0,212,170,0.15)] text-[10px] text-[#00d4aa] terminal-text">
                    {token.lang}
                  </div>
                )}
                <pre className="p-3 bg-[rgba(0,0,0,0.4)] text-[#00d4aa] text-xs terminal-text overflow-x-auto whitespace-pre leading-relaxed">
                  <code>{token.raw}</code>
                </pre>
              </div>
            );

          case 'heading': {
            const level = token.level ?? 1;
            const cls =
              level === 1 ? 'text-base font-bold text-[#00d4aa] mt-1' :
              level === 2 ? 'text-sm font-semibold text-[#00d4aa]' :
              'text-sm font-medium text-gray-300';
            return <p key={idx} className={cls}>{renderInline(token.raw)}</p>;
          }

          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-2 border-[rgba(0,212,170,0.4)] pl-3 italic text-gray-400">
                {token.raw.split('\n').map((line, li) => (
                  <p key={li}>{renderInline(line)}</p>
                ))}
              </blockquote>
            );

          case 'ul':
            return (
              <ul key={idx} className="list-disc list-inside space-y-0.5 pl-1">
                {token.raw.split('\n').map((item, li) => (
                  <li key={li} className="text-gray-300 text-sm">{renderInline(item)}</li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="list-decimal list-inside space-y-0.5 pl-1">
                {token.raw.split('\n').map((item, li) => (
                  <li key={li} className="text-gray-300 text-sm">{renderInline(item)}</li>
                ))}
              </ol>
            );

          case 'hr':
            return <hr key={idx} className="border-[rgba(255,255,255,0.08)] my-2" />;

          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-sm text-gray-200 leading-relaxed">
                {renderInline(token.raw)}
              </p>
            );
        }
      })}
    </div>
  );
}
