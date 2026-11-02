import React from 'react';
import { marked, Token, Tokens } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
  compact?: boolean;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  className = '',
  compact = false,
}) => {
  if (!content) return null;

  let tokens: Token[] = [];
  try {
    tokens = marked.lexer(content);
  } catch (err) {
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
  }

  const renderInlineTokens = (inlineTokens?: Token[]): React.ReactNode => {
    if (!inlineTokens || inlineTokens.length === 0) return null;

    return inlineTokens.map((t, idx) => {
      switch (t.type) {
        case 'strong':
          return (
            <strong key={idx} className="font-semibold text-zinc-900">
              {renderInlineTokens((t as Tokens.Strong).tokens)}
            </strong>
          );
        case 'em':
          return (
            <em key={idx} className="italic text-zinc-800">
              {renderInlineTokens((t as Tokens.Em).tokens)}
            </em>
          );
        case 'codespan':
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 text-zinc-800 font-mono text-[11px] border border-zinc-200/80"
            >
              {(t as Tokens.Codespan).text}
            </code>
          );
        case 'link': {
          const link = t as Tokens.Link;
          return (
            <a
              key={idx}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0071e3] hover:underline font-medium"
            >
              {renderInlineTokens(link.tokens)}
            </a>
          );
        }
        case 'del':
          return (
            <del key={idx} className="line-through text-zinc-400">
              {renderInlineTokens((t as Tokens.Del).tokens)}
            </del>
          );
        case 'br':
          return <br key={idx} />;
        case 'text':
        default: {
          const anyToken = t as any;
          if (anyToken.tokens && anyToken.tokens.length > 0) {
            return (
              <React.Fragment key={idx}>
                {renderInlineTokens(anyToken.tokens)}
              </React.Fragment>
            );
          }
          return <React.Fragment key={idx}>{anyToken.text || ''}</React.Fragment>;
        }
      }
    });
  };

  const renderListItem = (item: Tokens.ListItem, itemIdx: number): React.ReactNode => {
    // An item may have inline text tokens and nested block tokens (e.g. sub-lists)
    const inlinePart: Token[] = [];
    const blockPart: Token[] = [];

    (item.tokens || []).forEach(tok => {
      if (tok.type === 'list') {
        blockPart.push(tok);
      } else if (tok.type === 'text') {
        inlinePart.push(tok);
      } else {
        inlinePart.push(tok);
      }
    });

    return (
      <li key={itemIdx} className="leading-relaxed pl-1">
        {inlinePart.length > 0 ? renderInlineTokens(inlinePart) : item.text}
        {blockPart.map((subToken, subIdx) => renderToken(subToken, subIdx))}
      </li>
    );
  };

  const renderToken = (token: Token, index: number): React.ReactNode => {
    switch (token.type) {
      case 'heading': {
        const heading = token as Tokens.Heading;
        const textContent = renderInlineTokens(heading.tokens) || heading.text;
        if (heading.depth === 1) {
          return (
            <h1
              key={index}
              className={`${
                compact ? 'text-sm font-bold' : 'text-base sm:text-lg font-bold'
              } text-zinc-900 font-heading tracking-tight mt-3 mb-1.5 first:mt-0`}
            >
              {textContent}
            </h1>
          );
        }
        if (heading.depth === 2) {
          return (
            <h2
              key={index}
              className={`${
                compact ? 'text-xs font-bold' : 'text-sm sm:text-base font-bold'
              } text-zinc-900 font-heading tracking-tight mt-2.5 mb-1.5 first:mt-0`}
            >
              {textContent}
            </h2>
          );
        }
        return (
          <h3
            key={index}
            className={`${
              compact ? 'text-xs font-semibold' : 'text-xs sm:text-sm font-semibold'
            } text-zinc-900 font-heading mt-2 mb-1 first:mt-0`}
          >
            {textContent}
          </h3>
        );
      }

      case 'paragraph': {
        const para = token as Tokens.Paragraph;
        return (
          <p
            key={index}
            className={`${
              compact ? 'text-xs leading-normal mb-1.5' : 'text-xs sm:text-[13px] leading-relaxed mb-2'
            } text-zinc-800 last:mb-0 font-sans`}
          >
            {renderInlineTokens(para.tokens) || para.text}
          </p>
        );
      }

      case 'list': {
        const list = token as Tokens.List;
        if (list.ordered) {
          return (
            <ol
              key={index}
              start={list.start || 1}
              className={`space-y-1 my-2 pl-4 list-decimal ${
                compact ? 'text-xs' : 'text-xs sm:text-[13px]'
              } text-zinc-800`}
            >
              {list.items.map((item, itemIdx) => renderListItem(item, itemIdx))}
            </ol>
          );
        }
        return (
          <ul
            key={index}
            className={`space-y-1 my-2 pl-4 list-disc ${
              compact ? 'text-xs' : 'text-xs sm:text-[13px]'
            } text-zinc-800`}
          >
            {list.items.map((item, itemIdx) => renderListItem(item, itemIdx))}
          </ul>
        );
      }

      case 'table': {
        const table = token as Tokens.Table;
        return (
          <div key={index} className="overflow-x-auto my-3 border border-zinc-200 rounded-xl">
            <table className="min-w-full divide-y divide-zinc-200 text-xs">
              <thead className="bg-zinc-50">
                <tr>
                  {table.header.map((th, thIdx) => (
                    <th
                      key={thIdx}
                      className="px-3 py-2 text-left font-semibold text-zinc-900 border-r border-zinc-100 last:border-r-0"
                    >
                      {renderInlineTokens(th.tokens) || th.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50/50">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-2 text-zinc-700 border-r border-zinc-100 last:border-r-0"
                      >
                        {renderInlineTokens(cell.tokens) || cell.text}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'code': {
        const code = token as Tokens.Code;
        return (
          <pre
            key={index}
            className="p-3 my-2 bg-zinc-900 text-zinc-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800"
          >
            <code>{code.text}</code>
          </pre>
        );
      }

      case 'blockquote': {
        const quote = token as Tokens.Blockquote;
        return (
          <blockquote
            key={index}
            className="border-l-2 border-zinc-300 pl-3 my-2 italic text-zinc-600 text-xs sm:text-[13px]"
          >
            {quote.tokens
              ? quote.tokens.map((t, idx) => renderToken(t, idx))
              : quote.text}
          </blockquote>
        );
      }

      case 'hr':
        return <hr key={index} className="my-3 border-t border-zinc-200" />;

      case 'space':
        return null;

      default:
        return (
          <p
            key={index}
            className="text-xs sm:text-[13px] leading-relaxed text-zinc-800 mb-2 last:mb-0"
          >
            {(token as any).text || ''}
          </p>
        );
    }
  };

  return (
    <div className={`space-y-1 text-zinc-800 ${className}`}>
      {tokens.map((token, idx) => renderToken(token, idx))}
    </div>
  );
};
