import mongoose from "mongoose";

async function mongodbConnect(url){
    return mongoose.connect(url);
}

export default mongodbConnect;