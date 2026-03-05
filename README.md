# Free Web Games Hub

> 免下載、即開即玩的小遊戲網站，支援手機與桌機。

[![Live Site](https://img.shields.io/badge/Live%20Site-Online-2ea44f?style=for-the-badge)](https://jimmy4955.github.io/free-web-games/)
[![Game](https://img.shields.io/badge/Game-渡劫修仙-1f6feb?style=for-the-badge)](https://jimmy4955.github.io/free-web-games/game/tribulation-ascension/)

## Play Now

- 首頁：<https://jimmy4955.github.io/free-web-games/>
- 遊戲直連（渡劫修仙）：<https://jimmy4955.github.io/free-web-games/game/tribulation-ascension/>

## 專案特色

- 純 `HTML / CSS / JavaScript`，無框架、無 build
- 可直接部署到 GitHub Pages
- Canvas 即時遊戲玩法（閃避雷劫、境界突破、天賦成長）

## 遊戲列表

### 渡劫修仙（Tribulation Ascension）

左右移動閃避落雷，累積突破值提升境界，突破後可三選一天賦，挑戰更高分數。

![渡劫修仙](./assets/game-icon_tribulation-ascension.png)

## 本機啟動

```bash
# 在專案根目錄
python -m http.server 8000
```

打開：<http://127.0.0.1:8000/>

## 目錄結構

```text
/
  index.html
  styles.css
  script.js
  /assets
    game-icon_tribulation-ascension.png
    icon_main-menu.png
  /game
    /tribulation-ascension
      index.html
      game.css
      game.js
      /assets
        bg.png
        /audio
        /sprites
```

---

© 2026 Tu Free Games
