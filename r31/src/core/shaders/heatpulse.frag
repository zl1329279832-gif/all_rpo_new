uniform float uTime;

in float vAlarmProgress;
in vec3 vLocalPosition;
in vec3 vWorldPosition;

vec3 calculateHeatPulse(vec3 diffuseColor, vec3 normal, vec3 viewDir) {
    if (vAlarmProgress <= 0.01) {
        return diffuseColor;
    }
    
    float pulseSpeed = mix(1.0, 3.0, vAlarmProgress);
    float pulsePhase = fract(uTime * pulseSpeed * 0.3);
    
    float scanHeight = pulsePhase * 2.0 - 0.5;
    float scanWidth = 0.15 + vAlarmProgress * 0.1;
    
    float scanDist = abs(vLocalPosition.y - scanHeight);
    float scanIntensity = 1.0 - smoothstep(0.0, scanWidth, scanDist);
    scanIntensity *= vAlarmProgress;
    
    vec3 scanColor = mix(
        vec3(0.0, 0.8, 1.0),
        vec3(1.0, 0.2, 0.0),
        vAlarmProgress
    );
    
    vec3 edgeColor = vec3(1.0, 0.0, 0.0);
    float edgeFactor = 1.0 - abs(dot(normal, viewDir));
    edgeFactor = pow(edgeFactor, 3.0);
    
    float flickerSpeed = mix(0.0, 8.0, vAlarmProgress);
    float flicker = 0.5 + 0.5 * sin(uTime * flickerSpeed);
    flicker = smoothstep(0.4, 0.6, flicker);
    
    float edgeIntensity = edgeFactor * vAlarmProgress * flicker;
    edgeIntensity *= smoothstep(0.3, 0.8, vAlarmProgress);
    
    vec3 finalColor = diffuseColor;
    finalColor += scanColor * scanIntensity * 1.5;
    finalColor += edgeColor * edgeIntensity * 2.0;
    
    float glowIntensity = vAlarmProgress * 0.3 * (0.7 + 0.3 * sin(uTime * 2.0));
    finalColor += mix(diffuseColor, edgeColor, vAlarmProgress) * glowIntensity;
    
    return finalColor;
}

void main_heatpulse_fragment(inout vec4 diffuseColor) {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    vec3 resultColor = calculateHeatPulse(diffuseColor.rgb, normal, viewDir);
    diffuseColor.rgb = resultColor;
}
