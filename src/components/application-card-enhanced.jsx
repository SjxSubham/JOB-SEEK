/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  MoreVertical,
  Star,
  Trash2,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import { updateApplicationStatus } from "@/api/apiApplication";
import {
  APPLICATION_STATUSES,
  STATUS_CONFIG,
} from "@/api/apiApplicationTracking";

// Status Pipeline Steps
const PIPELINE_STEPS = [
  { key: "applied", label: "Applied" },
  { key: "under_review", label: "Review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviewing", label: "Interview" },
  { key: "offer_extended", label: "Offer" },
  { key: "hired", label: "Hired" },
];

// Status icons
const STATUS_ICONS = {
  applied: FileText,
  under_review: Eye,
  shortlisted: Star,
  interview_scheduled: Calendar,
  interviewing: Calendar,
  interview_completed: CheckCircle,
  offer_extended: Briefcase,
  offer_accepted: CheckCircle,
  offer_declined: XCircle,
  hired: CheckCircle,
  rejected: XCircle,
  withdrawn: AlertCircle,
  on_hold: Clock,
};

// Pipeline Progress Component
const StatusPipeline = ({ currentStatus }) => {
  const currentIndex = PIPELINE_STEPS.findIndex(
    (step) =>
      step.key === currentStatus ||
      (currentStatus === "interview_scheduled" &&
        step.key === "interviewing") ||
      (currentStatus === "interview_completed" &&
        step.key === "interviewing") ||
      (currentStatus === "offer_accepted" && step.key === "hired") ||
      (currentStatus === "offer_declined" && step.key === "offer_extended"),
  );

  const isRejected = currentStatus === "rejected";
  const isWithdrawn = currentStatus === "withdrawn";
  const isOnHold = currentStatus === "on_hold";
  const isTerminal = isRejected || isWithdrawn;

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
        <div
          className={cn(
            "absolute top-1/2 left-0 h-0.5 -translate-y-1/2 z-0 transition-all duration-500",
            isRejected
              ? "bg-red-500"
              : isOnHold
                ? "bg-amber-500"
                : "bg-gradient-to-r from-sky-500 to-cyan-500",
          )}
          style={{
            width: `${Math.max(0, (currentIndex / (PIPELINE_STEPS.length - 1)) * 100)}%`,
          }}
        />

        {/* Steps */}
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted && !isTerminal
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : isCurrent && !isTerminal
                      ? "border-sky-500 bg-sky-500/20 text-sky-400 ring-4 ring-sky-500/20"
                      : isCurrent && isRejected
                        ? "border-red-500 bg-red-500/20 text-red-400 ring-4 ring-red-500/20"
                        : isCurrent && isOnHold
                          ? "border-amber-500 bg-amber-500/20 text-amber-400 ring-4 ring-amber-500/20"
                          : "border-slate-600 bg-slate-800 text-slate-500",
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent && isRejected ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium whitespace-nowrap",
                  isCompleted || isCurrent
                    ? "text-slate-300"
                    : "text-slate-500",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "bg-gray-500",
    textColor: "text-gray-400",
    bgLight: "bg-gray-500/20",
  };

  const Icon = STATUS_ICONS[status] || AlertCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-xs font-medium",
        config.bgLight,
        config.textColor,
        "border",
        config.textColor.replace("text-", "border-").replace("500", "500/30"),
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Main Enhanced Application Card Component
const ApplicationCardEnhanced = ({
  application,
  isCandidate = false,
  showPipeline = true,
  onStatusChange,
  onViewApplication,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const { loading: loadingStatus, fn: fnUpdateStatus } = useFetch(
    updateApplicationStatus,
    { application_id: application.id },
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await fnUpdateStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(application.id, newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDownload = () => {
    if (application?.resume) {
      const link = document.createElement("a");
      link.href = application.resume;
      link.target = "_blank";
      link.click();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-white/10 bg-white/5",
        "transition-all duration-300",
        "hover:border-white/20 hover:bg-white/[0.07]",
        loadingStatus && "opacity-70 pointer-events-none",
      )}
    >
      {/* Loading overlay */}
      {loadingStatus && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      )}

      {/* Status accent line */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          STATUS_CONFIG[application.status]?.color || "bg-gray-500",
        )}
      />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          {/* Job/Candidate Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isCandidate ? (
              // Candidate view - show job info
              <>
                {application.job?.company?.logo_url ? (
                  <img
                    src={application.job.company.logo_url}
                    alt={application.job.company.name}
                    className="h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-2 object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
                    <Building className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/job/${application.job_id}`}
                    className="group flex items-center gap-1"
                  >
                    <CardTitle className="text-lg font-semibold text-white line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {application.job?.title || "Job Position"}
                    </CardTitle>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </Link>
                  <p className="text-sm text-slate-400">
                    {application.job?.company?.name || "Company"}
                  </p>
                </div>
              </>
            ) : (
              // Recruiter view - show candidate info
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-white line-clamp-1">
                    {application.name || "Candidate"}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {application.email || "No email provided"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-2">
            <StatusBadge status={application.status} />

            {/* Actions dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showActions && (
                <div
                  className={cn(
                    "absolute right-0 top-full z-30 mt-1 w-48",
                    "rounded-lg border border-white/10 bg-slate-900/95 py-1",
                    "shadow-xl backdrop-blur-xl",
                  )}
                >
                  {application.resume && (
                    <button
                      onClick={handleDownload}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                      Download Resume
                    </button>
                  )}

                  {onViewApplication && (
                    <button
                      onClick={() => {
                        onViewApplication(application);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pipeline Progress */}
        {showPipeline && <StatusPipeline currentStatus={application.status} />}

        {/* Quick Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Applied {getRelativeTime(application.created_at)}
          </span>
          {application.experience && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {application.experience} years exp.
            </span>
          )}
          {application.match_score && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                application.match_score >= 70
                  ? "text-green-400"
                  : application.match_score >= 50
                    ? "text-yellow-400"
                    : "text-slate-400",
              )}
            >
              <Star className="h-3.5 w-3.5" />
              {Math.round(application.match_score)}% match
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {!isCandidate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <span>View candidate details</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          </button>
        )}

        {isExpanded && !isCandidate && (
          <div className="space-y-3 rounded-lg bg-slate-800/30 p-3">
            {application.skills && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Skills
                </p>
                <p className="text-sm text-slate-300">{application.skills}</p>
              </div>
            )}
            {application.education && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Education
                </p>
                <p className="text-sm text-slate-300">
                  {application.education}
                </p>
              </div>
            )}
            {application.cover_letter && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Cover Letter
                </p>
                <p className="text-sm text-slate-300 line-clamp-3">
                  {application.cover_letter}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Timestamp */}
        <span className="text-xs text-slate-500">
          Last updated:{" "}
          {formatDate(application.status_updated_at || application.created_at)}
        </span>

        {/* Status Selector (Recruiter only) */}
        {!isCandidate ? (
          <Select
            onValueChange={handleStatusChange}
            defaultValue={application.status}
          >
            <SelectTrigger className="w-full sm:w-52 border-white/10 bg-slate-800/50">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-900">
              {Object.entries(APPLICATION_STATUSES).map(([key, value]) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        STATUS_CONFIG[value]?.color || "bg-gray-500",
                      )}
                    />
                    {STATUS_CONFIG[value]?.label || value}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <Link to={`/job/${application.job_id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                View Job
              </Button>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCardEnhanced;
