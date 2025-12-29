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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-GN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " GNF";
};

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
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const darkenColor = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace("#", "");
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ entreprise, document, client, logoDataUrl }, ref) => {
    const primaryColor = entreprise.couleur_primaire || "#E97451";
    const secondaryColor = entreprise.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise.couleur_accent || "#1a1a2e";
    const textOnPrimary = getContrastColor(primaryColor);
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
        className="bg-white text-gray-900 shadow-2xl"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${darkenColor(primaryColor, 0.15)})`,
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              {logoSrc && (
                <div
                  className="w-20 h-20 rounded-xl shadow-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${secondaryColor}, white)`,
                    border: `2px solid ${lightenColor(primaryColor, 0.3)}`,
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
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: textOnPrimary }}
                >
                  {entreprise.nom}
                </h1>
                {entreprise.adresse && (
                  <p
                    className="text-base opacity-90 mt-1"
                    style={{ color: textOnPrimary }}
                  >
                    {entreprise.adresse}
                  </p>
                )}
              </div>
            </div>
            <div
              className="text-right text-base"
              style={{ color: textOnPrimary }}
            >
              {entreprise.telephone && <p className="opacity-90">{entreprise.telephone}</p>}
              {entreprise.email && <p className="opacity-90">{entreprise.email}</p>}
            </div>
          </div>
        </div>

        {/* Document Type Badge */}
        <div className="flex justify-center mb-8">
          <div
            className="px-8 py-3 rounded-full text-xl font-bold uppercase tracking-wider shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${darkenColor(accentColor, 0.2)})`,
              color: getContrastColor(accentColor),
            }}
          >
            {document.type}
          </div>
        </div>

        {/* Date */}
        <div className="text-right mb-6">
          <p className="text-base text-gray-600">
            Date : <span className="font-semibold text-gray-900">{formatDate(document.date)}</span>
          </p>
        </div>

        {/* Client Info */}
        {client && (
          <div
            className="rounded-xl p-5 mb-8"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${lightenColor(secondaryColor, 0.05)})`,
              border: `2px solid ${lightenColor(primaryColor, 0.4)}`,
            }}
          >
            <h3
              className="text-base font-bold mb-3 uppercase tracking-wide"
              style={{ color: primaryColor }}
            >
              Destinataire
            </h3>
            <div className="text-base">
              <p className="font-semibold text-gray-900 text-lg">{client.nom}</p>
              {client.email && <p className="text-gray-600 mt-1">{client.email}</p>}
              {client.telephone && <p className="text-gray-600">{client.telephone}</p>}
            </div>
          </div>
        )}

        {/* Document Content */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: `linear-gradient(180deg, ${lightenColor(secondaryColor, 0.02)}, white)`,
            border: `1px solid ${lightenColor(primaryColor, 0.5)}`,
            minHeight: "200px",
          }}
        >
          <h3
            className="text-base font-bold mb-4 uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Contenu du Document
          </h3>
          <div
            className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap"
            style={{ fontSize: "14px", lineHeight: "1.8" }}
          >
            {document.contenu || "Aucun contenu disponible."}
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-12">
          <div
            className="rounded-xl p-6"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${lightenColor(secondaryColor, 0.03)})`,
              border: `2px solid ${lightenColor(primaryColor, 0.4)}`,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className="text-base font-bold uppercase tracking-wide mb-2"
                  style={{ color: primaryColor }}
                >
                  Signature et Cachet
                </p>
                <p className="text-gray-600 text-sm">
                  Pour {entreprise.nom}
                </p>
              </div>
              {entreprise.signature && (
                <div className="text-center">
                  <img
                    src={entreprise.signature}
                    alt="Signature"
                    className="h-16 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
            <div
              className="mt-6 pt-4 border-t-2 border-dashed"
              style={{ borderColor: lightenColor(primaryColor, 0.4) }}
            >
              <p className="text-gray-500 text-sm italic">
                Document généré par intelligence artificielle
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-8 pt-6 text-center text-sm"
          style={{
            borderTop: `2px solid ${lightenColor(primaryColor, 0.4)}`,
            color: accentColor,
          }}
        >
          <p className="font-medium">{entreprise.nom}</p>
          {entreprise.adresse && <p className="opacity-70 mt-1">{entreprise.adresse}</p>}
          {(entreprise.telephone || entreprise.email) && (
            <p className="opacity-70 mt-1">
              {[entreprise.telephone, entreprise.email].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
