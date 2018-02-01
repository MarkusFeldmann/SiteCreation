var appSettings = require('../appSettings.js');
var utils = require('./models/utils.js');

module.exports = function (app, passport, db) {

    app.get('/', function (req, res) {
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
                    //resourceURL: appSettings.resources.sharepoint,
                    resourceURL: appSettings.resources.discovery,
                    failureRedirect: '/'
                })(req, res, next),
                function (req, res) {
                    res.redirect('/');
                };
        });
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
        utils.getKeysFromDatabase(renderKeys);

        function renderKeys(results) {
            if (!results) { 
                results = { keys: { "nd": "not defined" }}
            };

            var a = results.keys[0];
            var b = results.keys[1];
            res.render('keys', { data: req.user, k: results });
        }
    });

    


    // The following middleware checks for and obtain, if necessary, access_token for
    // accessing SharePoint site service. 
    // app.use('/site', function (req, res, next) { passport.getAccessToken(appSettings.resources.sharepoint, req, res, next); })

    app.get('/site', function (req, res, next) {

        /*passport.authenticate('azuread-openidconnect',
            {
                response: res,
                resourceURL: 'https://graph.windows.net',
                failureRedirect: '/'
            })(req, res, next),
            function (req, res) {
                //res.redirect('/'); */


        var fileUrl = appSettings.apiEndpoints.sharePointSiteBaseUrl + '/lists';
        var opts = {
            auth: { 'bearer': req.user.accessToken },
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
        //};
    });
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
};