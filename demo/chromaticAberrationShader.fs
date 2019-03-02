vec2 getPos(vec2 centerUV,float R, float D)
{
    vec2 x = sqrt(pow(vec2(R),vec2(2.0))-pow(centerUV,vec2(2.0)));
    
    //vec2 alpha = acos(centerUV/vec2(R));
    //vec2 x = sin(alpha)*vec2(R);
    vec2 ycomma = (vec2(D)/x)*centerUV;
    return ycomma;
}

vec2 getColorUV(vec2 uv, float R, float D, float lambda)
{
    vec2 centerUV = (uv-vec2(0.5));
    vec2 offset = getPos(centerUV,1.0+lambda,0.86);
    float h = 0.5;
    offset *= (1.0/vec2(h))*(0.5);
    
    offset += -centerUV;
    return uv+offset;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    
    
    vec2 offsetRed = getColorUV(uv, 1.0,0.86, 0.0);
    col.x = texture(iChannel0, offsetRed).x;
    
    vec2 offsetGreen = getColorUV(uv, 1.0,0.86, 0.01);
    col.y = texture(iChannel0, offsetGreen).y;
    
    vec2 offsetBlue = getColorUV(uv, 1.0,0.86, 0.02);
    col.z = texture(iChannel0, offsetBlue).z;
    
    //vec2 offset = getPos(centerUV,1.0,0.86);
    //float h = 0.5;
    //offset *= (1.0/vec2(h))*(0.5);
    
    //offset += -centerUV;
    //
    //offset -= sign(offset)*0.5;

    /*------------------------------------------------*/
    
    /*vec2 centerUV = uv-vec2(0.5);
    
    vec2 redUV = uv+vec2(0.001);
    vec4 redPixel = texture(iChannel0, redUV);
   
    vec2 blueUV = uv;
    vec4 bluePixel = texture(iChannel0, blueUV);
   
    vec2 greenUV = uv;
    vec4 greenPixel = texture(iChannel0, greenUV);
   
    col.x = redPixel.x;
    col.y = greenPixel.y;
    col.z = bluePixel.z;
    */
    
    
   
    //vec2 greenUV = uv;
    //col = texture(iChannel0, uv+offset).xyz;
    //col.xy = offset;
    
  	/*------------------------------------------------*/
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
