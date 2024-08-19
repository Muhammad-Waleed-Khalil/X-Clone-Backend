import express from 'express';
import { 
  createTweet, 
  deleteTweet, 
  likesOrDislikes, 
  getAllTweets, 
  followingTweets ,
  getBookmarkedTweets,
  getUserTweets
} from '../controllers/tweetController.js';
import auth from '../config/auth.js';

const Router = express.Router();

Router.post('/create', auth, createTweet);
Router.delete('/delete/:id', auth, deleteTweet);
Router.put('/like/:id', auth, likesOrDislikes);
Router.get('/alltweets/:id', auth, getAllTweets);
Router.get('/following/:id', auth, followingTweets);
Router.get('/bookmarks/:id',  getBookmarkedTweets);
Router.get('/user/:id',  getUserTweets);



export default Router;
