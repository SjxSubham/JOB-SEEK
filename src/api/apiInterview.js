import supabaseClient from "@/utils/supabase";

/**
 * Generate a deterministic room ID for an application's interview
 */
export function generateRoomId(applicationId) {
  return `interview-${applicationId}`;
}

/**
 * Schedule an interview for an application
 * @param {string} token - Supabase auth token
 * @param {object} options - { application_id }
 * @param {string} scheduledAt - ISO date string for the interview time
 */
export async function scheduleInterview(token, { application_id }, scheduledAt) {
  const supabase = await supabaseClient(token);

  const roomId = generateRoomId(application_id);

  const { data, error } = await supabase
    .from("applications")
    .update({
      interview_scheduled_at: scheduledAt,
      interview_room_id: roomId,
      status: "interviewing",
    })
    .eq("id", application_id)
    .select();

  if (error) {
    console.error("Error scheduling interview:", error);
    throw new Error("Failed to schedule interview");
  }

  return data;
}

/**
 * Get interview details for a specific application
 * @param {string} token - Supabase auth token
 * @param {object} options - { application_id }
 */
export async function getInterviewDetails(token, { application_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, job:jobs(title, company:companies(name))"
    )
    .eq("id", application_id)
    .single();

  if (error) {
    console.error("Error fetching interview details:", error);
    throw new Error("Failed to fetch interview details");
  }

  return data;
}
