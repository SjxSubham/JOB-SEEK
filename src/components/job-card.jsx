/* eslint-disable react/prop-types */
import {
  Briefcase,
  Clock,
  DollarSign,
  Heart,
  MapPinIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/use-fetch";
import { deleteJob, saveJob } from "@/api/apiJobs";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

const JobCard = ({
  job,
  savedInit = false,
  onJobAction = () => {},
  isMyJob = false,
}) => {
  const [saved, setSaved] = useState(savedInit);

  const { user } = useUser();

  const { loading: loadingDeleteJob, fn: fnDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });

  const {
    loading: loadingSavedJob,
    data: savedJob,
    fn: fnSavedJob,
  } = useFetch(saveJob);

  const handleSaveJob = async () => {
    await fnSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    onJobAction();
  };

  const handleDeleteJob = async () => {
    await fnDeleteJob();
    onJobAction();
  };

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  const postedAt = job?.created_at ? new Date(job.created_at) : null;
  const formattedPostedAt = postedAt
    ? postedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Recently added";

  const salaryLabel = job?.salary_range ?? job?.salary ?? job?.compensation;
  const descriptionPreview =
    job?.description?.split(".")?.[0] ?? "Tap through for full role details.";

  const metadata = [
    {
      icon: Briefcase,
      label: job?.employment_type ?? "Flexible",
    },
    salaryLabel && {
      icon: DollarSign,
      label: salaryLabel,
    },
    {
      icon: Clock,
      label: formattedPostedAt,
    },
  ].filter(Boolean);

  return (
    <Card className="relative flex flex-col overflow-hidden border-white/10 bg-white/10 text-white shadow-[0_32px_90px_-50px_rgba(10,18,40,0.85)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_48px_120px_-60px_rgba(8,15,40,0.9)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-fuchsia-500 opacity-80" />
      {loadingDeleteJob && (
        <BarLoader
          className="absolute inset-x-0 top-0"
          width={"100%"}
          color="#38bdf8"
        />
      )}
      <CardHeader className="relative flex flex-col gap-4 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-semibold text-white">
              {job.title}
            </CardTitle>
            {job.company?.name && (
              <p className="text-sm text-slate-200/80">{job.company.name}</p>
            )}
          </div>
          <div className="flex items-start gap-3">
            {job.company?.logo_url && (
              <img
                src={job.company.logo_url}
                alt={`${job.company?.name ?? "Company"} logo`}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/10 p-2"
              />
            )}
            {isMyJob && (
              <button
                type="button"
                onClick={handleDeleteJob}
                disabled={loadingDeleteJob}
                className="rounded-full border border-red-400/60 bg-red-500/20 p-2 text-red-200 transition hover:border-red-400 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Delete job"
              >
                <Trash2Icon size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-100/80">
          {job.location && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
              <MapPinIcon className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {metadata.map(({ icon, label }, index) => {
            const MetaIcon = icon;
            return (
              <span
                key={`${label}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-slate-900/40 px-3 py-1"
              >
                <MetaIcon className="h-4 w-4 text-slate-100/80" />
                {label}
              </span>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 rounded-3xl border border-white/5 bg-slate-950/40 px-6 py-6 text-sm text-slate-100/90">
        <p className="leading-relaxed">{descriptionPreview}</p>
        <p className="text-xs text-slate-400">
          Continue for responsibilities, culture signals, and growth pathways.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
        <Link to={`/job/${job.id}`} className="w-full sm:flex-1">
          <Button className="app-button-glow w-full border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
            View role story
          </Button>
        </Link>
        {!isMyJob && (
          <Button
            variant="outline"
            className={`flex w-full items-center justify-center gap-2 rounded-full border ${saved ? "border-sky-400/60 bg-sky-500/20 text-sky-100" : "border-white/20 bg-slate-900/30 text-slate-100"} sm:w-auto`}
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
            aria-label={saved ? "Unsave job" : "Save job"}
          >
            <Heart
              size={18}
              className={saved ? "fill-sky-300 text-sky-300" : "text-slate-100"}
            />
            <span className="text-sm font-semibold">
              {saved ? "Saved" : "Save"}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
