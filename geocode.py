import sys
import urllib2
import re
import json
from pygeocoder import Geocoder, GeocoderError


def geocode_locations(filename):

    # bias location search results to SF
    # coordinates courtesy of http://jsfiddle.net/yV6xv/16/
    maxLat = 37.83473402375478
    minLat = 37.59682400108367
    maxLong = -122.35885620117188
    minLong = -122.52433776855469
    BOUNDS = ((minLat, minLong), (maxLat, maxLong))

    json_file = open(filename)
    data = json.load(json_file)

    for scene in data:
        if scene.get('latlong') != None:
            continue
        else:
            try:
                if u'\xe9' in scene['locations']:
                    scene['locations'] = scene['locations'].replace(u'\xe9', 'e')

                address_string = scene['locations'] + ', San Francisco, CA'

                results = Geocoder.geocode(str(address_string), bounds=BOUNDS)

                # check that first result's coordinates are within vicinity of SF;
                # if not, loop # through the remaining results
                if not minLat < results[0].coordinates[0] < maxLat or not minLong < results[0].coordinates[1] < maxLong:
                    if len(results) > 1:
                        for i in range(1, len(results)):
                            if minLat < results[i].coordinates[0] < maxLat and minLong < results[i].coordinates[1] < maxLong:
                                scene['latlong'] = results[i].coordinates
                                break
                else:
                    scene['latlong'] = results[0].coordinates
            except GeocoderError:
                continue
            except KeyError:
                data.remove(scene)  # throw out object if it has no location field
    
    f = open('static/js/geocoded.json', 'w+')
    updated_json = json.dump(data, f)
    f.close()


def main():
    filename = sys.argv[1]
    geocode_locations(filename)

if __name__ == "__main__":
    main()
