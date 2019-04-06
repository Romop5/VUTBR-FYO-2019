function Ray(pos, direction)
{
    this.position = pos;
    this.direction = direction;
}
function Circle(pos, radius)
{
    this.position = pos
    this.radius = radius
}

function calculateCollisionRay2Circle(ray, circle)
{
//Formula using https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
    let length = math.norm(ray.direction)
    let l = math.multiply(ray.direction,(1.0/length))
    let o = ray.position
    let c = circle.position
    let r = circle.radius

    let d = math.nan
    let sqrtMember = math.pow(math.dot(l, math.subtract(o,c)),2) - (math.pow((math.norm(math.subtract(o,c))),2) - math.pow(r,2))
    if (sqrtMember >= 0.0)
    {
        let d1 = -(math.dot(l,(math.subtract(o,c)))) - math.sqrt(sqrtMember);
        let d2 = -(math.dot(l,(math.subtract(o,c)))) + math.sqrt(sqrtMember);
        return [math.add(o,math.multiply(l,d1)), math.add(o,math.multiply(l,d2))]
    }
    // Return Null if intersection doesnt exist
    return null 
}

function normalize(vect)
{
    return math.multiply(vect,(1.0/math.norm(vect)))
}

function getCircleNormalFromPoint(point, circle)
{
    return normalize(math.subtract(point,circle.position))
}


function refractIncidenceRay(ray, normal, n1, n2)
{
    console.log("Refracting: " + n1 + " and " + n2)
    let cosPhi = -1*math.dot(ray.direction, normal)
    let sin2Phi = math.pow(n1/n2,2)*(1-math.pow(cosPhi, 2))

    let result = math.add(math.multiply((n1/n2),ray.direction) , math.multiply((math.subtract((n1/n2)*cosPhi,math.sqrt(1-sin2Phi))),normal));
    return result
}


function simulateSpreading(ray, stopAtPositionX)
{
    if( ray.position[2] < stopAtPositionX)
    {
        let delta = math.subtract(stopAtPositionX , ray.position[0])/ray.direction[0]
        return new Ray(math.add(ray.position , math.multiply(delta,ray.direction)),ray.direction)
    }
    return ray
}



function solveLens(ray, r1, position1, r2, position2, n1, n2)
{
    let circle1 = new Circle(position1, r1)
    let circle2 = new Circle(position2, r2)
    // Solve intersection with r1 => take the first position (the closer)
    let pointAtFirstCircle = calculateCollisionRay2Circle(ray, circle1)[0]
    // If ray doesnt intersect the len, then continue to infinity
    if ((pointAtFirstCircle) == null) 
        return [new Ray(ray.position+ray.direction*1000,ray.direction)]
    // Calculate normal -> take the first intersect (should be closer when approaching from left)
    let normal = getCircleNormalFromPoint(pointAtFirstCircle, circle1)

    // Now create the vector which represents how ray starts inside the lens 
    let rayAtCircle = new Ray(pointAtFirstCircle, ray.direction)
    // Refract at normal
    let newDirection = refractIncidenceRay(rayAtCircle, normal, n1,n2)

    // Now create the vector which represents how ray starts inside the lens 
    let rayStartingAtFirstInterface = new Ray(pointAtFirstCircle,newDirection)

    // Calculate the point going out of lens
    let pointOutside = calculateCollisionRay2Circle(rayStartingAtFirstInterface, circle2)[1]
    let rayAtSecondInterface = new Ray(pointOutside, newDirection)
    // Detect invalid len
    if(math.dot(newDirection, math.subtract(pointOutside, rayStartingAtFirstInterface.position)) < 0)
        return [new Ray(ray.position+ray.direction*1000,ray.direction)]

    normal = getCircleNormalFromPoint(pointOutside, circle2)
    console.log("circle 2 normal" + JSON.stringify(normal))

    // Refract at second interface => flip normal
    newDirection = refractIncidenceRay(rayAtSecondInterface, math.subtract([0,0,0],normal), n2,n1)

    // Now, newDirection is the direction of the ray going out of the lens and rayAtSecondInterface
    // is its position
    let result = new Ray(rayAtSecondInterface.position,newDirection)
    result = simulateSpreading(result, 4);
    // Debug:
    console.log("Lens debug:")
    console.log("Ray at circle\t\t\t" + JSON.stringify(rayAtCircle))
    console.log("Ray starting inside\t\t"+JSON.stringify(rayStartingAtFirstInterface))
    console.log("Ray coming at the second\t" + JSON.stringify(rayAtSecondInterface))
    console.log("Result: \t\t\t" + JSON.stringify(result))

    return [ray.position, rayAtCircle.position, rayAtSecondInterface.position, math.add(result.position,math.multiply(2,result.direction))]
}


function drawPath(args,container)
{
    let positions = solveLens(...args)
    positions = math.multiply(positions, 200.0) 
    console.log(JSON.stringify(positions))
    var realPath = new PIXI.Graphics();
    var dots = new PIXI.Graphics();

    let colorRG = math.multiply(args[0].direction,3.0)
    let color = PIXI.utils.rgb2hex(colorRG)
    realPath.lineStyle(1, color, 1);
    realPath.moveTo(...positions[0]);
    positions.forEach(function (position) {
        realPath.lineTo(...position);

        dots.beginFill(0xe74c3c); // Red
        dots.drawCircle(...position.slice(0,2), 2.0);
        dots.endFill();
    })

    container.addChild(realPath);
    container.addChild(dots)

}

function degreeToRad(deg)
{
    return (deg /360) * 2 * Math.PI
}

function drawLens(stage, position, radius, start,end)
{
    var arc = new PIXI.Graphics()

    console.log("drawLen" + position + " - " + radius)
    arc.lineStyle(1, 0xffffff, 1);
    arc.arc(position*200, 0.0, radius*200, degreeToRad(start), degreeToRad(end),false)
    stage.addChild(arc)
}

function drawAxis(stage)
{
    var axis = new PIXI.Graphics()
    axis.lineStyle(1, 0xffffff, 1);
    //axis.lineTo(

}

/*
 * Draw scene
 */
function drawScene(stage)
{
    var cont = new PIXI.Container()
    //cont.setPIXI.Matrix().translate(50,50)
    cont.setTransform(000,000, 0.0,0.0, 0.0, 0.0, 0.0, 0.0,0.0) 
    stage.addChild(cont)
    let angles = math.multiply([...Array(20).keys()],2).concat(math.multiply([...Array(20).keys()],-2))
    console.log(angles)

    angles.forEach( function (angles) {
        console.log(angles)
        angles = degreeToRad(angles)
        let vector = normalize([math.cos(angles),math.sin(angles), 0])
        console.log(angles + JSON.stringify(vector))
        try {
        drawPath([new Ray([-0.3, 0.0, 0], vector), 1.0, [2.0,0.0,0.0], 1.0, [0.2,0.0,0.0], 1.0, 1.5], cont)
        } catch(err)
        {
        }
    });
    //stage.addChild(cont)
    //stage.position = new PIXI.Point(1000,00)
}

function generateRayAngles(rayCount)
{
    let offsets = math.multiply([...Array(rayCount).keys()],1/rayCount).concat(math.multiply([...Array(rayCount).keys()],-1/rayCount))
    return offsets
}

/*
 * Draw scene = parallel
 */
function drawScene(stage, parameters, app)
{
    var cont = new PIXI.Container()
    //cont.setPIXI.Matrix().translate(50,50)
    cont.setTransform(0,app.screen.height/2, 0.0,0.0, 0.0, 0.0, 0.0, 0.0,0.0) 
    stage.addChild(cont)
    let offsets = generateRayAngles(parameters["raysCount"])
    offsets.forEach( function (offsets) {
        try {
        let position1 = [parameters["position1"], 0,0]
        let position2 = [parameters["position2"], 0,0]
        drawPath([new Ray([-0.5, offsets, 0], [1,0,0]), parameters["radiusr1"], position1, parameters["radiusr2"], position2, 1.0, parameters["refraction"]], cont)
        } catch(err)
        {
        }
    });
    if(parameters["showLens"] > 0.1)
    {
        drawLens(cont, parameters["position1"], parameters["radiusr1"], 90,270)
        drawLens(cont, parameters["position2"], parameters["radiusr2"], 270,90+360)
    }
    //stage.addChild(cont)
    //stage.position = new PIXI.Point(1000,00)
}

/*
 * Draw scene
 */
/*function drawScene(stage)
{
    var cont = new PIXI.Container()
    //cont.setPIXI.Matrix().translate(50,50)
    cont.setTransform(200,200, 0.0,0.0, 0.0, 0.0, 0.0, 0.0,0.0) 
    stage.addChild(cont)
    for(let i = 0; i < 10; i++)
    {
        drawPath([new Ray([-0.3, 0.0, 0], normalize([1.0,0.2,0.0])), 1.0, [2.0,0.0,0.0], 1.0, [0.2,0.0,0.0], 1.0, 1.5+i/100], cont)
    }
}
*/


let dataFloatMembers = ["refraction", "raysCount", "radiusr1", "radiusr2", "position1", "position2", "showLens"]

function getCurrentParameters()
{
    let data = {}
    dataFloatMembers.forEach( function (member) {
        let node = document.getElementById(member)
        if(node.getAttribute("type") == "checkbox")
        {
            data[member] = 0;
            if(node.checked == true)
                data[member] = 1;
        } else {
            data[member] = parseFloat(node.value)
        }
    });
    console.log(JSON.stringify(data))
    return data
}

function setParameters(data)
{
    let paramaters = dataFloatMembers
    for(var id in dataFloatMembers)
    {
        let member = dataFloatMembers[id]
        console.log("Finding member " + member)
        document.getElementById(member).value = data[member]
    }
}



var app = new PIXI.Application(window.innerWidth, 600, { antialias: true });
document.body.appendChild(app.view);


var defaultParameters = {}
defaultParameters["refraction"] = 1.5;
defaultParameters["raysCount"] = 10;
defaultParameters["radiusr1"] = 1;
defaultParameters["position1"] = 2;
defaultParameters["radiusr2"] = 1;
defaultParameters["position2"] = 2;

console.log(JSON.stringify(defaultParameters))

drawScene(app.stage, defaultParameters,app)
app.render();
app.stop()

function renderWithUserArguments()
{
    app.stage.removeChildren()
    console.log("Rendering user")
    app.renderer.clear();
    drawScene(app.stage, getCurrentParameters(), app)
    app.render()
    app.stop()
    
}

document.addEventListener("DOMContentLoaded", function(){
    // Fill the form with default parameters
    setParameters(defaultParameters)

    let allInputs = document.getElementsByTagName("input")
    for( var i = 0; i < allInputs.length; i++)
    {
        allInputs.item(i).addEventListener("input", renderWithUserArguments);
    }
});
window.addEventListener("resize", function (e) {
    app.renderer.resize(window.innerWidth, window.innerHeight/2.0)
    renderWithUserArguments()
    //app.resize()
});

var isFullscreen = false

window.addEventListener("keydown", function (e) {
    console.log(e)
    if(e["key"] == "f")
    {
        isFullscreen = !isFullscreen
        if(isFullscreen == true)
            app.renderer.resize(window.innerWidth, window.innerHeight)
        else
            app.renderer.resize(window.innerWidth, window.innerHeight/2.0)
        renderWithUserArguments()
    }
});

