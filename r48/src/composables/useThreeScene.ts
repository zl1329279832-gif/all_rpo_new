import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { disposeScene } from '@/utils/resourceDisposer'

export function useThreeScene(containerId: string) {
  let scene!: THREE.Scene
  let camera!: THREE.PerspectiveCamera
  let renderer!: THREE.WebGLRenderer
  let labelRenderer!: CSS2DRenderer
  let controls!: OrbitControls
  let animationId: number = 0

  const init = () => {
    const container = document.getElementById(containerId)
    if (!container) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.FogExp2(0x0a1628, 0.015)

    const aspect = container.clientWidth / container.clientHeight
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500)
    camera.position.set(0, 12, 20)
    camera.lookAt(0, 0, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(container.clientWidth, container.clientHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    container.appendChild(labelRenderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2.2
    controls.minDistance = 5
    controls.maxDistance = 50
    controls.target.set(0, 1, 0)

    const ambientLight = new THREE.AmbientLight(0x1a2a4a, 0.6)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 60
    dirLight.shadow.camera.left = -20
    dirLight.shadow.camera.right = 20
    dirLight.shadow.camera.top = 20
    dirLight.shadow.camera.bottom = -20
    scene.add(dirLight)

    const pointLight1 = new THREE.PointLight(0x00e5ff, 0.5, 30)
    pointLight1.position.set(-8, 5, 0)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x1e90ff, 0.4, 30)
    pointLight2.position.set(8, 5, 0)
    scene.add(pointLight2)

    const groundGeo = new THREE.PlaneGeometry(60, 60)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d1f3c, roughness: 0.9, metalness: 0.1 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const gridHelper = new THREE.GridHelper(60, 60, 0x1a3a5c, 0x112240)
    gridHelper.position.y = 0.01
    scene.add(gridHelper)

    window.addEventListener('resize', onResize)
  }

  const onResize = () => {
    const container = document.getElementById(containerId)
    if (!container) return
    const w = container.clientWidth
    const h = container.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    labelRenderer.setSize(w, h)
  }

  const startLoop = (callback: (time: number) => void) => {
    const loop = (time: number) => {
      animationId = requestAnimationFrame(loop)
      controls.update()
      callback(time)
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }
    animationId = requestAnimationFrame(loop)
  }

  const destroy = () => {
    window.removeEventListener('resize', onResize)
    if (animationId) cancelAnimationFrame(animationId)
    disposeScene(scene, renderer, controls)
  }

  return { init, startLoop, destroy, getScene: () => scene, getCamera: () => camera, getControls: () => controls }
}
