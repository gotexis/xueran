import { useState, useEffect } from 'react'
import { Player, Role, PlayerCounts } from './types'
import { 
  playerCountData, 
  townsfolkRoles, 
  outsiderRoles, 
  minionRoles, 
  translations,
  FIRST_NIGHT_ORDER,
  OTHER_NIGHTS_ORDER 
} from './constants'
import {
  handleWasherwomanInfo,
  handleLibrarianInfo,
  handleInvestigatorInfo,
  handleChefInfo,
  handleEmpathInfo,
  handleDemonInfo
} from './specialRoleInfoHandlers'

export default function App() {
  const [counts, setCounts] = useState<PlayerCounts>({
    townsfolk: 3,
    outsider: 0,
    minion: 1,
    demon: 1
  })
  
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerView, setShowPlayerView] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [viewedPlayers, setViewedPlayers] = useState<Set<number>>(new Set())
  const [sortType, setSortType] = useState<'id' | 'firstNight' | 'otherNights'>('id')
  const [showSpecialInfo, setShowSpecialInfo] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)
  const [poisonedPlayer, setPoisonedPlayer] = useState<number | null>(null)
  const [infoModalPlayer, setInfoModalPlayer] = useState<number | null>(null)
  const [tempSpecialInfo, setTempSpecialInfo] = useState<string>('')

  // 从预设中选择玩家数量
  const handlePresetSelect = (totalPlayers: number) => {
    const preset = playerCountData.find(data => data[0] === totalPlayers)
    if (preset) {
      setCounts({
        townsfolk: preset[1],
        outsider: preset[2],
        minion: preset[3],
        demon: preset[4]
      })
    }
  }

  // 随机选择角色
  const createGame = () => {
    // 随机选择村民
    const shuffledVillagers = [...townsfolkRoles]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.townsfolk)
      .map(name => ({ name, type: 'townsfolk' as const }))
    
    // 随机选择外来者
    const shuffledOutsiders = [...outsiderRoles]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.outsider)
      .map(name => ({ name, type: 'outsider' as const }))
    
    // 随机选择爪牙
    const shuffledMinions = [...minionRoles]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.minion)
      .map(name => ({ name, type: 'minion' as const }))
    
    // 恶魔固定为小恶魔
    const demon = { name: '小恶魔', type: 'demon' as const }
    
    let selectedRoles: Role[] = [...shuffledVillagers, ...shuffledOutsiders, ...shuffledMinions, demon]
    
    // 处理男爵特殊规则
    if (selectedRoles.some(role => role.name === '男爵')) {
      const villagerIndices = selectedRoles
        .map((role, index) => role.type === 'townsfolk' ? index : -1)
        .filter(index => index !== -1)
      
      // 获取未使用的外来者
      const unusedOutsiders = outsiderRoles
        .filter(name => !selectedRoles.some(role => role.name === name))
      
      // 随机选择两个村民转换为外来者
      for (let i = 0; i < 2 && villagerIndices.length > 0 && unusedOutsiders.length > 0; i++) {
        const randomVillagerIndex = Math.floor(Math.random() * villagerIndices.length)
        const villagerIndex = villagerIndices[randomVillagerIndex]
        
        const randomOutsiderIndex = Math.floor(Math.random() * unusedOutsiders.length)
        const newOutsider = unusedOutsiders[randomOutsiderIndex]
        
        selectedRoles[villagerIndex] = { name: newOutsider, type: 'outsider' }
        
        // 从可选列表中移除已使用的选项
        villagerIndices.splice(randomVillagerIndex, 1)
        unusedOutsiders.splice(randomOutsiderIndex, 1)
      }
    }
    
    // 打乱角色顺序
    selectedRoles.sort(() => Math.random() - 0.5)
    
    // 创建玩家数组
    const newPlayers: Player[] = selectedRoles.map((role, index) => ({
      number: index + 1,
      role,
      isDead: false
    }))
    
    // 处理酒鬼特殊规则
    const drunkPlayer = newPlayers.find(player => player.role.name === '酒鬼')
    if (drunkPlayer) {
      const unusedVillagers = townsfolkRoles
        .filter(name => !selectedRoles.some(role => role.name === name))
      if (unusedVillagers.length > 0) {
        const randomVillager = unusedVillagers[Math.floor(Math.random() * unusedVillagers.length)]
        drunkPlayer.drunkRole = { name: randomVillager, type: 'townsfolk' }
      }
    }
    
    // 在创建完 selectedRoles 后，找出未使用的村民和外来者角色
    const usedRoles = new Set(selectedRoles.map(role => role.name))
    const remainingRoles = [...townsfolkRoles, ...outsiderRoles]
      .filter(role => !usedRoles.has(role))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3) // 随机选择3个未使用的角色
    
    // 在设置 setPlayers 之前，随机选择一个好人作为"柱子"
    const goodPlayers = newPlayers.filter(p => 
      p.role.type === 'townsfolk' || p.role.type === 'outsider'
    )
    
    if (goodPlayers.length > 0) {
      const pillarPlayer = goodPlayers[Math.floor(Math.random() * goodPlayers.length)]
      pillarPlayer.isPillar = true // 标记为"柱子"
    }

    setPlayers(newPlayers)
    setViewedPlayers(new Set())
    
    // 创建玩家数组后，处理洗衣妇的特殊信息
    const washerwoman = newPlayers.find(player => player.role.name === '洗衣妇')
    if (washerwoman) {
      washerwoman.specialInfo = handleWasherwomanInfo(washerwoman, newPlayers)
    }

    // 处理调查员的特殊信息`
    const librarian = newPlayers.find(player => player.role.name === '图书管理员')
    if (librarian) {
      librarian.specialInfo = handleLibrarianInfo(librarian, newPlayers)
    }

    // 处理调查员的特殊信息
    const investigator = newPlayers.find(player => player.role.name === '调查员')
    if (investigator) {
      investigator.specialInfo = handleInvestigatorInfo(investigator, newPlayers)
    }

    // 在处理调查员的特殊信息之后，添加处理厨师的特殊信息
    const chef = newPlayers.find(player => player.role.name === '厨师')
    if (chef) {
      chef.specialInfo = handleChefInfo(newPlayers)
    }

    // 在 createGame 函数中添加共情者的初始信息处理
    const empath = newPlayers.find(player => player.role.name === '共情者')
    if (empath) {
      // 初始化共情者信息
      updateEmpathInfo(empath, newPlayers)
    }

    // 在其他特殊信息处理之后添加
    const demon2 = newPlayers.find(player => player.role.name === '小恶魔')
    if (demon2) {
      demon2.specialInfo = handleDemonInfo(remainingRoles)
    }
  }

  // 在 App 组件中添加这个新函数
  const updateEmpathInfo = (empath: Player, playersList: Player[]) => {
    empath.specialInfo = handleEmpathInfo(empath, playersList)
  }

  // 修改死亡状态变更的处理函数
  const handlePlayerDeathChange = (player: Player) => {
    const newPlayers = [...players]
    const playerIndex = newPlayers.findIndex(p => p.number === player.number)
    newPlayers[playerIndex] = {...player, isDead: !player.isDead}
    
    // 更新共情者信息
    const empath = newPlayers.find(p => p.role.name === '共情者')
    if (empath) {
      updateEmpathInfo(empath, newPlayers)
    }
    
    setPlayers(newPlayers)
  }

  // 添加排序函数
  const getSortedPlayers = () => {
    const sortedPlayers = [...players]
    
    if (sortType === 'id') {
      return sortedPlayers.sort((a, b) => a.number - b.number)
    }
    
    const orderList = sortType === 'firstNight' ? FIRST_NIGHT_ORDER : OTHER_NIGHTS_ORDER
    
    return sortedPlayers.sort((a, b) => {
      // 特殊处理爪牙和恶魔在第一夜的顺序
      if (sortType === 'firstNight') {
        if (a.role.type === 'minion' && b.role.type !== 'minion') return -1
        if (a.role.type !== 'minion' && b.role.type === 'minion') return 1
        if (a.role.type === 'demon' && b.role.type !== 'demon') return -2
        if (a.role.type !== 'demon' && b.role.type === 'demon') return 2
      }
      
      const aIndex = orderList.indexOf(a.role.name)
      const bIndex = orderList.indexOf(b.role.name)
      
      // 如果角色不在行动顺序中，排到最后
      if (aIndex === -1 && bIndex === -1) return a.number - b.number
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      return aIndex - bIndex
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeTooltip !== null && !(event.target as Element).closest('.tooltip-trigger')) {
        setActiveTooltip(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeTooltip])

  const handlePoisonToggle = (playerNumber: number) => {
    // 找到对应的玩家
    const player = players.find(p => p.number === playerNumber)
    
    // 如果是邪恶阵营(爪牙或恶魔)，不允许中毒
    if (player && (player.role.type === 'minion' || player.role.type === 'demon')) {
      return
    }
    
    setPoisonedPlayer(poisonedPlayer === playerNumber ? null : playerNumber)
  }

  const handleInfoModalOpen = (player: Player) => {
    setInfoModalPlayer(player.number)
    
    let info = player.specialInfo || ''
    
    // 如果玩家中毒，添加中毒标记
    if (poisonedPlayer === player.number) {
      info = `${info} {{{中毒}}}`
    }
    
    // 如果是酒鬼，添加酒鬼标记
    if (player.role.name === '酒鬼') {
      info = `${info} {{{酒鬼}}}`
    }
    
    setTempSpecialInfo(info)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg p-4 shadow-md border border-gray-200 ">
          <h1 className="text-xl text-white px-2 mb-6 bg-gradient-to-r from-blue-500 to-purple-500">
            Exis的血染-暗流涌动DM工具箱
          </h1>

          <div className="flex flex-wrap items-center gap-4 justify-center mb-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => (
              <div key={type} className="flex-shrink-0">
                <div className="relative flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {translations[type]}
                  </span>
                  <input
                    type="number" 
                    value={counts[type]} 
                    disabled={type === 'demon'}
                    onChange={e => setCounts({...counts, [type]: parseInt(e.target.value) || 0})}
                    className="rounded-r-md block w-16 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                  />
                </div>
              </div>
            ))}

            <div className="flex-shrink-0">
              <select
                onChange={(e) => handlePresetSelect(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">选择玩家数量</option>
                {playerCountData.map(([total]) => (
                  <option key={total} value={total}>{total}人局</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={createGame}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded transition-colors text-white shadow-md text-sm"
            >
              创建游戏
            </button>

            {players.length > 0 && (
              <button 
                onClick={() => setShowPlayerView(true)}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded transition-colors text-white shadow-md text-sm"
              >
                进入玩家视图
              </button>
            )}
          </div>
        </div>

        {showPlayerView && players.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4">
              <h2 className="text-xl font-bold mb-4 text-center">选择你的座位号</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                {players.map(player => {
                  const isViewed = viewedPlayers.has(player.number)
                  return (
                    <button
                      key={player.number}
                      onClick={() => setSelectedPlayer(player.number)}
                      disabled={isViewed}
                      className={`px-4 py-2 rounded-lg ${
                        isViewed 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                    >
                      {player.number}号
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setShowPlayerView(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                关闭玩家视图
              </button>
            </div>
          </div>
        )}

        {selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4">
              <h2 className="text-xl font-bold mb-4 text-center">{selectedPlayer}号玩家的角色</h2>
              {(() => {
                const player = players.find(p => p.number === selectedPlayer)
                if (!player) return null
                
                const displayRole = player.role.name === '酒鬼' && player.drunkRole
                  ? player.drunkRole.name
                  : player.role.name

                return (
                  <div className="text-center mb-4">
                    <p className="text-2xl mb-2">{displayRole}</p>
                    <p className="text-lg text-gray-600">
                      {translations[player.role.name === '酒鬼' ? 'townsfolk' : player.role.type]}
                    </p>
                  </div>
                )
              })()}
              <button
                onClick={() => {
                  setViewedPlayers(prev => new Set([...prev, selectedPlayer]))
                  setSelectedPlayer(null)
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {!showPlayerView && players.length > 0 && (
          <>
            <div className="mb-4 flex justify-between items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                {[
                  { value: 'id', label: '按座位号排序' },
                  { value: 'firstNight', label: '首夜行动顺序' },
                  { value: 'otherNights', label: 'night行动顺序' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortType(option.value as 'id' | 'firstNight' | 'otherNights')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortType === option.value
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">显示特殊信息</span>
                <button
                  onClick={() => setShowSpecialInfo(!showSpecialInfo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSpecialInfo ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSpecialInfo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className={`overflow-x-auto rounded-lg border border-gray-200 ${infoModalPlayer ? 'hidden' : ''}`}>
              <table className="w-full border-collapse bg-white relative">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 border-b border-gray-200">序号</th>
                    <th className="px-4 py-2 border-b border-gray-200">角色</th>
                    <th className="px-4 py-2 border-b border-gray-200">阵营</th>
                    {showSpecialInfo && (
                      <th className="px-4 py-2 border-b border-gray-200">特殊信息</th>
                    )}
                    <th className="px-4 py-2 border-b border-gray-200 w-16">死亡</th>
                    <th className="px-4 py-2 border-b border-gray-200 w-16">中毒</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedPlayers().map(player => {
                    const isInActionOrder = sortType === 'id' || (
                      sortType === 'firstNight' 
                        ? FIRST_NIGHT_ORDER.includes(player.role.name)
                        : OTHER_NIGHTS_ORDER.includes(player.role.name)
                    )
                    
                    return (
                      <tr 
                        key={player.number} 
                        className={`hover:bg-gray-50 border-b border-gray-200 ${
                          player.isDead ? 'opacity-50' : ''
                        } ${!isInActionOrder ? 'opacity-40' : ''}`}
                      >
                        <td 
                          className="px-4 py-1.5 text-center cursor-pointer relative"
                          onClick={() => handleInfoModalOpen(player)}
                        >
                          <div className={`inline-block ${player.specialInfo ? 'border-b-2 border-dotted border-blue-500' : ''}`}>
                            {player.number}
                          </div>
                        </td>
                        <td className="px-4 py-1.5 text-center whitespace-nowrap relative">
                          <div 
                            className={`inline-flex items-center justify-center ${
                              player.specialInfo ? 'border-b-2 border-dotted border-blue-500 hover:border-blue-700 cursor-pointer' : ''
                            }`}
                            onClick={() => player.specialInfo && setActiveTooltip(activeTooltip === player.number ? null : player.number)}
                          >
                            {player.role.name}
                            {player.drunkRole && ` (以为是${player.drunkRole.name})`}
                            {player.isPillar && ' (柱子)'}
                          </div>
                          {activeTooltip === player.number && player.specialInfo && (
                            <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] left-1/2 transform -translate-x-1/2 mt-1"
                              style={{
                                bottom: 'calc(100% + 5px)',
                                marginBottom: '5px'
                              }}
                            >
                              {player.specialInfo}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-sm whitespace-nowrap ${
                            player.role.type === 'townsfolk' ? 'bg-blue-900 text-blue-200' :
                            player.role.type === 'outsider' ? 'bg-green-900 text-green-200' :
                            player.role.type === 'minion' ? 'bg-red-900 text-red-200' :
                            'bg-purple-900 text-purple-200'
                          }`}>
                            {translations[player.role.type]}
                          </span>
                        </td>
                        {showSpecialInfo && (
                          <td className="px-4 py-1.5 text-center">
                            <div className="text-sm whitespace-nowrap">
                              {player.specialInfo || '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-1.5 text-center">
                          <button
                            onClick={() => handlePlayerDeathChange(player)}
                            className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors text-lg leading-none ${
                              player.isDead 
                                ? 'border-red-500 text-red-500 bg-red-50' 
                                : 'border-gray-300 text-gray-300 hover:border-red-500 hover:text-red-500'
                            }`}
                          >
                            {player.isDead ? '×' : ''}
                          </button>
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          {player.role.type !== 'minion' && player.role.type !== 'demon' && (
                            <button
                              onClick={() => handlePoisonToggle(player.number)}
                              className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors ${
                                poisonedPlayer === player.number
                                  ? 'border-purple-500 text-purple-500 bg-purple-50'
                                  : 'border-gray-300 text-gray-300 hover:border-purple-500 hover:text-purple-500'
                              }`}
                            >
                              {poisonedPlayer === player.number ? '☠️' : ''}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => {
              const total = players.filter(p => p.role.type === type).length
              const alive = players.filter(p => p.role.type === type && !p.isDead).length
              return (
                <div 
                  key={type}
                  className={`p-4 rounded-lg border ${
                    type === 'townsfolk' ? 'bg-blue-900/50 border-blue-700' :
                    type === 'outsider' ? 'bg-green-900/50 border-green-700' :
                    type === 'minion' ? 'bg-red-900/50 border-red-700' :
                    'bg-purple-900/50 border-purple-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold mb-1">{translations[type]}</div>
                    <div className="text-sm">
                      存活: {alive} / {total}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {infoModalPlayer && (
        <>
          <div className="fixed inset-0 bg-black z-40" />
          
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4 relative">
              {(() => {
                const player = players.find(p => p.number === infoModalPlayer)
                if (!player) return null
                
                const displayRole = player.role.name === '酒鬼' && player.drunkRole
                  ? player.drunkRole.name
                  : player.role.name

                return (
                  <>
                    <h2 className="text-xl font-bold mb-4 text-center">{infoModalPlayer}号玩家信息</h2>
                    <div className="text-center mb-4">
                      <p className="text-2xl mb-2">{displayRole}</p>
                      <p className="text-lg text-gray-600 mb-4">
                        {translations[player.role.name === '酒鬼' ? 'townsfolk' : player.role.type]}
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          特殊信息 (DM需要考虑中毒 / 醉酒)
                        </label>
                        <textarea
                          value={tempSpecialInfo}
                          onChange={(e) => setTempSpecialInfo(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                          placeholder="输入特殊信息..."
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setInfoModalPlayer(null)}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        关闭
                      </button>
                      <button
                        onClick={() => setTempSpecialInfo('')}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-red-600"
                      >
                        清空
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  )
}

