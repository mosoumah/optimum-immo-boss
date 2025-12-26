import { forwardRef } from "react";

interface InvoicePreviewProps {
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

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ entreprise, facture, aiContent, logoDataUrl }, ref) => {
    if (!facture || !entreprise) return null;

    const logoSrc = logoDataUrl || entreprise.logo;
    
    // Dynamic colors from brand or defaults
    const primaryColor = entreprise.couleur_primaire || "#E97451";
    const secondaryColor = entreprise.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise.couleur_accent || "#1a1a2e";
    
    // Calculated contrast colors
    const primaryTextColor = getContrastColor(primaryColor);
    const secondaryTextColor = getContrastColor(secondaryColor);
    const accentTextColor = getContrastColor(accentColor);

    return (
      <div
        ref={ref}
        className="bg-white text-black relative overflow-hidden"
        style={{ minHeight: "700px", fontFamily: "'Segoe UI', Arial, sans-serif" }}
      >
        {/* Top Banner */}
        <div 
          className="h-3 w-full"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${darkenColor(primaryColor, 0.1)})` }}
        />
        
        {/* Watermark Logo */}
        {logoSrc && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none"
            style={{ width: "400px", height: "400px" }}
          >
            <img
              src={logoSrc}
              alt=""
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        )}

        <div className="p-8 relative z-10">
          {/* Header with Logo and Invoice Badge */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-5">
              {logoSrc && (
                <div 
                  className="p-3 rounded-xl shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryColor}, white)`,
                    border: `2px solid ${lightenColor(primaryColor, 0.3)}`
                  }}
                >
                  <img
                    src={logoSrc}
                    alt="Logo entreprise"
                    className="w-16 h-16 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <div>
                <h1 
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: accentColor }}
                >
                  {entreprise.nom}
                </h1>
                <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                  {entreprise.adresse && <p>{entreprise.adresse}</p>}
                  {entreprise.telephone && <p>Tél: {entreprise.telephone}</p>}
                  {entreprise.email && <p>{entreprise.email}</p>}
                </div>
              </div>
            </div>
            
            {/* Invoice Badge */}
            <div className="text-right">
              <div 
                className="inline-block px-6 py-3 rounded-xl shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)})`,
                  color: primaryTextColor
                }}
              >
                <h2 className="text-2xl font-bold tracking-wider">FACTURE</h2>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-semibold" style={{ color: accentColor }}>
                  N°: FAC-{facture.id.substring(0, 8).toUpperCase()}
                </p>
                <p>Date: {new Date(facture.date).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          </div>

          {/* Decorative Line */}
          <div 
            className="h-1 rounded-full mb-8"
            style={{ 
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, transparent)` 
            }}
          />

          {/* Client Info Card */}
          <div className="mb-8">
            <div 
              className="rounded-xl p-5 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, ${secondaryColor}40, white)`,
                borderLeft: `4px solid ${primaryColor}`
              }}
            >
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: primaryColor }}
              >
                Facturé à
              </h3>
              <p className="font-semibold text-lg" style={{ color: accentColor }}>
                {facture.clients?.nom || "Client"}
              </p>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                {facture.clients?.telephone && (
                  <p className="flex items-center gap-2">
                    <span style={{ color: primaryColor }}>📞</span>
                    {facture.clients.telephone}
                  </p>
                )}
                {facture.clients?.email && (
                  <p className="flex items-center gap-2">
                    <span style={{ color: primaryColor }}>✉️</span>
                    {facture.clients.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Premium Table */}
          <div className="mb-8">
            <div 
              className="rounded-xl overflow-hidden shadow-sm"
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
                      className="text-left p-4 font-semibold text-sm uppercase tracking-wider"
                      style={{ color: primaryTextColor }}
                    >
                      Description
                    </th>
                    <th 
                      className="text-right p-4 font-semibold text-sm uppercase tracking-wider w-40"
                      style={{ color: primaryTextColor }}
                    >
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: `${secondaryColor}30` }}>
                    <td className="p-4 text-gray-700">
                      {facture.description || "Prestation de service"}
                    </td>
                    <td className="p-4 text-right font-medium" style={{ color: accentColor }}>
                      {formatCurrency(facture.montant)}
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
                  <span 
                    className="font-bold text-sm uppercase tracking-wider"
                    style={{ color: accentTextColor }}
                  >
                    Total à payer
                  </span>
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: primaryTextColor === "#ffffff" ? primaryColor : lightenColor(primaryColor, 0.3) }}
                  >
                    {formatCurrency(facture.montant)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Generated Content */}
          {aiContent && (
            <div className="mb-8">
              <div 
                className="rounded-xl p-5"
                style={{ 
                  background: `linear-gradient(135deg, ${secondaryColor}50, white)`,
                  borderLeft: `4px solid ${primaryColor}`
                }}
              >
                <h3 
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: primaryColor }}
                >
                  Détails de la prestation
                </h3>
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "#4a5568" }}
                >
                  {aiContent}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6">
            {/* Signature Area */}
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-500 max-w-xs">
                <p className="font-medium" style={{ color: accentColor }}>
                  Conditions de paiement
                </p>
                <p className="mt-1">Paiement à réception de la facture.</p>
                <p className="mt-2 text-xs">Merci pour votre confiance.</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  Signature et cachet
                </p>
                <div 
                  className="w-48 h-20 rounded-lg"
                  style={{ 
                    border: `2px dashed ${lightenColor(primaryColor, 0.2)}`,
                    background: `${secondaryColor}30`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div 
          className="h-3 w-full absolute bottom-0 left-0"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${darkenColor(primaryColor, 0.1)})` }}
        />
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
