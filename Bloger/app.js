//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');


const homeStartingContent = "Welcome to the home page this is where you can view poems read comments and view copyright disclaimers and what engine we use to power our content. Social media platforms are also located at the bottom if your intersted in following my accounts.Contact details are found on the contact page also to create a comment.  ";
const aboutContent = "I built this website with the intentions of showing the world my Poetry. My students had always wanted me to upload my poetry to the web, in fact, there was a lot of people trying to convince me to place my work on the web. I do every poem with the taught of creating something people can relate to and enjoy. I created this website with the intentions of no profit returns but just to show what I love. Enjoy ❤️  ";
const contactContent = "This is the page whereby you can contact either the poet or the developer of the website by email, page or other deatils check below ↓";
const composeContent = "Tis is were you can read the poems";



const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("databaselink", {useNewUrlParser: true});

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });

  });

});

app.post("/", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  post.save(function(err){

    if (!err){
        res.redirect("/");
    }
  });

});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });


});
app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("started");
});
