// Get file from temp server and push to cloudinary
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})
const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        // console.log(localFilePath);
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        fs.unlinkSync(localFilePath)
        // File is uploaded successfully so unlink now
        console.log("file upload success");
        console.log(response.url);
        return response;

    } catch (error) {
        // we will unlink localy saved temp file as upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}


export {uploadOnCloudinary}