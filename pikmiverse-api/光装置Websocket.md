# 光装置 Websocket

## 接続先

### ws://x.x.x.x/ws/pikmiverse

IPは3/3に払出し予定

## メッセージサンプル

### 1. 全装置が消灯する

```json
{
  "devices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  "action": "off",
  "parts": ["arm", "edge"]
}
```

### 2. 全装置が開く

```json
{
  "devices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  "action": "open"
}
```

### 3. 全装置が白でstaticに光る

```json
{
  "devices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  "action": "on",
  "parts": ["arm"],
  "color": "#ffffff",
  "type": "static"
}
```

### 4. 全装置が虹色ギラギラに光る

```json
{
  "devices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  "action": "on",
  "parts": ["arm"],
  "color": "rainbow",
  "type": "sparkle"
}
```

### 5. 奇数組（新郎グループ）が紫色でキラキラ点灯する（e.g. ダイヤモンドダスト）

```json
{
  "devices": [1, 3, 5, 7, 9, 11, 13, 15],
  "action": "on",
  "parts": ["arm"],
  "color": "#874da1",
  "type": "sparkle"
}
```

### 6. 偶数組（新婦グループ）がピンク色で②と同じ光り方をする

```json
{
  "devices": [2, 4, 6, 8, 10, 12, 14, 16],
  "action": "on",
  "parts": ["arm"],
  "color": "#ff59ac",
  "type": "sparkle"
}
```

### 7. valueに応じて下からstaticに点灯する（e.g. 欽ちゃん仮装大賞の得点）

```json
{
  "devices": [1],
  "action": "on",
  "parts": ["arm"],
  "color": "#ffffff",
  "type": "static",
  "value": 0.5
}
```

### 8. #7で進捗がmaxになった時に先端を点滅させる

```json
{
  "devices": [1],
  "action": "on",
  "parts": ["edge"],
  "color": "#2aeded",
  "type": "blink"
}
```
