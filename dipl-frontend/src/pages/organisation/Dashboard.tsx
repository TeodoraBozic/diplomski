import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { eventsApi } from "../../api/events";
import { publicApi } from "../../api/public";
import { useNotifications } from "../../hooks/useNotifications";
import type { EventPublic } from "../../types/api";
import { CalendarDaysIcon, BellIcon, XMarkIcon, DocumentTextIcon, ArrowRightIcon, SparklesIcon, PlusCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

export function Dashboard() {
  const { organisation } = useAuth();
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  
  const {
    pendingApplications,
    hasNewApplication,
    setHasNewApplication,
    refreshApplications,
  } = useNotifications();

  useEffect(() => {
    loadData();
    // Eksplicitno učitaj prijave kada se Dashboard učita
    refreshApplications();
  }, []);

  useEffect(() => {
    loadRatingData();
  }, [organisation]);

  useEffect(() => {
    // Refresh applications when WebSocket detects new ones
    if (hasNewApplication) {
      refreshApplications();
    }
  }, [hasNewApplication, refreshApplications]);

  // Dodatno osvežavanje prijava svakih 10 sekundi
  useEffect(() => {
    const interval = setInterval(() => {
      refreshApplications();
    }, 10000); // Osveži svakih 10 sekundi

    return () => clearInterval(interval);
  }, [refreshApplications]);

  const loadData = async () => {
    try {
      const myEvents = await eventsApi.getMyEvents();
      setEvents(myEvents);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadRatingData = async () => {
    if (!organisation || !(organisation as any)._id) return;
    
    try {
      const [reviewsData, ratingData] = await Promise.all([
        publicApi.getReviewsForOrg((organisation as any)._id),
        publicApi.getOrgAvgRating((organisation as any)._id),
      ]);
      
      const reviews = Array.isArray(reviewsData) ? reviewsData : [];
      setTotalReviews(reviews.length);
      
      const avg = ratingData?.avg_rating || ratingData || null;
      setAvgRating(typeof avg === 'number' ? avg : null);
    } catch (error) {
      console.error("Failed to load rating data:", error);
    }
  };

  const now = new Date();
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date) > now
  );
  const pastEvents = events
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()); // Najnoviji prvo (od najskorijeg ka najstarijem)

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#121212]">
            Dobrodošli, {organisation?.name || organisation?.username}!
          </h1>
          {/* Rating Display */}
          {(avgRating !== null || totalReviews > 0) && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarSolidIcon className="w-5 h-5 text-mint" />
                <span className="text-base font-bold text-[#121212]">
                  {avgRating !== null ? avgRating.toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                ({totalReviews} {totalReviews === 1 ? 'ocena' : totalReviews < 5 ? 'ocene' : 'ocena'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Section - Two Columns: Applications & Create Event */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Left Column - Applications */}
        <div className="space-y-6">
          {/* Notification Banner */}
          {pendingApplications.length > 0 ? (
            <div className="bg-mint/20 border-2 border-mint rounded-xl p-6 relative animate-fade-in-up">
              <button
                onClick={() => {
                  setHasNewApplication(false);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-[#121212] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-mint rounded-xl animate-pulse">
                  <BellIcon className="w-6 h-6 text-[#121212]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#121212] mb-2">
                    {hasNewApplication ? "🔔 Nova prijava!" : ""} Imate {pendingApplications.length} {pendingApplications.length === 1 ? 'novu prijavu' : 'nove prijave'} na čekanju!
                  </h3>
                  <Link
                    to="/org/applications"
                    className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                    onClick={() => {
                      setHasNewApplication(false);
                    }}
                  >
                    Pregledaj prijave
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-6 animate-fade-in-up">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-200 rounded-xl">
                  <BellIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-600">
                    Trenutno nemate obaveštenja o novim prijavama
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Recent Applications */}
          {pendingApplications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-mint/20 rounded-xl">
                    <DocumentTextIcon className="w-5 h-5 text-mint" />
                  </div>
                  <h2 className="text-xl font-bold text-[#121212]">Najnovije prijave</h2>
                  <span className="bg-mint text-[#121212] px-3 py-1 rounded-full text-xs font-bold">
                    {pendingApplications.length}
                  </span>
                </div>
                <Link
                  to="/org/applications"
                  className="text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
                >
                  Vidi sve
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingApplications.slice(0, 4).map((app, index) => {
                  return (
                    <Link
                      key={index}
                      to="/org/applications"
                      className="card p-4 hover:shadow-lg transition-all border-l-4 border-mint group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-[#121212] group-hover:text-mint transition-colors mb-1">
                            {app.user_info?.first_name && app.user_info?.last_name
                              ? `${app.user_info.first_name} ${app.user_info.last_name}`
                              : app.user_info?.username || "Korisnik"}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">@{app.user_info?.username || "N/A"}</p>
                          <p className="text-xs font-semibold text-[#121212] line-clamp-1">{app.event_title}</p>
                        </div>
                        <span className="bg-cream text-[#121212] px-2 py-1 rounded-full text-xs font-semibold">
                          Na čekanju
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleString('sr-RS', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Create Event CTA */}
        <div className="flex items-center justify-center">
          <div className="card p-6 bg-gradient-to-br from-mint/30 via-cream/20 to-mint/10 border-2 border-mint/30 rounded-2xl w-full text-center h-full flex flex-col justify-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-mint rounded-full mb-4 animate-pulse-glow mx-auto">
              <SparklesIcon className="w-7 h-7 text-[#121212]" />
            </div>
            <h2 className="text-xl font-bold text-[#121212] mb-2">
              Imaš novi događaj?
            </h2>
            <p className="text-[#121212] font-medium leading-relaxed mb-5 text-sm">
              Podeli ga sa nama i umreži se sa novim volonterima! Kreiraj događaj i započni priču koja menja svet.
            </p>
            <Link
              to="/org/events/create"
              className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform px-6 py-3"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Kreiraj događaj
            </Link>
          </div>
        </div>
      </div>

      {/* My Events Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[#121212]">Moji događaji</h2>
            <Link
              to="/org/events"
              className="relative group flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-mint to-mint/80 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all animate-bounce cursor-pointer border-2 border-mint/50">
                <Cog6ToothIcon className="w-7 h-7 text-[#121212]" />
              </div>
              <span className="text-[#121212] bg-mint font-bold text-sm whitespace-nowrap px-3 py-1.5 rounded-lg">
                Upravljaj svojim događajima
              </span>
            </Link>
          </div>
          <Link
            to="/org/events"
            className="text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
          >
            Vidi sve događaje
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Upcoming Events */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <CalendarDaysIcon className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#121212]">Predstojeći događaji</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              {upcomingEvents.length}
            </span>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="card p-8 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nema predstojećih događaja</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event, index) => {
                const eventId = (event as any).id || (event as any)._id || event.title;
                return (
                <Link
                  key={index}
                  to={`/org/events/${eventId}/applications`}
                  className="card overflow-hidden group hover:shadow-xl transition-all border-2 border-transparent hover:border-mint"
                >
                  {event.image && (
                    <div className="overflow-hidden h-40">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 text-[#121212] group-hover:text-mint transition-colors line-clamp-1">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 font-medium">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDaysIcon className="w-4 h-4 text-mint" />
                      <span className="font-medium">{new Date(event.start_date).toLocaleDateString('sr-RS')}</span>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Events */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-xl">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-[#121212]">Prošli događaji</h3>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
              {pastEvents.length}
            </span>
          </div>
          {pastEvents.length === 0 ? (
            <div className="card p-8 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nema prošlih događaja</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event, index) => {
                const eventId = (event as any).id || (event as any)._id || event.title;
                return (
                <Link
                  key={index}
                  to={`/events/${encodeURIComponent(event.title)}`}
                  className="card overflow-hidden opacity-80 hover:opacity-100 transition-opacity group"
                >
                  {event.image && (
                    <div className="overflow-hidden h-40">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#121212] line-clamp-1 group-hover:text-mint transition-colors">{event.title}</h3>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Prošao
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 font-medium">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span className="font-medium">{new Date(event.end_date).toLocaleDateString('sr-RS')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#121212] bg-mint font-semibold text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg">
                        Pregledaj događaj
                        <ArrowRightIcon className="w-3 h-3" />
                      </span>
                      <Link
                        to={`/org/events/${eventId}/applications`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#121212] bg-mint hover:bg-[#B8D4C5] transition-all font-semibold text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                      >
                        Vidi prijave
                        <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

