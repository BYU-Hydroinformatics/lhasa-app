////////////////////////////////////////////////////////////////////////  MAP FUNCTIONS
function map() {
    // create the map
    return L.map("map", {
        zoom: 4,
        minZoom: 2,
        zoomSnap: 0.5,
        boxZoom: true,
        maxBounds: L.latLngBounds(
            L.latLng(-32.741475, -86.544146),
            L.latLng(6.395598, -22.931077)
        ),
        center: [0, 0],
        timeDimension: true,
        timeDimensionControl: true,
        timeDimensionControlOptions: {
            position: "bottomleft",
            autoPlay: true,
            loopButton: true,
            backwardButton: true,
            forwardButton: true,
            timeSliderDragUpdate: true,
            minSpeed: 2,
            maxSpeed: 6,
            speedStep: 1
        }
    })
}

function basemaps() {
    // create the basemap layers
    let esri_imagery = L.esri.basemapLayer("Imagery")
    let esri_terrain = L.esri.basemapLayer("Terrain")
    let esri_labels = L.esri.basemapLayer("ImageryLabels")
    return {
        "ESRI Imagery (No Label)": L.layerGroup([esri_imagery]).addTo(mapObj),
        "ESRI Imagery (Labeled)": L.layerGroup([esri_imagery, esri_labels]),
        "ESRI Terrain": L.layerGroup([esri_terrain, esri_labels])
    }
}

////////////////////////////////////////////////////////////////////////  GLDAS LAYERS
function newWMS() {
    let layer = `nowcast_val`

    let wmsurl = `https://tethys-staging.byu.edu/thredds/wms/data/lhasa/main.ncml`
    // let wmsurl = threddsbase + "multidimensional_data_tutorial.ncml"
    let cs_rng = bounds[layer]
    if ($("#use_csrange").is(":checked")) {
        cs_rng = String($("#cs_min").val()) + "," + String($("#cs_max").val())
    }

    let wmsLayer = L.tileLayer.wms(wmsurl, {
        layers: layer,
        dimension: "time",
        useCache: true,
        crossOrigin: false,
        format: "image/png",
        transparent: true,
        opacity: $("#opacity_raster").val(),
        BGCOLOR: "0x000000",
        styles: "boxfill/" + $("#colorscheme").val(),
        colorscalerange: `0,2`
    })

    return L.timeDimension.layer
        .wms(wmsLayer, {
            name: "time",
            requestTimefromCapabilities: true,
            updateTimeDimension: true,
            updateTimeDimensionMode: "replace",
            cache: 20
        })
        .addTo(mapObj)
}

////////////////////////////////////////////////////////////////////////  GEOJSON STYLING CONTROLS
let chosenRegion = "" // tracks which region is on the chart for updates not caused by the user picking a new region
let chosenState = ""
getStyle = function() {
    return {
        color: $("#gjClr").val(),
        opacity: $("#gjOp").val(),
        weight: $("#gjWt").val(),
        fillColor: $("#gjFlClr").val(),
        fillOpacity: $("#gjFlOp").val()
    }
}
function styleGeoJSON() {
    let style = getStyle()
    LayerState.setStyle(style)
    layerRegion.setStyle(style)
    user_shapefile.setStyle(style)
    user_geojson.setStyle(style)
}

////////////////////////////////////////////////////////////////////////  ESRI LIVING ATLAS LAYERS (FEATURE SERVER)

function regionsESRI() {
    let region = $("#regions").val()

    let where = "1=1"
    if (region !== "") {
        where = "REGION = '" + region + "'"
    }
    let params = {
        url:
            "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/BRA_Boundaries_2018/FeatureServer",
        style: getStyle,
        outSR: 4326,
        where: where,
        onEachFeature: function(feature, layer) {
            layer.bindPopup(
                '<a class="btn btn-default" role="button">' +
                    feature.properties.REGION +
                    "</a>"
            )
        }
    }
    if (region !== "") {
        params["where"] = "REGION = '" + region + "'"
    }
    let layer = L.esri.featureLayer(params)
    layer.addTo(mapObj)
    layer
        .query()
        .where(where)
        .bounds(function(error, latLngBounds, response) {
            mapObj.flyToBounds(latLngBounds)
        })
    return layer
}
function countriesESRI() {
    let region = $("#countries").val()
    let where = "NAME='" + region + "'"
    let params = {
        url:
            "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/World__Countries_Generalized_analysis_trim/FeatureServer/0",
        style: getStyle,
        outSR: 4326,
        where: where,
        onEachFeature: function(feature, layer) {
            layer.bindPopup('<a class="btn btn-default" role="button">' + region + "</a>")
        }
    }
    let layer = L.esri.featureLayer(params)
    layer.addTo(mapObj)
    layer
        .query()
        .where(where)
        .bounds(function(error, latLngBounds, response) {
            mapObj.flyToBounds(latLngBounds)
        })
    return layer
}
function statesESRI() {

    let statesFeatureGroup = L.geoJson(statesjs, {
        onEachFeature: function(feature, layer) {
            layer.on("click", function(e) {
                $("#states").val(feature.properties.id)
                mapObj.fitBounds(layer.getBounds())
            })
        }
    }).addTo(mapObj)
    return statesFeatureGroup
}
////////////////////////////////////////////////////////////////////////  LEGEND AND LATLON CONTROLS
let legend = L.control({ position: "bottomright" })
legend.onAdd = function() {
    let layer = `nowcast_val`
    let wmsurl = `https://tethys-staging.byu.edu/thredds/wms/data/lhasa/main.ncml`

    let cs_rng = `0,2`
    if ($("#use_csrange").is(":checked")) {
        cs_rng = String($("#cs_min").val()) + "," + String($("#cs_max").val())
    }

    let div = L.DomUtil.create("div", "legend")
    let url =
        wmsurl +
        "?REQUEST=GetLegendGraphic&LAYER=" +
        layer +
        "&PALETTE=" +
        $("#colorscheme").val() +
        "&COLORSCALERANGE=" +
        cs_rng
    div.innerHTML =
        '<img src="' + url + '" alt="legend" style="width:100%; float:right;">'
    return div
}

let latlon = L.control({ position: "bottomleft" })
latlon.onAdd = function() {
    let div = L.DomUtil.create("div", "well well-sm")
    div.innerHTML = '<div id="mouse-position" style="text-align: center"></div>'
    return div
}

////////////////////////////////////////////////////////////////////////  MAP CONTROLS AND CLEARING
// the layers box on the top right of the map
function makeControls() {
    let layers = {
        "Drawing on Map": drawnItems
        // "Region Boundaries": layerRegion
        /*"State Boundaries": stateLayer*/
    }

    if (newLayer) {
        layers["Nowcast"] = newLayer
    }
    // if (statebound) {
    //     layers["State Boundaries"] = statebound
    // }
    // if (layerWMS) {
    //     layers["Animated Nowcast Layer"] = layerWMS
    // }
    return L.control.layers(basemapObj, layers).addTo(mapObj)
}
// you need to remove layers when you make changes so duplicates dont persist and accumulate
function clearMap() {
    controlsObj.removeLayer(layerWMS)
    mapObj.removeLayer(layerWMS)
    controlsObj.removelayer(newlayer)
    mapObj.removelayer(newlayer)
    controlsObj.removeLayer(stateLayer)
    mapObj.removeLayer(stateLayer)
    controlsObj.removeLayer(layerRegion)
    mapObj.removeControl(controlsObj)
}

////////////////////////////////////////////////////////////////////////  LOAD THE MAP
const mapObj = map() // used by legend and draw controls
const basemapObj = basemaps() // used in the make controls function
mapObj.on("mousemove", function(event) {
    $("#mouse-position").html(
        "Lat: " + event.latlng.lat.toFixed(5) + ", Lon: " + event.latlng.lng.toFixed(5)
    )
})
