import { useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Board from './Board'
import Player from './Player'
import Dice from './Dice'
import { useGameStore } from '../store/gameStore'
import { getSpacePosition, getTileDirection } from '../utils/boardUtils'

function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef()
  const targetRef = useRef(new THREE.Vector3())
  const lookRef = useRef(new THREE.Vector3())
  
  const cameraMode = useGameStore((s) => s.cameraMode)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const currentMovingPosition = useGameStore((s) => s.currentMovingPosition)
  
  useFrame(() => {
    if (!controlsRef.current) return
    
    if (cameraMode === 'fpv' && currentMovingPosition !== null) {
      // FPV: Camera AT player position, facing movement direction
      const pos = getSpacePosition(currentMovingPosition)
      const dir = getTileDirection(currentMovingPosition)
      
      // Camera at eye level
      targetRef.current.set(pos.x, 5, pos.z)
      
      // Look far ahead in movement direction
      lookRef.current.set(
        pos.x + dir.x * 20,
        0,
        pos.z + dir.z * 20
      )
      
      camera.position.lerp(targetRef.current, 0.12)
      controlsRef.current.target.lerp(lookRef.current, 0.12)
    } else {
      // Overview mode
      targetRef.current.set(0, 25, 25)
      lookRef.current.set(0, 0, 0)
      
      camera.position.lerp(targetRef.current, 0.06)
      controlsRef.current.target.lerp(lookRef.current, 0.06)
    }
  })
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={8}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.1}
      enabled={cameraMode === 'overview' && gamePhase === 'idle'}
    />
  )
}

export default function Scene() {
  const players = useGameStore((s) => s.players)
  const currentPlayer = useGameStore((s) => s.currentPlayer)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const inJail = useGameStore((s) => s.inJail)
  const diceValues = useGameStore((s) => s.diceValues)
  
  const setDiceValues = useGameStore((s) => s.setDiceValues)
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const setCameraMode = useGameStore((s) => s.setCameraMode)
  const setCurrentMovingPosition = useGameStore((s) => s.setCurrentMovingPosition)
  const updatePlayerPosition = useGameStore((s) => s.updatePlayerPosition)
  const nextPlayer = useGameStore((s) => s.nextPlayer)
  const checkTileAction = useGameStore((s) => s.checkTileAction)
  const releaseFromJail = useGameStore((s) => s.releaseFromJail)
  const incrementJailTurn = useGameStore((s) => s.incrementJailTurn)
  const payBail = useGameStore((s) => s.payBail)
  
  const isRollingRef = useRef(false)
  
  const handleRoll = useCallback(() => {
    if (gamePhase !== 'idle' || isRollingRef.current) return
    isRollingRef.current = true
    
    // Generate dice
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    setDiceValues([die1, die2])
    setGamePhase('rolling')
    
    const player = players[currentPlayer]
    const isInJail = inJail[player.id]
    const isDoubles = die1 === die2
    const total = die1 + die2
    
    // Wait for dice animation
    setTimeout(() => {
      if (isInJail) {
        // Jail roll
        if (isDoubles) {
          releaseFromJail(player.id)
          setTimeout(() => doMove(player, total, isDoubles), 800)
        } else {
          incrementJailTurn(player.id)
          const turns = useGameStore.getState().jailTurns[player.id]
          if (turns >= 3) {
            payBail(player.id)
          }
          finishTurn(false)
        }
      } else {
        doMove(player, total, isDoubles)
      }
    }, 2200)
  }, [gamePhase, players, currentPlayer, inJail])
  
  const doMove = useCallback((player, total, isDoubles) => {
    setGamePhase('moving')
    setCameraMode('fpv')
    
    const startPos = player.position
    let step = 0
    
    const interval = setInterval(() => {
      step++
      const newPos = (startPos + step) % 40
      setCurrentMovingPosition(newPos)
      updatePlayerPosition(player.id, newPos)
      
      if (step >= total) {
        clearInterval(interval)
        
        setTimeout(() => {
          setCameraMode('overview')
          setCurrentMovingPosition(null)
          
          // Check tile
          checkTileAction(newPos, player.id)
          
          // Wait then next turn
          setTimeout(() => {
            const state = useGameStore.getState()
            if (state.showCardModal || state.currentTileAction) {
              // Wait for action to complete
              return
            }
            finishTurn(isDoubles && !state.inJail[player.id])
          }, 800)
        }, 400)
      }
    }, 320)
  }, [])
  
  const finishTurn = useCallback((rollAgain) => {
    isRollingRef.current = false
    if (rollAgain) {
      setGamePhase('idle')
    } else {
      nextPlayer()
    }
  }, [nextPlayer, setGamePhase])
  
  // Manual finish after actions
  useEffect(() => {
    const state = useGameStore.getState()
    if (gamePhase === 'idle' && isRollingRef.current) {
      isRollingRef.current = false
    }
  }, [gamePhase])
  
  // Space key
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleRoll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleRoll])
  
  // Current player is hidden during FPV
  const hiddenPlayerId = cameraMode === 'fpv' ? players[currentPlayer]?.id : null
  
  return (
    <Canvas shadows style={{ background: '#0a0a1a' }}>
      <PerspectiveCamera makeDefault position={[0, 25, 25]} fov={60} near={0.1} far={1000} />
      <CameraController />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4488ff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
      <Environment preset="night" />
      
      <Board />
      <Dice />
      {players.map((player) => (
        <Player
          key={player.id}
          player={player}
          isCurrentPlayer={currentPlayer === player.id - 1}
          isInJail={inJail[player.id]}
          isHidden={player.id === hiddenPlayerId}
        />
      ))}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </Canvas>
  )
}
