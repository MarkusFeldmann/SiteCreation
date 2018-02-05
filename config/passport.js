var bunyan = require('bunyan');
var passportad = require('passport-azure-ad');
var options = require('../appSettings.js').oauthOptions;
var appSettings = require('../appSettings.js');
var User = require('../app/models/user');

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

module.exports = function (passport) {
    // DB version
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({ 'id': id }, function (err, user) {
            //If there is a user found save it in passport IS THIS NEEDED ??? Does not the session set the user???
            //if(!passport.user && user != null) {
                // passport.user = user;
            //}
            done(err, user);
        })
    }); 

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
        , function (iss, sub, profile, jwtClaims, accessToken, refreshToken, done) {            
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

                        var newUser = new User();

                        newUser.id = profile.oid;
                        newUser.displayName = profile.displayName;
                        newUser.email = profile.upn;
                        //newUser.accessToken = accessToken;
                        newUser.refreshToken = refreshToken.refresh_token;
                        newUser.name = profile.name;
                        newUser.upn = profile.upn;
                        
                        //Set expiration of the accessToken in DB, for Diagnosis in Test as well
                        var exp = refreshToken.expires_on;
                        var date = new Date(exp * 1000);
                        var resourceName = "default";
                        if(refreshToken.resource) {
                            resourceName = refreshToken.resource;
                        }

                        newUser.tokens.push( 
                            { 
                                resource: resourceName, 
                                token: refreshToken.access_token,
                                expiresDate: date,
                                expires: exp
                            }
                        );
                        

                        newUser.save(function (err) {
                            if (err)
                                throw err;

                            passport.user = newUser;
                            return done(null, newUser);
                        });
                    }
                    else {
                        passport.user = user;
                        return done(null, user);
                    }
                });
            });
        }));

        //Take care of refreshing tokens if necessary, this will be injected as a default route before any token baed actions
        passport.getAccessToken = function(resource, req, res, next) {
            if (passport.user.hasToken(resource)) {
                // already has access token for the exchange service, 
                // check for expiration
                
                return next();
            } else {  
                
            var data = 'grant_type=refresh_token' 
            + '&refresh_token=' + passport.user.refreshToken 
            + '&client_id=' + appSettings.oauthOptions.clientID 
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
                    var bla = passport;
                    passport.user.setToken(token, resource);
                    return next();
                }
            });


            }
        }
}
