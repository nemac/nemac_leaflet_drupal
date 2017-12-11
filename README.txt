
This module provides integration with Leaflet map scripting library,
http://leaflet.cloudmade.com.

To use it you must download the leaflet JS library from either
http://leafletjs.com/download.html or
GitHub, http://github.com/CloudMade/Leaflet

In its current state, maps can be rendered as follows:
o via the included field formatter for Geofield (drupal.org/project/geofield)
o via Views (and Geofield)
o by using the API directly.


Installation
------------

1. Normal Drupal module installation

2. Download the Leaflet library from http://leafletjs.com/. Leaflet 0.6.x or
   higher is recommended

3. Enable leaflet_views for using Views and Leaflet (see below), or use the
   display formatters for fields display.


API Usage
---------
Rendering a map is as simple as calling a single method, leaflet_render_map(),
which takes 3 parameters.

$map
An associative array defining a map. See hook_leaflet_map_info(). The module
defines a default map with a OpenStreet Maps base layer.

$features
This is the tricky pary. This is an associative array of all the features you
want to plot on the map. A feature can be a point, linestring, polygon,
multipolygon, multipolygon, or json object. Additionally, features can be
grouped into layer groups so they can be controlled together,
http://leaflet.cloudmade.com/reference.html#layergroup. An feature will look
something like:

$features = array(
  array(
    'type' => 'point',
    'lat' => -12,
    'lon' => 123.45,
    'icon' => array(
      'iconUrl' => 'sites/default/files/mymarker.png
    ),
    'popup' => l($node->title, 'node/' . $node->nid),
    'leaflet_id' => 'some unique ID'
  ),
  array(
    'type' => 'linestring',
    'points' => array(
      0 => array('lat' =>  13, 'lon' => 123),
      1 => array('lat' =>  14, 'lon' => -123),
      2 => array('lat' => -15, 'lon' => 123),
      3 => array('lat' =>  16, 'lon' => 123),
      4 => array('lat' => -17, 'lon' => 123),
    ),
    'popup' => l($node->title, 'node/' . $node->nid),
    'leaflet_id' => 'some unique ID'
  ),
  array(
    'type' => 'json',
    'json' => [JSON OBJECT],
    'properties' = array(
      'style' => [style settings],
      'leaflet_id' => 'some unique ID'
    )
  )
);

Authors/Credits
---------------

* [levelos](http://drupal.org/user/54135)
* [pvhee](http://drupal.org/user/108811)
