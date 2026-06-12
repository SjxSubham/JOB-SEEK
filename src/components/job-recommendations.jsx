import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
  Building,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import {
  getJobRecommendations,
  generateAIRecommendations,
  updateRecommendationInteraction,
  submitRecommendationFeedback,
} from "@/api/apiApplicationTracking";

const MatchScoreBadge = ({ score }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-sky-500 to-cyan-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-slate-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Potential Match";
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-gradient-to-r text-white font-bold text-sm",
          getScoreColor(score)
        )}
      >
        {Math.round(score)}%
      </div>
      <span className="text-xs text-slate-400">{getScoreLabel(score)}</span>
    </div>
  );
};

const RecommendationCard = ({
  recommendation,
  onDismiss,
  onFeedback,
  onInteraction,
}) => {
  const { job, match_score, match_reasons, id } = recommendation;
  const [showFeedback, setShowFeedback] = useState(false);

  if (!job) return null;

  const handleClick = () => {
    onInteraction(id, "click");
  };

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDismiss(id);
  };

  const handleFeedback = (e, feedback) => {
    e.preventDefault();
    e.stopPropagation();
    onFeedback(id, feedback);
    setShowFeedback(false);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-white/10 bg-white/5",
        "transition-all duration-300 hover:-translate-y-1",
        "hover:border-sky-500/30 hover:bg-white/10",
        "hover:shadow-[0_20px_40px_-20px_rgba(56,189,248,0.3)]"
      )}
    >
      {/* Gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-cyan-500 opacity-70" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={cn(
          "absolute right-2 top-2 z-10 rounded-full p-1.5",
          "bg-slate-800/50 text-slate-400 opacity-0 transition-all",
          "hover:bg-red-500/20 hover:text-red-400",
          "group-hover:opacity-100"
        )}
        title="Not interested"
      >
        <X className="h-4 w-4" />
      </button>

      <Link to={`/job/${job.id}`} onClick={handleClick}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* Company Logo */}
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={job.company.name}
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-2 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
                  <Building className="h-6 w-6 text-slate-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-white line-clamp-1">
                  {job.title}
                </CardTitle>
                <p className="text-sm text-slate-400">{job.company?.name}</p>
              </div>
            </div>

            <MatchScoreBadge score={match_score} />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Match Reasons */}
          {match_reasons && match_reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {match_reasons.slice(0, 3).map((reason, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                    "bg-sky-500/10 text-xs font-medium text-sky-300",
                    "border border-sky-500/20"
                  )}
                >
                  <Zap className="h-3 w-3" />
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Job Details */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.job_type.replace("_", " ")}
              </span>
            )}
            {job.work_mode && (
              <span className="flex items-center gap-1 capitalize">
                <Clock className="h-3.5 w-3.5" />
                {job.work_mode}
              </span>
            )}
            {(job.salary_min || job.salary_max) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salary_min && job.salary_max
                  ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                  : job.salary_min
                  ? `From ${job.salary_min.toLocaleString()}`
                  : `Up to ${job.salary_max.toLocaleString()}`}
              </span>
            )}
          </div>

          {/* Description preview */}
          {job.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Feedback section */}
          {showFeedback ? (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-slate-400">Was this relevant?</span>
              <button
                onClick={(e) => handleFeedback(e, "relevant")}
                className="rounded-lg px-2 py-1 text-xs text-green-400 transition-colors hover:bg-green-500/20"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => handleFeedback(e, "not_relevant")}
                className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/20"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFeedback(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors pt-2"
            >
              Give feedback
            </button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

const JobRecommendations = ({ limit = 6, showRefresh = true, className }) => {
  const { user, isLoaded } = useUser();
  const [recommendations, setRecommendations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { fn: fnGetRecommendations, loading: loadingRecommendations } = useFetch(
    getJobRecommendations
  );
  const { fn: fnGenerateRecommendations } = useFetch(generateAIRecommendations);
  const { fn: fnUpdateInteraction } = useFetch(updateRecommendationInteraction);
  const { fn: fnSubmitFeedback } = useFetch(submitRecommendationFeedback);

  // Fetch recommendations
  const fetchRecommendations = async () => {
    if (!user?.id) return;

    try {
      const data = await fnGetRecommendations({ user_id: user.id, limit });
      setRecommendations(data || []);

      // If no recommendations, try to generate some
      if (!data || data.length === 0) {
        await handleGenerateRecommendations();
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Generate new recommendations
  const handleGenerateRecommendations = async () => {
    if (!user?.id || isGenerating) return;

    setIsGenerating(true);
    try {
      await fnGenerateRecommendations({ user_id: user.id });
      // Refetch to get the new recommendations
      const data = await fnGetRecommendations({ user_id: user.id, limit });
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle interaction tracking
  const handleInteraction = async (recommendationId, interaction) => {
    try {
      await fnUpdateInteraction({ recommendation_id: recommendationId }, interaction);
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  // Handle dismiss
  const handleDismiss = async (recommendationId) => {
    try {
      await fnUpdateInteraction({ recommendation_id: recommendationId }, "dismiss");
      setRecommendations((prev) =>
        prev.filter((rec) => rec.id !== recommendationId)
      );
    } catch (error) {
      console.error("Error dismissing recommendation:", error);
    }
  };

  // Handle feedback
  const handleFeedback = async (recommendationId, feedback) => {
    try {
      await fnSubmitFeedback({ recommendation_id: recommendationId }, feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchRecommendations();
    }
  }, [isLoaded, user?.id]);

  // Don't render for recruiters
  if (user?.unsafeMetadata?.role === "recruiter") {
    return null;
  }

  const isLoading = loadingRecommendations || isGenerating;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Recommended for You</h2>
            <p className="text-sm text-slate-400">
              Jobs matching your profile and preferences
            </p>
          </div>
        </div>

        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRecommendations}
            disabled={isLoading}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")}
            />
            Refresh
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && recommendations.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="border-white/10 bg-white/5 animate-pulse"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-700/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-slate-700/50" />
                    <div className="h-4 w-1/2 rounded bg-slate-700/50" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-slate-700/50" />
                  <div className="h-6 w-24 rounded-full bg-slate-700/50" />
                </div>
                <div className="h-4 w-full rounded bg-slate-700/50" />
                <div className="h-4 w-2/3 rounded bg-slate-700/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
              <Sparkles className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              No Recommendations Yet
            </h3>
            <p className="mb-4 max-w-sm text-sm text-slate-400">
              Complete your profile with skills and preferences to get
              personalized job recommendations.
            </p>
            <div className="flex gap-3">
              <Link to="/profile-page">
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  Complete Profile
                </Button>
              </Link>
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onDismiss={handleDismiss}
                onFeedback={handleFeedback}
                onInteraction={handleInteraction}
              />
            ))}
          </div>

          {/* View All Link */}
          <div className="flex justify-center">
            <Link
              to="/jobs?recommended=true"
              className="group flex items-center gap-2 text-sm text-sky-400 transition-colors hover:text-sky-300"
            >
              View all recommendations
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default JobRecommendations;
