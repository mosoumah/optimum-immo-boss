import { forwardRef } from "react";

interface QuotePreviewProps {
  entreprise: {
    nom: string;
    logo: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    couleur_primaire?: string | null;
    couleur_secondaire?: string | null;
    couleur_accent?: string | null;
  } | null;
  devis: {
    id: string;
    numero_devis: string | null;
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
const lightenColor = (hexColor: string, percent: number): string => {
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

export const QuotePreview = forwardRef<HTMLDivElement, QuotePreviewProps>(
  ({ entreprise, devis, aiContent, logoDataUrl }, ref) => {
    if (!devis || !entreprise) return null;

    const logoSrc = logoDataUrl || entreprise.logo;
    
    // Dynamic colors from brand or defaults
    const primaryColor = entreprise.couleur_primaire || "#E97451";
    const secondaryColor = entreprise.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise.couleur_accent || "#1a1a2e";
    
    // Calculated contrast colors
    const primaryTextColor = getContrastColor(primaryColor);
    const accentTextColor = getContrastColor(accentColor);

    return (
      <div
        ref={ref}
        className="bg-white text-black relative overflow-hidden"
        style={{ minHeight: "700px", fontFamily: "'Segoe UI', Arial, sans-serif" }}
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
          {/* Header with Logo and Quote Badge */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-5">
              {logoSrc && (
                <div 
                  className="p-2 rounded-xl shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryColor}, white)`,
                    border: `2px solid ${lightenColor(primaryColor, 0.3)}`
                  }}
                >
                  <img
                    src={logoSrc}
                    alt="Logo entreprise"
                    className="w-20 h-20 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <div>
                <p 
                  className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1"
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
                <div className="mt-2 text-xs text-gray-500">
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
            
            {/* Quote Badge */}
            <div className="text-right">
              <div 
                className="inline-block px-5 py-2 rounded-lg shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)})`,
                  color: primaryTextColor
                }}
              >
                <h2 className="text-lg font-bold tracking-[0.15em]">DEVIS</h2>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-semibold" style={{ color: accentColor }}>
                  Réf. {devis.numero_devis || `DEV-${devis.id.substring(0, 8).toUpperCase()}`}
                </p>
                <p className="mt-1">
                  Émis le {new Date(devis.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
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
          <div className="mb-6">
            <div 
              className="rounded-lg p-4 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, ${secondaryColor}30, white)`,
                borderLeft: `3px solid ${primaryColor}`
              }}
            >
              <h3 
                className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: primaryColor }}
              >
                Proposé à
              </h3>
              <p className="font-semibold text-base" style={{ color: accentColor }}>
                {devis.clients?.nom || "Client"}
              </p>
              {/* Elegant separator line */}
              <div 
                className="w-12 h-px my-2"
                style={{ background: primaryColor }}
              />
              <div className="text-xs text-gray-500">
                {devis.clients?.telephone && (
                  <span>{devis.clients.telephone}</span>
                )}
                {devis.clients?.telephone && devis.clients?.email && (
                  <span style={{ color: primaryColor }}> • </span>
                )}
                {devis.clients?.email && (
                  <span className="lowercase">{devis.clients.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Separator */}
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
            />
          </div>

          {/* Premium Table */}
          <div className="mb-6">
            <div 
              className="rounded-lg overflow-hidden shadow-sm"
              style={{ border: `1px solid ${lightenColor(primaryColor, 0.4)}` }}
            >
              <table className="w-full">
                <thead>
                  <tr 
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.1)})` 
                    }}
                  >
                    <th 
                      className="text-left p-3 font-semibold text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: primaryTextColor }}
                    >
                      Désignation
                    </th>
                    <th 
                      className="text-right p-3 font-semibold text-[10px] uppercase tracking-[0.15em] w-36"
                      style={{ color: primaryTextColor }}
                    >
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: `${secondaryColor}20` }}>
                    <td className="p-3 text-sm text-gray-700">
                      {devis.description || "Prestation de service immobilier"}
                    </td>
                    <td className="p-3 text-right font-medium text-sm" style={{ color: accentColor }}>
                      {formatCurrency(devis.montant)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Totals Section */}
              <div 
                className="p-4"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}, ${darkenColor(accentColor, 0.1)})` 
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span 
                      className="font-bold text-[10px] uppercase tracking-[0.15em] block"
                      style={{ color: accentTextColor }}
                    >
                      Montant Total Proposé
                    </span>
                    <span 
                      className="text-[9px] mt-1 block opacity-70"
                      style={{ color: accentTextColor }}
                    >
                      Hors taxes - Devis valable 30 jours
                    </span>
                  </div>
                  <span 
                    className="text-xl font-bold"
                    style={{ color: primaryTextColor === "#ffffff" ? primaryColor : lightenColor(primaryColor, 0.3) }}
                  >
                    {formatCurrency(devis.montant)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Generated Content */}
          {aiContent && (
            <>
              {/* Elegant Separator */}
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className="flex-1 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}50, transparent)` }}
                />
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: primaryColor }}
                />
                <div 
                  className="flex-1 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}50, transparent)` }}
                />
              </div>
              
              <div className="mb-6">
                <div 
                  className="rounded-lg p-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryColor}40, white)`,
                    borderLeft: `3px solid ${primaryColor}`
                  }}
                >
                  <h3 
                    className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2"
                    style={{ color: primaryColor }}
                  >
                    Détail de la Proposition
                  </h3>
                  {/* Thin separator under title */}
                  <div 
                    className="w-16 h-px mb-3"
                    style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
                  />
                  <div 
                    className="text-xs leading-relaxed"
                    style={{ color: "#4a5568" }}
                  >
                    {aiContent.split('\n').map((line, idx) => {
                      const cleanLine = line.replace(/^[\s•\-\*]+/, '').trim();
                      if (!cleanLine) return null;
                      return (
                        <p key={idx} className="mb-1.5 last:mb-0">
                          {cleanLine}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Separator */}
          <div 
            className="h-px mt-8 mb-5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}30, transparent)` }}
          />

          {/* Footer */}
          <div>
            {/* Signature Area */}
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-500 max-w-xs">
                <p 
                  className="font-semibold uppercase text-[9px] tracking-[0.15em]"
                  style={{ color: accentColor }}
                >
                  Conditions de Validité
                </p>
                {/* Thin accent line */}
                <div 
                  className="w-10 h-px my-2"
                  style={{ background: primaryColor }}
                />
                <p className="text-gray-600 leading-relaxed">
                  Ce devis est valable pour une durée de trente (30) jours à compter de sa date d'émission.
                </p>
                <p className="mt-2 text-[10px] italic" style={{ color: primaryColor }}>
                  Nous vous remercions de votre confiance et restons à votre entière disposition.
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                    Ce document constitue un devis non contractuel
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

QuotePreview.displayName = "QuotePreview";
