//Call Express modules
var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorhandler = require('errorhandler'),
    jade = require('jade');

var config = require('./config.js');
var sys = require('util');
var oauth = require('oauth');
var app = express();

// slover setting up ntwitter module
var twitter = require('ntwitter');
var twit = new twitter({
  consumer_key: 'Hsp3IDyIEOU5CRbYpCtgHfgeY',
  consumer_secret: 'sKAImf2gkLlM5b2GntBjXWHBYlsCSjjnqde7CxHIelZ9ORhRdM',
  access_token_key: '81014526-21ZvRamEPAIqjLDu0DOQGpXJyp87fvlIvVKoCrKwI',
  access_token_secret: 'q0fIVyzgNTZBCtbVtP6UoeIUyKH0wLruxO53NihrMr8aG'
});

app.set('port', config.PORT || 3000)
app.set('views', __dirname + '/views');
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.use(morgan());
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
    secret: config.EXPRESS_SESSION_SECRET
}));
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(errorhandler({
    dumpExceptions: true,
    showStack: true
}));

app.get('/',function(req,res) {
    console.log("main route requested");

    // just render an HTML page initially, that's it
    res.render('index.html');
});

app.post ('/',function(req,res) {
    console.log("new twitter name requested: " + req.body.user1 + " & " + req.body.user2);

    var twitterData={}; // object to hold returned data
    var numberOfFunctions = 6; //a bit of a hack. the total number of functions with twitter we want to return before rendering data
    var counter = 0; // when the counter equals the numberOfFunctions, we know we can return

    // twitterData ={
    //     user1:{
    //         screenName: 'slover_sam',
    //         location: 'ATL!',
    //         tweet: 'YOLO!!',
    //         friend: 'snoop_lion',
    //         trend: '#getitgetit',
    //     },
    //     user2:{
    //         screenName: 'slover_sam',
    //         location: 'ATL!',
    //         tweet: 'YOLO!!',
    //         friend: 'snoop_lion',
    //         trend: '#getitgetit',
    //     }
    // }

    getTwitterData(req.body.user1,'user1'); // pass in the screenName and the id
    getTwitterData(req.body.user2,'user2'); // pass in the screenName and the id

    // function that takes in a screename, gets data, and returns the html and data object once it's done
    function getTwitterData(screenName,id){

        // first, create the object inside the object
        twitterData[id] = {};

        //add their screename
        twitterData[id]['screenName'] = screenName;

        //get the last 10 tweets of the user and choose a random one; we pass in the screenname as a param
        twit.getUserTimeline({'screen_name':screenName},
                function (err, userTweets) {
                    if (err) {
                        console.log("error getting userTweets. Twitter error >> " + err);
                    }                
                    //let's create an array of the tweets
                    var tweetArray = [];
                    for (var i = 0;i<userTweets.length;i++){
                        var tweetObj = {tweet: userTweets[i].text};
                        tweetArray.push(tweetObj);
                    }
                    //now, add that tweet array to the data object
                    twitterData[id]['userTweets'] = tweetArray;
                    console.log(twitterData);
                    console.log("getting tweets finished for " + screenName);
                    counter++;
                    returnData(counter); // check to see if we render html yet
                })

            //function to get all their friends
            twit.getFriendsIds(screenName,
                function (err, friendsIds) {
                    if (err) {
                        console.log("error getting friend IDs " + err);
                    }
                    // we need to create a string out of the first 100 to pass to twitter to get more info
                    // var friendIdString;
                    // for(var i=0;i<100;i++){
                    //     friendIdString += friendsIds[i] +",";
                    // }

                    var randomFriend = Math.floor((Math.random() * friendsIds.length) + 0);
                    // we are getting more information about these people
                    twit.showUser(randomFriend,
                        function (err, friendObjects) {
                            // now add the returned friends to the object
                            twitterData[id]['friends'] = friendObjects;
                            console.log(twitterData);
                            console.log("getting friends finished " + screenName);
                            counter++;
                            returnData(counter); // check to see if we render html yet
                        })
               });

            // function to get all their followers
            twit.getFollowersIds(screenName,
                function (err, followerIds) {
                    if (err) {
                        console.log("error getting follower IDs " + err);
                    }
                    // we need to create a string out of the first 100 to pass to twitter to get more info
                    // var followerIdString;
                    // for(var i=0;i<100;i++){
                    //     followerIdString += followerIds[i] +",";
                    // }
                    var randomFollower = Math.floor((Math.random() * followerIds.length) + 0);
                    // we are getting more information about these people
                    twit.showUser(randomFollower,
                        function (err, followerData) {
                            // now add the returned followers to the object
                            twitterData[id]['followers'] = followerData;
                            console.log(twitterData);
                            console.log("getting followers finished " + screenName);
                            counter++;
                            returnData(counter); // check to see if we render html yet
                        })
                });
        }

        // pass in the current count number and render data if it's ready
        function returnData(counter){
            if (counter == numberOfFunctions){
                console.log("we have all the data we need! rendering html!");
                res.render('data.html',twitterData);   
            }
            else {
                console.log("not all functions have returned yet; waiting still...");
                console.log("counter is " + counter);
            }
        }
});

app.listen(parseInt(config.PORT || 3000));