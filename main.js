const express=require('express');
const multer=require('multer');
const path=require('path');
const mongoose=require('mongoose');
const crypto=require('crypto');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');
const bodyparser=require('body-parser');

const app=express();

app.use(bodyparser.json());
app.use(methodOverride('_method'))
app.set('view engine','ejs')
app.use(express.static('./public'))

const url="mongodb://localhost:27017/multer";
const conn=mongoose.createConnection(url);

let gfs;
conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

const storage = new GridFsStorage({
    url: url,
    destination:'./public/uploads/',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
});

const upload=multer({
    storage:storage,
    limits:{fileSize:1000000}
})

app.get('/',(req,res)=>{
    res.render("home")
})

app.post('/upload',upload.single('file'),(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(files){
            res.render('gallery',{files:files})
        }
        else{
            res.send(files);
        }
    }) 
})

app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(file){
            const readstream=gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }
    })
})

app.listen(5000,()=>console.log("Server Running.."))