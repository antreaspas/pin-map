import React from "react";
import * as d3 from "d3";
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
    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"),
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json"),
      d3.json(`${process.env.REACT_APP_S3_OUTPUT_URL}/locations.json`)
    ]).then(([lowResLand, highResLand, locations]) =>
      this.drawGlobe(
        loadLandTopoJson(lowResLand),
        loadLandTopoJson(highResLand),
        locations
      )
    );
  }

  drawGlobe(lowResLand, highResLand, locations) {
    let moving = true;
    let stoppedSpinning = false;
    const center = [width / 2, height / 2];
    const initialScale = Math.min(width, height) / 2.1;

    const projection = d3
      .geoOrthographic()
      .scale(initialScale)
      .translate([width / 2, height / 2]);
    const geoPath = d3.geoPath().projection(projection);

    const svg = d3
      .select(this.refs.canvas)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    let rotate0, coords0;
    const coords = () =>
      projection.rotate(rotate0).invert([d3.event.x, d3.event.y]);

    const tooltip = d3Tip()
      .attr("class", "d3-tip")
      .offset([-15, 0])
      .html(d => `<span>${d.tag}</span>`);

    svg
      .call(
        d3
          .drag()
          .on("start", () => {
            rotate0 = projection.rotate();
            coords0 = coords();
            moving = true;
          })
          .on("drag", () => {
            const coords1 = coords();
            projection.rotate([
              rotate0[0] + coords1[0] - coords0[0],
              rotate0[1] + coords1[1] - coords0[1]
            ]);
            draw(true);
          })
          .on("end", () => {
            moving = false;
            draw(true);
          })
      )
      .call(
        d3
          .zoom()
          .scaleExtent([1, 70])
          .on("zoom", () => {
            projection.scale(initialScale * d3.event.transform.k);
            draw(true);
          })
          .on("start", () => {
            moving = true;
          })
          .on("end", () => {
            moving = false;
            draw(true);
          })
      )
      .call(tooltip);

    // Add water
    svg
      .append("circle")
      .attr("class", "water")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .style("fill", "#bfd7e4");

    // Add land with country boundaries
    const path = svg
      .append("path")
      .style("stroke", "#888")
      .style("stroke-width", "1.5px")
      .style("fill", () => "#f5dfa4")
      .style("opacity", ".6");

    const markerGroup = svg.append("g");

    // Add globe spin
    let totalElapsedTime = 0;
    let startTime = d3.now();
    const timer = d3.timer(timerCallback);

    function timerCallback() {
      projection.rotate([
        config.speed * (d3.now() - startTime) - 240,
        config.verticalTilt,
        config.horizontalTilt
      ]);
      draw();
    }

    function draw(onMove = false) {
      /**
       * Redraw water, land and markers, and stop spin if user panned/zoomed.
       */
      if (onMove) {
        timer.stop();
        stoppedSpinning = true;
      }
      path.data(moving ? lowResLand : highResLand).attr("d", geoPath);
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
        .attr("r", 4)
        .attr("class", "marker")
        .style("fill", d =>
          isVisibleInGlobe(d, projection, center) ? "none" : "crimson"
        )
        .style("stroke", d =>
          isVisibleInGlobe(d, projection, center) ? "none" : "crimson"
        )
        .on("mouseover", function(d) {
          if (d.tag) tooltip.show(d, this);
          if (!stoppedSpinning) {
            totalElapsedTime = d3.now() - startTime;
            timer.stop();
          }
        })
        .on("mouseout", function(d) {
          if (d.tag) tooltip.hide(d, this);
          if (!stoppedSpinning) {
            startTime = d3.now() - totalElapsedTime;
            timer.restart(timerCallback);
          }
        });
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

function loadLandTopoJson(data) {
  return topojson.feature(data, data.objects.land).features;
}

export default Globe;
