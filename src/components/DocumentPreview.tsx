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

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ entreprise, document, client, logoDataUrl }, ref) => {
    const primaryColor = entreprise.couleur_primaire || "#1B5E3C";
    const secondaryColor = entreprise.couleur_secondaire || "#F8F6F2";
    const accentColor = entreprise.couleur_accent || "#C9A962";
    const primaryTextColor = getContrastColor(primaryColor);
    const logoSrc = logoDataUrl || entreprise.logo;

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    // Parse content into elegant paragraphs
    const renderContent = (content: string) => {
      const lines = content.split('\n').filter(line => line.trim());
      return lines.map((line, idx) => {
        const cleanLine = line
          .replace(/^[\s•\-\*]+/, '')
          .replace(/\*\*/g, '')
          .replace(/#{1,6}\s*/g, '')
          .trim();
        
        if (!cleanLine) return null;
        
        return (
          <p 
            key={idx} 
            className="mb-4 last:mb-0"
            style={{ textAlign: "justify" }}
          >
            {cleanLine}
          </p>
        );
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-gray-900 relative overflow-hidden"
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        {/* Left Premium Lateral Accent */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-2"
          style={{ 
            background: `linear-gradient(180deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)}, ${primaryColor})` 
          }}
        />
        
        {/* Right Subtle Accent */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1"
          style={{ 
            background: `linear-gradient(180deg, ${accentColor}40, ${accentColor}, ${accentColor}40)` 
          }}
        />

        {/* Top Premium Banner */}
        <div 
          className="h-3 w-full"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})` }}
        />

        <div className="p-10 pl-12 pr-10 relative z-10">
          {/* Premium Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-6">
              {logoSrc && (
                <div 
                  className="w-24 h-24 rounded-2xl shadow-xl overflow-hidden"
                  style={{ 
                    background: `linear-gradient(145deg, white, ${secondaryColor})`,
                    border: `3px solid ${accentColor}`,
                    boxShadow: `0 8px 32px ${primaryColor}20`
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
                  className="text-xs font-medium uppercase tracking-[0.3em] mb-2"
                  style={{ color: accentColor }}
                >
                  Agence Immobilière
                </p>
                <h1 
                  className="text-2xl font-bold tracking-wide"
                  style={{ 
                    color: primaryColor,
                    fontFamily: "'Georgia', serif"
                  }}
                >
                  {entreprise.nom}
                </h1>
                <div 
                  className="w-20 h-0.5 my-3"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                />
                <div className="text-sm" style={{ color: "#5a5a5a" }}>
                  {entreprise.adresse && (
                    <p className="mb-1">{entreprise.adresse}</p>
                  )}
                  <p className="flex items-center gap-3 flex-wrap text-xs">
                    {entreprise.telephone && (
                      <span className="flex items-center gap-1">
                        <span style={{ color: primaryColor }}>✆</span> {entreprise.telephone}
                      </span>
                    )}
                    {entreprise.email && (
                      <span className="flex items-center gap-1">
                        <span style={{ color: primaryColor }}>✉</span> {entreprise.email}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Premium Document Badge */}
            <div className="text-right">
              <div 
                className="inline-block px-8 py-4 rounded-xl shadow-lg relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.2)})`,
                  boxShadow: `0 10px 40px ${primaryColor}40`
                }}
              >
                {/* Decorative corner accent */}
                <div 
                  className="absolute top-0 right-0 w-12 h-12"
                  style={{ 
                    background: `linear-gradient(225deg, ${accentColor}30, transparent)`,
                    borderRadius: "0 0 0 100%"
                  }}
                />
                <h2 
                  className="text-lg font-bold tracking-[0.15em] relative z-10 uppercase"
                  style={{ color: primaryTextColor }}
                >
                  {document.type}
                </h2>
              </div>
              <div className="mt-4 text-right">
                <p className="text-xs" style={{ color: "#666" }}>
                  Émis le {formatDate(document.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Elegant Separator */}
          <div className="flex items-center gap-4 mb-8">
            <div 
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}50, transparent)` }}
            />
            <div 
              className="w-3 h-3 rotate-45"
              style={{ background: accentColor }}
            />
            <div 
              className="h-px flex-1"
              style={{ background: `linear-gradient(270deg, ${primaryColor}, ${accentColor}50, transparent)` }}
            />
          </div>

          {/* Client Info - Premium Card */}
          {client && (
            <div className="mb-8">
              <div 
                className="rounded-xl p-6 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${secondaryColor}, white)`,
                  borderLeft: `4px solid ${primaryColor}`,
                  boxShadow: `0 4px 20px ${primaryColor}10`
                }}
              >
                {/* Decorative accent */}
                <div 
                  className="absolute top-0 right-0 w-24 h-24 opacity-10"
                  style={{ 
                    background: `radial-gradient(circle, ${accentColor}, transparent)`,
                  }}
                />
                <h3 
                  className="text-xs font-bold uppercase tracking-[0.25em] mb-3"
                  style={{ color: primaryColor }}
                >
                  Destinataire
                </h3>
                <p 
                  className="font-bold text-xl mb-2"
                  style={{ 
                    color: primaryColor,
                    fontFamily: "'Georgia', serif"
                  }}
                >
                  {client.nom}
                </p>
                <div 
                  className="w-16 h-0.5 mb-3"
                  style={{ background: accentColor }}
                />
                <div className="text-sm" style={{ color: "#666" }}>
                  {client.telephone && (
                    <p className="mb-1">
                      <span style={{ color: primaryColor }}>✆</span> {client.telephone}
                    </p>
                  )}
                  {client.email && (
                    <p>
                      <span style={{ color: primaryColor }}>✉</span> {client.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Decorative Separator */}
          <div className="flex items-center gap-4 my-8">
            <div 
              className="flex-1 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}40, transparent)` }}
            />
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: primaryColor }}
              />
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: accentColor }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: primaryColor }}
              />
            </div>
            <div 
              className="flex-1 h-px"
              style={{ background: `linear-gradient(270deg, transparent, ${primaryColor}40, transparent)` }}
            />
          </div>

          {/* Document Content - Premium Section */}
          <div className="mb-8">
            <div 
              className="rounded-xl p-8 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(180deg, ${secondaryColor}80, white)`,
                borderLeft: `4px solid ${primaryColor}`,
                boxShadow: `inset 0 0 60px ${secondaryColor}`,
                minHeight: "250px"
              }}
            >
              {/* Decorative corner */}
              <div 
                className="absolute top-0 right-0 w-32 h-32"
                style={{ 
                  background: `radial-gradient(circle at top right, ${accentColor}15, transparent)`,
                }}
              />
              <h3 
                className="text-sm font-bold uppercase tracking-[0.3em] mb-4"
                style={{ color: primaryColor }}
              >
                Contenu du Document
              </h3>
              <div 
                className="w-24 h-0.5 mb-6"
                style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
              />
              <div 
                className="text-base leading-loose relative z-10"
                style={{ 
                  color: "#444",
                  fontFamily: "'Georgia', serif"
                }}
              >
                {document.contenu 
                  ? renderContent(document.contenu)
                  : <p className="text-gray-500 italic">Aucun contenu disponible.</p>
                }
              </div>
            </div>
          </div>

          {/* Premium Footer */}
          <div 
            className="mt-10 pt-8"
            style={{ borderTop: `2px solid ${secondaryColor}` }}
          >
            <div className="flex justify-between items-start gap-8">
              {/* Legal Mentions */}
              <div className="flex-1 max-w-sm">
                <h4 
                  className="font-bold uppercase text-xs tracking-[0.2em] mb-3"
                  style={{ color: primaryColor }}
                >
                  Mentions Légales
                </h4>
                <div 
                  className="w-12 h-0.5 mb-4"
                  style={{ background: accentColor }}
                />
                <div className="text-xs leading-relaxed" style={{ color: "#666" }}>
                  <p className="mb-3">
                    Ce document a été généré électroniquement et fait foi pour les parties concernées.
                  </p>
                  <p 
                    className="italic"
                    style={{ color: primaryColor }}
                  >
                    Nous vous remercions de votre confiance.
                  </p>
                </div>
                <div 
                  className="mt-4 pt-4"
                  style={{ borderTop: `1px solid ${secondaryColor}` }}
                >
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#999" }}>
                    Document généré par intelligence artificielle
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: "#ccc" }}>
                    Page 1/1
                  </p>
                </div>
              </div>
              
              {/* Signature Area */}
              <div className="text-center">
                <p 
                  className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                  style={{ color: primaryColor }}
                >
                  Signature & Cachet
                </p>
                <div 
                  className="w-48 h-20 rounded-xl relative overflow-hidden"
                  style={{ 
                    border: `2px dashed ${lightenColor(primaryColor, 0.3)}`,
                    background: `linear-gradient(135deg, ${secondaryColor}30, white)`
                  }}
                >
                  {/* Decorative corner accents */}
                  <div 
                    className="absolute top-0 left-0 w-4 h-4"
                    style={{ 
                      borderTop: `3px solid ${accentColor}`,
                      borderLeft: `3px solid ${accentColor}`
                    }}
                  />
                  <div 
                    className="absolute bottom-0 right-0 w-4 h-4"
                    style={{ 
                      borderBottom: `3px solid ${accentColor}`,
                      borderRight: `3px solid ${accentColor}`
                    }}
                  />
                  {entreprise.signature && (
                    <img
                      src={entreprise.signature}
                      alt="Signature"
                      className="w-full h-full object-contain p-2"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Premium Banner */}
        <div 
          className="h-3 w-full absolute bottom-0 left-0"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})` }}
        />
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
