/* eslint-disable react/prop-types */
import { useState } from "react";
import { Boxes, BriefcaseBusiness, Download, School } from "lucide-react";
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
import { updateApplicationStatus } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

const VALID_STATUSES = ["applied", "interviewing", "hired", "rejected"];

const STATUS_COLORS = {
  applied: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  interviewing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hired: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ApplicationCard = ({
  application,
  isCandidate = false,
  onStatusUpdate,
}) => {
  // Local state to track current status for real-time updates
  const [currentStatus, setCurrentStatus] = useState(application?.status);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = application?.resume;
    link.target = "_blank";
    link.click();
  };

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateApplicationStatus,
    {
      application_id: application.id,
    },
  );

  const handleStatusChange = async (status) => {
    // Validate status is a valid enum value
    if (!status || !VALID_STATUSES.includes(status)) {
      console.warn("Invalid status value:", status);
      return;
    }
    // Don't update if status hasn't changed
    if (status === currentStatus) return;

    // Optimistically update the UI immediately
    const previousStatus = currentStatus;
    setCurrentStatus(status);

    try {
      const result = await fnHiringStatus(status);

      // If update was successful and callback exists, notify parent
      if (result && onStatusUpdate) {
        onStatusUpdate(application.id, status);
      }
    } catch (error) {
      // Revert to previous status on error
      console.error("Failed to update status:", error);
      setCurrentStatus(previousStatus);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {loadingHiringStatus && (
        <BarLoader
          width={"100%"}
          color="#36d7b7"
          className="absolute top-0 left-0"
        />
      )}
      <CardHeader>
        <CardTitle className="flex justify-between font-bold">
          {isCandidate
            ? `${application?.job?.title} at ${application?.job?.company?.name}`
            : application?.name}
          <Download
            size={18}
            className="bg-white text-black rounded-full h-8 w-8 p-1.5 cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={handleDownload}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col md:flex-row justify-between gap-2">
          <div className="flex gap-2 items-center">
            <BriefcaseBusiness size={15} /> {application?.experience} years of
            experience
          </div>
          <div className="flex gap-2 items-center">
            <School size={15} />
            {application?.education}
          </div>
          <div className="flex gap-2 items-center">
            <Boxes size={15} /> Skills: {application?.skills}
          </div>
        </div>
        <hr />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-sm text-gray-400">
          {new Date(application?.created_at).toLocaleString()}
        </span>
        {isCandidate ? (
          <span
            className={`capitalize font-bold px-3 py-1 rounded-full border text-sm ${
              STATUS_COLORS[currentStatus] || "bg-gray-500/20 text-gray-400"
            }`}
          >
            {currentStatus}
          </span>
        ) : (
          <Select
            onValueChange={handleStatusChange}
            value={currentStatus}
            disabled={loadingHiringStatus}
          >
            <SelectTrigger
              className={`w-52 ${
                STATUS_COLORS[currentStatus] || ""
              } transition-colors`}
            >
              <SelectValue placeholder="Application Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;
