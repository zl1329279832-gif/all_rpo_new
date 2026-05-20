in float instanceAlarmProgress;
out float vHpAlarmProgress;
out vec3 vHpLocalPosition;
out vec3 vHpWorldPosition;
out vec3 vHpWorldNormal;

void main_heatpulse_vertex(vec3 worldPos, vec3 worldNormal) {
    vHpAlarmProgress = instanceAlarmProgress;
    vHpLocalPosition = position;
    vHpWorldPosition = worldPos;
    vHpWorldNormal = worldNormal;
}
