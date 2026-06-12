import { useState, useEffect, useCallback } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ChevronRight,
  RefreshCw,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building,
  Zap,
  Plus,
  Trash2,
  Brain,
  Target,
  Filter,
  Settings2,
  Home,
  Laptop,
  Building2,
  GraduationCap,
  Award,
  Mail,
  Phone,
  Edit3,
  Save,
  XCircle,
  Search,
  TrendingUp,
  Calendar,
  Users,
  Star,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  uploadAndProcessResume,
  getAIJobRecommendations,
  addManualSkills,
  getParsedResumeData,
  clearResumeData,
  updateJobPreferences,
  updateUserSkills,
  removeSkill,
  WORK_MODES,
  EMPLOYMENT_TYPES,
} from "@/api/apiResumeAI";
import { getProfile } from "@/api/apiProfile";

// ============================================
// CONSTANTS
// ============================================

const WORK_MODE_OPTIONS = [
  { value: "all", label: "All Types", icon: Building2 },
  { value: "remote", label: "Remote", icon: Laptop },
  { value: "hybrid", label: "Hybrid", icon: Home },
  { value: "onsite", label: "On-site", icon: Building },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "all", label: "All", icon: Briefcase },
  { value: "full_time", label: "Full Time", icon: Clock },
  { value: "part_time", label: "Part Time", icon: Clock },
  { value: "contract", label: "Contract", icon: FileText },
  { value: "internship", label: "Internship", icon: GraduationCap },
];

// ============================================
// HELPER COMPONENTS
// ============================================

// Match Score Ring
const MatchScoreRing = ({ score }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 75)
      return {
        stroke: "#22c55e",
        bg: "from-green-500/20 to-emerald-500/20",
        text: "text-green-400",
      };
    if (score >= 50)
      return {
        stroke: "#0ea5e9",
        bg: "from-sky-500/20 to-cyan-500/20",
        text: "text-sky-400",
      };
    if (score >= 30)
      return {
        stroke: "#f59e0b",
        bg: "from-amber-500/20 to-orange-500/20",
        text: "text-amber-400",
      };
    return {
      stroke: "#6b7280",
      bg: "from-gray-500/20 to-slate-500/20",
      text: "text-gray-400",
    };
  };

  const colors = getScoreColor();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br",
        colors.bg,
      )}
    >
      <svg className="absolute w-14 h-14 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-white/10"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn("font-bold text-lg", colors.text)}>
        {Math.round(score)}%
      </span>
    </div>
  );
};

// Job Card Component
const JobCard = ({ recommendation, onDismiss }) => {
  const { job, score, reasons, matchingSkills } = recommendation;

  if (!job) return null;

  const getWorkModeIcon = () => {
    switch (job.work_mode?.toLowerCase()) {
      case "remote":
        return <Laptop className="h-3.5 w-3.5" />;
      case "hybrid":
        return <Home className="h-3.5 w-3.5" />;
      default:
        return <Building className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-white/10 bg-slate-900/50",
        "transition-all duration-300 hover:-translate-y-1",
        "hover:border-sky-500/40 hover:bg-slate-900/80",
        "hover:shadow-[0_20px_50px_-20px_rgba(56,189,248,0.25)]",
      )}
    >
      {/* Top gradient bar based on score */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          score >= 75
            ? "from-green-500 to-emerald-500"
            : score >= 50
              ? "from-sky-500 to-cyan-500"
              : score >= 30
                ? "from-amber-500 to-orange-500"
                : "from-gray-500 to-slate-500",
        )}
      />

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss(job.id);
          }}
          className={cn(
            "absolute right-2 top-3 z-10 rounded-full p-1.5",
            "bg-slate-800/80 text-slate-400 opacity-0 transition-all",
            "hover:bg-red-500/20 hover:text-red-400",
            "group-hover:opacity-100",
          )}
          title="Not interested"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <Link to={`/job/${job.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  alt={job.company.name}
                  className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 p-2 object-contain"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
                  <Building className="h-7 w-7 text-slate-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-white line-clamp-1 pr-8">
                {job.title}
              </CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">
                {job.company?.name}
              </p>

              {/* Job meta info */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.work_mode && (
                  <span className="flex items-center gap-1 capitalize">
                    {getWorkModeIcon()}
                    {job.work_mode}
                  </span>
                )}
              </div>
            </div>

            {/* Match Score */}
            <MatchScoreRing score={score} />
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Match Reasons */}
          {reasons && reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {reasons.slice(0, 3).map((reason, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                    "bg-sky-500/10 text-xs font-medium text-sky-300",
                    "border border-sky-500/20",
                  )}
                >
                  <Zap className="h-3 w-3" />
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Matching Skills */}
          {matchingSkills && matchingSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.slice(0, 5).map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400 border border-green-500/20"
                >
                  {skill}
                </span>
              ))}
              {matchingSkills.length > 5 && (
                <span className="text-xs text-slate-500 self-center">
                  +{matchingSkills.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Job Details Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {job.employment_type && (
                <span className="flex items-center gap-1 capitalize">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.employment_type.replace("_", " ")}
                </span>
              )}
              {(job.salary_min || job.salary_max) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {job.salary_min && job.salary_max
                    ? `${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k`
                    : job.salary_min
                      ? `From ${(job.salary_min / 1000).toFixed(0)}k`
                      : `Up to ${(job.salary_max / 1000).toFixed(0)}k`}
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

// Resume Upload Section
const ResumeUploadSection = ({
  onUpload,
  isUploading,
  uploadError,
  parsedResume,
  onClearResume,
  onEditSkills,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  // Resume analyzed state
  if (parsedResume) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  Resume Analyzed
                </CardTitle>
                <CardDescription className="text-green-300/80">
                  AI extracted your profile data
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditSkills}
                className="text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearResume}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {parsedResume.name && (
              <span className="text-white font-medium">
                {parsedResume.name}
              </span>
            )}
            {parsedResume.email && (
              <span className="flex items-center gap-1 text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {parsedResume.email}
              </span>
            )}
            {parsedResume.location && (
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {parsedResume.location}
              </span>
            )}
          </div>

          {/* Skills */}
          {parsedResume.skills && parsedResume.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-sky-400" />
                <span className="text-sm text-slate-400">
                  Skills ({parsedResume.skills.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedResume.skills.slice(0, 12).map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs text-sky-300 border border-sky-500/20"
                  >
                    {skill}
                  </span>
                ))}
                {parsedResume.skills.length > 12 && (
                  <span className="text-xs text-slate-500 self-center">
                    +{parsedResume.skills.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Experience Summary */}
          {parsedResume.experience && parsedResume.experience.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-purple-400" />
              <span className="text-slate-400">
                {parsedResume.experience.length} position
                {parsedResume.experience.length !== 1 ? "s" : ""} •{" "}
                {parsedResume.yearsOfExperience || 0}+ years experience
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Upload interface
  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Upload className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-white">Upload Your Resume</CardTitle>
            <CardDescription>
              AI will analyze your skills and match you with the best jobs
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
            dragActive
              ? "border-sky-500 bg-sky-500/10"
              : "border-white/20 hover:border-white/40 hover:bg-white/5",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            id="resume-upload"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Brain className="h-12 w-12 text-purple-400 animate-pulse" />
                <RefreshCw className="h-5 w-5 text-cyan-400 absolute -right-1 -bottom-1 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  Analyzing your resume...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Using AI to extract skills and experience
                </p>
              </div>
            </div>
          ) : (
            <>
              <FileText className="h-12 w-12 text-slate-500 mb-3" />
              <p className="text-sm text-slate-300 text-center">
                Drag and drop your resume, or{" "}
                <span className="text-sky-400 hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Supports PDF, DOCX, and TXT (max 5MB)
              </p>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{uploadError}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Preferences Panel
const PreferencesPanel = ({ preferences, onPreferencesChange, isSaving }) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = () => {
    onPreferencesChange(localPrefs);
    setIsOpen(false);
  };

  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Settings2 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white text-base">
                Job Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Customize your job matching
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* Quick display of current preferences */}
        <div className="flex flex-wrap gap-2 mt-3">
          {localPrefs.workMode && localPrefs.workMode !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 border border-amber-500/20 capitalize">
              {localPrefs.workMode === "remote" && (
                <Laptop className="h-3 w-3" />
              )}
              {localPrefs.workMode === "hybrid" && <Home className="h-3 w-3" />}
              {localPrefs.workMode === "onsite" && (
                <Building className="h-3 w-3" />
              )}
              {localPrefs.workMode}
            </span>
          )}
          {localPrefs.employmentType && localPrefs.employmentType !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300 border border-purple-500/20 capitalize">
              <Briefcase className="h-3 w-3" />
              {localPrefs.employmentType.replace("_", " ")}
            </span>
          )}
          {localPrefs.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300 border border-sky-500/20">
              <MapPin className="h-3 w-3" />
              {localPrefs.location}
            </span>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Work Mode */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Preferred Work Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {WORK_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalPrefs({ ...localPrefs, workMode: option.value })
                  }
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                    localPrefs.workMode === option.value
                      ? "border-sky-500 bg-sky-500/10 text-sky-300"
                      : "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5",
                  )}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Employment Type
            </label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalPrefs({
                      ...localPrefs,
                      employmentType: option.value,
                    })
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all",
                    localPrefs.employmentType === option.value
                      ? "border-purple-500 bg-purple-500/10 text-purple-300"
                      : "border-white/10 text-slate-400 hover:border-white/20",
                  )}
                >
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Preferred Location
            </label>
            <Input
              type="text"
              placeholder="e.g., San Francisco, CA"
              value={localPrefs.location || ""}
              onChange={(e) =>
                setLocalPrefs({ ...localPrefs, location: e.target.value })
              }
              className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

// Skills Manager
const SkillsManager = ({ skills, onAddSkills, onRemoveSkill, isLoading }) => {
  const [newSkill, setNewSkill] = useState("");
  const [skillsToAdd, setSkillsToAdd] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const popularSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "TypeScript",
    "AWS",
    "SQL",
    "Docker",
    "Java",
    "Git",
    "MongoDB",
    "GraphQL",
  ].filter((s) => !skills.includes(s) && !skillsToAdd.includes(s));

  const handleAddToQueue = () => {
    const skill = newSkill.trim();
    if (skill && !skillsToAdd.includes(skill) && !skills.includes(skill)) {
      setSkillsToAdd([...skillsToAdd, skill]);
      setNewSkill("");
    }
  };

  const handleSaveSkills = async () => {
    if (skillsToAdd.length === 0) return;
    setIsAdding(true);
    try {
      await onAddSkills(skillsToAdd);
      setSkillsToAdd([]);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Plus className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <CardTitle className="text-white text-base">
              Manage Skills
            </CardTitle>
            <CardDescription className="text-xs">
              Add skills to improve matching
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Skills */}
        {skills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">
                Your Skills ({skills.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300 group"
                >
                  {skill}
                  <button
                    onClick={() => onRemoveSkill(skill)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add new skill */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddToQueue();
              }
            }}
            className="flex-1 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
          <Button
            onClick={handleAddToQueue}
            disabled={!newSkill.trim()}
            variant="outline"
            className="border-white/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Skills to add */}
        {skillsToAdd.length > 0 && (
          <div>
            <span className="text-xs text-slate-400 mb-2 block">
              To be added:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skillsToAdd.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-300"
                >
                  {skill}
                  <button
                    onClick={() =>
                      setSkillsToAdd(skillsToAdd.filter((s) => s !== skill))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Button
              onClick={handleSaveSkills}
              disabled={isAdding}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white"
              size="sm"
            >
              {isAdding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add {skillsToAdd.length} Skill{skillsToAdd.length !== 1 && "s"}
            </Button>
          </div>
        )}

        {/* Popular skills */}
        {popularSkills.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 mb-2 block">
              Quick add:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularSkills.slice(0, 8).map((skill, i) => (
                <button
                  key={i}
                  onClick={() => setSkillsToAdd([...skillsToAdd, skill])}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Filter Bar
const FilterBar = ({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading,
  resultCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters:</span>
        </div>

        {/* Work Mode Filter */}
        <select
          value={filters.workMode || "all"}
          onChange={(e) =>
            onFiltersChange({ ...filters, workMode: e.target.value })
          }
          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          {WORK_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Employment Type Filter */}
        <select
          value={filters.employmentType || "all"}
          onChange={(e) =>
            onFiltersChange({ ...filters, employmentType: e.target.value })
          }
          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">
          {resultCount} job{resultCount !== 1 ? "s" : ""} found
        </span>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-white/10 text-slate-300 hover:bg-white/5"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="border-white/10 bg-slate-900/50 animate-pulse">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-800" />
            </div>
            <div className="h-16 w-16 rounded-full bg-slate-800" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-slate-800" />
            <div className="h-6 w-20 rounded-full bg-slate-800" />
          </div>
          <div className="h-4 w-full rounded bg-slate-800" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Empty State
const EmptyState = ({ hasResume, onRefresh }) => (
  <Card className="border-white/10 bg-slate-900/50 col-span-full">
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
        {hasResume ? (
          <Search className="h-10 w-10 text-slate-400" />
        ) : (
          <FileText className="h-10 w-10 text-purple-400" />
        )}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">
        {hasResume ? "No Matching Jobs Found" : "Upload Your Resume"}
      </h3>
      <p className="mb-6 max-w-md text-sm text-slate-400">
        {hasResume
          ? "We couldn't find jobs matching your profile. Try adjusting your filters or adding more skills."
          : "Our AI will analyze your resume and match you with the best job opportunities based on your skills and experience."}
      </p>
      {hasResume && (
        <Button
          onClick={onRefresh}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </CardContent>
  </Card>
);

// ============================================
// MAIN COMPONENT
// ============================================

const AIJobRecommendations = ({ className }) => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();

  // State
  const [recommendations, setRecommendations] = useState([]);
  const [parsedResume, setParsedResume] = useState(null);
  const [currentSkills, setCurrentSkills] = useState([]);
  const [preferences, setPreferences] = useState({
    workMode: "",
    employmentType: "",
    location: "",
  });
  const [filters, setFilters] = useState({
    workMode: "all",
    employmentType: "all",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showSkillEditor, setShowSkillEditor] = useState(false);

  // Token helper
  const getToken = useCallback(async () => {
    if (!session) return null;
    try {
      return await session.getToken({ template: "supabase" });
    } catch (e) {
      console.error("Failed to get token:", e);
      return null;
    }
  }, [session]);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      if (!user?.id || !session) return;

      setIsLoadingInitial(true);
      try {
        const token = await getToken();
        if (!token) return;

        // Get profile
        const profile = await getProfile(token, { user_id: user.id });
        setProfileData(profile);

        // Get resume data
        const resumeData = await getParsedResumeData(token, {
          user_id: user.id,
        });

        if (resumeData?.hasResume) {
          setParsedResume(resumeData.parsedData);
          setCurrentSkills(resumeData.skills || []);
          setPreferences(resumeData.preferences || {});

          // Fetch recommendations
          await fetchRecommendations(token, filters);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    if (isLoaded && user?.id && session) {
      initData();
    }
  }, [isLoaded, user?.id, session, getToken]);

  // Fetch recommendations
  const fetchRecommendations = useCallback(
    async (token, currentFilters = filters) => {
      if (!token) {
        token = await getToken();
        if (!token) return;
      }

      setIsLoadingRecommendations(true);
      try {
        const result = await getAIJobRecommendations(token, {
          user_id: user.id,
          filters: currentFilters,
          limit: 20,
        });

        setRecommendations(result?.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    },
    [user?.id, getToken, filters],
  );

  // Handle resume upload
  const handleResumeUpload = async (file) => {
    const token = await getToken();
    if (!token) {
      setUploadError("Please sign in again");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadAndProcessResume(token, null, {
        user_id: user.id,
        file,
        profileData,
      });

      if (!result.success) {
        setUploadError(result.error?.message || "Failed to process resume");
        return;
      }

      setParsedResume(result.parsedResume);
      setCurrentSkills(result.parsedResume.skills || []);

      // Fetch recommendations
      await fetchRecommendations(token);
    } catch (error) {
      console.error("Resume upload error:", error);
      setUploadError(error.message || "Failed to process resume");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle clear resume
  const handleClearResume = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      await clearResumeData(token, { user_id: user.id });
      setParsedResume(null);
      setCurrentSkills([]);
      setRecommendations([]);
    } catch (error) {
      console.error("Error clearing resume:", error);
    }
  };

  // Handle preferences change
  const handlePreferencesChange = async (newPrefs) => {
    const token = await getToken();
    if (!token) return;

    setIsSavingPreferences(true);
    try {
      await updateJobPreferences(token, { user_id: user.id }, newPrefs);
      setPreferences(newPrefs);

      // Update filters and refetch
      const newFilters = {
        ...filters,
        workMode: newPrefs.workMode || "all",
        employmentType: newPrefs.employmentType || "all",
        location: newPrefs.location || "",
      };
      setFilters(newFilters);
      await fetchRecommendations(token, newFilters);
    } catch (error) {
      console.error("Error updating preferences:", error);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Handle filter change
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    await fetchRecommendations(null, newFilters);
  };

  // Handle add skills
  const handleAddSkills = async (skills) => {
    const token = await getToken();
    if (!token) return;

    try {
      const result = await addManualSkills(token, { user_id: user.id }, skills);
      setCurrentSkills(result.skills || [...currentSkills, ...skills]);

      // Refresh recommendations if we have a resume
      if (parsedResume) {
        await fetchRecommendations(token);
      }
    } catch (error) {
      console.error("Error adding skills:", error);
    }
  };

  // Handle remove skill
  const handleRemoveSkill = async (skill) => {
    const token = await getToken();
    if (!token) return;

    try {
      const result = await removeSkill(token, { user_id: user.id }, skill);
      setCurrentSkills(result.skills);
    } catch (error) {
      console.error("Error removing skill:", error);
    }
  };

  // Handle dismiss recommendation
  const handleDismissRecommendation = (jobId) => {
    setRecommendations((prev) => prev.filter((rec) => rec.job?.id !== jobId));
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchRecommendations(null, filters);
  };

  // Don't render for recruiters
  if (user?.unsafeMetadata?.role === "recruiter") {
    return null;
  }

  // Loading state
  if (!isLoaded || isLoadingInitial) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <RefreshCw className="h-7 w-7 text-purple-400 animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Loading...</h1>
            <p className="text-slate-400">
              Preparing your personalized recommendations
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  const hasResume = !!parsedResume;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Target className="h-7 w-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Job Recommendations
              <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart Match
              </span>
            </h1>
            <p className="text-slate-400">
              {hasResume
                ? `${currentSkills.length} skills • ${recommendations.length} matched jobs`
                : "Upload your resume to get personalized job matches"}
            </p>
          </div>
        </div>

        {hasResume && (
          <Button
            onClick={handleRefresh}
            disabled={isLoadingRecommendations}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                isLoadingRecommendations && "animate-spin",
              )}
            />
            Find Jobs
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <ResumeUploadSection
            onUpload={handleResumeUpload}
            isUploading={isUploading}
            uploadError={uploadError}
            parsedResume={parsedResume}
            onClearResume={handleClearResume}
            onEditSkills={() => setShowSkillEditor(true)}
          />

          {hasResume && (
            <>
              <PreferencesPanel
                preferences={preferences}
                onPreferencesChange={handlePreferencesChange}
                isSaving={isSavingPreferences}
              />
              <SkillsManager
                skills={currentSkills}
                onAddSkills={handleAddSkills}
                onRemoveSkill={handleRemoveSkill}
                isLoading={false}
              />
            </>
          )}
        </div>

        {/* Right Content - Job Recommendations */}
        <div className="space-y-4 lg:col-span-2">
          {hasResume && (
            <FilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onRefresh={handleRefresh}
              isLoading={isLoadingRecommendations}
              resultCount={recommendations.length}
            />
          )}

          {/* Loading State */}
          {isLoadingRecommendations && recommendations.length === 0 && (
            <LoadingSkeleton />
          )}

          {/* Results or Empty State */}
          {!isLoadingRecommendations &&
            (recommendations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation, index) => (
                  <JobCard
                    key={recommendation.job?.id || index}
                    recommendation={recommendation}
                    onDismiss={handleDismissRecommendation}
                  />
                ))}
              </div>
            ) : (
              <EmptyState hasResume={hasResume} onRefresh={handleRefresh} />
            ))}

          {/* Browse All Jobs Link */}
          {hasResume && recommendations.length > 0 && (
            <div className="flex justify-center pt-4">
              <Link
                to="/jobs"
                className="group flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
              >
                Browse all jobs
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIJobRecommendations;
