import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new mongoose.Schema(
    {
        videoFile : { // cloudingary
            type : String,
            required : true,
        },
        thumbnail : { // cloudingary
            type : String,
            required : true,
        },
        title : { 
            type : String,
            required : true,
        },
        description : {
            type : String,
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
        },
        views : {
            type : Number,
            default : 0,
        },
        isPublished : {
            type : Boolean,
            default : true,
        },
        duration : { //cloudinary
            type : String,
            required : true,
        }
    }, {timestamps:true});


mongoose.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);