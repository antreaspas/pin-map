import React from "react";
import * as d3 from "d3";
import d3GeoZoom from "d3-geo-zoom";
import * as topojson from "topojson";

const width = 960;
const height = 500;
const config = {
  speed: -0.005,
  verticalTilt: -15,
  horizontalTilt: 0
};
class Chart extends React.Component {
  componentDidMount() {
    const loadCountries10m = d3.json("countries-10m.json");
    const loadCountries50m = d3.json("countries-50m.json");
    const loadCountries110m = d3.json("countries-110m.json");
    const loadLocations = d3.json("locations.json");

    Promise.all([
      loadCountries10m,
      loadCountries50m,
      loadCountries110m,
      loadLocations
    ]).then(([countries10m, countries50m, countries110m, locations]) =>
      this.draw(countries10m, countries50m, countries110m, locations)
    );
  }

  draw(countries10m, countries50m, countries110m, locations) {
    const center = [width / 2, height / 2];

    const svg = d3
      .select(this.refs.canvas)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const scl = Math.min(width, height) / 2.1;

    const projection = d3
      .geoOrthographic()
      .scale(scl)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Add water
    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .style("fill", "#bfd7e4");

    // Add land with country boundaries
    svg
      .selectAll("path")
      .data(
        topojson.feature(countries110m, countries110m.objects.countries)
          .features
      )
      .enter()
      .append("path")
      .attr("class", "path")
      .attr("d", path)
      .style("stroke", "#888")
      .style("stroke-width", "1.5px")
      .style("fill", () => "#f5dfa4")
      .style("opacity", ".6");

      const markerGroup = svg.append("g");

      const timer = d3.timer(elapsed => {
        projection.rotate([
          config.speed * elapsed - 240,
          config.verticalTilt,
          config.horizontalTilt
        ]);
        render();
      });

    // Add zoom & pan
    d3GeoZoom()
      .projection(projection)
      .northUp(true)
      .onMove(render)(svg.node());


    const tooltip = svg
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    function drawMarkers() {
      const markers = markerGroup.selectAll("circle").data(locations);
      markers
        .enter()
        .append("circle")
        .merge(markers)
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("fill", d => {
          const coordinate = [d.longitude, d.latitude];
          const gdistance = d3.geoDistance(
            coordinate,
            projection.invert(center)
          );
          return gdistance > 1.57 ? "none" : "steelblue";
        })
        .attr("r", 5)
        .on("mouseover", function(d) {    
          tooltip.transition()    
          .duration(200)    
          .style("opacity", .9);    
          tooltip.html("Employee count: " + d.count)  
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px");  
        })          
        .on("mouseout", function(d) {   
          tooltip.transition()    
          .duration(500)    
          .style("opacity", 0); 
        });

      markerGroup.each(function() {
        this.parentNode.appendChild(this);
      });
    }

    function render(onMove = false) {
      if (onMove) timer.stop();
      svg.selectAll("path").attr("d", path);
      svg
        .select("circle")
        .attr("r", projection.scale())
        .style("fill", "#bfd7e4");
      drawMarkers();
    }

    drawMarkers();
  }

  render() {
    return <div ref="canvas" />;
  }
}

export default Chart;
