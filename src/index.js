// require('dotenv').config({path : './env'});
import 'dotenv/config'

import dbConnect from "./db/index.js"
import {app} from "./app.js"

// async methods return a promise whenever called
dbConnect()
.then(()=>{
    app.listen(process.env.PORT||8000, ()=>{
        console.log("Server is running at port :", process.env.PORT) ;
    })
})
.catch((error)=>{

    //  TODO : Find what is this
    app.on('error', (error)=>{
        console.log("Database error", error);
        throw error;
    })
    console.log("database conneciton failed");
})