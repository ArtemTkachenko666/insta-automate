const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const Client = require('instagram-private-api').V1;
let LikedPosts = [];

class ClientSession {
    constructor(name, password) {
        this.device = new Client.Device('new_device1');
        this.storage = new Client.CookieFileStorage(`${__dirname}/cookie.storage.json`);
        this.name = name;
        this.password = password;
    }

    create() {
        return new Promise((resolve) => {
            Client.Session.create(this.device, this.storage, this.name, this.password)
                .then(session => this.session = session).then(() => Client.Account.searchForUser(this.session, this.name)
                .then(({_params}) => {
                    this.accountParams = _params;
                    resolve();
                }))
        });
    }

    getFollowers() {
        return new Client.Feed.AccountFollowers(this.session, this.accountParams.id).all();
    }

    sendLikeToRecentMedia(followers) {
        let count = 0;
        return Promise.all(followers.map(({id, _params: {isPrivate}}) => {
            if (!isPrivate) {
                let media = new Client.Feed.UserMedia(this.session, id);
                if (media) {
                    return media.get().then((list) => {
                        if (list && list[0]) {
                            const {params: {images, hasLiked, webLink, id, account}} = list[0];
                            if (!hasLiked) {
                                ++count;
                                setTimeout(() => {
                                    Client.Like.create(this.session, id).then(() => {
                                        LikedPosts.push({images, hasLiked, webLink, id, account});
                                    });
                                }, count * 1000)
                            }
                        }
                    });
                }
            }
        }));
    }
}

class Timer {
    subscribe(callback, time) {
        this.timer = setInterval(callback, time);
    }

    unsubscribe() {
        clearInterval(this.timer)
    }
}

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/public/index.html');
});

const MINUTEST = 15;

app.post('/followers/recent/medias/like', (req, res) => {
    const {body} = req;

    const {name, password} = body;

    const timer = new Timer();

    timer.subscribe(() => {
        const Session = new ClientSession(name, password);
        Session.create().then(() => Session.getFollowers().then((followers) => {
            console.log('/************ Send like **************/');
            Session.sendLikeToRecentMedia(followers).then(() => {
                console.log('Check run at:', new Date());
                if (LikedPosts.length) {
                    console.log('Count:', LikedPosts.length);
                    console.log('Posts:');
                    LikedPosts.map(like => console.log(like.webLink));
                    LikedPosts = [];
                } else {
                    console.log('There is no posts');
                }

                console.log('/**************************/')
            })
        }));
    }, 60 * 1000 * MINUTEST);

    res.send('Liking is started');
});

app.get('/followers/recent/medias/liked', (request, response) => {
    const {size} = request.body;
    response.send(LikedPosts.slice(size, LikedPosts.length))
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
