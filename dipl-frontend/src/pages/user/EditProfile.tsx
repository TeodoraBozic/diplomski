import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usersApi } from "../../api/users";
import { uploadsApi } from "../../api/uploads";
import { useAuth } from "../../auth/useAuth";
import type { UserUpdate } from "../../types/api";
import { 
  PencilIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  BriefcaseIcon, 
  MapPinIcon, 
  CalendarDaysIcon,
  SparklesIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { showToast } from "../../components/Toast";

export function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<UserUpdate>>({});
  const [skillInput, setSkillInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        title: user.title,
        location: user.location,
        age: user.age,
        about: user.about,
        skills: user.skills || [],
        experience: user.experience || null,
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || undefined : value,
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (file) {
        await uploadsApi.uploadUserImage(file);
      }
      await usersApi.updateMe(formData as UserUpdate);
      showToast("Profil je uspešno ažuriran!", "success");
      navigate("/user/profile");
    } catch (err: any) {
      setError(err.message || "Update failed");
      showToast("Greška pri ažuriranju profila", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <Link 
        to="/user/profile" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na profil
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-mint/20 rounded-xl">
          <PencilIcon className="w-10 h-10 text-mint" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212]">Izmeni profil</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Profile Image */}
        <div>
          <label className="block text-[#121212] text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide">
            <PhotoIcon className="w-5 h-5 text-mint" />
            Slika profila
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mint file:text-[#121212] hover:file:bg-[#B8D4C5] file:cursor-pointer"
            />
          </div>
        </div>

        {/* Username and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <UserCircleIcon className="w-5 h-5 text-mint" />
              Korisničko ime
            </label>
            <input
              type="text"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
              className="input-field hover:border-mint transition-colors"
              placeholder="Unesite korisničko ime"
            />
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <EnvelopeIcon className="w-5 h-5 text-mint" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="input-field hover:border-mint transition-colors"
              placeholder="Unesite email adresu"
            />
          </div>
        </div>

        {/* Title and Age */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <BriefcaseIcon className="w-5 h-5 text-mint" />
              Zanimanje
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              className="input-field hover:border-mint transition-colors"
              placeholder="Unesite zanimanje"
            />
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <CalendarDaysIcon className="w-5 h-5 text-mint" />
              Godine
            </label>
            <input
              type="number"
              name="age"
              value={formData.age || ""}
              onChange={handleChange}
              min="16"
              className="input-field hover:border-mint transition-colors"
              placeholder="Unesite godine"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
            <MapPinIcon className="w-5 h-5 text-mint" />
            Lokacija
          </label>
          <input
            type="text"
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            className="input-field hover:border-mint transition-colors"
            placeholder="Unesite lokaciju"
          />
        </div>

        {/* About */}
        <div>
          <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
            <UserCircleIcon className="w-5 h-5 text-mint" />
            O meni
          </label>
          <textarea
            name="about"
            value={formData.about || ""}
            onChange={handleChange}
            className="input-field hover:border-mint transition-colors resize-none"
            rows={4}
            placeholder="Napišite nešto o sebi..."
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-[#121212] text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide">
            <SparklesIcon className="w-5 h-5 text-mint" />
            Veštine
          </label>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className="input-field flex-1 hover:border-mint transition-colors"
              placeholder="Dodaj veštinu i pritisni Enter"
            />
            <button
              type="button"
              onClick={addSkill}
              className="btn-primary px-6 hover:scale-105 transition-transform"
            >
              Dodaj
            </button>
          </div>
          {formData.skills && formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-bold shadow-md flex items-center gap-2 group"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-[#121212] hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience */}
        <div>
          <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
            <BriefcaseIcon className="w-5 h-5 text-mint" />
            Iskustvo
          </label>
          <textarea
            name="experience"
            value={formData.experience || ""}
            onChange={handleChange}
            className="input-field hover:border-mint transition-colors resize-none"
            rows={4}
            placeholder="Opisite vaše iskustvo..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 transition-transform font-bold text-lg py-4"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#121212]"></div>
                Čuvanje...
              </>
            ) : (
              <>
                <PencilIcon className="w-5 h-5" />
                Sačuvaj izmene
              </>
            )}
          </button>
          <Link
            to="/user/profile"
            className="btn-secondary flex items-center justify-center gap-2 px-6"
          >
            Otkaži
          </Link>
        </div>
      </form>
    </div>
  );
}

