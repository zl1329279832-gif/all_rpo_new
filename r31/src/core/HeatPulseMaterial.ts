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
        '#include <begin_vertex>',
        `#include <begin_vertex>
        main_heatpulse_vertex();`
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
${fragmentShaderChunk}`
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        main_heatpulse_fragment(gl_FragColor);`
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
