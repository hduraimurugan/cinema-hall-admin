// /services/cloudinary.js
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

// ✅ Upload Image
export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)

  const res = await fetch(CLOUDINARY_BASE_URL, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    throw new Error("Failed to upload image")
  }

  const data = await res.json()
  return {
    public_id: data.public_id,
    url: data.secure_url,
    resource_type: data.resource_type,
    created_at: data.created_at,
  }
}

// ✅ Delete Image (Requires secured backend call)
// Insecure to do from frontend — Do this via backend using your API key/secret
// Example usage:
// await axios.post("/api/cloudinary/delete", { public_id: "xyz" })

// ✅ Replace Image (delete old one, upload new)
export const replaceImage = async (oldPublicId, newFile) => {
  // Backend should handle deletion securely
  // await deleteImage(oldPublicId)   ❌ Don't do from frontend

  return await uploadImageToCloudinary(newFile)
}

// ✅ Get Image Info (Optional - not commonly used)
export const getImageInfo = (publicId) => {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.jpg`
}
