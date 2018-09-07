
let app;
let bunny;
let rectangle;
let points = [];

const tileSize = 64;
const FieldType = {
    0: 'dirt',
    1: 'grass',
};
const AdjourningTilePostfixMap = {
    0: { 0: 'c', 1: 'e' },
    1: { 0: 's', 1: 'se' }
};
const DirectionInversionMap = {
    'nw': 'se', 'n': 's', 'ne': 'sw',
    'w': 'e', 'c': 'c', 'e': 'w',
    'sw': 'ne', 's': 'n', 'se': 'nw',
    'nwi': 'sei', 'nei': 'swi', 'swi': 'nei', 'sei': 'nwi'
};
const DirectionFlag = [
    [1, 2, 4],
    [128, 0, 8],
    [64, 32, 16]
];

/*
      1  2    4
    128  X    8
     64  32  16
 */
const DirectionHashList = {
    'nw': [1],
    'n': [2, 5, 3, 6, 7],
    'ne': [4],
    'w': [128, 129, 65, 172, 173, 192, 193],
    'e': [8, 12, 24, 28, 20],
    'sw': [64],
    's': [32, 96, 48, 80, 112],
    'se': [16],
    'c': [68, 17, 136, 34, 35, 0],
    'f': [248, 255, 167, 95, 220, 221, 253, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 49, 50, 51, 53, 54, 55, 57, 58, 59, 61, 62, 63,
        73, 74, 75, 77, 78, 79, 82, 83, 85, 86, 87, 89, 90, 91, 93, 94, 95],
    'nwi': [130, 131, 135, 134, 67, 66, 120, 199, 69, 70, 71],
    'nei': [10, 14, 15, 19, 9, 11, 13, 18, 21, 22, 23, 25, 26, 27, 29, 30, 31],
    'swi': [160, 224, 33, 240, 81],
    'sei': [56, 40, 124, 92, 60, 108, 36, 40, 44, 56, 60, 72, 76, 84, 88, 92],
};
const DirectionHashMap = {};
for (const direction in DirectionHashList) {
    for (const i in DirectionHashList[direction]) {
        const hash = DirectionHashList[direction][i];
        DirectionHashMap[hash] = direction;
    }
}
const DirectionOffsetMap = {
    'nw': [[-1, -1], [-1, -1], [-1, -1]],
    'n': [[-1, -1], [0, -1], [1, -1]],
    'ne': [[1, -1], [1, -1], [1, -1]],
    'w': [[-1, 1], [-1, 0], [-1, -1]],
    'e': [[1, 1], [1, 0], [1, -1]],
    'sw': [[-1, 1], [-1, 1], [-1, 1]],
    's': [[1, 1], [0, 1], [-1, 1]],
    'se': [[1, 1], [1, 1], [1, 1]],
    'nwi': [[-1, -1], [-1, 0], [-1, -1], [0, -1], [1, -1]],
    'nei': [[-1, -1], [0, -1], [1, -1], [1, 0], [1, -1]],
    'swi': [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
    'sei': [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]],
    'c': [[0, 0], [0, 0], [0, 0]],
    'f': [[0, 0], [0, 0], [0, 0]]
};

function getAdjourningTileType(mapData, posX, posY) {
    let result = 0;

    if (posX >= 0 && posX < mapData.meta.size.w) {
        if (posY >= 0 && posY < mapData.meta.size.h) {
            result = mapData.fields[posY][posX];
        }
    }

    return result;
}

function findMaxType(types, except = []) {
    let result = types.find((type) => !except.includes(type));
    const counts = {};
    types.forEach((type) => counts[type] = types.filter((t) => t === type).length);
    let currentCount = counts[result];
    types.forEach((type) => {
        if (counts[type] > currentCount && !except.includes(type)) {
            currentCount = counts[type];
            result = type;
        }
    });

    return result || types[0];
}

function getAllAdjourningTiles(mapData, mx, my) {
    const result = [];

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (x === 1 && y === 1) { continue; }

            result.push(getAdjourningTileType(mapData, mx + (x - 1), my + (y - 1)));
        }
    }

    return result;
}

function getAdjourningTileTypeByDirection(mapData, mx, my, direction) {
    if (direction === 'f') {
        const types = getAllAdjourningTiles(mapData, mx, my);
        return findMaxType(types);
    }

    const types = [];
    for (var i in DirectionOffsetMap[direction]) {
        let posX = mx + DirectionOffsetMap[direction][i][0];
        let posY = my + DirectionOffsetMap[direction][i][1];
        const type = getAdjourningTileType(mapData, posX, posY);
        types.push(type);
    }

    return findMaxType(types, [mapData.fields[my][mx]]);
}

function generateTextureName(mainFieldType, adjourningTileType, direction) {
    const mainFieldTypeName = FieldType[mainFieldType];
    let result = mainFieldTypeName;
    if (direction !== 'c') {
        const adjourningTileTypeName = FieldType[adjourningTileType];
        if (direction === 'f') {
            result = adjourningTileTypeName;
        } else if (mainFieldType == adjourningTileType) {
            result = mainFieldTypeName;
        } else if (mainFieldType > adjourningTileType) {
            result = `edge_${adjourningTileTypeName}_${mainFieldTypeName}_${direction}`;
        } else {
            const inverteddirection = DirectionInversionMap[direction];
            result = `edge_${mainFieldTypeName}_${adjourningTileTypeName}_${inverteddirection}`;
        }
    }

    return result;
}

function calculateAdjourningHash(mapData, mx, my) {
    let result = 0;

    const mainFieldType = mapData.fields[my][mx];

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            let adjourningTilePosX = mx + (x - 1);
            let adjourningTilePosY = my + (y - 1);
            let adjourningTileType = getAdjourningTileType(mapData, adjourningTilePosX, adjourningTilePosY);
            if (adjourningTileType !== mainFieldType) {
                result += DirectionFlag[y][x];
            }
        }
    }

    return result;
}

function drawMap(mapData) {
    for (let my = 0; my < mapData.meta.size.h; my++) {
        for (let mx = 0; mx < mapData.meta.size.w; mx++) {
            const mainFieldType = mapData.fields[my][mx];
            let textureFieldName = FieldType[mainFieldType];

            if (mainFieldType === 0) {
                const hash = calculateAdjourningHash(mapData, mx, my);
                const direction = DirectionHashMap[hash];
                if (typeof direction === 'undefined') {
                    console.error('hash not yet defined: ' + hash);
                }
                let adjourningTileType = getAdjourningTileTypeByDirection(mapData, mx, my, direction);
                textureFieldName = generateTextureName(mainFieldType, adjourningTileType, direction);
            }

            let tile = new PIXI.Sprite(PIXI.utils.TextureCache[textureFieldName]);
            tile.x = mx * tileSize;
            tile.y = my * tileSize;
            app.stage.addChild(tile);
        }
    }

}

function onResourcesLoaded(loader, resources) {
    const spritesheet_texture = resources.tileset_image.texture;
    spritesheet_texture.sourceScale = 1;
    const spriteSheet = new PIXI.Spritesheet(spritesheet_texture, resources.tileset.data);
    spriteSheet.parse(() => {
        drawMap(resources.map.data);

        bunny = new PIXI.projection.Sprite2d(new PIXI.Texture.fromImage('bunny.png'));
        bunny.anchor.set(0.5);
        //bunny.x = app.screen.width / 2;
        //bunny.y = app.screen.height / 2;
        app.stage.addChild(bunny);

        rectangle = new PIXI.Graphics();
        rectangle.lineStyle(4, 0xFF3300, 1);
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(0, 0, 800, 800);
        rectangle.endFill();
        rectangle.x = 170;
        rectangle.y = 170;
        //app.stage.addChild(rectangle);

        for (let i = 0; i < 4; i++) {
            points.push(new PIXI.Graphics());
            points[i].lineStyle(4, 0xFF3300, 1);
            points[i].beginFill(0x66CCFF);
            points[i].drawCircle(0, 0, 10);
            points[i].endFill();
            app.stage.addChild(points[i]);
        }

        app.ticker.add(function (delta) {
            //bunny.rotation += 0.1 * delta;
        });
    });
}

function init() {
    app = new PIXI.Application(window.innerHeight, window.innerHeight, { backgroundColor: 0x1099bb });
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth, window.innerHeight)
    window.addEventListener("resize", () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    });
    window.setTimeout(() => app.renderer.resize(window.innerWidth, window.innerHeight), 1000);

    document.body.appendChild(app.view);

    var loader = new PIXI.loaders.Loader();
    loader
        .add('tileset_image', 'towerDefense.svg')
        .add('tileset', 'towerDefense.json')
        .add('map', 'map.json')
        .load(onResourcesLoaded);

    const WEBSOCKET_URL = 'ws://localhost:9000/';
    console.log('Connecting to WebSocket at', WEBSOCKET_URL);
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.addEventListener('open', (e) => {
        console.log('WebSocket Open', e);
    });

    ws.addEventListener('close', (e) => {
        console.log('WebSocket Close', e);
    });

    ws.addEventListener('error', (e) => {
        console.log('WebSocket Close', e);
    });

    ws.addEventListener('message', (e) => {
        //console.log('WebSocket Message', e);
        if (e.data instanceof Blob) {
            const reader = new FileReader()
            reader.onload = () => {
                const markers = JSON.parse(reader.result);
                for (const i in markers) {
                    const data = markers[i];
                    const { ids, marker, transform } = data;

                    let transformMatrix = new PIXI.Matrix(
                        transform[0][0],
                        transform[0][1],
                        transform[1][0],
                        transform[1][1],
                        transform[0][2],
                        transform[1][2],
                    )
                    transformMatrix.fromArray([...transform[0], ...transform[1], ...transform[2]])
                    console.log(marker, transform);

                    for (let i = 0; i < 4; i++) {
                        points[i].x = marker[i][0][0];
                        points[i].y = marker[i][0][1];
                    }

                    if (ids[0] == 0) {
                        /*rectangle.x = marker[0][0];
                        rectangle.y = marker[0][1];
                        rectangle.width = marker[2][0] - marker[0][0];
                        rectangle.height = marker[2][1] - marker[0][1];*/
                        bunny.proj.mapSprite(bunny, [
                            new PIXI.Point(marker[0][0][0], marker[0][0][1]),
                            new PIXI.Point(marker[1][0][0], marker[1][0][1]),
                            new PIXI.Point(marker[2][0][0], marker[2][0][1]),
                            new PIXI.Point(marker[3][0][0], marker[3][0][1]),
                        ]);
                    } else if (ids[0] == 1) {
                        rectangle.transform.setFromMatrix(transformMatrix);
                    }
                }
            };
            reader.readAsText(e.data);
        }
    });
}

init();