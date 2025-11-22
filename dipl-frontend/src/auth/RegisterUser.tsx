import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { UserIn } from "../types/api";

export function RegisterUser() {
  const [formData, setFormData] = useState<Partial<UserIn>>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    title: "",
    location: "",
    age: 16,
    about: "",
    experience: "",
    skills: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 16 : value,
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
      await registerUser(formData as UserIn);
      // Redirect to login page after successful registration
      navigate("/login-user");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#121212]">Registracija korisnika</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Korisničko ime *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Ime *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Prezime *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-bold mb-2">
              Lozinka *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Zanimanje *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-[#121212] text-sm font-bold mb-2">
                Godine *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="16"
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-bold mb-2">
              Lokacija *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-bold mb-2">
              O meni *
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="input-field"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-bold mb-2">
              Iskustvo
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Opišite svoje iskustvo u volontiranju ili relevantnim aktivnostima..."
            />
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-bold mb-2">
              Veštine
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                className="flex-1 input-field"
                placeholder="Dodaj veštinu"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-cream text-[#121212] px-4 py-2 rounded-md hover:opacity-90 border border-mint"
              >
                Dodaj
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="bg-mint text-[#121212] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-[#121212] hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? "Registracija..." : "Registruj se"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#121212]">
          Već imate nalog?{" "}
          <Link to="/login-user" className="text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all inline-block">
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  );
}

