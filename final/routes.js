const {Router} = require('express')
const router = Router();

// Home
router.get('/', (req, res) => {
    res.render('home', {session: req.session});
});

// Map
router.get('/map', (req, res) => {
    res.render('map', {session: req.session});
});

router.get('/map-data/', (req, res) => {
    const json = require('./public/json/europe.json');
    res.json(json);
})

// About
router.get('/about', (req, res) => {
    res.render('about', {session: req.session})
});

// Login
router.get('/login', (req, res) => {
    console.log(req.session)

    if(req.session.isLoggedIn){
        res.redirect(`/profile/${req.session.username}`)
    } else {
        res.render('login', {session: req.session})
    }
});

// Signup
router.get('/signup', (req, res) => {
    if(req.session.isLoggedIn){
        res.redirect('/')
    }

    res.render('signup', {session: req.session})
});

// Logout
router.get('/logout', (req, res) => {
    if(req.session.isLoggedIn){
        delete req.session.isLoggedIn
        delete req.session.username
    }

    res.redirect('/login')
});

// Profiles
router.get('/profile', (req, res) => {
    // Redirect to home page if no profile was specified.
    res.redirect('/')
})

router.get('/profile/me', (req, res) => {
    if(req.session.isLoggedIn){
        res.redirect('/profile/' + req.session.username);
    } else {
        res.redirect('/login');
    }
});

// Missed battle
router.get('/missed-battle', (req, res) => {
    if(req.session.isLoggedIn){
        res.render('missed-battle', { session: req.session });
    } else {
        res.redirect('/login');
    }
});

module.exports = router;