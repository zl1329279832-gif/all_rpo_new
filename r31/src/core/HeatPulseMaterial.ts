import * as THREE from 'three'
import vertexShaderChunk from './shaders/heatpulse.vert?raw'
import fragmentShaderChunk from './shaders/heatpulse.frag?raw'

export class HeatPulseMaterial extends THREE.MeshStandardMaterial {
  private uniforms: {
    uTime: { value: number }
  }

  constructor(params: THREE.MeshStandardMaterialParameters = {}) {
    super(params)

    this.uniforms = {
      uTime: { value: 0 }
    }

    this.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>

${vertexShaderChunk}`
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>

        vec3 hpObjectNormal = normalize(objectNormal);
        vec3 hpTransformedNormal = normalize(mat3(instanceMatrix) * hpObjectNormal);
        vec3 hpWorldNormal = normalize(mat3(modelMatrix) * hpTransformedNormal);
        vec3 hpWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
        main_heatpulse_vertex(hpWorldPos, hpWorldNormal);`
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>

${fragmentShaderChunk}`
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>

        gl_FragColor.rgb = calculateHeatPulse(gl_FragColor.rgb);`
      )
    }
  }

  updateTime(time: number): void {
    this.uniforms.uTime.value = time
  }

  get time(): number {
    return this.uniforms.uTime.value
  }

  set time(value: number) {
    this.uniforms.uTime.value = value
  }
}
