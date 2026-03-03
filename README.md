# Free Web Games Hub

一個「免費網頁遊戲合集站」：主打 **極簡、快速、可擴充**。  
部署在 GitHub Pages，任何人打開網址就能直接玩。

## 已上線遊戲

- ⚡ **一鍵渡劫（One-Key Tribulation）**  
  路徑：`/game/one-key-tribulation/`  
  操作：按住蓄力 → 放開觸發雷劫 → 拖曳左右閃避  
  特色：短回合、可無限重玩、支援桌機與手機觸控

## 專案結構
/
index.html # 合集站首頁
styles.css # 全站共用樣式
script.js # 首頁互動（示範/預留）
/game
/one-key-tribulation
index.html # 遊戲頁（canvas + HUD）
game.js # 遊戲邏輯
game.css # 遊戲樣式


## 本機開發

### 方法 1：直接開啟
- 直接用瀏覽器打開 `index.html`（可用，但有些瀏覽器對本機資源限制較多）

### 方法 2：用 VS Code Live Server（推薦）
1. VS Code 安裝 **Live Server**
2. 右鍵 `index.html` → **Open with Live Server**
3. 瀏覽器會開啟本機網址，修改存檔會自動刷新

## 部署（GitHub Pages）

1. 進入 GitHub repo → **Settings** → **Pages**
2. Source 選 **Deploy from a branch**
3. Branch 選 `main`，資料夾選 `/ (root)`
4. 儲存後等候 Pages 產生網址即可

## Roadmap（下一步）

- 新增更多小遊戲並持續上架
- 每款遊戲獨立資料夾（利於 SEO、維護與擴充）
- 加入簡易本機排行榜 / 成就系統（localStorage）
- 後續視流量導入廣告與導流頁（AdSense 版位已預留）