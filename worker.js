var Handler = {
    _DATA : [],

    SETUP : function( data ){
        this._DATA = data;
    },

    UPDATE : function( colors ){
        console.log("[WORKER] Start new update");
        var returnData = this._DATA.map(function( item, index ){

            console.log("[WORKER][WALL"+index+"] Start painting");
            var newColor = colors[index],
                newData = new Uint8ClampedArray( item.data.length ),
                i = 0, l = item.data.length;

            for( ; i < l; i += 4 ){
                var r = item.data[i];
                var g = item.data[i+1];
                var b = item.data[i+2];
                var a = item.data[i+3];
                if( r === 0 && g === 255 && b === 0 ){
                    newData[i] = newColor.r;
                    newData[i+1] = newColor.g;
                    newData[i+2] = newColor.b;
                    newData[i+3] = a;
                }else{
                    newData[i] = r;
                    newData[i+1] = g;
                    newData[i+2] = b;
                    newData[i+3] = a;
                }
            }
            console.log("[WORKER][WALL"+index+"] Finish painting");
            return new ImageData(newData, item.width, item.height);
        });

        console.log("[WORKER] Post back data");
        self.postMessage({
            action : 'UPDATE',
            data : returnData
        })
    }
};

self.addEventListener('message', function( evt ){
    var data = evt.data;
    if( Handler.hasOwnProperty( data.action ) ){
        Handler[ data.action ].call(Handler, data.data);
    }
})