import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { publicApi } from "../../api/public";
import { useAuth } from "../../auth/useAuth";
import type { EventPublic, OrganisationPublic } from "../../types/api";
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  BuildingOffice2Icon,
  ArrowLeftIcon,
  UserGroupIcon,
  ClockIcon,
  TagIcon,
  ArrowRightIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

export function EventDetail() {
  const { title } = useParams<{ title: string }>();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [organisation, setOrganisation] = useState<OrganisationPublic | null>(null);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (title) {
      loadEvent();
    }
  }, [title]);

  const loadEvent = async () => {
    try {
      const eventData = await publicApi.getEventByTitle(title!);
      setEvent(eventData);
      console.log("Event data loaded:", eventData);
      console.log("All event keys:", Object.keys(eventData));
      
      // Učitaj organizaciju po event_id koristeći novi endpoint
      const eventId = (eventData as any)._id || (eventData as any).id;
      const organisationId = (eventData as any).organisation_id || (eventData as any).organisationId || (eventData as any).organisation;
      console.log("Event ID:", eventId);
      console.log("Organisation ID from event:", organisationId);
      console.log("All event properties:", Object.keys(eventData));
      
      // Prvo pokušaj da učitamo organizaciju po event_id
      if (eventId) {
        try {
          const org = await publicApi.getOrganisationByEvent(eventId);
          console.log("Organisation loaded by event:", org);
          setOrganisation(org);
          
          // Učitaj statistiku organizacije (ocene i komentare)
          const orgUsername = (org as any)?.username || eventData.organisation_username;
          console.log("Org username from loaded org:", orgUsername);
          if (orgUsername) {
            try {
              const stats = await publicApi.getOrgStats(orgUsername);
              setOrgStats(stats);
            } catch (error) {
              console.error("Failed to load org stats:", error);
            }
          }
        } catch (error) {
          console.error("Failed to load organisation by event:", error);
          
          // Ako imamo organisation_id direktno u event objektu, pokušaj da učitamo organizaciju po ID-u
          if (organisationId) {
            try {
              console.log("Trying to load organisation by ID:", organisationId);
              const org = await publicApi.getOrganisationById(organisationId);
              console.log("Organisation loaded by ID:", org);
              setOrganisation(org);
              
              const username = (org as any)?.username;
              if (username) {
                try {
                  const stats = await publicApi.getOrgStats(username);
                  setOrgStats(stats);
                } catch (err) {
                  console.error("Failed to load org stats:", err);
                }
              }
            } catch (err) {
              console.error("Failed to load organisation by ID:", err);
            }
          }
          
          // Pokušaj da učitamo organizaciju po username ako postoji u event podacima
          if (eventData.organisation_username) {
            try {
              const orgs = await publicApi.getOrganisationByUsername(eventData.organisation_username);
              if (orgs && orgs.length > 0) {
                setOrganisation(orgs[0]);
                const stats = await publicApi.getOrgStats(eventData.organisation_username);
                setOrgStats(stats);
              }
            } catch (err) {
              console.error("Failed to load organisation by username:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  if (!event) {
    return <div className="text-center py-8">Događaj nije pronađen</div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <Link 
        to="/events" 
        className="flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg transition-all mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na događaje
      </Link>

      {/* Hero Section - Image */}
      {event.image && (
        <div className="relative h-96 rounded-3xl overflow-hidden mb-8 shadow-xl">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-6 right-6">
            <span className="bg-mint text-[#121212] px-5 py-2 rounded-full text-sm font-bold shadow-lg">
              {event.category}
            </span>
          </div>
        </div>
      )}

      <div className="card p-8 mb-8">
        {/* Organization Section - Top */}
        {event.organisation_name && (
          <div className="mb-6 pb-6 border-b-2 border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-mint/20 rounded-xl flex-shrink-0">
                <BuildingOffice2Icon className="w-6 h-6 text-mint" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Organizator</p>
                <div className="flex items-center gap-4 flex-wrap">
                  {organisation ? (
                    <Link
                      to={`/organisations/${organisation.username}`}
                      className="text-xl font-bold text-[#121212] hover:text-mint transition-colors"
                    >
                      {event.organisation_name}
                    </Link>
                  ) : (
                    <p className="text-xl font-bold text-[#121212]">
                      {event.organisation_name}
                    </p>
                  )}
                  {(() => {
                    // Pokušaj da nađemo username iz različitih izvora
                    const orgUsername = organisation?.username 
                      || event.organisation_username 
                      || (event as any).organisation_username
                      || (organisation as any)?.username;
                    
                    console.log("Rendering button - event data:", {
                      organisation_username: event.organisation_username,
                      organisation: organisation,
                      orgUsername: orgUsername,
                      eventKeys: Object.keys(event)
                    });
                    
                    // Ako imamo ime organizatora, prikaži dugme čak i ako nemamo username
                    // Link će biti na /organisations/[ime] ili možemo koristiti ime kao username
                    if (event.organisation_name) {
                      const linkTo = orgUsername 
                        ? `/organisations/${orgUsername}` 
                        : event.organisation_name 
                          ? `/organisations/${encodeURIComponent(event.organisation_name)}`
                          : '#';
                      
                      return (
                        <Link
                          to={linkTo}
                          className="inline-flex items-center gap-2 text-sm text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold transition-all group px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
                        >
                          <span>Vidi više info o organizatoru</span>
                          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      );
                    }
                    return null;
                  })()}
                </div>
                {/* Prikaži ocenu organizatora i link za komentare */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {orgStats?.avg_rating !== undefined && orgStats?.avg_rating !== null && (
                    <div className="flex items-center gap-2 bg-cream/50 px-3 py-1.5 rounded-full">
                      <HeartIcon className="w-4 h-4 text-mint fill-mint" />
                      <span className="text-sm font-bold text-[#121212]">
                        {typeof orgStats.avg_rating === 'number' ? orgStats.avg_rating.toFixed(1) : orgStats.avg_rating}
                      </span>
                      {orgStats?.total_reviews && orgStats.total_reviews > 0 && (
                        <span className="text-xs text-gray-600">
                          ({orgStats.total_reviews} {orgStats.total_reviews === 1 ? 'ocena' : orgStats.total_reviews < 5 ? 'ocene' : 'ocena'})
                        </span>
                      )}
                    </div>
                  )}
                  {organisation && orgStats?.total_reviews && orgStats.total_reviews > 0 && (
                    <Link
                      to={`/organisations/${organisation.username}#reviews`}
                      className="inline-flex items-center gap-2 text-sm text-[#121212] bg-mint/80 hover:bg-mint px-3 py-1.5 rounded-lg font-semibold transition-all group"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>Vidi ocene i komentare</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Title and CTA Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212] leading-tight flex-1">
            {event.title}
          </h1>
          {(() => {
            // Proveri da li je događaj završen
            const now = new Date();
            const eventEndDate = new Date(event.end_date);
            const isEventFinished = eventEndDate < now;

            // Prikaži dugme samo ako događaj nije završen
            if (!isEventFinished && (!isAuthenticated || (isAuthenticated && role === "user"))) {
              return (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login-user");
                    } else if (role === "user") {
                      navigate(`/user/apply/${title}`);
                    }
                  }}
                  className="btn-primary px-8 py-4 text-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform whitespace-nowrap animate-pulse-glow"
                >
                  <UserGroupIcon className="w-6 h-6" />
                  Budi naš volonter!
                </button>
              );
            }
            return null;
          })()}
        </div>

        {/* Details Grid - Organized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6 bg-cream/30 border-2 border-mint/30 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-mint/20 rounded-xl flex-shrink-0">
                <MapPinIcon className="w-6 h-6 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Lokacija</h3>
                <p className="text-[#121212] text-lg font-bold">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-cream/30 border-2 border-mint/30 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cream/50 rounded-xl flex-shrink-0">
                <CalendarDaysIcon className="w-6 h-6 text-[#121212]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Početak</h3>
                <p className="text-[#121212] text-lg font-bold">
                  {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-cream/30 border-2 border-mint/30 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cream/50 rounded-xl flex-shrink-0">
                <ClockIcon className="w-6 h-6 text-[#121212]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Kraj</h3>
                <p className="text-[#121212] text-lg font-bold">
                  {new Date(event.end_date).toLocaleDateString('sr-RS', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {event.max_volunteers && (
            <div className="card p-6 bg-cream/30 border-2 border-mint/30 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-mint/20 rounded-xl flex-shrink-0">
                  <UserGroupIcon className="w-6 h-6 text-mint" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Maksimalno volontera</h3>
                  <p className="text-[#121212] text-lg font-bold">{event.max_volunteers}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-mint/20 rounded-xl">
              <TagIcon className="w-5 h-5 text-mint" />
            </div>
            <h2 className="text-2xl font-bold text-[#121212]">Opis</h2>
          </div>
          <div className="card p-6 bg-cream/20 border border-mint/20 max-h-96 overflow-y-auto">
            <p className="text-[#121212] text-lg leading-relaxed font-medium">{event.description}</p>
          </div>
        </div>

        {/* Tags - Green like category */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-mint/20 rounded-xl">
                <TagIcon className="w-5 h-5 text-mint" />
              </div>
              <h2 className="text-2xl font-bold text-[#121212]">Oznake</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-mint text-[#121212] px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

