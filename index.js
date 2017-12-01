const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const admin = require("firebase-admin");

const Client = require('instagram-private-api').V1;

admin.initializeApp({
    credential: admin.credential.cert({
            "type": "service_account",
            "project_id": "insta-automate",
            "private_key_id": "0d636784facb4664e0e72f6ff8bfcf3d5dc9f467",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDN9n/6uRnbNf8O\nGTKlHDMKXA37Gyin4wO8JE+FwBw4EvCxnEAI394ElAlV40z3lzegrVmpDVX3QTPS\ntWLm6CUpC52lEbmiLfBMXt+vXprzbreE201VivlpxoDFtxnY4Spay9ltpZ2AfYFV\ni2rGRotoqWigtlpmSk+AafXW5ZoyFXG/TBIfXd7yJRw0cH8O9XrDRuZ935WlSBxr\nKrECAqtp4Sdp6hXSLLsYgpGpWaWL/OmCvw8zfpE5Nl4e+XvNSnLmWrPfLwvzplDg\nYNGHUD760MApEe67wAQ2a+NW1GdmToucnYdVWC4R3li0AgetjdPH/ywgCu51aMiH\n1NmWspmlAgMBAAECggEAJvMlnzrnlKDYv+gMf5R+Y4hmnXT0opFIKMmeH09mFsWg\nLpp7sqHxeOCtBkjSyqTWgISf5twuhHCYdhHW5w+CTYmUkb2xIyY4Yhz0BNRpjb1D\np/SYIqQCSFphimJ22SC1049m6jkueLjjX1PbCK2ZGh0le/UYUe1eLQz80JvBphQ4\nq9zgqOd4kDXdRYiwgUDQSm4o76MftzryuAIeg47so+HcmL5wsFB0rikYqo7xGq1k\nBiP88KeKg7AdazgDxD3z66cQI2PoE0gq/lUmZZF8IkxnTT+zxe7ZxFEfz69sB0bL\nxVqk2RMDMNFmx+WEE/7xSTiPfKGR9LUhuNE9jocicQKBgQDwFHOuYUY1FvYVT/QJ\n6pj7ukxdHdUgE+adk9GaNvxD23mwD4ZZN79+Sx342MGF2fFjyEmB8gpUjOmtFRnt\nWcG974anh3IFg8WTyQL1qxxP+Ftfs0FKbJSZsjd9Xa3axhuBbj/v1slOX4geOC2S\n6CN2784g3Ij5HA+1Fgd5fBHelQKBgQDbnuJ6ufQVvy/CtJYxkYpDTfA02K8D0MT3\n9hJECmR18mXTFRGYmGZEMH9ylVTHMwtZChS8yU+xnXC9DZ+l/kx8xL0n5J+7KLg2\nPcnHinihQEJa/7OBtqq88bZi6Opn/TBw/Ggckt7eDDUS/+U/6HupOwgbA8i2Vq/O\nFDpl6w3a0QKBgFo2NSnHX4w/boSfoIHBZ27fmCY9OYJuN+/qRY5/LteItvcTPlZz\n/j7ElySUvlM/i9cEwapUetE+iegBz9ZCLezi/mQhHxU3aJyZocUSYPcjyaHyR4xh\ntIz0TKmM8/ELE/bUqK3Etav/dbR1Q5q6I+ljPr9WXxnME5LmDjT2C/jpAoGBAIay\nfQ9ua3DHEMDnR1Lhg55h99hBqZ26doPqTSukABeC8saynlcr6VUbNZ+OTS/bc7NJ\nhox/H7y85j9dUrRZMoo3lBgalYkRoWHLJa2XlQK5SblMKMl+wlseGJGzbskWtZYm\niKg1wDEJ5adggTdgHDAf/4mqGXkT08GeEG8f6iBxAoGAJRQDWc8eHcTD4RX4dQp3\n4Bukp4OtwKH/nMYhcat7C/KBn2sk3iWw2dm+7cJKH4mwORw8d48Ku9UqlhzeWefS\nUrVZxeJFKZO96vS8qAEN0I8qo0DiPcNLKK0JN8mbXl55OFr9Cb6tpLvGBKmXWJxf\nP4Z84m+dh3osWmvhEbzICwg=\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-x55o2@insta-automate.iam.gserviceaccount.com",
            "client_id": "114059861735698165325",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://accounts.google.com/o/oauth2/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x55o2%40insta-automate.iam.gserviceaccount.com"
        }
    ),
    databaseURL: "https://insta-automate.firebaseio.com"
});

const db = admin.database();

class ClientSession {
    constructor(name, password) {
        this.device = new Client.Device('new_device1');
        this.storage = new Client.CookieFileStorage(`${__dirname}/cookie.storage.json`);
        this.name = name;
        this.password = password;
    }

    static getDate() {
        const HOURS = 2;
        const date = new Date();

        date.setHours(date.getHours() + HOURS);

        return Date.parse(date);
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
            date: ClientSession.getDate(),
            likedMedias
        }));
    }

    sendLikeToRecentMedia(followers) {
        const posts = [];

        return Promise.all(followers.map(({id, _params: {isPrivate}}) => {
            if (!isPrivate) {
                let media = new Client.Feed.UserMedia(this.session, id);
                if (media) {
                    return media.get().then((list) => {
                        if (list && list[0]) {
                            const {params: {images, hasLiked, webLink, id, account}} = list[0];
                            if (!hasLiked) {
                                this.sendLikeToMedia(list[0]).then(() => {
                                    posts.push({images, hasLiked, webLink, id, account});
                                });
                            }
                        }
                    });
                }
            }
        })).then(() => ({
            date: ClientSession.getDate(),
            posts
        }));
    }

    followUsers(ids) {
        return Promise.all(ids.map(id => Client.Relationship.create(this.session, id))).then(users => ({
            date: ClientSession.getDate(),
            users
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

const MINUTEST = 10;

const timer = new Timer();

const STATUS = {
    STARTED: 'STARTED',
    FINISHED: 'FINISHED'
};

app.post('/medias/like', (req, res) => {
    const {body} = req;

    const {name, password} = body;

    if (!timer.isRunning) {
        timer.subscribe(() => {
            const Session = new ClientSession(name, password);
            Session.create().then(() => {
                Session.getFollowers().then((followers) => {
                    Session.sendLikeToRecentMedia(followers).then(({date, posts}) => {
                        if (posts.length > 0) {
                            console.log('*************LIKED POSTS**********');
                            console.log(posts);
                            db.ref('/posts/liked').child(date).set({posts});
                        }
                    })
                });

                Session.getTaggedMedia().then((medias) => {
                    Session.sendLikeToMedias(medias).then(({date, likedMedias}) => {
                        if (likedMedias.length > 0) {
                            console.log('**********LIKED TAGGED MEDIAS*********');
                            console.log(likedMedias);
                            db.ref('/posts/likedTagged').child(date).set({likedMedias});
                        }
                    });

                    Session.followUsers(Session.getMediaOwners(medias)).then(({date, users}) => {
                        if (users.length > 0) {
                            console.log('**********SUBSCRIBE TO USER**********');
                            console.log(users);
                            db.ref('/posts/taggedMediaOwners').child(date).set({users});
                        }
                    });
                });
            });
        }, 1000 * 60 * MINUTEST);
    }

    res.send(JSON.stringify({status: STATUS.STARTED}));
});

app.post('/medias/like/terminate', (req, res) => {
    timer.unsubscribe();

    res.send(JSON.stringify({status: STATUS.FINISHED}));
});

app.get('/medias', (request, response) => {
    db.ref('/posts/liked')
        .once('value')
        .then(data => response.send(JSON.stringify(data.val())))
});

app.get('/medias/like/is-running', (req, res) => {
    res.send(JSON.stringify({status: timer.isRunning}))
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
