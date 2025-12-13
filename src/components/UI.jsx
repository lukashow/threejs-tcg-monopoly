import { useGameStore } from '../store/gameStore'
import './UI.css'

function CardModal({ card, type, onExecute }) {
  return (
    <div className="card-modal-overlay" onClick={onExecute}>
      <div className={`card-modal ${type}`} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          {type === 'chest' ? '📦 Community Chest' : '❓ Chance'}
        </div>
        <div className="card-content">
          <p>{card.text}</p>
        </div>
        <button className="card-button" onClick={onExecute}>OK</button>
      </div>
    </div>
  )
}

function JailPanel({ player, onPayBail, onUseCard }) {
  return (
    <div className="jail-status">
      <span>🔒 In Jail</span>
      <div className="jail-actions">
        <button onClick={onPayBail} disabled={player.credits < 50}>Pay $50</button>
        {player.hasJailCard && <button onClick={onUseCard}>Use Card</button>}
      </div>
    </div>
  )
}

function PropertyCards({ player, tileData, properties }) {
  const owned = player.ownedProperties.map(id => ({
    id,
    tile: tileData[id],
    property: properties[id]
  })).filter(p => p.tile)
  
  if (owned.length === 0) return <div className="owned-empty">No properties</div>
  
  return (
    <div className="owned-scroll">
      {owned.map(({ id, tile, property }) => (
        <div key={id} className="prop-card" style={{ borderTopColor: tile.color || '#888' }}>
          <div className="prop-stripe" style={{ background: tile.color || '#888' }} />
          <div className="prop-name">{tile.name}</div>
          <div className="prop-info">
            {property.houses > 0 && !property.hasHotel && `🏠×${property.houses}`}
            {property.hasHotel && '🏨'}
            <span className="prop-rent">${tile.rent[property.hasHotel ? 5 : property.houses]}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UI() {
  const players = useGameStore(s => s.players)
  const currentPlayer = useGameStore(s => s.currentPlayer)
  const gamePhase = useGameStore(s => s.gamePhase)
  const diceValues = useGameStore(s => s.diceValues)
  const cameraMode = useGameStore(s => s.cameraMode)
  const inJail = useGameStore(s => s.inJail)
  const notification = useGameStore(s => s.notification)
  const showCardModal = useGameStore(s => s.showCardModal)
  const currentCard = useGameStore(s => s.currentCard)
  const currentTileAction = useGameStore(s => s.currentTileAction)
  const tileData = useGameStore(s => s.tileData)
  const properties = useGameStore(s => s.properties)
  
  const executeCardAction = useGameStore(s => s.executeCardAction)
  const closeCardModal = useGameStore(s => s.closeCardModal)
  const buyProperty = useGameStore(s => s.buyProperty)
  const buildHouse = useGameStore(s => s.buildHouse)
  const skipAction = useGameStore(s => s.skipAction)
  const payBail = useGameStore(s => s.payBail)
  const useJailCard = useGameStore(s => s.useJailCard)
  const clearNotification = useGameStore(s => s.clearNotification)
  const nextPlayer = useGameStore(s => s.nextPlayer)
  const setGamePhase = useGameStore(s => s.setGamePhase)
  
  const player = players[currentPlayer]
  const total = diceValues[0] + diceValues[1]
  const doubles = diceValues[0] === diceValues[1]
  
  // Auto-clear notifications
  if (notification) {
    setTimeout(clearNotification, 3000)
  }
  
  const handleCardDone = () => {
    executeCardAction()
    setTimeout(() => {
      setGamePhase('idle')
      nextPlayer()
    }, 500)
  }
  
  const handleSkip = () => {
    skipAction()
    nextPlayer()
  }
  
  const handleBuy = (id) => {
    buyProperty(id)
    setTimeout(() => nextPlayer(), 500)
  }
  
  const handleBuild = (id) => {
    buildHouse(id)
    setTimeout(() => nextPlayer(), 500)
  }
  
  return (
    <div className="ui-container">
      {/* Title */}
      <div className="title">
        <h1>🎲 3D MONOPOLY</h1>
      </div>
      
      {/* Player Info */}
      <div className="player-info">
        <h2>Turn: {player.name}</h2>
        <div className="current-player" style={{ borderColor: player.color }}>
          <div className="player-indicator" style={{ background: player.color }} />
          <div className="player-details">
            <span className="name">{player.name}</span>
            <span className="credits">${player.credits}</span>
          </div>
          <span className="position">#{player.position}</span>
        </div>
        
        {inJail[player.id] && (
          <JailPanel
            player={player}
            onPayBail={() => payBail(player.id)}
            onUseCard={() => useJailCard(player.id)}
          />
        )}
      </div>
      
      {/* Dice */}
      <div className="dice-container">
        <div className="dice-pair">
          <div className={`dice ${gamePhase === 'rolling' ? 'rolling' : ''}`}>{diceValues[0]}</div>
          <div className={`dice ${gamePhase === 'rolling' ? 'rolling' : ''}`}>{diceValues[1]}</div>
        </div>
        <div className="dice-total">
          Total: {total}
          {doubles && <span className="doubles-badge">DOUBLES!</span>}
        </div>
        {gamePhase === 'idle' && (
          <div className="dice-instruction">Press <kbd>SPACE</kbd> to roll</div>
        )}
        {cameraMode === 'fpv' && <div className="camera-mode">📹 FPV</div>}
      </div>
      
      {/* Card Modal */}
      {showCardModal && currentCard && (
        <CardModal
          card={currentCard.card}
          type={currentCard.type}
          onExecute={handleCardDone}
        />
      )}
      
      {/* Action Panel */}
      {currentTileAction && (
        <div className="action-panel">
          {currentTileAction.type === 'buy' && (
            <>
              <h3>🏠 Buy {currentTileAction.tile.name}?</h3>
              <p>Price: ${currentTileAction.tile.price}</p>
              <div className="action-buttons">
                <button
                  className="btn-buy"
                  onClick={() => handleBuy(currentTileAction.tileId)}
                  disabled={player.credits < currentTileAction.tile.price}
                >
                  Buy
                </button>
                <button className="btn-skip" onClick={handleSkip}>Skip</button>
              </div>
            </>
          )}
          {currentTileAction.type === 'build' && (
            <>
              <h3>🏗️ Build on {currentTileAction.tile.name}?</h3>
              <p>Houses: {currentTileAction.property.houses}/4</p>
              <div className="action-buttons">
                <button className="btn-build" onClick={() => handleBuild(currentTileAction.tileId)}>
                  Build
                </button>
                <button className="btn-skip" onClick={handleSkip}>Skip</button>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Notification */}
      {notification && <div className="notification">{notification}</div>}
      
      {/* All Players */}
      <div className="players-list">
        <h3>Players</h3>
        {players.map((p, i) => (
          <div key={p.id} className={`player-item ${i === currentPlayer ? 'active' : ''} ${inJail[p.id] ? 'in-jail' : ''}`}>
            <div className="player-color" style={{ background: p.color }} />
            <span>{p.name} {inJail[p.id] && '🔒'}</span>
            <span className="player-credits">${p.credits}</span>
          </div>
        ))}
      </div>
      
      {/* Owned Properties */}
      <div className="owned-container">
        <h3 style={{ color: player.color }}>{player.name}'s Properties</h3>
        <PropertyCards player={player} tileData={tileData} properties={properties} />
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <p>⌨️ SPACE to roll | 🖱️ Hover tiles</p>
      </div>
    </div>
  )
}
