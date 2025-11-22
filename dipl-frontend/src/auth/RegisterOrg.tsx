import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { OrganisationIn } from "../types/api";
import { showToast } from "../components/Toast";
import { 
  BuildingOfficeIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export function RegisterOrg() {
  const [formData, setFormData] = useState<Partial<OrganisationIn>>({
    username: "",
    name: "",
    email: "",
    password: "",
    description: "",
    location: "",
    phone: "",
    website: "",
    org_type: "official",
  });
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerOrg } = useAuth();
  const navigate = useNavigate();

  const validateUsername = (username: string): string => {
    if (!username) return "";
    
    // Proveri da li sadrži velika slova
    if (/[A-Z]/.test(username)) {
      return "Korisničko ime ne može sadržati velika slova. Koristite samo mala slova, brojeve i donje crte.";
    }
    
    // Proveri da li sadrži samo dozvoljene karaktere (mala slova, brojevi, donje crte)
    if (!/^[a-z0-9_]+$/.test(username)) {
      return "Korisničko ime može sadržati samo mala slova, brojeve i donje crte (_).";
    }
    
    // Proveri minimalnu dužinu
    if (username.length < 3) {
      return "Korisničko ime mora imati najmanje 3 karaktera.";
    }
    
    // Proveri maksimalnu dužinu
    if (username.length > 30) {
      return "Korisničko ime ne može imati više od 30 karaktera.";
    }
    
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Validacija korisničkog imena u realnom vremenu
    if (name === "username") {
      const validationError = validateUsername(value);
      setUsernameError(validationError);
      if (validationError) {
        setError("");
      }
    }
  };

  const parseError = (error: any): string => {
    // Ako je detail string, vrati ga direktno
    if (typeof error.detail === "string") {
      // Parsiraj specifične poruke grešaka
      const detail = error.detail.toLowerCase();
      
      if (detail.includes("username") || detail.includes("korisničko ime")) {
        if (detail.includes("already exists") || detail.includes("već postoji") || detail.includes("taken")) {
          return "Korisničko ime već postoji. Pokušajte ponovo sa drugim korisničkim imenom.";
        }
        if (detail.includes("uppercase") || detail.includes("velika slova")) {
          return "Korisničko ime ne može sadržati velika slova. Koristite samo mala slova, brojeve i donje crte.";
        }
        if (detail.includes("invalid") || detail.includes("nevalidno")) {
          return "Korisničko ime nije validno. Koristite samo mala slova, brojeve i donje crte (_).";
        }
      }
      
      return error.detail;
    }
    
    // Ako je detail array (FastAPI validation errors)
    if (Array.isArray(error.detail)) {
      const usernameError = error.detail.find((err: any) => 
        err.loc && Array.isArray(err.loc) && err.loc.includes("username")
      );
      
      if (usernameError) {
        const msg = usernameError.msg.toLowerCase();
        if (msg.includes("already exists") || msg.includes("već postoji") || msg.includes("taken")) {
          return "Korisničko ime već postoji. Pokušajte ponovo sa drugim korisničkim imenom.";
        }
        if (msg.includes("uppercase") || msg.includes("velika slova")) {
          return "Korisničko ime ne može sadržati velika slova. Koristite samo mala slova, brojeve i donje crte.";
        }
        return usernameError.msg || "Korisničko ime nije validno.";
      }
      
      // Vrati prvu grešku ako nema specifične za username
      return error.detail[0]?.msg || "Greška pri validaciji podataka.";
    }
    
    // Fallback na message ili default poruku
    return error.message || "Greška pri registraciji. Pokušajte ponovo.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validacija korisničkog imena pre slanja
    const usernameValidation = validateUsername(formData.username || "");
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      setError(usernameValidation);
      setLoading(false);
      return;
    }

    try {
      await registerOrg(formData as OrganisationIn);
      showToast("Registracija uspešna! Molimo sačekajte odobrenje administratora.", "success");
      setTimeout(() => {
        navigate("/login-org");
      }, 1500);
    } catch (err: any) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      // Ako je greška vezana za username, postavi i usernameError
      if (errorMessage.includes("Korisničko ime")) {
        setUsernameError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-fade-in-up">
      <div className="card p-10 bg-gradient-to-br from-cream/30 to-white border-2 border-mint/30">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-mint/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BuildingOfficeIcon className="w-14 h-14 text-mint" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="w-6 h-6 text-mint" />
            <h2 className="text-4xl font-extrabold text-[#121212]">
              Registrujte organizaciju
            </h2>
            <SparklesIcon className="w-6 h-6 text-mint" />
          </div>
          <p className="text-[#121212] text-lg font-medium leading-relaxed">
            Pridružite se našoj platformi i povežite se sa entuzijastičnim volonterima koji žele da pomognu vašoj organizaciji u organizovanju događaja.
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <UserIcon className="w-5 h-5 text-mint" />
                Korisničko ime *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input-field pl-10 hover:border-mint transition-colors ${
                    usernameError 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : ""
                  }`}
                  required
                  placeholder="npr. moja_organizacija"
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
              {!usernameError && formData.username && (
                <p className="mt-1 text-xs text-gray-500">
                  Koristite samo mala slova, brojeve i donje crte (_)
                </p>
              )}
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <IdentificationIcon className="w-5 h-5 text-mint" />
                Naziv organizacije *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  required
                  placeholder="Unesite naziv organizacije"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <EnvelopeIcon className="w-5 h-5 text-mint" />
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  required
                  placeholder="Unesite email adresu"
                />
              </div>
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <LockClosedIcon className="w-5 h-5 text-mint" />
                Lozinka *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  required
                  placeholder="Unesite lozinku"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <DocumentTextIcon className="w-5 h-5 text-mint" />
              Opis *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field hover:border-mint transition-colors"
              rows={3}
              required
              placeholder="Opisite vašu organizaciju i ciljeve"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <MapPinIcon className="w-5 h-5 text-mint" />
                Lokacija *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  required
                  placeholder="Unesite lokaciju"
                />
              </div>
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <BuildingOfficeIcon className="w-5 h-5 text-mint" />
                Tip organizacije *
              </label>
              <select
                name="org_type"
                value={formData.org_type}
                onChange={handleChange}
                className="input-field hover:border-mint transition-colors"
                required
              >
                <option value="official">Zvanična organizacija</option>
                <option value="informal">Neformalna grupa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <PhoneIcon className="w-5 h-5 text-mint" />
                Telefon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  placeholder="Unesite broj telefona"
                />
              </div>
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
                <GlobeAltIcon className="w-5 h-5 text-mint" />
                Veb sajt
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="input-field pl-10 hover:border-mint transition-colors"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 transition-transform font-bold text-lg py-4"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#121212]"></div>
                Registracija...
              </>
            ) : (
              <>
                Registruj se
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        <div className="mt-8 space-y-3">
          <p className="text-center text-sm text-[#121212] font-medium">
            Već imate nalog?{" "}
            <Link to="/login-org" className="text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all inline-block">
              Prijavi se
            </Link>
          </p>
          <p className="text-center text-sm text-[#121212] font-medium">
            Korisnik?{" "}
            <Link to="/login-user" className="text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all inline-block">
              Prijavite se kao korisnik
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

