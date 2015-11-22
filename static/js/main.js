function initialize() {
    'use strict';

    // create map instance
    var mapCenter = new google.maps.LatLng(37.7833, -122.4167);

    var map = new google.maps.Map(document.getElementById('map-canvas'), { 
        center: mapCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var Marker = Backbone.Model.extend({});
    var Markers = Backbone.Collection.extend({
        model: Marker
    });     
    var allMarkers = new Markers();
    var allFilters = new Markers();

    var MarkerView = Backbone.View.extend({
        el: document.body,
        events: {
            'click #go': 'showFilter',
            // 'click #reset': 'showAll'
        },
        initialize: function() {
            _.bindAll(this, 'showFilter', 'showAll', 'render');
            // this.showAll();

            // create drawer effect on navbox
            $('#cue').on('click', function() {
                $('#nav-box').toggleClass('active');
            });

        },
        showFilter: function() {
            var filter_options = {};
            var title_query = $('#by-title').val();
            if (title_query !== '') {
                filter_options.title = title_query;
            }
            var match_filters = this.collection.where(filter_options);

            if (match_filters.length > 0) {
                allFilters.reset(match_filters);
                this.render(allFilters.models);
                $('#nav-box').addClass('active');  // close drawer
            } else {
                $('#user-message').text('No results found');
                allFilters.reset(match_filters);    // if not found, clear map
                this.render(allFilters.models);
            }
        },
        showAll: function() {
            map.setCenter(mapCenter);
            map.setZoom(13);
            this.render(this.collection.models);
        },
        render: function(models) {
            $('.filter').val(''); 
            $('input').typeahead('setQuery', '');
            _.each(allMarkers.models, function(el) {
                el.attributes.mapMarker.setVisible(false);  // clear map
            });
            _.each(models, function(el) {
                el.attributes.mapMarker.setVisible(true);  // show markers 
            });

            return this;
        }
    });


    function loadAutocomplete(masterCollection) {

        var titles = _.uniq(masterCollection.pluck('title'), true);

        $("#by-title").typeahead({ 
            name: 'titles',
            local: titles
        });

        $('.typeahead').on('keypress', function(e) {
            var key = e.which;
            if (key === 13) this.close();  // select from dropdown on pressing 'enter'
        });
    }

    function setMarkers(data) {
        var SCENES = data.length;

        for (var i = 0; i < SCENES; i++) {
            var scene = data[i];

            // Backbone.Model marker
            var newMarker = new Marker({
                title: scene['title'],
                id: i,
                year: scene['release_year'],
                director: scene['director'],
                mapMarker: new google.maps.Marker({
                    map: map,
                    position: new google.maps.LatLng(scene['latlong'][0], scene['latlong'][1]),
                    icon: 'static/images/marker.png',
                    title: scene['title'],
                    visible: false,
                    zIndex: i
                }),
                infoWindow: new google.maps.InfoWindow({
                    content: "<div class='content'>" +
                            "<div id='siteNotice'>" + "</div>" +
                            "<h1 id='firstHeading' class='firstHeading'>" + 
                            "<font color='purple'>" + scene['title'] + "</font>" + " (" + scene['release_year'] + ")</h1>" +
                            "<div id='bodyContent'>" +
                            "<p><span class='em'>Director: </span>" + scene['director'] + "</p>" +
                            "<p><span class='em'>Location: </span>" + scene['locations'] + "</p>" +
                            "</div>" + "</div>",
                    pixelOffset: new google.maps.Size(0,15)
                })
            });

            allMarkers.push(newMarker);
            
            var previousWindow;

            // bind infoWindow to its marker
            google.maps.event.addListener(allMarkers.get(i).attributes.mapMarker, 'click', function(index) {
                return function() {
                    if (previousWindow) previousWindow.close();  // auto-close any open infoWindow

                    var thisMarker = allMarkers.get(index).attributes;
                    thisMarker.infoWindow.open(map, thisMarker.mapMarker);
                    previousWindow = thisMarker.infoWindow;
                    google.maps.event.addListener(map, 'click', function() {
                        thisMarker.infoWindow.close();  // click away to close infoWindow
                    });
                }
            }(i));

            $('#nav-box').on('click', function() {
                if (previousWindow) previousWindow.close();
            });
        } 
        // instantiate Backbone view
        var markerView = new MarkerView({
            collection: allMarkers
        });

        loadAutocomplete(allMarkers);
    }

    // retrieve JSON data
    $.getJSON('static/js/geocoded.json', function(data) {
        setMarkers(data);
    });
}

function loadScript() {
    var script = document.createElement('script');
    script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyCmwKWNB23InY-yhUTapzP16sFqbW0UtRM&sensor=false&callback=initialize";
    $('body').append(script);
}

$('document').ready(loadScript);
