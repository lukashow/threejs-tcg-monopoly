import { create } from 'zustand'
import tileData from '../data/tileData.json'
import cardData from '../data/cardData.json'

export const useGameStore = create((set, get) => ({
  // ========== State ==========
  players: [
    { id: 1, name: 'Player 1', position: 0, color: '#ff4444', credits: 1500, ownedProperties: [], hasJailCard: false },
    { id: 2, name: 'Player 2', position: 0, color: '#4444ff', credits: 1500, ownedProperties: [], hasJailCard: false },
    { id: 3, name: 'Player 3', position: 0, color: '#44ff44', credits: 1500, ownedProperties: [], hasJailCard: false },
    { id: 4, name: 'Player 4', position: 0, color: '#ffff44', credits: 1500, ownedProperties: [], hasJailCard: false }
  ],
  properties: {},
  currentPlayer: 0,
  
  // Dice state - single source of truth
  diceValues: [1, 1],
  
  // Game phase: 'idle' | 'rolling' | 'moving' | 'action'
  gamePhase: 'idle',
  
  // Camera
  cameraMode: 'overview',
  currentMovingPosition: null,
  
  // Jail
  inJail: { 1: false, 2: false, 3: false, 4: false },
  jailTurns: { 1: 0, 2: 0, 3: 0, 4: 0 },
  
  // UI state
  currentCard: null,
  showCardModal: false,
  currentTileAction: null,
  notification: null,
  
  // Data
  tileData: tileData.tiles,
  cardData: cardData,
  
  // ========== Simple Setters ==========
  setDiceValues: (values) => set({ diceValues: values }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCurrentMovingPosition: (pos) => set({ currentMovingPosition: pos }),
  setNotification: (msg) => set({ notification: msg }),
  clearNotification: () => set({ notification: null }),
  setCurrentTileAction: (action) => set({ currentTileAction: action }),
  skipAction: () => set({ currentTileAction: null, gamePhase: 'idle' }),
  
  // ========== Player Actions ==========
  updatePlayerPosition: (playerId, newPosition) => set((state) => {
    const player = state.players.find(p => p.id === playerId)
    const oldPos = player.position
    
    // Check if passed GO
    const passedGo = oldPos > 0 && newPosition === 0
    let bonus = passedGo ? 200 : 0
    
    return {
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, position: newPosition, credits: p.credits + bonus }
          : p
      ),
      notification: passedGo ? `${player.name} passed GO! +$200` : null
    }
  }),
  
  nextPlayer: () => set((state) => ({
    currentPlayer: (state.currentPlayer + 1) % 4,
    gamePhase: 'idle'
  })),
  
  // ========== Jail Actions ==========
  sendToJail: (playerId) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, position: 10 } : p
    ),
    inJail: { ...state.inJail, [playerId]: true },
    jailTurns: { ...state.jailTurns, [playerId]: 0 },
    notification: `${state.players.find(p => p.id === playerId).name} went to Jail!`,
    gamePhase: 'idle'
  })),
  
  releaseFromJail: (playerId) => set((state) => ({
    inJail: { ...state.inJail, [playerId]: false },
    jailTurns: { ...state.jailTurns, [playerId]: 0 },
    notification: `${state.players.find(p => p.id === playerId).name} is free!`
  })),
  
  payBail: (playerId) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (player.credits < 50) {
      set({ notification: 'Not enough money for bail!' })
      return false
    }
    set((state) => ({
      players: state.players.map(p =>
        p.id === playerId ? { ...p, credits: p.credits - 50 } : p
      ),
      inJail: { ...state.inJail, [playerId]: false },
      jailTurns: { ...state.jailTurns, [playerId]: 0 },
      notification: `${player.name} paid $50 bail`
    }))
    return true
  },
  
  incrementJailTurn: (playerId) => set((state) => ({
    jailTurns: { ...state.jailTurns, [playerId]: state.jailTurns[playerId] + 1 }
  })),
  
  useJailCard: (playerId) => set((state) => {
    const player = state.players.find(p => p.id === playerId)
    if (!player.hasJailCard) return state
    return {
      players: state.players.map(p =>
        p.id === playerId ? { ...p, hasJailCard: false } : p
      ),
      inJail: { ...state.inJail, [playerId]: false },
      jailTurns: { ...state.jailTurns, [playerId]: 0 },
      notification: `${player.name} used Get Out of Jail card!`
    }
  }),
  
  // ========== Card Actions ==========
  drawCard: (type) => {
    const state = get()
    const deck = type === 'chest' ? state.cardData.communityChest : state.cardData.chance
    const card = deck[Math.floor(Math.random() * deck.length)]
    set({
      currentCard: { type, card },
      showCardModal: true,
      gamePhase: 'action'
    })
  },
  
  executeCardAction: () => {
    const state = get()
    if (!state.currentCard) return
    
    const { card } = state.currentCard
    const player = state.players[state.currentPlayer]
    
    let updates = { showCardModal: false, currentCard: null }
    
    switch (card.action) {
      case 'collect':
        updates.players = state.players.map(p =>
          p.id === player.id ? { ...p, credits: p.credits + card.amount } : p
        )
        updates.notification = `${player.name} collected $${card.amount}!`
        break
        
      case 'pay':
        updates.players = state.players.map(p =>
          p.id === player.id ? { ...p, credits: p.credits - card.amount } : p
        )
        updates.notification = `${player.name} paid $${card.amount}`
        break
        
      case 'jail':
        updates.players = state.players.map(p =>
          p.id === player.id ? { ...p, position: 10 } : p
        )
        updates.inJail = { ...state.inJail, [player.id]: true }
        updates.jailTurns = { ...state.jailTurns, [player.id]: 0 }
        updates.notification = `${player.name} went to Jail!`
        break
        
      case 'moveTo':
        const passedGo = card.position < player.position && card.position !== 10
        updates.players = state.players.map(p =>
          p.id === player.id
            ? { ...p, position: card.position, credits: p.credits + (passedGo ? 200 : 0) }
            : p
        )
        updates.notification = passedGo ? `Passed GO! +$200` : `Moved to ${state.tileData[card.position].name}`
        break
        
      case 'moveBack':
        const newPos = (player.position - card.spaces + 40) % 40
        updates.players = state.players.map(p =>
          p.id === player.id ? { ...p, position: newPos } : p
        )
        updates.notification = `Moved back ${card.spaces} spaces`
        break
        
      case 'jailCard':
        updates.players = state.players.map(p =>
          p.id === player.id ? { ...p, hasJailCard: true } : p
        )
        updates.notification = `Got Get Out of Jail Free card!`
        break
        
      default:
        break
    }
    
    set(updates)
  },
  
  closeCardModal: () => set({ 
    showCardModal: false, 
    currentCard: null,
    gamePhase: 'idle'
  }),
  
  // ========== Property Actions ==========
  buyProperty: (tileId) => {
    const state = get()
    const tile = state.tileData[tileId]
    const player = state.players[state.currentPlayer]
    
    if (!tile || player.credits < tile.price) return
    if (state.properties[tileId]) return
    
    set({
      players: state.players.map((p, idx) =>
        idx === state.currentPlayer
          ? { ...p, credits: p.credits - tile.price, ownedProperties: [...p.ownedProperties, tileId] }
          : p
      ),
      properties: {
        ...state.properties,
        [tileId]: { ownerId: player.id, houses: 0, hasHotel: false }
      },
      notification: `${player.name} bought ${tile.name}!`,
      currentTileAction: null,
      gamePhase: 'idle'
    })
  },
  
  buildHouse: (tileId) => {
    const state = get()
    const tile = state.tileData[tileId]
    const property = state.properties[tileId]
    const player = state.players[state.currentPlayer]
    
    if (!property || property.ownerId !== player.id) return
    
    const cost = property.houses < 4 ? tile.houseCost : tile.hotelCost
    if (player.credits < cost) return
    
    if (property.houses >= 4) {
      set({
        players: state.players.map((p, idx) =>
          idx === state.currentPlayer ? { ...p, credits: p.credits - cost } : p
        ),
        properties: {
          ...state.properties,
          [tileId]: { ...property, houses: 0, hasHotel: true }
        },
        notification: `Built hotel on ${tile.name}!`,
        currentTileAction: null,
        gamePhase: 'idle'
      })
    } else {
      set({
        players: state.players.map((p, idx) =>
          idx === state.currentPlayer ? { ...p, credits: p.credits - cost } : p
        ),
        properties: {
          ...state.properties,
          [tileId]: { ...property, houses: property.houses + 1 }
        },
        notification: `Built house on ${tile.name}!`,
        currentTileAction: null,
        gamePhase: 'idle'
      })
    }
  },
  
  payRent: (tileId, payerId) => {
    const state = get()
    const property = state.properties[tileId]
    if (!property) return
    
    const tile = state.tileData[tileId]
    const payer = state.players.find(p => p.id === payerId)
    const owner = state.players.find(p => p.id === property.ownerId)
    
    if (!owner || owner.id === payerId) return
    
    const rentIdx = property.hasHotel ? 5 : property.houses
    const rent = tile.rent[rentIdx] || tile.rent[0]
    
    set({
      players: state.players.map(p => {
        if (p.id === payerId) return { ...p, credits: p.credits - rent }
        if (p.id === property.ownerId) return { ...p, credits: p.credits + rent }
        return p
      }),
      notification: `${payer.name} paid $${rent} rent to ${owner.name}!`
    })
  },
  
  // ========== Tile Check ==========
  checkTileAction: (position, playerId) => {
    const state = get()
    const tile = state.tileData[position]
    if (!tile) return
    
    // Special tiles
    if (tile.name === 'Go To Jail') {
      get().sendToJail(playerId)
      return
    }
    
    if (tile.type === 'chest') {
      get().drawCard('chest')
      return
    }
    
    if (tile.type === 'chance') {
      get().drawCard('chance')
      return
    }
    
    if (tile.type === 'tax') {
      set((state) => ({
        players: state.players.map(p =>
          p.id === playerId ? { ...p, credits: p.credits - tile.rent[0] } : p
        ),
        notification: `Paid $${tile.rent[0]} tax`,
        gamePhase: 'idle'
      }))
      return
    }
    
    // Property tiles
    const property = state.properties[position]
    if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
      if (!property) {
        set({ currentTileAction: { type: 'buy', tileId: position, tile }, gamePhase: 'action' })
      } else if (property.ownerId !== playerId) {
        get().payRent(position, playerId)
        set({ gamePhase: 'idle' })
      } else if (!property.hasHotel && tile.type === 'property') {
        set({ currentTileAction: { type: 'build', tileId: position, tile, property }, gamePhase: 'action' })
      } else {
        set({ gamePhase: 'idle' })
      }
    } else {
      set({ gamePhase: 'idle' })
    }
  }
}))
