import { Signal } from 'micro-signals';

import TiledMap from '../tiledmap/TiledMap';
import tiledMapLoader from '../tiledmap/tiledMapLoader';
import { StatementList } from '../types';

export interface GameResources {
    map: TiledMap;
    resources: PIXI.loaders.ResourceDictionary;
    spriteSheet: PIXI.Spritesheet;
}

export class GameResourceManager {
    public onReady: Signal<GameResources>;

    private loader: PIXI.loaders.Loader;

    constructor(statements: StatementList) {
        this.onReady = new Signal<GameResources>();

        PIXI.loaders.Loader.addPixiMiddleware(tiledMapLoader);
        PIXI.loader.use(tiledMapLoader());
        this.loader = new PIXI.loaders.Loader();
        for (const id in statements) {
            if (statements.hasOwnProperty(id)) {
                this.loader.add(`statement_${id}`, statements[id].file);
            }
        }

        this.loader
            .add('bunny', 'bunny.png')
            .add('tileset_image', 'towerDefense.svg')
            .add('tileset', 'towerDefense.json')
            .add('map', 'assets/map_02.tmx');
    }

    public load() {
        this.loader.load(this.onResourcesLoaded.bind(this));
    }

    private onResourcesLoaded(_: PIXI.loaders.Loader, resources: PIXI.loaders.ResourceDictionary) {
        const map = new TiledMap(resources.map);
        const spritesheetTexture = resources.tileset_image.texture;
        const spriteSheet = new PIXI.Spritesheet(spritesheetTexture.baseTexture, resources.tileset.data);
        spriteSheet.parse(() => {
            this.onReady.dispatch({
                map,
                resources,
                spriteSheet,
            });
        });
    }
}
