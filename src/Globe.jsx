import React from "react";
import * as d3 from "d3";
import d3GeoZoom from "d3-geo-zoom";
import d3Tip from "d3-tip";
import * as topojson from "topojson";
import "./Globe.css";

const width = 1366;
const height = 768;
const config = {
  speed: -0.005,
  verticalTilt: -15,
  horizontalTilt: 0
};

class Globe extends React.Component {
  componentDidMount() {
    const loadLand = d3.json(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"
    );
    const loadLocations = d3.json("locations.json");

    Promise.all([loadLand, loadLocations]).then(([land, locations]) =>
      this.drawGlobe(land, locations)
    );
  }

  drawGlobe(land, locations) {
    const center = [width / 2, height / 2];
    const initialScale = Math.min(width, height) / 2.1;

    const projection = d3
      .geoOrthographic()
      .scale(initialScale)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const svg = d3
      .select(this.refs.canvas)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3Tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(d => `<span>${d.tag}</span>`);

    svg.call(tooltip);

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
      .data(topojson.feature(land, land.objects.land).features)
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
      /**
       * Redraw water, land and markers, and stop spin if user panned/zoomed.
       */
      if (onMove) timer.stop();
      svg.selectAll("path").attr("d", path);
      svg
        .select("circle")
        .attr("r", projection.scale())
        .style("fill", "#bfd7e4");
      const markers = markerGroup.selectAll("circle").data(locations);
      markers
        .enter()
        .append("circle")
        .merge(markers)
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", 3)
        .attr("class", "marker")
        .style("fill", d =>
          isVisibleInGlobe(d, projection, center) ? "none" : "crimson"
        )
        .style("stroke", d =>
          isVisibleInGlobe(d, projection, center) ? "none" : "crimson"
        )
        .on("mouseover", tooltip.show)
        .on("mouseout", tooltip.hide);
    }
  }

  render() {
    return <div ref="canvas" />;
  }
}

function isVisibleInGlobe(dataPoint, projection, center) {
  return (
    d3.geoDistance(
      [dataPoint.longitude, dataPoint.latitude],
      projection.invert(center)
    ) > 1.45
  );
}

export default Globe;
