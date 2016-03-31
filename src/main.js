function main() {
    function fileName(path) {
        return path.substr(0, path.lastIndexOf('.')) || path
    }
    var button = document.getElementById("downloadButton");
    button.onclick = function(event) {
        var zip = new JSZip();

        var addSpriteToFolder = function(sprite, folder, name) {
            var bounds = sprite.getBounds();
            sprite.cache(0, 0, bounds.width, bounds.height, 0);
            var data = sprite.getCacheDataURL();
            data = data.substr(data.indexOf(',') + 1);
            folder.file(name + ".png", data, {base64: true});
            sprite.uncache();
        };

        for (var s in spriteSheets) {
            var res = spriteSheets[s];
            var folder = zip.folder(s);
            for (var i = 0, len = res._animations.length; i < len; ++i) {
                var name = res._animations[i];

                var sprite = new createjs.Sprite(res, name);
                if (sprite._animation.frames.length > 1) {
                    var localFolder = folder.folder(name);
                    for (var f = 0; f < sprite._animation.frames.length; ++f) {
                        sprite._goto(name, f);
                        addSpriteToFolder(sprite, localFolder, f);
                    }
                }
                else {
                    addSpriteToFolder(sprite, folder, name);
                }
            }
        }

        var download = function(data, name) {
            var link = document.createElement("a");
            link.href = data;
            link.download = name;
            link.style.display = "none";
            var evt = new MouseEvent("click", {
                "view": window,
                "bubbles": true,
                "cancelable": true
            });

            document.body.appendChild(link);
            link.dispatchEvent(evt);
            document.body.removeChild(link);
            console.log("Downloading... " + name );
        };
        var content = "data:application/zip;base64," + zip.generate({type:"base64"});
        download(content, 'spritesheet.zip');
    };


    var extractSpriteSheets = function() {

    };

    var preloader = new createjs.LoadQueue();

    var jsons = [];
    var loadedImages = {};
    var spriteSheets = {};

    var readJSONS = function(jsons, callback) {
        var callbacks = jsons.length;
        var totalCallback = function(f) {
            console.log("done " + f.name);
            if (!--callbacks) {
                if (callback) {
                    callback();
                }
            }
        };
        jsons.forEach(function(json) {
            console.log("loading " + json.name);
            readJSON(json, totalCallback);
        })
    };
    var readJSON = function(f, callback) {
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(e) {
            var json = JSON.parse(e.target.result);
            jsons.push(json);
            if (json.images) {
                json.images = json.images.map(function(imageName, idx) {
                    for (var loadedImageName in loadedImages) {
                        if (imageName.indexOf(loadedImageName) != -1) {
                            return loadedImages[loadedImageName]
                        }
                    }
                    console.log("NOT FOUND " + imageName);
                    return imageName
                });
            }
            //replace all images with data
            var spriteSheet = new createjs.SpriteSheet(json);
            spriteSheets[fileName(f.name)] = spriteSheet;

            if (callback) {
                callback(f);
            }

        };

        // Read in the image file as a data URL.
        reader.readAsText(f);
    };
    var readImages = function(images, callback) {
        var callbacks = images.length;
        var totalCallback = function(f) {
            console.log("done " + f.name);
            if (!--callbacks) {
                if (callback) {
                    callback();
                }
            }
        };
        images.forEach(function(image) {
            console.log("loading " + image.name);
            readImage(image, totalCallback);
        })
    };
    var readImage = function(f, callback) {
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(e) {
            loadedImages[f.name] = e.target.result;
            if (callback) {
                callback(f);
            }
        };

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    };

    function handleFileSelect(evt) {
        jsons = [];
        loadedImages = {};
        spriteSheets = {};

        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        var output = [];
        var localJSONS = [];
        var localImages = [];
        for (var i = 0, f; f = files[i]; i++) {
            if (f.type === "image/png" || f.type === "image/jpeg") {
                localImages.push(f);
            }
            else if (f.type === "application/json") {
                localJSONS.push(f);
            }
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate.toLocaleDateString(), '</li>');
        }
        readImages(localImages, function() {
            readJSONS(localJSONS);
        });

        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    }
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

window.addEventListener("load", main);
