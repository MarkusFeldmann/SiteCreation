var appSettings = require('../appSettings.js');
var utils = require('./models/utils.js');
var Key = require('./models/keys.js');
var bunyan = require('bunyan');
var rp = require('request-promise');
var mms = require('../config/process_query_template.js');

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

module.exports = function (app, passport, db) {

    app.get('/', function (req, res) {
        //if(req.user && (!passport.user)) { passport.user = req.user };    Moved to deserializeuser 
        res.render('index.ejs', { user: req.user });
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', { user: req.user });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/login365',
        function (req, res, next) {
            passport.authenticate('azuread-openidconnect',
                {
                    response: res,
                    resourceURL: appSettings.resources.discovery,
                    failureRedirect: '/'
                }
            )(req, res, next); 
        },
            function (req, res) {
                console.log('After Login');
                var bla = passport.user;
                res.redirect('/');
            }

            
        );
    app.post('/auth/azureOAuth/callback',
        function (req, res, next) {
            passport.authenticate('azuread-openidconnect',
                {
                    response: res,
                    failureRedirect: '/'
                }
            )(req, res, next);
        },
        function (req, res) {
            //console.dir(passport.user.accessToken);
            res.redirect('/');
        });

    // The following middleware checks for and obtain, if necessary, access_token for
    // accessing SharePoint site service. 
    // app.use('/site', function (req, res, next) { passport.getAccessToken(appSettings.resources.sharepoint, req, res, next); })


    //app.use('/keys', function(req, res, next) {
    //    utils.getKeysFromDatabase();
    //    next();
    //});

    //utils.getKeysFromMetadataUri(); 




    app.get('/keys', function (req, res, next) {

        //var keysCollection = new Key();

        utils.getKeysFromDatabase(renderKeys);

        function renderKeys(results) {
            if (!results) {
                results = { keys: { "nd": "not defined" } }
            };
            res.render('keys', { data: req.user, k: results });
        }
    });

    app.use('/terms', function (req, res, next) { passport.getAccessToken(appSettings.resources.sharepoint, req, res, next); })

    app.get('/terms', function (req, res, next) {
        if (!passport.user.getToken(appSettings.resources.sharepoint)) {
            return next('invalid token');
        }

        var postbody = mms('SiteProvisioning', 'Org');

        var fileUrl = 'https://dev4711.sharepoint.com/_vti_bin/client.svc/ProcessQuery';

        var formdigestopts = {
            method: 'POST',
            uri: 'https://dev4711.sharepoint.com/_api/contextinfo',
            qs: { access_token: passport.user.getToken(appSettings.resources.sharepoint).token },
            headers: {
                'accept': 'application/json; odata=verbose' }
        };

        var formDigest=''; 

        rp(formdigestopts).then(function(result){
            var r = JSON.parse(result);
            formDigest = r.d.GetContextWebInformation.FormDigestValue;
        }).then(function(){           
            
            var opts = {
                method: 'POST',
                uri: fileUrl,
                qs :{ access_token: passport.user.getToken(appSettings.resources.sharepoint).token },
    
                headers: {
                 'accept': 'application/json; odata=verbose',
                 'X-RequestDigest': formDigest
                },
                body: postbody
            };

            rp(opts).then(function(terms){
                // I got the Terms here,.....   YEAH
                var abc=0;
            });
        });

        /*rp(opts).then(function(parsedBody){
            console.log(parsedBody);
        }).catch(function(err){
            console.log("Err ", err);
        });*/
        
        //res.render('terms', {data: "blabla"});

    });



    // The following middleware checks for and obtain, if necessary, access_token for
    // accessing SharePoint site service. 
    app.use('/site', function (req, res, next) { passport.getAccessToken(appSettings.resources.sharepoint, req, res, next); })

    app.get('/site', function (req, res, next) {
        if (!passport.user.getToken(appSettings.resources.sharepoint)) {
            return next('invalid token');
        }

        var fileUrl = appSettings.apiEndpoints.sharePointSiteBaseUrl + '/lists';
        var opts = {
            auth: { 'bearer': passport.user.getToken(appSettings.resources.sharepoint).token },
            headers: { 'accept': 'application/json; odata=verbose' },  // verbose resource representation differs from the non-verbose one. Use verbose to make life a little easier. :)
            secureProtocol: 'TLSv1_method'  // required of Shareoint site and OneDrive,
        };

        require('request').get(fileUrl, opts, function (error, response, body) {
            if (error) {
                next(error);
            }
            else if (response.statusCode != 200) {
                next({ status: response.statusCode, msg: body });
            } else {
                data = { user: req.user, result: JSON.parse(body) };
                res.render('site', { data: data });
            }
        });
    });


    app.use('/discovery', function (req, res, next) { passport.getAccessToken(appSettings.resources.discovery, req, res, next); })

    app.get('/discovery', function (req, res, next) {
        if (!passport.user.getToken(appSettings.resources.discovery)) {
            return next('invalid token');
        }

        var fileUrl = appSettings.apiEndpoints.discoveryServiceBaseUrl + '/allservices';
        var opts = { auth: { 'bearer' : passport.user.getToken(appSettings.resources.discovery).token } };

        require('request').get(fileUrl, opts, function (error, response, body) {
            if (error) {
                next(error);
            }
            else {
                passport.user.setCapabilities(JSON.parse(body)['value']);
                data = { user: passport.user, capabilities: passport.user.capabilities };
                res.render('discovery', { data: data });
            }
        });


    })
}
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
};