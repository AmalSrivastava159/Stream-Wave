// import {v2 as cloudinary} from "cloudinary" 
// import fs from "fs"
// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET, 
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null

//         const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type: "auto"
//         })
//         console.log("File has been uploaded on cloudinary successfully!!", response.url);
//         return response;
//     }catch (error){
//         fs.unlinkSync(localFilePath) // remove the locally saved tempory file as the upload operation got failed
//         return null;
//     }
// }

// export {uploadOnCloudinary}

import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) throw new Error("No file path provided");

        // ✅ Check if the file actually exists
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`File does not exist: ${localFilePath}`);
        }

        console.log("Uploading file to Cloudinary:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded successfully:", response.url);

        // ✅ Delete the file after successful upload
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        
        // ✅ Only delete file if it actually exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        return null;
    }
};

export { uploadOnCloudinary };




