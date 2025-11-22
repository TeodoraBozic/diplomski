import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, PencilIcon, UserCircleIcon, EnvelopeIcon, BriefcaseIcon, CalendarDaysIcon as CalIcon, SparklesIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { usersApi } from "../../api/users";
import { applicationsApi } from "../../api/applications";
import { publicApi } from "../../api/public";
import type { ApplicationPublic, EventPublic, UserDB } from "../../types/api";
import { 
  DocumentTextIcon, 
  CalendarDaysIcon, 
  MapPinIcon,
  CheckCircleIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";

export function Dashboard() {
  const [profile, setProfile] = useState<UserDB | null>(null);
  const [nearbyEvents, setNearbyEvents] = useState<EventPublic[]>([]);
  const [applications, setApplications] = useState<ApplicationPublic[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("Loading user dashboard data...");
      
      const [userData, events, apps] = await Promise.all([
        usersApi.getMe(),
        usersApi.getNearbyEvents(),
        applicationsApi.getMyApplications(),
      ]);

      console.log("User data loaded:", userData);
      console.log("Events loaded:", events);
      console.log("Applications loaded:", apps);

      setProfile(userData);
      setNearbyEvents(Array.isArray(events) ? events : []);
      setApplications(Array.isArray(apps) ? apps : []);

      // Load rating data
      if (userData && (userData as any)._id) {
        try {
          const userId = (userData as any)._id || (userData as any).id;
          console.log("Loading rating data for user ID:", userId);
          
          const [reviewsData, ratingData] = await Promise.all([
            publicApi.getReviewsForUser(userId),
            publicApi.getUserAvgRating(userId),
          ]);
          
          console.log("Reviews data:", reviewsData);
          console.log("Rating data (raw):", ratingData);
          console.log("Rating data (JSON):", JSON.stringify(ratingData, null, 2));
          console.log("Rating data type:", typeof ratingData);
          console.log("Rating data keys:", ratingData ? Object.keys(ratingData) : 'null/undefined');
          
          const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
          setReviews(reviewsArray);
          setTotalReviews(reviewsArray.length);
          
          const avg = ratingData?.avg_rating || ratingData || null;
          console.log("Extracted avg:", avg, "Type:", typeof avg);
          setAvgRating(typeof avg === 'number' ? avg : null);
        } catch (error) {
          console.error("Failed to load rating data:", error);
          // Don't block the page if rating fails
        }
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      console.error("Error details:", {
        message: error?.message,
        detail: error?.detail,
        status: error?.status,
        stack: error?.stack
      });
      // Show error toast
      if (error?.message) {
        // You might want to import showToast here if needed
        console.error("Error message:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const upcomingApplications = applications.filter(
    (app) => app.status === "accepted" || app.status === "pending"
  );

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Profile Header Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile?.profile_image ? (
              <img
                src={profile.profile_image}
                alt={profile.username}
                className="w-16 h-16 object-cover rounded-xl border-2 border-mint shadow-md"
              />
            ) : (
              <div className="w-16 h-16 bg-mint/20 rounded-xl flex items-center justify-center border-2 border-mint">
                <UserCircleIcon className="w-10 h-10 text-mint" />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#121212] mb-0.5">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">@{profile?.username}</span>
                {profile?.email && (
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
            to="/user/profile/edit"
            className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform text-sm px-4 py-2"
          >
            <PencilIcon className="w-4 h-4" />
            Izmeni
          </Link>
        </div>

        {/* Quick Profile Info - Compact Grid */}
        {(profile?.title || profile?.location || profile?.age || profile?.role) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
            {profile.title && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-mint/20 rounded-lg">
                  <BriefcaseIcon className="w-4 h-4 text-mint" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Zanimanje</p>
                  <p className="text-[#121212] font-semibold text-sm">{profile.title}</p>
                </div>
              </div>
            )}
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
            {profile.age && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cream/50 rounded-lg">
                  <CalIcon className="w-4 h-4 text-[#121212]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Godine</p>
                  <p className="text-[#121212] font-semibold text-sm">{profile.age}</p>
                </div>
              </div>
            )}
            {profile.role && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-mint/20 rounded-lg">
                  <UserCircleIcon className="w-4 h-4 text-mint" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Uloga</p>
                  <p className="text-[#121212] font-semibold text-sm">{profile.role}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* About, Skills, Experience - Compact Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          {/* About Section */}
          {profile?.about && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-mint/20 rounded-lg">
                  <UserCircleIcon className="w-4 h-4 text-mint" />
                </div>
                <h3 className="text-sm font-bold text-[#121212] uppercase tracking-wide">O meni</h3>
              </div>
              <p className="text-[#121212] text-sm leading-relaxed font-medium pl-7">{profile.about}</p>
            </div>
          )}

          {/* Experience Section */}
          {profile?.experience && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-mint/20 rounded-lg">
                  <BriefcaseIcon className="w-4 h-4 text-mint" />
                </div>
                <h3 className="text-sm font-bold text-[#121212] uppercase tracking-wide">Iskustvo</h3>
              </div>
              <p className="text-[#121212] text-sm leading-relaxed font-medium pl-7">{profile.experience}</p>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-mint/20 rounded-lg">
                <SparklesIcon className="w-4 h-4 text-mint" />
              </div>
              <h3 className="text-sm font-bold text-[#121212] uppercase tracking-wide">Veštine</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-mint text-[#121212] px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Statistics - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => scrollToSection('my-applications')}
          className="card p-5 bg-gradient-to-br from-mint to-[#B8D4C5] border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/30 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-[#121212]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Moje prijave</h2>
                <p className="text-2xl font-extrabold text-[#121212]">{applications.length}</p>
              </div>
            </div>
          </div>
        </button>
        <button
          onClick={() => scrollToSection('my-applications')}
          className="card p-5 bg-gradient-to-br from-cream to-white border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/20 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Predstojeći događaji</h2>
                <p className="text-2xl font-extrabold text-mint">{upcomingApplications.length}</p>
              </div>
            </div>
          </div>
        </button>
        <button
          onClick={() => scrollToSection('nearby-events')}
          className="card p-5 bg-gradient-to-br from-mint/20 to-cream/30 border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/30 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Događaji u blizini</h2>
                <p className="text-2xl font-extrabold text-[#121212]">{nearbyEvents.length}</p>
              </div>
            </div>
          </div>
        </button>
        {(avgRating !== null || totalReviews > 0) && (
          <button
            onClick={() => scrollToSection('my-reviews')}
            className="card p-5 bg-gradient-to-br from-cream/50 to-mint/20 border-2 border-mint/30 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mint/30 rounded-lg">
                  <StarIcon className="w-5 h-5 text-mint" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[#121212] uppercase tracking-wide mb-1">Moje ocene</h2>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-extrabold text-[#121212]">
                      {avgRating !== null ? avgRating.toFixed(1) : "N/A"}
                    </p>
                    {totalReviews > 0 && (
                      <span className="text-xs text-gray-600">
                        ({totalReviews})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column - My Applications */}
        <div id="my-applications" className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="w-5 h-5 text-mint" />
            <h2 className="text-xl font-bold text-[#121212]">Moje prijave</h2>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#121212] font-medium">Još nema prijava</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {applications.map((app, index) => (
                <Link
                  key={index}
                  to="/user/applications"
                  className="block card p-4 hover:shadow-lg transition-all border-l-4 border-mint group"
                >
                  <h3 className="font-bold text-lg mb-2 text-[#121212] group-hover:text-mint transition-colors line-clamp-1">
                    {app.event_title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === "accepted"
                          ? "bg-mint text-[#121212]"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : app.status === "pending"
                          ? "bg-cream text-[#121212]"
                          : "bg-gray-200 text-[#121212]"
                      }`}
                    >
                      {app.status === "accepted" ? "Prihvaćena" : app.status === "rejected" ? "Odbijena" : app.status === "pending" ? "Na čekanju" : app.status === "cancelled" ? "Otkazana" : app.status}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-mint group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Nearby Events */}
        <div id="nearby-events" className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon className="w-5 h-5 text-mint" />
            <h2 className="text-xl font-bold text-[#121212]">Događaji koji će ti se možda svideti</h2>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint mb-3"></div>
              <p className="text-[#121212] font-medium">Učitavanje...</p>
            </div>
          ) : nearbyEvents.length === 0 ? (
            <div className="text-center py-8">
              <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#121212] font-medium">Nema događaja u blizini</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {nearbyEvents.slice(0, 6).map((event, index) => (
                <Link
                  key={index}
                  to={`/events/${event.title}`}
                  className="block card overflow-hidden group hover:shadow-lg transition-all"
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
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-[#121212] group-hover:text-mint transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-[#121212] text-sm mb-2 line-clamp-2 font-medium">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#121212]">
                      <MapPinIcon className="w-4 h-4 text-mint" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section - Moje ocene */}
      {reviews.length > 0 && (
        <div id="my-reviews" className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-mint/20 rounded-xl">
              <StarIcon className="w-8 h-8 text-mint" />
            </div>
            <h2 className="text-3xl font-bold text-[#121212]">Moje ocene</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review, index) => {
              // Backend vraća: event_name, organisation_name, rating, comment
              const reviewId = review.id || review._id || review.review_id || `review-${index}`;
              const organisationName = review.organisation_name || review.organisation_info?.name || review.org_name || null;
              const eventName = review.event_name || review.event_info?.title || review.event?.title || null;
              const rating = review.rating || 0;
              const comment = review.comment || review.text || null;
              const createdAt = review.created_at || review.createdAt || null;
              
              return (
                <div key={reviewId} className="card p-6 hover:shadow-lg transition-all border-l-4 border-mint">
                  {/* Organisation Info Section */}
                  {organisationName && (
                    <div className="mb-4 p-4 bg-cream/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        {review.organisation_info?.logo ? (
                          <img
                            src={review.organisation_info.logo}
                            alt={organisationName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-mint flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center border-2 border-mint flex-shrink-0">
                            <BuildingOffice2Icon className="w-6 h-6 text-mint" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-base font-bold text-[#121212] mb-1">
                            {organisationName}
                          </p>
                          {review.organisation_info?.username && (
                            <p className="text-sm text-gray-600 font-medium">
                              @{review.organisation_info.username}
                            </p>
                          )}
                          {review.organisation_info?.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{review.organisation_info.location}</span>
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
                      <Link
                        to={`/events/${encodeURIComponent(eventName)}`}
                        className="text-sm font-bold text-[#121212] hover:text-mint transition-colors block mb-1"
                      >
                        {eventName}
                      </Link>
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
    </div>
  );
}

