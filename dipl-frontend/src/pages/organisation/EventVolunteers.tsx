import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsApi } from "../../api/applications";
import { publicApi } from "../../api/public";
import { reviewsApi } from "../../api/reviews";
import type { ApplicationPublic, EventPublic, ReviewOrgToUserIn } from "../../types/api";
import { showToast } from "../../components/Toast";
import { 
  UserCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  InformationCircleIcon, 
  StarIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  SparklesIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export function EventVolunteers() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [volunteers, setVolunteers] = useState<ApplicationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<Record<string, any> | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userAvgRating, setUserAvgRating] = useState<number | null>(null);
  const [userTotalReviews, setUserTotalReviews] = useState<number>(0);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<ApplicationPublic | null>(null);
  const [reviewFormData, setReviewFormData] = useState<ReviewOrgToUserIn>({
    rating: 5,
    comment: "",
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [fetchingUserId, setFetchingUserId] = useState(false);
  const [userIdMap, setUserIdMap] = useState<Map<string, string>>(new Map());
  const [reviewedUsers, setReviewedUsers] = useState<Set<string>>(new Set()); // Set of user IDs that have been reviewed

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadVolunteers();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventData = await publicApi.getEventById(eventId!);
      setEvent(eventData);
    } catch (error) {
      console.error("Failed to load event:", error);
      showToast("Greška pri učitavanju događaja", "error");
    }
  };

  const loadVolunteers = async () => {
    try {
      console.log("Loading volunteers for eventId:", eventId);
      const apps = await applicationsApi.getEventApplications(eventId!);
      console.log("All applications from API:", apps);
      
      if (!apps || !Array.isArray(apps)) {
        console.error("Invalid response from API:", apps);
        showToast("Neispravan odgovor od servera", "error");
        setLoading(false);
        return;
      }
      
      if (apps.length > 0) {
        console.log("First application structure:", apps[0]);
        console.log("First application user_info:", apps[0].user_info);
        console.log("First application user_info keys:", Object.keys(apps[0].user_info || {}));
        console.log("First application user_info.id:", apps[0].user_info?.id);
        console.log("First application user_info._id:", apps[0].user_info?._id);
        console.log("First application user_info.id type:", typeof apps[0].user_info?.id);
      }
      
      // Filter only accepted applications (volunteers)
      const acceptedApps = apps.filter(app => app.status === "accepted");
      console.log("Accepted apps count:", acceptedApps.length);
      
      // Build userIdMap and enrich user_info with full user data (including profile_image)
      const newUserIdMap = new Map<string, string>();
      const enrichedApps = await Promise.all(acceptedApps.map(async (app) => {
        if (!app.user_info?.username) return app;
        
        const userId = getUserId(app);
        let userIdStr: string | null = null;
        
        if (userId) {
          userIdStr = typeof userId === 'object' ? String(userId) : String(userId);
          newUserIdMap.set(app.user_info.username, userIdStr);
          console.log(`Mapped ${app.user_info.username} -> ${userIdStr}`);
        } else {
          // Fetch full user data to get userId and profile_image
          console.log(`No userId found for ${app.user_info.username}, fetching full user data...`);
          try {
            const userData = await publicApi.getUserByUsername(app.user_info.username);
            const fetchedUserId = (userData as any)._id || (userData as any).id;
            if (fetchedUserId) {
              userIdStr = typeof fetchedUserId === 'object' ? String(fetchedUserId) : String(fetchedUserId);
              newUserIdMap.set(app.user_info.username, userIdStr);
              
              // Enrich user_info with full user data (including profile_image)
              if (app.user_info) {
                app.user_info._id = userIdStr;
                app.user_info.id = userIdStr;
                app.user_info.profile_image = userData.profile_image || app.user_info.profile_image;
                app.user_info.first_name = userData.first_name || app.user_info.first_name;
                app.user_info.last_name = userData.last_name || app.user_info.last_name;
                // Keep other existing fields, but add missing ones from full user data
                Object.assign(app.user_info, {
                  ...userData,
                  _id: userIdStr,
                  id: userIdStr
                });
              }
              console.log(`Fetched and enriched user data for ${app.user_info.username}`);
            }
          } catch (error) {
            console.error(`Failed to fetch user data for ${app.user_info.username}:`, error);
            // Don't throw, just log - we can still show the volunteer
          }
        }
        
        return app;
      }));
      
      setVolunteers(enrichedApps);
      setUserIdMap(newUserIdMap);
      console.log("Final userIdMap:", Array.from(newUserIdMap.entries()));
      
      // Check which users have already been reviewed for this event
      await loadReviewedUsers(acceptedApps, newUserIdMap);
    } catch (error: any) {
      console.error("Failed to load volunteers:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      
      let errorMessage = "Greška pri učitavanju volontera";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail) && error.detail.length > 0) {
          errorMessage = error.detail[0]?.msg || error.detail[0] || errorMessage;
        }
      } else if (error?.status === 500) {
        errorMessage = "Greška na serveru (500). Proverite backend logove.";
      }
      
      console.error("Final error message:", errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const openUserInfoModal = async (userInfo: Record<string, any>) => {
    try {
      if (userInfo?.username) {
        setShowUserInfoModal(true);
        setSelectedUserInfo(userInfo);
        setLoadingUserInfo(true);
        setLoadingUserReviews(true);
        
        try {
          const fullUserInfo = await publicApi.getUserByUsername(userInfo.username);
          setSelectedUserInfo(fullUserInfo);
          
          // Load user reviews and rating
          const userId = (fullUserInfo as any)._id || (fullUserInfo as any).id || (userInfo as any)._id || (userInfo as any).id;
          if (userId) {
            try {
              const [reviewsData, ratingData] = await Promise.all([
                publicApi.getReviewsForUser(userId),
                publicApi.getUserAvgRating(userId),
              ]);
              
              const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
              setUserReviews(reviewsArray);
              setUserTotalReviews(reviewsArray.length);
              
              const avg = ratingData?.avg_rating || ratingData || null;
              setUserAvgRating(typeof avg === 'number' ? avg : null);
            } catch (error) {
              console.error("Failed to load user reviews:", error);
            }
          }
        } catch (error) {
          console.error("Failed to fetch full user info:", error);
          showToast("Greška pri učitavanju potpunih informacija o korisniku", "error");
        } finally {
          setLoadingUserInfo(false);
          setLoadingUserReviews(false);
        }
      } else {
        setSelectedUserInfo(userInfo);
        setShowUserInfoModal(true);
        setLoadingUserInfo(false);
        setLoadingUserReviews(false);
      }
    } catch (error) {
      console.error("Error opening user info modal:", error);
      showToast("Greška pri učitavanju informacija o korisniku", "error");
      setLoadingUserInfo(false);
      setLoadingUserReviews(false);
    }
  };

  const closeUserInfoModal = () => {
    setShowUserInfoModal(false);
    setSelectedUserInfo(null);
    setUserReviews([]);
    setUserAvgRating(null);
    setUserTotalReviews(0);
  };

  const loadReviewedUsers = async (apps: ApplicationPublic[], userIdMap: Map<string, string>) => {
    const reviewedSet = new Set<string>();
    
    console.log("Loading reviewed users for event:", eventId);
    console.log("Apps to check:", apps.length);
    console.log("UserIdMap:", Array.from(userIdMap.entries()));
    
    // For each volunteer, check if they have been reviewed
    for (const app of apps) {
      let userId = getUserId(app);
      if (!userId && app.user_info?.username) {
        userId = userIdMap.get(app.user_info.username) || null;
      }
      
      console.log(`Checking user for app:`, {
        username: app.user_info?.username,
        userId: userId,
        eventId: eventId
      });
      
      if (userId && eventId) {
        try {
          // Try to get reviews for this user
          const reviews = await publicApi.getReviewsForUser(userId);
          console.log(`Reviews for user ${userId}:`, reviews);
          
          const reviewsArray = Array.isArray(reviews) ? reviews : [];
          
          // Check if any review is for this event and from an organization (org_to_user)
          const hasReviewForThisEvent = reviewsArray.some((review: any) => {
            const reviewEventId = review.event_id || review.event?._id || review.event?.id || review.event_id;
            const isOrgToUser = review.direction === "org_to_user" || 
                               review.direction === "org-to-user" ||
                               review.direction === "org_to_user";
            
            console.log(`Review check:`, {
              reviewEventId,
              eventId,
              isOrgToUser,
              direction: review.direction,
              matches: String(reviewEventId) === String(eventId) && isOrgToUser
            });
            
            return String(reviewEventId) === String(eventId) && isOrgToUser;
          });
          
          if (hasReviewForThisEvent) {
            reviewedSet.add(String(userId));
            console.log(`✓ User ${userId} already reviewed for event ${eventId}`);
          } else {
            console.log(`✗ User ${userId} NOT reviewed for event ${eventId}`);
          }
        } catch (error) {
          console.error(`Failed to check reviews for user ${userId}:`, error);
          // Don't block if we can't check - allow review attempt
        }
      } else {
        console.log(`Skipping check - missing userId or eventId:`, { userId, eventId });
      }
    }
    
    console.log("Final reviewed users set:", Array.from(reviewedSet));
    setReviewedUsers(reviewedSet);
  };

  const getUserId = (app: ApplicationPublic): string | null => {
    // Try multiple possible field names and structures
    const userInfo = app.user_info;
    if (!userInfo) return null;
    
    // Try direct fields first
    let userId = userInfo._id || 
                 userInfo.id || 
                 userInfo.user_id ||
                 (userInfo as any)?._id ||
                 (userInfo as any)?.id ||
                 (userInfo as any)?.user_id ||
                 null;
    
    // If not found, try to get from userIdMap
    if (!userId && userInfo.username) {
      userId = userIdMap.get(userInfo.username) || null;
    }
    
    return userId;
  };

  const openReviewModal = async (volunteer: ApplicationPublic) => {
    setSelectedVolunteer(volunteer);
    setReviewFormData({ rating: 5, comment: "" });
    setHoveredRating(null);
    setReviewError("");
    
    // Always try to get user ID from map or fetch it
    let userId = getUserId(volunteer);
    
    if (!userId && volunteer.user_info?.username) {
      setFetchingUserId(true);
      try {
        // Check if we already have it in the map
        userId = userIdMap.get(volunteer.user_info.username);
        
        // If not in map, fetch it
        if (!userId) {
          const userData = await publicApi.getUserByUsername(volunteer.user_info.username);
          userId = (userData as any)._id || (userData as any).id;
          
          // Save to map for future use
          if (userId) {
            setUserIdMap(prev => new Map(prev).set(volunteer.user_info!.username, userId!));
            // Update volunteer object with fetched user ID
            if (volunteer.user_info) {
              volunteer.user_info._id = userId;
              volunteer.user_info.id = userId;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
        setReviewError("Greška pri učitavanju ID korisnika. Molimo pokušajte ponovo.");
      } finally {
        setFetchingUserId(false);
      }
    }
    
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedVolunteer(null);
    setReviewFormData({ rating: 5, comment: "" });
    setHoveredRating(null);
    setReviewError("");
  };

  const handleRatingClick = (rating: 1 | 2 | 3 | 4 | 5) => {
    setReviewFormData((prev) => ({ ...prev, rating }));
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !selectedVolunteer) {
      setReviewError("ID događaja i volontera su obavezni");
      return;
    }

    console.log("Submitting review:", {
      eventId,
      selectedVolunteer,
      user_info: selectedVolunteer.user_info,
      userIdMap: Array.from(userIdMap.entries())
    });

    let userId = getUserId(selectedVolunteer);
    console.log("Initial userId from getUserId:", userId);
    
    // If still no userId, try to fetch by username
    if (!userId && selectedVolunteer.user_info?.username) {
      setReviewLoading(true);
      try {
        // Check map first
        userId = userIdMap.get(selectedVolunteer.user_info.username);
        console.log("UserId from map:", userId);
        
        // If not in map, fetch it
        if (!userId) {
          console.log("Fetching user by username:", selectedVolunteer.user_info.username);
          const userData = await publicApi.getUserByUsername(selectedVolunteer.user_info.username);
          console.log("Fetched user data:", userData);
          userId = (userData as any)._id || (userData as any).id;
          console.log("Extracted userId:", userId);
          
          if (userId) {
            setUserIdMap(prev => new Map(prev).set(selectedVolunteer.user_info!.username, userId!));
          }
        }
      } catch (err) {
        console.error("Failed to fetch user by username:", err);
        setReviewError("ID korisnika nije pronađen. Molimo osvežite stranicu.");
        setReviewLoading(false);
        return;
      } finally {
        // Don't set loading to false here, we'll use it for the API call
      }
    }
    
    if (!userId) {
      console.error("No userId found after all attempts");
      setReviewError("ID korisnika nije pronađen. Molimo osvežite stranicu.");
      setReviewLoading(false);
      return;
    }
    
    console.log("Final userId before API call:", userId);
    console.log("API call will be:", `/org/org/${eventId}/rate-user/${userId}`);
    
    // Set loading for the actual API call
    setReviewError("");
    if (!reviewLoading) {
      setReviewLoading(true);
    }

    try {
      await reviewsApi.createOrgToUserReview(eventId, userId, reviewFormData);
      showToast("Ocena je uspešno poslata!", "success");
      
      // Mark user as reviewed
      const userIdStr = String(userId);
      setReviewedUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userIdStr);
        console.log("Marked user as reviewed:", userIdStr);
        console.log("Updated reviewed users:", Array.from(newSet));
        return newSet;
      });
      
      closeReviewModal();
      // Optionally reload volunteers to show updated status
      loadVolunteers();
    } catch (err: any) {
      console.error("Review submission error:", err);
      setReviewLoading(false);
      let errorMessage = err?.message || err?.detail || "Greška pri slanju ocene";
      
      if (errorMessage.toLowerCase().includes("završen") || 
          errorMessage.toLowerCase().includes("ended") ||
          errorMessage.toLowerCase().includes("finished") ||
          errorMessage.toLowerCase().includes("not finished")) {
        errorMessage = "Događaj još nije završen. Ocena se može dati samo nakon završetka događaja.";
      }
      
      setReviewError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setReviewLoading(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: "Veoma loše",
    2: "Loše",
    3: "Dobro",
    4: "Veoma dobro",
    5: "Odlično",
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje volontera...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <Link 
        to="/org/dashboard" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na dashboard
      </Link>

      {/* Event Info */}
      {event && (
        <div className="card p-6 mb-6 bg-mint/10 border-2 border-mint/30">
          <h1 className="text-3xl font-bold text-[#121212] mb-4">{event.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-mint" />
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Datum završetka</p>
                <p className="text-[#121212] font-medium">{new Date(event.end_date).toLocaleDateString('sr-RS')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-mint" />
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Lokacija</p>
                <p className="text-[#121212] font-medium">{event.location}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Broj volontera</p>
              <p className="text-[#121212] font-medium text-2xl">{volunteers.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Volunteers List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#121212] mb-4">Volonteri na ovom događaju</h2>
        
        {volunteers.length === 0 ? (
          <div className="card p-12 text-center">
            <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-[#121212] text-xl font-medium">Nema volontera na ovom događaju</p>
          </div>
        ) : (
          <div className="space-y-4">
            {volunteers.map((volunteer, index) => {
              const userId = getUserId(volunteer);
              const appId = volunteer.id || (volunteer as any)._id || volunteer.application_id;
              
              return (
                <div
                  key={appId || `volunteer-${index}`}
                  className="card p-6 hover:shadow-lg transition-all border-l-4 border-mint"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {volunteer.user_info?.profile_image ? (
                        <img
                          src={volunteer.user_info.profile_image}
                          alt={volunteer.user_info?.first_name && volunteer.user_info?.last_name
                            ? `${volunteer.user_info.first_name} ${volunteer.user_info.last_name}`
                            : volunteer.user_info?.username || "Korisnik"}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-mint shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="p-3 bg-mint/20 rounded-xl">
                          <UserCircleIcon className="w-8 h-8 text-mint" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#121212] mb-1">
                          {volunteer.user_info?.first_name && volunteer.user_info?.last_name
                            ? `${volunteer.user_info.first_name} ${volunteer.user_info.last_name}`
                            : volunteer.user_info?.username || "Korisnik"}
                        </h3>
                        <button
                          onClick={() => openUserInfoModal(volunteer.user_info)}
                          className="text-mint hover:text-[#B8D4C5] font-medium mb-3 transition-colors cursor-pointer"
                        >
                          @{volunteer.user_info?.username || "N/A"}
                        </button>
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-mint text-[#121212]">
                      Prihvaćen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-[#121212]">
                      <PhoneIcon className="w-5 h-5 text-mint" />
                      <span className="font-medium">{volunteer.phone}</span>
                    </div>
                    {volunteer.user_info?.email && (
                      <div className="flex items-center gap-2 text-[#121212]">
                        <EnvelopeIcon className="w-5 h-5 text-mint" />
                        <span className="font-medium">{volunteer.user_info.email}</span>
                      </div>
                    )}
                  </div>

                  {volunteer.motivation && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Motivacija</h4>
                      <p className="text-[#121212] font-medium leading-relaxed bg-cream/30 p-4 rounded-lg">
                        {volunteer.motivation}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Prijavljeno: {new Date(volunteer.created_at).toLocaleString('sr-RS')}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openUserInfoModal(volunteer.user_info)}
                        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] font-semibold transition-colors"
                      >
                        <InformationCircleIcon className="w-5 h-5" />
                        Vidi info
                      </button>
                      {(() => {
                        let userId = getUserId(volunteer);
                        if (!userId && volunteer.user_info?.username) {
                          userId = userIdMap.get(volunteer.user_info.username) || null;
                        }
                        
                        const userIdStr = userId ? String(userId) : null;
                        const isReviewed = userIdStr ? reviewedUsers.has(userIdStr) : false;
                        
                        console.log("Button render check:", {
                          username: volunteer.user_info?.username,
                          userId: userIdStr,
                          isReviewed,
                          reviewedUsers: Array.from(reviewedUsers),
                          eventId
                        });
                        
                        if (!eventId) return null;
                        
                        if (isReviewed) {
                          return (
                            <div className="flex items-center gap-2 bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-semibold cursor-not-allowed">
                              <StarSolidIcon className="w-5 h-5 text-gray-500" />
                              Već ocenjen
                            </div>
                          );
                        }
                        
                        return (
                          <button
                            onClick={() => openReviewModal(volunteer)}
                            className="flex items-center gap-2 bg-mint text-[#121212] px-4 py-2 rounded-xl font-semibold hover:bg-[#B8D4C5] transition-all"
                          >
                            <StarIcon className="w-5 h-5" />
                            Oceni
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Info Modal */}
      {showUserInfoModal && selectedUserInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#121212]">Informacije o korisniku</h2>
              <button
                onClick={closeUserInfoModal}
                className="text-gray-500 hover:text-[#121212] transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingUserInfo && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint mb-2"></div>
                <p className="text-sm text-gray-600">Učitavanje potpunih informacija...</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                {selectedUserInfo.profile_image ? (
                  <img
                    src={selectedUserInfo.profile_image}
                    alt={selectedUserInfo.username || "Korisnik"}
                    className="w-20 h-20 object-cover rounded-xl border-2 border-mint shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 bg-mint/20 rounded-xl flex items-center justify-center border-2 border-mint">
                    <UserCircleIcon className="w-12 h-12 text-mint" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-[#121212]">
                    {selectedUserInfo.first_name && selectedUserInfo.last_name
                      ? `${selectedUserInfo.first_name} ${selectedUserInfo.last_name}`
                      : selectedUserInfo.username || "Korisnik"}
                  </h3>
                  <p className="text-gray-600 font-medium">@{selectedUserInfo.username || "N/A"}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUserInfo.email && (
                  <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl">
                    <EnvelopeIcon className="w-5 h-5 text-mint" />
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Email</p>
                      <p className="text-[#121212] font-medium">{selectedUserInfo.email}</p>
                    </div>
                  </div>
                )}
                {selectedUserInfo.location && (
                  <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl">
                    <MapPinIcon className="w-5 h-5 text-mint" />
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Lokacija</p>
                      <p className="text-[#121212] font-medium">{selectedUserInfo.location}</p>
                    </div>
                  </div>
                )}
                {selectedUserInfo.title && (
                  <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Zanimanje</p>
                      <p className="text-[#121212] font-medium">{selectedUserInfo.title}</p>
                    </div>
                  </div>
                )}
                {selectedUserInfo.age && (
                  <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl">
                    <CalendarDaysIcon className="w-5 h-5 text-mint" />
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Godine</p>
                      <p className="text-[#121212] font-medium">{selectedUserInfo.age}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* About Section */}
              {selectedUserInfo.about && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserCircleIcon className="w-5 h-5 text-mint" />
                    <h4 className="text-sm font-bold text-[#121212] uppercase tracking-wide">O korisniku</h4>
                  </div>
                  <p className="text-[#121212] font-medium leading-relaxed bg-cream/30 p-4 rounded-xl">
                    {selectedUserInfo.about}
                  </p>
                </div>
              )}

              {/* Skills Section */}
              {selectedUserInfo.skills && Array.isArray(selectedUserInfo.skills) && selectedUserInfo.skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-mint" />
                    <h4 className="text-sm font-bold text-[#121212] uppercase tracking-wide">Veštine</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserInfo.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {!loadingUserReviews && (userReviews.length > 0 || userAvgRating !== null) && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-mint/20 rounded-xl">
                      <StarIcon className="w-6 h-6 text-mint" />
                    </div>
                    <h4 className="text-lg font-bold text-[#121212]">Ocene i komentari</h4>
                    {userAvgRating !== null && (
                      <div className="flex items-center gap-2 bg-mint/20 px-3 py-1 rounded-full">
                        <StarIcon className="w-5 h-5 text-mint fill-mint" />
                        <span className="text-base font-bold text-[#121212]">
                          {userAvgRating.toFixed(1)}
                        </span>
                        {userTotalReviews > 0 && (
                          <span className="text-xs text-gray-600">
                            ({userTotalReviews} {userTotalReviews === 1 ? 'ocena' : userTotalReviews < 5 ? 'ocene' : 'ocena'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {userReviews.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {userReviews.map((review, index) => {
                        const reviewId = review.id || review._id || review.review_id || `review-${index}`;
                        const organisationName = review.organisation_name || review.organisation_info?.name || review.org_name || null;
                        const eventName = review.event_name || review.event_info?.title || review.event?.title || null;
                        const rating = review.rating || 0;
                        const comment = review.comment || review.text || null;
                        const createdAt = review.created_at || review.createdAt || null;
                        
                        return (
                          <div key={reviewId} className="p-4 bg-cream/20 rounded-xl border border-mint/20">
                            {/* Organisation Info */}
                            {organisationName && (
                              <div className="flex items-center gap-2 mb-2">
                                {review.organisation_info?.logo ? (
                                  <img
                                    src={review.organisation_info.logo}
                                    alt={organisationName}
                                    className="w-8 h-8 rounded-full object-cover border border-mint"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center border border-mint">
                                    <BuildingOffice2Icon className="w-4 h-4 text-mint" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-[#121212]">{organisationName}</p>
                                  {eventName && (
                                    <p className="text-xs text-gray-600">{eventName}</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < rating
                                        ? "text-mint fill-mint"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-bold text-[#121212]">{rating}/5</span>
                              {createdAt && (
                                <span className="text-xs text-gray-500 ml-auto">
                                  {new Date(createdAt).toLocaleDateString('sr-RS', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                            
                            {/* Comment */}
                            {comment && (
                              <p className="text-sm text-[#121212] font-medium leading-relaxed bg-white/50 p-3 rounded-lg border-l-2 border-mint">
                                {comment}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">Još nema ocena za ovog korisnika</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={closeUserInfoModal}
                className="w-full bg-mint text-[#121212] px-6 py-3 rounded-xl font-semibold hover:bg-[#B8D4C5] transition-all"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-mint/20 rounded-xl">
                  <SparklesIcon className="w-10 h-10 text-mint" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#121212]">Oceni volontera</h2>
                  <p className="text-gray-600 font-medium mt-1">
                    {selectedVolunteer.user_info?.first_name && selectedVolunteer.user_info?.last_name
                      ? `${selectedVolunteer.user_info.first_name} ${selectedVolunteer.user_info.last_name}`
                      : selectedVolunteer.user_info?.username || "Korisnik"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className="text-gray-500 hover:text-[#121212] transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {reviewError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                <p className="text-red-700 font-medium">{reviewError}</p>
              </div>
            )}

            {fetchingUserId && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
                <p className="text-blue-700 font-medium">Učitavanje informacija o korisniku...</p>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Rating Section */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-4">
                  <StarSolidIcon className="w-5 h-5 text-mint" />
                  Ocena *
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoveredRating || reviewFormData.rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star as 1 | 2 | 3 | 4 | 5)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          className="transition-transform hover:scale-125"
                        >
                          {isFilled ? (
                            <StarSolidIcon className="w-10 h-10 text-mint" />
                          ) : (
                            <StarIcon className="w-10 h-10 text-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-lg font-bold text-[#121212]">
                    {ratingLabels[hoveredRating || reviewFormData.rating]}
                  </span>
                </div>
              </div>

              {/* Comment Section */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                  <SparklesIcon className="w-5 h-5 text-mint" />
                  Komentar (opciono, maksimalno 500 karaktera)
                </label>
                <textarea
                  name="comment"
                  value={reviewFormData.comment || ""}
                  onChange={handleReviewChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-mint focus:outline-none text-[#121212] font-medium resize-none"
                  rows={6}
                  maxLength={500}
                  placeholder="Podelite svoje iskustvo sa volonterom..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewFormData.comment?.length || 0} / 500 karaktera
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 bg-gray-200 text-[#121212] px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 bg-mint text-[#121212] px-6 py-3 rounded-xl font-semibold hover:bg-[#B8D4C5] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {reviewLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#121212]"></div>
                      Slanje...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Pošalji ocenu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

