import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { eventsApi } from "../../api/events";
import { uploadsApi } from "../../api/uploads";
import type { EventIn, EventCategory } from "../../types/api";
import { showToast } from "../../components/Toast";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TagIcon,
  PhotoIcon,
  UsersIcon,
  ArrowLeftIcon,
  PlusCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<EventIn>>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    category: "other",
    max_volunteers: null,
    image: null,
    tags: [],
  });
  // Separate date and time states for easier input
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper function to format time (accepts HH:MM or H:MM and converts to HH:MM)
  const formatTime = (time: string): string => {
    if (!time) return "";
    // Remove any spaces
    time = time.trim();
    // If it matches HH:MM or H:MM format
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      // Validate hours (0-23) and minutes (0-59)
      const h = parseInt(hours);
      const m = parseInt(minutes);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${hours}:${minutes}`;
      }
    }
    return time; // Return as-is if doesn't match, will be validated on submit
  };

  // Helper function to combine date and time into datetime-local format
  const combineDateTime = (date: string, time: string): string => {
    if (!date || !time) return "";
    const formattedTime = formatTime(time);
    return `${date}T${formattedTime}`;
  };

  // Update formData when date/time changes
  const updateDateTime = (type: "start" | "end", date: string, time: string) => {
    const formattedTime = formatTime(time);
    const combined = combineDateTime(date, formattedTime);
    if (type === "start") {
      setStartDate(date);
      setStartTime(time); // Keep original input for display
      setFormData((prev) => ({ ...prev, start_date: combined }));
    } else {
      setEndDate(date);
      setEndTime(time); // Keep original input for display
      setFormData((prev) => ({ ...prev, end_date: combined }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "max_volunteers"
          ? value ? parseInt(value) : null
          : value,
    }));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        showToast("Molimo izaberite sliku", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast("Slika ne sme biti veća od 5MB", "error");
        return;
      }
      setFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      // Clear URL input if file is selected
      setFormData((prev) => ({ ...prev, image: null }));
    }
  };

  const removeImage = () => {
    setFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let imageUrl = formData.image;

      // Upload image if file is selected
      if (file) {
        const uploadResult = await uploadsApi.uploadEventImage(file);
        // Backend should return the image URL
        imageUrl = uploadResult.url || uploadResult.image_url || uploadResult.image || uploadResult;
        if (typeof imageUrl !== "string") {
          throw new Error("Greška pri upload-u slike - backend nije vratio URL");
        }
      }

      // Create event with image URL
      const eventData: EventIn = {
        ...formData,
        image: imageUrl || null,
      } as EventIn;

      await eventsApi.createEvent(eventData);
      showToast("Događaj je uspešno kreiran!", "success");
      setTimeout(() => {
        navigate("/org/events");
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || "Greška pri kreiranju događaja";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<EventCategory, string> = {
    sports: "Sport",
    cultural: "Kultura",
    business: "Biznis",
    eco: "Ekologija",
    festival: "Festival",
    concert: "Koncert",
    education: "Obrazovanje",
    charity: "Dobrotvornost",
    community: "Zajednica",
    other: "Ostalo"
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <Link 
        to="/org/events" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na događaje
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-mint/20 rounded-xl">
          <PlusCircleIcon className="w-10 h-10 text-mint" />
        </div>
        <h1 className="text-4xl font-bold text-[#121212]">Kreiraj novi događaj</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Basic Info Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-mint" />
            Osnovne informacije
          </h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <CalendarDaysIcon className="w-4 h-4 text-mint" />
                Naziv događaja * (3-200 karaktera)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                minLength={3}
                maxLength={200}
                placeholder="Unesite naziv događaja"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <CalendarDaysIcon className="w-4 h-4 text-mint" />
                Opis događaja * (10-2000 karaktera)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field resize-none"
                rows={5}
                minLength={10}
                maxLength={2000}
                placeholder="Opisite vaš događaj..."
                required
              />
            </div>
          </div>
        </div>

        {/* Date and Location Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-mint" />
            Datum i lokacija
          </h2>
          <div className="space-y-6">
            {/* Dates Row */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-3">
                <CalendarDaysIcon className="w-4 h-4 text-mint" />
                Datumi *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1.5 font-medium">Datum početka</label>
                  <div className="relative">
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => updateDateTime("start", e.target.value, startTime)}
                      className="input-field w-full pr-10 cursor-pointer"
                      required
                    />
                    <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1.5 font-medium">Datum završetka</label>
                  <div className="relative">
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => updateDateTime("end", e.target.value, endTime)}
                      className="input-field w-full pr-10 cursor-pointer"
                      min={startDate || undefined}
                      required
                    />
                    <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Times Row */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-3">
                <ClockIcon className="w-4 h-4 text-mint" />
                Vremena *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time" className="block text-xs text-gray-600 mb-1.5 font-medium">Vreme početka</label>
                  <div className="relative">
                    <input
                      id="start-time"
                      type="text"
                      value={startTime}
                      onChange={(e) => updateDateTime("start", startDate, e.target.value)}
                      className="input-field w-full pr-10"
                      placeholder="npr. 14:30 ili 9:00"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Unesite vreme u formatu HH:MM (npr. 14:30)"
                      required
                    />
                    <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: HH:MM (24h)</p>
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-xs text-gray-600 mb-1.5 font-medium">Vreme završetka</label>
                  <div className="relative">
                    <input
                      id="end-time"
                      type="text"
                      value={endTime}
                      onChange={(e) => updateDateTime("end", endDate, e.target.value)}
                      className="input-field w-full pr-10"
                      placeholder="npr. 18:00 ili 10:30"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Unesite vreme u formatu HH:MM (npr. 18:00)"
                      required
                    />
                    <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: HH:MM (24h)</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <MapPinIcon className="w-4 h-4 text-mint" />
                Lokacija *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="Unesite lokaciju događaja"
                required
              />
            </div>
          </div>
        </div>

        {/* Category and Volunteers Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-mint" />
            Kategorija i volonteri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <TagIcon className="w-4 h-4 text-mint" />
                Kategorija *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                required
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <UsersIcon className="w-4 h-4 text-mint" />
                Maksimalan broj volontera
              </label>
              <input
                type="number"
                name="max_volunteers"
                value={formData.max_volunteers || ""}
                onChange={handleChange}
                className="input-field"
                min="1"
                placeholder="Ostavite prazno za neograničeno"
              />
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-mint" />
            Slika događaja
          </h2>
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <PhotoIcon className="w-4 h-4 text-mint" />
                Upload slike
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Maksimalna veličina: 5MB</p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-xl border-2 border-mint"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* OR Divider */}
            {!file && (
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">ILI</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            )}

            {/* URL Input (only if no file selected) */}
            {!file && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                  <PhotoIcon className="w-4 h-4 text-mint" />
                  URL slike
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-mint" />
            Tagovi
          </h2>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="input-field flex-1"
              placeholder="Dodaj tag i pritisni Enter"
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-primary px-6 hover:scale-105 transition-transform"
            >
              Dodaj
            </button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-[#121212] hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/org/events")}
            className="flex-1 bg-gray-200 text-[#121212] px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Otkaži
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary px-6 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#121212]"></div>
                Kreiranje...
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5" />
                Kreiraj događaj
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

