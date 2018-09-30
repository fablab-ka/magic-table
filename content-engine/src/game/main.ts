import { Store } from 'redux';

import { backgroundColor } from '../constants';
import TiledMap from '../tiledmap/TiledMap';
import TileLayer from '../tiledmap/TileLayer';
import GameCommunication from './communication';
import { MarkerMessage } from './game-types';
import { GameResourceManager, GameResources } from './resource-manager';
import { updateStatement } from './state/actions';
import store from './state/store';
import statements from './statements';

export default class MainGame {
    private communication: GameCommunication;
    private resourceManager: GameResourceManager;

    private app: PIXI.Application;

    private map?: TiledMap;
    private currentActiveElementsWiggle: number = 0;
    private currentActiveElementsStep: number = .3;

    private bunny?: PIXI.Sprite;
    private rectangle?: PIXI.Graphics;
    private points: PIXI.Graphics[] = [];

    private store: Store;

    constructor() {
        this.store = store;

        this.communication = new GameCommunication();
        this.communication.onMarkerMessage.add(this.onMarkerMessage.bind(this));

        this.resourceManager = new GameResourceManager(statements);
        this.resourceManager.onReady.add(this.onResourcesReady.bind(this));

        this.app = new PIXI.Application(window.innerHeight, window.innerHeight, { backgroundColor });
        this.app.renderer.view.style.position = 'absolute';
        this.app.renderer.view.style.display = 'block';
        this.app.renderer.autoResize = true;
        this.app.renderer.resize(1920, 1080);
        this.app.ticker.add(this.onTick.bind(this));
        /*window.addEventListener("resize", () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
         });
         window.setTimeout(() => app.renderer.resize(window.innerWidth, window.innerHeight), 1000);*/
    }

    public start() {
        document.body.appendChild(this.app.view);

        this.resourceManager.load();
    }

    private onResourcesReady({ map, spriteSheet, resources }: GameResources) {
        this.map = map;
        this.app.stage.addChild(this.map);

        for (const id in statements) {
            if (statements.hasOwnProperty(id)) {
                statements[id].sprite.anchor.set(0.5);

                const tileSprite = new PIXI.Sprite(resources[`statement_${id}`].texture);
                /*tileSprite.anchor.set(0, 0.5);
                tileSprite.position.x = -1;
                tileSprite.scale.x = 0.025;
                tileSprite.scale.y = 0.025;*/
                // tileSprite.position.x = -10;
                statements[id].sprite.addChild(tileSprite);
                this.app.stage.addChild(statements[id].sprite);
            }
        }

        this.bunny = new PIXI.Sprite(resources.bunny.texture);
        this.bunny.anchor.set(0.5);
        this.app.stage.addChild(this.bunny);

        this.rectangle = new PIXI.Graphics();
        this.rectangle.lineStyle(4, 0xFF3300, 1);
        this.rectangle.beginFill(0x66CCFF);
        this.rectangle.drawRect(0, 0, 800, 800);
        this.rectangle.endFill();
        this.rectangle.x = 0;
        this.rectangle.y = 0;
        this.app.stage.addChild(this.rectangle);

        for (let i = 0; i < 4; i++) {
            this.points.push(new PIXI.Graphics());
            this.points[i].lineStyle(4, 0xFF3300, 1);
            this.points[i].beginFill(0x66CCFF);
            this.points[i].drawCircle(0, 0, 10);
            this.points[i].endFill();
            this.app.stage.addChild(this.points[i]);
        }

        this.communication.start();
    }

    private onMarkerMessage(message: MarkerMessage) {
        this.app.stage.removeChildren();
        for (const data of message) {
            const { ids, marker, transform } = data;

            const [a, b, c, d] = [
                transform[0][0],
                transform[0][1],
                transform[1][0],
                transform[1][1],
            ];
            const transformMatrix = new PIXI.Matrix(
                a, c, b, d,
                transform[0][2],
                transform[1][2],
            );

            const id = ids[0];
            const statement = statements[id];

            if (statement) {
                this.store.dispatch(updateStatement({
                    id,
                    position: {
                        x: transform[0][2],
                        y: transform[1][2],
                    },
                    statement,
                }));

                if (statement.sprite) {
                    this.app.stage.addChild(statement.sprite);
                    // (statement.sprite.transform as PIXI.TransformStatic).setFromMatrix(transformMatrix);
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
                if (this.map) {
                    this.app.stage.addChild(this.map);
                }
                if (this.rectangle) {
                    this.app.stage.addChild(this.rectangle);
                    (this.rectangle.transform as PIXI.TransformStatic).setFromMatrix(transformMatrix);
                }
                if (this.bunny) {
                    this.app.stage.addChild(this.bunny);
                    (this.bunny.transform as PIXI.TransformStatic).setFromMatrix(transformMatrix);
                    // this.bunny.position.x = transform[0][2];
                    // this.bunny.position.y = transform[1][2];
                }
                /* bunny.proj.mapSprite(bunny, [
                        new PIXI.Point(marker[0][0][0], marker[0][0][1]),
                        new PIXI.Point(marker[1][0][0], marker[1][0][1]),
                        new PIXI.Point(marker[2][0][0], marker[2][0][1]),
                        new PIXI.Point(marker[3][0][0], marker[3][0][1]),
                    ]); */

                for (let i = 0; i < 4; i++) {
                    this.points[i].x = marker[i][0][0];
                    this.points[i].y = marker[i][0][1];
                    this.app.stage.addChild(this.points[i]);
                }
            }
        }
    }

    private onTick(delta: number) {
        // bunny.rotation += 0.1 * delta;

        if (this.map) {
            (this.map.layers[2] as TileLayer).tiles.forEach((tile) => {
                tile.y += this.currentActiveElementsWiggle * 0.1;
                /* if (tile.scale) {
                    tile.anchor.x = 0.5;
                    tile.scale.x = (this.currentActiveElementsWiggle + 10) / 20;
                } */
            });
        }

        this.currentActiveElementsWiggle += this.currentActiveElementsStep;
        if (this.currentActiveElementsWiggle >= 10 && this.currentActiveElementsStep > 0) {
            this.currentActiveElementsStep = -.3;
        } else if (this.currentActiveElementsWiggle <= -10 && this.currentActiveElementsStep < 0) {
            this.currentActiveElementsStep = .3;
        }
    }
}
