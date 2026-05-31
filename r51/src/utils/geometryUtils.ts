import * as THREE from 'three';

export function createRoadGeometry(
  leftEdge: THREE.Vector3[],
  rightEdge: THREE.Vector3[],
  thickness: number = 0.3
): THREE.BufferGeometry {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const topOffset = thickness / 2;
  const bottomOffset = -thickness / 2;

  const segmentCount = leftEdge.length - 1;

  for (let i = 0; i < leftEdge.length; i++) {
    const left = leftEdge[i];
    const right = rightEdge[i];
    const vCoord = i / segmentCount;

    vertices.push(left.x, left.y + topOffset, left.z);
    vertices.push(right.x, right.y + topOffset, right.z);
    vertices.push(left.x, left.y + bottomOffset, left.z);
    vertices.push(right.x, right.y + bottomOffset, right.z);

    uvs.push(0, vCoord);
    uvs.push(1, vCoord);
    uvs.push(0, vCoord);
    uvs.push(1, vCoord);
  }

  for (let i = 0; i < segmentCount; i++) {
    const base = i * 4;

    indices.push(base, base + 1, base + 4);
    indices.push(base + 1, base + 5, base + 4);

    indices.push(base + 2, base + 6, base + 3);
    indices.push(base + 3, base + 6, base + 7);

    indices.push(base, base + 4, base + 2);
    indices.push(base + 2, base + 4, base + 6);

    indices.push(base + 1, base + 3, base + 5);
    indices.push(base + 3, base + 7, base + 5);

    if (i === 0) {
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }

    if (i === segmentCount - 1) {
      indices.push(base + 4, base + 5, base + 6);
      indices.push(base + 5, base + 7, base + 6);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createDashedLineGeometry(
  points: THREE.Vector3[],
  dashSize: number = 1,
  gapSize: number = 1
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

export function createGuardRailGeometry(
  leftEdge: THREE.Vector3[],
  rightEdge: THREE.Vector3[],
  height: number = 0.8,
  thickness: number = 0.1
): THREE.Group {
  const group = new THREE.Group();

  const createRail = (edge: THREE.Vector3[], offset: number) => {
    const railGroup = new THREE.Group();
    const topY = height;
    const midY = height * 0.5;

    const topPoints: THREE.Vector3[] = [];
    const midPoints: THREE.Vector3[] = [];

    for (const point of edge) {
      topPoints.push(new THREE.Vector3(point.x, point.y + topY, point.z));
      midPoints.push(new THREE.Vector3(point.x, point.y + midY, point.z));
    }

    const CurveClass = (THREE as any).CatmullRomCurve3;
    const topCurve = new CurveClass(topPoints);
    const midCurve = new CurveClass(midPoints);

    const tubeGeo1 = new THREE.TubeGeometry(topCurve, edge.length * 3, thickness / 2, 8, false);
    const tubeGeo2 = new THREE.TubeGeometry(midCurve, edge.length * 3, thickness / 2, 8, false);

    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3
    });

    railGroup.add(new THREE.Mesh(tubeGeo1, material));
    railGroup.add(new THREE.Mesh(tubeGeo2, material));

    for (let i = 0; i < edge.length; i += 3) {
      const point = edge[i];
      const postGeo = new THREE.BoxGeometry(thickness, height, thickness);
      const post = new THREE.Mesh(postGeo, material);
      post.position.set(point.x, point.y + height / 2, point.z);
      railGroup.add(post);
    }

    return railGroup;
  };

  group.add(createRail(leftEdge, 1));
  group.add(createRail(rightEdge, -1));

  return group;
}

export function createCarGeometry(type: 'car' | 'suv' | 'truck'): { body: THREE.BufferGeometry; wheels: THREE.BufferGeometry[] } {
  const wheelGeos: THREE.BufferGeometry[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < 4; i++) {
    wheelGeos.push(wheelGeo.clone());
  }

  let bodyGeo: THREE.BufferGeometry;

  const ShapeClass = (THREE as any).Shape;

  if (type === 'car') {
    const bodyShape = new ShapeClass();
    bodyShape.moveTo(-1.5, -0.4);
    bodyShape.lineTo(1.5, -0.4);
    bodyShape.lineTo(1.5, 0.1);
    bodyShape.lineTo(1, 0.5);
    bodyShape.lineTo(-1, 0.5);
    bodyShape.lineTo(-1.5, 0.1);
    bodyShape.closePath();

    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
    bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.translate(0, 0.4, 0);
  } else if (type === 'suv') {
    const bodyShape = new ShapeClass();
    bodyShape.moveTo(-1.8, -0.5);
    bodyShape.lineTo(1.8, -0.5);
    bodyShape.lineTo(1.8, 0.2);
    bodyShape.lineTo(1.5, 0.7);
    bodyShape.lineTo(-1.5, 0.7);
    bodyShape.lineTo(-1.8, 0.2);
    bodyShape.closePath();

    const extrudeSettings = { depth: 1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
    bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.translate(0, 0.5, 0);
  } else {
    const group = new THREE.Group();

    const cargoGeo = new THREE.BoxGeometry(2.5, 1.2, 1.2);
    const cargo = new THREE.Mesh(cargoGeo);
    cargo.position.set(0.5, 0.6, 0);

    const cabShape = new ShapeClass();
    cabShape.moveTo(-1.2, -0.5);
    cabShape.lineTo(-0.2, -0.5);
    cabShape.lineTo(-0.2, 0.2);
    cabShape.lineTo(-0.5, 0.7);
    cabShape.lineTo(-1.2, 0.7);
    cabShape.closePath();

    const extrudeSettings = { depth: 1.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
    const cabGeo = new THREE.ExtrudeGeometry(cabShape, extrudeSettings);
    cabGeo.rotateX(Math.PI / 2);
    const cab = new THREE.Mesh(cabGeo);
    cab.position.set(0, 0.5, 0);

    group.add(cargo);
    group.add(cab);

    const mergedGeo = new THREE.BoxGeometry(4, 1.5, 1.5);
    bodyGeo = mergedGeo;
  }

  return { body: bodyGeo, wheels: wheelGeos };
}

export function createStreetLightGeometry(): { pole: THREE.Mesh; lamp: THREE.Mesh; light: THREE.PointLight } {
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 3;

  const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 2, 6);
  armGeo.rotateZ(Math.PI / 2);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(1, 5.5, 0);
  pole.add(arm);

  const lampGeo = new THREE.SphereGeometry(0.2, 12, 8);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffff88,
    emissiveIntensity: 0.5
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(2, 5.5, 0);
  pole.add(lamp);

  const light = new THREE.PointLight(0xffffcc, 0, 20, 2);
  light.position.set(2, 5.2, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);

  return { pole, lamp, light };
}

export function createBuildingGeometry(width: number, height: number, depth: number, style: string): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  let material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

  if (style === 'office') {
    material = new THREE.MeshPhysicalMaterial({
      color: 0x8899aa,
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      transmission: 0.3
    });
  } else if (style === 'residential') {
    material = new THREE.MeshStandardMaterial({
      color: 0xccbb99,
      roughness: 0.7
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: 0x778899,
      metalness: 0.3,
      roughness: 0.5
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;

  return mesh;
}

export function createRoadSignGeometry(text: string): THREE.Group {
  const group = new THREE.Group();

  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2;
  group.add(pole);

  const signGeo = new THREE.BoxGeometry(2, 0.8, 0.1);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x1a5fb4, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.y = 4;
  group.add(sign);

  return group;
}
