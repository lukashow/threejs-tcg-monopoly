import { useRef, useMemo, useEffect, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { useGameStore } from '../store/gameStore'

const AnimatedGroup = animated.group

// Rotation to show each value on top face
const ROTATIONS = {
  1: [0, 0, 0],
  2: [Math.PI / 2, 0, 0],
  3: [0, 0, -Math.PI / 2],
  4: [0, 0, Math.PI / 2],
  5: [-Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0]
}

// Dot patterns for each face
const DOTS = {
  1: [[0, 0]],
  2: [[-0.22, -0.22], [0.22, 0.22]],
  3: [[-0.22, -0.22], [0, 0], [0.22, 0.22]],
  4: [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]],
  5: [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]],
  6: [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0], [0.22, 0], [-0.22, 0.22], [0.22, 0.22]]
}

function Die({ value, xOffset, rolling, delay }) {
  const [phase, setPhase] = useState('hidden')
  const targetRot = ROTATIONS[value] || [0, 0, 0]
  
  useEffect(() => {
    if (rolling) {
      setPhase('rolling')
      const t = setTimeout(() => setPhase('settled'), 1800 + delay)
      return () => clearTimeout(t)
    } else {
      setPhase('hidden')
    }
  }, [rolling, delay])
  
  const { position, rotation } = useSpring({
    position: phase === 'hidden' ? [xOffset, 8, 0] : [xOffset, 0.7, 0],
    rotation: phase === 'rolling'
      ? [targetRot[0] + Math.PI * 8, targetRot[1] + Math.PI * 4, targetRot[2]]
      : targetRot,
    config: phase === 'rolling' ? { tension: 100, friction: 14 } : { tension: 200, friction: 20 },
    delay: phase === 'rolling' ? delay : 0
  })
  
  return (
    <AnimatedGroup position={position} rotation={rotation}>
      <RoundedBox args={[1.1, 1.1, 1.1]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color="#fff" metalness={0.1} roughness={0.3} />
      </RoundedBox>
      
      {/* All 6 faces */}
      {[1, 2, 3, 4, 5, 6].map(face => {
        const dots = DOTS[face]
        const facePos = {
          1: [0, 0.56, 0],    // top
          6: [0, -0.56, 0],   // bottom
          2: [0, 0, 0.56],    // front
          5: [0, 0, -0.56],   // back
          3: [0.56, 0, 0],    // right
          4: [-0.56, 0, 0]    // left
        }[face]
        const faceRot = {
          1: [-Math.PI / 2, 0, 0],
          6: [Math.PI / 2, 0, 0],
          2: [0, 0, 0],
          5: [0, Math.PI, 0],
          3: [0, Math.PI / 2, 0],
          4: [0, -Math.PI / 2, 0]
        }[face]
        
        return (
          <group key={face} position={facePos} rotation={faceRot}>
            {dots.map((d, i) => (
              <mesh key={i} position={[d[0], d[1], 0.01]}>
                <circleGeometry args={[0.08, 16]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            ))}
          </group>
        )
      })}
      
      {phase === 'rolling' && (
        <pointLight position={[0, 0, 0]} intensity={2} distance={3} color="#4488ff" />
      )}
    </AnimatedGroup>
  )
}

export default function Dice() {
  const diceValues = useGameStore((s) => s.diceValues)
  const gamePhase = useGameStore((s) => s.gamePhase)
  
  const rolling = gamePhase === 'rolling' || gamePhase === 'moving'
  
  return (
    <group>
      <Die value={diceValues[0]} xOffset={-0.8} rolling={rolling} delay={0} />
      <Die value={diceValues[1]} xOffset={0.8} rolling={rolling} delay={100} />
    </group>
  )
}
