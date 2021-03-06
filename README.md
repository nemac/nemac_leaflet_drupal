## NEMAC Leaflet

This module provides Drupal 8 integration with Leaflet map scripting library,
http://leafletjs.com/.

To use it you must download the leaflet JS library from either
http://leafletjs.com/download.html or
GitHub, https://github.com/Leaflet/Leaflet


It was based on the https://www.drupal.org/project/leaflet module.

### Installation
---
* Download the code from GitHub https://github.com/nemac/nemac_leaflet_drupal/blob/master/nemac_leaflet.tar.gz.

* Unzip the file and copy the contents to .your Drupal 8 sites `/html/modules/contrib` directory.

* Then install the module with Drupal's UI
![insall module](screen/install.png)

### Using
---

* Add a `Text (plain, long)` field to your Drupal content.
![add text field](screen/add_field.png)

* Go to your Manage Display tab.

* Change the format  to NEMAC Leaflet Map.
![change format](screen/changeformat.png)

* Change the base map by editing the settings.
![change base map](screen/changebasemap.png)

* to change the GeoJSON layer add the URL without the http: or https: in the text field
![change GeoJSON layer](screen/geojsonlayer.png)

* to navigate to a node a field to the geojson named field_destination.  The value should be a relative path or full url.


### Suggested modules

I am also using these modules the views_geojson is very helpful for creating a GeoJSON feed of Spatial data held in a the geofield module.  A great tutorial on creating a geojson feed can be found here: https://savaslabs.com/2015/07/06/map-in-drupal-8.html#add-a-new-view.

```
composer require 'drupal/geofield:^1.0'
composer require 'drupal/geophp:^1.0'
composer require 'drupal/views_geojson:1.x-dev'
composer require 'drupal/leaflet'
```

Note: if an update was run from the Drupal UI it is possible a problem there was problem with the geophp module update.  You may have to remvove the directory and reload all the supporting modules:
remove this directory
```
../html/vendor/phayes/geophp
```

from the Drupal install directory then rerun the composer require's.


NOTE as of begining of February if is this happens you MUST update the drupal/leaflet module to account for a new version of leaflet.
This line.  Since then it apears this may have been upgraded so it may no longer be necessary.

in the modules/contrib/leaflet directory

change the following in leaflet.drupal.js

```
 L.MultiPolygon to L.Polygon
```

and

```
 L.MultiPolyline to L.Polyline
```
