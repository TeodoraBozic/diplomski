import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { organisationsApi } from "../../api/organisations";
import { eventsApi } from "../../api/events";
import { publicApi } from "../../api/public";
import type { OrganisationPublic } from "../../types/api";
import { ChartBarIcon, CalendarDaysIcon, PencilIcon, BuildingOfficeIcon, MapPinIcon, PhoneIcon, GlobeAltIcon, EnvelopeIcon, StarIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

export function Profile() {
  const { organisation } = useAuth();
  const [profile, setProfile] = useState<OrganisationPublic | null>(organisation);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadEventsAndStats();
    loadRatingData();
  }, []);

  const loadProfile = async () => {
    try {
      const orgData = await organisationsApi.getMe();
      setProfile(orgData);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventsAndStats = async () => {
    try {
      const myEvents = await eventsApi.getMyEvents();
      setEvents(myEvents);

      if (organisation?.username) {
        try {
          const orgStats = await publicApi.getOrgStats(organisation.username);
          setStats(orgStats);
        } catch (error) {
          console.error("Failed to load stats:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const loadRatingData = async () => {
    if (!organisation || !(organisation as any)._id) return;
    
    try {
      const [reviewsData, ratingData] = await Promise.all([
        publicApi.getReviewsForOrg((organisation as any)._id),
        publicApi.getOrgAvgRating((organisation as any)._id),
      ]);
      
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
      setReviews(reviewsArray);
      setTotalReviews(reviewsArray.length);
      
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
  const pastEvents = events.filter((e) => new Date(e.end_date) < now);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-8">Profil nije pronađen</div>;
  }

  return (
    <div className="animate-fade-in-up">
      {/* Profile Header Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={profile.name}
                className="w-16 h-16 object-cover rounded-xl border-2 border-mint shadow-md"
              />
            ) : (
              <div className="w-16 h-16 bg-mint/20 rounded-xl flex items-center justify-center border-2 border-mint">
                <BuildingOfficeIcon className="w-10 h-10 text-mint" />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#121212] mb-0.5">
                {profile.name}
              </h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">@{profile.username}</span>
                {profile.email && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <EnvelopeIcon className="w-3.5 h-3.5" />
                    <span className="text-xs">{profile.email}</span>
                  </div>
                )}
              </div>
              {/* Rating Display */}
              {(avgRating !== null || totalReviews > 0) && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <StarSolidIcon className="w-4 h-4 text-mint" />
                    <span className="text-sm font-bold text-[#121212]">
                      {avgRating !== null ? avgRating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    ({totalReviews} {totalReviews === 1 ? 'ocena' : totalReviews < 5 ? 'ocene' : 'ocena'})
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link
            to="/org/profile/edit"
            className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform text-sm px-4 py-2"
          >
            <PencilIcon className="w-4 h-4" />
            Izmeni
          </Link>
        </div>

        {/* Quick Organization Info - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
          {profile.location && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <MapPinIcon className="w-4 h-4 text-mint" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Lokacija</p>
                <p className="text-[#121212] font-semibold text-sm">{profile.location}</p>
              </div>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <PhoneIcon className="w-4 h-4 text-mint" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Telefon</p>
                <p className="text-[#121212] font-semibold text-sm">{profile.phone}</p>
              </div>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <GlobeAltIcon className="w-4 h-4 text-mint" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Website</p>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#121212] font-semibold text-sm hover:text-mint transition-colors"
                >
                  {profile.website.length > 20 ? profile.website.substring(0, 20) + '...' : profile.website}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cream/50 rounded-lg">
              <BuildingOfficeIcon className="w-4 h-4 text-[#121212]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tip</p>
              <p className="text-[#121212] font-semibold text-sm">
                {profile.org_type === "official" ? "Zvanična" : profile.org_type === "informal" ? "Neformalna" : "N/A"}
              </p>
            </div>
          </div>
          {profile.status && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  profile.status === "approved" ? "bg-green-500" : 
                  profile.status === "pending" ? "bg-yellow-500" : 
                  "bg-red-500"
                }`}></div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  profile.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : profile.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {profile.status === "approved" ? "Odobreno" : profile.status === "pending" ? "Na čekanju" : "Odbijeno"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        {profile.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <BuildingOfficeIcon className="w-4 h-4 text-mint" />
              </div>
              <h3 className="text-sm font-bold text-[#121212] uppercase tracking-wide">O organizaciji</h3>
            </div>
            <p className="text-[#121212] text-sm leading-relaxed font-medium pl-7">
              {profile.description}
            </p>
          </div>
        )}
      </div>

      {/* Reviews Section - Before Statistics */}
      {reviews.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-mint/20 rounded-xl">
              <StarIcon className="w-8 h-8 text-mint" />
            </div>
            <h2 className="text-3xl font-bold text-[#121212]">Ocene i komentari</h2>
            {avgRating !== null && (
              <div className="flex items-center gap-2 bg-mint/20 px-4 py-2 rounded-full">
                <StarIcon className="w-6 h-6 text-mint fill-mint" />
                <span className="text-xl font-bold text-[#121212]">
                  {avgRating.toFixed(1)}
                </span>
                {totalReviews > 0 && (
                  <span className="text-sm text-gray-600">
                    ({totalReviews} {totalReviews === 1 ? 'ocena' : totalReviews < 5 ? 'ocene' : 'ocena'})
                  </span>
                )}
              </div>
            )}
          </div>

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
                <div key={reviewId} className="card p-6 hover:shadow-lg transition-all border-l-4 border-mint">
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
                      <div className="flex items-center gap-2">
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
                        <span className="text-xl font-bold text-[#121212] ml-2">
                          {rating}/5
                        </span>
                      </div>
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
                      <p className="text-[#121212] text-base leading-relaxed font-medium">
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

      {/* Statistics - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 bg-gradient-to-br from-mint to-[#B8D4C5] border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/30 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-[#121212]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Ukupno događaja</h2>
                <p className="text-2xl font-extrabold text-[#121212]">{events.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-cream to-white border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100/50 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Predstojeći</h2>
                <p className="text-2xl font-extrabold text-green-600">{upcomingEvents.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-mint/20 to-cream/30 border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100/50 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Prošli</h2>
                <p className="text-2xl font-extrabold text-[#121212]">{pastEvents.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {stats && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-mint" />
            <h2 className="text-xl font-bold text-[#121212]">Statistika</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.total_events !== undefined && (
              <div className="bg-cream/30 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Ukupno događaja</div>
                <div className="text-2xl font-bold text-mint">{stats.total_events || 0}</div>
              </div>
            )}
            {stats.total_applications !== undefined && (
              <div className="bg-mint/20 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Ukupno prijava</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total_applications || 0}</div>
              </div>
            )}
            {stats.accepted_volunteers !== undefined && (
              <div className="bg-green-100/50 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Prihvaćeni volonteri</div>
                <div className="text-2xl font-bold text-green-600">{stats.accepted_volunteers || 0}</div>
              </div>
            )}
            {stats.rejected_or_cancelled !== undefined && (
              <div className="bg-red-100/50 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Odbijene/Otkazane</div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected_or_cancelled || 0}</div>
              </div>
            )}
            {stats.avg_applications_per_event !== undefined && (
              <div className="bg-purple-100/50 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Prosek prijava/događaj</div>
                <div className="text-2xl font-bold text-purple-600">
                  {typeof stats.avg_applications_per_event === 'number'
                    ? stats.avg_applications_per_event.toFixed(1)
                    : stats.avg_applications_per_event || 0}
                </div>
              </div>
            )}
            {stats.active_events !== undefined && (
              <div className="bg-green-100/50 p-4 rounded-xl">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Aktivni događaji</div>
                <div className="text-2xl font-bold text-green-600">{stats.active_events || 0}</div>
              </div>
            )}
            {stats.last_event && (
              <div className="bg-cream/30 p-4 rounded-xl md:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 text-mint" />
                  <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Poslednji događaj</div>
                </div>
                <div className="font-bold text-[#121212] text-base mb-1">
                  {stats.last_event.title || "N/A"}
                </div>
                {stats.last_event.start_date && (
                  <div className="text-sm text-gray-600">
                    {new Date(stats.last_event.start_date).toLocaleDateString('sr-RS')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

