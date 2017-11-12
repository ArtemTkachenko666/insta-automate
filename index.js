var express = require('express');
var app = express();

const Client = require('instagram-private-api').V1;

class ClientSession {
    constructor() {
        this.device = new Client.Device('new_device1');
        this.storage = new Client.CookieFileStorage(`${__dirname}/cookie.storage.json`);
    }

    create() {
        return new Promise((resolve) => {
            Client.Session.create(this.device, this.storage, 'nikola_flamel', 'artem666')
                .then(session => this.session = session).then(() => Client.Account.searchForUser(this.session, 'nikola_flamel')
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
        let privateAccount = 0;

        return Promise.all(followers.map(({id, _params: {isPrivate}}) => {
            if (!isPrivate) {
                let media = new Client.Feed.UserMedia(this.session, id);
                if (media) {
                    return media.get().then((list) => {
                        if (list && list[0]) {
                            const {params: {hasLiked, webLink, id}} = list[0];
                            if (!hasLiked) {
                                ++count;

                                setTimeout(() => {
                                    Client.Like.create(this.session, id).then(() => {
                                        console.log('Done:', webLink, 'Time:', new Date());
                                    });
                                }, count * 1000)
                            }
                        }
                    });
                }
            } else {
                console.log('private:', ++privateAccount);
            }
        }));
    }
};


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
    console.log('index');
});

app.post('/followers/like', (req, res) => {
	const Session = new ClientSession();

	Session.create().then(() => Session.getFollowers().then((followers) => {
		Session.sendLikeToRecentMedia(followers)
	}));
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
