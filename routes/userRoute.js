import express from 'express';
import { 
  Register, 
  Login, 
  Logout, 
  Bookmarks, 
  getMyProfile, 
  follow, 
  getCombinedUsers,
  unfollow ,
  updateProfile
} from '../controllers/userController.js';
import auth from '../config/auth.js';

const Router = express.Router();

Router.post('/register', Register);
Router.post('/login', Login);
Router.get('/logout', Logout);
Router.put('/bookmark/:id',auth, Bookmarks);
Router.get('/whoToFollow/:id', auth,getCombinedUsers );
Router.get('/profile/:id', auth, getMyProfile);
Router.post('/follow/:id',auth,  follow);
Router.post('/updateProfile/:id',auth,updateProfile);

Router.post('/unfollow/:id', auth, unfollow);

export default Router;
