// Modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');

const app = express();
const upload = multer();

// Classes
const { MongoClient } = require('mongodb');
const OpenCage = require('./modules/OpenCage');
const isWithinRadius = require('./modules/isWithinRadius');
const router = require('./routes');

// Globals
const PORT = process.env.PORT || 8080;
var db;

// Express middleware.
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}))
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Make sure routes are set *after* sessions
app.use('/', router)

// The following routes are those that interact with the db.
// The simpler routes are in routes.js

// Map routes
app.post('/map/search-place', async (req, res) => {
    try {
        const { place, radius } = req.body

        // Find the coords of the place name input.
        const queryCoords = await OpenCage(place); 

        // Make sure coords were found
        if(queryCoords){
            // Get the battles from the DB.
            const battles = await db.collection('battles').find({}).toArray();
            const searchResults = []
            
            // Only grab the battles within the radius.
            battles.forEach(battle => {
                const withinRadius = isWithinRadius(battle.coords, queryCoords, radius)
                if(withinRadius){ 
                    searchResults.push(battle);
                }
            });

            res.json({
                status: 'good',
                place: queryCoords,
                battles: searchResults
            })
        } else {
            res.json({
                status: 'bad',
                reason: 'Couldn\'t find co-ordinates for that place.'
            })
        }
    } catch(error){
        // Return json response with error message
        res.json({ status: 'error', message: error.message });
    }
})

app.post('/map/search-battle', async (req, res) => {
    try {
        const regex = new RegExp(req.body.battle, 'i')
        const results = await db.collection('battles').find({
            name: { $regex: regex }
        })
        .toArray()

        if(results.length){
            res.json({ status: 'good', results })
        } else {
            res.json({ status: 'bad', reason: 'No battles found' })
        }
    } catch(error){
        // Return json response with error message
        res.json({ status: 'error', message: error.message });
    }
})

// Try to login
app.post('/login/attempt', async (req, res) => {
    try {
        // Use regex for case-insensitive string matching.
        const regex = new RegExp(req.body.username, 'i');
        const user = await db.collection('users').findOne(
            {
                username: { $regex: regex },
                password: req.body.password
            },
            { password: 0 }
        )
    
        if(user){
            req.session.username = user.username
            req.session.isLoggedIn = true
            res.json({ status: 'good' })
        } else {
            res.json({ status: 'bad', reason: "Found no user with those credentials. Try again" })
        }
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
});

// Insert missed battle
app.post('/missed-battle', async (req, res) => {
    try {
        const inserted = await db.collection('battles').insertOne(
            {
                name: req.body.name,
                article: req.body.article,
                year: parseInt(req.body.year),
                place: req.body.place,
                country: req.body.country,
                war: req.body.war,
                coords: {
                    lat: parseInt(req.body.lat),
                    lng: parseInt(req.body.lng),
                }
              }
        )

        if(inserted && inserted.insertedCount === 1){
            res.json({
                status: 'good'
            })
        } else {
            res.json({
                status: 'bad',
                reason: 'failed to insert entry'
            })
        }
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
});

app.get('/profile/edit', async (req, res) => {
    try {
        if(!req.session.isLoggedIn){
            res.redirect('/login')
            return;
        }

        const username = req.session.username
        const profile = await db.collection('users').findOne(
            // search for the user
            { username },
            // exclude their password
            { password: 0 }
        )
    
        if(profile){
            res.render('edit-profile', { profile, session })
        } else{
            res.redirect('/login')
        }
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
})

app.post('/profile/edit', async (req, res) => {
    try {
        const epithet = req.body.epithet
        const username = req.session.username

        const update = await db.collection('users').updateOne(
            // WHERE username = username
            { username },
            { $set: { epithet } }
        )

        if(update){
            res.json({ status: 'good' })
        } else {
            res.json({ status: 'bad', reason: 'Failed to update' })
        }
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
})

// Get profile with this username
app.get('/profile/:username', async (req, res) => {
    try {
        const regex = new RegExp(req.params.username, 'i');

        const results = await Promise.all([
            db.collection('users').findOne(
                // search for the user
                { username: { $regex: regex } },
                // exclude their password
                { password: 0 }
            ),
            db.collection('user_comments').find(
                // match the comments for the user
                { profile: { $regex: regex } },
                // exclude the profile field
                { profile: 0 }
            ).toArray()
        ])
    
        const [profile, comments] = results;
        const session = req.session.isLoggedIn ? req.session : null;
    
        if(profile){
            res.render('profile', { profile, comments, session })
        }
        else{
            res.render('profile', { session })
        }
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
})

// Insert a comment
app.post('/profile/add-comment', async (req, res) => {
    try {
        await db.collection('user_comments').insertOne({
            content: req.body.content,
            author: req.body.author,
            profile: req.body.profile,
            date: Date.now()
        });
    } catch(error){
        res.redirect('error', { message: error.message })
    }
    res.redirect(`/profile/${req.body.profile}`)
})

app.post('/profile/save-battle', async (req, res) => {
    if(!req.session.isLoggedIn){
        res.json({ status: 'bad', reason: 'not logged in' })
        return;
    }

    try {
        const name = req.body.name
        const article = req.body.article

        // Attempt to find the battle
        const user = await db.collection('users').findOne({
            username: req.session.username,
            'fave_battles.name': name
        })

        if(user){
            res.json({ status: 'bad', reason: 'already saved' })
            return;
        }

        // Save the battle to the list
        await db.collection('users').updateOne(
            { username: req.session.username },
            {
                $push: {
                    fave_battles: {
                        name,
                        article
                    }
                }
            }
        )

        res.json({ status: 'good' })
    } catch(error){
        res.json({ status: 'error', message: error.message })
    }
})

// Users search (from navbar)
app.post('/user-search', async (req, res) => {
    try {
        const regex = new RegExp('^' + req.body.term, 'i')
        const results = await db.collection('users')
            .find(
                { username: {$regex: regex} },
                { password: 0, epithet: 0 }
            )
            .toArray()
        res.json({status: 'success', results})
    } catch (error) {
        res.json({status: 'error', message: error.message})
    }
})

// Create an account
app.post('/signup', async (req,res) => {
    try {
        const { username, password } = req.body

        const regex = new RegExp(username, 'i')
        const find = await db.collection('users').findOne({ username: { $regex: regex } }, { password: 0 })

        if(find){
            res.json({ status: 'bad', reason: "A user with that name exists. Please choose another" })
            return;
        }

        const insert = await db.collection('users').insertOne({
            username,
            password,
            epithet: '',
            fave_battles: []
        })
        if(insert.insertedCount === 1){
            res.json({status:'good'})
        }
        else{
            res.json({status:'bad', message:'Failed to create account'})
        }
    }
    catch(error){
        res.json({status:'error', message: error.message})
    }
})

// 404 route
app.use((req, res, next) => {
    res.render('404', { session: req.session });
})

// Create database connection
MongoClient.connect('mongodb://localhost:27017/battlemap', (err, database) => {
    if(err) throw err;
    
    db = database;

    // If no errors, start the web server.
    app.listen(PORT, () => console.log(`Live at http://localhost:${PORT}`));
});