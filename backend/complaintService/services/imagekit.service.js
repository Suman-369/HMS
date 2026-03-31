import ImageKit from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!publicKey || !privateKey || !urlEndpoint) {
  const errMsg =
    "ImageKit keys are missing: set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT in .env";
  console.error(errMsg);
  throw new Error(errMsg);
}

const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

export const uploadImage = async (base64Data, fileName) => {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Valid base64 image data required");
  }

  const cleanBase64 = base64Data.startsWith("data:")
    ? base64Data
    : `data:image/jpeg;base64,${base64Data}`;

  try {
    const result = await imagekit.files.upload({
      file: cleanBase64,
      fileName,
      folder: "/complaints",
      useUniqueFileName: true,
    });
    return result;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error(`Failed to upload image: ${error.message || error}`);
  }
};
