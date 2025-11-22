import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { reviewsApi } from "../../api/reviews";
import type { ReviewOrgToUserIn } from "../../types/api";
import { showToast } from "../../components/Toast";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon, ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";

export function ReviewsGivenToUsers() {
  const { eventId, userId } = useParams<{ eventId: string; userId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReviewOrgToUserIn>({
    rating: 5,
    comment: "",
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRatingClick = (rating: 1 | 2 | 3 | 4 | 5) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !userId) {
      setError("ID događaja i ID korisnika su obavezni");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await reviewsApi.createOrgToUserReview(eventId, userId, formData);
      showToast("Ocena je uspešno poslata!", "success");
      setTimeout(() => {
        navigate("/org/applications");
      }, 1500);
    } catch (err: any) {
      let errorMessage = err?.message || err?.detail || "Greška pri slanju ocene";
      
      // Poboljšana poruka za greške vezane za završetak događaja
      if (errorMessage.toLowerCase().includes("završen") || 
          errorMessage.toLowerCase().includes("ended") ||
          errorMessage.toLowerCase().includes("finished") ||
          errorMessage.toLowerCase().includes("not finished")) {
        errorMessage = "Događaj još nije završen. Ocena se može dati samo nakon završetka događaja.";
      }
      
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: "Veoma loše",
    2: "Loše",
    3: "Dobro",
    4: "Veoma dobro",
    5: "Odlično",
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Link 
        to="/org/applications" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na prijave
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-mint/20 rounded-xl">
          <SparklesIcon className="w-10 h-10 text-mint" />
        </div>
        <h1 className="text-4xl font-bold text-[#121212]">Oceni volontera</h1>
      </div>

      {error && (
        <div className="card p-4 mb-6 bg-red-50 border-2 border-red-300">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Rating Section */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-4">
            <StarIcon className="w-5 h-5 text-mint" />
            Ocena *
          </label>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoveredRating || formData.rating);
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
                      <StarIcon className="w-10 h-10 text-mint" />
                    ) : (
                      <StarOutlineIcon className="w-10 h-10 text-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-lg font-bold text-[#121212]">
              {ratingLabels[hoveredRating || formData.rating]}
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
            value={formData.comment || ""}
            onChange={handleChange}
            className="input-field resize-none"
            rows={6}
            maxLength={500}
            placeholder="Podelite svoje iskustvo sa volonterom..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.comment?.length || 0} / 500 karaktera
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/org/applications")}
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
  );
}

