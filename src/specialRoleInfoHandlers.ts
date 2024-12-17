import { Player } from './types'

// 处理洗衣妇的特殊信息
export const handleWasherwomanInfo = (washerwoman: Player, players: Player[]) => {
  const townsfolkPlayers = players.filter(p => 
    p.role.type === 'townsfolk' && 
    p.role.name !== '洗衣妇'
  )
  
  if (townsfolkPlayers.length === 0) return undefined
  
  const randomTownsfolk = townsfolkPlayers[Math.floor(Math.random() * townsfolkPlayers.length)]
  const nonTownsfolkPlayers = players.filter(p => 
    p.number !== washerwoman.number && 
    p.number !== randomTownsfolk.number
  )
  const randomOther = nonTownsfolkPlayers[Math.floor(Math.random() * nonTownsfolkPlayers.length)]
  
  const selectedPlayers = [randomTownsfolk, randomOther].sort(() => Math.random() - 0.5)
  return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomTownsfolk.role.name}`
}

// 处理图书管理员的特殊信息
export const handleLibrarianInfo = (librarian: Player, players: Player[]) => {
  const outsiderPlayers = players.filter(p => p.role.type === 'outsider')
  
  if (outsiderPlayers.length === 0) return '没有外来者'
  
  const randomOutsider = outsiderPlayers[Math.floor(Math.random() * outsiderPlayers.length)]
  const nonOutsiderPlayers = players.filter(p => 
    p.number !== librarian.number && 
    p.number !== randomOutsider.number
  )
  const randomOther = nonOutsiderPlayers[Math.floor(Math.random() * nonOutsiderPlayers.length)]
  
  const selectedPlayers = [randomOutsider, randomOther].sort(() => Math.random() - 0.5)
  return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomOutsider.role.name}`
}

// 处理调查员的特殊信息
export const handleInvestigatorInfo = (investigator: Player, players: Player[]) => {
  const minionPlayers = players.filter(p => p.role.type === 'minion')
  
  if (minionPlayers.length === 0) return '没有爪牙'
  
  const randomMinion = minionPlayers[Math.floor(Math.random() * minionPlayers.length)]
  const nonMinionPlayers = players.filter(p => 
    p.number !== investigator.number && 
    p.number !== randomMinion.number
  )
  const randomOther = nonMinionPlayers[Math.floor(Math.random() * nonMinionPlayers.length)]
  
  const selectedPlayers = [randomMinion, randomOther].sort(() => Math.random() - 0.5)
  return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomMinion.role.name}`
}

// 处理厨师的特殊信息
export const handleChefInfo = (players: Player[]) => {
  let evilPairs = 0
  const totalPlayers = players.length
  
  for (let i = 0; i < totalPlayers; i++) {
    const currentPlayer = players[i]
    const nextPlayer = players[(i + 1) % totalPlayers]
    
    const isCurrentEvil = currentPlayer.role.type === 'demon' || 
                         currentPlayer.role.type === 'minion' || 
                         currentPlayer.role.name === '隐士'
    const isNextEvil = nextPlayer.role.type === 'demon' || 
                      nextPlayer.role.type === 'minion' || 
                      nextPlayer.role.name === '隐士'
    
    if (isCurrentEvil && isNextEvil) {
      evilPairs++
    }
  }
  
  return `邪恶玩家(隐士?)相邻数量：${evilPairs}`
}

// 处理共情者的特殊信息
export const handleEmpathInfo = (empath: Player, players: Player[]) => {
  const empathIndex = players.findIndex(p => p.number === empath.number)
  const totalPlayers = players.length
  
  let leftPlayer = null
  for (let i = 1; i <= totalPlayers; i++) {
    const index = (empathIndex - i + totalPlayers) % totalPlayers
    if (!players[index].isDead) {
      leftPlayer = players[index]
      break
    }
  }
  
  let rightPlayer = null
  for (let i = 1; i <= totalPlayers; i++) {
    const index = (empathIndex + i) % totalPlayers
    if (!players[index].isDead) {
      rightPlayer = players[index]
      break
    }
  }
  
  const evilCount = [leftPlayer, rightPlayer].filter(player => 
    player && (player.role.type === 'demon' || player.role.type === 'minion')
  ).length
  
  return `左边${leftPlayer?.number}号和右边${rightPlayer?.number}号中有${evilCount}个邪恶玩家`
}

// 处理恶魔的特殊信息
export const handleDemonInfo = (remainingRoles: string[]) => {
  return `未使用善良角色：${remainingRoles.join('，')}`
} 