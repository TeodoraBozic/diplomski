import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../../api/public";
import type { OrganisationPublic, EventPublic } from "../../types/api";
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  BuildingOffice2Icon,
  ArrowLeftIcon,
  ChartBarIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  ChevronDownIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

export function OrganisationDetail() {
  const { username } = useParams<{ username: string }>();
  const [organisation, setOrganisation] = useState<OrganisationPublic | null>(null);
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [eventHistory, setEventHistory] = useState<EventPublic[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showReviewsDropdown, setShowReviewsDropdown] = useState(false);

  useEffect(() => {
    if (username) {
      loadData();
    }
  }, [username]);

  // Zatvori dropdown kada se klikne van njega
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showReviewsDropdown && !target.closest('.reviews-dropdown-container')) {
        setShowReviewsDropdown(false);
      }
    };

    if (showReviewsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showReviewsDropdown]);

  const loadData = async () => {
    try {
      // API vraća niz organizacija po username-u
      const orgs = await publicApi.getOrganisationByUsername(username!);
      
      if (orgs.length > 0) {
        const org = orgs[0];
        setOrganisation(org);
        
        // Učitaj statistiku - koristi username (možda backend očekuje username za stats)
        try {
          const orgStats = await publicApi.getOrgStats(username!);
          setStats(orgStats);
        } catch (error) {
          console.error("Failed to load stats:", error);
        }

        // Učitaj događaje - koristi username
        try {
          const orgEvents = await publicApi.getEventsByOrg(username!);
          setEvents(orgEvents);
        } catch (error) {
          console.error("Failed to load events:", error);
          setEvents([]);
        }

        // Učitaj istoriju događaja - koristi orgId
        try {
          const orgId = (org as any)._id || (org as any).id;
          if (orgId) {
            const history = await publicApi.getOrgHistory(orgId);
            setEventHistory(Array.isArray(history) ? history : []);
          }
        } catch (error) {
          console.error("Failed to load event history:", error);
          setEventHistory([]);
        }

        // Učitaj review-e - koristi orgId ili username
        try {
          const orgId = (org as any)._id || (org as any).id;
          console.log("Loading reviews for org:", { orgId, username, org });
          
          // Pokušaj prvo sa orgId, pa sa username ako orgId ne postoji
          let orgReviews = null;
          if (orgId) {
            try {
              orgReviews = await publicApi.getReviewsForOrg(orgId);
              console.log("Reviews loaded with orgId:", orgReviews);
            } catch (err) {
              console.warn("Failed to load reviews with orgId, trying username:", err);
              // Pokušaj sa username-om
              try {
                orgReviews = await publicApi.getReviewsForOrg(username!);
                console.log("Reviews loaded with username:", orgReviews);
              } catch (err2) {
                console.error("Failed to load reviews with username:", err2);
              }
            }
          } else {
            // Pokušaj sa username-om ako nema orgId
            try {
              orgReviews = await publicApi.getReviewsForOrg(username!);
              console.log("Reviews loaded with username (no orgId):", orgReviews);
            } catch (err) {
              console.error("Failed to load reviews with username:", err);
            }
          }
          
          if (orgReviews) {
            const reviewsArray = Array.isArray(orgReviews) ? orgReviews : [];
            console.log("Reviews loaded with full data:", reviewsArray);
            console.log("Reviews count:", reviewsArray.length);
            if (reviewsArray.length > 0) {
              console.log("First review structure:", reviewsArray[0]);
            }
            setReviews(reviewsArray);
          } else {
            console.log("No reviews found");
            setReviews([]);
          }
        } catch (error) {
          console.error("Failed to load reviews:", error);
          setReviews([]);
        }
      } else {
        console.warn("No organisation found with username:", username);
      }
    } catch (error: any) {
      console.error("Failed to load organisation:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  if (!organisation) {
    return <div className="text-center py-8">Organizacija nije pronađena</div>;
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.start_date) > now);
  const pastEvents = events
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  
  // Kada je showAllEvents true, prikaži sve događaje (predstojeći prvo, pa prošli)
  const displayedEvents = showAllEvents 
    ? [...upcomingEvents, ...pastEvents]
    : upcomingEvents;

  const isEventPast = (event: EventPublic) => {
    return new Date(event.end_date) < now;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link 
        to="/organisations" 
        className="flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg transition-all mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na organizacije
      </Link>

      {/* Hero Section - Ime organizacije na vrhu */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
          {organisation.logo && (
            <div className="flex-shrink-0">
              <img
                src={organisation.logo}
                alt={organisation.name}
                className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-3xl border-4 border-mint bg-white p-4 shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212] mb-3">
              {organisation.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-600 font-medium text-lg">@{organisation.username}</span>
              <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold">
                {organisation.org_type === "official" ? "Zvanična organizacija" : "Neformalna grupa"}
              </span>
              {stats?.avg_rating !== undefined && stats?.avg_rating !== null && (
                <div className="flex items-center gap-2 bg-cream/50 px-4 py-2 rounded-full">
                  <HeartIcon className="w-5 h-5 text-mint fill-mint" />
                  <span className="text-lg font-bold text-[#121212]">
                    {typeof stats.avg_rating === 'number' ? stats.avg_rating.toFixed(1) : stats.avg_rating}
                  </span>
                  {stats?.total_reviews && stats.total_reviews > 0 && (
                    <span className="text-sm text-gray-600">
                      ({stats.total_reviews} {stats.total_reviews === 1 ? 'ocena' : stats.total_reviews < 5 ? 'ocene' : 'ocena'})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Opis organizacije */}
      {organisation.description && (
        <div className="card p-8 mb-8 bg-cream/30 border-2 border-mint/30">
          <div className="flex items-start gap-3 mb-4">
            <BuildingOffice2Icon className="w-6 h-6 text-mint flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold text-[#121212]">O organizaciji</h2>
          </div>
          <p className="text-[#121212] text-lg leading-relaxed font-medium pl-9">
            {organisation.description}
          </p>
        </div>
      )}

      {/* Kontakt informacije */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {organisation.location && (
          <div className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-mint">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-mint/20 rounded-xl">
                <MapPinIcon className="w-6 h-6 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Lokacija</h3>
                <p className="text-[#121212] text-lg font-medium">{organisation.location}</p>
              </div>
            </div>
          </div>
        )}

        {organisation.email && (
          <div className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-cream">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cream/50 rounded-xl">
                <EnvelopeIcon className="w-6 h-6 text-[#121212]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</h3>
                <a 
                  href={`mailto:${organisation.email}`}
                  className="text-[#121212] text-lg font-medium hover:text-mint transition-colors"
                >
                  {organisation.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {organisation.phone && (
          <div className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-mint">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-mint/20 rounded-xl">
                <PhoneIcon className="w-6 h-6 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Telefon</h3>
                <a 
                  href={`tel:${organisation.phone}`}
                  className="text-[#121212] text-lg font-medium hover:text-mint transition-colors"
                >
                  {organisation.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {organisation.website && (
          <div className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-cream">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cream/50 rounded-xl">
                <GlobeAltIcon className="w-6 h-6 text-[#121212]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Veb sajt</h3>
                <a
                  href={organisation.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#121212] text-lg font-medium hover:text-mint transition-colors break-all"
                >
                  {organisation.website}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="card p-8 mb-8 bg-gradient-to-br from-cream/50 to-white border-2 border-mint/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/20 rounded-xl">
                <ChartBarIcon className="w-6 h-6 text-mint" />
              </div>
              <h3 className="text-2xl font-bold text-[#121212]">Statistika i ocene</h3>
            </div>
            {reviews.length > 0 && (
              <div className="relative reviews-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowReviewsDropdown(!showReviewsDropdown)}
                  className="flex items-center gap-2 bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#B8D4C5] transition-colors"
                >
                  <span>Ocene i komentari</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showReviewsDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showReviewsDropdown && (
                  <div className="absolute right-0 mt-2 w-[500px] max-h-[600px] overflow-y-auto bg-white rounded-xl shadow-2xl border-2 border-mint/30 z-10 p-6 reviews-dropdown-container">
                    <div className="space-y-6">
                      {reviews.map((review, index) => {
                        // Backend vraća: event_name, user_name, organisation_name, rating, comment
                        const reviewId = review.id || review._id || review.review_id || `review-${index}`;
                        const userName = review.user_name || review.user_info?.first_name || review.user_info?.username || "Korisnik";
                        const eventName = review.event_name || review.event_info?.title || review.event?.title || null;
                        const organisationName = review.organisation_name || review.organisation_info?.name || null;
                        const rating = review.rating || 0;
                        const comment = review.comment || review.text || null;
                        const createdAt = review.created_at || review.createdAt || null;
                        
                        return (
                          <div key={reviewId} className="border-b border-gray-200 pb-6 last:border-0">
                            {/* User Info Section */}
                            {userName && (
                              <div className="mb-4 p-4 bg-cream/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                  {review.user_info?.profile_image ? (
                                    <img
                                      src={review.user_info.profile_image}
                                      alt={userName}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-mint flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center border-2 border-mint flex-shrink-0">
                                      <UserCircleIcon className="w-6 h-6 text-mint" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-base font-bold text-[#121212] mb-1">
                                      {userName}
                                    </p>
                                    {review.user_info?.username && (
                                      <p className="text-sm text-gray-600 font-medium">
                                        @{review.user_info.username}
                                      </p>
                                    )}
                                    {review.user_info?.title && (
                                      <p className="text-sm text-gray-700 font-medium mt-1">
                                        {review.user_info.title}
                                      </p>
                                    )}
                                    {review.user_info?.location && (
                                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{review.user_info.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Event Info Section */}
                            {eventName && (
                              <div className="mb-4 p-3 bg-mint/10 rounded-xl border border-mint/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarDaysIcon className="w-4 h-4 text-mint" />
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Događaj</span>
                                </div>
                                <p className="text-sm font-bold text-[#121212] mb-1">
                                  {eventName}
                                </p>
                                {review.event_info?.location && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                    <MapPinIcon className="w-3 h-3" />
                                    <span>{review.event_info.location}</span>
                                  </div>
                                )}
                                {review.event_info?.start_date && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                    <CalendarDaysIcon className="w-3 h-3" />
                                    <span>
                                      {new Date(review.event_info.start_date).toLocaleDateString('sr-RS', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                                {review.event_info?.category && (
                                  <span className="inline-block bg-mint text-[#121212] px-2 py-0.5 rounded-full text-xs font-semibold mt-1">
                                    {review.event_info.category}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Organisation Name */}
                            {organisationName && (
                              <div className="mb-4 p-2 bg-mint/5 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">
                                  Organizacija: <span className="font-bold text-[#121212]">{organisationName}</span>
                                </p>
                              </div>
                            )}
                            
                            {/* Rating Section */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-6 h-6 ${
                                      i < rating
                                        ? "text-mint fill-mint"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-lg font-bold text-[#121212] ml-1">
                                  {rating}/5
                                </span>
                              </div>
                              {createdAt && (
                                <span className="text-sm text-gray-500 font-medium">
                                  {new Date(createdAt).toLocaleDateString('sr-RS', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                            
                            {/* Comment Section */}
                            {comment && (
                              <div className="mt-4 p-4 bg-white border-l-4 border-mint rounded-r-lg">
                                <p className="text-base text-[#121212] leading-relaxed font-medium">
                                  {comment}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.total_events !== undefined && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Button clicked, current state:", showAllEvents);
                  setShowAllEvents(!showAllEvents);
                }}
                className={`p-5 rounded-xl border transition-all group w-full text-left cursor-pointer ${
                  showAllEvents 
                    ? "bg-mint/20 border-mint shadow-md" 
                    : "bg-white border-mint/30 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDaysIcon className="w-5 h-5 text-mint group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ukupno događaja</div>
                </div>
                <div className="text-3xl font-bold text-[#121212]">{stats.total_events || 0}</div>
                {showAllEvents && (
                  <div className="text-xs text-[#121212] bg-mint font-semibold mt-2 px-2 py-1 rounded-lg inline-block">Klikni da sakriješ prošle</div>
                )}
              </button>
            )}
            {stats.upcoming_events !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-mint group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Predstojeći</div>
                </div>
                <div className="text-3xl font-bold text-mint">{stats.upcoming_events || 0}</div>
              </div>
            )}
            {stats.past_events !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Prošli</div>
                </div>
                <div className="text-3xl font-bold text-gray-600">{stats.past_events || 0}</div>
              </div>
            )}
            {stats.total_applications !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className="w-5 h-5 text-mint group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ukupno prijava</div>
                </div>
                <div className="text-3xl font-bold text-[#121212]">{stats.total_applications || 0}</div>
              </div>
            )}
            {stats.accepted_applications !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="w-5 h-5 text-mint group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Prihvaćene</div>
                </div>
                <div className="text-3xl font-bold text-mint">{stats.accepted_applications || 0}</div>
              </div>
            )}
            {stats.pending_applications !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-cream group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Na čekanju</div>
                </div>
                <div className="text-3xl font-bold text-[#121212]">{stats.pending_applications || 0}</div>
              </div>
            )}
            {stats.avg_rating !== undefined && stats.avg_rating !== null && stats.total_reviews !== undefined && (
              <div className="bg-white p-5 rounded-xl border border-mint/30 hover:shadow-md transition-all group col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5 text-cream group-hover:scale-110 transition-transform" />
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ocene</div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-bold text-[#121212]">
                        {typeof stats.avg_rating === 'number' ? stats.avg_rating.toFixed(1) : stats.avg_rating}
                      </div>
                      <div className="text-lg text-gray-600">
                        / 5.0
                      </div>
                      <div className="text-sm text-gray-500">
                        ({stats.total_reviews || 0} {stats.total_reviews === 1 ? 'ocena' : stats.total_reviews < 5 ? 'ocene' : 'ocena'})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 bg-mint/20 rounded-xl">
            <CalendarDaysIcon className="w-8 h-8 text-mint" />
          </div>
          <h2 className="text-4xl font-bold text-[#121212]">
            {showAllEvents ? "Svi događaji" : "Događaji"}
          </h2>
          <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-bold">
            {displayedEvents.length}
          </span>
        </div>
        {displayedEvents.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-[#121212] text-lg font-medium">
              {showAllEvents ? "Još nema događaja" : "Nema predstojećih događaja"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedEvents.map((event, index) => {
              const past = isEventPast(event);
              return (
                <Link
                  key={index}
                  to={`/events/${encodeURIComponent(event.title)}`}
                  className={`card overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ${
                    past ? "opacity-70" : ""
                  }`}
                >
                  {event.image && (
                    <div className="overflow-hidden h-56">
                      <img
                        src={event.image}
                        alt={event.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          past ? "grayscale" : "group-hover:scale-110"
                        }`}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-bold text-xl mb-3 line-clamp-2 transition-colors ${
                        past ? "text-gray-600" : "text-[#121212] group-hover:text-mint"
                      }`}>
                        {event.title}
                      </h3>
                      {past && (
                        <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
                          Prošao
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-4 line-clamp-2 font-medium leading-relaxed ${
                      past ? "text-gray-500" : "text-[#121212]"
                    }`}>
                      {event.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center gap-2 text-sm ${
                        past ? "text-gray-500" : "text-[#121212]"
                      }`}>
                        <MapPinIcon className={`w-4 h-4 ${past ? "text-gray-400" : "text-mint"}`} />
                        <span className="font-medium">{event.location}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${
                        past ? "text-gray-500" : "text-[#121212]"
                      }`}>
                        <CalendarDaysIcon className={`w-4 h-4 ${past ? "text-gray-400" : "text-mint"}`} />
                        <span className="font-medium">
                          {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold ${
                      past 
                        ? "bg-gray-200 text-gray-600" 
                        : "bg-mint text-[#121212]"
                    }`}>
                      {event.category}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Istorija događaja */}
      {eventHistory.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-mint/20 rounded-xl">
              <CalendarDaysIcon className="w-8 h-8 text-mint" />
            </div>
            <h2 className="text-4xl font-bold text-[#121212]">Istorija događaja</h2>
            <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-bold">
              {eventHistory.length}
            </span>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {eventHistory.map((event, index) => {
              return (
                <Link
                  key={index}
                  to={`/events/${encodeURIComponent(event.title)}`}
                  className="block card overflow-hidden group hover:shadow-lg transition-all opacity-70 hover:opacity-100"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {event.image && (
                      <div className="md:w-48 h-48 flex-shrink-0 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <h3 className="font-bold text-xl mb-2 text-[#121212] group-hover:text-mint transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm mb-4 line-clamp-2 font-medium leading-relaxed text-gray-700">
                        {event.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#121212]">
                          <MapPinIcon className="w-4 h-4 text-mint" />
                          <span className="font-medium">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#121212]">
                          <CalendarDaysIcon className="w-4 h-4 text-mint" />
                          <span className="font-medium">
                            {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                            {event.end_date && (
                              <> - {new Date(event.end_date).toLocaleDateString('sr-RS', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })}</>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="inline-block px-4 py-2 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                        {event.category}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

