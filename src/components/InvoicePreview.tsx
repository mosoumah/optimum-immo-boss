import { forwardRef } from "react";

interface InvoicePreviewProps {
  entreprise: {
    nom: string;
    logo: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
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

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ entreprise, facture, aiContent, logoDataUrl }, ref) => {
    if (!facture || !entreprise) return null;

    const logoSrc = logoDataUrl || entreprise.logo;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 rounded-lg"
        style={{ minHeight: "600px", fontFamily: "Arial, sans-serif" }}
      >
        {/* Header with Logo */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            {logoSrc && (
              <img
                src={logoSrc}
                alt="Logo entreprise"
                className="w-20 h-20 object-contain"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{entreprise.nom}</h1>
              {entreprise.adresse && (
                <p className="text-gray-600 text-sm">{entreprise.adresse}</p>
              )}
              {entreprise.telephone && (
                <p className="text-gray-600 text-sm">Tél: {entreprise.telephone}</p>
              )}
              {entreprise.email && (
                <p className="text-gray-600 text-sm">{entreprise.email}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold" style={{ color: "#E97451" }}>
              FACTURE
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              N°: FAC-{facture.id.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-gray-600 text-sm">
              Date: {new Date(facture.date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Facturé à:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">{facture.clients?.nom || "Client"}</p>
            {facture.clients?.telephone && (
              <p className="text-gray-600 text-sm">Tél: {facture.clients.telephone}</p>
            )}
            {facture.clients?.email && (
              <p className="text-gray-600 text-sm">{facture.clients.email}</p>
            )}
          </div>
        </div>

        {/* Description & Amount Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#E97451" }}>
                <th className="text-left p-3 text-white font-semibold">Description</th>
                <th className="text-right p-3 text-white font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-3 text-gray-700">
                  {facture.description || "Prestation de service"}
                </td>
                <td className="p-3 text-right font-medium text-gray-900">
                  {formatCurrency(facture.montant)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#FFF5F2" }}>
                <td className="p-3 font-bold text-gray-900">TOTAL</td>
                <td
                  className="p-3 text-right font-bold text-lg"
                  style={{ color: "#E97451" }}
                >
                  {formatCurrency(facture.montant)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* AI Generated Content */}
        {aiContent && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Détails:</h3>
            <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {aiContent}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p>Merci pour votre confiance.</p>
            <p>Paiement à réception de la facture.</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-8 text-sm">Signature et cachet</p>
            <div className="w-48 h-20 border-b-2 border-gray-400"></div>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
