const bodyparser = require("body-parser");
const path       = require("path");
const fs         = require("fs");
const express    = require("express");
const sharp      = require("sharp");
const app        = express();

const settings = require("./settings");
const mysql    = require("mysql");
const db       = mysql.createConnection(settings.db);

app.param("image", (req, res, next, image) => {
    if (!image.match(/\.(png|jpg)$/i)) return res.status(req.method == "POST" ? 403 : 404).end();

    req.image     = image;
    req.localpath = path.join(__dirname, "uploads", req.image);

    return next();
});

app.param("width", (req, res, next, width) => {
    req.width = +width;

    return next();
});

app.param("height", (req, res, next, height) => {
    req.height = +height;

    return next();
});

app.param("image", (req, res, next, image) => {
    if (!image.match(/\.(png|jpg)$/i)) {
        return res.status(req.method == "POST" ? 403 : 404).end();
    }

    req.image     = image;
    req.localpath = path.join(__dirname, "uploads", req.image);

    return next();
});

app.param("greyscale", (req, res, next, greyscale) => {
    if (greyscale != "bw") return next("route");

    req.greyscale = true;

    return next();
});

app.post("/uploads/:image", bodyparser.raw({
    limit : "10mb",
    type  : "image/*"
}), (req, res) => {
    let fd  = fs.createWriteStream(req.localpath, {
        flags    : "w+",
        encoding : "binary"
    });

    fd.end(req.body);

    fd.on("close", () => {
        res.send({ status : "ok", size: req.body.length });
    });
});

app.head("/uploads/:image", (req, res) => {
    fs.access(req.localpath, fs.constants.R_OK , (err) => {
        res.status(err ? 404 : 200).end();
    });
});

app.get("/uploads/:width(\\d+)x:height(\\d+)-:greyscale-:image", download_image);
app.get("/uploads/:width(\\d+)x:height(\\d+)-:image", download_image);
app.get("/uploads/_x:height(\\d+)-:greyscale-:image", download_image);
app.get("/uploads/_x:height(\\d+)-:image", download_image);
app.get("/uploads/:width(\\d+)x_-:greyscale-:image", download_image);
app.get("/uploads/:width(\\d+)x_-:image", download_image);
app.get("/uploads/:greyscale-:image", download_image);
app.get("/uploads/:image", download_image);

app.get("/uploads/:image", (req, res) => {
    let fd = fs.createReadStream(req.localpath);

    fd.on("error", (e) => {
        res.status(e.code == "ENOENT" ? 404 : 500).end();
    });

    res.setHeader("Content-Type", "image/" + path.extname(req.image).substr(1));

    fd.pipe(res);
});

function download_image(req, res) {
    fs.access(req.localpath, fs.constants.R_OK , (err) => {
        if (err) return res.status(404).end();

        let image     = sharp(req.localpath);
        let width     = +req.query.width;
        let height    = +req.query.height;
        let greyscale = [ "y", "yes", "1", "on"].includes(req.query.greyscale);

        if (width > 0 && height > 0) {
            image.ignoreAspectRatio();
        }

        if (width > 0 || height > 0) {
            image.resize(width || null, height || null);
        }

        if (greyscale) {
            image.greyscale();
        }

        res.setHeader("Content-Type", "image/" + 
        path.extname(req.image).substr(1));

        image.pipe(res);
    });
}


app.get("/uploads/:image", (req, res) => {
    fs.access(req.localpath, fs.constants.R_OK , (err) => {
        if (err) return res.status(404).end();

        let image     = sharp(req.localpath);
        let width     = +req.query.width;
        let height    = +req.query.height;
        let blur      = +req.query.blur;
        let sharpen   = +req.query.sharpen;
        let greyscale = [ "y", "yes", "1", 

       "on"].includes(req.query.greyscale);
        let flip      = [ "y", "yes", "1", 
        "on"].includes(req.query.flip);
        let flop      = [ "y", "yes", "1", 
        "on"].includes(req.query.flop);

        if (width > 0 && height > 0) {
            image.ignoreAspectRatio();
        }

        if (width > 0 || height > 0) {
            image.resize(width || null, height || null);
        }

        if (flip)        image.flip();
        if (flop)        image.flop();
        if (blur > 0)    image.blur(blur);
        if (sharpen > 0) image.sharpen(sharpen);
        if (greyscale)   image.greyscale();

        res.setHeader("Content-Type", "image/" + 
        path.extname(req.image).substr(1));

        image.pipe(res);
    });
});

db.connect((err) => {
    if (err) throw err;

    console.log("db: ready");

    // ...
    // the rest of our service code
    // ...

    app.listen(3000, () => {
        console.log("app: ready");
    });
});

app.listen(3000, () => {
    console.log("ready");
});
