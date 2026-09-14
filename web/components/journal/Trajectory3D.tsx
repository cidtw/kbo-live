'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PitchEvent } from '@/lib/types/baseball';
import { getPitchColor } from '@/lib/physics';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Trajectory3DProps {
  pitch: PitchEvent | null;
  allPitches?: PitchEvent[];
  showAllTrajectories?: boolean;
}

export const Trajectory3D: React.FC<Trajectory3DProps> = ({
  pitch,
  allPitches = [],
  showAllTrajectories = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraView, setCameraView] = useState<'catcher' | 'pitcher' | 'side' | 'top'>('catcher');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animProgress, setAnimProgress] = useState<number>(1);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateCameraPosition = (view: 'catcher' | 'pitcher' | 'side' | 'top') => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (view === 'catcher') {
      camera.position.set(0, 3.2, -4.5);
      camera.lookAt(0, 3.0, 35);
    } else if (view === 'pitcher') {
      camera.position.set(0, 6.5, 56);
      camera.lookAt(0, 2.2, 0);
    } else if (view === 'side') {
      camera.position.set(38, 4.5, 25);
      camera.lookAt(0, 3.0, 25);
    } else if (view === 'top') {
      camera.position.set(0, 58, 25);
      camera.lookAt(0, 0, 25);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;
    updateCameraPosition(cameraView);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const turfGeo = new THREE.PlaneGeometry(30, 70);
    const turfMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.8,
    });
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.rotation.x = -Math.PI / 2;
    turf.position.set(0, -0.05, 25);
    scene.add(turf);

    const grid = new THREE.GridHelper(70, 35, '#334155', '#1e293b');
    grid.position.set(0, 0, 25);
    scene.add(grid);

    const plateShape = new THREE.Shape();
    plateShape.moveTo(-0.708, 0);
    plateShape.lineTo(0.708, 0);
    plateShape.lineTo(0.708, 0.7);
    plateShape.lineTo(0, 1.4);
    plateShape.lineTo(-0.708, 0.7);
    plateShape.closePath();

    const plateGeo = new THREE.ShapeGeometry(plateShape);
    const plateMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.rotation.x = -Math.PI / 2;
    plateMesh.position.set(0, 0.01, 1.417);
    scene.add(plateMesh);

    const moundGeo = new THREE.CylinderGeometry(4.5, 5.0, 0.83, 32);
    const moundMat = new THREE.MeshStandardMaterial({ color: '#334155' });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(0, 0.415, 50);
    scene.add(mound);

    const rubberGeo = new THREE.BoxGeometry(2.0, 0.1, 0.5);
    const rubberMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const rubber = new THREE.Mesh(rubberGeo, rubberMat);
    rubber.position.set(0, 0.84, 50);
    scene.add(rubber);

    const szWidth = 1.417;
    const szHeight = 1.9;
    const szYCenter = 2.45;

    const szBoxGeo = new THREE.BoxGeometry(szWidth, szHeight, 0.05);
    const szBoxMat = new THREE.MeshBasicMaterial({
      color: '#3b82f6',
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const szMesh = new THREE.Mesh(szBoxGeo, szBoxMat);
    szMesh.position.set(0, szYCenter, 1.417);
    scene.add(szMesh);

    const glassGeo = new THREE.PlaneGeometry(szWidth, szHeight);
    const glassMat = new THREE.MeshBasicMaterial({
      color: '#1d4ed8',
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, szYCenter, 1.417);
    scene.add(glassMesh);

    const ballGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.3,
      emissive: '#ffffff',
      emissiveIntensity: 0.3,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      const camera = cameraRef.current;
      camera.position.x += dx * 0.05;
      camera.position.y -= dy * 0.05;
      camera.lookAt(0, 2.5, 25);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      cameraRef.current.position.z += e.deltaY * 0.02;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: true });

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldLines = scene.children.filter((c) => c.name === 'trajectory_line');
    oldLines.forEach((l) => scene.remove(l));

    if (!pitch?.pts) return;

    const points = pitch.pts.trajectoryPoints.map(
      (p) => new THREE.Vector3(p.x, p.z, p.y)
    );

    const curve = new THREE.CatmullRomCurve3(points);
    trajectoryCurveRef.current = curve;

    const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.06, 8, false);
    const colorHex = getPitchColor(pitch.stuff);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.name = 'trajectory_line';
    scene.add(tubeMesh);

    if (showAllTrajectories) {
      allPitches.forEach((otherPitch) => {
        if (otherPitch.pts && otherPitch !== pitch) {
          const otherPoints = otherPitch.pts.trajectoryPoints.map(
            (p) => new THREE.Vector3(p.x, p.z, p.y)
          );
          const otherCurve = new THREE.CatmullRomCurve3(otherPoints);
          const otherTubeGeo = new THREE.TubeGeometry(otherCurve, 20, 0.02, 4, false);
          const otherTubeMat = new THREE.MeshBasicMaterial({
            color: getPitchColor(otherPitch.stuff),
            transparent: true,
            opacity: 0.2,
          });
          const otherTubeMesh = new THREE.Mesh(otherTubeGeo, otherTubeMat);
          otherTubeMesh.name = 'trajectory_line';
          scene.add(otherTubeMesh);
        }
      });
    }

    setAnimProgress(0);
  }, [pitch, showAllTrajectories, allPitches]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimProgress((prev) => {
        const next = prev + 0.02;
        if (next >= 1) return 0;
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!ballMeshRef.current || !trajectoryCurveRef.current) return;
    const pos = trajectoryCurveRef.current.getPointAt(animProgress);
    if (pos) {
      ballMeshRef.current.position.copy(pos);
    }
  }, [animProgress]);

  const handleCameraChange = (view: 'catcher' | 'pitcher' | 'side' | 'top') => {
    setCameraView(view);
    updateCameraPosition(view);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>3D 투구 궤적 뷰어</span>
            {pitch && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {pitch.stuff} {pitch.speed} km/h (비행 {pitch.pts?.flightTime.toFixed(3)}s)
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400">
            릴리스 포인트(50ft)부터 홈플레이트(1.4ft)까지의 물리 궤적 시뮬레이션
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => handleCameraChange('catcher')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              cameraView === 'catcher'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            포수 뷰
          </button>
          <button
            onClick={() => handleCameraChange('pitcher')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              cameraView === 'pitcher'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            투수 뷰
          </button>
          <button
            onClick={() => handleCameraChange('side')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              cameraView === 'side'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            사이드 뷰
          </button>
          <button
            onClick={() => handleCameraChange('top')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              cameraView === 'top'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            탑 뷰
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[380px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full min-h-[380px]" />

        {pitch?.pts && (
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/70 backdrop-blur-md px-3 py-2 rounded-xl text-xs space-y-1 text-slate-300 pointer-events-none">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PTS 물리 분석 파라미터
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">릴리스 높이: </span>
                <span className="text-white font-bold">{pitch.pts.z0.toFixed(2)} ft</span>
              </div>
              <div>
                <span className="text-slate-500">익스텐션: </span>
                <span className="text-white font-bold">
                  {(55 - pitch.pts.y0).toFixed(2)} ft
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">수평 무브: </span>
                <span className="text-blue-400 font-bold">
                  {pitch.pts.breakHorizontal > 0
                    ? `+${pitch.pts.breakHorizontal}"`
                    : `${pitch.pts.breakHorizontal}"`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">수직 무브(IVB): </span>
                <span className="text-indigo-400 font-bold">
                  {pitch.pts.breakVertical > 0
                    ? `+${pitch.pts.breakVertical}"`
                    : `${pitch.pts.breakVertical}"`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-white">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 hover:bg-slate-800 rounded transition"
            title={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setAnimProgress(0)}
            className="p-1 hover:bg-slate-800 rounded transition"
            title="처음부터"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${animProgress * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono ml-1">
            {(animProgress * (pitch?.pts?.flightTime || 0.4)).toFixed(2)}s
          </span>
        </div>

        <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 pointer-events-none">
          마우스 드래그로 회전 | 휠로 줌
        </div>
      </div>
    </div>
  );
};
