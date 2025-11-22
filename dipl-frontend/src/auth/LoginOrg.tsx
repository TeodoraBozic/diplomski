import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

export function LoginOrg() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginOrg } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginOrg(email, password);
      navigate("/org/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 animate-fade-in-up">
      <div className="card p-10 bg-gradient-to-br from-cream/30 to-white border-2 border-mint/30">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-mint/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BuildingOfficeIcon className="w-14 h-14 text-mint" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="w-6 h-6 text-mint" />
            <h2 className="text-4xl font-extrabold text-[#121212]">
              Dobrodošli!
            </h2>
            <SparklesIcon className="w-6 h-6 text-mint" />
          </div>
          <p className="text-[#121212] text-lg font-medium leading-relaxed">
            Kako biste nastavili sa organizovanjem događaja i pristupili svim mogućnostima platforme, molimo prijavite se.
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <EnvelopeIcon className="w-5 h-5 text-mint" />
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 hover:border-mint transition-colors"
                placeholder="Unesite vašu email adresu"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[#121212] text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wide">
              <LockClosedIcon className="w-5 h-5 text-mint" />
              Lozinka
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 hover:border-mint transition-colors"
                placeholder="Unesite vašu lozinku"
                required
              />
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
                Prijavljivanje...
              </>
            ) : (
              <>
                Prijavi se
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        <div className="mt-8 space-y-3">
          <p className="text-center text-sm text-[#121212] font-medium">
            Nemate nalog?{" "}
            <Link to="/register-org" className="text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all inline-block">
              Registrujte se ovde
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

