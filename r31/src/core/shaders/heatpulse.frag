uniform float uTime;

in float vHpAlarmProgress;
in vec3 vHpLocalPosition;
in vec3 vHpWorldPosition;
in vec3 vHpWorldNormal;

vec3 calculateHeatPulse(vec3 diffuseColor) {
    if (vHpAlarmProgress <= 0.01) {
        return diffuseColor;
    }
    
    float pulseSpeed = mix(1.0, 3.0, vHpAlarmProgress);
    float pulsePhase = fract(uTime * pulseSpeed * 0.3);
    
    float scanHeight = pulsePhase * 2.0 - 0.5;
    float scanWidth = 0.15 + vHpAlarmProgress * 0.1;
    
    float scanDist = abs(vHpLocalPosition.y - scanHeight);
    float scanIntensity = 1.0 - smoothstep(0.0, scanWidth, scanDist);
    scanIntensity *= vHpAlarmProgress;
    
    vec3 scanColor = mix(
        vec3(0.0, 0.8, 1.0),
        vec3(1.0, 0.2, 0.0),
        vHpAlarmProgress
    );
    
    vec3 edgeColor = vec3(1.0, 0.0, 0.0);
    vec3 normal = normalize(vHpWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vHpWorldPosition);
    float edgeFactor = 1.0 - abs(dot(normal, viewDir));
    edgeFactor = pow(edgeFactor, 3.0);
    
    float flickerSpeed = mix(0.0, 8.0, vHpAlarmProgress);
    float flicker = 0.5 + 0.5 * sin(uTime * flickerSpeed);
    flicker = smoothstep(0.4, 0.6, flicker);
    
    float edgeIntensity = edgeFactor * vHpAlarmProgress * flicker;
    edgeIntensity *= smoothstep(0.3, 0.8, vHpAlarmProgress);
    
    vec3 finalColor = diffuseColor;
    finalColor += scanColor * scanIntensity * 1.5;
    finalColor += edgeColor * edgeIntensity * 2.0;
    
    float glowIntensity = vHpAlarmProgress * 0.3 * (0.7 + 0.3 * sin(uTime * 2.0));
    finalColor += mix(diffuseColor, edgeColor, vHpAlarmProgress) * glowIntensity;
    
    return finalColor;
}
