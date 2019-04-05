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
    let cosPhi = -1*math.dot(ray.direction, normal)
    let sin2Phi = math.pow(n1/n2,2)*(1-math.pow(cosPhi, 2))

    let result = math.add(math.multiply((n1/n2),ray.direction) , math.multiply((math.subtract((n1/n2)*cosPhi,math.sqrt(1-sin2Phi))),normal));
    return result
}

function solveLens(ray, r1, position1, r2, position2, n1, n2)
{
    let circle1 = new Circle(position1, r1)
    let circle2 = new Circle(position2, r2)
    // Solve intersection with r1 => take the first position (the closer)
    let pointAtFirstCircle = calculateCollisionRay2Circle(ray, circle1)[0]
    // If ray doesnt intersect the len, then continue to infinity
    if ((pointAtFirstCircle) == null) 
        return new Ray(ray.position+ray.direction*1000,ray.direction)
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
    normal = getCircleNormalFromPoint(pointOutside, circle2)

    // Refract at second interface => flip normal
    newDirection = refractIncidenceRay(rayAtSecondInterface, normal, n2,n1)

    // Now, newDirection is the direction of the ray going out of the lens and rayAtSecondInterface
    // is its position
    let result = new Ray(rayAtSecondInterface.position,newDirection)
    // Debug:
    console.log("Lens debug:")
    console.log("Ray at circle\t\t\t" + JSON.stringify(rayAtCircle))
    console.log("Ray starting inside\t\t"+JSON.stringify(rayStartingAtFirstInterface))
    console.log("Ray coming at the second\t" + JSON.stringify(rayAtSecondInterface))
    console.log("Result: \t\t\t" + JSON.stringify(result))
}


function simulateSpreading(ray, stopAtPositionX)
{
    if( ray.position[2] < stopAtPositionX)
    {
        delta = (stopAtPositionX - ray.position[0])/ray.direction[0]
        return Ray(ray.position + delta*ray.direction,ray.direction)
    }
    return ray
}


console.log(solveLens(new Ray([2, 0, 0], [1, 0, 0]), 1.0, [1.0,0.0,0.0], 1.0, [1.0,0.0,0.0], 1.0, 1.3))
