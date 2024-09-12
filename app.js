import express from "express";
// import mongodbConnect from "./connection.js";
import cookieParser from "cookie-parser";
import cors from 'cors';
import postRoute from './routes/post.route.js';
import authRoute from './routes/auth.route.js';
import userRoute from './routes/user.route.js';
import testRoute from "./routes/test.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
const PORT = process.env.PORT || 8000

const app = express();

// mongodbConnect('mongodb://127.0.0.1:27017/Estate').then(()=> console.log("MongoDB connected"))
// .catch((err)=> console.log("Error : ",err));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/posts',postRoute);
app.use('/auth',authRoute);
app.use('/user',userRoute);
app.use("/test", testRoute);
app.use("/chats", chatRoute);
app.use("/messages", messageRoute);

app.listen(PORT, ()=> {
    console.log("Server is running !");
});