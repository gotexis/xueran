import { useState } from 'react'
import { Player, Role, PlayerCounts } from './types'

// 玩家数量，平民，外来者，爪牙，恶魔 (always 1)
const playerCountData = [
  [5, 3, 0, 1, 1],
  [6, 3, 1, 1, 1],
  [7, 5, 0, 2, 1],
  [8, 5, 1, 1, 1],
  [9, 5, 2, 1, 1],
  [10, 7, 0, 2, 1],
  [11, 7, 1, 2, 1],
  [12, 7, 2, 2, 1],
  [13, 9, 0, 3, 1],
  [14, 9, 1, 3, 1],
  [15, 9, 2, 3, 1],
  [16, 10, 2, 3, 1],
  [17, 11, 2, 3, 1],
  [18, 12, 2, 3, 1],
]

const townsfolkRoles = [
  "洗衣妇",
  "图书管理员",
  "调查员",
  "厨师",
  "共情者",
  "占卜师",
  "送葬者",
  "僧侣",
  "渡鸦",
  "处女",
  "杀手",
  "士兵",
  "市长",
]

const outsiderRoles = [
  "管家",
  "酒鬼",
  "隐士",
  "圣徒",
]

const minionRoles = [
  "投毒者",
  "间谍",
  "猩红女郎",
  "男爵",
]

const translations = {
  "townsfolk": "村民",
  "outsider": "外来者",
  "minion": "爪牙",
  "demon": "恶魔",
}

// 在文件顶部添加排序顺序的常量
const FIRST_NIGHT_ORDER = [
  "爪牙", // 特殊情况，用于显示
  "恶魔", // 特殊情况，用于显示
  "投毒者",
  "洗衣妇",
  "图书管理员",
  "调查员",
  "厨师",
  "共情者",
  "占卜师",
  "管家",
  "间谍",
]

const OTHER_NIGHTS_ORDER = [
  "投毒者",
  "僧侣",
  "猩红女郎",
  "小恶魔",
  "渡鸦",
  "共情者",
  "占卜师",
  "管家",
  "送葬者",
  "间谍",
]

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
  const [sortType, setSortType] = useState<'number' | 'firstNight' | 'otherNights'>('number')
  const [unusedTownsfolk, setUnusedTownsfolk] = useState<string[]>([])

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
    
    setUnusedTownsfolk(remainingRoles)
    setPlayers(newPlayers)
    setViewedPlayers(new Set())
    
    // 创建玩家数组后，处理洗衣妇的特殊信息
    const washerwoman = newPlayers.find(player => player.role.name === '洗衣妇')
    if (washerwoman) {
      // 找出所有村民
      const townsfolkPlayers = newPlayers.filter(p => p.role.type === 'townsfolk' && p.role.name !== '洗衣妇')
      // 随机选择一个村民
      const randomTownsfolk = townsfolkPlayers[Math.floor(Math.random() * townsfolkPlayers.length)]
      
      // 随机选择一个非村民玩家
      const nonTownsfolkPlayers = newPlayers.filter(p => 
        p.number !== washerwoman.number && 
        p.number !== randomTownsfolk.number
      )
      const randomOther = nonTownsfolkPlayers[Math.floor(Math.random() * nonTownsfolkPlayers.length)]
      
      // 随机排序这两个玩家
      const selectedPlayers = [randomTownsfolk, randomOther].sort(() => Math.random() - 0.5)
      
      // 修改信息格式
      washerwoman.specialInfo = `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomTownsfolk.role.name}`
    }

    // 处理调查员的特殊信息`
    const librarian = newPlayers.find(player => player.role.name === '图书管理员')
    if (librarian) {
      // 找出所有外来者
      const outsiderPlayers = newPlayers.filter(p => p.role.type === 'outsider')
      
      if (outsiderPlayers.length > 0) {
        // 随机选择一个外来者
        const randomOutsider = outsiderPlayers[Math.floor(Math.random() * outsiderPlayers.length)]
        
        // 随机选择一个非外来者玩家
        const nonOutsiderPlayers = newPlayers.filter(p => 
          p.number !== librarian.number && 
          p.number !== randomOutsider.number
        )
        const randomOther = nonOutsiderPlayers[Math.floor(Math.random() * nonOutsiderPlayers.length)]
        
        // 随机排序这两个玩家
        const selectedPlayers = [randomOutsider, randomOther].sort(() => Math.random() - 0.5)
        
        // 修改信息格式
        librarian.specialInfo = `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomOutsider.role.name}`
      } else {
        librarian.specialInfo = '没有外来者'
      }
    }

    // 处理调查员的特殊信息
    const investigator = newPlayers.find(player => player.role.name === '调查员')
    if (investigator) {
      // 找出所有爪牙
      const minionPlayers = newPlayers.filter(p => p.role.type === 'minion')
      
      if (minionPlayers.length > 0) {
        // 随机选择一个爪牙
        const randomMinion = minionPlayers[Math.floor(Math.random() * minionPlayers.length)]
        
        // 随机选择一个非爪牙玩家
        const nonMinionPlayers = newPlayers.filter(p => 
          p.number !== investigator.number && 
          p.number !== randomMinion.number
        )
        const randomOther = nonMinionPlayers[Math.floor(Math.random() * nonMinionPlayers.length)]
        
        // 随机排序这两个玩家
        const selectedPlayers = [randomMinion, randomOther].sort(() => Math.random() - 0.5)
        
        // 修改信息格式
        investigator.specialInfo = `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomMinion.role.name}`
      } else {
        investigator.specialInfo = '没有爪牙'
      }
    }
  }

  // 添加排序函数
  const getSortedPlayers = () => {
    const sortedPlayers = [...players]
    
    if (sortType === 'number') {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <span>管理员视图</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showPlayerView}
              onChange={e => setShowPlayerView(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span>玩家视图</span>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => (
            <input
              key={type}
              type="number"
              value={counts[type]} 
              disabled={type === 'demon'}
              onChange={e => setCounts({...counts, [type]: parseInt(e.target.value) || 0})}
              placeholder={`${translations[type]}数量`}
              className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {playerCountData.map(([total]) => (
            <button 
              key={total} 
              onClick={() => handlePresetSelect(total)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              {total}人局
            </button>
          ))}
        </div>
        
        <button 
          onClick={createGame}
          className="w-full max-w-xs mx-auto block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          创建游戏
        </button>
      </div>

      {showPlayerView && players.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
          <div className="mb-4">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as 'number' | 'firstNight' | 'otherNights')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="number">按座位号排序</option>
              <option value="firstNight">第一夜行动顺序</option>
              <option value="otherNights">其他夜晚行动顺序</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">序号</th>
                  <th className="px-4 py-2 border">角色</th>
                  <th className="px-4 py-2 border">阵营</th>
                  <th className="px-4 py-2 border">特殊信息</th>
                  <th className="px-4 py-2 border">死亡</th>
                </tr>
              </thead>
              <tbody>
                {getSortedPlayers().map(player => (
                  <tr key={player.number} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">{player.number}</td>
                    <td className="px-4 py-2 border text-center">
                      {player.role.name}
                      {player.drunkRole && ` (以为是${player.drunkRole.name})`}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                        player.role.type === 'townsfolk' ? 'bg-blue-100 text-blue-800' :
                        player.role.type === 'outsider' ? 'bg-green-100 text-green-800' :
                        player.role.type === 'minion' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {translations[player.role.type]}
                      </span>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {player.specialInfo || '-'}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        checked={player.isDead}
                        onChange={() => {
                          const newPlayers = [...players]
                          const playerIndex = newPlayers.findIndex(p => p.number === player.number)
                          newPlayers[playerIndex] = {...player, isDead: !player.isDead}
                          setPlayers(newPlayers)
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {unusedTownsfolk.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">未使用的善良角色：</h3>
              <div className="flex gap-4 flex-wrap">
                {unusedTownsfolk.map((role, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    {role}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => {
              const total = players.filter(p => p.role.type === type).length
              const alive = players.filter(p => p.role.type === type && !p.isDead).length
              return (
                <div 
                  key={type}
                  className={`p-4 rounded-lg ${
                    type === 'townsfolk' ? 'bg-blue-100' :
                    type === 'outsider' ? 'bg-green-100' :
                    type === 'minion' ? 'bg-red-100' :
                    'bg-purple-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold mb-1">{translations[type]}</div>
                    <div>
                      存活: {alive} / {total}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
