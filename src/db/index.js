// To connect to database
import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"
const dbConnect = async ()=>{
    try{
        const connection = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connection successful");
        // console.log(connection);
        console.log(connection.connection.host);
    }
    catch(error){
        console.log("Error connecting mongoDB", error);
        process.exit(1);
    }
}

export default dbConnect