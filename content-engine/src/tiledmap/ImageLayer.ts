import * as PIXI from 'pixi.js';

export default class ImageLayer extends PIXI.Container {
    constructor(layer: any) {
        super();

        Object.assign(this, layer);

        this.alpha = parseFloat(layer.opacity);

        if (layer.image && layer.image.source) {
            const ct = PIXI.Sprite.fromImage as any;
            this.addChild(new ct('assets/' + layer.image.source));
        }
    }
}
