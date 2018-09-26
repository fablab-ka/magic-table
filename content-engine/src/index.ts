import * as PIXI from 'pixi.js';

import TiledMap from './tiledmap/TiledMap';
import tiledMapLoader from './tiledmap/tiledMapLoader';
import TileLayer from './tiledmap/TileLayer';

import {
    backgroundColor,
} from './constants';
// import './pixi-projection.js';
import { Command, StatementList } from './types';

let app: PIXI.Application;
let bunny: PIXI.Sprite;
let map: TiledMap;
let ready = false;
const statements: StatementList = {
    51: {
        command: Command.Forward,
        file: 'tiles/scratch_tile_statement_forward.svg',
        sprite: new PIXI.Sprite(),
    },
    52: {
        command: Command.Left,
        file: 'tiles/scratch_tile_statement_left.svg',
        sprite: new PIXI.Sprite(),
    },
    53: {
        command: Command.Right,
        file: 'tiles/scratch_tile_statement_right.svg',
        sprite: new PIXI.Sprite(),
    },
};
let rectangle;
const points: PIXI.Graphics[] = [];

function onResourcesLoaded(loader: PIXI.loaders.Loader, resources: PIXI.loaders.ResourceDictionary) {
    map = new TiledMap(resources.map);
    app.stage.addChild(map);

    const spritesheetTexture = resources.tileset_image.texture;
    // spritesheetTexture.sourceScale = 1;
    const spriteSheet = new PIXI.Spritesheet(spritesheetTexture.baseTexture, resources.tileset.data);
    spriteSheet.parse(() => {
        // drawMap(resources.map.data);

        for (const id in statements) {
            if (statements.hasOwnProperty(id)) {
                statements[id].sprite.anchor.set(0.5);

                const tileSprite = new PIXI.Sprite(resources[`statement_${id}`].texture);
                tileSprite.anchor.set(0, 0.5);
                tileSprite.position.x = -1;
                tileSprite.scale.x = 0.025;
                tileSprite.scale.y = 0.025;
                // tileSprite.position.x = -10;
                statements[id].sprite.addChild(tileSprite);
                app.stage.addChild(statements[id].sprite);
            }
        }

        bunny = new PIXI.Sprite(resources.bunny.texture);
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

        let currentWiggle = 0;
        let step = 1;
        app.ticker.add((delta) => {
            // bunny.rotation += 0.1 * delta;
            (map.layers[2] as TileLayer).tiles.forEach((tile) => {
                tile.y += currentWiggle*0.1;
            });
            currentWiggle += step;
            if (currentWiggle >= 10 && step > 0) {
                step = -1;
            } else if (currentWiggle <= -10 && step < 0) {
                step = 1;
            }
        });

        ready = true;
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

    PIXI.loaders.Loader.addPixiMiddleware(tiledMapLoader);
    PIXI.loader.use(tiledMapLoader());
    const loader = new PIXI.loaders.Loader();
    for (const id in statements) {
        if (statements.hasOwnProperty(id)) {
            loader.add(`statement_${id}`, statements[id].file);
        }
    }
    loader
        .add('bunny', 'bunny.png')
        .add('tileset_image', 'towerDefense.svg')
        .add('tileset', 'towerDefense.json')
        .add('map', 'assets/map_02.tmx')
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
        if (!ready) { return; }

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

                    const transformMatrix = new PIXI.Matrix(
                        transform[0][0],
                        transform[0][1],
                        transform[1][0],
                        transform[1][1],
                        transform[0][2],
                        transform[1][2],
                    );
                    transformMatrix.fromArray([...transform[0], ...transform[1], ...transform[2]]);

                    if (statements[ids[0]]) {
                        const sprite = statements[ids[0]].sprite;
                        if (sprite) {
                            app.stage.addChild(sprite);
                            // (sprite.transform as PIXI.TransformStatic).setFromMatrix(transformMatrix);
                        } else {
                            console.error('sprite not defined', ids[0]);
                        }
                        /*
                        sprite.proj.mapSprite(sprite, [
                            new PIXI.Point(marker[0][0][0], marker[0][0][1]),
                            new PIXI.Point(marker[1][0][0], marker[1][0][1]),
                            new PIXI.Point(marker[2][0][0], marker[2][0][1]),
                            new PIXI.Point(marker[3][0][0], marker[3][0][1]),
                        ]);*/
                    } else if (ids[0] === 0) {
                        app.stage.addChild(map);
                        app.stage.addChild(bunny);
                        // (bunny.transform as PIXI.TransformStatic).setFromMatrix(transformMatrix);
                        bunny.position.x = transform[0][2];
                        bunny.position.y = transform[1][2];
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
