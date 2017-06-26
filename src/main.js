function main() {
    let previewDiv = document.getElementsByClassName('preview')[0];
    document.getElementById('layoutCheckbox').onclick = function() {
        if (this.checked) {
            previewDiv.classList.add('respect-layout');
        } else {
            previewDiv.classList.remove('respect-layout');
        }
    };

    var log = function(data) {
        document.getElementById('list').innerHTML += "<br/>" + data;
    };
    var zipDownload = true;
    var alternateDownloader = true;

    function fileName(path) {
        return path.substr(0, path.lastIndexOf('.')) || path
    }

    var button = document.getElementById("downloadButton");
    button.onclick = function(event) {
        if (zipDownload) {
            var zip = new JSZip();
        }

        var addImageToFolder = function(img, folder, name) {
            var data = img.src;

            if (zipDownload) {
                data = data.substr(data.indexOf(',') + 1);
                folder.file(name + ".png", data, {base64: true});
            } else {
                download(data, name + ".png");
            }
        };

        for (var s in spriteSheets) {
            if (zipDownload) {
                var folder = zip.folder(fileName(s));
            }
            var spriteSheet = spriteSheets[s];
            for (var name in spriteSheet) {
                var canvas = spriteSheet[name];
                var img = new Image();
                img.src = canvas.toDataURL("image/png");
                addImageToFolder(img, folder, name);
            }
        }

        function download(data, name) {
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
            log("Downloading... " + name);
        }

        if (zipDownload) {
            if (alternateDownloader) {
                var content = zip.generate({type: "blob"});
                saveAs(content, 'spritesheet.zip');
            } else {
                var content = "data:application/zip;base64," + zip.generate({type: "base64"});
                download(content, 'spritesheet.zip');
            }
        }
    };

    var jsons = [];
    var loadedImages = {};
    var spriteSheets = {};

    var readJSONS = function(jsons, callback) {
        var callbacks = jsons.length;
        var totalCallback = function(f) {
            log("done " + f.name);
            if (!--callbacks) {
                if (callback) {
                    callback();
                }
            }
        };
        jsons.forEach(function(json) {
            log("loading " + json.name);
            readJSON(json, totalCallback);
        })
    };
    var readJSON = function(f, callback) {
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(e) {
            var json = JSON.parse(e.target.result);
            jsons.push(json);

            new Promise((res, rej) => {
                const egretParser = function(json) {
                    const isEgret = function(json) {
                        if (!json.file) return false;
                        if (!json.frames) return false;
                        for (let name in json.frames) {
                            if (!json.frames.hasOwnProperty(name)) continue;
                            let frame = json.frames[name];
                            if (!(('x' in frame) && ('y' in frame) && ('w' in frame) && ('h' in frame)))
                                return false;
                        }
                        return true;
                    };
                    if (!isEgret(json)) return null;
                    let ret = {};
                    ret.filename = json.file;
                    ret.frames = {};
                    for (let framename in json.frames) {
                        if (!json.frames.hasOwnProperty(framename)) continue;
                        let frame = json.frames[framename];
                        ret.frames[framename] = {
                            x: frame.x,
                            y: frame.y,
                            w: frame.w,
                            h: frame.h,
                            offX: frame.offX,
                            offY: frame.offY,
                            sourceW: frame.sourceW,
                            sourceH: frame.sourceH
                        }
                    }
                    return ret;
                };
                const pixiParser = function(json) {
                    const isPixi = function(json) {
                        /*
                         "frame": {
                         "x": 159,
                         "y": 1,
                         "w": 54,
                         "h": 53
                         },
                         "rotated": false,
                         "trimmed": false,
                         "spriteSourceSize": {
                         "x": 0,
                         "y": 0,
                         "w": 54,
                         "h": 53
                         },
                         "sourceSize": {
                         "w": 54,
                         "h": 53
                         }
                         */
                        if (!json.frames) return false;
                        for (let name in json.frames) {
                            if (!json.frames.hasOwnProperty(name)) continue;
                            let frame = json.frames[name];
                            if (0
                                || !('frame' in frame)
                                || !('x' in frame.frame)
                                || !('y' in frame.frame)
                                || !('w' in frame.frame)
                                || !('h' in frame.frame)
                                || !('rotated' in frame)
                                || !('trimmed' in frame)
                                || !('spriteSourceSize' in frame)
                                || !('x' in frame.spriteSourceSize)
                                || !('y' in frame.spriteSourceSize)
                                || !('w' in frame.spriteSourceSize)
                                || !('h' in frame.spriteSourceSize)
                                || !('sourceSize' in frame)
                                || !('w' in frame.sourceSize)
                                || !('h' in frame.sourceSize)
                            )
                                return false;
                        }
                        return true;
                    };
                    if (!isPixi(json)) return null;
                    let ret = {};
                    ret.filename = json.meta.image;
                    ret.frames = {};
                    for (let framename in json.frames) {
                        if (!json.frames.hasOwnProperty(framename)) continue;
                        let frame = json.frames[framename];
                        ret.frames[framename] = {
                            x: frame.frame.x,
                            y: frame.frame.y,
                            w: frame.frame.w,
                            h: frame.frame.h,
                            offX: frame.spriteSourceSize.x,
                            offY: frame.spriteSourceSize.y,
                            sourceW: frame.sourceSize.w,
                            sourceH: frame.sourceSize.h
                        }
                    }
                    return ret;
                };
                const dbParser = function(json) {
                    const isDB = function(json) {
                        if (!('imagePath' in json) || !('name' in json) || !('SubTexture' in json)) return false;
                        return true;
                    };
                    if (!isDB(json)) return null;
                    let ret = {};
                    ret.filename = json.imagePath;
                    ret.frames = {};
                    json.SubTexture.forEach(frame => {
                        ret.frames[frame.name] = {
                            x: frame.x,
                            y: frame.y,
                            w: frame.width,
                            h: frame.height,
                            offX: 'frameX' in frame ? -frame.frameX : 0,
                            offY: 'frameY' in frame ? -frame.frameY : 0,
                            sourceW: 'frameWidth' in frame ? frame.frameWidth : frame.width,
                            sourceH: 'frameHeight' in frame ? frame.frameHeight : frame.height
                        }
                    });
                    return ret;
                };

                let parsers = [egretParser, pixiParser, dbParser];

                let data;
                for (let i = 0; i < parsers.length; ++i) {
                    if (data = parsers[i](json))
                        break;
                }

                if (!data) return rej('unknown file format: ' + f.name);

                let spriteSheet = spriteSheets[data.filename] = {};

                let file = loadedImages[data.filename];

                let img = new Image();
                img.src = file;
                img.addEventListener('load', () => {
                    var div = document.createElement('div');
                    div.classList.add('atlas');
                    div.style.width = img.width + 'px';
                    div.style.height = img.height + 'px';
                    previewDiv.appendChild(div);

                    for (var framename in data.frames) {
                        if (!data.frames.hasOwnProperty(framename)) continue;
                        let frame = data.frames[framename];
                        if (frame.rotate || frame.rotated) console.warn('rotated frames are not supported yet');
                        var canvas = document.createElement('canvas');
                        div.appendChild(canvas);

                        canvas.style.top = frame.y + 'px';
                        canvas.style.left = frame.x + 'px';
                        canvas.style.marginTop = -frame.offY + 'px';
                        canvas.style.marginLeft = -frame.offX + 'px';

                        var context = canvas.getContext('2d');
                        canvas.width = frame.sourceW;
                        canvas.height = frame.sourceH;

                        canvas.setAttribute('data-frame_name', framename);
                        context.drawImage(img, frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.w, frame.h);

                        spriteSheet[framename] = canvas;
                    }

                    res();
                });
            })
                .catch(console.warn)
                .then(() => {
                    if (callback) {
                        callback(f);
                    }
                })
        };

        // Read in the image file as a data URL.
        reader.readAsText(f);
    };
    var readImages = function(images, callback) {
        var callbacks = images.length;
        var totalCallback = function(f) {
            log("done " + f.name);
            if (!--callbacks) {
                if (callback) {
                    callback();
                }
            }
        };
        images.forEach(function(image) {
            log("loading " + image.name);
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
        document.getElementById('list').innerHTML = "";
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

    }

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

window.addEventListener("load", main);
