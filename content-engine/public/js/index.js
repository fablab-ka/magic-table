import * as PIXI from 'pixi.js';
import { backgroundColor, DirectionFlag, DirectionHashes, DirectionInversionMap, DirectionOffsetMap, tileSize, } from './constants.js';
import './pixi-projection.js';
import { Command, TileType } from './types';
let app;
let bunny;
let map;
const statements = {
    1: {
        command: Command.Forward,
        file: 'tiles/scratch_tile_statement_forward.svg',
    },
    52: {
        command: Command.Left,
        file: 'tiles/scratch_tile_statement_left.svg',
    },
    53: {
        command: Command.Right,
        file: 'tiles/scratch_tile_statement_right.svg',
    },
};
let rectangle;
const points = [];
const DirectionHashMap = {};
for (const direction of Object.keys(DirectionHashes)) {
    for (const hash of DirectionHashes[direction]) {
        DirectionHashMap[hash] = direction;
    }
}
function getAdjourningTileType(mapData, posX, posY) {
    let result = TileType.Dirt;
    if (posX >= 0 && posX < mapData.meta.size.w) {
        if (posY >= 0 && posY < mapData.meta.size.h) {
            result = mapData.fields[posY][posX];
        }
    }
    return result;
}
function findMaxType(types, except = []) {
    let result = types.find((type) => !except.includes(type));
    if (!result) {
        return undefined;
    }
    const counts = {
        [TileType.Dirt]: 0,
        [TileType.Grass]: 0,
    };
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
            if (x === 1 && y === 1) {
                continue;
            }
            result.push(getAdjourningTileType(mapData, mx + (x - 1), my + (y - 1)));
        }
    }
    return result;
}
function getAdjourningTileTypeByDirection(mapData, mx, my, direction) {
    if (direction === 'f') {
        const tileTypes = getAllAdjourningTiles(mapData, mx, my);
        return findMaxType(tileTypes);
    }
    const types = [];
    for (const pos of Object.values(DirectionOffsetMap[direction])) {
        const type = getAdjourningTileType(mapData, pos[0], pos[1]);
        types.push(type);
    }
    return findMaxType(types, [mapData.fields[my][mx]]);
}
function generateTextureName(mainFieldType, adjourningTileType, direction) {
    const mainTileTypeName = TileType[mainFieldType];
    let result = mainTileTypeName;
    if (direction !== 'c') {
        if (!adjourningTileType) {
            result = mainTileTypeName;
        }
        else {
            const adjourningTileTypeName = TileType[adjourningTileType];
            if (direction === 'f') {
                result = adjourningTileTypeName;
            }
            else if (mainFieldType === adjourningTileType) {
                result = mainTileTypeName;
            }
            else if (mainFieldType > adjourningTileType) {
                result = `edge_${adjourningTileTypeName}_${mainTileTypeName}_${direction}`;
            }
            else {
                const inverteddirection = DirectionInversionMap[direction];
                result = `edge_${mainTileTypeName}_${adjourningTileTypeName}_${inverteddirection}`;
            }
        }
    }
    return result;
}
function calculateAdjourningHash(mapData, mx, my) {
    let result = 0;
    const mainFieldType = mapData.fields[my][mx];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            const adjourningTilePosX = mx + (x - 1);
            const adjourningTilePosY = my + (y - 1);
            const adjourningTileType = getAdjourningTileType(mapData, adjourningTilePosX, adjourningTilePosY);
            if (adjourningTileType !== mainFieldType) {
                result += DirectionFlag[y][x];
            }
        }
    }
    return result;
}
function drawMap(mapData) {
    map = new PIXI.Sprite();
    for (let my = 0; my < mapData.meta.size.h; my++) {
        for (let mx = 0; mx < mapData.meta.size.w; mx++) {
            const mainFieldType = mapData.fields[my][mx];
            let textureFieldName = TileType[mainFieldType];
            if (mainFieldType === 0) {
                const hash = calculateAdjourningHash(mapData, mx, my);
                const direction = DirectionHashMap[hash];
                if (typeof direction === 'undefined') {
                    console.error('hash not yet defined: ' + hash);
                }
                const adjourningTileType = getAdjourningTileTypeByDirection(mapData, mx, my, direction);
                textureFieldName = generateTextureName(mainFieldType, adjourningTileType, direction);
            }
            const tile = new PIXI.Sprite(PIXI.utils.TextureCache[textureFieldName]);
            tile.x = mx * tileSize;
            tile.y = my * tileSize;
            map.addChild(tile);
        }
    }
    app.stage.addChild(map);
}
function onResourcesLoaded(loader, resources) {
    const spritesheetTexture = resources.tileset_image.texture;
    // spritesheetTexture.sourceScale = 1;
    const spriteSheet = new PIXI.Spritesheet(spritesheetTexture.baseTexture, resources.tileset.data);
    spriteSheet.parse(() => {
        drawMap(resources.map.data);
        Object.values(statements).forEach((statement) => {
            statement.sprite = new PIXI.Sprite();
            statement.sprite.anchor.set(0.5);
            const tileSprite = new PIXI.Sprite(PIXI.Texture.fromImage(statement.file));
            tileSprite.anchor.set(0, 0.5);
            tileSprite.position.x = -1;
            tileSprite.scale.x = 0.025;
            tileSprite.scale.y = 0.025;
            // tileSprite.position.x = -10;
            statement.sprite.addChild(tileSprite);
            app.stage.addChild(statement.sprite);
        });
        bunny = new PIXI.Sprite(PIXI.Texture.fromImage('bunny.png'));
        bunny.anchor.set(0.5);
        app.stage.addChild(bunny);
        rectangle = new PIXI.Graphics();
        rectangle.lineStyle(4, 0xFF3300, 1);
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(0, 0, 800, 800);
        rectangle.endFill();
        rectangle.x = 170;
        rectangle.y = 170;
        // app.stage.addChild(rectangle);
        for (let i = 0; i < 4; i++) {
            points.push(new PIXI.Graphics());
            points[i].lineStyle(4, 0xFF3300, 1);
            points[i].beginFill(0x66CCFF);
            points[i].drawCircle(0, 0, 10);
            points[i].endFill();
            app.stage.addChild(points[i]);
        }
        app.ticker.add((delta) => {
            // bunny.rotation += 0.1 * delta;
        });
    });
}
function init() {
    app = new PIXI.Application(window.innerHeight, window.innerHeight, { backgroundColor });
    app.renderer.view.style.position = 'absolute';
    app.renderer.view.style.display = 'block';
    app.renderer.autoResize = true;
    app.renderer.resize(1920, 1080);
    /*window.addEventListener("resize", () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    });
    window.setTimeout(() => app.renderer.resize(window.innerWidth, window.innerHeight), 1000);*/
    document.body.appendChild(app.view);
    const loader = new PIXI.loaders.Loader();
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
        // console.log('WebSocket Message', e);
        if (e.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result !== 'string') {
                    throw new Error('Unable to parse message ' + JSON.stringify(reader.result));
                }
                const markers = JSON.parse(reader.result);
                app.stage.removeChildren();
                for (const data of markers) {
                    const { ids, marker, transform } = data;
                    const transformMatrix = new PIXI.Matrix(transform[0][0], transform[0][1], transform[1][0], transform[1][1], transform[0][2], transform[1][2]);
                    transformMatrix.fromArray([...transform[0], ...transform[1], ...transform[2]]);
                    if (statements[ids[0]]) {
                        const sprite = statements[ids[0]].sprite;
                        if (sprite) {
                            app.stage.addChild(sprite);
                            sprite.transform.setFromMatrix(transformMatrix);
                        }
                        else {
                            console.error('sprite not defined', ids[0]);
                        }
                        /*
                        sprite.proj.mapSprite(sprite, [
                            new PIXI.Point(marker[0][0][0], marker[0][0][1]),
                            new PIXI.Point(marker[1][0][0], marker[1][0][1]),
                            new PIXI.Point(marker[2][0][0], marker[2][0][1]),
                            new PIXI.Point(marker[3][0][0], marker[3][0][1]),
                        ]);*/
                    }
                    else if (ids[0] === 0) {
                        app.stage.addChild(map);
                        app.stage.addChild(bunny);
                        bunny.transform.setFromMatrix(transformMatrix);
                        /* bunny.proj.mapSprite(bunny, [
                                new PIXI.Point(marker[0][0][0], marker[0][0][1]),
                                new PIXI.Point(marker[1][0][0], marker[1][0][1]),
                                new PIXI.Point(marker[2][0][0], marker[2][0][1]),
                                new PIXI.Point(marker[3][0][0], marker[3][0][1]),
                            ]); */
                        for (let i = 0; i < 4; i++) {
                            points[i].x = marker[i][0][0];
                            points[i].y = marker[i][0][1];
                            app.stage.addChild(points[i]);
                        }
                    }
                }
            };
            reader.readAsText(e.data);
        }
    });
}
init();
//# sourceMappingURL=index.js.map