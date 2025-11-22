import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/admin";
import { publicApi } from "../../api/public";
import type { UserPublic } from "../../types/api";
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";

export function AllUsers() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await adminApi.getAllUsers().catch(() => publicApi.getUsers());
      setUsers(usersData || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
        <p className="text-[#121212] text-lg font-medium">Učitavanje korisnika...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <Link 
        to="/admin/pending" 
        className="flex items-center gap-2 text-[#121212] bg-mint hover:bg-[#B8D4C5] px-4 py-2 rounded-lg transition-all mb-8 inline-block font-medium"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Nazad na admin panel
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-mint/20 rounded-xl">
          <UserGroupIcon className="w-10 h-10 text-mint" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-[#121212]">Svi korisnici</h1>
          <p className="text-gray-600 mt-1">Ukupno: {users.length} korisnika</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card p-12 text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-[#121212] text-xl font-medium mb-2">Nema korisnika</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => (
            <Link
              key={index}
              to={`/users/${user.username}`}
              className="card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-mint group"
            >
              <div className="flex items-start gap-4 mb-4">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-mint"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center border-2 border-mint">
                    <UserGroupIcon className="w-8 h-8 text-mint" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#121212] group-hover:text-mint transition-colors mb-1">
                    {user.username}
                  </h3>
                  {user.title && (
                    <p className="text-sm text-gray-600 font-medium">{user.title}</p>
                  )}
                </div>
              </div>
              
              {user.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}

              {user.about && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">{user.about}</p>
              )}

              {user.skills && user.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-mint/20 text-[#121212] px-2 py-1 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 3 && (
                    <span className="text-xs text-gray-500">+{user.skills.length - 3}</span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-[#121212] bg-mint font-semibold text-sm inline-flex items-center gap-1 px-3 py-1 rounded-lg group-hover:gap-2 transition-all">
                  Vidi profil
                  <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

