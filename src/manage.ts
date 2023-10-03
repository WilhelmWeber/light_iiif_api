import express from 'express';
import { getStream, ref } from 'firebase/storage';
import fs from 'fs';
import firebasestorage from './firebase/firebaseconfig';
import Top from './controllers/top';
import Signup from './controllers/signup'
import Signin from './controllers/signin'
import IIIFAPI from './controllers/iiifApi';
import images from './db/images';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import "dotenv/config";

declare module 'express-session' {
    interface SessionData {
        userId: string,
    }
}

const port: string | number = process.env.PORT || 3000;
const secret: string | undefined = process.env.SESSION_SECRET;
const app: express.Express = express();

app.use(
    cookieSession({
      name: "session",
      keys: [secret ? secret: ""],
      maxAge: 30 * 60 * 1000,
    })
);

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(cookieParser());
app.use(cors());

mongoose.connect(process.env.DB_PATH ? process.env.DB_PATH: "");
mongoose.Promise = global.Promise;


app.use('/', Top);
app.use('/api', IIIFAPI);
app.use('/signup', Signup);
app.use('/signin', Signin);

//firebase Storageからバックアップを取ってくる
app.listen(port, () => {

    const downloadFile = async (inputpath: string) => {
        const dirRef = ref(firebasestorage, inputpath);
        const output_path = path.resolve(__dirname, `../public/${inputpath}`);
        const readstream = await getStream(dirRef);
        const writestream = fs.createWriteStream(output_path);
        readstream.pipe(writestream);
    };

    const isFileIn: string[] = fs.readdirSync(path.resolve(__dirname, '../public/uploads'))
    if (isFileIn.length!==1) {
        console.log(`Server Established at ${port} Port`);
    } else {
        let asyncs: Promise<any>[] = [];
        images
          .find()
          .then((values) => {
            for (let value of values) {
                asyncs.push(downloadFile(`uploads/${value.name}`));
                asyncs.push(downloadFile(`tif_images/${value.output_name}`));
            }
            Promise
              .all(asyncs)
              .then(() => {
                console.log(`Server Established at ${port} Port`);
              })
              .catch((err: any) => console.log(err));
          })
          .catch((err: any) => console.log(err));
    }
});