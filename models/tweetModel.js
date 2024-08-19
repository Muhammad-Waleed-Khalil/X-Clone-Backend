import mongoose from 'mongoose';

const tweetSchema = new mongoose.Schema({
  description: { type: String, required: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  userDetails:{
    type:Array,
    default:[]
  }
}, { timestamps: true });

const Tweet = mongoose.model('Tweet', tweetSchema);

export default Tweet;
