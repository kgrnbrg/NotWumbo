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
  consumer_key: 'pHMBtrm8FAwTn8JFOnpNuKXhQ',
  consumer_secret: '3oqag8Y7thKUnYwZNFLZafq4icfjLkkX6qDc6a9jCmzW11Xu3G',
  access_token_key: '48048511-XaXyMCD1iVU5zqC4uE55PT6Lp0XDSC0KWidi6dOU2',
  access_token_secret: '7MRphQrUVsb4KAHjfWdFEQscloNhJcPtCh0j7KE9bGJPV'
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

    var twitterData={};
    var numberOfFunctions = 6; 
    var counter = 0; 

    getTwitterData(req.body.user1,'user1'); 
    getTwitterData(req.body.user2,'user2'); 

   
    function getTwitterData(screenName,id){
        twitterData[id] = {};
        console.log(twitterData);
        twitterData[id]['screenName'] = screenName;

        twit.getUserTimeline({'screen_name':screenName},
                function (err, userTweets) {
                    if (err) {
                        console.log("error getting userTweets " + err);
                    }                
                   
                    var tweetArray = [];
                    for (var i = 0;i<userTweets.length;i++){
                        var tweetObj = {tweet: userTweets[i].text};
                        tweetArray.push(tweetObj);
                    }
                   
                    twitterData[id]['userTweets'] = tweetArray;
                    console.log(twitterData);
                    console.log("getting tweets finished for " + screenName);
                    counter++;
                    returnData(counter);
                })

          
            twit.getFriendsIds(screenName,
                function (err, friendsIds) {
                    if (err) {
                        console.log("error getting friend IDs " + err);
                    }
                    
                    var friendIdString;
                    for(var i=0;i<1;i++){
                        friendIdString += friendsIds[i] +",";
                    }
                  
                    twit.showUser(friendIdString,
                        function (err, friendObjects) {
                            
                            twitterData[id]['friends'] = friendObjects;
                            console.log(twitterData);
                            console.log("getting friends finished " + screenName);
                            counter++;
                            returnData(counter); 
                        })
               });

           
            twit.getFollowersIds(screenName,
                function (err, followerIds) {
                    if (err) {
                        console.log("error getting follower IDs " + err);
                    }
                  
                    var followerIdString;
                    for(var i=0;i<1;i++){
                        followerIdString += followerIds[i] +",";
                    }

                    
                    twit.showUser(followerIdString,
                        function (err, followerData) {
                          
                            twitterData[id]['followers'] = followerData;
                            console.log(twitterData);
                            console.log("getting followers finished " + screenName);
                            counter++;
                            returnData(counter); 
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