const url = 'https://forecast.weather.gov/MapClick.php?lat=42.2002&lon=-71.4242&FcstType=digitalDWML';

async function fetchData() {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        const timeLayout = xmlDoc.querySelector('time-layout');
        const startTimes = Array.from(timeLayout.querySelectorAll('start-valid-time')).map(el => new Date(el.textContent));

        const tempValues = Array.from(xmlDoc.querySelector('temperature[type="hourly"]').querySelectorAll('value')).map(el => +el.textContent);

        const data = startTimes.map((time, i) => ({ time, temp: tempValues[i] }));

        renderGraph(data);
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
    }
}

function renderGraph(data) {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Clear any existing SVG
    d3.select("#graph-container").selectAll("*").remove();

    const container = d3.select("#graph-container").node();
    const width = container.getBoundingClientRect().width - margin.left - margin.right;
    const height = (window.innerHeight - 40) - margin.top - margin.bottom;

    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.time))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(d => x(d.time))
            .y(d => y(d.temp))
        );

    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .text("Time");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .text("Temperature (°F)");
}

document.addEventListener('DOMContentLoaded', fetchData);
window.addEventListener('resize', () => {
    // We would need the data again to re-render,
    // but for simplicity and following minimum requirements,
    // let's just fetch it again or store it.
    // Re-fetching is easier for now.
    fetchData();
});
