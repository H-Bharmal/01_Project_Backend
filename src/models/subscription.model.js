import mongoose, { mongo } from "mongoose"

const subscriptionSchema = new mongoose.Schema({
    subscriber : {
        // the subscriber who is subscribing
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {
        // The one who subscripber subscribes to
        type : mongoose.Schema.Types.ObjectId,  
        ref : "User"
    }
},{timestamps:true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema)