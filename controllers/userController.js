import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import tweetModel from '../models/tweetModel.js';  
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';

dotenv.config();
export const Register = async (req, res) => {
    try {
      const { name, username, email, password } = req.body;
      if (!name || !username || !password || !email) {
        return res.status(400).json({ msg: "Please provide all required fields", success: false });
      }
  
      const check = await userModel.findOne({ email });
      if (check) {
        return res.status(400).json({ msg: "Email already exists", success: false });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
  
      const userCreated = await userModel.create({
        email,
        name,
        username,
        password: hashPassword,
      });
      const token = jwt.sign({ email: userCreated.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return res.status(201).cookie("token", token, { expiresIn: "1d", httpOnly: true }).json({ msg: "Account Created Successfully", success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server Error", success: false });
    }
  };

  // export const updateProfilePicture = async (req, res) => {
  //   try {
  //     const userId = req.params.id; 
  //     const { profilePicture, backgroundPicture } = req.body;
  
  //     if (!profilePicture && !backgroundPicture) {
  //       return res.status(400).json({
  //         message: "Please provide either a profile picture or background picture to update.",
  //         success: false,
  //       });
  //     }
  
  //     const updateData = {};
  //     if (profilePicture) updateData.profilePicture = profilePicture;
  //     if (backgroundPicture) updateData.backgroundPicture = backgroundPicture;
  
  //     const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
  //       new: true,
  //     });
  
  //     if (!updatedUser) {
  //       return res.status(404).json({
  //         message: "User not found.",
  //         success: false,
  //       });
  //     }
  
  //     return res.status(200).json({
  //       message: "Profile picture/background picture updated successfully.",
  //       user: updatedUser,
  //       success: true,
  //     });
  //   } catch (error) {
  //     console.error(error.message);
  //     return res.status(500).json({
  //       message: "Server Error.",
  //       success: false,
  //     });
  //   }
  // };


  export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required", success: false });
    }
    const users = await userModel.find({
      name: { $regex: query, $options: "i" }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found", success: false });
    }

    return res.status(200).json({ users, success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};
  
  export const Login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ msg: "Please provide email and password", success: false });
      }
      const check = await userModel.findOne({ email });
      const user=check;
      if (!check) {
        return res.status(400).json({ msg: "No user exists with this Email", success: false });
      }
  
      const isMatch = await bcrypt.compare(password, check.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Incorrect Password or Email", success: false });
      }
      const token = jwt.sign({ email: check.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return res.status(200).cookie("token", token, { expiresIn: "1d", httpOnly: true }).json({ msg: `Logged in as ${check.email}`,user, success: true });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ msg: "Server Error", success: false });
    }
  };
  
  export const Logout = async (req, res) => {
    try {
      return res.status(200).cookie("token", "", { expires: new Date(0), httpOnly: true }).json({ msg: "Logged out successfully", success: true });
    } catch (error) {
      console.log(error.message);
    }
  };
  export const updateProfile = async (req, res) => {
    try {
      const userId = req.params.id; // Get the user ID from the request
      const { name, username, description } = req.body; // Extract fields to update
  
      // Check if required fields are provided
      if (!name || !username || !description) {
        return res.status(400).json({
          message: "Please provide name, username, and description.",
          success: false,
        });
      }
  
      // Update user profile in userModel
      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { name, username, description },
        { new: true, runValidators: true } // Return the updated user and apply validation
      );
  
      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found.",
          success: false,
        });
      }
  
      // Update user details in all tweets where userID matches in tweetModel
      const updateTweets = await tweetModel.updateMany(
        { userID: userId }, // Find tweets where userID matches
        {
          $set: {
            "userDetails.0.name": name, // Assuming userDetails contains only one user object
            "userDetails.0.username": username,
            "userDetails.0.description": description,
          },
        }
      );
  
      if (updateTweets.matchedCount === 0) {
        console.log("No tweets found with this userID in tweetModel.");
      }
  
      return res.status(200).json({
        message: "Profile and tweet user details updated successfully.",
        user: updatedUser, // Send the updated user data
        success: true,
      });
    } catch (error) {
      console.error("Error updating profile:", error.message);
      return res.status(500).json({
        message: "Server Error.",
        success: false,
        error: error.message, // Include error message in the response for debugging
      });
    }
  };
  export const Bookmarks = async (req, res) => {
    try {
        const loggedInUserId = req.body.id;
        const tweetId = req.params.id;
        const user = await userModel.findById(loggedInUserId);
        if (user.bookmarks.includes(tweetId)) {
            // remove
            await userModel.findByIdAndUpdate(loggedInUserId, { $pull: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "Removed from bookmarks."
            });
        } else {
            // bookmark
            await userModel.findByIdAndUpdate(loggedInUserId, { $push: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "Saved to bookmarks."
            });
        }
    } catch (error) {
        console.log(error);
    }
};
  
  export const getMyProfile = async (req, res) => {
    try {
      const id = req.params.id;
      const profile = await userModel.findById(id).select('-password');
      return res.status(200).json({ profile });
    } catch (error) {
      console.log(error.message);
    }
  };
//   export const followUser = async (req, res) => {
//     try {
//         const willFollowId = req.body.id; // User who is following
//         const willFollowedId = req.params.id; // User being followed

//         const willFollow = await userModel.findById(willFollowId);
//         const willFollowed = await userModel.findById(willFollowedId);

//         if (!willFollow || !willFollowed) {
//             return res.status(404).json({
//                 message: "User(s) not found"
//             });
//         }

//         // Ensure IDs are compared as strings
//         if (!willFollow.following.includes(willFollowedId.toString())) {
//             willFollow.following.push(willFollowedId);
//             willFollowed.followers.push(willFollowId);

//             // Save both users simultaneously
//             await Promise.all([willFollow.save(), willFollowed.save()]);

//             return res.status(200).json({
//                 message: `${willFollow.name} followed ${willFollowed.name} just now!`
//             });
//         } else {
//             return res.status(400).json({
//                 message: `${willFollow.name} is already following ${willFollowed.name}`
//             });
//         }
//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).json({
//             message: "Server Error"
//         });
//     }
// };
 
// export const unfollowUser = async (req, res) => {
//     try {
//         const willFollowId = req.body.id; // User who is unfollowing
//         const willFollowedId = req.params.id; // User being unfollowed

//         const willFollow = await userModel.findById(willFollowId);
//         const willFollowed = await userModel.findById(willFollowedId);

//         if (!willFollow || !willFollowed) {
//             return res.status(404).json({
//                 message: "User(s) not found"
//             });
//         }

      
//         if (willFollow.following.includes(willFollowedId)) {
//             // Remove from followers and following lists
//             willFollow.following = willFollow.following.filter(id => id.toString() !== willFollowedId);
//             willFollowed.followers = willFollowed.followers.filter(id => id.toString() !== willFollowId);

//             await willFollow.save();
//             await willFollowed.save();

//             return res.status(200).json({
//                 message: `${willFollow.name} unfollowed ${willFollowed.name} just now!`
//             });
//         } else {
//             return res.status(400).json({
//                 message: `${willFollow.name} is not following ${willFollowed.name}`
//             });
//         }
//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).json({
//             message: "Server Error"
//         });
//     }
// };

export const follow = async(req,res)=>{
  try {
      const loggedInUserId = req.body.id; 
      const userId = req.params.id; 
      const loggedInUser = await userModel.findById(loggedInUserId);
      const user = await userModel.findById(userId);
      if(!user.followers.includes(loggedInUserId)){
          await user.updateOne({$push:{followers:loggedInUserId}});
          await loggedInUser.updateOne({$push:{following:userId}});
      }else{
          return res.status(400).json({
              message:`User already followed to ${user.name}`
          })
      };
      return res.status(200).json({
          message:`${loggedInUser.name} just follow to ${user.name}`,
          success:true
      })
  } catch (error) {
      console.log(error);
  }
}
export const unfollow = async (req,res) => {
  try {
      const loggedInUserId = req.body.id; 
      const userId = req.params.id; 
      const loggedInUser = await userModel.findById(loggedInUserId);
      const user = await userModel.findById(userId);
      if(loggedInUser.following.includes(userId)){
          await user.updateOne({$pull:{followers:loggedInUserId}});
          await loggedInUser.updateOne({$pull:{following:userId}});
      }else{
          return res.status(400).json({
              message:`User has not followed yet`
          })
      };
      return res.status(200).json({
          message:`${loggedInUser.name} unfollow to ${user.name}`,
          success:true
      })
  } catch (error) {
      console.log(error);
  }
}



export const getCombinedUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userModel.findById(userId).select('followers following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followerIds = user.followers.map(id => id.toString());
    const followingIds = user.following.map(id => id.toString());

    const allUsers = await userModel.find({ _id: { $ne: userId } });

    const followers = allUsers.filter(user => followerIds.includes(user._id.toString()));
    const otherUsers = allUsers.filter(user => 
      !followerIds.includes(user._id.toString()) && 
      !followingIds.includes(user._id.toString())
    );

    const whoToFollow = [...followers, ...otherUsers];

    return res.status(200).json({ whoToFollow });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
};
