var _UNITS = [{"name": "year",
               "value": 31526000},
              {"name": "week",
               "value": 604800},
              {"name": "day",
               "value": 86400},
              {"name": "hour",
               "value": 3600},
              {"name": "minute",
               "value": 60},
              {"name": "second",
               "value": 1}];

var _TYPES = ["tide", "wind", "surge"];

var _LAST = "";

var _ITEMS = 1;


function init() {
    $(document).ready(function() {

        // hide parts
        $("#container-form").hide()
        $("#container-plots").hide()

        // draw axes
        draw_axes("#canvas-wl", [0, 365], [-2, 2]);
        draw_axes("#canvas-waves", [0, 365], [0, 5]);
        draw_axes("#canvas-wind", [0, 365], [0, 20]);
        // draw_axes("#canvas-seddist", [0, 1000], [0, 1]);

        // add canvas titles
        add_title("#canvas-wl", "water level");
        add_title("#canvas-waves", "waves");
        add_title("#canvas-wind", "wind");

        // create tabs
        $("#form-tabs").tabs();
        create_settingsform($("#tab-settings"));
        create_regimesform($("#tab-regimes"));
        create_scenarioform($("#tab-scenario"));

        // show parts
        $(document).click(function() {
            $("#container-form").show("drop", {"direction":"left"});
            $("#container-plots").show("drop", {"direction":"right"});
            form_update();
        });

        resize();
    });

    $(window).resize(function() {
        resize();
    });
}


function resize() {
    var w = $(window).width();
    var h = $(window).height();
    $("#container-form, #container-plots")
        .css("margin-top", 0.2 * 0.5 * w)
        .height(h - 0.2 * 0.5 * w);
    $("#form-tabs")
        .width(0.5 * w - 80);
    $("#container-plots .canvas")
        .width(0.4 * w - 40);
}


function form_update() {
                          
    var scenario = generate_scenario();
    console.log(scenario);
    
    var url = "api?"
        + "scenario=" + scenario
        + "&duration=" + (parseFloat($("#input-duration").val())
                          * parseFloat($("#input-duration-units").val()))
        + "&dt=" + (parseFloat($("#input-dt").val())
                    * parseFloat($("#input-dt-units").val()))
        + "&water_level=" + parseFloat($("#input-water_level").val())
        + "&wave_height=" + parseFloat($("#input-wave_height").val())
        + "&wave_period=" + parseFloat($("#input-wave_period").val())
        + "&wind_speed=" + parseFloat($("#input-wind_speed").val())
        + "&seed=" + parseFloat($("#input-seed").val())

    if (url != _LAST) {
        //console.log(url);
        
        $.getJSON(url, function (data) {
            var t_max = Math.max.apply(null, data["time"]) / 3600 / 24;
            
            draw_axes("#canvas-wl", [0, t_max], get_range(data["water_level"]));
            draw_axes("#canvas-waves", [0, t_max], get_range(data["wave_height"]));
            draw_axes("#canvas-wind", [0, t_max],  get_range(data["wind_speed"]));
            
            plot("#canvas-wl", data["time"], data["water_level"]);
            plot("#canvas-waves", data["time"], data["wave_height"]);
            plot("#canvas-wind", data["time"], data["wind_speed"]);
        });

        _LAST = url;
    }
}


function generate_scenario() {

    var s = new Array();

    $.each($("#scenario-list").find(".ui-accordion-content"), function() {

        var p = new Array()
        
        $.each($(this).find(".ui-slider"), function() {

            var o = $(this).parent().children(".slider-value")

            if ($(o).is("[units]")) {
                switch ($(o).attr("units")) {
                case "%":
                    var f = (parseFloat($("#input-duration").val())
                             * parseFloat($("#input-duration-units").val())) / 100;
                    break;
                case "hours":
                    var f = 3600;
                    break;
                case "days":
                    var f = 24 * 3600;
                    break;
                default:
                    var f = 1;
                    break;
                }
            } else {
                f = $(o).children(".units").val();
            }

            if ($(this).slider("option", "range")) {
                var vals = $(this).slider("values");
                vals[0] *= f;
                vals[1] *= f;
                var val = "[" + vals.join(",") + "]";
            } else {
                var val = $(this).slider("value") * f;
            }

            p.push("\"" + $(this).attr("name") + "\":" + val);
        });

        s.push("[\"" + $(this).prev().children(".ui-dynamicaccordion-title").text() + "\",{" + p.join(",") + "}]");
        
    });

    return "[" + s.join(",") + "]";
}


function slider_update(obj) {

    var o = $(obj)
        .parent()
        .children(".slider-value")
    
    if ($(obj).slider("option", "range")) {
        var val = $(obj).slider("values").join(" - ");
    } else {
        var val = $(obj).slider("value");
    }

    if ($(o).is("[units]")) {
        $(o)
            .text(val + " " + $(o).attr("units"));
    } else {
        var c = $(o).children();
        
        $(o)
            .text(val + " ")
            .append(c);
    }

    form_update();
}


function create_fields(obj, fields) {
    
    $.each(fields, function() {
        var o = $("<div />")
            .attr("id", "field-" + this.name)
            .append(
                $("<label />")
                    .text(this.label))
            .append(
                $("<input />")
                    .attr("id", "input-" + this.name)
                    .val(this.value)
                    .change(function() { form_update(); }));

        if ("default_units" in this) {
            create_unitselector(o, this);
        } else if ("units" in this) {
            $(o)
                .append(
                    $("<span />")
                        .text(this.units));
        }

        $(obj)
            .append(o);
    });
}


function create_unitselector(obj, ths) {
    
    var s = $("<select />")
        .addClass("units")
        .attr("id", "input-" + ths.name + "-units")

    $.each(_UNITS, function() {
        $(s)
            .append($("<option />")
                    .val(this.value)
                    .text(this.name));
    });

    $(s)
        .val(ths.default_units)
        .change(function() { form_update(); });

    $(obj)
        .append(s);
}

function create_sliders(obj, fields) {
    
    $.each(fields, function() {

        if (this.units == "") {
            var step = 1;
        } else {
            var step = 0.1;
        }
        
        if ("values" in this) {
            var opt = {range: true,
                       step: step,
                       min: this.range[0],
                       max: this.range[1],
                       values: this.values,
                       stop: function() { slider_update(this); },
                       create: function() { slider_update(this); }};
        } else {
            var opt = {range: false,
                       step: step,
                       min: this.range[0],
                       max: this.range[1],
                       value: this.value,
                       stop: function() { slider_update(this); },
                       create: function() { slider_update(this); }};
        }

        if ("default_units" in this) {
            var u = $("<label />");
            create_unitselector(u, this);
        } else {
            var u = $("<label />")
                .attr("units", this.units)
        }

        var o = $("<div />")
            .attr("id", "field-" + this.name)
            .append(
                $("<label />").text(this.label))
            .append(
                $(u)
                    .addClass("slider-value"))
            .append(
                $("<div />")
                    .attr("name", this.name));

        $(o)
            .children("div")
            .slider(opt);
        $(obj)
            .append(o);
    });
}


function create_settingsform(obj) {
    
    create_fields(obj, [{"name": "duration",
                         "label": "Duration",
                         "value": 4,
                         "default_units": 604800},
                        {"name": "dt",
                         "label": "Resolution",
                         "value": 1,
                         "default_units": 3600},
                        {"name": "water_level",
                         "label": "Water level",
                         "value": 0,
                         "units": "m"},
                        {"name": "wave_height",
                         "label": "Wave height",
                         "value": 1,
                         "units": "m"},
                        {"name": "wave_period",
                         "label": "Wave period",
                         "value": 4,
                         "units": "s"},
                        {"name": "wind_speed",
                         "label": "Wind speed",
                         "value": 4,
                         "units": "m/s"},
                        {"name": "seed",
                         "label": "Random seed",
                         "value": 123,
                         "units": ""}]);
}


function create_regimesform(obj) {

    var a = $("<div />")
        .attr("id", "regimes-list")
        .dynamicaccordion({
            buttons: ["add regime"],
            title: "new regime",
            editable: true,
            add: function(obj) {
                create_regimeitem($(obj));
            },
            accordion: {
                "heightStyle": "content"
            }
        });
    
    $(obj)
        .append(a);
}


function create_regimeitem(obj) {
    
    create_fields(obj, [{"name": "wl_max",
                         "label": "Max. surge level",
                         "value": 0,
                         "units": "m"},
                        {"name": "Hs_max",
                         "label": "Max. wave height",
                         "value": 0,
                         "units": "m"},
                        {"name": "u_max",
                         "label": "Max. wind speed",
                         "value": 0,
                         "units": "m/s"}]);
}


function create_scenarioform(obj) {

    var a = $("<div />")
        .attr("id", "scenario-list")
        .dynamicaccordion({
            buttons: _TYPES,
            title: null,
            add: function(obj, type) {
                create_scenarioitem($(obj), type);
            },
            accordion: {
                "heightStyle": "content"
            }
        });
    
    $(obj)
        .append(a);
}


function create_scenarioitem(obj, type) {

    switch (type) {
    case "tide":
        create_sliders(obj, [{"name": "amplitude",
                              "label": "Amplitude",
                              "range": [0, 20],
                              "value": 1.5,
                              "units": "m"},
                             {"name": "period",
                              "label": "Period",
                              "range": [0, 30],
                              "value": 12.25,
                              "default_units": 3600},
                             {"name": "phase",
                              "label": "Phase",
                              "range": [0, 30],
                              "value": 0,
                              "default_units": 3600}]);
        break;
    case "wind":
        create_sliders(obj, [{"name": "u_max",
                              "label": "Peak wind speed",
                              "range": [-10, 30],
                              "value": 8,
                              "units": "m/s"},
                             {"name": "t_max",
                              "label": "Moment of peak wind speed",
                              "range": [0, 100],
                              "value": 25,
                              "units": "%"},
                             {"name": "duration",
                              "label": "Duration",
                              "range": [0, 100],
                              "value": 50,
                              "units": "%"}]);
        break;
    case "surge":
        create_sliders(obj, [{"name": "nsurge",
                              "label": "Number of surges",
                              "range": [0, 100],
                              "values": [1, 3],
                              "units": ""},
                             {"name": "surge",
                              "label": "Peak surge height",
                              "range": [0, 10],
                              "values": [2, 5],
                              "units": "m"},
                             {"name": "t_max",
                              "label": "Moment of peak surge height",
                              "range": [0, 100],
                              "values": [0, 50],
                              "units": "%"},
                             {"name": "duration",
                              "label": "Duration",
                              "range": [0, 100],
                              "values": [30, 35],
                              "units": "hours"},
                             {"name": "Hs_max",
                              "label": "Maximum wave height",
                              "range": [0, 10],
                              "values": [4, 6],
                              "units": "m"},
                             {"name": "Tp_max",
                              "label": "Maximum wave period",
                              "range": [0, 30],
                              "values": [10, 18],
                              "units": "s"},
                             {"name": "u_max",
                              "label": "Maximum wind speed",
                              "range": [0, 30],
                              "values": [6, 14],
                              "units": "m/s"}]);
        break;
    }
}


function add_tide() {
    var scenario = $("#scenario").val()

    scenario += ',["tide", {'
        + '"amplitude":' + parseFloat($("#input-amplitude").val()) + ','
        + '"period":' + (parseFloat($("#input-period").val()) *
                         parseFloat($("#period-units").val())) + ','
        + '"phase":' + $("#input-phase").val() + '}]'

    $("#scenario").val(scenario);

    form_update();
}


function get_range(data) {
    mn = Math.floor(Math.min.apply(null, data) - 1);
    mx = Math.ceil(Math.max.apply(null, data) + 1);
    if (mn > 0) mn = 0;
    return [mn, mx]
}


function get_scales(obj) {
    
    w = parseFloat($(obj).css("width"));
    h = parseFloat($(obj).css("height"));
    m = 35;

    xrange = d3.select(obj).select("svg")
        .attr("xrange")
        .split(",");
    yrange = d3.select(obj).select("svg")
        .attr("yrange")
        .split(",");

    xrange[0] = parseFloat(xrange[0]);
    xrange[1] = parseFloat(xrange[1]);
    yrange[0] = parseFloat(yrange[0]);
    yrange[1] = parseFloat(yrange[1]);

    x = d3.scale
        .linear()
        .domain(xrange)
        .range([m, w-m]);
    y = d3.scale
        .linear()
        .domain(yrange)
        .range([m, h-m]);

    return {x: x, y: y}
}


function draw_axes(obj, xrange, yrange) {

    nx = 10;
    ny = 5;

    d3.select(obj).select("svg")
/*        .transition()
        .duration(500)
        .style("opacity", 0)*/
        .remove();
    
    vis = d3.select(obj)
        .append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("xrange", xrange)
        .attr("yrange", yrange)

    scales = get_scales(obj);
    x = scales.x;
    y = scales.y;

    g = vis.append("svg:g")
        .attr("transform", "translate(0, "+h+")");

    g.append("svg:line")
        .attr("x1", x(xrange[0]))
        .attr("y1", -1 * y(0))
        .attr("x2", x(xrange[1]))
        .attr("y2", -1 * y(0))
        .attr("class", "axis")

    g.append("svg:line")
        .attr("x1", x(0))
        .attr("y1", -1 * y(yrange[0]))
        .attr("x2", x(0))
        .attr("y2", -1 * y(yrange[1]))
        .attr("class", "axis")

    g.selectAll(".xLabel")
        .data(x.ticks(nx))
        .enter()
        .append("svg:text")
        .attr("class", "xLabel")
        .text(String)
        .attr("x", function(d) { return x(d) })
        .attr("y", -1 * y(0) + 20)
        .attr("text-anchor", "middle")
    
    g.selectAll(".yLabel")
        .data(y.ticks(ny))
        .enter()
        .append("svg:text")
        .attr("class", "yLabel")
        .text(String)
        .attr("x", 10)
        .attr("y", function(d) { return -1 * y(d) })
        .attr("text-anchor", "right")
        .attr("dy", 4)

    g.selectAll(".xTicks")
        .data(x.ticks(nx))
        .enter()
        .append("svg:line")
        .attr("class", "xTicks")
        .attr("x1", function(d) { return x(d); })
        .attr("y1", -1 * y(0))
        .attr("x2", function(d) { return x(d); })
        .attr("y2", -1 * y(0) + 5)

    g.selectAll(".yTicks")
        .data(y.ticks(ny))
        .enter()
        .append("svg:line")
        .attr("class", "yTicks")
        .attr("y1", function(d) { return -1 * y(d); })
        .attr("x1", m-5)
        .attr("y2", function(d) { return -1 * y(d); })
        .attr("x2", m)
}


function add_title(obj, title) {
    $(obj)
        .append(
            $("<div />")
                .addClass("title")
                .text(title))
}


function plot(obj, x, data) {

    o = d3.select(obj).select("svg");

    scales = get_scales(obj);
    sx = scales.x;
    sy = scales.y;    

    var line = d3.svg.line()
        .x(function(d,i) { return sx(x[i] / 3600 / 24); })
        .y(function(d) { return -1 * sy(d); })

    o.select("g")
        .append("svg:path")
        .attr("d", line(data));
}
