// components/recommendations-card.jsx
import { Button } from "@/components/ui/button";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { getJobRecommendations } from "@/api/apiRecommendations";
import { useState } from "react";

const RecommendationsCard = () => {
  const { isLoaded, user } = useUser();
  const [showRecommendations, setShowRecommendations] = useState(false);

  const {
    loading: loadingRecommendations,
    data: recommendations,
    fn: fetchRecommendations,
  } = useFetch(getJobRecommendations, {
    user_id: user?.id,
  });

  const handleGetRecommendations = () => {
    setShowRecommendations(true);
    fetchRecommendations();
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">AI Job Recommendations</h2>
      <p className="text-gray-300 mb-4">
        Get personalized job matches based on your profile using our AI system.
      </p>
      
      {!showRecommendations ? (
        <Button 
          onClick={handleGetRecommendations}
          variant="blue"
          className="w-full sm:w-auto"
        >
          Find My Matches
        </Button>
      ) : (
        <div className="mt-4">
          {loadingRecommendations ? (
            <BarLoader width={"100%"} color="#36d7b7" />
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations?.length > 0 ? (
                recommendations.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p>No recommendations found. Please update your profile for better matches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationsCard;