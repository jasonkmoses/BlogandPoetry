//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
var session = require('client-sessions');
const passport = require('passport');
require('dotenv').config();
const aboutContent = "I built this website with the intentions of showing the world my Poetry. My students had always wanted me to upload my poetry to the web, in fact, there was a lot of people trying to convince me to place my work on the web. I do every poem with the taught of creating something people can relate to and enjoy. I created this website with the intentions of no profit returns but just to show what I love. Enjoy ❤️  ";
const contactContent = "This is the page whereby you can contact either the poet or the developer of the website by email, page or other deatils check below ↓";
const composeContent = "Ths is were you can read the poems";
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
var COOKIE_USER_SESSION_TIME = 10 * 50 * 60;
app.use(session({
  cookieName: 'session',
  secret: process.env.PASSWORD,
  duration: COOKIE_SESSION_TIME,
  activeDuration:  COOKIE_SESSION_TIME }));
app.use(session({
  cookieName: 'usersSession',
  secret: process.env.CLIENT_SECRET_GOOGLE,
  duration: COOKIE_USER_SESSION_TIME,
  activeDuration: COOKIE_USER_SESSION_TIME }));
mongoose.connect('database link', { useNewUrlParser: true });
//Below is code to give function to the comments
const commentSchema = {
  title: String,
  content: String,
  imageSource: String };
var userProfile;
app.use(passport.initialize());
app.use(passport.session());
//Google login code
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID_GOOGLE;
const GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET_GOOGLE;
const GOOGLE_CLIENT_CALLBACK_URL = process.env.GOOGLE_CLIENT_CALLBACK_URL;
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CLIENT_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    userProfile = profile;
    console.log("profile details: " + Object.entries(profile));
    return done(null, userProfile);
  }));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
app.get('/auth/google', passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
}));
app.get('/google/callback', passport.authenticate('google', {failureRedirect: '/'}),
  function(req, res) {
    req.usersSession.name = userProfile.name.givenName.concat(" ").concat(userProfile.name.familyName);
    req.usersSession.imageSource = userProfile.photos[0].value;
    console.log("user profile email address: " + req.usersSession.imageSource);
    res.redirect('/');
  });
//Facebook login code
const FacebookStrategy = require('passport-facebook').Strategy;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL;
passport.use(
  new FacebookStrategy({
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: FACEBOOK_CALLBACK_URL },
    function(accessToken, refreshToken, profile, done) {
      userProfile = profile;
      return done(null, userProfile); }));
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/' }),
  function(req, res) {
    req.usersSession.name = userProfile.displayName;
    req.usersSession.imageSource = "http://graph.facebook.com/" + userProfile.id  + "/picture";
    console.log("user profile image source: " + req.usersSession.imageSource);
    console.log("user profile username: " + req.usersSession.name);
    res.redirect('/'); });
const TwitterStrategy = require('passport-twitter').Strategy;
const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL;
passport.use(
  new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: TWITTER_CALLBACK_URL
  },
  function(token, tokenSecret, profile, done) {
    userProfile = profile;
    return done(null, userProfile); }));
app.get('/auth/twitter',
  passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    req.usersSession.name = userProfile.username;
    console.log("name: " + req.usersSession.name);
    req.usersSession.imageSource = userProfile.photos[0].value;
    console.log("url" + req.usersSession.imageSource);
    res.redirect('/');});
const Comment = mongoose.model("Comment", commentSchema);
app.get("/", function(req, res) {
  Comment.find({}, function(err, comments) {
    if (req.session && req.session.password) {
      if (req.session.password != process.env.PASSWORD) {
        req.session.reset();
        isAdminLogIn = false; } else { isAdminLogIn = true; }} else {
      isAdminLogIn = false;
    } if (req.usersSession && req.usersSession.name) {
        if (req.usersSession.name == null ||
        req.usersSession.name == undefined) {
        req.session.reset();
        isUserLoggedIn = false;  } else { isUserLoggedIn = true; }} else {
      isUserLoggedIn = false;  }
    res.render("home", {
      comments: comments,
      isAdminLogIn: isAdminLogIn,
      isUserLoggedIn: isUserLoggedIn
    });
  });
});
app.post("/", function(req, res) {
  if (req.session && req.session.password) {
    const comments = new Comment({
      title: "Admin",
      content: req.body.commentBody,
      imageSource: "https://instagram.fjnb7-1.fna.fbcdn.net/v/t51.2885-19/s320x320/101569172_621026371825784_4579835142255673344_n.jpg?_nc_ht=instagram.fjnb7-1.fna.fbcdn.net&_nc_ohc=tZmXz7L2pMYAX-lAdii&oh=de908a95a729be0f7a0a080a19c545fb&oe=5F987ACC"
    });
    comments.save(function(err) {
      if (!err) {
        res.redirect("/");
      }});}
  else {
  const comments = new Comment({
    title: req.usersSession.name,
    content: req.body.commentBody,
    imageSource: req.usersSession.imageSource
  });
  comments.save(function(err) {
    if (!err) {
      res.redirect("/");
    }});}
});
app.get("/auth", function(req, res) {
  res.render("auth");
});
app.post("/delete/:commentId", function(req, res) {
  const requestedCommentId = req.params.commentId;
  console.log(requestedCommentId);
  Comment.deleteOne({
    _id: requestedCommentId
  }, function(err) {
    if (!err) {
      console.log("no err deleted comments");
      res.redirect("/delete");
    }
    if (err) {
      console.log("err");
    }});
});
app.get("/comment/:commentId", function(req, res) {
  const requestedPostId = req.params.commentId;
  Comment.findOne({
    _id: requestedPostId
  }, function(err, comment) {
    res.render("comment", {
      title: comment.title,
      content: comment.content
    });
  });
});
app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});
//Below is to give function to the posts
const postSchema = {
  title: String,
  content: String
};
const Post = mongoose.model("Post", postSchema);
app.get("/poems", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("poems", {
      posts: posts
    });
  });
});
app.post("/poems", function(req, res) {
  const posts = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  posts.save(function(err) {
    if (!err) {
      console.log("saved");
      res.redirect("/poems");
    } else {
      console.log("error in /poems POST");
    }
  });
});
app.get("/Create", function(req, res) {
  if (req.session && req.session.password) {
    if (req.session.password != process.env.PASSWORD) {
      req.session.reset();
      res.redirect("/Login");
    } else {
      res.render("Create");
    }
  } else {
    res.redirect("/Login");
  }
});
app.get("/posts/:postId", function(req, res) {
  const requestedPostId = req.params.postId;
  console.log(requestedPostId);
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  Post.findOne({
    _id: requestedPostId
  }, function(err, post) {
    res.render("posts", {
      title: post.title,
      content: post.content
    });
  });
});
app.get("/delete", function(req, res) {
  if (req.session && req.session.password) {
    if (req.session.password != process.env.PASSWORD) {
      req.session.reset();
      res.redirect("/Login");
    } else {
      Post.find({}, function(err, posts) {
        Comment.find({}, function(err, comments) {
          res.render('delete', {
            posts: posts,
            comments: comments
          });
        });
      });
    }
  } else {
    res.redirect("/Login");
  }
});
app.post("/delete/:postId/:postId", function(req, res) {
  const requestedPostId = req.params.postId;
  console.log(requestedPostId);
  Post.deleteOne({
    _id: requestedPostId
  }, function(err) {
    if (!err) {
      console.log("no err deleted post");
      res.redirect("/delete");
    }});
});
//Below gives function to the Login and Admin
app.get("/Login", function(req, res) {
  console.log(process.env);
  res.render("Login", {
    Error: "Please enter the password"
  });
});
app.post("/Login", function(req, res) {
  if (req.body.password == process.env.PASSWORD) {
    req.session.password = process.env.PASSWORD;
    res.redirect('/Admin');
  } else {
    res.render('Login', {
      Error: 'Invalid password. please try again.'
    });
  }});
app.get("/Admin", function(req, res) {
  if (req.session && req.session.password) {
    if (req.session.password != process.env.PASSWORD) {
      res.redirect("/Login");
    } else {
      res.render('Admin');
    }} else {
    res.redirect("/Login");
  }});
app.get("/user/logOut", function (req, res) {
  req.logout();
  req.session.reset();
  req.usersSession.reset();
  res.redirect('/logOut');
  });
app.get("/logOut", function (req, res) {
  var con;
  if ((req.session && req.session.password) || (req.usersSession && req.usersSession.name)) {
       con = "Press the button to log out of your google, facebook, twitter or admin account";
       res.render("logOut", {content: con});
  } else {
      con = "You are not currently logged in to any of your accounts post a comment and log into your account via Twitter, Google or Facebook.";
      res.render("logOut", {content: con});
  }});
app.post("/logOut", function (req, res) {
res.redirect("/user/logOut");
});
app.get("/termsOfservice", function(req, res) {
  res.render('termsOfservice');
});
app.get("/Privacy_Policy", function(req, res) {
  res.render('Privacy_Policy');
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 2000; }
app.listen(port, function() {});
