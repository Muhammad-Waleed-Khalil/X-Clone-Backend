import tweetModel from "../models/tweetModel.js";
import userModel from "../models/userModel.js";

export const createTweet = async (req, res) => {
  try {
    const { description, id } = req.body;
    if (!description || !id) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    const user =await userModel.findById(id).select("-password");
    await tweetModel.create({
      description,
      userID: id,
      userDetails: user
    });

    return res.status(201).json({ msg: "Tweet created successfully", success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const getUserTweets = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the user to ensure the user exists
    const user = await userModel.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Fetch the tweets of the user
    const userTweets = await tweetModel.find({ userID: id }).sort({ createdAt: -1 });

    // Return the tweets
    return res.status(200).json({ tweets: userTweets });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const deleteTweet = async (req, res) => {
  try {
    const { id } = req.params;
    await tweetModel.findOneAndDelete({ _id: id });
    return res.status(200).json({ message: "Tweet deleted successfully", success: true });
  } catch (error) {
    console.log(error.message);
  }
};

export const likesOrDislikes = async (req, res) => {
  try {
    const id = req.body.id;
    const _id = req.params.id;
    const tweet = await tweetModel.findById({ _id });
    if (tweet.likes.includes(id)) {
      tweet.likes.pop(id);
      await tweet.save();
      res.status(200).json({ message: "Disliked successfully" ,success: true });
    } else {
      tweet.likes.push(id);
      await tweet.save();
      res.status(200).json({ message: "Liked successfully" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const getAllTweets = async (req, res) => {
  try {
    const id = req.params.id;
    const userdata = await userModel.findById({ _id: id });

    if (!userdata) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userTweets = await tweetModel.find({ userID: id });
    const userFollowingTweets = await Promise.all(
      userdata.following.map((otherUserId) => tweetModel.find({ userID: otherUserId }))
    );
    const userFollowersTweets = await Promise.all(
      userdata.followers.map((followerId) => tweetModel.find({ userID: followerId }))
    );

    const allTweets = [
      ...userTweets,
      ...userFollowingTweets.flat(),
      ...userFollowersTweets.flat(),
    ];

    const uniqueTweetMap = new Map();
    allTweets.forEach((tweet) => {
      if (!uniqueTweetMap.has(tweet._id.toString())) {
        uniqueTweetMap.set(tweet._id.toString(), tweet);
      }
    });

    const uniqueTweets = Array.from(uniqueTweetMap.values());
    const tweets = uniqueTweets.sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json({ tweets: uniqueTweets });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const followingTweets = async (req, res) => {
  try {
    const id = req.params.id;
    const userdata = await userModel.findById({ _id: id });

    if (!userdata) {
      return res.status(404).json({ msg: "Not available" });
    }

    const followingTweets = await Promise.all(
      userdata.following.map((followingId) => tweetModel.find({ userID: followingId }))
    );

    const allFollowingTweets = followingTweets.flat();
    const tweets = allFollowingTweets.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ tweets });
  } catch (error) {
    console.log(error.message);
  }
};

export const getBookmarkedTweets = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("User ID received:", req.params.id);


    // Fetch the user to get their bookmarks array
    const user = await userModel.findById(id).select("bookmarks");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Fetch the bookmarked tweets using the tweet IDs from the bookmarks array
    const bookmarkedTweets = await tweetModel.find({
      _id: { $in: user.bookmarks },
    });

    if (!bookmarkedTweets.length) {
      return res.status(200).json({ msg: "No bookmarked tweets found", tweets: [] });
    }

    // Sort the tweets by creation date (newest first)
    const sortedTweets = bookmarkedTweets.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ tweets: sortedTweets });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { tweetId, comment, userId } = req.body;

    if (!comment || !userId || !tweetId) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const tweet = await tweetModel.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ msg: "Tweet not found" });
    }

    tweet.comments.push({
      comment,
      userID: userId,
      userDetails: user,
    });

    await tweet.save();
    return res.status(201).json({ msg: "Comment added successfully", success: true, tweet });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
