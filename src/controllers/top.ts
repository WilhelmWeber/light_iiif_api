import express, { Router } from 'express';
import manifests from '../db/manifests';
import images from '../db/images';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

//multerの設定用（どのフォルダにどんなファイル名で保存するか）
const storage: multer.StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadpath: string = path.resolve(__dirname, '../../public/uploads');
    cb(null, uploadpath);
  },
  filename: (req, file, cb) => {
    const filename: string = file.originalname;
    cb(null, filename);
  }
});
const upload: multer.Multer = multer({storage});

//ルーターの宣言
let router: Router = express.Router();

//トップページはマニフェスト一覧（それぞれの画像サムネが表示されるリンクに飛ばされる）を表示
router.get('/', function(req: express.Request, res: express.Response) {
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);

  if (!isAuth) { 
    res.redirect('/signin') 
  } else {
  manifests.find({userId:userId})
    .then((value: any) => {
      res.render('./index.ejs', {
        manifests: value,
      });
    })
    .catch((err: Error) => {
      res.status(500).send(err.toString());
    });
  }
});

//マニフェスト作成（manifestsテーブルに内容を保存）
router.get('/createmanifest', function(req: express.Request, res: express.Response){
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);
  
  if (!isAuth) { 
    res.redirect('/signin') ;
  } else {
    res.render('./createManifest.ejs');
  }
});

router.post('/createmanifest', function(req: express.Request, res:express.Response){
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);
  
  if (!isAuth) { 
    res.redirect('/signin') 
  } else {
  let label: string = req.body.label;
  let license: string = req.body.license;
  let attribution: string = req.body.attribution;
  let viewingDirection: string = req.body.viewingDirection;
  let discription: string = req.body.discription;
  let viewingHint: string = req.body.viewingHint;
  let logo: string = req.body.logo;
  let seeAlso: string = req.body.seeAlso;
  let userId: string | undefined = req.session.userId;
  manifests.create({
    label: label,
    license: license,
    attribution: attribution,
    viewingDirection: viewingDirection,
    discription: discription,
    viewingHint: viewingHint,
    logo: logo,
    seeAlso: seeAlso,
    userId: userId,
  })
    .then(() => {
      res.status(200);
      res.redirect('/');
    })
    .catch((err: Error) => {
      res.status(500).send(err.toString());
      res.redirect('/');
    });
  }
});

router.get('/delete/:id', async (req: express.Request, res: express.Response) => {
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);
  const manifest_id: string = req.params.id;

  const imagesDestory: (value: any) => Promise<void> = async (value: any) => {
    fs.unlink(path.resolve(__dirname, '../../public/uploads', value.name), (err) => {
      if (err) throw err;
    });
    fs.unlink(path.resolve(__dirname, '../../public/tif_images', value.output_name), (err) => {
      if (err) throw err;
    })
  };

  if (!isAuth) {
    res.redirect('/signin')
  } else {
    let asyncs: Promise<any>[] = [];
    asyncs.push(manifests.findByIdAndDelete(manifest_id));
    images
      .find({manifest_id:manifest_id})
      .then((values: any) => {
        for (let value of values) {
          asyncs.push(imagesDestory(value));
        }
      });
    asyncs.push(images.deleteMany({manifest_id:manifest_id}));
    Promise
      .all(asyncs)
      .then(() => {
        res.redirect('/');
      })
      .catch((err: Error) => {
        res.status(500).send(err.toString());
        res.redirect('/');
      });
  }
});

router.get('/update/:id', (req: express.Request, res: express.Response) => {
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);

  if (!isAuth) {
    res.redirect('/signin')
  } else { 
    const manifest_id: string = req.params.id
    manifests
      .findById(manifest_id)
      .then((value: any) => {
        res.render('./updateManifest.ejs', {
          manifest: value,
        })
      })
      .catch((err: Error) => {
        res.status(500);
        res.redirect('/');
      })
  }
});

router.post('/update/:id', (req: express.Request, res: express.Response) => {
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);

  if (!isAuth) {
    res.redirect('/signin')
  } else { 
    const manifest_id: string = req.params.id;
    let label: string = req.body.label;
    let license: string = req.body.license;
    let attribution: string = req.body.attribution;
    let viewingDirection: string = req.body.viewingDirection;
    let discription: string = req.body.discription;
    let viewingHint: string = req.body.viewingHint;
    let logo: string = req.body.logo;
    let seeAlso: string = req.body.seeAlso;
    manifests
      .findByIdAndUpdate(manifest_id, {
        label: label,
        license: license,
        attribution: attribution,
        viewingDirection: viewingDirection,
        discription: discription,
        viewingHint: viewingHint,
        logo: logo,
        seeAlso: seeAlso,  
        userId: userId,
      })
      .then(() => {
        res.status(200);
        res.redirect('/');
      })
      .catch((err: Error) => {
        res.status(500).send(err.toString());
        res.redirect('/');
      });
  }
});

//マニフェスト個々のページ（マニフェストに登録されている画像のサムネ表示）
router.get('/content/:id', function(req: express.Request, res: express.Response){
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);
  const manifest_id: string = req.params.id;
  
  if (!isAuth) { 
    res.redirect('/signin') 
  } else {
    manifests
      .findById(manifest_id)
      .then((value: any) => {
        if (value.userId!==userId) {
          res.status(401);
          res.redirect('/');
        } else {
          images.find({manifest_id:manifest_id})
            .then((value: any) => res.render('./eachfolders.ejs', {manifest_id:manifest_id, results:value}))
            .catch(() => {
              res.status(500)
              res.redirect('/')
            });
        }
      })
      .catch(() => {
        res.status(500);
        res.redirect('/');
      })
  }
});

router.post('/content/:id', upload.single('filename'), function(req: express.Request<{id:string}>, res:express.Response){
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const userId: string | undefined = req.session.userId;
  const isAuth: boolean = Boolean(userId);
  
  if (!isAuth) { 
    res.redirect('/signin') 
  } else {
  let manifest_id: string = req.params.id;
  let name = req.file?.filename;
  let output_name: string = `${uuidv4()}.tif`
  if (typeof name==='string') {
    let filepath: string = path.resolve(__dirname, '../../public/uploads', name);
    let output: string = path.resolve(__dirname, '../../public/tif_images', output_name);
    sharp(filepath)
    .metadata((err, metadata) => {
      if (err) {console.error(err)}
      let height: number | undefined = metadata.height;
      let width: number | undefined  = metadata.width;
      let format: keyof sharp.FormatEnum | undefined = metadata.format;
      sharp(filepath)
        .tiff({compression:'lzw', tile:true, pyramid:true, tileWidth:256, tileHeight:256})
        .toFile(output)
        .then(function(){
          console.log('画像の変換に成功しました');
        })
        .catch(function(err:string){
          res.status(500).send(err.toString());
          res.redirect(`/content/${manifest_id}`);
        });
      images.create({
        name:name,
        manifest_id:manifest_id,
        format:format,
        width:width,
        height:height,
        output_name:output_name
      })
        .then(() => {
          console.log('画像の登録が完了しました');
          res.status(200);
          res.redirect(`/content/${manifest_id}`);
        })
        .catch((err: Error) => {
          res.status(500).send(err.toString());
          res.redirect(`/content/${manifest_id}`);   
        });
    });
  }
  }
});

router.get('/content/:manifest_id/deleteImage/:imageId', (req: express.Request, res: express.Response) => {
  const imageDelete: (imageId: string) => Promise<void> = async(imageId: string) => {
    images
      .findById(imageId)
      .then((value: any) => {
        fs.unlink(path.resolve(__dirname, '../../public/uploads', value.name), (err) => {
          if (err) throw err;
        });
        fs.unlink(path.resolve(__dirname, '../../public/tif_images', value.output_name), (err) => {
          if (err) throw err;
        });
      })
  };

  const imageId: string = req.params.imageId;
  const manifest_id: string = req.params.manifest_id;
  const asyncs: Promise<any>[] = [];

  asyncs.push(imageDelete(imageId));
  asyncs.push(images.findByIdAndDelete(imageId));

  Promise.all(asyncs)
    .then(() => res.redirect(`/content/${manifest_id}`))
    .catch((err: Error) => {
      res.status(500).send(err.toString());
      res.redirect(`/content/${manifest_id}`);
    });
});

router.get('/viewer/:id/', function(req: express.Request, res: express.Response){
  //res.set({ 'Access-Control-Allow-Origin': '*' });
  const base_uri = process.env.BASE_URI || "http://localhost:3000";
  const manifest_id: string = req.params.id
  const manifest_uri = `${base_uri}/api/presentation/2/${manifest_id}`
  res.render('./universalViewer.ejs', {manifest_uri:manifest_uri});
});

router.get('/logout', (req: express.Request, res: express.Response) => {
  req.session = null;
  res.redirect('/');
});

export default router;
