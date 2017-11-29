(() => {
    const data = {
        name: 'rest_in_kirovograd',
        password: 'flashuuk19'
    };

    const getLiked = () => fetch('/medias/like', {
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

    const terminateLike = () => fetch('/medias/like/terminate');

    fetch('/medias', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    });

    document.querySelector('.request').addEventListener('click', getLiked);
    document.querySelector('.terminate-request').addEventListener('click', terminateLike);

    getLiked();

    setInterval(getLiked, 1000 * 60 * 5);
})();