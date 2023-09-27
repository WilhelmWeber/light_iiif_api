import express, { Router } from 'express';
import fs from 'fs';
import path from 'path';
import images from '../db/images';
import manifests from '../db/manifests';
// tslint:disable-next-line:no-var-requires
const IIIF = require('iiif-processor');

let router: Router = express.Router();

//ImageAPIに入れるためのReadStream関数リテラル（baseUrlと画像idを引数にとる）
const streamResolver = (params: {id: string, baseUrl: string}) => {
    let imagepath: string = path.resolve(__dirname, '../../public/tif_images', params.id);
    if (!fs.existsSync(imagepath)) {
      throw new IIIF.Error('Not found', {
        statusCode: 404,
      });
    }
    return fs.createReadStream(imagepath);
};

//imageAPI関数（
//1.よくIIIFで見られる画像のリンクがリクエストされたら、画像を表示
//2.info.jsonがリクエストされたらjson形式で出力
//3.urlおわりがidになっているものがくれば、info.jsonをパラメーターに付け加えてリクエスト
const imageAPI = async (req: express.Request, res: express.Response) => {
    //res.set({ 'Access-Control-Allow-Origin': '*' });
    const base_uri: string = process.env.BASE_URI || "http://localhost:3000"
    if (req.params?.filename==null) {
      req.params.filename = 'info.json';
    }
    try {
      const url: string = `${base_uri}/api${req.path}`
        const processor = new IIIF.Processor(url, streamResolver,
          {
            iiifVersion: 2,
            pathPrefix: 'api/iiif/2/',
          });
        const result = await processor.execute();
        return res
        .set('Content-Type', result.contentType)
        .set('Link', [
          `<${result.canonicalLink}>;rel="canonical"`,
          `<${result.profileLink}>;rel="profile"`,
        ])
        .status(200)
        .send(result.body)
    } catch (err) {
      console.error(err);
      res.status(500);
    }
};

router.get('/presentation/2/:id/manifest.json', function(req: express.Request, res:express.Response){
    //res.set({ 'Access-Control-Allow-Origin': '*' });
    const base_uri: string = process.env.BASE_URI || "http://localhost:3000"
    const manifest_id: string = req.params.id;
    const base_presentation_uri: string = `${base_uri}/api/presentation/2`;
    const base_image_uri: string = `${base_uri}/api/iiif/2`;
    let canvases: {}[] = [];
    images
     .find({manifest_id:manifest_id})
     .then((results:any) => {
      for (let i=0; i<results.length; i++) {
        const canvas: {} = {
          "@id":`${base_presentation_uri}/${manifest_id}/manifest.json/canvas/${i+1}`, 
          "@type":"sc:Canvas",
          "label":`image ${i+1}`,
          "height":results[i].height,
          "width":results[i].width,
          "images":[{
            "@type":"oa:Annotation",
            "motivation":"sc:painting",
            "on":`${base_presentation_uri}/${manifest_id}/manifest.json/canvas/${i+1}`,
            "resource":{
              "@id":`${base_image_uri}/${results[i].output_name}/full/full/0/default.jpg`,
              "@type":"dctypes:Image",
              "format":`image/${results[i].format}`,
              "height":results[i].height,
              "width":results[i].width,
              "service":{
                "@context":"http://iiif.io/api/image/2/context.json",
                "@id":`${base_image_uri}/${results[i].output_name}`,
                "profile":"http://iiif.io/api/image/2/level2.json",     
              },
            },
          }],
        };
        canvases.push(canvas);
      }
     })
     .catch((err:string) => {
      res.status(500).send(err.toString());
      res.redirect('/');
     });
    manifests
      .findById(manifest_id)
      .then((results:any) => {
        const sequences: {} = {
          "@type":"sc:Sequence",
          "viewingHint":results.viewingHint,
          "viewingDirection":results.viewingDirection,
          "canvases":canvases,
        };
        const manifest: {} = {
          "@context":"http://iiif.io/api/presentation/2/context.json",
          "@id":`${base_presentation_uri}/${manifest_id}/manifest.json`,
          "@type":"sc:Manifest",
          "label":results.label,
          "license":results.license,
          "description":results.discription,
          "attribution":results.attribution,
          "logo":results.logo,
          "seeAlso":results.seeAlso,
          "sequences":[sequences],
        };
        res.json(manifest);
      })
      .catch((err:string) => {
        res.status(500).send(err.toString());
        res.redirect(`/content/${manifest_id}`);
      });
});

router.get('/iiif/2/:id/:region/:size/:rotation/:filename', imageAPI);
router.get('/iiif/2/:id/info.json', imageAPI);
router.get('/iiif/2/:id', (req: express.Request, res: express.Response) => {
  res.redirect(`${req.path}/info.json`);
});

export default router;
