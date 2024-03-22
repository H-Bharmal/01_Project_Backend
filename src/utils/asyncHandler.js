
const asyncHandler = (requestHandler)=>{
    (req, res, next)=>{
        Promise
        .resolve(requestHandler(req, res, next))
        .reject((err)=>{
            next(err)
        })
    }
}

// It is a higher order function
// const asyncHandler = (func)=>{
//     return async (req, res, next) =>{
//         try {
//             await func(req, res, next)
//         } catch (error) {
//             res.status(err.code || 500).json({
//                 success : false,
//                 message : err.message
//             })
//         }
//     }
// }

// const asyncHandler = (func)=>()=>{}











export {asyncHandler}