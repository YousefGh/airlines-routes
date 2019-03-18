let store = {}
let mainView = document.getElementsByClassName('mainView')[0];
let loaders = document.getElementsByClassName('loaders')[0];
mainView.style.display = 'none';



function loadData() {
    return Promise.all([
        d3.csv("../routes.csv"),
        d3.json("../countries.geo.json"),
    ]).then(datasets => {
        store.routes = datasets[0];
        store.geoJSON = datasets[1]
        loaders.style.display = 'none';
        mainView.style.display = 'flex';
        return store;
    });
}

// week 4
function drawRoutes(airlineID) {
    let routes = store.routes;
    let projection = store.mapProjection;
    let container = d3.select('#Map');
    let selectedRoutes = routes.filter(d => d.AirlineID == airlineID);
    let bindedData = container.selectAll("line")
        .data(selectedRoutes, d => d.ID);

    bindedData.enter().append('line')
        .attr('x1', d => projection([+d.SourceLongitude, +d.SourceLatitude])[0])
        .attr('y1', d => projection([+d.SourceLongitude, +d.SourceLatitude])[1])
        .attr('x2', d => projection([+d.DestLongitude, +d.DestLatitude])[0])
        .attr('y2', d => projection([+d.DestLongitude, +d.DestLatitude])[1])
        .attr('stroke', '#AD0535')
        .attr('opacity', 0.1);
    bindedData.exit().remove();
}



// Week 3 - 2
function groupByAirport(data) {
    let result = data.reduce((result, d) => {

        let currentDest = result[d.DestAirportID] || {
            "AirportID": d.DestAirportID,
            "Airport": d.DestAirport,
            "Latitude": +d.DestLatitude,
            "Longitude": +d.DestLongitude,
            "City": d.DestCity,
            "Country": d.DestCountry,
            "Count": 0
        }
        currentDest.Count += 1
        result[d.DestAirportID] = currentDest

        //After doing for the destination airport, we also update the airport the airplane is departing from.
        let currentSource = result[d.SourceAirportID] || {
            "AirportID": d.SourceAirportID,
            "Airport": d.SourceAirport,
            "Latitude": +d.SourceLatitude,
            "Longitude": +d.SourceLongitude,
            "City": d.SourceCity,
            "Country": d.SourceCountry,
            "Count": 0
        }
        currentSource.Count += 1
        result[d.SourceAirportID] = currentSource

        return result
    }, {})

    //We map the keys to the actual ariorts, this is an way to transform the object we got in the previous step into a list.
    result = Object.keys(result).map(key => result[key])
    return result
}

function drawAirports(airports) {
    let config = getMapConfig(); //get the config
    let projection = getMapProjection(config) //get the projection
    let container = config.container; //get the container

    let circles = container.selectAll("circle")
        .data(airports)
        .enter().append('circle')
        .attr('r', 1)
        .attr('cx', d => projection([+d.Longitude, +d.Latitude])[0])
        .attr('cy', d => projection([+d.Longitude, +d.Latitude])[1])
        .attr('fill', '#2176FF');
}

// Week 3 - 1
function getMapConfig() {
    // document.getElementById("#Map").style.width.slice(0,-2)
    let width = 900;
    let height = 450;
    let container = d3.select('#Map');
    container.attr('width', width).attr('height', height);
    return {
        width,
        height,
        container
    }
}

function getMapProjection(config) {
    let {
        width,
        height
    } = config;
    let projection = d3.geoMercator()
    projection.scale(150)
        .translate([width / 2, height / 2 + 20])

    store.mapProjection = projection;
    return projection;
}

function drawBaseMap(container, countries, projection) {
    let path = d3.geoPath().projection(projection);

    container.selectAll("path").data(countries)
        .enter().append("path")
        .attr("d", (d) => path(d))
        .attr("stroke", "#ccc")
        .attr("fill", "#eee")
}

function drawMap(geoJeon) {
    let config = getMapConfig();
    let projection = getMapProjection(config)
    drawBaseMap(config.container, geoJeon.features, projection)
}

// week 1 and 2
function groupByAirline(data) {
    //Iterate over each route, producing a dictionary where the keys is are the ailines ids and the values are the information of the airline.
    let result = data.reduce((result, d) => {

        let currentData = result[d.AirlineID] || {
            "AirlineID": d.AirlineID,
            "AirlineName": d.AirlineName,
            "Count": 0
        }

        currentData.Count += 1 ;

        result[d.AirlineID] = currentData;

        return result;

    }, {})

    //We use this to convert the dictionary produced by the code above, into a list, that will make it easier to create the visualization. 
    result = Object.keys(result).map(key => result[key])
    result = result.sort((a, b) => d3.descending(a.Count, b.Count)) //TODO
    return result
}

function showData() {
    //Get the routes from our store variable
    let routes = store.routes
    // Compute the number of routes per airline.
    let airlines = groupByAirline(store.routes);
    drawAirlinesChart(airlines)
    drawMap(store.geoJSON)

    let airports = groupByAirport(store.routes);
    drawAirports(airports)

    drawRoutes("24") // <- add this line
}

function drawAirlinesChart(airlines) {
    let config = getAirlinesChartConfig();
    let scales = getAirlinesChartScales(airlines, config);
    drawBarsAirlinesChart(airlines, scales, config);
    drawAxesAirlinesChart(airlines, scales, config);
}

function getAirlinesChartConfig() {
    let width = 500;
    let height = 450;
    let margin = {
        top: 10,
        bottom: 50,
        left: 170,
        right: 10
    }
    //The body is the are that will be occupied by the bars.
    let bodyHeight = height - margin.top - margin.bottom;
    let bodyWidth = width - margin.left - margin.right;

    //The container is the SVG where we will draw the chart. In our HTML is the svg tah with the id AirlinesChart
    let container = d3.select('#AirlinesChart');
    container
        .attr("width", width)
        .attr('height', height);

    return {
        width,
        height,
        margin,
        bodyHeight,
        bodyWidth,
        container
    }
}

function getAirlinesChartScales(airlines, config) {
    let {
        bodyWidth,
        bodyHeight
    } = config;
    let maximunCount = d3.max(airlines, (d) => d.Count)

    let xScale = d3.scaleLinear().range([0, bodyWidth]).domain([0, maximunCount])

    let yScale = d3.scaleBand()
        .range([0, bodyHeight])
        .domain(airlines.map(a => a.AirlineName)) //The domain is the list of ailines names
        .padding(0.3)

    return {
        xScale,
        yScale
    }
}

function drawBarsAirlinesChart(airlines, scales, config) {
    let {
        margin,
        container
    } = config; // this is equivalent to 'let margin = config.margin; let container = config.container'
    let {
        xScale,
        yScale
    } = scales
    let body = container.append("g")
        .style("transform",
            `translate(${margin.left}px,${margin.top}px)`
        )

    let bars = body.selectAll(".bar").data(airlines)

    body.append("text").text('Number of Routes').attr('fill', 'white').style("transform",
    `translate(90px, 432px)`
)

    //Adding a rect tag for each airline
    bars.enter().append("rect")
        .attr("height", yScale.bandwidth())
        .attr("y", (d) => yScale(d.AirlineName))
        .attr('width', (d) => xScale(d.Count))
        .attr("fill", "#f2f2f2").attr('style', 'cursor: pointer')
        .on("mouseenter", function (d) { // <- this is the new code
            drawRoutes(d.AirlineID)
            d3.select(this).attr('fill', '#AD0535');

        })
        .on("mouseleave", function (d) { // <- this is the new code
            drawRoutes(null)
            d3.select(this).attr('fill', '#f2f2f2');

        })
}

function drawAxesAirlinesChart(airlines, scales, config) {
    let {
        xScale,
        yScale
    } = scales
    let {
        container,
        margin,
        height
    } = config;
    let axisX = d3.axisBottom(xScale)
        .ticks(5)

    container.append("g")
        .style("transform",
            `translate(${margin.left}px,${height - margin.bottom}px)`
        )
        .call(axisX)

    let axisY = d3.axisLeft(yScale)
    container.append("g")
        .style("transform",
            `translate(${margin.left}px,${margin.top}px)`
        ).style('stroke', 'none')
        .call(axisY);
    container.selectAll('text').style('fill', 'white').style("font", "14px Arial")
}

loadData().then(showData);