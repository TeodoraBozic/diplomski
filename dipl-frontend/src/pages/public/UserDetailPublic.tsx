import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../../api/public";
import type { UserPublic } from "../../types/api";
import { 
  HeartIcon, 
  StarIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  SparklesIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

export function UserDetailPublic() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      loadData();
    }
  }, [username]);

  const loadData = async () => {
    try {
      // First get user data to get the ID
      const userData = await publicApi.getUserByUsername(username!);
      setUser(userData);
      
      // Get user ID from userData
      const userId = (userData as any)._id || (userData as any).id;
      
      if (userId) {
        // Use ID for review and rating API calls
        const [reviewsData, ratingData] = await Promise.all([
          publicApi.getReviewsForUser(userId),
          publicApi.getUserAvgRating(userId),
        ]);

        const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
        setReviews(reviewsArray);
        setTotalReviews(reviewsArray.length);
        setAvgRating(ratingData?.avg_rating || ratingData || null);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Učitavanje...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Korisnik nije pronađen</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
          {user.profile_image && (
            <div className="flex-shrink-0">
              <img
                src={user.profile_image}
                alt={user.username}
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-mint bg-white p-2 shadow-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#121212] mb-3">
              {user.username}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {user.title && (
                <span className="text-gray-600 font-medium text-lg">{user.title}</span>
              )}
              {user.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="font-medium">{user.location}</span>
                </div>
              )}
              {avgRating !== null && avgRating !== undefined && (
                <div className="flex items-center gap-2 bg-cream/50 px-4 py-2 rounded-full">
                  <HeartIcon className="w-5 h-5 text-mint fill-mint" />
                  <span className="text-lg font-bold text-[#121212]">
                    {typeof avgRating === 'number' ? avgRating.toFixed(1) : avgRating}
                  </span>
                  {totalReviews > 0 && (
                    <span className="text-sm text-gray-600">
                      ({totalReviews} {totalReviews === 1 ? 'ocena' : totalReviews < 5 ? 'ocene' : 'ocena'})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      {user.about && (
        <div className="card p-8 mb-8 bg-cream/30 border-2 border-mint/30">
          <div className="flex items-start gap-3 mb-4">
            <UserCircleIcon className="w-6 h-6 text-mint flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold text-[#121212]">O korisniku</h2>
          </div>
          <p className="text-[#121212] text-lg leading-relaxed font-medium pl-9">
            {user.about}
          </p>
        </div>
      )}

      {/* Skills Section */}
      {user.skills && user.skills.length > 0 && (
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <SparklesIcon className="w-6 h-6 text-mint flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold text-[#121212]">Veštine</h2>
          </div>
          <div className="flex flex-wrap gap-3 pl-9">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-mint text-[#121212] px-4 py-2 rounded-full text-sm font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {user.experience && (
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <BriefcaseIcon className="w-6 h-6 text-mint flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold text-[#121212]">Iskustvo</h2>
          </div>
          <p className="text-[#121212] text-lg leading-relaxed font-medium pl-9">
            {user.experience}
          </p>
        </div>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-mint/20 rounded-xl">
              <StarIcon className="w-8 h-8 text-mint" />
            </div>
            <h2 className="text-4xl font-bold text-[#121212]">Ocene i komentari</h2>
            {avgRating !== null && avgRating !== undefined && (
              <div className="flex items-center gap-2 bg-mint/20 px-4 py-2 rounded-full">
                <StarSolidIcon className="w-6 h-6 text-mint" />
                <span className="text-xl font-bold text-[#121212]">
                  {typeof avgRating === 'number' ? avgRating.toFixed(1) : avgRating}
                </span>
                {totalReviews > 0 && (
                  <span className="text-sm text-gray-600">
                    ({totalReviews} {totalReviews === 1 ? 'ocena' : totalReviews < 5 ? 'ocene' : 'ocena'})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {reviews.map((review, index) => {
              const orgInfo = review.org_info || review.organisation || null;
              const rating = review.rating || 0;
              const comment = review.comment || review.text || null;
              const createdAt = review.created_at || review.createdAt || null;
              
              return (
                <div key={index} className="border-l-4 border-mint pl-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < rating
                                ? "text-mint fill-mint"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-lg font-bold text-[#121212] ml-2">
                          {rating}/5
                        </span>
                      </div>
                      {orgInfo && (
                        <div className="flex items-center gap-2">
                          {orgInfo.logo ? (
                            <img
                              src={orgInfo.logo}
                              alt={orgInfo.name || orgInfo.username || "Organizacija"}
                              className="w-8 h-8 rounded-full object-cover border border-mint"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center border border-mint">
                              <BuildingOffice2Icon className="w-4 h-4 text-mint" />
                            </div>
                          )}
                          <p className="text-sm text-gray-600 font-medium">
                            {orgInfo.name || orgInfo.username || "Organizacija"}
                          </p>
                        </div>
                      )}
                    </div>
                    {createdAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(createdAt).toLocaleDateString('sr-RS', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  {comment && (
                    <p className="text-[#121212] font-medium leading-relaxed">
                      {comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}




