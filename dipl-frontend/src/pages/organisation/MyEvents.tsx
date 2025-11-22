import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eventsApi } from "../../api/events";
import type { EventPublic } from "../../types/api";
import { showToast } from "../../components/Toast";
import { 
  CalendarDaysIcon, 
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  StarIcon
} from "@heroicons/react/24/outline";

export function MyEvents() {
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const myEvents = await eventsApi.getMyEvents();
      setEvents(myEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovaj događaj? Ova akcija je nepovratna.")) {
      return;
    }

    try {
      await eventsApi.deleteEvent(eventId);
      showToast("Događaj je uspešno obrisan!", "success");
      loadEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      showToast("Neuspešno brisanje događaja", "error");
    }
  };

  const now = new Date();
  
  // Filtriraj događaje - samo oni koji tek predstoje (start_date > now)
  const upcomingEvents = events
    .filter((e) => new Date(e.start_date) > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()); // Najskoriji prvo
  
  // Filtriraj prošle događaje (end_date < now)
  const pastEvents = events
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()); // Najnoviji prvo

  // Sortiraj sve događaje po start_date opadajuće (najnoviji prvo)
  const allEventsSorted = [...events].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const filteredEvents =
    filter === "upcoming"
      ? upcomingEvents
      : filter === "past"
      ? pastEvents
      : allEventsSorted;

  const isEventPast = (event: EventPublic) => {
    return new Date(event.end_date) < now;
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Moji događaji</h1>
        <Link
          to="/org/events/create"
          className="bg-mint text-[#121212] px-4 py-2 rounded-md hover:bg-[#B8D4C5] transition-colors font-medium border border-mint/30"
        >
          Kreiraj događaj
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-lavender-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Svi ({events.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-lavender-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Predstojeći ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "past"
              ? "bg-lavender-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Prošli ({pastEvents.length})
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filter === "upcoming"
            ? "Nema predstojećih događaja"
            : filter === "past"
            ? "Nema prošlih događaja"
            : "Još nema događaja"}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event, index) => {
            const isPast = isEventPast(event);
            const eventId = (event as any)._id || (event as any).id || event.title;
            
            return (
              <div
                key={index}
                className="card overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-neutral-900">{event.title}</h3>
                        {isPast && (
                          <span className="bg-neutral-200 text-neutral-600 px-3 py-1 rounded-full text-xs font-medium">
                            Prošao
                          </span>
                        )}
                        <span className="bg-gradient-to-r from-lavender-400 to-rose-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {event.category}
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-4">{event.description}</p>
                    </div>
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-32 h-32 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-cream-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-lavender-600" />
                      <div>
                        <div className="text-xs text-neutral-500">Lokacija</div>
                        <div className="font-semibold text-neutral-800">{event.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-lavender-600" />
                      <div>
                        <div className="text-xs text-neutral-500">Početak</div>
                        <div className="font-semibold text-neutral-800 text-sm">
                          {new Date(event.start_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(event.start_date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-lavender-600" />
                      <div>
                        <div className="text-xs text-neutral-500">Kraj</div>
                        <div className="font-semibold text-neutral-800 text-sm">
                          {new Date(event.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(event.end_date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {event.max_volunteers && (
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-lavender-600" />
                        <div>
                          <div className="text-xs text-neutral-500">Maks volontera</div>
                          <div className="font-semibold text-neutral-800">{event.max_volunteers}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TagIcon className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm font-semibold text-neutral-700">Oznake:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-neutral-200 text-neutral-800 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 flex-wrap">
                    {!isPast ? (
                      <button
                        onClick={() => navigate(`/org/events/${event.title}/edit`)}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors font-medium border border-blue-200"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Izmeni
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-neutral-300 text-neutral-600 px-4 py-2 rounded-md cursor-not-allowed font-medium">
                        <PencilIcon className="w-4 h-4" />
                        Ne može se izmeniti
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/org/events/${eventId}/applications`)}
                      className="flex items-center gap-2 bg-cream/80 text-[#121212] px-4 py-2 rounded-md hover:bg-cream transition-colors font-medium border border-mint/30"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      Prijave
                    </button>
                    {isPast && (
                      <button
                        onClick={() => navigate(`/org/events/${eventId}/volunteers`)}
                        className="flex items-center gap-2 bg-mint text-[#121212] px-4 py-2 rounded-md hover:bg-[#B8D4C5] transition-colors font-medium"
                      >
                        <StarIcon className="w-4 h-4" />
                        Oceni volontere
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(eventId)}
                      className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors font-medium border border-red-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Obriši
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

