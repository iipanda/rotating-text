import { forwardRef, useRef, useImperativeHandle } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Logo3D from './Logo3D'

function SceneContent({ text, recording, recordingRotation, onBoundsCalculated }) {
  return (
    <>
      {!recording && <color attach="background" args={['#000000']} />}
      
      <directionalLight
        position={[5, 3, 2]}
        intensity={4}
        color="#ff5500"
      />
      
      <pointLight
        position={[-3, 0, -4]}
        intensity={1.5}
        color="#ff3300"
      />
      
      <Logo3D 
        text={text} 
        recording={recording} 
        recordingRotation={recordingRotation}
        onBoundsCalculated={onBoundsCalculated}
      />
      
      <Environment preset="night" environmentIntensity={0.3} />
      
      {!recording && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
            radius={0.8}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.85} />
        </EffectComposer>
      )}
    </>
  )
}

const Scene = forwardRef(function Scene({ text, recording, recordingRotation, onBoundsCalculated }, ref) {
  return (
    <Canvas
      ref={ref}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: '#000000' }}
      gl={{ 
        antialias: true, 
        toneMapping: 3, 
        toneMappingExposure: 0.8,
        preserveDrawingBuffer: true,
        alpha: true,
        autoClear: true
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <SceneContent 
        text={text}
        recording={recording}
        recordingRotation={recordingRotation}
        onBoundsCalculated={onBoundsCalculated}
      />
    </Canvas>
  )
})

export default Scene
