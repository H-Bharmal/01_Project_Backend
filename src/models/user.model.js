import mongoose from "mongoose"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        }, 
        email :{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullName :{
            type : String,
            required : true,
            trim : true,
            index : true,
        },
        avatar :{
            type : String, //cloudinary url
            required : true,
        },
        coverImage :{
            type : String, //cloudinary url
        },
        password : { //encryt this field
            type : String,
            required : [true, "Password is Required"]
        },
        watchHistory : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        refreshToken : {
            type : String,
        }

    }, {timestamps: true});

    // here the need for context is needed, hence cannot use lambda function since they dont provide a content of execution
    // We want to encrpyt tghe password, just before saving
    // sicne encryptin take time, async is used await
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// to design custom methods

// this method checks if password is correct
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

// access token generation method
userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        // param 1 is payload
        {
            _id : this._id,
            email : TouchList.email,
            username : this.username,
            fullName : this.fullName
        },
        // access token secret
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        // param 1 is payload
        {
            _id : this._id,
        },
        // refresh token secret
        process.env.REFRESH_TOKEN_SECRET,
        // refresh token expiry
        {
            expiresIn : REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);