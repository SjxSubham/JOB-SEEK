// Alternative recommendation function in apiRecommendations.js
export async function getJobRecommendations(token, { user_id }) {
  const supabase = await supabaseClient(token);
  
  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (!profile) return null;

  // Get all jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)");

  if (!jobs) return null;

  // Simple matching algorithm
  const scoredJobs = jobs.map(job => {
    let score = 0;
    
    // Match skills
    if (profile.skills && job.requirements) {
      const jobSkills = job.requirements.toLowerCase().split(/[,.\s]+/);
      score += profile.skills.filter(skill => 
        jobSkills.includes(skill.toLowerCase())
      ).length;
    }
    
    return { ...job, score };
  });

  // Sort by score and return top 3
  return scoredJobs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}