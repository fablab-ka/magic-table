import * as tmx from 'tmx-parser';

export default () => {
    return function(this: any, resource: any, next: any) {
        if (!resource.data ||
            resource.type !== PIXI.loaders.Resource.TYPE.XML ||
            !resource.data.children[0].getElementsByTagName('tileset')) {
            return next();
        }

        const route = resource.url.replace(this.baseUrl, '');

        const loadOptions = {
            crossOrigin: resource.crossOrigin,
            loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
            parentResource: resource,
        };

        tmx.parse(resource.xhr.responseText, route, (err: Error, map: any) => {
            if (err) { throw err; }

            map.tileSets.forEach((tileset: any) => {
                if (!(tileset.image.source in this.resources)) {
                    this.add(tileset.image.source, `assets/${tileset.image.source}`, loadOptions);
                }
            });

            resource.data = map;
            next();
        });
    };
};
