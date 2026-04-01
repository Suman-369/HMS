import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!publicKey || !privateKey || !urlEndpoint) {
  console.error(
    "ImageKit keys are missing. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT in .env",
  );
}

const imagekit = new ImageKit({
  publicKey: publicKey ,
  privateKey: privateKey ,
  urlEndpoint: urlEndpoint 
});

export const uploadImage = async (fileBuffer, fileName) => {
  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      "ImageKit config missing: set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT",
    );
  }

  try {
    const result = await imagekit.upload({
      file: fileBuffer, // can be a base64 string or buffer
      fileName: fileName,
      folder: "/hostel_rooms", // Optional: Store in a specific folder
    });
    return result;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error(`Failed to upload image: ${error.message || error}`);
  }
};
