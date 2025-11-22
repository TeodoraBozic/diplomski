import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { 
  HomeIcon, 
  CalendarIcon, 
  BuildingOfficeIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export function Navbar() {
  const { isAuthenticated, role, logout, user, organisation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-300 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity h-full">
            <img 
              src="/logo.png" 
              alt="EventHub Logo" 
              className="h-full w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/events" className="flex items-center gap-1.5 text-gray-700 hover:text-mint transition-colors font-medium">
              <CalendarIcon className="w-5 h-5" />
              Događaji
            </Link>
            <Link to="/organisations" className="flex items-center gap-1.5 text-gray-700 hover:text-mint transition-colors font-medium">
              <BuildingOfficeIcon className="w-5 h-5" />
              Organizacije
            </Link>

            {isAuthenticated ? (
              <>
                {role === "user" && (
                  <Link 
                    to="/user/dashboard" 
                    className={`flex items-center gap-1.5 transition-all font-medium rounded-xl px-4 py-2 ${
                      location.pathname === "/user/dashboard" || location.pathname === "/user/profile"
                        ? "bg-mint text-[#121212] font-bold shadow-md"
                        : "text-gray-700 hover:text-mint hover:bg-mint/10"
                    }`}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    Moj profil
                  </Link>
                )}
                {role === "organisation" && (
                  <>
                    <Link 
                      to="/org/dashboard" 
                      className={`flex items-center gap-1.5 transition-all font-medium rounded-xl px-4 py-2 ${
                        location.pathname === "/org/dashboard"
                          ? "bg-mint text-[#121212] font-bold shadow-md"
                          : "text-gray-700 hover:text-mint hover:bg-mint/10"
                      }`}
                    >
                      <UserIcon className="w-5 h-5" />
                      Kontrolna tabla
                    </Link>
                    <Link 
                      to="/org/profile" 
                      className={`flex items-center gap-1.5 transition-all font-medium rounded-xl px-4 py-2 ${
                        location.pathname === "/org/profile"
                          ? "bg-mint text-[#121212] font-bold shadow-md"
                          : "text-gray-700 hover:text-mint hover:bg-mint/10"
                      }`}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      Profil
                    </Link>
                  </>
                )}
                {role === "admin" && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`flex items-center gap-1.5 transition-all font-medium rounded-xl px-4 py-2 ${
                      location.pathname.startsWith("/admin")
                        ? "bg-mint text-[#121212] font-bold shadow-md"
                        : "text-gray-700 hover:text-mint hover:bg-mint/10"
                    }`}
                  >
                    <ShieldCheckIcon className="w-5 h-5" />
                    Admin
                  </Link>
                )}
                <span className="text-sm text-[#121212] px-3 py-1.5 bg-gray-200 rounded-lg font-medium border border-gray-300">
                  {user?.username || organisation?.username || "Korisnik"}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-[#121212] px-4 py-2 rounded-xl transition-all font-medium border border-gray-300"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Odjavi se
                </button>
              </>
            ) : (
              <>
                <Link to="/login-user" className="text-gray-700 hover:text-mint transition-colors font-medium">
                  Prijavi se
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to="/register-user"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Registruj se (Korisnik)
                  </Link>
                  <Link
                    to="/register-org"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Registruj se (Organizacija)
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

