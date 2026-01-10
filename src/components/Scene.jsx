import { forwardRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Logo3D from './Logo3D'

const Scene = forwardRef(function Scene({ text, recording, recordingRotation }, ref) {
  return (
    <Canvas
      ref={ref}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: recording ? 'transparent' : '#000000' }}
      gl={{ 
        antialias: true, 
        toneMapping: 3, 
        toneMappingExposure: 0.8,
        preserveDrawingBuffer: true,
        alpha: true
      }}
    >
      {!recording && <color attach="background" args={['#000000']} />}
      
      {/* No ambient light - pure darkness */}
      
      {/* Single dramatic directional light from one side */}
      <directionalLight
        position={[5, 3, 2]}
        intensity={4}
        color="#ff5500"
      />
      
      {/* Subtle rim light from behind */}
      <pointLight
        position={[-3, 0, -4]}
        intensity={1.5}
        color="#ff3300"
      />
      
      <Logo3D text={text} recording={recording} recordingRotation={recordingRotation} />
      
      {/* Dark environment for subtle reflections */}
      <Environment preset="night" environmentIntensity={0.3} />
      
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          radius={0.8}
        />
        {!recording && <Vignette eskil={false} offset={0.1} darkness={0.85} />}
      </EffectComposer>
    </Canvas>
  )
})

export default Scene
