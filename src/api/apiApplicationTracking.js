import supabaseClient from "@/utils/supabase";

// ============================================
// APPLICATION ACTIVITIES / TIMELINE
// ============================================

/**
 * Get activity timeline for an application
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {string} options.application_id - Application ID
 * @returns {Promise<Array>} List of activities
 */
export async function getApplicationActivities(token, { application_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_activities")
    .select("*")
    .eq("application_id", application_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching application activities:", error);
    throw new Error("Failed to fetch application activities");
  }

  return data;
}

/**
 * Add an activity to an application
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} activityData - Activity data
 * @returns {Promise<object>} Created activity
 */
export async function addApplicationActivity(token, _, activityData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_activities")
    .insert([
      {
        application_id: activityData.application_id,
        activity_type: activityData.activity_type,
        performed_by: activityData.performed_by,
        performed_by_role: activityData.performed_by_role,
        previous_value: activityData.previous_value,
        new_value: activityData.new_value,
        description: activityData.description,
        metadata: activityData.metadata || {},
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding application activity:", error);
    throw new Error("Failed to add application activity");
  }

  return data;
}

// ============================================
// APPLICATION NOTES (RECRUITER PRIVATE NOTES)
// ============================================

/**
 * Get notes for an application
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {string} options.application_id - Application ID
 * @returns {Promise<Array>} List of notes
 */
export async function getApplicationNotes(token, { application_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_notes")
    .select("*")
    .eq("application_id", application_id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching application notes:", error);
    throw new Error("Failed to fetch application notes");
  }

  return data;
}

/**
 * Add a note to an application
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} noteData - Note data
 * @returns {Promise<object>} Created note
 */
export async function addApplicationNote(token, _, noteData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_notes")
    .insert([
      {
        application_id: noteData.application_id,
        recruiter_id: noteData.recruiter_id,
        note: noteData.note,
        is_pinned: noteData.is_pinned || false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding application note:", error);
    throw new Error("Failed to add application note");
  }

  return data;
}

/**
 * Update a note
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.note_id - Note ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated note
 */
export async function updateApplicationNote(token, { note_id }, updates) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_notes")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", note_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating application note:", error);
    throw new Error("Failed to update application note");
  }

  return data;
}

/**
 * Delete a note
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.note_id - Note ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteApplicationNote(token, { note_id }) {
  const supabase = await supabaseClient(token);

  const { error } = await supabase
    .from("application_notes")
    .delete()
    .eq("id", note_id);

  if (error) {
    console.error("Error deleting application note:", error);
    throw new Error("Failed to delete application note");
  }

  return true;
}

/**
 * Toggle pin status of a note
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.note_id - Note ID
 * @param {boolean} options.is_pinned - Current pin status
 * @returns {Promise<object>} Updated note
 */
export async function toggleNotePin(token, { note_id, is_pinned }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_notes")
    .update({
      is_pinned: !is_pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", note_id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling note pin:", error);
    throw new Error("Failed to toggle note pin");
  }

  return data;
}

// ============================================
// APPLICATION RATINGS
// ============================================

/**
 * Get rating for an application by a specific recruiter
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {string} options.application_id - Application ID
 * @param {string} options.recruiter_id - Recruiter ID (optional)
 * @returns {Promise<object|Array>} Rating data
 */
export async function getApplicationRating(
  token,
  { application_id, recruiter_id }
) {
  const supabase = await supabaseClient(token);

  let query = supabase
    .from("application_ratings")
    .select("*")
    .eq("application_id", application_id);

  if (recruiter_id) {
    query = query.eq("recruiter_id", recruiter_id).single();
  }

  const { data, error } = await query;

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching application rating:", error);
    throw new Error("Failed to fetch application rating");
  }

  return data;
}

/**
 * Add or update rating for an application
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} ratingData - Rating data
 * @returns {Promise<object>} Created/Updated rating
 */
export async function upsertApplicationRating(token, _, ratingData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_ratings")
    .upsert(
      [
        {
          application_id: ratingData.application_id,
          recruiter_id: ratingData.recruiter_id,
          skills_rating: ratingData.skills_rating,
          experience_rating: ratingData.experience_rating,
          communication_rating: ratingData.communication_rating,
          culture_fit_rating: ratingData.culture_fit_rating,
          overall_rating: ratingData.overall_rating,
          comments: ratingData.comments,
          recommendation: ratingData.recommendation,
          updated_at: new Date().toISOString(),
        },
      ],
      {
        onConflict: "application_id,recruiter_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting application rating:", error);
    throw new Error("Failed to save application rating");
  }

  return data;
}

/**
 * Get average ratings for an application
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {string} options.application_id - Application ID
 * @returns {Promise<object>} Average ratings
 */
export async function getAverageApplicationRatings(token, { application_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("application_ratings")
    .select("*")
    .eq("application_id", application_id);

  if (error) {
    console.error("Error fetching application ratings:", error);
    throw new Error("Failed to fetch application ratings");
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate averages
  const averages = {
    skills: 0,
    experience: 0,
    communication: 0,
    culture_fit: 0,
    overall: 0,
    total_reviews: data.length,
    recommendations: {
      strong_yes: 0,
      yes: 0,
      maybe: 0,
      no: 0,
      strong_no: 0,
    },
  };

  data.forEach((rating) => {
    averages.skills += rating.skills_rating || 0;
    averages.experience += rating.experience_rating || 0;
    averages.communication += rating.communication_rating || 0;
    averages.culture_fit += rating.culture_fit_rating || 0;
    averages.overall += rating.overall_rating || 0;

    if (rating.recommendation) {
      averages.recommendations[rating.recommendation]++;
    }
  });

  const count = data.length;
  averages.skills = (averages.skills / count).toFixed(1);
  averages.experience = (averages.experience / count).toFixed(1);
  averages.communication = (averages.communication / count).toFixed(1);
  averages.culture_fit = (averages.culture_fit / count).toFixed(1);
  averages.overall = (averages.overall / count).toFixed(1);

  return averages;
}

// ============================================
// ENHANCED APPLICATION STATUS MANAGEMENT
// ============================================

/**
 * Extended application status options
 */
export const APPLICATION_STATUSES = {
  APPLIED: "applied",
  UNDER_REVIEW: "under_review",
  SHORTLISTED: "shortlisted",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  INTERVIEWING: "interviewing",
  INTERVIEW_COMPLETED: "interview_completed",
  OFFER_EXTENDED: "offer_extended",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_DECLINED: "offer_declined",
  HIRED: "hired",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
  ON_HOLD: "on_hold",
};

/**
 * Status display configuration
 */
export const STATUS_CONFIG = {
  [APPLICATION_STATUSES.APPLIED]: {
    label: "Applied",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgLight: "bg-blue-500/20",
    order: 1,
  },
  [APPLICATION_STATUSES.UNDER_REVIEW]: {
    label: "Under Review",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    bgLight: "bg-yellow-500/20",
    order: 2,
  },
  [APPLICATION_STATUSES.SHORTLISTED]: {
    label: "Shortlisted",
    color: "bg-purple-500",
    textColor: "text-purple-500",
    bgLight: "bg-purple-500/20",
    order: 3,
  },
  [APPLICATION_STATUSES.INTERVIEW_SCHEDULED]: {
    label: "Interview Scheduled",
    color: "bg-cyan-500",
    textColor: "text-cyan-500",
    bgLight: "bg-cyan-500/20",
    order: 4,
  },
  [APPLICATION_STATUSES.INTERVIEWING]: {
    label: "Interviewing",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    bgLight: "bg-indigo-500/20",
    order: 5,
  },
  [APPLICATION_STATUSES.INTERVIEW_COMPLETED]: {
    label: "Interview Completed",
    color: "bg-teal-500",
    textColor: "text-teal-500",
    bgLight: "bg-teal-500/20",
    order: 6,
  },
  [APPLICATION_STATUSES.OFFER_EXTENDED]: {
    label: "Offer Extended",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    bgLight: "bg-orange-500/20",
    order: 7,
  },
  [APPLICATION_STATUSES.OFFER_ACCEPTED]: {
    label: "Offer Accepted",
    color: "bg-green-500",
    textColor: "text-green-500",
    bgLight: "bg-green-500/20",
    order: 8,
  },
  [APPLICATION_STATUSES.OFFER_DECLINED]: {
    label: "Offer Declined",
    color: "bg-gray-500",
    textColor: "text-gray-500",
    bgLight: "bg-gray-500/20",
    order: 9,
  },
  [APPLICATION_STATUSES.HIRED]: {
    label: "Hired",
    color: "bg-green-600",
    textColor: "text-green-600",
    bgLight: "bg-green-600/20",
    order: 10,
  },
  [APPLICATION_STATUSES.REJECTED]: {
    label: "Rejected",
    color: "bg-red-500",
    textColor: "text-red-500",
    bgLight: "bg-red-500/20",
    order: 11,
  },
  [APPLICATION_STATUSES.WITHDRAWN]: {
    label: "Withdrawn",
    color: "bg-gray-400",
    textColor: "text-gray-400",
    bgLight: "bg-gray-400/20",
    order: 12,
  },
  [APPLICATION_STATUSES.ON_HOLD]: {
    label: "On Hold",
    color: "bg-amber-500",
    textColor: "text-amber-500",
    bgLight: "bg-amber-500/20",
    order: 13,
  },
};

/**
 * Update application status with activity logging
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.application_id - Application ID
 * @param {string} options.user_id - User making the change
 * @param {string} options.user_role - Role of user making the change
 * @param {string} newStatus - New status value
 * @returns {Promise<object>} Updated application
 */
export async function updateApplicationStatusWithTracking(
  token,
  { application_id, user_id, user_role },
  newStatus
) {
  const supabase = await supabaseClient(token);

  // Get current status
  const { data: currentApp, error: fetchError } = await supabase
    .from("applications")
    .select("status")
    .eq("id", application_id)
    .single();

  if (fetchError) {
    console.error("Error fetching current application:", fetchError);
    throw new Error("Failed to fetch application");
  }

  const previousStatus = currentApp.status;

  // Update status
  const { data, error } = await supabase
    .from("applications")
    .update({
      status: newStatus,
      status_updated_at: new Date().toISOString(),
    })
    .eq("id", application_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating application status:", error);
    throw new Error("Failed to update application status");
  }

  // Log activity (trigger will also do this, but we can add extra info)
  await addApplicationActivity(token, null, {
    application_id,
    activity_type: "status_change",
    performed_by: user_id,
    performed_by_role: user_role,
    previous_value: previousStatus,
    new_value: newStatus,
    description: `Status changed from ${
      STATUS_CONFIG[previousStatus]?.label || previousStatus
    } to ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
  });

  return data;
}

// ============================================
// AI JOB RECOMMENDATIONS
// ============================================

/**
 * Get AI job recommendations for a user
 * @param {string} token - Supabase auth token
 * @param {object} options - Query options
 * @param {string} options.user_id - User ID
 * @param {number} options.limit - Number of recommendations
 * @returns {Promise<Array>} List of recommended jobs
 */
export async function getJobRecommendations(token, { user_id, limit = 10 }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("job_recommendations")
    .select(
      `
      *,
      job:jobs(
        id,
        title,
        description,
        location,
        isOpen,
        created_at,
        experience_level,
        job_type,
        work_mode,
        salary_min,
        salary_max,
        skills_required,
        company:companies(name, logo_url)
      )
    `
    )
    .eq("user_id", user_id)
    .eq("was_dismissed", false)
    .gt("expires_at", new Date().toISOString())
    .order("match_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching job recommendations:", error);
    throw new Error("Failed to fetch job recommendations");
  }

  // Filter out jobs that are no longer open
  return data?.filter((rec) => rec.job?.isOpen) || [];
}

/**
 * Save a new job recommendation
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} recommendationData - Recommendation data
 * @returns {Promise<object>} Created recommendation
 */
export async function saveJobRecommendation(token, _, recommendationData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("job_recommendations")
    .upsert(
      [
        {
          user_id: recommendationData.user_id,
          job_id: recommendationData.job_id,
          match_score: recommendationData.match_score,
          match_reasons: recommendationData.match_reasons || [],
          model_version: recommendationData.model_version,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ],
      {
        onConflict: "user_id,job_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving job recommendation:", error);
    throw new Error("Failed to save job recommendation");
  }

  return data;
}

/**
 * Update recommendation interaction (viewed, clicked, etc.)
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.recommendation_id - Recommendation ID
 * @param {string} interaction - Type of interaction
 * @returns {Promise<object>} Updated recommendation
 */
export async function updateRecommendationInteraction(
  token,
  { recommendation_id },
  interaction
) {
  const supabase = await supabaseClient(token);

  const updateData = {};

  switch (interaction) {
    case "view":
      updateData.was_viewed = true;
      break;
    case "click":
      updateData.was_clicked = true;
      break;
    case "apply":
      updateData.was_applied = true;
      break;
    case "save":
      updateData.was_saved = true;
      break;
    case "dismiss":
      updateData.was_dismissed = true;
      break;
  }

  const { data, error } = await supabase
    .from("job_recommendations")
    .update(updateData)
    .eq("id", recommendation_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating recommendation interaction:", error);
    throw new Error("Failed to update recommendation");
  }

  return data;
}

/**
 * Submit feedback for a recommendation
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.recommendation_id - Recommendation ID
 * @param {string} feedback - User feedback
 * @returns {Promise<object>} Updated recommendation
 */
export async function submitRecommendationFeedback(
  token,
  { recommendation_id },
  feedback
) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("job_recommendations")
    .update({
      user_feedback: feedback,
    })
    .eq("id", recommendation_id)
    .select()
    .single();

  if (error) {
    console.error("Error submitting recommendation feedback:", error);
    throw new Error("Failed to submit feedback");
  }

  return data;
}

/**
 * Generate AI recommendations for a user (placeholder for actual AI integration)
 * This function would typically call an AI service like Hugging Face
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.user_id - User ID
 * @returns {Promise<Array>} Generated recommendations
 */
export async function generateAIRecommendations(token, { user_id }) {
  const supabase = await supabaseClient(token);

  // 1. Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    throw new Error("Failed to fetch user profile");
  }

  // 2. Get all open jobs
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(
      `
      *,
      company:companies(name, logo_url)
    `
    )
    .eq("isOpen", true);

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError);
    throw new Error("Failed to fetch jobs");
  }

  // 3. Get user's applied jobs to exclude them
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id")
    .eq("candidate_id", user_id);

  const appliedJobIds = new Set(applications?.map((a) => a.job_id) || []);

  // 4. Simple matching algorithm (replace with actual AI in production)
  const userSkills = profile.skills || [];
  const userPreference = profile.preference?.toLowerCase();
  const userLocation = profile.location?.toLowerCase();

  const recommendations = jobs
    .filter((job) => !appliedJobIds.has(job.id))
    .map((job) => {
      let score = 0;
      const reasons = [];

      // Skill matching
      const jobSkills = job.skills_required || [];
      const matchingSkills = userSkills.filter((skill) =>
        jobSkills.some(
          (js) =>
            js.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(js.toLowerCase())
        )
      );

      if (matchingSkills.length > 0) {
        score += (matchingSkills.length / Math.max(jobSkills.length, 1)) * 40;
        reasons.push(`${matchingSkills.length} matching skills`);
      }

      // Location matching
      if (
        userLocation &&
        job.location?.toLowerCase().includes(userLocation)
      ) {
        score += 20;
        reasons.push("Location match");
      }

      // Work mode preference
      if (userPreference && job.work_mode === userPreference) {
        score += 20;
        reasons.push(`${userPreference} position`);
      }

      // Experience level (if profile has experience data)
      const userExperience = profile.experiences?.length || 0;
      if (job.experience_level === "entry" && userExperience < 2) {
        score += 10;
        reasons.push("Entry-level friendly");
      } else if (job.experience_level === "mid" && userExperience >= 2) {
        score += 10;
        reasons.push("Experience level match");
      } else if (job.experience_level === "senior" && userExperience >= 5) {
        score += 10;
        reasons.push("Senior position match");
      }

      // Recent posting bonus
      const daysSincePosted = Math.floor(
        (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePosted < 7) {
        score += 10;
        reasons.push("Recently posted");
      }

      return {
        job_id: job.id,
        job,
        match_score: Math.min(score, 100),
        match_reasons: reasons,
      };
    })
    .filter((rec) => rec.match_score >= 20) // Minimum 20% match
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10); // Top 10 recommendations

  // 5. Save recommendations to database
  for (const rec of recommendations) {
    await saveJobRecommendation(token, null, {
      user_id,
      job_id: rec.job_id,
      match_score: rec.match_score,
      match_reasons: rec.match_reasons,
      model_version: "simple-v1",
    });
  }

  return recommendations;
}

// ============================================
// APPLICATION ANALYTICS
// ============================================

/**
 * Get application statistics for a candidate
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.user_id - User ID
 * @returns {Promise<object>} Application statistics
 */
export async function getCandidateApplicationStats(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("applications")
    .select("status, created_at")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching application stats:", error);
    throw new Error("Failed to fetch application statistics");
  }

  const stats = {
    total: data?.length || 0,
    by_status: {},
    this_week: 0,
    this_month: 0,
    response_rate: 0,
  };

  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  let responsesReceived = 0;

  data?.forEach((app) => {
    // Count by status
    stats.by_status[app.status] = (stats.by_status[app.status] || 0) + 1;

    // Count by time period
    const createdAt = new Date(app.created_at);
    if (createdAt >= weekAgo) stats.this_week++;
    if (createdAt >= monthAgo) stats.this_month++;

    // Count responses (any status change from applied)
    if (app.status !== "applied") {
      responsesReceived++;
    }
  });

  // Calculate response rate
  if (stats.total > 0) {
    stats.response_rate = Math.round((responsesReceived / stats.total) * 100);
  }

  return stats;
}

/**
 * Get application statistics for a recruiter's job
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.job_id - Job ID
 * @returns {Promise<object>} Application statistics
 */
export async function getJobApplicationStats(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("applications")
    .select("status, created_at, match_score")
    .eq("job_id", job_id);

  if (error) {
    console.error("Error fetching job application stats:", error);
    throw new Error("Failed to fetch job application statistics");
  }

  const stats = {
    total: data?.length || 0,
    by_status: {},
    average_match_score: 0,
    today: 0,
    this_week: 0,
    pipeline: [],
  };

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let totalMatchScore = 0;
  let matchScoreCount = 0;

  data?.forEach((app) => {
    // Count by status
    stats.by_status[app.status] = (stats.by_status[app.status] || 0) + 1;

    // Count by time
    const createdAt = new Date(app.created_at);
    if (createdAt >= todayStart) stats.today++;
    if (createdAt >= weekAgo) stats.this_week++;

    // Calculate average match score
    if (app.match_score) {
      totalMatchScore += app.match_score;
      matchScoreCount++;
    }
  });

  if (matchScoreCount > 0) {
    stats.average_match_score = Math.round(totalMatchScore / matchScoreCount);
  }

  // Build pipeline data
  const pipelineOrder = [
    "applied",
    "under_review",
    "shortlisted",
    "interviewing",
    "offer_extended",
    "hired",
  ];
  stats.pipeline = pipelineOrder.map((status) => ({
    status,
    count: stats.by_status[status] || 0,
    label: STATUS_CONFIG[status]?.label || status,
  }));

  return stats;
}

// ============================================
// PROFILE VIEWS TRACKING
// ============================================

/**
 * Record a profile view
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} viewData - View data
 * @returns {Promise<object>} Created view record
 */
export async function recordProfileView(token, _, viewData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("profile_views")
    .insert([
      {
        profile_user_id: viewData.profile_user_id,
        viewer_user_id: viewData.viewer_user_id,
        viewer_role: viewData.viewer_role,
        source: viewData.source || "direct",
        job_id: viewData.job_id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error recording profile view:", error);
    // Don't throw - profile views are non-critical
    return null;
  }

  return data;
}

/**
 * Get profile view statistics
 * @param {string} token - Supabase auth token
 * @param {object} options - Options
 * @param {string} options.user_id - User ID
 * @returns {Promise<object>} Profile view statistics
 */
export async function getProfileViewStats(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("profile_views")
    .select("viewed_at, source, viewer_role")
    .eq("profile_user_id", user_id)
    .gte("viewed_at", thirtyDaysAgo)
    .order("viewed_at", { ascending: false });

  if (error) {
    console.error("Error fetching profile view stats:", error);
    throw new Error("Failed to fetch profile view statistics");
  }

  const stats = {
    total_views: data?.length || 0,
    by_source: {},
    by_role: {},
    daily_views: {},
  };

  data?.forEach((view) => {
    // By source
    stats.by_source[view.source] = (stats.by_source[view.source] || 0) + 1;

    // By role
    if (view.viewer_role) {
      stats.by_role[view.viewer_role] =
        (stats.by_role[view.viewer_role] || 0) + 1;
    }

    // Daily breakdown
    const date = new Date(view.viewed_at).toISOString().split("T")[0];
    stats.daily_views[date] = (stats.daily_views[date] || 0) + 1;
  });

  return stats;
}
