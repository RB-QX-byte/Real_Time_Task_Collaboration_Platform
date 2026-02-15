//global error Middleware

//If the error happens in the app this errorHandler file catches it

//This file also send the proper JSON response instead of crashing

const errorHandler = (err,req,res,next) => {
    
    //Gets you a default 500 for server errors
    const statusCode = err.statusCode || 500;

    //Sends a cleaner JSON response
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

};

export default errorHandler;