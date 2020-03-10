const redis = require('redis');
const express = require('express');
const expHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');

// Create Redis Client
var client = redis.createClient();

// Init app
const app = express();

// We are setting our view engine, and default template is main.hbs
app.engine('hbs', expHandlebars({defaultLayout: 'html', extname: '.hbs'}));
app.set('view engine', 'hbs');

// body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', async (req, res, next) => {
    var characters = await getCharacters();

    res.render('index', {
        'characters': characters
    });
});

app.listen(3000);

app.use(express.static(__dirname + '/public'));

app.get('/add', (req, res, next) => {
    res.render('add');
});

app.post('/add', (req, res, next) => {
    var data = req.body;

    // key or create unique id based on name
    var id = req.body.key ? req.body.key : req.body.name + Date.now();

    client.hmset(id, data,
    (err, reply) => {
        if(err){
            console.log(err);
        }
        res.redirect('/');
    });
});

app.delete('/:id', (req, res, next) => {
    client.del(req.params.id);

    res.json([]);
});

app.get('/edit/:id', async (req, res, next) => {
    var hashkey = req.params.id;

    var inputs = await new Promise((resolve) => {
        client.hgetall(hashkey, (err, hash) => {
            hash['key'] = hashkey;
            switch (hash.gender) {
                case 'male':
                    hash['male'] = true;
                    break;
                case 'female':
                    hash['female'] = true;
                    break;
            }
            resolve(hash);
        });
    });

    res.render('add', {
        'inputs': inputs 
    });
});

const getCharacters = async (key = '') => {
    var patern = '*';

    if(key.length){
        patern = patern+key+'*';
    }

    var characters = [];
    var allKeys;
    await new Promise((resolve) => {
        client.keys(patern, (err, keys) => {
            if (err) return console.log(err);
            allKeys = keys;
            resolve();
        })
    });
    
    var allPromises = [];
    if(allKeys.length){
        allKeys.map((hashkey) => {
            allPromises.push(
                new Promise((resolve) => {
                    client.hgetall(hashkey, (err, hash) => {
                        hash['key'] = hashkey;
                        characters.push(hash);
                        resolve();
                    });
                })
            );
        });

        await Promise.all(allPromises);
    }

    return characters;
}
