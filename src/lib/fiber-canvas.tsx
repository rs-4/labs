import {
  createRoot,
  events,
  extend,
  type ReconcilerRoot,
  type RootState,
  unmountComponentAtNode,
} from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import { PixelRatio, type ViewProps } from "react-native";
import { Canvas, type CanvasRef, type NativeCanvas } from "react-native-webgpu";
import * as THREE from "three/webgpu";
import {
  makeWebGPURenderer,
  ReactNativeCanvas,
} from "@/lib/make-webgpu-renderer";

extend({
  AmbientLight: THREE.AmbientLight,
  BoxGeometry: THREE.BoxGeometry,
  BufferGeometry: THREE.BufferGeometry,
  DirectionalLight: THREE.DirectionalLight,
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  PointLight: THREE.PointLight,
  PerspectiveCamera: THREE.PerspectiveCamera,
  Scene: THREE.Scene,
});

type FiberCanvasProps = {
  children: React.ReactNode;
  style?: ViewProps["style"];
};

export function FiberCanvas({ children, style }: FiberCanvasProps) {
  const root = useRef<ReconcilerRoot<OffscreenCanvas>>(null!);
  const canvasRef = useRef<CanvasRef>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("webgpu");
    if (!context) return;

    const renderer = makeWebGPURenderer(context);
    const canvas = new ReactNativeCanvas(
      context.canvas as unknown as NativeCanvas
    ) as unknown as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * PixelRatio.get();
    canvas.height = canvas.clientHeight * PixelRatio.get();

    if (!root.current) {
      root.current = createRoot(canvas);
    }

    root.current.configure({
      size: {
        top: 0,
        left: 0,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      },
      events,
      gl: renderer,
      frameloop: "never",
      dpr: 1,
      onCreated: async (state: RootState) => {
        // @ts-expect-error WebGPURenderer exposes async initialization.
        await state.gl.init();
        const render = state.gl.render.bind(state.gl);
        state.gl.render = (scene: THREE.Scene, camera: THREE.Camera) => {
          render(scene, camera);
          context.present();
        };
        state.setFrameloop("always");
      },
    });
    root.current.render(children);

    return () => {
      unmountComponentAtNode(canvas);
    };
  }, []);

  return <Canvas ref={canvasRef} style={style} />;
}
