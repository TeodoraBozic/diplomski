import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/admin";
import type { OrganisationPublic } from "../../types/api";
import { showToast } from "../../components/Toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export function PendingOrganisations() {
  const [organisations, setOrganisations] = useState<OrganisationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    try {
      const orgs = await adminApi.getPendingOrgs();
      setOrganisations(orgs);
    } catch (error) {
      console.error("Failed to load organisations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (org: OrganisationPublic) => {
    if (!org.username) {
      showToast("Username organizacije nije pronađen", "error");
      return;
    }

    setProcessingId(org.username);
    try {
      // Backend sada prihvata username direktno
      await adminApi.approveOrg(org.username);
      showToast("Organizacija je uspešno odobrena!", "success");
      loadOrganisations();
    } catch (error: any) {
      console.error("Failed to approve organisation:", error);
      const errorMessage = error?.message || error?.detail || "Neuspešno odobravanje organizacije";
      showToast(errorMessage, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (org: OrganisationPublic) => {
    if (!org.username) {
      showToast("Username organizacije nije pronađen", "error");
      return;
    }

    if (!confirm("Da li ste sigurni da želite da odbijete ovu organizaciju?")) {
      return;
    }

    setProcessingId(org.username);
    try {
      // Backend sada prihvata username direktno
      await adminApi.rejectOrg(org.username);
      showToast("Organizacija je uspešno odbijena!", "success");
      loadOrganisations();
    } catch (error: any) {
      console.error("Failed to reject organisation:", error);
      const errorMessage = error?.message || error?.detail || "Neuspešno odbijanje organizacije";
      showToast(errorMessage, "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  return (
    <div>
      <Link 
        to="/admin/dashboard" 
        className="flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg transition-all mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na admin panel
      </Link>
      <h1 className="text-3xl font-bold mb-6">Organizacije na čekanju</h1>

      {organisations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nema organizacija na čekanju</div>
      ) : (
        <div className="space-y-4">
          {organisations.map((org, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {org.logo && (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-20 h-20 object-contain rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{org.name}</h3>
                    <p className="text-gray-600">@{org.username}</p>
                    <p className="text-gray-600">{org.email}</p>
                    {org.location && (
                      <p className="text-gray-500 text-sm">{org.location}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded ${
                    org.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {org.status}
                </span>
              </div>

              {org.description && (
                <div className="mb-4">
                  <strong>Opis:</strong>
                  <p className="text-gray-700 mt-1">{org.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                {org.phone && (
                  <div>
                    <strong>Telefon:</strong> {org.phone}
                  </div>
                )}
                {org.website && (
                  <div>
                    <strong>Veb sajt:</strong>{" "}
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {org.website}
                    </a>
                  </div>
                )}
                <div>
                  <strong>Tip:</strong> {org.org_type === "official" ? "Zvanična organizacija" : "Neformalna grupa"}
                </div>
              </div>

              {org.status === "pending" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(org)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    disabled={processingId === org.username}
                  >
                    {processingId === org.username ? "Obrada..." : "Odobri"}
                  </button>
                  <button
                    onClick={() => handleReject(org)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    disabled={processingId === org.username}
                  >
                    {processingId === org.username ? "Obrada..." : "Odbij"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

