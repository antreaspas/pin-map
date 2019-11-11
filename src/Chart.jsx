import React from "react";
import * as d3 from "d3";
import d3GeoZoom from "d3-geo-zoom";
import * as topojson from "topojson";
import "./Chart.css";

const width = 1366;
const height = 768;
const config = {
  speed: -0.005,
  verticalTilt: -15,
  horizontalTilt: 0
};
class Chart extends React.Component {
  componentDidMount() {
    const loadCountries110m = d3.json("countries-110m.json");
    const loadLocations = d3.json("locations.json");

    Promise.all([loadCountries110m, loadLocations]).then(
      ([countries, locations]) => this.drawGlobe(countries, locations)
    );
  }

  drawGlobe(countries, locations) {
    const center = [width / 2, height / 2];

    const svg = d3
      .select(this.refs.canvas)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const scl = Math.min(width, height) / 2.1;

    const projection = d3
      .geoOrthographic()
      .scale(scl)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Add water
    svg
      .append("circle")
      .attr("class", "water")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .style("fill", "#bfd7e4");

    // Add land with country boundaries
    svg
      .selectAll("path")
      .data(topojson.feature(countries, countries.objects.countries).features)
      .enter()
      .append("path")
      .attr("class", "path")
      .attr("d", path)
      .style("stroke", "#888")
      .style("stroke-width", "1.5px")
      .style("fill", () => "#f5dfa4")
      .style("opacity", ".6");

    const markerGroup = svg.append("g");

    // Add globe spin
    const timer = d3.timer(elapsed => {
      projection.rotate([
        config.speed * elapsed - 240,
        config.verticalTilt,
        config.horizontalTilt
      ]);
      draw();
    });

    // Add zoom & pan
    d3GeoZoom()
      .projection(projection)
      .northUp(true)
      .onMove(draw)(svg.node());

    function draw(onMove = false) {
      if (onMove) timer.stop();
      svg.selectAll("path").attr("d", path);
      svg
        .select("circle")
        .attr("r", projection.scale())
        .style("fill", "#bfd7e4");
      drawMarkers();
    }

    function drawMarkers() {
      const markers = markerGroup.selectAll("circle").data(locations);
      markers
        .enter()
        .append("circle")
        .merge(markers)
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", 6)
        .attr("class", "marker")
        .attr("fill", d => {
          const coordinate = [d.longitude, d.latitude];
          const gdistance = d3.geoDistance(
            coordinate,
            projection.invert(center)
          );
          return gdistance > 1.45 ? "none" : "steelblue";
        })
        .on("mouseover", function(d) {
          tooltip
            .transition()
            .duration(200)
            .style("opacity", 0.9);
          tooltip
            .html("Employees: " + d.count)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", function(d) {
          tooltip
            .transition()
            .duration(500)
            .style("opacity", 0);
        });
    }
  }

  render() {
    return <div ref="canvas" />;
  }
}

export default Chart;
