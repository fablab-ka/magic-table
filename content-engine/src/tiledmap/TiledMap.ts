import ImageLayer from './ImageLayer';
import TileLayer from './TileLayer';
import TileSet from './TileSet';

type Layer = TileLayer | ImageLayer;

export default class TiledMap extends PIXI.Container {
    public resource: PIXI.loaders.Resource;
    public tileSets: TileSet[];
    public layers: Layer[];
    public background: PIXI.Graphics;
    public tileWidth: number;
    public tileHeight: number;

    constructor(resource: PIXI.loaders.Resource) {
        super();

        this.resource = resource;
        this.tileSets = [];
        this.layers = [];
        this.background = new PIXI.Graphics();
        this.tileWidth = 128;
        this.tileHeight = 128;

        this.create();
    }

    public create() {
        const data = this.resource.data;

        Object.assign(this, data);

        this.background.beginFill(0x000000, 0);
        this.background.drawRect(0, 0, this.width * this.tileWidth, this.height * this.tileHeight);
        this.background.endFill();
        this.addChild(this.background);

        data.tileSets.forEach((tilesetData: any) => {
            this.tileSets.push(new TileSet(tilesetData));
        }, this);

        data.layers.forEach((layerData: any) => {
            switch (layerData.type) {
                case 'tile': {
                    const tileLayer = new TileLayer(layerData, this.tileSets);
                    this.layers[layerData.name] = tileLayer;
                    this.addChild(tileLayer);
                    break;
                }
                case 'image': {
                    const imageLayer = new ImageLayer(layerData);
                    this.layers[layerData.name] = imageLayer;
                    this.addChild(imageLayer);
                    break;
                }
                default: {
                    this.layers[layerData.name] = layerData;
                }
            }
        });
    }
}
