// initialize map when page ready

jQuery(document).ready(function() {
	window.location.replace(window.location.href.split("#")[0] + "#mappage");
    jQuery(window).bind("orientationchange resize pageshow", fixContentHeight);
    document.body.onload = fixContentHeight;

    jQuery("#plus").click(function(){map.zoomIn();});
    jQuery("#minus").click(function(){map.zoomOut();});
    jQuery("#locate").click(function(){
        var control = map.getControlsBy("id", "locate-control")[0];
        if (control.active) {control.getCurrentLocation();} else {control.activate();}
    });

	//jQuery('#intersectionpage').live('pageshow',function(event, ui){initDetailMap();});
	jQuery('#intersectionpage').live('pageshow',function(event, ui) {
		if (i_map) {
			initDetailMap();
			//reloadDetailMap();
			//detailMapStrategy.refresh({force: true});
		}
		else {
			initDetailMap();
		};
	});

	jQuery("#yes").click(function() {
		cornerAttrs.features[currentCorner].attributes.cw_state = "yes"; cornerAttrs.drawFeature(cornerAttrs.features[currentCorner]);
		moveCW();
	});
	jQuery("#sortOf").click(function() {
		cornerAttrs.features[currentCorner].attributes.cw_state = "sort_of"; cornerAttrs.drawFeature(cornerAttrs.features[currentCorner]);
		moveCW();
	});
	jQuery("#no").click(function() {
		cornerAttrs.features[currentCorner].attributes.cw_state = "no"; cornerAttrs.drawFeature(cornerAttrs.features[currentCorner]);
		moveCW();
	});
	jQuery("#skip").click(function() {moveCW();});
	jQuery("#same").click(function() {
		var aFeature
		var features = cornerAttrs.features
		var newState = features[(currentCorner == 0)?features.length-1:currentCorner-1].attributes.cw_state;
		for (f in features) {
			aFeature = features[f];
			aFeature.attributes.cw_state = newState; cornerAttrs.drawFeature(aFeature);
		};
	});
	jQuery("#clear").click(function() {
		var aFeature
		for (f in cornerAttrs.features) {
			aFeature = cornerAttrs.features[f];
			aFeature.attributes.cw_state = "none"; cornerAttrs.drawFeature(aFeature);
		};
	});
	jQuery("#save").click(function(){
		var attr;
		var allNone = "n";
		var query;
		for (f in cornerAttrs.features) {
			attr = cornerAttrs.features[f].attributes;
			query = "q=UPDATE corners SET cw_state = '"+attr.cw_state+"' where nodeid = "+intersectionID+" AND bearing = "+attr.bearing+" &api_key=612cfbb8eb5240dc9e3ef988a61c5b0c9b733765";
			jQuery.post("http://scottparker.cartodb.com/api/v2/sql", query);
			if (attr.cw_state != "none") {allNone = "y"};
		};
		query = "q=UPDATE intersections SET evaluated = '"+allNone+"' where node_id = "+intersectionID+"&api_key=612cfbb8eb5240dc9e3ef988a61c5b0c9b733765";
	    jQuery.post("http://scottparker.cartodb.com/api/v2/sql", query, function(data) {areaMapStrategy.refresh({force:true});});
	});
});




   
  /*  jQuery('#popup').live('pageshow',function(event, ui){
        var cur_intID = '';
        for (var attr in selectedFeature.attributes){
            if (attr == "node_id") {
                cur_intID = selectedFeature.attributes[attr];
                document.getElementById("intersectionID").innerHTML = cur_intID;
            }
        }

        //put the query together to get info from the corners table in CartoDB
		var stNmQuery = "q=SELECT cw_street, ccw_street from corners where nodeid = "+cur_intID+" limit 1";
		var url = "http://scottparker.cartodb.com/api/v2/sql?"+stNmQuery;

        //request & parse the json
        jQuery.getJSON(url, function (data) {
            jQuery.each(data.rows[0], function(key, val) {
				if (key == 'cw_street') {document.getElementById("streetR2").innerHTML = val;}
				if (key == 'ccw_street') {document.getElementById("streetL2").innerHTML = val;}
            });
        });
    });  */


/* function initLayerList() {
    jQuery('#layerspage').page();
    jQuery('<li>', {
            "data-role": "list-divider",
            text: "Base Layers"
        })
        .appendTo('#layerslist');
    var baseLayers = map.getLayersBy("isBaseLayer", true);
    jQuery.each(baseLayers, function() {
        addLayerToList(this);
    });

    jQuery('<li>', {
            "data-role": "list-divider",
            text: "Overlay Layers"
        })
        .appendTo('#layerslist');
    var overlayLayers = map.getLayersBy("isBaseLayer", false);
    jQuery.each(overlayLayers, function() {
        addLayerToList(this);
    });
    jQuery('#layerslist').listview('refresh');
    
    map.events.register("addlayer", this, function(e) {
        addLayerToList(e.layer);
    });
}

function addLayerToList(layer) {
    var item = jQuery('<li>', {
            "data-icon": "check",
            "class": layer.visibility ? "checked" : ""
        })
        .append(jQuery('<a />', {
            text: layer.name
        })
            .click(function() {
                jQuery.mobile.changePage('#mappage');
                if (layer.isBaseLayer) {
                    layer.map.setBaseLayer(layer);
                } else {
                    layer.setVisibility(!layer.getVisibility());
                }
            })
        )
        .appendTo('#layerslist');
    layer.events.on({
        'visibilitychanged': function() {
            jQuery(item).toggleClass('checked');
        }
    });
} */