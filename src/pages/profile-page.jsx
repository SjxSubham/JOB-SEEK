import { useState, useEffect } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  FileText,
  Plus,
  X,
  Upload,
  Trash2,
  ExternalLink,
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  checkProfileExists,
  getProfile,
  upsertProfile,
  createProfile,
  uploadResume,
  uploadExperienceLogo,
  uploadPortfolioItem,
  uploadCertification,
  uploadProfilePicture,
} from "@/api/apiProfile";

// Validation schema for basic info
const basicInfoSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  alternative_email: z.string().email("Invalid email").or(z.literal("")),
  location: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  preference: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  github_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  portfolio_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
});

const ProfilePage = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { session } = useSession();

  // Profile state
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("basic");

  // Profile data state
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [academics, setAcademics] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [profilePicUploading, setProfilePicUploading] = useState(false);

  // Form for basic info
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      full_name: "",
      alternative_email: "",
      location: "",
      phone: "",
      bio: "",
      preference: "",
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
    },
  });

  const userRole = user?.unsafeMetadata?.role;

  // Fetch profile on mount
  useEffect(() => {
    const initializeProfile = async () => {
      if (!session || !user) return;

      try {
        setLoading(true);
        const token = await session.getToken({ template: "supabase" });
        const exists = await checkProfileExists(token, user.id);
        setProfileExists(exists);

        if (exists) {
          const profileData = await getProfile(token, { user_id: user.id });
          if (profileData) {
            // Set basic info
            setValue("full_name", profileData.full_name || user.fullName || "");
            setValue("alternative_email", profileData.alternative_email || "");
            setValue("location", profileData.location || "");
            setValue("phone", profileData.phone || "");
            setValue("bio", profileData.bio || "");
            setValue("preference", profileData.preference || "");
            setValue("linkedin_url", profileData.linkedin_url || "");
            setValue("github_url", profileData.github_url || "");
            setValue("portfolio_url", profileData.portfolio_url || "");

            // Set arrays
            setSkills(profileData.skills || []);
            setAcademics(profileData.academics || []);
            setCertifications(profileData.certifications || []);
            setExperiences(profileData.experiences || []);
            setPortfolioItems(profileData.portfolio_items || []);
            setResumeUrl(profileData.resume_url || "");
            setProfilePicUrl(profileData.profile_pic_url || "");
          }
        } else {
          // Pre-fill with Clerk user data for new profiles
          setValue("full_name", user.fullName || "");
          setValue(
            "alternative_email",
            user.primaryEmailAddress?.emailAddress || "",
          );
        }
      } catch (error) {
        console.error("Error initializing profile:", error);
        setMessage({ text: "Failed to load profile data", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (isUserLoaded && session) {
      initializeProfile();
    }
  }, [isUserLoaded, session, user, setValue]);

  // Save profile
  const saveProfile = async (formData) => {
    if (!session || !user) return;

    try {
      setSaving(true);
      const token = await session.getToken({ template: "supabase" });

      const profileData = {
        user_id: user.id,
        ...formData,
        skills,
        academics,
        certifications,
        experiences,
        portfolio_items: portfolioItems,
        resume_url: resumeUrl,
        profile_pic_url: profilePicUrl,
        role: userRole,
        updated_at: new Date().toISOString(),
      };

      if (profileExists) {
        await upsertProfile(token, null, profileData);
        setMessage({ text: "Profile updated successfully!", type: "success" });
      } else {
        await createProfile(token, profileData);
        setProfileExists(true);
        setMessage({ text: "Profile created successfully!", type: "success" });
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ text: "Failed to save profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please select an image file", type: "error" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image size must be less than 5MB", type: "error" });
      return;
    }

    try {
      setProfilePicUploading(true);
      const token = await session.getToken({ template: "supabase" });
      const url = await uploadProfilePicture(token, null, {
        user_id: user.id,
        file,
      });
      setProfilePicUrl(url);
      setMessage({
        text: "Profile picture uploaded successfully!",
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setMessage({ text: "Failed to upload profile picture", type: "error" });
    } finally {
      setProfilePicUploading(false);
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session || !user) return;

    try {
      setResumeUploading(true);
      const token = await session.getToken({ template: "supabase" });
      const url = await uploadResume(token, null, { user_id: user.id, file });
      setResumeUrl(url);
      setMessage({ text: "Resume uploaded successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error uploading resume:", error);
      setMessage({ text: "Failed to upload resume", type: "error" });
    } finally {
      setResumeUploading(false);
    }
  };

  // Skills management
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  // Academic record management
  const addAcademic = () => {
    setAcademics([
      ...academics,
      {
        id: Date.now(),
        institution: "",
        degree: "",
        field_of_study: "",
        start_year: "",
        end_year: "",
        grade: "",
        description: "",
      },
    ]);
  };

  const updateAcademic = (id, field, value) => {
    setAcademics(
      academics.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  const removeAcademic = (id) => {
    setAcademics(academics.filter((a) => a.id !== id));
  };

  // Certification management
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: Date.now(),
        name: "",
        issuing_organization: "",
        issue_date: "",
        expiry_date: "",
        credential_id: "",
        credential_url: "",
        file_url: "",
      },
    ]);
  };

  const updateCertification = (id, field, value) => {
    setCertifications(
      certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeCertification = (id) => {
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  const handleCertificationFileUpload = async (id, file) => {
    if (!file || !session || !user) return;

    const cert = certifications.find((c) => c.id === id);
    if (!cert) return;

    try {
      const token = await session.getToken({ template: "supabase" });
      const url = await uploadCertification(token, null, {
        user_id: user.id,
        cert_name: cert.name || "certificate",
        file,
      });
      updateCertification(id, "file_url", url);
      setMessage({
        text: "Certification file uploaded successfully!",
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error uploading certification file:", error);
      setMessage({
        text: "Failed to upload certification file",
        type: "error",
      });
    }
  };

  // Experience management
  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now(),
        company_name: "",
        company_logo_url: "",
        job_title: "",
        employment_type: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: "",
        skills_used: [],
      },
    ]);
  };

  const updateExperience = (id, field, value) => {
    setExperiences(
      experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const removeExperience = (id) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const handleExperienceLogoUpload = async (id, file) => {
    if (!file || !session) return;

    const exp = experiences.find((e) => e.id === id);
    if (!exp) return;

    try {
      const token = await session.getToken({ template: "supabase" });
      const url = await uploadExperienceLogo(token, null, {
        company_name: exp.company_name || "company",
        file,
      });
      updateExperience(id, "company_logo_url", url);
      setMessage({
        text: "Company logo uploaded successfully!",
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error uploading company logo:", error);
      setMessage({ text: "Failed to upload company logo", type: "error" });
    }
  };

  // Portfolio management
  const addPortfolioItem = () => {
    setPortfolioItems([
      ...portfolioItems,
      {
        id: Date.now(),
        title: "",
        description: "",
        project_url: "",
        image_url: "",
        technologies: [],
        start_date: "",
        end_date: "",
      },
    ]);
  };

  const updatePortfolioItem = (id, field, value) => {
    setPortfolioItems(
      portfolioItems.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const removePortfolioItem = (id) => {
    setPortfolioItems(portfolioItems.filter((p) => p.id !== id));
  };

  const handlePortfolioImageUpload = async (id, file) => {
    if (!file || !session || !user) return;

    const item = portfolioItems.find((p) => p.id === id);
    if (!item) return;

    try {
      const token = await session.getToken({ template: "supabase" });
      const url = await uploadPortfolioItem(token, null, {
        user_id: user.id,
        title: item.title || "project",
        file,
      });
      updatePortfolioItem(id, "image_url", url);
      setMessage({
        text: "Portfolio image uploaded successfully!",
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error uploading portfolio image:", error);
      setMessage({ text: "Failed to upload portfolio image", type: "error" });
    }
  };

  // Loading state
  if (!isUserLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BarLoader width={"100%"} color="#36d7b7" />
        <p className="mt-4 text-slate-400">Loading profile...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl text-slate-300">
          Please sign in to view your profile
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "skills", label: "Skills", icon: Briefcase },
    { id: "academics", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "experience", label: "Experience", icon: Building },
    { id: "portfolio", label: "Portfolio", icon: FolderOpen },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {profileExists ? "Your Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-slate-400">
          {profileExists
            ? "Manage your professional profile and showcase your skills"
            : "Fill in your details to get started with job seeking"}
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/40 text-green-300"
              : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* New User Notice */}
      {!profileExists && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
          <p className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Please complete your profile to access all features.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-2 rounded-xl bg-slate-800/50 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(saveProfile)}>
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img
                    src={profilePicUrl || user.imageUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-2 border-sky-500 object-cover"
                  />
                  <label
                    className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${
                      profilePicUploading ? "opacity-100" : ""
                    }`}
                  >
                    {profilePicUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePicUpload}
                      disabled={profilePicUploading}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-white font-medium text-lg">
                    {user.fullName}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      userRole === "recruiter"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {userRole === "recruiter" ? "Recruiter" : "Candidate"}
                  </span>
                  <p className="text-slate-500 text-xs mt-2">
                    Hover over picture to change
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    {...register("full_name")}
                    className="bg-slate-800/50 border-white/20"
                  />
                  {errors.full_name && (
                    <p className="text-red-400 text-sm">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                {/* Alternative Email */}
                <div className="space-y-2">
                  <Label htmlFor="alternative_email">Alternative Email</Label>
                  <Input
                    id="alternative_email"
                    type="email"
                    placeholder="john.work@example.com"
                    {...register("alternative_email")}
                    className="bg-slate-800/50 border-white/20"
                  />
                  {errors.alternative_email && (
                    <p className="text-red-400 text-sm">
                      {errors.alternative_email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    {...register("phone")}
                    className="bg-slate-800/50 border-white/20"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="New York, USA"
                    {...register("location")}
                    className="bg-slate-800/50 border-white/20"
                  />
                </div>

                {/* Job Preference */}
                {userRole === "candidate" && (
                  <div className="space-y-2">
                    <Label htmlFor="preference">Job Preference</Label>
                    <Select
                      value={watch("preference")}
                      onValueChange={(value) => setValue("preference", value)}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-white/20">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / About</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  {...register("bio")}
                  className="bg-slate-800/50 border-white/20 min-h-[100px]"
                />
                {errors.bio && (
                  <p className="text-red-400 text-sm">{errors.bio.message}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    placeholder="https://linkedin.com/in/..."
                    {...register("linkedin_url")}
                    className="bg-slate-800/50 border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    placeholder="https://github.com/..."
                    {...register("github_url")}
                    className="bg-slate-800/50 border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    placeholder="https://yourportfolio.com"
                    {...register("portfolio_url")}
                    className="bg-slate-800/50 border-white/20"
                  />
                </div>
              </div>

              {/* Resume Upload - Only for candidates */}
              {userRole === "candidate" && (
                <div className="space-y-2">
                  <Label>Resume / CV</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/20 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                      <Upload className="w-4 h-4" />
                      <span>
                        {resumeUploading ? "Uploading..." : "Upload Resume"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleResumeUpload}
                        disabled={resumeUploading}
                      />
                    </label>
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
                      >
                        <FileText className="w-4 h-4" />
                        View Resume
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm">
                    Accepted formats: PDF, DOC, DOCX
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills
              </CardTitle>
              <CardDescription>
                Add your technical and soft skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add skill input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g., JavaScript, Project Management)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                  className="bg-slate-800/50 border-white/20"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  variant="secondary"
                  disabled={!newSkill.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Skills list */}
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-500/30 rounded-full"
                  >
                    <span className="text-sky-200">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-sky-400 hover:text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {skills.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No skills added yet. Start adding your skills above!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Education/Academics Tab */}
        {activeTab === "academics" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </CardTitle>
              <CardDescription>
                Add your academic qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" onClick={addAcademic} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>

              {academics.map((academic, index) => (
                <div
                  key={academic.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-medium">
                      Education #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeAcademic(academic.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institution Name</Label>
                      <Input
                        placeholder="University/College Name"
                        value={academic.institution}
                        onChange={(e) =>
                          updateAcademic(
                            academic.id,
                            "institution",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        placeholder="Bachelor's, Master's, etc."
                        value={academic.degree}
                        onChange={(e) =>
                          updateAcademic(academic.id, "degree", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        placeholder="Computer Science, Business, etc."
                        value={academic.field_of_study}
                        onChange={(e) =>
                          updateAcademic(
                            academic.id,
                            "field_of_study",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade/GPA</Label>
                      <Input
                        placeholder="3.8/4.0 or First Class"
                        value={academic.grade}
                        onChange={(e) =>
                          updateAcademic(academic.id, "grade", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input
                        type="number"
                        placeholder="2018"
                        value={academic.start_year}
                        onChange={(e) =>
                          updateAcademic(
                            academic.id,
                            "start_year",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <Input
                        type="number"
                        placeholder="2022"
                        value={academic.end_year}
                        onChange={(e) =>
                          updateAcademic(
                            academic.id,
                            "end_year",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Relevant coursework, achievements, etc."
                      value={academic.description}
                      onChange={(e) =>
                        updateAcademic(
                          academic.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="bg-slate-900/50 border-white/20"
                    />
                  </div>
                </div>
              ))}

              {academics.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No education records added yet. Click the button above to add
                  your qualifications.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certifications Tab */}
        {activeTab === "certifications" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </CardTitle>
              <CardDescription>
                Add your professional certifications and credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={addCertification}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>

              {certifications.map((cert, index) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-medium">
                      Certification #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeCertification(cert.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Certification Name</Label>
                      <Input
                        placeholder="AWS Solutions Architect"
                        value={cert.name}
                        onChange={(e) =>
                          updateCertification(cert.id, "name", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        placeholder="Amazon Web Services"
                        value={cert.issuing_organization}
                        onChange={(e) =>
                          updateCertification(
                            cert.id,
                            "issuing_organization",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={cert.issue_date}
                        onChange={(e) =>
                          updateCertification(
                            cert.id,
                            "issue_date",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date (Optional)</Label>
                      <Input
                        type="date"
                        value={cert.expiry_date}
                        onChange={(e) =>
                          updateCertification(
                            cert.id,
                            "expiry_date",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credential ID</Label>
                      <Input
                        placeholder="ABC123XYZ"
                        value={cert.credential_id}
                        onChange={(e) =>
                          updateCertification(
                            cert.id,
                            "credential_id",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credential URL</Label>
                      <Input
                        placeholder="https://verify.example.com/..."
                        value={cert.credential_url}
                        onChange={(e) =>
                          updateCertification(
                            cert.id,
                            "credential_url",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                  </div>

                  {/* Certificate File Upload */}
                  <div className="space-y-2">
                    <Label>Upload Certificate</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/20 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) =>
                            handleCertificationFileUpload(
                              cert.id,
                              e.target.files?.[0],
                            )
                          }
                        />
                      </label>
                      {cert.file_url && (
                        <a
                          href={cert.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
                        >
                          <FileText className="w-4 h-4" />
                          View Certificate
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {certifications.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No certifications added yet. Click the button above to add
                  your credentials.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Experience Tab */}
        {activeTab === "experience" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="w-5 h-5" />
                Work Experience
              </CardTitle>
              <CardDescription>
                Add your professional work experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" onClick={addExperience} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>

              {experiences.map((exp, index) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {exp.company_logo_url ? (
                        <img
                          src={exp.company_logo_url}
                          alt={exp.company_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                          <Building className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <h4 className="text-white font-medium">
                        Experience #{index + 1}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="Google, Microsoft, etc."
                        value={exp.company_name}
                        onChange={(e) =>
                          updateExperience(
                            exp.id,
                            "company_name",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={exp.job_title}
                        onChange={(e) =>
                          updateExperience(exp.id, "job_title", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Employment Type</Label>
                      <Select
                        value={exp.employment_type}
                        onValueChange={(value) =>
                          updateExperience(exp.id, "employment_type", value)
                        }
                      >
                        <SelectTrigger className="bg-slate-900/50 border-white/20">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="San Francisco, CA"
                        value={exp.location}
                        onChange={(e) =>
                          updateExperience(exp.id, "location", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={exp.start_date}
                        onChange={(e) =>
                          updateExperience(exp.id, "start_date", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="space-y-2">
                        <Input
                          type="date"
                          value={exp.end_date}
                          onChange={(e) =>
                            updateExperience(exp.id, "end_date", e.target.value)
                          }
                          disabled={exp.is_current}
                          className="bg-slate-900/50 border-white/20"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                          <input
                            type="checkbox"
                            checked={exp.is_current}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "is_current",
                                e.target.checked,
                              )
                            }
                            className="rounded"
                          />
                          Currently working here
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Company Logo Upload */}
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/20 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                        <Upload className="w-4 h-4" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleExperienceLogoUpload(
                              exp.id,
                              e.target.files?.[0],
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      value={exp.description}
                      onChange={(e) =>
                        updateExperience(exp.id, "description", e.target.value)
                      }
                      className="bg-slate-900/50 border-white/20 min-h-[100px]"
                    />
                  </div>
                </div>
              ))}

              {experiences.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No work experience added yet. Click the button above to add
                  your experience.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Portfolio / Showcase Works
              </CardTitle>
              <CardDescription>
                Showcase your best projects and work samples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={addPortfolioItem}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>

              {portfolioItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <h4 className="text-white font-medium">
                        Project #{index + 1}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input
                        placeholder="E-commerce Platform"
                        value={item.title}
                        onChange={(e) =>
                          updatePortfolioItem(item.id, "title", e.target.value)
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project URL</Label>
                      <Input
                        placeholder="https://project.example.com"
                        value={item.project_url}
                        onChange={(e) =>
                          updatePortfolioItem(
                            item.id,
                            "project_url",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={item.start_date}
                        onChange={(e) =>
                          updatePortfolioItem(
                            item.id,
                            "start_date",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={item.end_date}
                        onChange={(e) =>
                          updatePortfolioItem(
                            item.id,
                            "end_date",
                            e.target.value,
                          )
                        }
                        className="bg-slate-900/50 border-white/20"
                      />
                    </div>
                  </div>

                  {/* Project Image Upload */}
                  <div className="space-y-2">
                    <Label>Project Image/Screenshot</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/20 rounded-lg cursor-pointer hover:bg-slate-800 transition">
                        <Upload className="w-4 h-4" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handlePortfolioImageUpload(
                              item.id,
                              e.target.files?.[0],
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your project, technologies used, and your role..."
                      value={item.description}
                      onChange={(e) =>
                        updatePortfolioItem(
                          item.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="bg-slate-900/50 border-white/20 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Technologies Used (comma separated)</Label>
                    <Input
                      placeholder="React, Node.js, PostgreSQL"
                      value={item.technologies?.join(", ") || ""}
                      onChange={(e) =>
                        updatePortfolioItem(
                          item.id,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                      className="bg-slate-900/50 border-white/20"
                    />
                  </div>
                </div>
              ))}

              {portfolioItems.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No portfolio items added yet. Click the button above to
                  showcase your work.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8"
          >
            {saving ? (
              <>
                <span className="animate-spin mr-2">
                  <Save className="w-4 h-4" />
                </span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {profileExists ? "Update Profile" : "Create Profile"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
