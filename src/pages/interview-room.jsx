/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useSession } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { getInterviewDetails } from "@/api/apiInterview";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// ─── Connection Status Badge ───────────────────────────
const ConnectionBadge = ({ status }) => {
  const config = {
    connecting: {
      label: "Connecting...",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      pulse: true,
    },
    connected: {
      label: "Connected",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      pulse: false,
    },
    disconnected: {
      label: "Disconnected",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      pulse: false,
    },
    waiting: {
      label: "Waiting for participant...",
      color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      pulse: true,
    },
  };

  const c = config[status] || config.waiting;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${c.color}`}
    >
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {c.label}
    </span>
  );
};

// ─── Control Button ────────────────────────────────────
const ControlButton = ({ onClick, active, danger, icon: Icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
      danger
        ? "border-red-500/40 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        : active
          ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
          : "border-red-400/30 bg-red-500/20 text-red-400 hover:bg-red-500/30"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <Icon className="h-5 w-5" />
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
      {label}
    </span>
  </button>
);

// ─── Video Panel ───────────────────────────────────────
const VideoPanel = ({ videoRef, muted, label, isLocal, mirror, placeholder }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
        isLocal ? "aspect-video max-h-[200px]" : "aspect-video w-full"
      }`}
    >
      {/* Gradient overlay for name tag */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/70 to-transparent" />

      {placeholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-cyan-500/30 ring-2 ring-sky-500/20">
            <User className="h-10 w-10 text-sky-400" />
          </div>
          <p className="text-sm text-slate-500">{placeholder}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
        />
      )}

      {/* Label */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      </div>

      {/* Fullscreen toggle */}
      {!isLocal && (
        <button
          onClick={toggleFullscreen}
          className="absolute right-3 top-3 z-20 rounded-lg bg-black/40 p-2 text-white/70 opacity-0 transition-all hover:bg-black/60 hover:text-white group-hover:opacity-100"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

// ─── Interview Timer ───────────────────────────────────
const InterviewTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0");
      const secs = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-300 backdrop-blur-sm">
      <Clock className="h-3.5 w-3.5 text-sky-400" />
      {elapsed}
    </div>
  );
};

// ─── Main Interview Room ───────────────────────────────
const InterviewRoom = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();
  const { session } = useSession();

  // State
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("waiting");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const channelRef = useRef(null);
  const supabaseRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const isNegotiatingRef = useRef(false);
  const makingOfferRef = useRef(false);

  // Determine role
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
  const userId = user?.id;

  // ─── Fetch interview details ──────────────────────────
  useEffect(() => {
    if (!userLoaded || !session) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const token = await session.getToken({ template: "supabase" });
        const data = await getInterviewDetails(token, {
          application_id: applicationId,
        });
        setInterviewData(data);
      } catch (err) {
        console.error("Failed to fetch interview:", err);
        setError("Could not load interview details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [applicationId, userLoaded, session]);

  // ─── Initialize media + WebRTC ────────────────────────
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Media access error:", err);
      // Try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = audioStream;
        setIsCameraOn(false);
        return audioStream;
      } catch (audioErr) {
        console.error("Audio access also failed:", audioErr);
        setError(
          "Camera and microphone access denied. Please allow permissions and refresh."
        );
        return null;
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (stream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setHasRemoteStream(true);
        setConnectionStatus("connected");
        if (!callStartTime) setCallStartTime(Date.now());
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate.toJSON(),
              from: userId,
            },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") {
          setConnectionStatus("connected");
          if (!callStartTime) setCallStartTime(Date.now());
        } else if (state === "disconnected" || state === "failed") {
          setConnectionStatus("disconnected");
        } else if (state === "checking") {
          setConnectionStatus("connecting");
        }
      };

      pc.onnegotiationneeded = async () => {
        if (makingOfferRef.current) return;
        try {
          makingOfferRef.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "sdp",
              payload: {
                sdp: pc.localDescription.toJSON(),
                from: userId,
              },
            });
          }
        } catch (err) {
          console.error("Negotiation error:", err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [userId, callStartTime]
  );

  // ─── Supabase Realtime Signaling ──────────────────────
  useEffect(() => {
    if (!interviewData || !userId || loading || error) return;

    const roomId = interviewData.interview_room_id;
    if (!roomId) return;

    let mounted = true;

    const setup = async () => {
      // Get local media
      const stream = await initializeMedia();
      if (!stream || !mounted) return;

      // Create peer connection
      const pc = createPeerConnection(stream);

      // Create Supabase realtime channel for signaling
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabaseRef.current = supabase;

      const channel = supabase.channel(roomId, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      channel
        .on("broadcast", { event: "sdp" }, async ({ payload }) => {
          if (payload.from === userId) return;
          const { sdp } = payload;

          try {
            if (sdp.type === "offer") {
              // Polite peer behavior
              if (
                pc.signalingState !== "stable" ||
                isNegotiatingRef.current
              ) {
                // If we're impolite (recruiter), ignore the offer
                if (isRecruiter) return;
              }

              isNegotiatingRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));

              // Process queued ICE candidates
              for (const candidate of candidateQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              candidateQueueRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              channel.send({
                type: "broadcast",
                event: "sdp",
                payload: {
                  sdp: pc.localDescription.toJSON(),
                  from: userId,
                },
              });
              isNegotiatingRef.current = false;
            } else if (sdp.type === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              isNegotiatingRef.current = false;

              // Process queued ICE candidates
              for (const candidate of candidateQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              candidateQueueRef.current = [];
            }
          } catch (err) {
            console.error("SDP handling error:", err);
            isNegotiatingRef.current = false;
          }
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.from === userId) return;

          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(
                new RTCIceCandidate(payload.candidate)
              );
            } else {
              candidateQueueRef.current.push(payload.candidate);
            }
          } catch (err) {
            console.error("ICE candidate error:", err);
          }
        })
        .on("broadcast", { event: "peer-joined" }, async ({ payload }) => {
          if (payload.from === userId) return;
          // When another peer joins, the recruiter (impolite peer) creates an offer
          if (isRecruiter) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: "broadcast",
                event: "sdp",
                payload: {
                  sdp: pc.localDescription.toJSON(),
                  from: userId,
                },
              });
            } catch (err) {
              console.error("Offer creation error:", err);
            }
          }
        })
        .on("broadcast", { event: "call-ended" }, () => {
          handleEndCall(false);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Announce presence
            channel.send({
              type: "broadcast",
              event: "peer-joined",
              payload: { from: userId, role: isRecruiter ? "recruiter" : "candidate" },
            });
          }
        });
    };

    setup();

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewData, userId, loading, error]);

  // ─── Cleanup ──────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    if (channelRef.current && supabaseRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
    }
  }, []);

  // ─── Controls ─────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      const cameraStream = localStreamRef.current;
      const videoTrack = cameraStream?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        // Show screen share in local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  }, [isScreenSharing]);

  const handleEndCall = useCallback(
    (broadcast = true) => {
      if (broadcast && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "call-ended",
          payload: { from: userId },
        });
      }
      cleanup();
      navigate("/my-jobs");
    },
    [cleanup, navigate, userId]
  );

  // ─── Render ───────────────────────────────────────────
  if (loading || !userLoaded) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
          <p className="text-sm text-slate-400">Loading interview room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-lg font-semibold text-red-300">
            Unable to Join
          </h2>
          <p className="mb-6 text-sm text-red-400/80">{error}</p>
          <button
            onClick={() => navigate("/my-jobs")}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Back to My Jobs
          </button>
        </div>
      </div>
    );
  }

  const jobTitle = interviewData?.job?.title || "Interview";
  const companyName = interviewData?.job?.company?.name || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Interview Session
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {jobTitle}
            {companyName && ` · ${companyName}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge status={connectionStatus} />
          {callStartTime && <InterviewTimer startTime={callStartTime} />}
        </div>
      </div>

      {/* Video Grid */}
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Remote (main) video */}
        <VideoPanel
          videoRef={remoteVideoRef}
          muted={false}
          label={isRecruiter ? "Candidate" : "Recruiter"}
          isLocal={false}
          mirror={false}
          placeholder={
            !hasRemoteStream
              ? "Waiting for the other participant to join..."
              : null
          }
        />

        {/* Local (self) video */}
        <div className="flex flex-col gap-4">
          <VideoPanel
            videoRef={localVideoRef}
            muted={true}
            label="You"
            isLocal={true}
            mirror={!isScreenSharing}
          />

          {/* Interview Info Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <h3 className="mb-2 text-sm font-semibold text-white">
              Interview Details
            </h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Position</span>
                <span className="text-slate-300">{jobTitle}</span>
              </div>
              {companyName && (
                <div className="flex justify-between">
                  <span>Company</span>
                  <span className="text-slate-300">{companyName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Your Role</span>
                <span className="text-slate-300">
                  {isRecruiter ? "Recruiter" : "Candidate"}
                </span>
              </div>
              {interviewData?.interview_scheduled_at && (
                <div className="flex justify-between">
                  <span>Scheduled</span>
                  <span className="text-slate-300">
                    {new Date(
                      interviewData.interview_scheduled_at
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-6 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <ControlButton
            onClick={toggleCamera}
            active={isCameraOn}
            icon={isCameraOn ? Video : VideoOff}
            label={isCameraOn ? "Turn off camera" : "Turn on camera"}
          />
          <ControlButton
            onClick={toggleMic}
            active={isMicOn}
            icon={isMicOn ? Mic : MicOff}
            label={isMicOn ? "Mute" : "Unmute"}
          />
          <ControlButton
            onClick={toggleScreenShare}
            active={!isScreenSharing}
            icon={isScreenSharing ? MonitorOff : MonitorUp}
            label={isScreenSharing ? "Stop sharing" : "Share screen"}
          />

          <div className="mx-2 h-8 w-px bg-white/10" />

          <ControlButton
            onClick={() => handleEndCall(true)}
            danger
            icon={PhoneOff}
            label="End call"
          />
        </div>
      </div>

      {/* Bottom spacer for fixed controls */}
      <div className="h-28" />
    </div>
  );
};

export default InterviewRoom;
