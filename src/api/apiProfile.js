import supabaseClient, { supabaseUrl } from "@/utils/supabase";

/**
 * Check if profile exists for user
 * @param {string} token - Supabase auth token
 * @param {string} user_id - User ID
 * @returns {Promise<boolean>} True if profile exists
 */
export async function checkProfileExists(token, user_id) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user_id)
    .single();

  if (error && error.code !== "PGRST116") {
    // Ignore "No rows found" error
    console.error("Error checking profile:", error);
    return false;
  }

  return !!data;
}

/**
 * Get user profile by user ID
 * @param {string} token - Supabase auth token
 * @param {object} params - Parameters object
 * @param {string} params.user_id - User ID
 * @returns {Promise<object|null>} User profile data or null if error
 */
export async function getProfile(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Create or update user profile
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter (maintains consistent API signature)
 * @param {object} profileData - Profile data to upsert
 * @returns {Promise<object>} Upserted profile data
 * @throws {Error} If upsert fails
 */
export async function upsertProfile(token, _, profileData) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("profiles")
    .upsert([profileData])
    .select();

  if (error) {
    console.error("Error saving profile:", error);
    throw new Error("Error saving profile");
  }

  return data;
}

/**
 * Update specific profile fields
 * @param {string} token - Supabase auth token
 * @param {object} params - Parameters object
 * @param {string} params.user_id - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated profile data
 * @throws {Error} If update fails
 */
export async function updateProfile(token, { user_id }, updates) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error("Error updating profile");
  }

  return data;
}

export async function createProfile(token, profileData) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("profiles")
    .insert([profileData])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    throw new Error("Error creating profile");
  }

  return data;
}

/**
 * Upload resume file to Supabase storage
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Upload data containing user_id and file
 * @returns {Promise<string>} Resume URL
 * @throws {Error} If upload fails
 */
export async function uploadResume(token, _, { user_id, file }) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${user_id}-${file.name}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading resume:", storageError);
    throw new Error("Error uploading resume");
  }

  const resume_url = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;
  return resume_url;
}

/**
 * Upload company logo for experience
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Upload data containing company name and file
 * @returns {Promise<string>} Logo URL
 * @throws {Error} If upload fails
 */
export async function uploadExperienceLogo(token, _, { company_name, file }) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `exp-logo-${random}-${company_name}`;

  const { error: storageError } = await supabase.storage
    .from("experience-logos")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading experience logo:", storageError);
    throw new Error("Error uploading company logo");
  }

  const logo_url = `${supabaseUrl}/storage/v1/object/public/experience-logos/${fileName}`;
  return logo_url;
}

/**
 * Upload portfolio/showcase work item
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Upload data containing user_id, title and file
 * @returns {Promise<string>} Portfolio item URL
 * @throws {Error} If upload fails
 */
export async function uploadPortfolioItem(token, _, { user_id, title, file }) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "-");
  const fileName = `portfolio-${random}-${user_id}-${sanitizedTitle}-${file.name}`;

  const { error: storageError } = await supabase.storage
    .from("portfolios")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading portfolio item:", storageError);
    throw new Error("Error uploading portfolio item");
  }

  const portfolio_url = `${supabaseUrl}/storage/v1/object/public/portfolios/${fileName}`;
  return portfolio_url;
}

/**
 * Upload certification file
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Upload data containing user_id, cert_name and file
 * @returns {Promise<string>} Certification file URL
 * @throws {Error} If upload fails
 */
export async function uploadCertification(
  token,
  _,
  { user_id, cert_name, file },
) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const sanitizedName = cert_name.replace(/[^a-zA-Z0-9]/g, "-");
  const fileName = `cert-${random}-${user_id}-${sanitizedName}-${file.name}`;

  const { error: storageError } = await supabase.storage
    .from("certifications")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading certification:", storageError);
    throw new Error("Error uploading certification");
  }

  const cert_url = `${supabaseUrl}/storage/v1/object/public/certifications/${fileName}`;
  return cert_url;
}

/**
 * Upload profile picture
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Upload data containing user_id and file
 * @returns {Promise<string>} Profile picture URL
 * @throws {Error} If upload fails
 */
export async function uploadProfilePicture(token, _, { user_id, file }) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileExt = file.name.split(".").pop();
  const fileName = `profile-pic-${random}-${user_id}.${fileExt}`;

  const { error: storageError } = await supabase.storage
    .from("profile-pictures")
    .upload(fileName, file, {
      upsert: true,
    });

  if (storageError) {
    console.error("Error uploading profile picture:", storageError);
    throw new Error("Error uploading profile picture");
  }

  const profile_pic_url = `${supabaseUrl}/storage/v1/object/public/profile-pictures/${fileName}`;
  return profile_pic_url;
}

/**
 * Delete a file from storage
 * @param {string} token - Supabase auth token
 * @param {object} _ - Unused parameter
 * @param {object} data - Delete data containing bucket and filePath
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteStorageFile(token, _, { bucket, filePath }) {
  const supabase = await supabaseClient(token);

  // Extract filename from full URL
  const fileName = filePath.split("/").pop();

  const { error } = await supabase.storage.from(bucket).remove([fileName]);

  if (error) {
    console.error("Error deleting file:", error);
    throw new Error("Error deleting file");
  }

  return true;
}
