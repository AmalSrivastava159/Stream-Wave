// import {asyncHandler} from "../utils/asyncHandler.js";
// import {ApiError} from "../utils/ApiError.js"
// import {User} from "../models/user.models.js"
// import { uploadOnCloudinary} from "../utils/cloudinary.js"
// import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = asyncHandler( async (req, res) => {
//     // get user details from frontend
//     // validation - not empty
//     // check if user name already exit: username, email
//     // check for images, check for avatar
//     // upload them to cloudinary
//     // create user object - create entry in db
//     // remove password and refresh token field from response
//     // check form user creation
//     // check res

//     const {fullName,email, username, password} = req.body
//     //console.log("email:",email);

//     if(
//         [fullName, email, username, password].some((field) =>
//         field?.trim() === "")
//     ){
//         throw new ApiError(400, "All fields are required")
//     }

//     const existedUser = await User.findOne({
//         $or: [{ username }, { email}]
//     })

//     if(existedUser){
//         throw new ApiError(409, "User with email or username already exist")
//     }
//     console.log("Uploaded files:", req.files);  // Debugging

//     if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
//         throw new ApiError(400, "Avatar file is required");
//     }

//     const avatarlocalPath = req.files?.avatar[0]?.path;
//     //const coverImageLocalPath = req.files?.coverImage[0]?.path;

//     let coverImageLocalPath;
//     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//         coverImageLocalPath = req.files.coverImage[0].path
//     }
    
//     if(!avatarlocalPath){
//         throw new ApiError(400, "Avatar file is required")
//     }

//     const avatar = await uploadOnCloudinary(avatarlocalPath)
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if(!avatar) {
//         throw new ApiError(400, "Avatar file is required")
//     }



//     const user = await User.create({
//         fullName,
//         avatar: avatar.url,
//         coverImage: coverImage?.url || "",
//         email, 
//         password,
//         username: username.toLowerCase()
//     })

//     //const createdUser = await user.findById(user._id).select("-password -refreshToken");
//     const createdUser = await User.findById(user._id).select("-password -refreshToken");

//     if(!createdUser){
//         throw new ApiError(500,"Something went wrong while registering the user")
//     }

//     return res.status(201).json(
//         new ApiResponse(200, createdUser, "User registered Successfully")
//     )
// })

// export {
//     registerUser,
// }

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens =  async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went erong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    console.log("Existed User:", existedUser); 
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    console.log("Uploaded files:", req.files); // Debugging

    if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarlocalPath = req.files.avatar[0].path.replace(/\\/g, "/"); // Fix Windows paths
    let coverImageLocalPath = req.files.coverImage?.[0]?.path?.replace(/\\/g, "/");

    const avatar = await uploadOnCloudinary(avatarlocalPath);
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    let coverImageUrl = "";
    if (coverImageLocalPath) {
        const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
        coverImageUrl = coverImageUpload?.url || "";
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImageUrl,
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) =>{
    //req body-> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email, username, password}=req.body

    if(!username && !email){
        throw new ApiError(400, "username or password is required")
    }

    console.log("Login Request Body:", req.body); // Debugging

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, " Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure: true
    }

    console.log("User logged In successfully");

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    ) 

})

const logoutUser = asyncHandler(async(req, res)=> {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly:true,
        secure: true
    }

    console.log("User logged out successfully"); 

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => 
{
    try {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await
        await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||
        "Invalid refresh token")
    }

})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };
