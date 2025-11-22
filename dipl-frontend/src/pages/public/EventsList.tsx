import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { publicApi } from "../../api/public";
import type { EventPublic, EventCategory } from "../../types/api";
import { CalendarDaysIcon, MagnifyingGlassIcon, MapPinIcon, FunnelIcon, SparklesIcon, BuildingOffice2Icon, UserGroupIcon, ArrowRightIcon, StarIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export function EventsList() {
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgRatings, setOrgRatings] = useState<Record<string, { avgRating: number | null; totalReviews: number }>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
  });

  useEffect(() => {
    loadEvents();
  }, [searchParams]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const category = searchParams.get("category");
      const location = searchParams.get("location");
      const date_from = searchParams.get("date_from");
      const date_to = searchParams.get("date_to");

      let loadedEvents: EventPublic[] = [];
      if (category || location || date_from || date_to) {
        loadedEvents = await publicApi.filterEvents({
          category: category || null,
          location: location || null,
          date_from: date_from || null,
          date_to: date_to || null,
          tags: null,
        });
      } else {
        loadedEvents = await publicApi.getAllEvents();
      }

      // Filtrirati završene događaje - prikazivati samo predstojeće
      const now = new Date();
      const upcomingEvents = loadedEvents.filter((event) => {
        if (!event.end_date) return true; // Ako nema end_date, prikaži ga
        const eventEndDate = new Date(event.end_date);
        return eventEndDate >= now; // Prikaži samo ako još nije završen
      });

      // Sortirati po datumu početka - najskoriji prvo
      const sortedEvents = upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateA - dateB; // Najskoriji prvo (rastući redosled)
      });

      setEvents(sortedEvents);

      // Učitaj ocene za organizacije
      loadOrgRatings(sortedEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgRatings = async (eventsList: EventPublic[]) => {
    // Prikupi jedinstvene organizacije
    const orgIds = new Set<string>();
    eventsList.forEach(event => {
      if (event.organisation_id) {
        orgIds.add(event.organisation_id);
      }
    });

    // Učitaj ocene za svaku organizaciju
    const ratingsMap: Record<string, { avgRating: number | null; totalReviews: number }> = {};
    
    for (const orgId of orgIds) {
      try {
        const [avgRatingData, reviewsData] = await Promise.all([
          publicApi.getOrgAvgRating(orgId).catch(() => null),
          publicApi.getReviewsForOrg(orgId).catch(() => [])
        ]);
        
        const avgRating = avgRatingData?.avg_rating || avgRatingData || null;
        const reviews = Array.isArray(reviewsData) ? reviewsData : [];
        
        ratingsMap[orgId] = {
          avgRating: typeof avgRating === 'number' ? avgRating : null,
          totalReviews: reviews.length
        };
      } catch (error) {
        console.error(`Failed to load rating for org ${orgId}:`, error);
        ratingsMap[orgId] = { avgRating: null, totalReviews: 0 };
      }
    }
    
    setOrgRatings(ratingsMap);
  };

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    setSearchParams(params);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-mint/20 rounded-xl">
          <CalendarDaysIcon className="w-8 h-8 text-mint" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212]">Svi događaji</h1>
      </div>

      <div className="card p-8 mb-8 bg-gradient-to-br from-cream/30 to-white border-2 border-mint/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-mint/20 rounded-xl">
            <SparklesIcon className="w-6 h-6 text-mint" />
          </div>
          <h2 className="text-2xl font-bold text-[#121212]">Pronađi događaj po svojoj meri</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#121212] uppercase tracking-wide">Kategorija</label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field appearance-none pr-10 cursor-pointer hover:border-mint transition-colors"
              >
                <option value="">Sve kategorije</option>
                <option value="sports">Sport</option>
                <option value="cultural">Kultura</option>
                <option value="business">Biznis</option>
                <option value="eco">Ekologija</option>
                <option value="festival">Festival</option>
                <option value="concert">Koncert</option>
                <option value="education">Obrazovanje</option>
                <option value="charity">Humanitarno</option>
                <option value="community">Zajednica</option>
                <option value="other">Ostalo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#121212] uppercase tracking-wide">Lokacija</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="Unesite grad..."
                className="input-field pl-10 hover:border-mint transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#121212] uppercase tracking-wide">Od datuma</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field pl-10 hover:border-mint transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#121212] uppercase tracking-wide">Do datuma</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field pl-10 hover:border-mint transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-semibold mb-2 text-[#121212] uppercase tracking-wide opacity-0">Pretraži</label>
            <button
              onClick={handleFilter}
              className="btn-primary flex items-center gap-2 justify-center hover:scale-105 transition-transform h-[42px]"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Pretraži
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
          <p className="text-[#121212] text-lg font-medium">Učitavanje događaja...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-[#121212] text-xl font-medium mb-2">Nema pronađenih događaja</p>
          <p className="text-gray-600">Pokušajte sa drugim filterima</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <Link
              key={index}
              to={`/events/${event.title}`}
              className="group card overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-mint/30"
            >
              {/* Image Section */}
              {event.image ? (
                <div className="relative overflow-hidden h-64">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                      {event.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ) : (
                <div className="relative h-64 bg-gradient-to-br from-mint/20 to-cream/30 flex items-center justify-center">
                  <CalendarDaysIcon className="w-20 h-20 text-mint/50" />
                  <div className="absolute top-4 right-4">
                    <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                      {event.category}
                    </span>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="p-6 bg-white">
                {/* Organization Name */}
                {event.organisation_name && (
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-mint/20 rounded-lg">
                        <BuildingOffice2Icon className="w-4 h-4 text-mint" />
                      </div>
                      <span className="text-sm font-semibold text-[#121212] truncate">
                        {event.organisation_name}
                      </span>
                    </div>
                    
                    {/* Ocene i komentari */}
                    {event.organisation_id && orgRatings[event.organisation_id] && (
                      <div className="flex items-center gap-3 mb-2">
                        {orgRatings[event.organisation_id].avgRating !== null && (
                          <div className="flex items-center gap-1 bg-cream/50 px-2 py-1 rounded-full">
                            <StarIcon className="w-4 h-4 text-mint fill-mint" />
                            <span className="text-xs font-bold text-[#121212]">
                              {orgRatings[event.organisation_id].avgRating!.toFixed(1)}
                            </span>
                            {orgRatings[event.organisation_id].totalReviews > 0 && (
                              <span className="text-xs text-gray-600">
                                ({orgRatings[event.organisation_id].totalReviews})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.organisation_username && (
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/organisations/${event.organisation_username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-[#121212] bg-mint hover:bg-[#B8D4C5] px-3 py-1.5 rounded-lg transition-all hover:gap-3 group"
                        >
                          <span>Vidi info o organizatoru</span>
                          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        {event.organisation_id && orgRatings[event.organisation_id]?.totalReviews > 0 && (
                          <Link
                            to={`/organisations/${event.organisation_username}#reviews`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#121212] bg-mint/80 hover:bg-mint px-3 py-1.5 rounded-lg transition-all hover:gap-3 group"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            <span>Vidi ocene i komentare</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Event Title */}
                <h3 className="font-extrabold text-2xl mb-3 text-[#121212] group-hover:text-mint transition-colors line-clamp-2 leading-tight">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-[#121212] text-sm mb-5 line-clamp-3 font-medium leading-relaxed">
                  {event.description}
                </p>

                {/* Details Grid */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-mint/20 rounded-lg flex-shrink-0">
                      <MapPinIcon className="w-4 h-4 text-mint" />
                    </div>
                    <span className="text-[#121212] font-semibold truncate">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-cream/50 rounded-lg flex-shrink-0">
                      <CalendarDaysIcon className="w-4 h-4 text-[#121212]" />
                    </div>
                    <span className="text-[#121212] font-semibold">
                      {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  {event.max_volunteers && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-1.5 bg-mint/20 rounded-lg flex-shrink-0">
                        <UserGroupIcon className="w-4 h-4 text-mint" />
                      </div>
                      <span className="text-[#121212] font-semibold">
                        Maksimalno {event.max_volunteers} volontera
                      </span>
                    </div>
                  )}
                </div>

                {/* View More Link */}
                <div className="flex items-center gap-2 text-[#121212] bg-mint font-semibold text-sm px-3 py-2 rounded-lg pt-4 border-t border-gray-200 group-hover:gap-3 transition-all">
                  <span>Više detalja</span>
                  <MagnifyingGlassIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

