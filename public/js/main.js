(() => {
    const data = {
        name: 'rest_in_kirovograd',
        password: 'flashuuk19'
    };

    const getLiked = () => fetch('/followers/recent/medias/liked', {
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


    fetch('/followers/recent/medias/like', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    });

    document.querySelector('.request').addEventListener('click', getLiked);

    getLiked();

    setInterval(getLiked, 1000 * 60 * 5);
})();