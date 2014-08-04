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

var twitter = require('ntwitter');
var twit = new twitter({
  consumer_key: 'Ya3bYM1H0DEa7ywx22Qx2QlHH',
  consumer_secret: 'Z0r2jInI8i6B6f6VudgcLYbFJyEiBb9qG7h4IEOAqtPwQcPKHJ',
  access_token_key: '2645854584-7BKWD1xPxrojx3SV7aIbxNuAMoB67HU44GCBnGx',
  access_token_secret: '7ZPuOEHJdce75QMNrlQKZnDkZvZtcrP731tLYyqFmeCEj'
});

app.set('port', config.PORT || 3000)
console.log("Commence");
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

app.get ('/start',function(req,res){
    console.log("stage two");
    res.render('input.html');
});

app.get ('/narrative',function(req,res){
    console.log("narrative");
    res.render('WumbNarr.html');
});

app.get ('/movies',function(req,res){
    console.log("movie");
    res.render('movies.html');
});
app.get ('/vg',function(req,res){
    console.log("vg");
    res.render('videogames.html');
});
app.get ('/sports',function(req,res){
    console.log("sports");
    res.render('sports.html');
});
app.get ('/justice',function(req,res){
    console.log("justice");
    res.render('data.html');
});

app.post ('/wumbo',function(req,res) {
    console.log("new twitter name requested: " + req.body.user1 + " & " + req.body.user2);

    var twitterData={}; // object to hold returned data
    var numberOfFunctions = 6; //a bit of a hack. the total number of functions with twitter we want to return before rendering data
    var counter = 0; // when the counter equals the numberOfFunctions, we know we can return

    // twitterData ={
    //     user1:{
    //         screenName: 'the_Greenberg',
    //         location: 'NYC',
    //         followerCount: '100000',
    //         tweet1: 'EVERYDAY IM HUSTLING!!',
    //         tweet2: 'BOOYA!!'
    //         friend: 'Snoop Lion',
    //         friendScreeName : 'snoop_lion',
    //         trend: '#getitgetit',
    //     },
    //     user2:{
    //         screenName: 'slover_sam',
    //         location: 'ATL!',
    //         followerCount: '41231',
    //         tweet1: 'YOLO!!',
    //         tweet2: 'YoloAgain!!'
    //         friend: 'Snoop Lion',
    //         friendScreeName : 'snoop_lion',
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

        //get the location of the user; pass in the screenName, and pull out the location and the follower count from the returned data
        twit.showUser(screenName,
            function (err, data) {
                if (err) {
                    console.log("error getting showUser. Twitter error >> " + err);
                }
                // now add the returned data to the object for that user
                twitterData[id]['location'] = data[0].location;
                twitterData[id]['followerCount'] = data[0].followers_count;
                counter++;
                returnData(counter); // check to see if we render html yet
            })

        //get the last 10 tweets of the user and choose a random one; we pass in the screenname as a param
        twit.getUserTimeline({'screen_name':screenName},
                function (err, userTweets) {
                    if (err) {
                        console.log("error getting userTweets. Twitter error >> " + err);
                    }                
                    //let's pull out a random tweet
                    // need a random number between 0 and the userTweets.length
                    var ran = getRanNum(userTweets.length, 0);
                    var tweet = userTweets[ran].text;
                    //now, add that tweet to the data object of that user
                    twitterData[id]['tweet1'] = tweet;

                    //now, get another one, but make sure it's not the same as the first
                    var ran2 = getRanNum(userTweets.length, 0);
                    // if the random number is duplicated, get a new one
                    if (checkForDuplicate(ran,ran2)) ran2 = getRanNum(userTweets.length, 0);
                    // if the random number is fresh, then add the 2nd tweet
                    else {
                        var tweet2 = userTweets[ran2].text;
                        //now, add that tweet to the data object of that user
                        twitterData[id]['tweet2'] = tweet2;
                    }

                    function getRanNum(max,min) {
                        return Math.floor((Math.random() * max) + min);
                    }

                    function checkForDuplicate(num1,num2) {
                        if (num1==num2) return true;
                        else return false;
                    }

                    counter++;
                    returnData(counter); // check to see if we render html yet
                })

        // function to get all their friends and then pick one at random; takes a screen name, and we are ultimately getting their screen name and real name
        twit.getFriendsIds(screenName,
            function (err, friendIds) {
                if (err) {
                    console.log("error getting friend IDs. Twitter error >>  " + err);
                }

                //let's pull out a random friend
                //need a random number between 0 and the friendIds.length
                var ran = Math.floor((Math.random() * friendIds.length) + 0);
                var ranFriend = friendIds[ran];

                // we are getting more information about these people
                twit.showUser(ranFriend,
                    function (err, data) {
                        // now add the returned friend to the object
                        twitterData[id]['friend'] = data[0].name;
                        twitterData[id]['friendScreenName'] = data[0].screen_name;
                        counter++;
                        returnData(counter); // check to see if we render html yet
                    })
            })

        // twit.getTrendsNew(function (err, data) {
        //         if (err) {
        //             console.log("error getting trends. Twitter error >>  " + err);
        //         }               
        //         console.log(data);
        //   })        
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