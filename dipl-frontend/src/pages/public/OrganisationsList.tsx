import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../../api/public";
import type { OrganisationPublic } from "../../types/api";
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  StarIcon,
  HeartIcon
} from "@heroicons/react/24/outline";

export function OrganisationsList() {
  const [organisations, setOrganisations] = useState<OrganisationPublic[]>([]);
  const [ratings, setRatings] = useState<Map<string, { avg: number; total: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    try {
      const orgs = await publicApi.getOrganisations();
      setOrganisations(orgs);
      
      // Učitaj ocene za svaku organizaciju
      const ratingsMap = new Map<string, { avg: number; total: number }>();
      for (const org of orgs) {
        try {
          const orgId = (org as any)._id || (org as any).id;
          if (orgId) {
            const avgRating = await publicApi.getOrgAvgRating(orgId);
            const reviews = await publicApi.getReviewsForOrg(orgId);
            const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
            const avg = typeof avgRating === 'number' ? avgRating : (avgRating?.avg_rating || null);
            if (avg !== null && avg !== undefined) {
              ratingsMap.set(orgId, { avg, total: totalReviews });
            }
          }
        } catch (error) {
          // Ignoriši greške za pojedinačne organizacije
          console.error(`Failed to load rating for org ${org.username}:`, error);
        }
      }
      setRatings(ratingsMap);
    } catch (error) {
      console.error("Failed to load organisations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadOrganisations();
      return;
    }

    setIsSearching(true);
    try {
      const results = await publicApi.getOrganisationByUsername(query);
      setOrganisations(results);
      
      // Učitaj ocene za rezultate pretrage
      const ratingsMap = new Map<string, { avg: number; total: number }>();
      for (const org of results) {
        try {
          const orgId = (org as any)._id || (org as any).id;
          if (orgId) {
            const avgRating = await publicApi.getOrgAvgRating(orgId);
            const reviews = await publicApi.getReviewsForOrg(orgId);
            const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
            const avg = typeof avgRating === 'number' ? avgRating : (avgRating?.avg_rating || null);
            if (avg !== null && avg !== undefined) {
              ratingsMap.set(orgId, { avg, total: totalReviews });
            }
          }
        } catch (error) {
          console.error(`Failed to load rating for org ${org.username}:`, error);
        }
      }
      setRatings(ratingsMap);
    } catch (error) {
      console.error("Failed to search organisations:", error);
      setOrganisations([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getOrgTypeLabel = (orgType?: string | null) => {
    switch (orgType) {
      case "official":
        return "Zvanična organizacija";
      case "informal":
        return "Neformalna grupa";
      default:
        return orgType || "Nepoznato";
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-mint/20 rounded-xl">
              <BuildingOffice2Icon className="w-10 h-10 text-mint" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212] mb-2">
                Organizacije
              </h1>
              <p className="text-[#121212] text-lg font-medium">
                Istražite organizacije koje organizuju volonterske događaje
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-auto md:min-w-[300px] md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Pretraži po username-u..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-mint/30 focus:border-mint focus:outline-none text-[#121212] font-medium bg-white"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mint"></div>
              </div>
            )}
          </div>
        </div>

        {!loading && !isSearching && organisations.length > 0 && (
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-mint" />
            <span className="text-[#121212] font-medium">
              Pronađeno {organisations.length} {organisations.length === 1 ? 'organizacija' : 'organizacija'}
              {searchQuery && ` za "${searchQuery}"`}
            </span>
          </div>
        )}
      </div>

      {loading || isSearching ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
          <p className="text-[#121212] text-lg font-medium">
            {isSearching ? 'Pretraga...' : 'Učitavanje organizacija...'}
          </p>
        </div>
      ) : organisations.length === 0 ? (
        <div className="card p-12 text-center">
          <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-[#121212] text-xl font-medium mb-2">
            {searchQuery ? `Nema rezultata za "${searchQuery}"` : 'Nema pronađenih organizacija'}
          </p>
          <p className="text-gray-600">
            {searchQuery ? 'Pokušajte sa drugim pretragom' : 'Proverite ponovo kasnije'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {organisations.map((org, index) => (
            <Link
              key={org.username || index}
              to={`/organisations/${org.username}`}
              className="group card p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-transparent hover:border-mint"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Logo and Header */}
              <div className="flex items-start gap-4 mb-5">
                {org.logo ? (
                  <div className="flex-shrink-0">
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-20 h-20 object-contain rounded-xl border-2 border-mint/30 bg-white p-2 group-hover:border-mint transition-colors"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-mint/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-mint/30 transition-colors">
                    <BuildingOffice2Icon className="w-10 h-10 text-mint" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl mb-2 text-[#121212] group-hover:text-mint transition-colors line-clamp-2">
                    {org.name}
                  </h3>
                  {/* Prosečna ocena - PRIKAZANA PRVO */}
                  {(() => {
                    const orgId = (org as any)._id || (org as any).id;
                    const rating = orgId ? ratings.get(orgId) : null;
                    if (rating && rating.avg > 0) {
                      return (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1 bg-cream/50 px-3 py-1.5 rounded-full">
                            <HeartIcon className="w-5 h-5 text-mint fill-mint" />
                            <span className="text-sm font-bold text-[#121212]">
                              {rating.avg.toFixed(1)}
                            </span>
                            {rating.total > 0 && (
                              <span className="text-xs text-gray-600">
                                ({rating.total} {rating.total === 1 ? 'ocena' : rating.total < 5 ? 'ocene' : 'ocena'})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {org.username && (
                    <p className="text-sm text-gray-600 mb-2 font-medium">@{org.username}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {org.org_type && (
                      <span className="inline-block bg-mint text-[#121212] px-3 py-1 rounded-full text-xs font-semibold">
                        {getOrgTypeLabel(org.org_type)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {org.description && (
                <p className="text-[#121212] text-sm mb-5 line-clamp-3 leading-relaxed font-medium">
                  {org.description}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-3 mb-4">
                {org.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-mint/20 rounded-lg">
                      <MapPinIcon className="w-4 h-4 text-mint" />
                    </div>
                    <span className="text-[#121212] font-medium truncate flex-1">{org.location}</span>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-cream/50 rounded-lg">
                      <EnvelopeIcon className="w-4 h-4 text-[#121212]" />
                    </div>
                    <span className="text-[#121212] font-medium truncate flex-1">{org.email}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-mint/20 rounded-lg">
                      <PhoneIcon className="w-4 h-4 text-mint" />
                    </div>
                    <span className="text-[#121212] font-medium truncate flex-1">{org.phone}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-cream/50 rounded-lg">
                      <GlobeAltIcon className="w-4 h-4 text-[#121212]" />
                    </div>
                    <span className="text-[#121212] font-medium truncate flex-1">{org.website}</span>
                  </div>
                )}
              </div>

              {/* View More Link */}
              <div className="flex items-center gap-2 text-[#121212] bg-mint font-semibold text-sm px-3 py-2 rounded-lg pt-4 border-t border-gray-200 group-hover:gap-3 transition-all">
                <span>Vidi detalje</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

