import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsApi } from "../../api/applications";
import { publicApi } from "../../api/public";
import type { ApplicationPublic, EventPublic } from "../../types/api";
import { showToast } from "../../components/Toast";
import { StarIcon } from "@heroicons/react/24/outline";

export function MyApplications() {
  const [applications, setApplications] = useState<ApplicationPublic[]>([]);
  const [events, setEvents] = useState<Map<string, EventPublic>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const apps = await applicationsApi.getMyApplications();
      setApplications(apps);
      
      // Load event details for each application
      const eventMap = new Map<string, EventPublic>();
      for (const app of apps) {
        try {
          const eventData = await publicApi.getEventByTitle(app.event_title);
          eventMap.set(app.event_title, eventData);
        } catch (error) {
          console.error(`Failed to load event ${app.event_title}:`, error);
        }
      }
      setEvents(eventMap);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const canReview = (app: ApplicationPublic): boolean => {
    // Review can be given if:
    // 1. Application is accepted
    // 2. Event has ended
    if (app.status !== "accepted") {
      return false;
    }
    
    const event = events.get(app.event_title);
    if (!event || !event.end_date) {
      console.log("canReview: missing event or end_date", {
        eventTitle: app.event_title,
        hasEvent: !!event,
        endDate: event?.end_date
      });
      return false;
    }
    
    // Backend proverava: event["end_date"] > datetime.datetime.utcnow()
    // Znači događaj je završen ako: eventEndDate <= now (u UTC)
    const now = new Date(); // JavaScript Date interno koristi UTC
    let eventEndDate = new Date(event.end_date);
    
    // Ako end_date nema timezone info, JavaScript će ga parsirati kao lokalno vreme
    // Backend koristi UTC, pa treba da proverim format
    if (typeof event.end_date === 'string') {
      // Ako string nema 'Z' na kraju i nema timezone offset, dodaj 'Z' za UTC
      const dateStr = event.end_date.trim();
      if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        // Pretpostavljamo da je UTC ako nema timezone info
        eventEndDate = new Date(dateStr + (dateStr.includes('T') ? 'Z' : ''));
      }
    }
    
    // Backend proverava: end_date > utcnow(), znači događaj je završen ako end_date <= now
    const isFinished = eventEndDate <= now;
    
    // Debug log
    console.log("canReview check:", {
      eventTitle: app.event_title,
      endDateRaw: event.end_date,
      parsedEndDate: eventEndDate,
      parsedEndDateISO: eventEndDate.toISOString(),
      now: now,
      nowISO: now.toISOString(),
      isFinished: isFinished,
      timeDiffMs: now.getTime() - eventEndDate.getTime(),
      hoursDiff: (now.getTime() - eventEndDate.getTime()) / (1000 * 60 * 60),
      backendLogic: `end_date (${eventEndDate.toISOString()}) > utcnow (${now.toISOString()}) = ${eventEndDate > now} → finished = ${eventEndDate <= now}`
    });
    
    // Događaj je završen ako je end_date <= trenutno vreme
    return isFinished;
  };

  const getEventId = (app: ApplicationPublic): string | null => {
    const event = events.get(app.event_title);
    if (!event) return null;
    return (event as any).id || (event as any)._id || null;
  };

  const handleCancel = async (applicationId: string) => {
    if (!confirm("Da li ste sigurni da želite da otkažete ovu prijavu?")) {
      return;
    }

    try {
      await applicationsApi.cancelApplication(applicationId);
      showToast("Prijava je uspešno otkazana!", "success");
      loadApplications();
    } catch (error) {
      console.error("Failed to cancel application:", error);
      showToast("Neuspešno otkazivanje prijave", "error");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Moje prijave</h1>

      {applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Još nema prijava</div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{app.event_title}</h3>
                  <p className="text-gray-600">Organizacija: {app.organisation_name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded ${
                    app.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : app.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : app.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {app.status === "accepted" ? "Prihvaćena" : app.status === "rejected" ? "Odbijena" : app.status === "pending" ? "Na čekanju" : app.status === "cancelled" ? "Otkazana" : app.status}
                </span>
              </div>

              <div className="mb-4">
                <strong>Motivacija:</strong>
                <p className="text-gray-700 mt-1">{app.motivation}</p>
              </div>

              <div className="mb-4">
                <strong>Telefon:</strong> {app.phone}
              </div>

              {app.extra_notes && (
                <div className="mb-4">
                  <strong>Dodatne napomene:</strong>
                  <p className="text-gray-700 mt-1">{app.extra_notes}</p>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-4">
                Prijavljeno: {new Date(app.created_at).toLocaleString()}
              </div>

              <div className="flex gap-4 flex-wrap">
                <Link
                  to={`/events/${encodeURIComponent(app.event_title)}`}
                  className="text-mint hover:text-[#B8D4C5] font-semibold transition-colors"
                >
                  Vidi događaj
                </Link>
                {app.status === "pending" && (
                  <button
                    onClick={() => handleCancel((app as any).id || (app as any)._id || app.application_id || index.toString())}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Otkaži prijavu
                  </button>
                )}
                {canReview(app) && getEventId(app) && (
                  <Link
                    to={`/user/reviews/${getEventId(app)}`}
                    className="inline-flex items-center gap-1 text-mint hover:text-[#B8D4C5] font-semibold transition-colors"
                  >
                    <StarIcon className="w-4 h-4" />
                    Oceni organizaciju
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

