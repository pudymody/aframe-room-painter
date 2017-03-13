function ImageBitmapToCanvas( imgBitmap ){
    var $canvas = document.createElement('canvas');
        $canvas.width = imgBitmap.width;
        $canvas.height = imgBitmap.height;

    var $ctx = $canvas.getContext('2d');
        $ctx.drawImage( imgBitmap, 0, 0 );

        return $canvas;
}

function ImageDataToCanvas(data){
    var $internalCanvas = document.createElement('canvas');
        $internalCanvas.width = data.width;
        $internalCanvas.height = data.height;

    var $internalCtx = $internalCanvas.getContext('2d');
        $internalCtx.putImageData( data, 0, 0 );

    return $internalCanvas
}

function cloneCanvas(oldCanvas) {

    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    context.drawImage(oldCanvas, 0, 0);

    return newCanvas;
}

function makeScene( url ){
    var Scene = document.createElement('a-scene');
    var Sky = document.createElement('a-sky');
        Sky.setAttribute('src', url);
        Sky.setAttribute('rotation', '0 -130 0');

    Scene.appendChild(Sky);
    document.body.appendChild(Scene);
}

function destroyScene(){
    var Sky = document.querySelector('a-sky');
    var Scene = document.querySelector('a-scene');

    if( Scene ){
        URL.revokeObjectURL( Sky.getAttribute('src') );
        Scene.parentNode.removeChild(Scene)
    }
}

var colors = {};
var gui = new dat.gui.GUI();
    gui.remember(colors);
    gui.__save_row.addEventListener('click', function( evt ){
        if( evt.target.className === "button save" ){
            var newColors = Object.keys(colors).sort().map(function( key ){
                return colors[key];
            });

            worker.postMessage({
                action : 'UPDATE',
                data : newColors
            });
        }
    })

var worker = new Worker('worker.js');
worker.addEventListener('message', function( evt ){
    var data = evt.data;
    if( Handler.hasOwnProperty( data.action ) ){
        Handler[ data.action ].call(Handler, data.data);
    }
})

var Handler = {
    _canvas : [],
    UPDATE : function( updatedWalls ){
        var newCanvas = cloneCanvas(this._canvas);
        var $ctx = newCanvas.getContext('2d');
            $ctx.globalCompositeOperation = "multiply";

        
        updatedWalls
            .map( ImageDataToCanvas )
            .forEach(function( wall ){
                $ctx.drawImage(wall, 0, 0);
            });

        newCanvas.toBlob(function( blob ){
            var url = URL.createObjectURL(blob);
            makeScene(url);
        })
    }
};

var Load = ["img/img.jpg","img/01.png", "img/02.png", "img/03.png", "img/04.png"].map(function( item ){
    return fetch(item)
        .then( r => r.blob() )
        .then( createImageBitmap )
        .then( ImageBitmapToCanvas );
});

Promise.all(Load)
    .then(function( canvases ){
        Handler._canvas = canvases[0];

        var WallData = canvases.slice(1).map(function( wall ){
            return wall.getContext('2d').getImageData(0, 0, wall.width, wall.height);
        });

        var i = 0, l = WallData.length;
        for( ; i < l; i++){
            colors["color" + i] = { r : 0, g : 255, b : 0 };
            gui.addColor(colors, "color" + i);
        }

        worker.postMessage({
            action : 'SETUP',
            data : WallData
        });
    })
    .catch( console.error );

document.addEventListener('keyup', function(evt){
    if( evt.keyCode == 27 ){
        destroyScene();
    }
})