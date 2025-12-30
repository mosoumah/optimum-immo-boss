import { forwardRef } from "react";

interface DocumentPreviewProps {
  entreprise: {
    nom: string;
    logo?: string | null;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    signature?: string | null;
    couleur_primaire?: string | null;
    couleur_secondaire?: string | null;
    couleur_accent?: string | null;
  };
  document: {
    type: string;
    contenu: string | null;
    date: string;
  };
  client?: {
    nom: string;
    email?: string | null;
    telephone?: string | null;
  } | null;
  logoDataUrl?: string | null;
}

const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
};

const lightenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent));
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent));
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent));
  return `rgb(${r}, ${g}, ${b})`;
};

const darkenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent));
  return `rgb(${r}, ${g}, ${b})`;
};

// Parse and render markdown-like content into structured elements
const renderFormattedContent = (content: string, primaryColor: string, accentColor: string) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-2 mb-4 ml-4">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span 
                className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                style={{ background: primaryColor }}
              />
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      flushList();
      return;
    }

    // Headers with ## or **Title**
    if (trimmedLine.startsWith('## ')) {
      flushList();
      const headerText = trimmedLine.replace(/^##\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <h2 
          key={index} 
          className="text-lg font-bold mt-6 mb-3 pb-2 border-b-2"
          style={{ color: accentColor, borderColor: lightenColor(primaryColor, 0.4) }}
        >
          {headerText}
        </h2>
      );
      return;
    }

    // Section titles with ** at start and end
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.includes(':')) {
      flushList();
      const titleText = trimmedLine.replace(/\*\*/g, '');
      elements.push(
        <h3 
          key={index} 
          className="text-base font-semibold mt-5 mb-2 uppercase tracking-wide"
          style={{ color: primaryColor }}
        >
          {titleText}
        </h3>
      );
      return;
    }

    // List items (starting with *, -, or •)
    if (/^[\*\-•]\s/.test(trimmedLine)) {
      let itemText = trimmedLine.replace(/^[\*\-•]\s*/, '');
      // Parse inline bold
      itemText = itemText.replace(/\*\*([^*]+)\*\*/g, '$1');
      currentListItems.push(itemText);
      return;
    }

    // Regular paragraphs with inline formatting
    flushList();
    let processedText = trimmedLine;
    
    // Handle field patterns like **Label:** Value
    if (/\*\*[^*]+:\*\*/.test(processedText)) {
      const parts = processedText.split(/(\*\*[^*]+:\*\*)/);
      elements.push(
        <p key={index} className="text-gray-700 mb-2 leading-relaxed">
          {parts.map((part, i) => {
            if (/^\*\*[^*]+:\*\*$/.test(part)) {
              const labelText = part.replace(/\*\*/g, '');
              return (
                <span key={i} className="font-semibold" style={{ color: accentColor }}>
                  {labelText}{' '}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
      return;
    }

    // Simple paragraph
    processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '$1');
    elements.push(
      <p key={index} className="text-gray-700 mb-3 leading-relaxed">
        {processedText}
      </p>
    );
  });

  flushList();
  return elements;
};

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ entreprise, document, client, logoDataUrl }, ref) => {
    const primaryColor = entreprise.couleur_primaire || "#E97451";
    const secondaryColor = entreprise.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise.couleur_accent || "#1a1a2e";
    const primaryTextColor = getContrastColor(primaryColor);
    const accentTextColor = getContrastColor(accentColor);
    const logoSrc = logoDataUrl || entreprise.logo;

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-gray-900 relative overflow-hidden"
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {/* Left Lateral Accent Line */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ 
            background: `linear-gradient(180deg, ${primaryColor}, ${darkenColor(primaryColor, 0.2)}, ${primaryColor})` 
          }}
        />
        
        {/* Right Subtle Lateral Line */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-px opacity-30"
          style={{ background: primaryColor }}
        />

        {/* Top Banner */}
        <div 
          className="h-2 w-full"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${darkenColor(primaryColor, 0.1)})` }}
        />

        <div className="p-8 pl-10 relative z-10">
          {/* Header with Logo */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-5">
              {logoSrc && (
                <div 
                  className="w-20 h-20 rounded-xl shadow-lg overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryColor}, white)`,
                    border: `2px solid ${lightenColor(primaryColor, 0.3)}`
                  }}
                >
                  <img
                    src={logoSrc}
                    alt="Logo entreprise"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <div>
                <p 
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1"
                  style={{ color: primaryColor }}
                >
                  Agence Immobilière
                </p>
                <h1 
                  className="text-xl font-bold tracking-tight"
                  style={{ color: accentColor }}
                >
                  {entreprise.nom}
                </h1>
                <div className="mt-2 text-sm text-gray-500">
                  <p className="flex items-center gap-2 flex-wrap">
                    {entreprise.adresse && (
                      <span>{entreprise.adresse}</span>
                    )}
                    {entreprise.adresse && (entreprise.telephone || entreprise.email) && (
                      <span style={{ color: primaryColor }}>•</span>
                    )}
                    {entreprise.telephone && (
                      <span>{entreprise.telephone}</span>
                    )}
                    {entreprise.telephone && entreprise.email && (
                      <span style={{ color: primaryColor }}>•</span>
                    )}
                    {entreprise.email && (
                      <span className="lowercase">{entreprise.email}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Document Badge */}
            <div className="text-right">
              <div 
                className="inline-block px-5 py-2 rounded-lg shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)})`,
                  color: primaryTextColor
                }}
              >
                <h2 className="text-base font-bold tracking-[0.1em] uppercase">{document.type}</h2>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p className="mt-1">
                  Émis le {formatDate(document.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Gradient Line */}
          <div 
            className="h-px mb-6"
            style={{ 
              background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}40, transparent)` 
            }}
          />

          {/* Client Info Card */}
          {client && (
            <div className="mb-6">
              <div 
                className="rounded-lg p-4 shadow-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${secondaryColor}30, white)`,
                  borderLeft: `3px solid ${primaryColor}`
                }}
              >
                <h3 
                  className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ color: primaryColor }}
                >
                  Destinataire
                </h3>
                <p className="font-semibold text-base" style={{ color: accentColor }}>
                  {client.nom}
                </p>
                {/* Elegant separator line */}
                <div 
                  className="w-12 h-px my-2"
                  style={{ background: primaryColor }}
                />
                <div className="text-sm text-gray-500">
                  {client.telephone && (
                    <span>{client.telephone}</span>
                  )}
                  {client.telephone && client.email && (
                    <span style={{ color: primaryColor }}> • </span>
                  )}
                  {client.email && (
                    <span className="lowercase">{client.email}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Decorative Separator */}
          <div className="flex items-center gap-3 mb-5">
            <div 
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
            />
          </div>

          {/* Document Content */}
          <div className="mb-6">
            <div 
              className="rounded-lg p-5"
              style={{ 
                background: `linear-gradient(135deg, ${secondaryColor}40, white)`,
                borderLeft: `3px solid ${primaryColor}`,
                minHeight: "200px"
              }}
            >
              <h3 
                className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: primaryColor }}
              >
                Contenu du Document
              </h3>
              {/* Thin separator under title */}
              <div 
                className="w-16 h-px mb-4"
                style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
              />
              <div className="text-sm leading-relaxed">
                {document.contenu 
                  ? renderFormattedContent(document.contenu, primaryColor, accentColor)
                  : <p className="text-gray-500 italic">Aucun contenu disponible.</p>
                }
              </div>
            </div>
          </div>

          {/* Footer Separator */}
          <div 
            className="h-px mt-8 mb-5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}30, transparent)` }}
          />

          {/* Footer */}
          <div>
            {/* Signature Area */}
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-500 max-w-xs">
                <p 
                  className="font-semibold uppercase text-[11px] tracking-[0.15em]"
                  style={{ color: accentColor }}
                >
                  Mentions Légales
                </p>
                {/* Thin accent line */}
                <div 
                  className="w-10 h-px my-2"
                  style={{ background: primaryColor }}
                />
                <p className="text-gray-600 leading-relaxed text-xs">
                  Ce document a été généré électroniquement et fait foi pour les parties concernées.
                </p>
                <p className="mt-2 text-xs italic" style={{ color: primaryColor }}>
                  Nous vous remercions de votre confiance.
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                    Document généré par intelligence artificielle
                  </p>
                  <p className="text-[9px] text-gray-300 mt-1">
                    Page 1/1
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p 
                  className="text-[9px] text-gray-500 mb-2 uppercase tracking-[0.15em] font-medium"
                  style={{ color: accentColor }}
                >
                  Signature & Cachet
                </p>
                <div 
                  className="w-44 h-16 rounded-lg relative overflow-hidden"
                  style={{ 
                    border: `1px dashed ${lightenColor(primaryColor, 0.2)}`,
                    background: `${secondaryColor}15`
                  }}
                >
                  {/* Decorative corner accents */}
                  <div 
                    className="absolute top-0 left-0 w-2.5 h-2.5"
                    style={{ 
                      borderTop: `2px solid ${primaryColor}`,
                      borderLeft: `2px solid ${primaryColor}`
                    }}
                  />
                  <div 
                    className="absolute bottom-0 right-0 w-2.5 h-2.5"
                    style={{ 
                      borderBottom: `2px solid ${primaryColor}`,
                      borderRight: `2px solid ${primaryColor}`
                    }}
                  />
                  {entreprise.signature && (
                    <img
                      src={entreprise.signature}
                      alt="Signature"
                      className="w-full h-full object-contain p-1"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div 
          className="h-2 w-full absolute bottom-0 left-0"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${darkenColor(primaryColor, 0.1)})` }}
        />
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
