import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { applicationsApi } from "../../api/applications";
import { publicApi } from "../../api/public";
import type { ApplicationIn, EventPublic } from "../../types/api";
import { showToast } from "../../components/Toast";
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ArrowLeftIcon,
  SparklesIcon,
  PhoneIcon,
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export function ApplyToEvent() {
  const { title } = useParams<{ title: string }>();   // Primamo event title
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventPublic | null>(null);
  const [formData, setFormData] = useState<Partial<ApplicationIn>>({
    motivation: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState("");
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    if (title) {
      loadEvent();
    }
  }, [title]);

  const loadEvent = async () => {
    setLoadingEvent(true);
    setError("");
    try {
      // Decode title in case it's URL encoded
      const decodedTitle = decodeURIComponent(title!);
      const eventData = await publicApi.getEventByTitle(decodedTitle);  // Učitava se po title
      setEvent(eventData);

      console.log("Event loaded:", eventData);
      console.log("Event ID (id):", eventData.id);
      console.log("Event ID (_id):", eventData._id);
      
      // Event ID će se koristiti direktno iz event objekta u handleSubmit
    } catch (error: any) {
      console.error("Failed to load event:", error);
      setError(error?.message || "Događaj nije pronađen");
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get event_id directly from event object
      if (!event) {
        throw new Error("Događaj nije učitan. Molimo osvežite stranicu i pokušajte ponovo.");
      }

      const eventId = event.id || event._id || (event as any).event_id;
      
      if (!eventId) {
        console.error("Event object:", event);
        throw new Error("Event ID nije pronađen u podacima događaja. Molimo kontaktirajte podršku.");
      }

      if (!formData.motivation || !formData.phone) {
        throw new Error("Molimo popunite sva obavezna polja.");
      }

      const submitData: ApplicationIn = {
        event_id: String(eventId),
        motivation: formData.motivation!,
        phone: formData.phone!,
      };

      console.log("Event object:", event);
      console.log("Event ID found:", eventId);
      console.log("Submitting application:", submitData);
      await applicationsApi.apply(submitData);
      showToast("Prijava je uspešno poslata!", "success");
      setTimeout(() => {
        navigate("/user/applications");
      }, 1500);
    } catch (err: any) {
      console.error("Application error:", err);
      console.error("Error detail:", err?.detail);
      
      // Parse FastAPI validation errors
      let errorMessage = err?.message || "Greška pri slanju prijave. Molimo pokušajte ponovo.";
      
      if (err?.detail) {
        if (typeof err.detail === "string") {
          errorMessage = err.detail;
        } else if (Array.isArray(err.detail)) {
          // FastAPI validation errors format
          const firstError = err.detail[0];
          if (firstError?.loc && firstError?.msg) {
            const field = firstError.loc[firstError.loc.length - 1];
            errorMessage = `${field}: ${firstError.msg}`;
          } else if (firstError?.msg) {
            errorMessage = firstError.msg;
          }
        } else if (err.detail?.message) {
          errorMessage = err.detail.message;
        }
      }
      
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje događaja...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-4 inline-block">
          {error || "Događaj nije pronađen"}
        </div>
        <button
          onClick={() => navigate("/events")}
          className="btn-primary"
        >
          Nazad na događaje
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Back Button */}
      <Link 
        to={`/events/${encodeURIComponent(event.title)}`}
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na događaj
      </Link>

      {/* Hero Section - Event Info */}
      <div className="card p-8 mb-8 bg-gradient-to-br from-mint/20 via-cream/30 to-white border-2 border-mint/30">
        <div className="flex flex-col md:flex-row gap-6">
          {event.image && (
            <div className="md:w-64 h-64 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-mint shadow-lg">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-mint/20 rounded-xl">
                <SparklesIcon className="w-8 h-8 text-mint" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#121212] leading-tight">
                Prijavi se na događaj
              </h1>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#121212] mb-4">
              {event.title}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mint/20 rounded-lg">
                  <MapPinIcon className="w-5 h-5 text-mint" />
                </div>
                <span className="text-lg font-semibold text-[#121212]">{event.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mint/20 rounded-lg">
                  <CalendarDaysIcon className="w-5 h-5 text-mint" />
                </div>
                <span className="text-lg font-semibold text-[#121212]">
                  {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {event.category && (
                <div className="flex items-center gap-3">
                  <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold">
                    {event.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Event Details Section */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-cream/30 to-white border-2 border-mint/20 hover:border-mint/40 transition-all">
        <button
          onClick={() => setShowEventDetails(!showEventDetails)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mint/20 rounded-lg group-hover:bg-mint/30 transition-colors">
              <CalendarDaysIcon className="w-6 h-6 text-mint" />
            </div>
            <h3 className="text-xl font-bold text-[#121212]">
              Dodatne informacije o događaju
            </h3>
          </div>
          {showEventDetails ? (
            <ChevronUpIcon className="w-6 h-6 text-mint transition-transform" />
          ) : (
            <ChevronDownIcon className="w-6 h-6 text-mint transition-transform" />
          )}
        </button>

        {showEventDetails && (
          <div className="mt-6 pt-6 border-t-2 border-mint/20 space-y-6 animate-fade-in">
            {/* Description */}
            {event.description && (
              <div>
                <h4 className="text-lg font-bold text-[#121212] mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-mint" />
                  Opis događaja
                </h4>
                <p className="text-[#121212] font-medium leading-relaxed text-base bg-white/50 p-4 rounded-xl border border-mint/20">
                  {event.description}
                </p>
              </div>
            )}

            {/* Date and Time Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="bg-white/50 p-5 rounded-xl border border-mint/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-mint/20 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-mint" />
                  </div>
                  <h4 className="text-base font-bold text-[#121212]">Početak događaja</h4>
                </div>
                <p className="text-[#121212] font-semibold text-lg">
                  {new Date(event.start_date).toLocaleDateString('sr-RS', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                  })}
                </p>
                <p className="text-mint font-bold text-base mt-1">
                  {new Date(event.start_date).toLocaleTimeString('sr-RS', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* End Date */}
              {event.end_date && (
                <div className="bg-white/50 p-5 rounded-xl border border-mint/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-mint/20 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-mint" />
                    </div>
                    <h4 className="text-base font-bold text-[#121212]">Kraj događaja</h4>
                  </div>
                  <p className="text-[#121212] font-semibold text-lg">
                    {new Date(event.end_date).toLocaleDateString('sr-RS', { 
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-mint font-bold text-base mt-1">
                    {new Date(event.end_date).toLocaleTimeString('sr-RS', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Location (if not already shown) */}
            <div className="bg-white/50 p-5 rounded-xl border border-mint/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-mint/20 rounded-lg">
                  <MapPinIcon className="w-5 h-5 text-mint" />
                </div>
                <h4 className="text-base font-bold text-[#121212]">Lokacija</h4>
              </div>
              <p className="text-[#121212] font-semibold text-lg">
                {event.location}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Application Form */}
      <div className="card p-8 bg-gradient-to-br from-white to-cream/20 border-2 border-mint/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-mint/20 rounded-xl">
            <UserGroupIcon className="w-8 h-8 text-mint" />
          </div>
          <h2 className="text-3xl font-bold text-[#121212]">Budi naš volonter!</h2>
        </div>
        <p className="text-gray-700 text-lg mb-8 font-medium leading-relaxed">
          Popuni formu ispod i postani deo naše zajednice volontera. Tvoja motivacija i entuzijazam su ono što nas čini posebnim! 💚
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#121212] text-base font-bold mb-3 flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-mint" />
              Motivacija *
              <span className="text-sm font-normal text-gray-600">(10-500 karaktera)</span>
            </label>
            <textarea
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-mint focus:outline-none text-[#121212] font-medium resize-none transition-all"
              rows={6}
              minLength={10}
              maxLength={500}
              placeholder="Opišite zašto želite da volontirate na ovom događaju. Šta vas motivira? Kakvo iskustvo očekujete? Vaša motivacija pomaže organizatorima da vas bolje upoznaju! ✨"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 font-medium">
                Minimum 10 karaktera
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {formData.motivation?.length || 0}/500 karaktera
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[#121212] text-base font-bold mb-3 flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-mint" />
              Kontakt telefon *
              <span className="text-sm font-normal text-gray-600">(6-20 karaktera)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-mint focus:outline-none text-[#121212] font-medium transition-all"
              placeholder="npr. 0641234567"
              minLength={6}
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 font-medium mt-2">
              Organizator će vas kontaktirati na ovaj broj
            </p>
          </div>

          <div className="pt-4 border-t-2 border-mint/20">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-mint to-[#B8D4C5] text-[#121212] py-4 px-6 rounded-xl font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#121212]"></div>
                  <span>Slanje prijave...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  <span>Pošalji prijavu</span>
                </>
              )}
            </button>
            <p className="text-center text-sm text-gray-600 mt-4 font-medium">
              Klikom na "Pošalji prijavu" potvrđujete da želite da volontirate na ovom događaju. Organizator će vas kontaktirati u najkraćem roku! 🎉
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
