var bunyan = require('bunyan');
var passportad = require('passport-azure-ad');
var options = require('../appSettings.js').oauthOptions;
var User = require('../app/models/user');

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// First use this before using a DB
// var users = [];

module.exports = function (passport) {
    // DB version
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({ 'id': id }, function (err, user) {
            done(err, user);
        })
    }); 

    // Array based version
    /*passport.serializeUser(function(user, done) {
        done(null, user.oid);
      });
      
      passport.deserializeUser(function(oid, done) {
        findByOid(oid, function (err, user) {
          done(err, user);
        });
      });*/

    var findByOid = function (oid, fn) {
        for (var i = 0, len = users.length; i < len; i++) {
            var user = users[i];
            log.info('we are using user: ', user);
            if (user.oid === oid) {
                return fn(null, user);
            }
        }
        return fn(null, null);
    };

    //passport.use('azuread-openidconnect', new OIDCStrategy(options      // Seems this is the default name,...
    passport.use(new OIDCStrategy(options
        , function (iss, sub, profile, accessToken, refreshToken, done) {
            if (!profile.oid) {
                return done(new Error("No oid found"), null);
            }
            // asynchronous verification, for effect...
            process.nextTick(function () {
                // Array
                //findByOid(profile.oid, function (err, user) {
                // DB
                User.findOne({ 'id': profile.oid }, function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        // "Auto-registration"

                        //users.push(profile);
                        // This makes no sense, put it all into a DB to make it accessible
                        // map.push({oid: profile.oid, accesstoken: accessToken});

                        //Put the user to the array, instead of the DB
                        //users.push(profile);

                        var newUser = new User();

                        newUser.id = profile.oid;
                        newUser.displayName = profile.displayName;
                        newUser.email = profile.upn;
                        newUser.accessToken = accessToken;
                        newUser.refreshToken = refreshToken;

                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            // DB
                            return done(null, newUser);
                            
                            // Array
                            //return done(null, profile);

                        });
                    }
                    else {
                        return done(null, user);
                    }
                });
            });
        }));

        //Take care of refreshing tokens if necessary, this will be injected as a default route before any token baed actions
        passport.getAccessToken = function(resource, req, res, next) {
            if (passport.user.hasToken(resource)) {
                // already has access token for the exchange service, 
                // should also check for expiration, and other issues, ignore for now.
                // skip to the next middleware
                return next();
            } else {  /*
                var data = 'grant_type=refresh_token' 
                + '&refresh_token=' + passport.user.refresh_token 
                + '&client_id=' + appSettings.oauthOptions.clientId 
                + '&client_secret=' + encodeURIComponent(appSettings.oauthOptions.clientSecret) 
                + '&resource=' + encodeURIComponent(resource);
                var opts = {
                    url: appSettings.apiEndpoints.accessTokenRequestUrl,
                    body: data,
                    headers : { 'Content-Type' : 'application/x-www-form-urlencoded' }
                };
                require('request').post(opts, function (err, response, body) {
                    if (err) {
                        return next(err)
                    } else {
                        var token = JSON.parse(body);
                        passport.user.setToken(token);          // Change this to work
                        return next();
                    }
                }) */
            }
        }
}
