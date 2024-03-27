import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const existedUser = User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "Username or Email already exists")
    }

    // req.files is given by multer and here we use it to get images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path ;
    console.log(req.files);
    const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    // upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) 
        throw new ApiError(400, "Avatar is required");

    const user = User.create({
        fullName,
        email,
        password,
        avatar : avatar.path,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase()
    })

    // Now validate if user is createad
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // Send the response back
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )
})

export {registerUser};