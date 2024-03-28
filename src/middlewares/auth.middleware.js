import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler( async(req,res,next)=>{

try {
        // Either take the accesstoken from cookies,
        // if we dont have cookies (in case of mobile app)
        // a Authorization header would be send
        // with Authorization as key
        // and "Bearer <token>" as value
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!accessToken){
            throw new ApiError(401, "Unauthorized user");
        }
    
        // from token we need to decode the token
        const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
        // Get the user now from database
        const user = await User.findById(decodedAccessToken?._id).select("-password -refreshToken");
    
        if(!user)
        // Next Video :: discuss about frontend
            throw new ApiError(401, "Invalid Access Token");
    
        // Giving user in req  
        req.user = user;
    
        next();
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
}
})
