(function ($) {

  Drupal.behaviors.nemac_leaflet = {
    attach: function (context, settings) {

      $.each(settings.nemac_leaflet, function (m, data) {
        $('#' + data.mapId, context).each(function () {
          var $container = $(this);


          // If the attached context contains any leaflet maps, make sure we have a Drupal.nemac_leaflet_widget object.
          if ($container.data('nemac_leaflet') == undefined) {
            $container.data('nemac_leaflet', new Drupal.nemac_leaflet(L.DomUtil.get(data.mapId), data.mapId, data.map, data.features));

            // Add the leaflet map to our settings object to make it accessible
            data.lMap = $container.data('nemac_leaflet').lMap;
          }

        });
        // Destroy features so that an AJAX reload does not get parts of the old set.
        // Required when the View has "Use AJAX" set to Yes.
        // @todo Is this still necessary? Needs testing.
        data.features = null;
      });
    }
  };

  Drupal.nemac_leaflet = function (container, mapId, map_definition, data) {
    this.container = container;
    this.mapId = mapId;
    this.map_definition = map_definition;
    this.settings = this.map_definition.settings;
    this.bounds = [];
    this.base_layers = {};
    this.overlays = {};
    this.lMap = null;
    this.layer_control = null;

    this.initialise(data);
  };


  Drupal.nemac_leaflet.prototype.initialise = function (data) {

    // Instantiate a new Leaflet map.
    this.lMap = new L.Map(this.mapId, this.settings);
    var self = this;

    // Add map base layers.
    for (var key in this.settings.base_map_custom) {

      var layer = this.settings.base_map_custom[key];
      this.add_base_layer(key, layer);
    }

    // Set initial view, fallback to displaying the whole world.
    if (this.settings.center && this.settings.zoom) {
      this.lMap.setView(new L.LatLng(this.settings.center.lat, this.settings.center.lng), this.settings.zoom);
    }
    else {
      this.lMap.fitWorld();
    }

    this.addDataToMap(data, self);

    // Add attribution
    if (this.settings.attributionControl && this.map_definition.attribution) {
      this.lMap.attributionControl.setPrefix(this.map_definition.attribution.prefix);
      this.attributionControl.addAttribution(this.map_definition.attribution.text);
    }

    // allow other modules to get access to the map object using jQuery's trigger method
    $(document).trigger('nemac_leaflet.map', [this.map_definition, this.lMap, this]);
  };


  Drupal.nemac_leaflet.prototype.initialise_layer_control = function () {
    var count_layers = function (obj) {
      // Browser compatibility: Chrome, IE 9+, FF 4+, or Safari 5+
      // @see http://kangax.github.com/es5-compat-table/
      return Object.keys(obj).length;
    };

    // Only add a layer switcher if it is enabled in settings, and we have
    // at least two base layers or at least one overlay.
    if (this.layer_control == null && this.settings.layerControl && (count_layers(this.base_layers) > 1 || count_layers(this.overlays) > 0)) {
      // Only add base-layers if we have more than one, i.e. if there actually
      // is a choice for the user.
      var _layers = this.base_layers.length > 1 ? this.base_layers : [];
      // Instantiate layer control, using settings.layerControl as settings.
      this.layer_control = new L.Control.Layers(_layers, this.overlays, this.settings.layerControl);
      this.lMap.addControl(this.layer_control);
    }
  };

  Drupal.nemac_leaflet.prototype.addDataToMap = function (data, self) {

    //add geojson layer defined in drupal field
    var dataLayer = L.geoJson(data, {

      //un comment if you want popup navigation
      // //add popup for feature
      // onEachFeature: function (feature, layer) {
      //   if (feature.properties && feature.properties.field_destination && feature.properties.field_building_name) {
      //     var PopupText = [];
      //     PopupText.push("<b><br/>Building page </b> <a href=" + feature.properties.field_destination + '>' + feature.properties.field_building_name + '</a>');
      //     layer.bindPopup("<p>" + PopupText.join("") + "</p>");
      //   }
      // }

    });

    //on click naviations when field_destination is present
    dataLayer.on("click", function (event) {
        var clickevent = event.layer;

        //only navigate when field_destination is present 
        if (clickevent.feature.properties && clickevent.feature.properties.field_destination) {
          window.location = clickevent.feature.properties.field_destination;
       }
    });


    dataLayer.addTo(self.lMap);
    self.overlays['layer'] = dataLayer;
    self.lMap.fitBounds(dataLayer.getBounds())

    if (self.layer_control == null) {
      self.initialise_layer_control();
    }
    else {
      // If we already have a layer control, add the new overlay to it.
      self.layer_control.addOverlay(dataLayer, 'layer');
    }

  };

  Drupal.nemac_leaflet.prototype.add_base_layer = function (key, definition) {
    var map_layer = this.create_layer(definition, key);
    this.base_layers[key] = map_layer;
    this.lMap.addLayer(map_layer);

    if (this.layer_control == null) {
      this.initialise_layer_control();
    }
    else {
      // If we already have a layer control, add the new base layer to it.
      this.layer_control.addBaseLayer(map_layer, key);
    }
  };

  Drupal.nemac_leaflet.prototype.add_overlay = function (label, layer) {
    this.overlays[label] = layer;
    this.lMap.addLayer(layer);

    if (this.layer_control == null) {
      this.initialise_layer_control();
    }
    else {
      // If we already have a layer control, add the new overlay to it.
      this.layer_control.addOverlay(layer, label);
    }
  };

  Drupal.nemac_leaflet.prototype.create_feature_group = function (feature) {
    return new L.LayerGroup();
  };

  Drupal.nemac_leaflet.prototype.create_feature = function (feature) {
    var lFeature;
    switch (feature.type) {
      case 'point':
        lFeature = this.create_point(feature);
        break;
      case 'linestring':
        lFeature = this.create_linestring(feature);
        break;
      case 'polygon':
        lFeature = this.create_polygon(feature);
        break;
      case 'multipolygon':
      case 'multipolyline':
        lFeature = this.create_multipoly(feature);
        break;
      case 'json':
        lFeature = this.create_json(feature.json);
        break;
      default:
        return; // Crash and burn.
    }

    // assign our given unique ID, useful for associating nodes
    if (feature.nemac_leaflet_id) {
      lFeature._nemac_leaflet_id = feature.nemac_leaflet_id;
    }

    var options = {};
    if (feature.options) {
      for (var option in feature.options) {
        options[option] = feature.options[option];
      }
      lFeature.setStyle(options);
    }

    return lFeature;
  };

  Drupal.nemac_leaflet.prototype.create_layer = function (layer, key) {
    var map_layer = new L.TileLayer(layer.urlTemplate);
    map_layer._nemac_leaflet_id = key;

    if (layer.options) {
      for (var option in layer.options) {
        map_layer.options[option] = layer.options[option];
      }
    }

    // layers served from TileStream need this correction in the y coordinates
    // TODO: Need to explore this more and find a more elegant solution
    if (layer.type == 'tilestream') {
      map_layer.getTileUrl = function (tilePoint) {
        this._adjustTilePoint(tilePoint);
        var zoom = this._getZoomForUrl();
        return L.Util.template(this._url, L.Util.extend({
          s: this._getSubdomain(tilePoint),
          z: zoom,
          x: tilePoint.x,
          y: Math.pow(2, zoom) - tilePoint.y - 1
        }, this.options));
      }
    }
    return map_layer;
  };

  Drupal.nemac_leaflet.prototype.create_icon = function (options) {
    var icon = new L.Icon({iconUrl: options.iconUrl});

    // override applicable marker defaults
    if (options.iconSize) {
      icon.options.iconSize = new L.Point(parseInt(options.iconSize.x), parseInt(options.iconSize.y));
    }
    if (options.iconAnchor) {
      icon.options.iconAnchor = new L.Point(parseFloat(options.iconAnchor.x), parseFloat(options.iconAnchor.y));
    }
    if (options.popupAnchor) {
      icon.options.popupAnchor = new L.Point(parseFloat(options.popupAnchor.x), parseFloat(options.popupAnchor.y));
    }
    if (options.shadowUrl !== undefined) {
      icon.options.shadowUrl = options.shadowUrl;
    }
    if (options.shadowSize) {
      icon.options.shadowSize = new L.Point(parseInt(options.shadowSize.x), parseInt(options.shadowSize.y));
    }
    if (options.shadowAnchor) {
      icon.options.shadowAnchor = new L.Point(parseInt(options.shadowAnchor.x), parseInt(options.shadowAnchor.y));
    }

    return icon;
  };

  Drupal.nemac_leaflet.prototype.create_point = function (marker) {
    var latLng = new L.LatLng(marker.lat, marker.lon);
    this.bounds.push(latLng);
    var lMarker;

    if (marker.icon) {
      var icon = this.create_icon(marker.icon);
      lMarker = new L.Marker(latLng, {icon: icon});
    }
    else {
      lMarker = new L.Marker(latLng);
    }
    return lMarker;
  };

  Drupal.nemac_leaflet.prototype.create_linestring = function (polyline) {
    var latlngs = [];
    for (var i = 0; i < polyline.points.length; i++) {
      var latlng = new L.LatLng(polyline.points[i].lat, polyline.points[i].lon);
      latlngs.push(latlng);
      this.bounds.push(latlng);
    }
    return new L.Polyline(latlngs);
  };

  Drupal.nemac_leaflet.prototype.create_polygon = function (polygon) {
    var latlngs = [];
    for (var i = 0; i < polygon.points.length; i++) {
      var latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
      latlngs.push(latlng);
      this.bounds.push(latlng);
    }
    return new L.Polygon(latlngs);
  };

  Drupal.nemac_leaflet.prototype.create_multipoly = function (multipoly) {
    var polygons = [];
    for (var x = 0; x < multipoly.component.length; x++) {
      var latlngs = [];
      var polygon = multipoly.component[x];
      for (var i = 0; i < polygon.points.length; i++) {
        var latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
        latlngs.push(latlng);
        this.bounds.push(latlng);
      }
      polygons.push(latlngs);
    }
    if (multipoly.multipolyline) {
      return new L.Polyline(polygons);
    }
    else {
      return new L.Polygon(polygons);
    }
  };

  Drupal.nemac_leaflet.prototype.create_json = function (json) {
    lJSON = new L.GeoJSON();

    lJSON.on('featureparse', function (e) {
      e.layer.bindPopup(e.properties.popup);

      for (var layer_id in e.layer._layers) {
        for (var i in e.layer._layers[layer_id]._latlngs) {
          Drupal.nemac_leaflet.bounds.push(e.layer._layers[layer_id]._latlngs[i]);
        }
      }

      if (e.properties.style) {
        e.layer.setStyle(e.properties.style);
      }

      if (e.properties.nemac_leaflet_id) {
        e.layer._nemac_leaflet_id = e.properties.nemac_leaflet_id;
      }
    });

    lJSON.addData(json);
    return lJSON;
  };

  Drupal.nemac_leaflet.prototype.fitbounds = function () {
    if (this.bounds.length > 0) {
      this.lMap.fitBounds(new L.LatLngBounds(this.bounds));
    }
    // If we have provided a zoom level, then use it after fitting bounds.
    if (this.settings.zoom) {
      this.lMap.setZoom(this.settings.zoom);
    }
  };

})(jQuery);
