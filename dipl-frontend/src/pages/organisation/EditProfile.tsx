import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { organisationsApi } from "../../api/organisations";
import { uploadsApi } from "../../api/uploads";
import { useAuth } from "../../auth/useAuth";
import type { OrganisationUpdate } from "../../types/api";
import { 
  PencilIcon, 
  BuildingOfficeIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  PhoneIcon,
  GlobeAltIcon,
  PhotoIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { showToast } from "../../components/Toast";

export function EditProfile() {
  const { organisation } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<OrganisationUpdate>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (organisation) {
      setFormData({
        username: organisation.username,
        name: organisation.name,
        email: organisation.email,
        description: organisation.description || null,
        location: organisation.location || null,
        phone: organisation.phone || null,
        website: organisation.website || null,
        org_type: organisation.org_type || null,
        password: null,
      });
    }
  }, [organisation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (file) {
        await uploadsApi.uploadOrgLogo(file);
      }
      // Only send password if it's been changed (not empty)
      const updateData: OrganisationUpdate = { ...formData };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      await organisationsApi.updateMe(updateData);
      showToast("Profil je uspešno ažuriran!", "success");
      navigate("/org/profile");
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || "Greška pri ažuriranju profila";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <Link 
        to="/org/profile" 
        className="flex items-center gap-2 text-mint hover:text-[#B8D4C5] transition-colors mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na profil
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-[#121212]">Izmeni profil organizacije</h1>

      {error && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-3">
            <PhotoIcon className="w-5 h-5 text-mint" />
            Logo organizacije
          </label>
          <div className="flex items-center gap-4">
            {organisation?.logo && (
              <img
                src={organisation.logo}
                alt="Current logo"
                className="w-20 h-20 object-cover rounded-xl border-2 border-mint shadow-md"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-mint" />
            Osnovne informacije
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <BuildingOfficeIcon className="w-4 h-4 text-mint" />
                Korisničko ime
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <BuildingOfficeIcon className="w-4 h-4 text-mint" />
                Naziv organizacije
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5 text-mint" />
            Kontakt informacije
          </h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <EnvelopeIcon className="w-4 h-4 text-mint" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <LockClosedIcon className="w-4 h-4 text-mint" />
                Nova lozinka (ostavite prazno ako ne menjate)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Unesite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-mint transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                  <PhoneIcon className="w-4 h-4 text-mint" />
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                  <GlobeAltIcon className="w-4 h-4 text-mint" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-mint" />
            Lokacija i tip
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <MapPinIcon className="w-4 h-4 text-mint" />
                Lokacija
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
                <BuildingOfficeIcon className="w-4 h-4 text-mint" />
                Tip organizacije
              </label>
              <select
                name="org_type"
                value={formData.org_type || ""}
                onChange={handleChange}
                className="input-field"
              >
                <option value="official">Zvanična organizacija</option>
                <option value="informal">Neformalna grupa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#121212] mb-2">
            <BuildingOfficeIcon className="w-4 h-4 text-mint" />
            Opis organizacije
          </label>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            className="input-field"
            rows={5}
            placeholder="Opisite vašu organizaciju..."
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/org/profile")}
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
                Čuvanje...
              </>
            ) : (
              <>
                <PencilIcon className="w-5 h-5" />
                Sačuvaj izmene
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

