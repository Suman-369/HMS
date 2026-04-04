import ImageKit, { toFile } from '@imagekit/nodejs';
import config from '../src/config/config.js';

const imagekit = new ImageKit({
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

export const uploadReportFile = async (base64Data, fileName, isPDF = false) => {
  try {
    console.log('Uploading PDF to ImageKit:', fileName);
    
    // Clean filename, ensure .pdf
    const cleanFileName = fileName.replace(/\\.[^\\.]+$/, '') + '.pdf';
    const folder = '/hostel-reports';
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Use SDK toFile helper
    const file = toFile(fileBuffer, cleanFileName);
    
    const uploadRes = await imagekit.files.upload({
      fileName: cleanFileName,
      file,
      folder: folder,
    });
    
    console.log('ImageKit upload success:', uploadRes.fileId, uploadRes.url);
    
    return {
      url: uploadRes.url,
      fileId: uploadRes.fileId,
      name: cleanFileName
    };
  } catch (err) {
    console.error('ImageKit upload failed:', err.message || err);
    throw new Error(`Upload failed: ${err.message}`);
  }
};
