import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler( async(req, res)=>{
    // First we need to get all the details from the user
    // then check if data is not empty
    // Check if user already exits
    // check if password is proper
    // check if image, avatar is properly given
    // upload them to cloudinary
    // check if upload successful
    // if all successful.
    // create the user
    // check if user is created in database
    // remove the confidential fields like password and refresh toekn

    // send back the resposnse


    const {fullName, email, username, password} = req.body ;
    console.log("fullname:",fullName);
    console.log("email",email);
    console.log("username", username);
    console.log("password",password);
    

    if(
        [fullName, email, username, password].some((field)=> field?.trim() =="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "Username or Email already exists")
    }

    // req.files is given by multer and here we use it to get images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path ;
    console.log(req.files);
    console.log(avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    // upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) 
        throw new ApiError(500, "Avatar upload unsuccessful");

    const user = await User.create({
        fullName,
        email,
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase()
    })

    // Now validate if user is createad
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Send the response back
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )
});

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        // Find teh user
        const user = await User.findById(userId);

        // generate access and refresh token
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Put that in user and update
        user.refreshToken = refreshToken;

        //  TODO: what happens if i dont use this validateBeforeSave
        await user.save({validateBeforeSave:false});
        // console.log(accessToken);
        // console.log(refreshToken);
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Generating Tokens failed !",[error])
    }
};

const loginUser = asyncHandler( async(req, res)=>{
    /*
        To validate / login a user
        1. Get the necessary details from a user (username/email and password)
        2. check if username/email exists else throw error
        3. check if passwrods match
        4. if passwords match, generate a access token and refresh toekn an
        5. Response the client with access toeken adn refresgh token -->Cookies sent
    */
    // console.log(req);
    // console.log(req.body);
    const {username, email, password} = req.body;
    // console.log(username," and ",email);
    // check if we have atleast one of email or username
    if(!username && !email){
        throw new ApiError(400, "Username or Email is Required !");
    }
    
    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if( !user){
        throw new ApiError(400, "User does not exists.");
    }

    // validate the password
    const isValidUser = await user.isPasswordCorrect(password);

    if(!isValidUser) throw new ApiError(400, "Invalid Credentials");

    // Generate access token and refresh token
    // we will have a function for it
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    // console.log(accessToken);
    // Now either you can update the user for access or refresh token, or make a new query since, the function has already updated the user in database
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    // Send cookies
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User Logged In Successfully"
        )
    )
});

const logoutUser = asyncHandler(async (req,res)=>{
    // since we do not have user id for logout, we will create a middle ware that will append the user object to the req, so that later we can have user
    
    // delete the token from database
    // delete the cookies(only server can delete)

    const user = await User.findByIdAndUpdate(req.user._id,
        // this paramter we do what to update
        {
            $set:{
                refreshToken : "undefined"
            }
        },
        // This parameter make sure that return value is the updated value
        {
            new : true
        });
    console.log(user.refreshToken);
    const options = {
        httpOnly:true,
        secure : true
    }

    return res.
    status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,
        {}, "User logged Out Successfully!"))
})

const refreshAccessToken = asyncHandler( async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request");
    }
try {
    
        // verify the incomingRefreshToken
        const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        // Get the user id from decoded refresh token,
        // fetch the token in databse, compare it with incoming
    
        const user = await User.findById(decodedRefreshToken?._id);
        if(!user)
        {
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        // Generate a new pair of refersh, access token
        const {refreshToken, accessToken}= await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            accessToken, refreshToken
        }, "Access token refreshed !"));
} catch (error) {
    throw new ApiError(error?.statusCode || 400, error?.message ||"Invalid Refresh Token")
}

})

// Changing the passwrod, method for it
const changeUserPassword = asyncHandler(async(req, res)=>{
    // Get the details (old password, new password)
    const {oldPassword, newPassword} = req.body
    // verify if user is logged in
    // It will be verified by the middleware,hence we will have user object
    const user= await User.findById(req.user?._id) ;
    if(!user){
        throw new ApiError(400,"Authentication error");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Credentials")
    }

    // update the password o/w
    user.password = newPassword; 
    await user.save({validateBeforeSave:true});

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body;

    if(!fullName && !email){
        throw new ApiError(400, "All fields are required");
    }
    // HERE WHEN WE ARE UPDATING THE EMAIL AND FULLNAME, WE ARE NOT CHANGING THE ACCESS TOKEN AGAIN, IT IS OK SINCE ALL USAGE OF ACCESS TOKEN USUALLY HAVE ID AS USED PARAMETER, BUT THIS IS A LOOPHOLE
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    // First we check if we have avatar file
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(500, "Error uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {avatar : avatar.url}
        },
        {
            new:true
        }
        ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res)=>{
    // First we check if we have avatar file
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage is required")
    }

    // upload on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(500, "Error uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {coverImage : coverImage.url}
        },
        {
            new:true
        }
        ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken,
changeUserPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,};