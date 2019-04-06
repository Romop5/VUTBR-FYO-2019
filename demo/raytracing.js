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
    result = simulateSpreading(result, 10);
    // Debug:
    console.log("Lens debug:")
    console.log("Ray at circle\t\t\t" + JSON.stringify(rayAtCircle))
    console.log("Ray starting inside\t\t"+JSON.stringify(rayStartingAtFirstInterface))
    console.log("Ray coming at the second\t" + JSON.stringify(rayAtSecondInterface))
    console.log("Result: \t\t\t" + JSON.stringify(result))

    return {"positions": [ray.position, rayAtCircle.position, rayAtSecondInterface.position, math.add(result.position,math.multiply(2,result.direction))],
        "resultRay": result}
}


function drawPath(color, positions,container)
{
    positions = math.multiply(positions, 200.0) 
    console.log(JSON.stringify(positions))
    var realPath = new PIXI.Graphics();
    var dots = new PIXI.Graphics();

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

function generateRayAngles(rayCount)
{
    let offsets = math.multiply([...Array(rayCount).keys()],1/rayCount).concat(math.multiply([...Array(rayCount).keys()],-1/rayCount))
    return offsets
}

/*
 * Draw scene 
 */
function drawScene(stage, parameters, app)
{
    var cont = new PIXI.Container()
    //cont.setPIXI.Matrix().translate(50,50)
    cont.setTransform(0,app.screen.height/2, 0.0,0.0, 0.0, 0.0, 0.0, 0.0,0.0) 
    stage.addChild(cont)
    let offsetsList = generateRayAngles(parameters["raysCount"])

    let maximumX = -1000
    let minimumX = 1000
    // For each angle / ray
    offsetsList.forEach( function (offsets) {
        // Determine position of lens's curves
        let position1 = [parameters["position1"], 0,0]
        let position2 = [parameters["position2"], 0,0]

        let rayStartingPosition = [parameters["rayX"], parameters["rayY"],0]

        let inputRay = new Ray(math.add(rayStartingPosition,[0, offsets, 0]), [1,0,0])
        let colorRG = [1,1,1]
        // if rays are omnidirectional
        if(parameters["shouldBeSource"] > 0)
        {
            // then calculate direction vector according to angle
            let angleConstant = 30
            let angleInRadians = degreeToRad(offsets*angleConstant)
            inputRay = new Ray(rayStartingPosition, normalize([math.cos(angleInRadians),math.sin(angleInRadians),0]))
            colorRG = math.multiply(inputRay.direction,3.0)
        } else {
            // if rays are parallel, then just set color according to distance to optical axis
            let maximum = math.max(...offsetsList)
            let paramT = math.abs(offsets)/maximum;
            colorRG = math.add(math.multiply(paramT, [1,0,0]),math.multiply(1.0-paramT, [0,1.0,1.0]))
            inputRay.direction = normalize([math.cos(degreeToRad(parameters["anglebeta"])), math.sin(degreeToRad(parameters["anglebeta"])), 0.0])
        }

        let color = PIXI.utils.rgb2hex(colorRG)

        try {
            // Calculate the path of ray passing through the optical system
            let rayPathData = solveLens(...[inputRay, parameters["radiusr1"], position1, parameters["radiusr2"], position2, 1.0, parameters["refraction"]])

            // Detect z intersection
            
            let resultRay = rayPathData["resultRay"]
            let paramterT = -resultRay.position[1]/resultRay.direction[1]
            let intersectionPosition = math.add(resultRay.position, math.multiply(paramterT,resultRay.direction))
            if(intersectionPosition[0] > 0 && intersectionPosition[0] < 10)
            {
                console.log("Intersection " + intersectionPosition)
                maximumX = math.max(maximumX, intersectionPosition[0])
                minimumX = math.min(minimumX, intersectionPosition[0])
            }
            // Draw the path
            drawPath(color,rayPathData.positions,cont)
        } catch(err)
        {
        }
    });

    if(parameters["markSphericalAberration"] > 0)
    {
        // Mark aberration
        console.log("Max/min " + maximumX + " - " + minimumX)
        drawPath(0x00ff00,[[minimumX,0.3,0],[maximumX, 0.3,0]],cont)

        let textObject = new PIXI.Text('Aberration',{fontFamily : 'Arial', fontSize: 24, fill : 0x00ff00, align : 'center'});
        textObject.position.x = 200*minimumX
        textObject.position.y = 200*0.3
        cont.addChild(textObject)
    }

    if(parameters["showLens"] > 0.1)
    {
        drawLens(cont, parameters["position1"], parameters["radiusr1"], 90,270)
        drawLens(cont, parameters["position2"], parameters["radiusr2"], 270,90+360)
    }
}

let dataFloatMembers = ["refraction", "raysCount", "radiusr1", "radiusr2", "position1", "position2", "showLens", "shouldBeSource", "rayX","rayY", "markSphericalAberration", "anglebeta"]

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
defaultParameters["rayX"] = 0;
defaultParameters["rayY"] = 0;
defaultParameters["markSphericalAberration"] = 1
defaultParameters["anglebeta"] = 0

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

function toggleCheckbox(node)
{
    if(node.checked == false) {
        node.checked = true;
    }
    else {
        if(node.checked == true) {
            node.checked = false;
         }
    }
}
window.addEventListener("keydown", function (e) {
    console.log(e)
    if(e["key"] == "m")
        toggleCheckbox(document.getElementById("markSphericalAberration"))
    if(e["key"] == "p")
        toggleCheckbox(document.getElementById("shouldBeSource"))
    if(e["key"] == "c")
        toggleCheckbox(document.getElementById("showLens"))
    if(e["key"] == "f")
    {
        isFullscreen = !isFullscreen
        if(isFullscreen == true)
            app.renderer.resize(window.innerWidth, window.innerHeight)
        else
            app.renderer.resize(window.innerWidth, window.innerHeight/2.0)
    }
    renderWithUserArguments()
});

