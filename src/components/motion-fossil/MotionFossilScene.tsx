import { useFrame, useThree } from "@react-three/fiber";
import React, { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { FiberCanvas } from "@/lib/fiber-canvas";
import type { FossilController } from "./MotionFossil";

const MAX_POINTS = 180;
const VERTICES_PER_POINT = 4;
const INDICES_PER_SEGMENT = 24;

function createRibbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_POINTS * VERTICES_PER_POINT * 3);
  const indices = new Uint16Array((MAX_POINTS - 1) * INDICES_PER_SEGMENT);

  for (let index = 0; index < MAX_POINTS - 1; index += 1) {
    const vertex = index * VERTICES_PER_POINT;
    const next = vertex + VERTICES_PER_POINT;
    const offset = index * INDICES_PER_SEGMENT;

    indices.set(
      [
        vertex, vertex + 1, next,
        vertex + 1, next + 1, next,
        vertex + 2, next + 2, vertex + 3,
        vertex + 3, next + 2, next + 3,
        vertex, next, vertex + 2,
        vertex + 2, next, next + 2,
        vertex + 1, vertex + 3, next + 1,
        vertex + 3, next + 3, next + 1,
      ],
      offset
    );
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setDrawRange(0, 0);
  return geometry;
}

function updateRibbonGeometry(
  geometry: THREE.BufferGeometry,
  points: { x: number; y: number; z: number }[]
) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const positions = position.array as Float32Array;
  const count = Math.min(points.length, MAX_POINTS);

  for (let index = 0; index < count; index += 1) {
    const point = points[index];
    const previous = points[Math.max(index - 1, 0)];
    const next = points[Math.min(index + 1, count - 1)];
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const length = Math.max(Math.hypot(tangentX, tangentY), 0.001);
    const halfWidth = 0.17 + Math.sin(index * 0.28) * 0.028;
    const halfDepth = 0.105 + Math.cos(index * 0.21) * 0.018;
    const normalX = (-tangentY / length) * halfWidth;
    const normalY = (tangentX / length) * halfWidth;
    const offset = index * VERTICES_PER_POINT * 3;

    positions[offset] = point.x + normalX;
    positions[offset + 1] = point.y + normalY;
    positions[offset + 2] = point.z + halfDepth;
    positions[offset + 3] = point.x - normalX;
    positions[offset + 4] = point.y - normalY;
    positions[offset + 5] = point.z + halfDepth;
    positions[offset + 6] = point.x + normalX;
    positions[offset + 7] = point.y + normalY;
    positions[offset + 8] = point.z - halfDepth;
    positions[offset + 9] = point.x - normalX;
    positions[offset + 10] = point.y - normalY;
    positions[offset + 11] = point.z - halfDepth;
  }

  position.needsUpdate = true;
  geometry.setDrawRange(0, Math.max(count - 1, 0) * INDICES_PER_SEGMENT);
  geometry.computeVertexNormals();
}

function FossilTrace({
  controller,
  accent,
}: {
  controller: MutableRefObject<FossilController>;
  accent: string;
}) {
  const group = useRef<THREE.Group>(null!);
  const core = useRef<THREE.Mesh>(null!);
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null!);
  const renderedRevision = useRef(-1);
  const geometry = useRef(createRibbonGeometry()).current;
  if (renderedRevision.current === -1) {
    updateRibbonGeometry(geometry, controller.current.points);
  }

  useFrame((state, delta) => {
    const control = controller.current;
    if (renderedRevision.current !== control.revision) {
      updateRibbonGeometry(geometry, control.points);
      core.current.visible = control.points.length >= 2;
      renderedRevision.current = control.revision;
    }

    control.crystallize = THREE.MathUtils.damp(
      control.crystallize,
      control.crystallizeTarget,
      6.5,
      delta
    );
    control.rotationX = THREE.MathUtils.damp(
      control.rotationX,
      control.rotationTargetX,
      7.5,
      delta
    );
    control.rotationY = THREE.MathUtils.damp(
      control.rotationY,
      control.rotationTargetY,
      7.5,
      delta
    );
    control.velocity = THREE.MathUtils.damp(control.velocity, 0, 4, delta);

    if (control.phase === "solid" && control.velocity < 0.05) {
      control.rotationTargetY += delta * 0.075;
    }

    group.current.rotation.x = control.rotationX;
    group.current.rotation.y = control.rotationY;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35) * 0.025;
    const compression = 1 - control.velocity * 0.06;
    group.current.scale.set(
      compression,
      compression,
      0.82 + control.crystallize * 0.28
    );

    coreMaterial.current.metalness = 0.12 + control.crystallize * 0.72;
    coreMaterial.current.roughness = 0.72 - control.crystallize * 0.46;
    coreMaterial.current.emissiveIntensity = 0.42 - control.crystallize * 0.3;
  });

  return (
    <group ref={group}>
      <mesh ref={core} geometry={geometry}>
        <meshStandardMaterial
          ref={coreMaterial}
          color={accent}
          emissive={accent}
          emissiveIntensity={0.12}
          metalness={0.84}
          roughness={0.26}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Scene({
  controller,
  accent,
}: {
  controller: MutableRefObject<FossilController>;
  accent: string;
}) {
  const { camera, scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color("#000000");
    scene.fog = new THREE.Fog("#000000", 10, 18);
    camera.position.set(0, 0, 7.6);
    camera.lookAt(0, 0, 0);
  }, [camera, scene]);

  useFrame((_, delta) => {
    const control = controller.current;
    control.zoom = THREE.MathUtils.damp(
      control.zoom,
      control.zoomTarget,
      8,
      delta
    );
    camera.position.z = 7.6 / control.zoom;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[3.5, 5, 5]} intensity={4.8} color="#FFE8D9" />
      <pointLight position={[-3, -2, 4]} intensity={24} color={accent} distance={11} />
      <pointLight position={[3, 2.5, 2]} intensity={16} color="#6C86A8" distance={10} />
      <FossilTrace controller={controller} accent={accent} />
    </>
  );
}

export default function MotionFossilScene({
  controller,
  accent,
}: {
  controller: MutableRefObject<FossilController>;
  accent: string;
}) {
  return (
    <FiberCanvas style={{ flex: 1 }}>
      <Scene controller={controller} accent={accent} />
    </FiberCanvas>
  );
}
