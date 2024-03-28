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
})

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

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Generating Tokens failed !")
    }
}

const loginUser = asyncHandler( async(req, res)=>{
    /*
        To validate / login a user
        1. Get the necessary details from a user (username/email and password)
        2. check if username/email exists else throw error
        3. check if passwrods match
        4. if passwords match, generate a access token and refresh toekn an
        5. Response the client with access toeken adn refresgh token -->Cookies sent
    */

    const {username, email, password} = req.body;

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
    const {accessToken, refreshToken} = generateAccessAndRefreshTokens(user._id)
    
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

    await User.findByIdAndDelete(req.user._id,
        // this paramter we do what to update
        {
            $set:{
                refreshToken : undefined
            }
        },
        // This parameter make sure that return value is the updated value
        {
            new : true
        });

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

export {registerUser, loginUser, logoutUser};