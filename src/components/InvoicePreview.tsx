import { forwardRef } from "react";

interface InvoicePreviewProps {
  entreprise: {
    nom: string;
    logo: string | null;
    signature?: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    couleur_primaire?: string | null;
    couleur_secondaire?: string | null;
    couleur_accent?: string | null;
  } | null;
  facture: {
    id: string;
    description: string | null;
    montant: number;
    date: string;
    clients: { nom: string; telephone: string | null; email: string | null } | null;
  } | null;
  aiContent: string;
  logoDataUrl?: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
};

// Calculate contrast color (white or black) based on background luminosity
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
};

// Lighten a hex color
const _lightenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent));
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent));
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent));
  return `rgb(${r}, ${g}, ${b})`;
};

// Darken a hex color
const darkenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent));
  return `rgb(${r}, ${g}, ${b})`;
};

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ entreprise, facture, aiContent, logoDataUrl }, ref) => {
    if (!facture || !entreprise) return null;

    const logoSrc = logoDataUrl || entreprise.logo;
    
    // Dynamic colors from brand or defaults
    const primaryColor = entreprise.couleur_primaire || "#1B5E3C";
    const secondaryColor = entreprise.couleur_secondaire || "#F8F6F2";
    const accentColor = entreprise.couleur_accent || "#C9A962";
    
    // Calculated contrast colors
    const primaryTextColor = getContrastColor(primaryColor);
    const accentTextColor = getContrastColor(accentColor);

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("fr-FR", { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black relative overflow-hidden mx-auto w-full"
        style={{ 
          maxWidth: "210mm",
          fontFamily: "'Georgia', 'Times New Roman', serif"
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
            
            {/* Premium Invoice Badge */}
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
                  className="text-2xl font-bold tracking-[0.25em] relative z-10"
                  style={{ color: primaryTextColor }}
                >
                  FACTURE
                </h2>
              </div>
              <div className="mt-4 text-right">
                <p 
                  className="font-bold text-sm tracking-wide"
                  style={{ color: primaryColor }}
                >
                  N° FAC-{facture.id.substring(0, 8).toUpperCase()}
                </p>
                <p className="text-xs mt-2" style={{ color: "#666" }}>
                  Émise le {formatDate(facture.date)}
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
                {facture.clients?.nom || "Client"}
              </p>
              <div 
                className="w-16 h-0.5 mb-3"
                style={{ background: accentColor }}
              />
              <div className="text-sm" style={{ color: "#666" }}>
                {facture.clients?.telephone && (
                  <p className="mb-1">
                    <span style={{ color: primaryColor }}>✆</span> {facture.clients.telephone}
                  </p>
                )}
                {facture.clients?.email && (
                  <p>
                    <span style={{ color: primaryColor }}>✉</span> {facture.clients.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Premium Services Table */}
          <div className="mb-8">
            <div 
              className="rounded-xl overflow-hidden shadow-lg"
              style={{ 
                border: `1px solid ${primaryColor}20`,
                boxShadow: `0 8px 32px ${primaryColor}10`
              }}
            >
              <table className="w-full">
                <thead>
                  <tr 
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)})` 
                    }}
                  >
                    <th 
                      className="text-left p-5 font-bold text-sm uppercase tracking-[0.2em]"
                      style={{ color: primaryTextColor }}
                    >
                      Désignation du Service
                    </th>
                    <th 
                      className="text-right p-5 font-bold text-sm uppercase tracking-[0.2em] w-44"
                      style={{ color: primaryTextColor }}
                    >
                      Montant HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: `${secondaryColor}50` }}>
                    <td className="p-5">
                      <p 
                        className="text-base font-medium mb-1"
                        style={{ color: "#333" }}
                      >
                        {facture.description || "Prestation de conseil immobilier"}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>
                        Prestation réalisée conformément aux termes convenus
                      </p>
                    </td>
                    <td 
                      className="p-5 text-right font-bold text-lg"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(facture.montant)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Premium Total Section */}
              <div 
                className="p-6 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}, ${darkenColor(accentColor, 0.1)})` 
                }}
              >
                {/* Decorative pattern */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${primaryColor} 10px, ${primaryColor} 11px)`
                  }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <span 
                      className="font-bold text-sm uppercase tracking-[0.2em] block"
                      style={{ color: accentTextColor }}
                    >
                      Montant Total à Régler
                    </span>
                    <span 
                      className="text-xs mt-2 block opacity-80"
                      style={{ color: accentTextColor }}
                    >
                      Net à payer — Arrêté à la somme indiquée ci-contre
                    </span>
                  </div>
                  <span 
                    className="text-3xl font-bold"
                    style={{ 
                      color: accentTextColor,
                      textShadow: `0 2px 4px ${darkenColor(accentColor, 0.3)}40`
                    }}
                  >
                    {formatCurrency(facture.montant)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Generated Content - Premium Section */}
          {aiContent && (
            <>
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
              
              <div className="mb-8">
                <div 
                  className="rounded-xl p-8 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(180deg, ${secondaryColor}80, white)`,
                    borderLeft: `4px solid ${primaryColor}`,
                    boxShadow: `inset 0 0 60px ${secondaryColor}`
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
                    Détail de la Prestation
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
                    {aiContent.split('\n').map((line, idx) => {
                      const cleanLine = line.replace(/^[\s•\-*]+/, '').trim();
                      if (!cleanLine) return <div key={idx} className="h-4" />;
                      return (
                        <p 
                          key={idx} 
                          className="mb-4 last:mb-0"
                          style={{ textAlign: "justify" }}
                        >
                          {cleanLine}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Premium Footer */}
          <div 
            className="mt-10 pt-8"
            style={{ borderTop: `2px solid ${secondaryColor}` }}
          >
            <div className="flex justify-between items-start gap-8">
              {/* Payment Terms */}
              <div className="flex-1">
                <h4 
                  className="font-bold uppercase text-sm tracking-[0.2em] mb-4"
                  style={{ color: primaryColor }}
                >
                  Modalités de Règlement
                </h4>
                <div 
                  className="w-16 h-0.5 mb-4"
                  style={{ background: accentColor }}
                />
                <div 
                  className="text-sm leading-relaxed"
                  style={{ color: "#555" }}
                >
                  <p className="mb-3">
                    Le règlement est attendu sous <strong style={{ color: primaryColor }}>trente (30) jours</strong> à 
                    compter de la date d'émission de la présente facture.
                  </p>
                  <p 
                    className="italic text-sm"
                    style={{ color: accentColor }}
                  >
                    Nous vous remercions pour votre confiance et restons à votre entière disposition 
                    pour tout renseignement complémentaire.
                  </p>
                </div>
                
                {/* Legal Mention */}
                <div 
                  className="mt-6 pt-4"
                  style={{ borderTop: `1px dashed ${primaryColor}30` }}
                >
                  <p 
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "#999" }}
                  >
                    Document original faisant foi pour toutes fins légales et comptables
                  </p>
                </div>
              </div>
              
              {/* Signature Area */}
              <div className="text-center">
                <p 
                  className="text-xs uppercase tracking-[0.2em] font-bold mb-3"
                  style={{ color: primaryColor }}
                >
                  Signature & Cachet
                </p>
                <div 
                  className="w-52 h-24 rounded-xl relative overflow-hidden flex items-center justify-center"
                  style={{ 
                    border: entreprise.signature 
                      ? `2px solid ${primaryColor}60` 
                      : `2px dashed ${primaryColor}40`,
                    background: `linear-gradient(135deg, ${secondaryColor}30, white)`
                  }}
                >
                  {/* Decorative corner accents */}
                  <div 
                    className="absolute top-1 left-1 w-4 h-4"
                    style={{ 
                      borderTop: `3px solid ${primaryColor}`,
                      borderLeft: `3px solid ${primaryColor}`
                    }}
                  />
                  <div 
                    className="absolute bottom-1 right-1 w-4 h-4"
                    style={{ 
                      borderBottom: `3px solid ${primaryColor}`,
                      borderRight: `3px solid ${primaryColor}`
                    }}
                  />
                  {entreprise.signature ? (
                    <img
                      src={entreprise.signature}
                      alt="Signature"
                      className="relative z-10"
                      style={{ maxHeight: "80%", maxWidth: "85%", objectFit: "contain" }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full opacity-20"
                      style={{ 
                        background: `radial-gradient(circle, ${accentColor}, transparent)`
                      }}
                    />
                  )}
                </div>
                <p 
                  className="mt-2 text-[10px]"
                  style={{ color: "#999" }}
                >
                  {entreprise.nom}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Premium Banner */}
        <div 
          className="h-4 w-full absolute bottom-0 left-0"
          style={{ 
            background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})` 
          }}
        />
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
