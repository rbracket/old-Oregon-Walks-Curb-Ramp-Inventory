// Start here
//var apiKey = "Ao5Ew1XnxVey8Mh0jgfL32mbQN1pNLQoDv48u1r5BJrGsf8r0Bach7FYO5wTpbHl";  // My Bing API key. Please get your own at http://bingmapsportal.com/ and use that instead.

var apiKey = "AjqLfgr5dNzp2kVrdzttXeg9xj1cE5JTS61rnR-oBujjpTGyABaw4pEg31CdrXyx"; //Katie's BING API Key.
var map;
var i_map;
var areaMapStrategy;
var detailMapStrategy;
var detailProtocol;
var wgs = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");
var geoJSONparser = new OpenLayers.Format.GeoJSON({ignoreExtraDims: true});

var intersectionStyleMap = new OpenLayers.StyleMap({pointRadius: 7}); 
var intersectionLookup = {"y": {fillColor: "orange"},"n": {fillColor: "blue"}};
intersectionStyleMap.addUniqueValueRules("default", "evaluated", intersectionLookup); //evaluated is attribute of intersections

var cornerStyleMap = new OpenLayers.StyleMap({display: "none"});

var hiLiteStyleMap = new OpenLayers.StyleMap({pointRadius: 12, fillOpacity: 0});
var hiLiteLookup = {0: {display: "none"}, 1: {strokeColor: "cyan"}};
hiLiteStyleMap.addUniqueValueRules("default", "activeOne", hiLiteLookup); //active is attribute of hiLite

var stateStyleMap = new OpenLayers.StyleMap({pointRadius: 4, fillOpacity: 1});
var stateLookup = {"none": {fillColor: "white"}, "yes": {fillColor: "green"}, "sort_of": {fillColor: "yellow"}, "no": {fillColor: "red"}};
stateStyleMap.addUniqueValueRules("default", "cw_state", stateLookup); //cw_state is attribute of state

var intersectionID; 
var currentCorner;
var hiLite;
var cornerAttrs;

function fixContentHeight() {
    var footer = jQuery("div[data-role='footer']:visible"),
        content = jQuery("div[data-role='content']:visible:visible"),
        viewHeight = jQuery(window).height(),
        contentHeight = viewHeight - footer.outerHeight();

    if ((content.outerHeight() + footer.outerHeight()) !== viewHeight) {
        contentHeight -= (content.outerHeight() - content.height() + 1);
        content.height(contentHeight);
    };

    if (window.map && window.map instanceof OpenLayers.Map) {
		map.updateSize();}
	else {
		initAreaMap();
	};
}

/* initialize area map page */
function initAreaMap() {
    var vector = new OpenLayers.Layer.Vector("Location range", {});

	areaMapStrategy = new OpenLayers.Strategy.Refresh({interval: 60000, force: true})
    var intersections = new OpenLayers.Layer.Vector("intersections", {
        projection: wgs,
        strategies: [new OpenLayers.Strategy.BBOX(),areaMapStrategy],
        protocol: new OpenLayers.Protocol.Script({
			url: "http://scottparker.cartodb.com/api/v2/sql",
            params: {q: "select * from intersections", format: "geojson"},
            format: geoJSONparser,
			callbackKey: "callback"
		}),
        styleMap: intersectionStyleMap
    });

    var selectControl = new OpenLayers.Control.SelectFeature(intersections, {
        autoActivate:true,
        onSelect: function(feature) {
			intersectionID = feature.attributes["node_id"];
			this.unselectAll();
			jQuery.mobile.changePage("#intersectionpage"); 
        }
	});

    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 7000
        }
    });

    map = new OpenLayers.Map({ // create map
        div: "map",
        theme: null,
        projection: wgs,
        numZoomLevels: 18,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({dragPanOptions: {enableKinetic: true}}),
            geolocate,
            selectControl
        ],
        layers: [
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {transitionEffect: 'resize'}),
            vector, //the geolocation display
            intersections
        ],
        center: new OpenLayers.LonLat(-13654000, 5705400),
        zoom:18
    });

    /*geolocation stuff*/
    var style = {fillOpacity: 0.1,fillColor: '#000',strokeColor: '#f00',strokeOpacity: 0.6};
    geolocate.events.register("locationupdated", this, function(e) {
        vector.removeAllFeatures();
        vector.addFeatures([
            new OpenLayers.Feature.Vector(
                e.point,
                {},
                {
                    graphicName: 'cross',
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillOpacity: 0,
                    pointRadius: 10
                }
            ),
            //after geolocates, draws a location range on the map
            new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy / 2,
                    50,
                    0
                ),
                {},
                style
            )
        ]);
        map.zoomToExtent(vector.getDataExtent());
    });
};

/* load intersection detail page */
function initDetailMap() {
	//alert("init detail map");
    jQuery('#i_map').empty(); //clears map div to avoid duplicating map

	hiLite = new OpenLayers.Layer.Vector("hiLite",{styleMap: hiLiteStyleMap});
	cornerAttrs = new OpenLayers.Layer.Vector("corner_attributes",{styleMap: stateStyleMap});

	detailProtocol = new OpenLayers.Protocol.Script({
		url: "http://scottparker.cartodb.com/api/v2/sql",
        params: {q: "select * from corners where nodeid = "+intersectionID+ " order by bearing asc", format: "geojson"},
        format: geoJSONparser,
        callbackKey: "callback"
	});

	detailMapStrategy = new OpenLayers.Strategy.Refresh();

	var corners = new OpenLayers.Layer.Vector("corners", {
        projection: wgs,
		strategies: [new OpenLayers.Strategy.Fixed(),detailMapStrategy],
		protocol: detailProtocol,
        //protocol: new OpenLayers.Protocol.Script({
			//url: "http://scottparker.cartodb.com/api/v2/sql",
            //params: {
				//q: "select * from corners where nodeid = "+intersectionID+ " order by bearing asc",
                //format: "geojson"
                //},
            //format: geoJSONparser,
            //callbackKey: "callback"
			//}),
        styleMap: cornerStyleMap,
        eventListeners: {
			"featuresadded": function() {
			//alert("features added " +intersectionID);
				this.map.zoomToExtent(this.getDataExtent())
				var attributes;
				var stateAttrs;
				for (var i = 0; i< this.features.length; i++) {
					attributes = this.features[i].attributes;
					cornerAttrs.addFeatures(new OpenLayers.Feature.Vector(this.features[i].geometry.clone()));
					attrs = cornerAttrs.features[i].attributes;
					for (var attr in attributes){
						if (attr == 'bearing') {attrs.bearing = attributes[attr];}
						else if (attr == 'cw_street') {attrs.cw_street = attributes[attr];}
						else if (attr == 'ccw_street') {attrs.ccw_street = attributes[attr];}
						else if (attr == 'cw_state') {attrs.cw_state = attributes[attr];}
						else if (attr == 'ccw_state') {attrs.ccw_state = attributes[attr];};
					}
					cornerAttrs.drawFeature(cornerAttrs.features[i]);
					hiLite.addFeatures(new OpenLayers.Feature.Vector(this.features[i].geometry.clone(),{activeOne: 0}));
				}
				currentCorner = 0;
				hiLite.features[currentCorner].attributes.activeOne = 1;
				hiLite.drawFeature(hiLite.features[currentCorner]);
				document.getElementById("streetR").innerHTML = cornerAttrs.features[currentCorner].attributes.cw_street;
				document.getElementById("streetL").innerHTML = cornerAttrs.features[currentCorner].attributes.ccw_street;
			}
		}
    });
	
    i_map = new OpenLayers.Map({ // create map
        div: "i_map",
        theme: null,
        projection: sm,
        numZoomLevels: 18,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({dragPanOptions: {enableKinetic: true}})
        ],
        layers: [
            new OpenLayers.Layer.Bing({key:apiKey,type:"AerialWithLabels",name:"Bing Aerial + Labels",transitionEffect:'resize'}),
			hiLite,
            cornerAttrs,
			corners
        ],
        center: new OpenLayers.LonLat(-13654000, 5705400),
        zoom:18
    });
};

function reloadDetailMap() {
	//alert("reload detail map");
	hiLite = new OpenLayers.Layer.Vector("hiLite",{styleMap: hiLiteStyleMap});
	cornerAttrs = new OpenLayers.Layer.Vector("corner_attributes",{styleMap: stateStyleMap});

	detailProtocol = new OpenLayers.Protocol.Script({
		url: "http://scottparker.cartodb.com/api/v2/sql",
        params: {q: "select * from corners where nodeid = "+intersectionID+ " order by bearing asc", format: "geojson"},
        format: geoJSONparser,
        callbackKey: "callback"
	});
};

var moveCW = function() {
	hiLite.features[currentCorner].attributes.activeOne = 0; hiLite.drawFeature(hiLite.features[currentCorner]);
	currentCorner = (currentCorner == cornerAttrs.features.length-1)?0:currentCorner+1;
	hiLite.features[currentCorner].attributes.activeOne = 1; hiLite.drawFeature(hiLite.features[currentCorner]);
	document.getElementById("streetR").innerHTML = cornerAttrs.features[currentCorner].attributes.cw_street;
	document.getElementById("streetL").innerHTML = cornerAttrs.features[currentCorner].attributes.ccw_street;
};



  /*var cStyleMap = new OpenLayers.StyleMap({
        "default": {
            externalGraphic: "img/two_arrows_plain.png",
            //graphicWidth: 17,
            graphicHeight: 30,
            //graphicXOffset: 4,
            //graphicYOffset: 4,
            rotation: "jQuery{im_angle}", //the bearing for the image
			fillOpacity: 1 //"jQuery{opacity}"
            },
        "select": {
            cursor: "crosshair",
            //externalGraphic: "../img/marker.png"
            }
        }); */
