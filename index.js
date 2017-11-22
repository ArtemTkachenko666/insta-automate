const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const Client = require('instagram-private-api').V1;

const Posts = {
    Liked: [],
    LikedTagged: [],
    TaggedMediaOwners: []
};

class ClientSession {
    constructor(name, password) {
        this.device = new Client.Device('new_device1');
        this.storage = new Client.CookieFileStorage(`${__dirname}/cookie.storage.json`);
        this.name = name;
        this.password = password;
    }

    getDate() {
        const HOURS = 2;
        const date = new Date();

        date.setHours(date.getHours() + HOURS);

        return date;
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

    getTaggedMedia() {
        return new Promise(resolve => {
            new Client.Feed.TagMedia(this.session, this.name)
                .get()
                .then((res) => resolve(res.filter(({account: {id}, _params: {hasLiked}}) => id !== this.accountParams.id && !hasLiked)));
        })
    }

    sendLikeToMedia(media) {
        return Client.Like.create(this.session, media.id);
    }

    sendLikeToMedias(medias) {
        return Promise.all(medias.map(media => this.sendLikeToMedia(media))).then(likedMedias => ({
            date: this.getDate(),
            posts: likedMedias
        }));
    }

    sendLikeToRecentMedia(followers) {
        const recent = {
            date: this.getDate(),
            posts: []
        };

        return Promise.all(followers.map(({id, _params: {isPrivate}}) => {
            if (!isPrivate) {
                let media = new Client.Feed.UserMedia(this.session, id);
                if (media) {
                    return media.get().then((list) => {
                        if (list && list[0]) {
                            const {params: {images, hasLiked, webLink, id, account}} = list[0];
                            if (!hasLiked) {
                                this.sendLikeToMedia(list[0]).then(() => {
                                    recent.posts.push({images, hasLiked, webLink, id, account});
                                });
                            }
                        }
                    });
                }
            }
        })).then(() => recent);
    }

    followUsers(ids) {
        return Promise.all(ids.map(id => Client.Relationship.create(this.session, id))).then(users => ({
            date: this.getDate(),
            users: users
        }));
    }

    getMediaOwners(medias) {
        return medias
            .map(({account: {_params: {id, friendshipStatus: {following}}}}) => !following && id)
            .filter(user => user);
    }

}

class Timer {
    constructor() {
        this.isRunning = false;
    }

    subscribe(callback, time) {
        this.isRunning = true;
        this.timer = setInterval(callback, time);
    }

    unsubscribe() {
        this.isRunning = false;
        clearInterval(this.timer)
    }
}

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/public/index.html');
});

const MINUTEST = 5;

const timer = new Timer();

app.post('/followers/recent/medias/like', (req, res) => {
    const {body} = req;

    const {name, password} = body;

    if (!timer.isRunning) {
        timer.subscribe(() => {
            const Session = new ClientSession(name, password);
            Session.create().then(() => {
                Session.getFollowers().then((followers) => {
                    Session.sendLikeToRecentMedia(followers).then((recent) => {
                        if (recent.posts.length > 0) {
                            Posts.Liked.push(recent)
                        }
                    })
                });

                Session.getTaggedMedia().then((medias) => {
                    Session.sendLikeToMedias(medias).then((likedMedias) => {
                        if (likedMedias.posts.length > 0) {
                            Posts.LikedTagged.push(likedMedias);
                        }
                    });

                    Session.followUsers(Session.getMediaOwners(medias)).then((followed) => {
                        if (followed.users.length > 0) {
                            Posts.TaggedMediaOwners.push(followed)
                        }
                    });
                });
            });
        }, 1000 * 60 * MINUTEST);
    }

    res.send('Liking is started');
});

app.get('/followers/recent/medias/liked', (request, response) => {
    response.send(JSON.stringify(Posts))
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
