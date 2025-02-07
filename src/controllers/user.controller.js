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

export { registerUser };
