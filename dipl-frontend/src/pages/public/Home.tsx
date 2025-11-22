import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { publicApi } from "../../api/public";
import type { EventPublic, OrganisationPublic } from "../../types/api";
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  SparklesIcon,
  ArrowRightIcon,
  UserGroupIcon,
  HeartIcon,
  BuildingOffice2Icon,
  StarIcon,
  HandRaisedIcon,
  FireIcon
} from "@heroicons/react/24/outline";

export function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventPublic[]>([]);
  const [organisations, setOrganisations] = useState<OrganisationPublic[]>([]);
  const [orgRatings, setOrgRatings] = useState<Map<string, { avg: number; total: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [events, orgs] = await Promise.all([
        publicApi.getUpcomingEvents(),
        publicApi.getOrganisations()
      ]);
      
      // Dodatna provera na frontendu - filtrirati završene događaje
      const now = new Date();
      const upcomingOnly = events.filter((event) => {
        if (!event.end_date) return true; // Ako nema end_date, prikaži ga
        const eventEndDate = new Date(event.end_date);
        return eventEndDate >= now; // Prikaži samo ako još nije završen
      });
      
      setUpcomingEvents(upcomingOnly.slice(0, 6));
      const displayedOrgs = orgs.slice(0, 3);
      setOrganisations(displayedOrgs);
      
      // Učitaj ocene za prikazane organizacije
      const ratingsMap = new Map<string, { avg: number; total: number }>();
      for (const org of displayedOrgs) {
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
          // Ignoriši greške
        }
      }
      setOrgRatings(ratingsMap);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
        
      {/* Hero Section - Enhanced */}
      <section className="relative min-h-[600px] flex items-center justify-center rounded-3xl overflow-hidden">
        {/* Hero Image Background */}
        <div className="absolute inset-0">
  <img 
    src="/hero-image.jpg.webp" 
    alt="Hero" 
    className="w-full h-full object-cover opacity-95"
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />

  {/* Svetli pastelni overlay – bez tamnjenja slike */}
  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
</div>

        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-cream/90 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-mint">
            <SparklesIcon className="w-5 h-5 text-[#121212]" />
            <span className="text-sm font-medium text-[#121212]">Platforma za volontiranje</span>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 mb-6 border border-white/50 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-[#121212]">
              Povezujemo
              <span className="block text-[#121212] text-3xl md:text-4xl mt-2">
                volontere i organizacije
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#121212] max-w-3xl mx-auto leading-relaxed font-medium">
              Otkrijte neverovatne volonterske prilike, pridružite se organizacijama koje rade na pozitivnim promenama, 
              i zajedno napravite razliku u svojoj zajednici.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/events"
              className="group btn-primary px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 min-w-[200px] justify-center shadow-lg"
            >
              Pregledaj događaje
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/organisations"
              className="bg-cream/90 backdrop-blur-sm text-[#121212] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-cream transition-all border-2 border-mint min-w-[200px] text-center shadow-lg"
            >
              Pregledaj organizacije
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-cream/90 backdrop-blur-sm rounded-xl p-6 border border-mint shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-center mb-3">
                <CalendarDaysIcon className="w-8 h-8 text-mint group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-4xl font-bold mb-2 text-[#121212] text-center">{upcomingEvents.length}+</div>
              <div className="text-sm text-[#121212] text-center font-medium">Aktivnih događaja</div>
            </div>
            <div className="bg-cream/90 backdrop-blur-sm rounded-xl p-6 border border-mint shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-center mb-3">
                <BuildingOffice2Icon className="w-8 h-8 text-mint group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-4xl font-bold mb-2 text-[#121212] text-center">{organisations.length}+</div>
              <div className="text-sm text-[#121212] text-center font-medium">Organizacija</div>
            </div>
            <div className="bg-cream/90 backdrop-blur-sm rounded-xl p-6 border border-mint shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-center mb-3">
                <UserGroupIcon className="w-8 h-8 text-mint group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-4xl font-bold mb-2 text-[#121212] text-center">100+</div>
              <div className="text-sm text-[#121212] text-center font-medium">Volontera</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="animate-fade-in-up">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <StarIcon className="w-8 h-8 text-mint animate-float" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#121212]">
              Zašto baš mi?
            </h2>
            <StarIcon className="w-8 h-8 text-mint animate-float" style={{ animationDelay: '1s' }} />
          </div>
          <p className="text-xl text-[#121212] max-w-2xl mx-auto font-medium">
            Lako i brzo pronađi volonterske prilike i organizacije u blizini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group card p-8 text-center hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-20 h-20 bg-mint rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#B8D4C5] group-hover:scale-110 transition-all duration-300">
              <CalendarDaysIcon className="w-10 h-10 text-[#121212] group-hover:rotate-12 transition-transform" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#121212] group-hover:text-mint transition-colors">Otkrij događaje</h3>
            <p className="text-[#121212] leading-relaxed font-medium">
              Pronađi uzbudljive volonterske prilike u blizini. Filtriraj po kategoriji, lokaciji i datumu.
            </p>
          </div>
          
          <div className="group card p-8 text-center hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-20 h-20 bg-mint rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#B8D4C5] group-hover:scale-110 transition-all duration-300">
              <UserGroupIcon className="w-10 h-10 text-[#121212] group-hover:rotate-12 transition-transform" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#121212] group-hover:text-mint transition-colors">Pridruži se zajednici</h3>
            <p className="text-[#121212] leading-relaxed font-medium">
              Poveži se sa volonterima sličnih interesovanja i organizacijama koje rade na pozitivnim promenama.
            </p>
          </div>
          
          <div className="group card p-8 text-center hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
            <div className="w-20 h-20 bg-mint rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#B8D4C5] group-hover:scale-110 transition-all duration-300">
              <HeartIcon className="w-10 h-10 text-[#121212] group-hover:rotate-12 transition-transform" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#121212] group-hover:text-mint transition-colors">Napravi uticaj</h3>
            <p className="text-[#121212] leading-relaxed font-medium">
              Kreiraj pozitivne promene u svojoj zajednici. Svaki doprinos je važan i čini razliku.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section - Enhanced */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-mint/20 rounded-xl">
                <FireIcon className="w-8 h-8 text-mint" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#121212]">Predstojeći događaji</h2>
            </div>
            <p className="text-[#121212] text-lg font-medium ml-14">Pronađite događaj koji vam odgovara</p>
          </div>
          <Link
            to="/events"
            className="hidden md:flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all group"
          >
            <span>Vidi sve</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
            <p className="mt-4 text-gray-700">Učitavanje događaja...</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-300">
            <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-700">Trenutno nema predstojećih događaja</p>
            <Link
              to="/events"
              className="inline-block mt-4 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Pregledaj sve događaje →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <Link
                key={index}
                to={`/events/${event.title}`}
                className="group card overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {event.image ? (
                  <div className="relative overflow-hidden h-56">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-mint text-[#121212] px-3 py-1 rounded-full font-semibold text-xs">
                        {event.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-56 bg-cream flex items-center justify-center">
                    <CalendarDaysIcon className="w-16 h-16 text-gray-500" />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3 text-[#121212] group-hover:text-mint transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPinIcon className="w-4 h-4 text-mint" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDaysIcon className="w-4 h-4 text-mint" />
                      <span>{new Date(event.start_date).toLocaleDateString('sr-RS', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    {event.max_volunteers && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserGroupIcon className="w-4 h-4 text-mint" />
                        <span>Maksimalno {event.max_volunteers} volontera</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#121212] bg-mint font-semibold text-sm px-3 py-2 rounded-lg group-hover:gap-3 transition-all">
                    <span>Više detalja</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && upcomingEvents.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 btn-primary px-8 py-3 rounded-xl font-semibold"
            >
              Vidi sve događaje
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        )}
      </section>

      {/* Featured Organisations Section */}
      {organisations.length > 0 && (
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-mint/20 rounded-xl">
                  <BuildingOffice2Icon className="w-8 h-8 text-mint" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#121212]">Istražite organizacije</h2>
              </div>
              <p className="text-[#121212] text-lg font-medium ml-14">Upoznajte organizacije koje organizuju događaje</p>
            </div>
            <Link
              to="/organisations"
              className="hidden md:flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all group"
            >
              <span>Vidi sve</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {organisations.map((org, index) => (
              <Link
                key={index}
                to={`/organisations/${org.username}`}
                className="group card p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-16 h-16 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300">
                      <BuildingOffice2Icon className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#121212] group-hover:text-mint transition-colors">
                      {org.name}
                    </h3>
                    {/* Prosečna ocena - PRIKAZANA PRVO */}
                    {(() => {
                      const orgId = (org as any)._id || (org as any).id;
                      const rating = orgId ? orgRatings.get(orgId) : null;
                      if (rating && rating.avg > 0) {
                        return (
                          <div className="flex items-center gap-2 mb-2">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-600">@{org.username}</p>
                    </div>
                  </div>
                </div>
                {org.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}
                {org.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-mint" />
                    <span>{org.location}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/organisations"
              className="inline-flex items-center gap-2 btn-primary px-8 py-3 rounded-xl font-semibold"
            >
              Vidi sve organizacije
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative rounded-3xl overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-cream"></div>
        <div className="relative z-10 p-12 md:p-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/50 rounded-full backdrop-blur-sm">
              <HandRaisedIcon className="w-16 h-16 text-[#121212] animate-float" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#121212]">
            Spremni da napravite razliku?
          </h2>
          <p className="text-xl mb-10 text-[#121212] max-w-2xl mx-auto font-medium">
            Pridružite se našoj zajednici volontera i organizacija koje rade na pozitivnim promenama
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register-user"
              className="group btn-primary px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:scale-105 transition-all animate-pulse-glow"
            >
              <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Registruj se kao volonter</span>
            </Link>
            <Link
              to="/register-org"
              className="group bg-white text-[#121212] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:scale-105 transition-all border-2 border-mint flex items-center gap-2"
            >
              <BuildingOffice2Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Registruj organizaciju</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

