#version 450 core
out vec4 fragColor;

in vec2 coord;
uniform float frameCount;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01

struct Closest {
    int idx;
    float dist;
};

float distBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

Closest GetDist(vec3 p) {
	vec4 s = vec4(0, 1, 4, 1);
	vec4 b = vec4(2, 1, 10, 1);
    
    float sphereDist = length(p - s.xyz)-s.w;
    float boxDist = distBox(p - b.xyz, b.www);
    float planeDist = p.y;
    
    if (sphereDist < planeDist) 
    {
        if (boxDist < sphereDist) 
        {
            return Closest(2, boxDist);
        } 
        else 
        {
            return Closest(1, sphereDist);
        }
    } 
    else 
    {
        if (boxDist < planeDist) 
        {
            return Closest(2, boxDist);
        } 
        else 
        {
            return Closest(0, planeDist);
        }
    }
}

Closest GetDistNS(vec3 p) {
	vec4 s = vec4(0, 1, 4, 1);
	vec4 b = vec4(2, 1, 10, 1);
    
    float planeDist = p.y;
    float boxDist = distBox(p - b.xyz, b.www);
    
    if (boxDist < planeDist) 
    {
        return Closest(2, boxDist);
    } 
    else 
    {
        return Closest(0, planeDist);
    }
}

struct Hit {
    int idx;
    float dist;
    bool isBg;
};

Hit RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    Closest closest;
    int i;
    for(i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        closest = GetDist(p);
        float dS = abs(closest.dist);
        dO += dS;
        if(dO>MAX_DIST || dS<SURF_DIST) break;
    }

    bool isBg = false;
    if (i == MAX_STEPS || dO > MAX_DIST)
        closest.idx = 0;
    
    return Hit(closest.idx, dO, isBg);
}

vec3 hash3_3(vec3 p3) {
	p3 = fract(p3 * vec3(.1031, .11369, .13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1. + 2. * fract(vec3((p3.x + p3.y) * p3.z, (p3.x+p3.z) * p3.y, (p3.y+p3.z) * p3.x));
}

float perlin_noise3(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = p - pi;
    
    vec3 w = pf * pf * (3. - 2. * pf);
    
    return 	mix(
    	mix(
            mix(
                dot(pf - vec3(0, 0, 0), hash3_3(pi + vec3(0, 0, 0))), 
                dot(pf - vec3(1, 0, 0), hash3_3(pi + vec3(1, 0, 0))),
                w.x),
            mix(
                dot(pf - vec3(0, 0, 1), hash3_3(pi + vec3(0, 0, 1))), 
                dot(pf - vec3(1, 0, 1), hash3_3(pi + vec3(1, 0, 1))),
                w.x),
    	w.z),
        mix(
            mix(
                dot(pf - vec3(0, 1, 0), hash3_3(pi + vec3(0, 1, 0))), 
                dot(pf - vec3(1, 1, 0), hash3_3(pi + vec3(1, 1, 0))),
                w.x),
            mix(
                dot(pf - vec3(0, 1, 1), hash3_3(pi + vec3(0, 1, 1))), 
                dot(pf - vec3(1, 1, 1), hash3_3(pi + vec3(1, 1, 1))),
                w.x),
     	w.z),
	w.y);
}

float noise_sum_abs3(vec3 p) {
    float f = 0.;
    p = p * 3.;
    f += 1.0000 * abs(perlin_noise3(p)); p = 2. * p;
    f += 0.5000 * abs(perlin_noise3(p)); p = 3. * p;
	f += 0.2500 * abs(perlin_noise3(p)); p = 4. * p;
	f += 0.1250 * abs(perlin_noise3(p)); p = 5. * p;
	f += 0.0625 * abs(perlin_noise3(p)); p = 6. * p;
    
    return f;
}

Hit RayMarchNS(vec3 ro, vec3 rd) {
	float dO=0.;
    
    Closest closest;
    int i;
    for(i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        closest = GetDistNS(p);
        float dS = abs(closest.dist);
        dO += dS;
        if(dO>MAX_DIST || dS<SURF_DIST) break;
    }

    bool isBg = false;
    if (i == MAX_STEPS || dO > MAX_DIST)
        closest.idx = 0;
    
    return Hit(closest.idx, dO, isBg);
}

Hit RayMarchConst(vec3 ro, vec3 rd) {
	float dO = 0.;
    float dSconst = 0.01;
    
    Closest closest;
    int i;
    for(i = 0; i < 10 * MAX_STEPS; i++) {
    	vec3 p = ro + rd * dO;
        closest = GetDist(p);
        float dS = abs(closest.dist);
        dO += dSconst;
        if(dO > MAX_DIST || dS < SURF_DIST) break;
    }

    bool isBg = false;
    if (i == 10 * MAX_STEPS || dO > MAX_DIST)
        closest.idx = 0;
    
    return Hit(closest.idx, dO, isBg);
}

vec3 GetNormal(vec3 p) {
	float d = GetDist(p).dist;
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy).dist,
        GetDist(p-e.yxy).dist,
        GetDist(p-e.yyx).dist);
    
    return normalize(n);
}

vec3 GetColour(vec3 p, vec3 rd, int index) 
{
    vec3 col = vec3(0);

    vec3 lightPos = vec3(0, 5, 4);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    float dif = clamp(dot(n, l), 0., 1.);
    vec3 albedo = vec3(1.0, 0.0, 1.0);
    float N = 0.0;
    float ks = 0.0;
    
    if(index == 1)
    {
        N = 250.0;
        ks = 0.15;
        albedo = vec3(0.0, 0.0, 1.0);
    }
    else
    {
        if(index == 2)
            albedo = vec3(0.0, 1.0, 0.0);
        N = 2.0;
        ks = 0.04;
        float d = RayMarch(p+n*SURF_DIST*2., l).dist;
        if(d < length(lightPos - p))
            dif *= .1;
    }
    
    vec3 R = reflect(l, n);
    vec3 spec = vec3(pow(max(0.0, dot(R, rd)), N));

    col = vec3(dif) * albedo * (1 - ks) + spec * ks;
    
    return col;
}

vec3 AddSpec(vec3 p, vec3 rd, int index, vec3 colour) 
{
    vec3 col = vec3(0);

    vec3 lightPos = vec3(0, 5, 6);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    float N = 0.0;
    float ks = 0.0;
    
    if(index == 1)
    {
        N = 250.0;
        ks = 0.15;
    }
    else
    {
        N = 2.0;
        ks = 0.04;
    }
    vec3 R = reflect(l, n);

    vec3 spec = vec3(pow(max(0.0, dot(R, rd)), N));

    col = colour * (1 - ks) + spec * ks;
    
    return col;
}

void fresnel(vec3 I, vec3 N, float ior, inout float kr) 
{ 
    float cosi = clamp(dot(I, N), -1, 1);
    float etai = 1, etat = ior; 
    if (cosi > 0) 
    { 
        float tmp = etai;
        etai = etat;
        etat = tmp;
    } 
    float sint = etai / etat * sqrt(max(0.0f, 1 - cosi * cosi)); 
    if (sint >= 1) { 
        kr = 1; 
    } 
    else { 
        float cost = sqrt(max(0.0f, 1 - sint * sint)); 
        cosi = abs(cosi); 
        float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost)); 
        float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost)); 
        kr = (Rs * Rs + Rp * Rp) / 2; 
    } 
} 

float sigmoid(float x)
{
    return 1 / (1 + ((x-0.2) / pow(1-(x-0.2), 10)));
}

void main()
{
    vec3 col = vec3(0);
    
    vec3 ro = vec3(0, 1, 0);
    vec3 rd = normalize(vec3(coord.x, coord.y, 1));

    Hit hit = RayMarch(ro, rd);

    int idx = hit.idx;
    float d = hit.dist;
    
    vec3 p = ro + rd * d;
    vec3 norm;
    vec3 refractDir;
    vec3 reflectDir;

    float ior = 1.5;
    float ds;

    if (idx == 1) {
        norm = GetNormal(p);

        float kr;
        fresnel(rd, norm, ior, kr);
        vec3 reflectCol; 
        vec3 refractCol; 

        vec3 refractPos;
        vec3 reflectPos;
            
        if (kr < 1) 
        { 
            refractDir = refract(rd, norm, 1/ior);

            refractPos = p + 0.1 * refractDir;
            Hit refractHit = RayMarchConst(refractPos, refractDir);

            vec3 q = refractPos;
            float accnoise = 0.0;
            for(int i = 0; i < refractHit.dist * 100; i++)
            {
                float ds = sigmoid(1 - abs(GetDist(q).dist));

                float curr_noise = ds * noise_sum_abs3(q * 0.5 + vec3 (frameCount / 500, 0.0, 0.0) + 100) * 5;

                accnoise += curr_noise;
                q +=  refractDir * 0.01;
            }
            accnoise /= refractHit.dist * 100;

            refractPos = refractPos + refractDir * refractHit.dist;

            vec3 second_hit_norm = -GetNormal(refractPos);
            
            refractDir = refract(refractDir, second_hit_norm, ior);

            Hit refractHit2 = RayMarchNS(refractPos, refractDir);

            refractPos = refractPos + refractDir * refractHit2.dist;

            refractCol = GetColour(refractPos, refractDir, refractHit2.idx) * (1 - vec3(accnoise)) + vec3(1.0) * vec3(accnoise);
        } 

        reflectDir = reflect(rd, norm);

        reflectPos = p + 0.1 * reflectDir;
        Hit reflectHit = RayMarchNS(reflectPos, reflectDir);

        reflectPos = reflectPos + reflectDir * reflectHit.dist;
        
        reflectCol = GetColour(reflectPos, reflectDir, reflectHit.idx);

        col = reflectCol * kr + refractCol * (1 - kr);  
        col = AddSpec(p, rd, idx, col);
    }
    else
        col = GetColour(p, rd, idx);
    
    fragColor = vec4(col, 1.0);
}