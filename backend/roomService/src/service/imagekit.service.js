import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const uploadImage = async (fileBuffer, fileName) => {
  try {
    const result = await imagekit.upload({
      file: fileBuffer, // can be a base64 string or buffer
      fileName: fileName,
      folder: "/hostel_rooms", // Optional: Store in a specific folder
    });
    return result;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error("Failed to upload image");
  }
};
