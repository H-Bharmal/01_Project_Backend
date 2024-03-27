import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();

// configuring the cors using .use() method
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

// configuring json response limit
app.use(express.json({
    limit : "16kb"
}))

// url encoding parameter 
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

//  static files which i want to keep with server itself
// here public is the folder name, can be anything
app.use(express.static("public"))

// cookie parser is used so that cookies from server can be set into browser, somethings some cookies can be accessed by only the server, such things are done by cookie parser
app.use(cookieParser());


// routes import
import userRouter from "./routes/user.routes.js"
// we canot use app.get() since controller and routes are now seperate
// hence we need to have middleware
// Like this --> // app.use("/users", userRouter);
// benefit of doing this is
//  now the uri : http://localhost:8000/users/<this part will be now further handled by userRouters>

app.use("/api/v1/users", userRouter);


export { app }