import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsApi } from "../../api/applications";
import { publicApi } from "../../api/public";
import type { ApplicationPublic, ApplicationUpdate, EventPublic } from "../../types/api";
import { showToast } from "../../components/Toast";
import { CheckCircleIcon, XCircleIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, InformationCircleIcon, MapPinIcon, BriefcaseIcon, SparklesIcon, XMarkIcon, CalendarDaysIcon, PencilIcon, ArrowLeftIcon, TagIcon, StarIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

export function EventApplications() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [applications, setApplications] = useState<ApplicationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedAppData, setSelectedAppData] = useState<ApplicationPublic | null>(null);
  const [extraNotes, setExtraNotes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"accepted" | "rejected" | null>(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<Record<string, any> | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userAvgRating, setUserAvgRating] = useState<number | null>(null);
  const [userTotalReviews, setUserTotalReviews] = useState<number>(0);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadApplications();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      // Prvo probaj da učitamo po ID-u
      let eventData;
      try {
        eventData = await publicApi.getEventById(eventId!);
      } catch (idError) {
        // Ako ne uspe sa ID-jem, probaj po naslovu (možda je naslov u URL-u)
        try {
          eventData = await publicApi.getEventByTitle(eventId!);
        } catch (titleError) {
          throw idError; // Bacimo originalnu grešku
        }
      }
      setEvent(eventData);
    } catch (error) {
      console.error("Failed to load event:", error);
    } finally {
      setLoadingEvent(false);
    }
  };

  const loadApplications = async () => {
    try {
      const apps = await applicationsApi.getEventApplications(eventId!);
      setApplications(apps);
    } catch (error) {
      console.error("Failed to load applications:", error);
      // Ako nismo već učitani event po ID-u, probaj da učitamo event po naslovu i onda aplikacije
      if (!event) {
        try {
          const eventData = await publicApi.getEventByTitle(eventId!);
          if (eventData && ((eventData as any)._id || (eventData as any).id)) {
            const actualEventId = (eventData as any)._id || (eventData as any).id;
            const apps = await applicationsApi.getEventApplications(actualEventId);
            setApplications(apps);
            setEvent(eventData);
          }
        } catch (titleError) {
          console.error("Failed to load event and applications by title:", titleError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (applicationId: string, status: "accepted" | "rejected", appData?: ApplicationPublic) => {
    setSelectedApp(applicationId);
    setSelectedAppData(appData || null);
    setPendingStatus(status);
    setExtraNotes("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApp(null);
    setSelectedAppData(null);
    setPendingStatus(null);
    setExtraNotes("");
  };


  const openUserInfoModal = async (userInfo: Record<string, any>) => {
    try {
      // If we have username, fetch full user details from API
      if (userInfo?.username) {
        setShowUserInfoModal(true);
        setSelectedUserInfo(userInfo); // Show existing info immediately
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
              // Don't block the modal if reviews fail
            }
          }
        } catch (error) {
          console.error("Failed to fetch full user info:", error);
          showToast("Greška pri učitavanju potpunih informacija o korisniku", "error");
          // Keep existing userInfo if API call fails
        } finally {
          setLoadingUserInfo(false);
          setLoadingUserReviews(false);
        }
      } else {
        // If no username, just show what we have
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

  const handleStatusChange = async () => {
    if (!selectedApp || !pendingStatus) {
      showToast("Greška: ID aplikacije nije pronađen", "error");
      return;
    }

    try {
      const updateData: ApplicationUpdate = {
        extra_notes: extraNotes.trim() || null,
      };

      console.log("Updating application status:", {
        applicationId: selectedApp,
        status: pendingStatus,
        updateData
      });

      await applicationsApi.updateApplicationStatus(selectedApp, pendingStatus, updateData);
      showToast(`Prijava je uspešno ${pendingStatus === "accepted" ? "prihvaćena" : "odbijena"}!`, "success");
      closeModal();
      loadApplications();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      const errorMessage = error?.message || error?.detail || "Neuspešno ažuriranje statusa prijave";
      showToast(errorMessage, "error");
    }
  };

  const canReviewUser = (app: ApplicationPublic): boolean => {
    // Review can be given if:
    // 1. Application is accepted
    // 2. Event has ended
    if (app.status !== "accepted") {
      return false;
    }
    
    if (!event || !event.end_date) {
      return false;
    }
    
    const now = new Date();
    const eventEndDate = new Date(event.end_date);
    
    // Događaj je završen ako je end_date prošao
    return eventEndDate < now;
  };

  const getUserId = (app: ApplicationPublic): string | null => {
    return app.user_info?._id || app.user_info?.id || app.user_info?.user_id || null;
  };

  const renderApplicationCard = (
    app: ApplicationPublic,
    appId: string | undefined,
    index: number,
    showActions: boolean = true,
    isRejected: boolean = false
  ) => {
    const cardPadding = isRejected ? "p-4" : "p-5";
    const titleSize = isRejected ? "text-lg" : "text-xl";
    const borderColor = isRejected ? "border-red-200" : app.status === "accepted" ? "border-mint" : "border-cream";
    const canReview = canReviewUser(app);
    const userId = getUserId(app);
    
    return (
      <div
        key={appId || `app-${index}`}
        className={`card ${cardPadding} hover:shadow-lg transition-all border-l-4 ${borderColor} ${isRejected ? "opacity-75" : ""}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            {app.user_info?.profile_image ? (
              <img
                src={app.user_info.profile_image}
                alt={app.user_info?.first_name && app.user_info?.last_name
                  ? `${app.user_info.first_name} ${app.user_info.last_name}`
                  : app.user_info?.username || "Korisnik"}
                className="w-12 h-12 rounded-xl object-cover border-2 border-mint shadow-md flex-shrink-0"
              />
            ) : (
              <div className={`p-2 ${isRejected ? "bg-red-100" : app.status === "accepted" ? "bg-mint/20" : "bg-cream/30"} rounded-xl`}>
                <UserCircleIcon className={`w-6 h-6 ${isRejected ? "text-red-600" : app.status === "accepted" ? "text-mint" : "text-[#121212]"}`} />
              </div>
            )}
            <div>
              <h3 className={`${titleSize} font-bold text-[#121212] mb-1`}>
                {app.user_info?.first_name && app.user_info?.last_name
                  ? `${app.user_info.first_name} ${app.user_info.last_name}`
                  : app.user_info?.username || "Korisnik"}
              </h3>
              <button
                onClick={() => openUserInfoModal(app.user_info)}
                className="text-mint hover:text-[#B8D4C5] font-medium text-sm transition-colors cursor-pointer"
              >
                @{app.user_info?.username || "N/A"}
              </button>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              app.status === "accepted"
                ? "bg-mint text-[#121212]"
                : app.status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-cream text-[#121212]"
            }`}
          >
            {app.status === "accepted" ? "Prihvaćena" : app.status === "rejected" ? "Odbijena" : "Na čekanju"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-[#121212] text-sm">
            <PhoneIcon className="w-4 h-4 text-mint" />
            <span className="font-medium">{app.phone}</span>
          </div>
          {app.user_info?.email && (
            <div className="flex items-center gap-2 text-[#121212] text-sm">
              <EnvelopeIcon className="w-4 h-4 text-mint" />
              <span className="font-medium">{app.user_info.email}</span>
            </div>
          )}
        </div>

        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Motivacija</h4>
          <p className="text-[#121212] font-medium text-sm leading-relaxed bg-cream/30 p-3 rounded-lg">{app.motivation}</p>
        </div>

        {app.extra_notes && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Dodatne napomene (od organizacije)</h4>
            <p className="text-[#121212] font-medium text-sm leading-relaxed bg-mint/20 p-3 rounded-lg">{app.extra_notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Prijavljeno: {new Date(app.created_at).toLocaleString('sr-RS')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openUserInfoModal(app.user_info)}
              className="flex items-center gap-1 text-mint hover:text-[#B8D4C5] font-semibold text-xs transition-colors"
            >
              <InformationCircleIcon className="w-4 h-4" />
              Vidi info
            </button>
            {canReview && userId && eventId && (
              <Link
                to={`/org/reviews/${eventId}/${userId}`}
                className="flex items-center gap-1 text-mint hover:text-[#B8D4C5] font-semibold text-xs transition-colors"
              >
                <StarIcon className="w-4 h-4" />
                Oceni
              </Link>
            )}
          </div>
        </div>

        {showActions && app.status === "pending" && appId && (
          <div className="flex gap-3 pt-3 border-t border-gray-200 mt-3">
            <button
              onClick={() => openModal(appId, "accepted", app)}
              className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform text-sm px-4 py-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Prihvati
            </button>
            <button
              onClick={() => openModal(appId, "rejected", app)}
              className="bg-cream/70 text-[#121212] px-4 py-2 rounded-xl font-semibold hover:bg-cream transition-all flex items-center gap-2 hover:scale-105 text-sm border border-mint/30"
            >
              <XCircleIcon className="w-4 h-4" />
              Odbij
            </button>
          </div>
        )}
        {showActions && app.status === "pending" && !appId && (
          <div className="pt-3 border-t border-gray-200 mt-3">
            <p className="text-red-600 text-xs font-medium">
              ⚠️ Greška: ID aplikacije nije pronađen
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading || loadingEvent) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-[#121212] text-lg font-medium">Događaj nije pronađen</p>
        <Link to="/org/dashboard" className="text-mint hover:text-[#B8D4C5] font-semibold mt-4 inline-block">
          Nazad na kontrolnu tablu
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <Link 
        to="/org/dashboard" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-6 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na kontrolnu tablu
      </Link>

      {/* Event Info Section */}
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4 text-[#121212]">{event.title}</h1>
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2 text-[#121212]">
                <CalendarDaysIcon className="w-5 h-5 text-mint" />
                <span className="font-medium">
                  {new Date(event.start_date).toLocaleDateString('sr-RS', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#121212]">
                <MapPinIcon className="w-5 h-5 text-mint" />
                <span className="font-medium">{event.location}</span>
              </div>
              {event.category && (
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-mint" />
                  <span className="bg-mint/20 text-[#121212] px-3 py-1 rounded-full text-sm font-semibold">
                    {event.category}
                  </span>
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-[#121212] font-medium leading-relaxed mb-4">{event.description}</p>
            )}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span key={index} className="bg-mint text-[#121212] px-3 py-1 rounded-full text-xs font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {event.image && (
            <div className="ml-6">
              <img
                src={event.image}
                alt={event.title}
                className="w-48 h-48 object-cover rounded-xl border-2 border-mint shadow-lg"
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Prijave: </span>
            <span className="text-[#121212]">{applications.length}</span>
            {applications.filter(app => app.status === "pending").length > 0 && (
              <span className="ml-4">
                <span className="font-semibold">Na čekanju: </span>
                <span className="text-[#121212]">{applications.filter(app => app.status === "pending").length}</span>
              </span>
            )}
          </div>
          {(() => {
            const now = new Date();
            const eventEndDate = event?.end_date ? new Date(event.end_date) : null;
            const isEventPast = eventEndDate ? eventEndDate < now : false;
            
            if (isEventPast) {
              return (
                <div className="inline-flex items-center gap-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-xl cursor-not-allowed opacity-60">
                  <PencilIcon className="w-5 h-5" />
                  <span>Događaj je prošao</span>
                </div>
              );
            }
            
            return (
              <Link
                to={`/org/events/${encodeURIComponent(event.title)}/edit`}
                className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <PencilIcon className="w-5 h-5" />
                Ažuriraj događaj
              </Link>
            );
          })()}
        </div>
      </div>

      {/* Applications Section */}
      <div className="mb-6">
        {applications.length === 0 ? (
          <div className="card p-12 text-center">
            <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-[#121212] text-xl font-medium">Još nema prijava</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* New Applications (Pending) */}
            {applications.filter(app => app.status === "pending").length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cream rounded-xl">
                    <UserCircleIcon className="w-5 h-5 text-[#121212]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#121212]">Nove prijave</h2>
                  <span className="bg-cream text-[#121212] px-3 py-1 rounded-full text-xs font-bold">
                    {applications.filter(app => app.status === "pending").length}
                  </span>
                </div>
                <div className="space-y-4">
                  {applications
                    .filter(app => app.status === "pending")
                    .map((app, index) => {
                      const appId = app.id || (app as any)._id || app.application_id;
                      return renderApplicationCard(app, appId, index, true);
                    })}
                </div>
              </div>
            )}

            {/* Accepted Applications */}
            {applications.filter(app => app.status === "accepted").length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-mint/20 rounded-xl">
                    <CheckCircleIcon className="w-5 h-5 text-mint" />
                  </div>
                  <h2 className="text-xl font-bold text-[#121212]">Prihvaćene prijave</h2>
                  <span className="bg-mint text-[#121212] px-3 py-1 rounded-full text-xs font-bold">
                    {applications.filter(app => app.status === "accepted").length}
                  </span>
                </div>
                <div className="space-y-4">
                  {applications
                    .filter(app => app.status === "accepted")
                    .map((app, index) => {
                      const appId = app.id || (app as any)._id || app.application_id;
                      return renderApplicationCard(app, appId, index, false);
                    })}
                </div>
              </div>
            )}

            {/* Rejected Applications (at the bottom) */}
            {applications.filter(app => app.status === "rejected").length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-600">Odbijene prijave</h2>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {applications.filter(app => app.status === "rejected").length}
                  </span>
                </div>
                <div className="space-y-3">
                  {applications
                    .filter(app => app.status === "rejected")
                    .map((app, index) => {
                      const appId = app.id || (app as any)._id || app.application_id;
                      return renderApplicationCard(app, appId, index, false, true);
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Extra Notes */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-[#121212] mb-6">
              {pendingStatus === "accepted" ? "Prihvati prijavu" : "Odbij prijavu"}
            </h2>

            {/* User Info in Modal */}
            {selectedAppData?.user_info && (
              <div className="mb-6 p-4 bg-cream/30 rounded-xl border border-mint/30">
                <h3 className="text-sm font-bold text-[#121212] uppercase tracking-wide mb-3">Informacije o korisniku</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedAppData.user_info.first_name && selectedAppData.user_info.last_name && (
                    <div>
                      <span className="text-gray-600 font-semibold">Ime i prezime: </span>
                      <span className="text-[#121212] font-medium">
                        {selectedAppData.user_info.first_name} {selectedAppData.user_info.last_name}
                      </span>
                    </div>
                  )}
                  {selectedAppData.user_info.username && (
                    <div>
                      <span className="text-gray-600 font-semibold">Username: </span>
                      <span className="text-[#121212] font-medium">@{selectedAppData.user_info.username}</span>
                    </div>
                  )}
                  {selectedAppData.user_info.email && (
                    <div>
                      <span className="text-gray-600 font-semibold">Email: </span>
                      <span className="text-[#121212] font-medium">{selectedAppData.user_info.email}</span>
                    </div>
                  )}
                  {selectedAppData.user_info.location && (
                    <div>
                      <span className="text-gray-600 font-semibold">Lokacija: </span>
                      <span className="text-[#121212] font-medium">{selectedAppData.user_info.location}</span>
                    </div>
                  )}
                  {selectedAppData.user_info.title && (
                    <div>
                      <span className="text-gray-600 font-semibold">Zanimanje: </span>
                      <span className="text-[#121212] font-medium">{selectedAppData.user_info.title}</span>
                    </div>
                  )}
                  {selectedAppData.user_info.age && (
                    <div>
                      <span className="text-gray-600 font-semibold">Godine: </span>
                      <span className="text-[#121212] font-medium">{selectedAppData.user_info.age}</span>
                    </div>
                  )}
                </div>
                {selectedAppData.user_info.about && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 font-semibold text-xs uppercase tracking-wide">O korisniku: </span>
                    <p className="text-[#121212] font-medium text-sm mt-1">{selectedAppData.user_info.about}</p>
                  </div>
                )}
                {selectedAppData.user_info.skills && Array.isArray(selectedAppData.user_info.skills) && selectedAppData.user_info.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 font-semibold text-xs uppercase tracking-wide mb-2 block">Veštine: </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppData.user_info.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-mint text-[#121212] px-2 py-1 rounded-full text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedAppData.user_info.experience && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Iskustvo: </span>
                    <p className="text-[#121212] font-medium text-sm mt-1">{selectedAppData.user_info.experience}</p>
                  </div>
                )}
                <button
                  onClick={() => openUserInfoModal(selectedAppData.user_info)}
                  className="mt-4 text-mint hover:text-[#B8D4C5] font-semibold text-sm transition-colors"
                >
                  Vidi sve informacije o korisniku →
                </button>
              </div>
            )}

            {/* Extra Notes Input - Organization's response */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#121212] mb-2">
                Dodatne napomene (odgovor organizacije) - opciono
              </label>
              <textarea
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Dodajte dodatne napomene za volontera (npr. detalji o događaju, kontakt informacije, itd.)..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-mint focus:outline-none text-[#121212] font-medium resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-[#121212] px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Otkaži
              </button>
              <button
                onClick={handleStatusChange}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 ${
                  pendingStatus === "accepted"
                    ? "bg-mint hover:bg-[#B8D4C5] text-[#121212]"
                    : "bg-cream/70 hover:bg-cream text-[#121212] border border-mint/30"
                }`}
              >
                {pendingStatus === "accepted" ? "Prihvati" : "Odbij"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for User Info */}
      {showUserInfoModal && selectedUserInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#121212]">Informacije o korisniku</h2>
              <button
                onClick={closeUserInfoModal}
                className="text-gray-500 hover:text-[#121212] transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
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
                    <BriefcaseIcon className="w-5 h-5 text-mint" />
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

              {/* Experience Section */}
              {selectedUserInfo.experience && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BriefcaseIcon className="w-5 h-5 text-mint" />
                    <h4 className="text-sm font-bold text-[#121212] uppercase tracking-wide">Iskustvo</h4>
                  </div>
                  <p className="text-[#121212] font-medium leading-relaxed bg-mint/10 p-4 rounded-xl">
                    {selectedUserInfo.experience}
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
    </div>
  );
}

