import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Rendu Markdown des réponses de l'assistant.
 *
 * Ce module est chargé à la demande (import dynamique depuis ChatMessage) :
 * react-markdown + remark-gfm ne descendent que lorsqu'une réponse de
 * l'assistant doit être affichée, pas au chargement du tableau de bord.
 * Aucun HTML brut : react-markdown échappe le HTML présent dans le texte.
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
  ul: ({ children }) => (
    <ul className="mb-2 last:mb-0 list-disc space-y-1 pl-4 marker:text-primary/70">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 last:mb-0 list-decimal space-y-1 pl-4 marker:text-primary/70">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-3 first:mt-0 mb-1 text-sm font-semibold text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 first:mt-0 mb-1 text-sm font-semibold text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 first:mt-0 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 last:mb-0 w-full overflow-x-auto rounded-lg border border-border/30">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="whitespace-nowrap bg-white/5 px-2 py-1.5 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border/20 px-2 py-1.5 align-top">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-2 last:mb-0 overflow-x-auto rounded-lg border border-border/30 bg-black/50 p-3 text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border/30" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="my-2 max-w-full rounded-lg" />
  ),
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
    {content}
  </ReactMarkdown>
);

export default MarkdownRenderer;
