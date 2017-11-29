(() => {
    const data = {
        name: 'rest_in_kirovograd',
        password: 'flashuuk19'
    };

    const getLiked = () => fetch('/medias', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    }).then(resp => resp.json()).then((data) => {
        const date = Object.entries(data).map(([key, value]) => [+key, value.posts.length]);

        Highcharts.stockChart('ct-chart', {
            rangeSelector: {
                selected: 1
            },

            title: {
                text: 'Subscribers'
            },

            series: [{
                name: 'Liked posts',
                data: date
            }]
        });
    });

    const terminateLike = () => fetch('/medias/like/terminate', {method: 'POST'});

    const sendLike = () => {
        isIntervalRunning().then(status => {
            if (status) {
                document.querySelector('.start-like').classList.add('disabled');
            } else {
                fetch('/medias/like', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify(data)
                })
            }
        });
    };

    const isIntervalRunning = () => fetch('/medias/like/is-running').then(data => data.json()).then(({status}) => status);

    document.querySelector('.request').addEventListener('click', getLiked);
    document.querySelector('.terminate-request').addEventListener('click', terminateLike);
    document.querySelector('.start-like').addEventListener('click', sendLike);

    getLiked();

    sendLike();

    setInterval(getLiked, 1000 * 60 * 5);
})();