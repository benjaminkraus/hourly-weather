const url = 'https://forecast.weather.gov/MapClick.php?lat=42.2002&lon=-71.4242&FcstType=digitalDWML';
let weatherData = null;
let svg, g, x, y, line, xAxis, yAxis, xGrid, yGrid, xLabel, yLabel;
const margin = { top: 20, right: 30, bottom: 40, left: 40 };

async function fetchData() {
    try {
        console.log('Fetching weather data...');
        const response = await fetch(url);
        const text = await response.text();
        console.log('Weather data fetched.');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        const timeLayout = xmlDoc.querySelector('time-layout');
        const startTimes = Array.from(timeLayout.querySelectorAll('start-valid-time')).map(el => new Date(el.textContent));

        const tempValues = Array.from(xmlDoc.querySelector('temperature[type="hourly"]').querySelectorAll('value')).map(el => +el.textContent);

        weatherData = startTimes.map((time, i) => ({ time, temp: tempValues[i] }));

        initGraph();
        updateGraph();
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
    }
}

function initGraph() {
    // Clear any existing SVG
    d3.select("#graph-container").selectAll("*").remove();

    svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", "100%");

    g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    x = d3.scaleTime();
    y = d3.scaleLinear();

    xGrid = g.append("g")
        .attr("class", "grid");
    yGrid = g.append("g")
        .attr("class", "grid");

    xAxis = g.append("g");
    yAxis = g.append("g");

    line = g.append("path")
        .attr("class", "line");

    xLabel = g.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .text("Time");

    yLabel = g.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Temperature (°F)");
}

function updateGraph() {
    if (!weatherData) return;

    const container = d3.select("#graph-container").node();
    const width = container.getBoundingClientRect().width - margin.left - margin.right;
    const height = (window.innerHeight - 40) - margin.top - margin.bottom;

    svg.attr("height", height + margin.top + margin.bottom);

    x.domain(d3.extent(weatherData, d => d.time))
     .range([0, width]);

    y.domain([d3.min(weatherData, d => d.temp) - 5, d3.max(weatherData, d => d.temp) + 5])
     .range([height, 0]);

    const xTicks = Math.max(2, width / 80);
    xAxis.attr("transform", `translate(0,${height})`)
         .call(d3.axisBottom(x).ticks(xTicks));

    yAxis.call(d3.axisLeft(y));

    xGrid.attr("transform", `translate(0,${height})`)
         .call(d3.axisBottom(x)
             .ticks(xTicks)
             .tickSize(-height)
             .tickFormat("")
         );

    yGrid.call(d3.axisLeft(y)
             .tickSize(-width)
             .tickFormat("")
         );

    const lineGenerator = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.temp));

    line.datum(weatherData)
        .attr("d", lineGenerator);

    xLabel.attr("x", width / 2)
          .attr("y", height + margin.bottom - 5);

    yLabel.attr("y", -margin.left + 15)
          .attr("x", -height / 2);
}

document.addEventListener('DOMContentLoaded', fetchData);
window.addEventListener('resize', updateGraph);
