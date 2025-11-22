import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/admin";
import { publicApi } from "../../api/public";
import type { UserPublic, OrganisationPublic } from "../../types/api";
import { 
  UserGroupIcon, 
  BuildingOffice2Icon, 
  ClockIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export function AdminDashboard() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<OrganisationPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, orgsData] = await Promise.all([
        adminApi.getAllUsers().catch(() => publicApi.getUsers()), // Fallback na public API ako admin endpoint ne postoji
        adminApi.getPendingOrgs()
      ]);
      setUsers(usersData || []);
      setPendingOrgs(orgsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-mint/20 rounded-xl">
          <ShieldCheckIcon className="w-10 h-10 text-mint" />
        </div>
        <h1 className="text-4xl font-bold text-[#121212]">Admin Kontrolna Tabla</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/20 rounded-xl">
                <UserGroupIcon className="w-6 h-6 text-mint" />
              </div>
              <h2 className="text-2xl font-bold text-[#121212]">Svi korisnici</h2>
            </div>
            <span className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-bold">
              {users.length}
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Pregled svih registrovanih korisnika na platformi
          </p>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Vidi sve korisnike
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Pending Organisations Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#121212]">Organizacije na čekanju</h2>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold">
              {pendingOrgs.length}
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Organizacije koje čekaju odobrenje
          </p>
          <Link
            to="/admin/pending"
            className="inline-flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Pregledaj organizacije
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Recent Users */}
      {users.length > 0 && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#121212]">Najnoviji korisnici</h2>
            <Link
              to="/admin/users"
              className="text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
            >
              Vidi sve
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.slice(0, 6).map((user, index) => (
              <Link
                key={index}
                to={`/users/${user.username}`}
                className="card p-4 hover:shadow-lg transition-all border-l-4 border-mint group"
              >
                <div className="flex items-start gap-3">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-mint" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-[#121212] group-hover:text-mint transition-colors">
                      {user.username}
                    </h3>
                    {user.title && (
                      <p className="text-sm text-gray-600">{user.title}</p>
                    )}
                    {user.location && (
                      <p className="text-xs text-gray-500">{user.location}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Organisations Preview */}
      {pendingOrgs.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#121212]">Organizacije na čekanju</h2>
            <Link
              to="/admin/pending"
              className="text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
            >
              Vidi sve
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingOrgs.slice(0, 3).map((org, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {org.logo && (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-[#121212]">{org.name}</h3>
                  <p className="text-sm text-gray-600">@{org.username}</p>
                </div>
                <Link
                  to="/admin/pending"
                  className="text-[#121212] bg-mint hover:bg-[#B8D4C5] font-semibold text-sm px-3 py-1.5 rounded-lg"
                >
                  Pregledaj
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

