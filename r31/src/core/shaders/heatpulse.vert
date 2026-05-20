in float instanceAlarmProgress;
out float vAlarmProgress;
out vec3 vLocalPosition;
out vec3 vWorldPosition;

void main_heatpulse_vertex() {
    vAlarmProgress = instanceAlarmProgress;
    vLocalPosition = position;
    
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
}
