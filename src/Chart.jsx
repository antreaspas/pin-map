import React from "react";
import * as d3 from "d3";
import * as topojson from "topojson";

const width = 960;
const height = 500;
const config = {
  speed: 0.005,
  verticalTilt: -15,
  horizontalTilt: 0
};

class Chart extends React.Component {
  componentDidMount() {
    const loadCountries10m = d3.json("countries-10m.json");
    const loadCountries50m = d3.json("countries-50m.json");
    const loadCountries110m = d3.json("countries-110m.json");
    const loadLocations = d3.json("locations.json");

    Promise.all([loadCountries10m, loadCountries50m, loadCountries110m, loadLocations]).then(
      ([countries10m, countries50m, countries110m, locations]) =>
        this.draw(countries10m, countries50m, countries110m, locations)
    );
  }

  draw(countries10m, countries50m, countries110m, locations) {
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

    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .style("fill", "#bfd7e4");

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

    d3.timer(elapsed => {
      projection.rotate([
        config.speed * elapsed - 240,
        config.verticalTilt,
        config.horizontalTilt
      ]);
      svg.selectAll("path").attr("d", path);
    });
  }

  render() {
    return <div ref="canvas" />;
  }
}

export default Chart;
