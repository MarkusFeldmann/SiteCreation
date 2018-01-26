module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', { user: req.user });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/login365', passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/',
        successRedirect: '/profile'
    }));

    app.post('/auth/azureOAuth/callback', passport.authenticate('azuread-openidconnect', { 
        failureRedirect: '/' 
    }),
    function (req, res) {
        //console.dir(passport.user.accessToken);
        res.redirect('/profile');
    });

}
    
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
};